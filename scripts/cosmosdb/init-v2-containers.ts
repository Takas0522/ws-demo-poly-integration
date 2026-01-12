/**
 * CosmosDB V2 Containers Initialization Script
 *
 * This script creates the V2 containers (TenantUsers and Services) separately
 * to avoid overloading the CosmosDB Emulator.
 *
 * Usage:
 *   ts-node scripts/cosmosdb/init-v2-containers.ts
 *
 * Environment Variables Required:
 *   COSMOSDB_ENDPOINT - CosmosDB endpoint URL
 *   COSMOSDB_KEY - CosmosDB master key
 *   COSMOSDB_DATABASE - Database name
 */

import {
  CosmosClient,
  IndexingPolicy,
  ContainerDefinition,
} from "@azure/cosmos";
import https from "https";

// Configuration from environment variables
const config = {
  endpoint: process.env.COSMOSDB_ENDPOINT || "https://localhost:8081",
  key: process.env.COSMOSDB_KEY || "",
  databaseId: process.env.COSMOSDB_DATABASE || "saas-management-dev",
};

// Validate configuration
if (!config.key) {
  console.error("❌ Error: COSMOSDB_KEY environment variable is required");
  process.exit(1);
}

// Initialize Cosmos Client with custom agent for local emulator
const client = new CosmosClient({
  endpoint: config.endpoint,
  key: config.key,
  agent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

/**
 * Sleep utility function
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * V2: Indexing policy for TenantUsers container
 */
const tenantUsersIndexingPolicy: IndexingPolicy = {
  indexingMode: "consistent",
  automatic: true,
  includedPaths: [{ path: "/*" }],
  excludedPaths: [{ path: "/_etag/?" }],
  compositeIndexes: [
    [
      { path: "/userId", order: "ascending" },
      { path: "/status", order: "ascending" },
    ],
    [
      { path: "/tenantId", order: "ascending" },
      { path: "/status", order: "ascending" },
    ],
  ],
};

/**
 * V2: Indexing policy for Services container
 */
const servicesIndexingPolicy: IndexingPolicy = {
  indexingMode: "consistent",
  automatic: true,
  includedPaths: [{ path: "/*" }],
  excludedPaths: [
    { path: "/features/*" },
    { path: "/pricing/*" },
    { path: "/metadata/*" },
    { path: "/_etag/?" },
  ],
};

/**
 * Container definitions
 */
interface ContainerConfig {
  definition: ContainerDefinition;
  throughput: number;
}

const v2Containers: ContainerConfig[] = [
  {
    definition: {
      id: "TenantUsers",
      partitionKey: { paths: ["/userId"] },
      indexingPolicy: tenantUsersIndexingPolicy,
    },
    throughput: 400,
  },
  {
    definition: {
      id: "Services",
      partitionKey: { paths: ["/tenantId"] },
      indexingPolicy: servicesIndexingPolicy,
    },
    throughput: 400,
  },
];

/**
 * Create container with retry logic
 */
async function createContainerWithRetry(
  database: any,
  containerDef: ContainerDefinition,
  throughput: number,
  maxRetries: number = 10
): Promise<void> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await database.containers.createIfNotExists(containerDef, {
        offerThroughput: throughput,
      });
      return; // Success
    } catch (error: any) {
      lastError = error;

      // Check if it's a 503 (Service Unavailable) or throttling error
      if (error?.code === 503 || error?.code === 429) {
        const waitTime = Math.min(2000 * Math.pow(1.5, attempt - 1), 30000);
        console.log(
          `  ⚠️  Attempt ${attempt}/${maxRetries} failed (${
            error.code
          }). Retrying in ${Math.round(waitTime)}ms...`
        );
        await sleep(waitTime);
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  // If we get here, all retries failed
  throw lastError;
}

/**
 * Main function
 */
async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  CosmosDB V2 Containers Initialization");
  console.log("  Creating TenantUsers and Services containers");
  console.log("═══════════════════════════════════════════════════════");
  console.log("");

  try {
    console.log(`📍 Endpoint: ${config.endpoint}`);
    console.log(`📁 Database: ${config.databaseId}`);
    console.log("");

    // Get database reference
    const database = client.database(config.databaseId);

    let successCount = 0;
    let failureCount = 0;

    for (const containerConfig of v2Containers) {
      const containerDef = containerConfig.definition;
      console.log(`Creating container: ${containerDef.id}...`);
      console.log(`  - Partition Key: ${containerDef.partitionKey?.paths[0]}`);
      console.log(`  - Throughput: ${containerConfig.throughput} RU/s`);

      try {
        await createContainerWithRetry(
          database,
          containerDef,
          containerConfig.throughput
        );
        console.log(`✅ Container "${containerDef.id}" ready`);
        successCount++;
      } catch (error: any) {
        console.error(
          `❌ Failed to create container "${containerDef.id}": ${error.message}`
        );
        failureCount++;
      }
      console.log("");

      // Add a delay between container creations
      await sleep(3000);
    }

    console.log("🎉 V2 Containers initialization completed!");
    console.log("");
    console.log("📊 Summary:");
    console.log(
      `  - Containers Created: ${successCount}/${v2Containers.length}`
    );
    if (failureCount > 0) {
      console.log(`  - Failed: ${failureCount}`);
      console.log("");
      console.log("⚠️  Some containers failed. Try:");
      console.log(
        "  1. Restart CosmosDB Emulator: docker-compose restart cosmosdb"
      );
      console.log("  2. Run this script again");
      process.exit(1);
    } else {
      console.log("");
      console.log("✅ All V2 containers created successfully!");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    process.exit(1);
  }
}

// Run
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { main };
