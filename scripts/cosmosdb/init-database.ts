/**
 * CosmosDB Database Initialization Script
 *
 * This script creates the database and containers with proper partitioning,
 * indexing policies, and TTL settings for the SaaS Management Application.
 *
 * Usage:
 *   npm install @azure/cosmos
 *   ts-node scripts/cosmosdb/init-database.ts
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

// Configuration from environment variables
// Note: Default values are for local CosmosDB Emulator only
const config = {
  endpoint: process.env.COSMOSDB_ENDPOINT || "https://localhost:8081",
  key: process.env.COSMOSDB_KEY || "",
  databaseId: process.env.COSMOSDB_DATABASE || "saas-management-dev",
};

// Validate configuration
if (!config.key) {
  console.error("❌ Error: COSMOSDB_KEY environment variable is required");
  console.error("");
  console.error("For CosmosDB Emulator, use:");
  console.error(
    '  export COSMOSDB_KEY="C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="'
  );
  process.exit(1);
}

// Initialize Cosmos Client
const client = new CosmosClient({
  endpoint: config.endpoint,
  key: config.key,
});

/**
 * Indexing policy for Tenants container
 */
const tenantsIndexingPolicy: IndexingPolicy = {
  indexingMode: "consistent",
  automatic: true,
  includedPaths: [{ path: "/*" }],
  excludedPaths: [{ path: "/settings/*" }, { path: "/_etag/?" }],
};

/**
 * Indexing policy for Users container
 */
const usersIndexingPolicy: IndexingPolicy = {
  indexingMode: "consistent",
  automatic: true,
  includedPaths: [{ path: "/*" }],
  excludedPaths: [
    { path: "/passwordHash/?" },
    { path: "/profile/*" },
    { path: "/security/twoFactorSecret/?" },
    { path: "/_etag/?" },
  ],
  compositeIndexes: [
    [
      { path: "/tenantId", order: "ascending" },
      { path: "/email", order: "ascending" },
    ],
    [
      { path: "/tenantId", order: "ascending" },
      { path: "/status", order: "ascending" },
    ],
  ],
};

/**
 * Indexing policy for Permissions container
 */
const permissionsIndexingPolicy: IndexingPolicy = {
  indexingMode: "consistent",
  automatic: true,
  includedPaths: [{ path: "/*" }],
  excludedPaths: [{ path: "/metadata/*" }, { path: "/_etag/?" }],
};

/**
 * Indexing policy for AuditLogs container
 */
const auditLogsIndexingPolicy: IndexingPolicy = {
  indexingMode: "consistent",
  automatic: true,
  includedPaths: [{ path: "/*" }],
  excludedPaths: [
    { path: "/details/*" },
    { path: "/metadata/*" },
    { path: "/_etag/?" },
  ],
  compositeIndexes: [
    [
      { path: "/tenantId", order: "ascending" },
      { path: "/timestamp", order: "descending" },
    ],
    [
      { path: "/tenantId", order: "ascending" },
      { path: "/userId", order: "ascending" },
      { path: "/timestamp", order: "descending" },
    ],
  ],
};

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
 * Container definitions with throughput
 */
interface ContainerConfig {
  definition: ContainerDefinition;
  throughput: number;
}

const containers: ContainerConfig[] = [
  {
    definition: {
      id: "Tenants",
      partitionKey: { paths: ["/tenantId"] },
      indexingPolicy: tenantsIndexingPolicy,
    },
    throughput: 400,
  },
  {
    definition: {
      id: "Users",
      partitionKey: { paths: ["/tenantId"] },
      indexingPolicy: usersIndexingPolicy,
    },
    throughput: 400,
  },
  {
    definition: {
      id: "Permissions",
      partitionKey: { paths: ["/tenantId"] },
      indexingPolicy: permissionsIndexingPolicy,
    },
    throughput: 400,
  },
  {
    definition: {
      id: "AuditLogs",
      partitionKey: { paths: ["/tenantId"] },
      indexingPolicy: auditLogsIndexingPolicy,
      defaultTtl: 7776000, // 90 days in seconds
    },
    throughput: 400,
  },
  // V2: New containers
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
 * Sleep utility function
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
        const waitTime = Math.min(2000 * Math.pow(1.5, attempt - 1), 30000); // Exponential backoff, max 30s
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
 * Main initialization function
 */
async function initializeDatabase(): Promise<void> {
  console.log("🚀 Starting CosmosDB initialization...");
  console.log(`📍 Endpoint: ${config.endpoint}`);
  console.log(`📁 Database: ${config.databaseId}`);
  console.log("");

  try {
    // Create database if it doesn't exist
    console.log(`Creating database: ${config.databaseId}...`);
    const { database } = await client.databases.createIfNotExists({
      id: config.databaseId,
    });
    console.log(`✅ Database "${config.databaseId}" ready`);
    console.log("");

    // Create containers one by one with delay to avoid overloading emulator
    let successCount = 0;
    let failureCount = 0;

    for (const containerConfig of containers) {
      const containerDef = containerConfig.definition;
      console.log(`Creating container: ${containerDef.id}...`);
      console.log(`  - Partition Key: ${containerDef.partitionKey?.paths[0]}`);
      console.log(`  - Throughput: ${containerConfig.throughput} RU/s`);

      if (containerDef.defaultTtl) {
        console.log(
          `  - TTL: ${containerDef.defaultTtl} seconds (${
            containerDef.defaultTtl / 86400
          } days)`
        );
      }

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

      // Add a delay between container creations to avoid overwhelming the emulator
      // Longer delay for the emulator to recover
      await sleep(2000);
    }

    console.log("🎉 Database initialization completed!");
    console.log("");
    console.log("📊 Summary:");
    console.log(`  - Database: ${config.databaseId}`);
    console.log(`  - Containers Created: ${successCount}/${containers.length}`);
    if (failureCount > 0) {
      console.log(`  - Failed: ${failureCount}`);
    }
    containers.forEach((c) => {
      console.log(
        `    • ${c.definition.id} (partition: ${c.definition.partitionKey?.paths[0]})`
      );
    });
    console.log("");

    if (failureCount > 0) {
      console.log("⚠️  Some containers failed to create. You can:");
      console.log("  1. Run this script again to retry");
      console.log(
        "  2. Manually create the missing containers in Azure Portal"
      );
      console.log("  3. Restart CosmosDB Emulator and try again");
      console.log("");

      // Exit with error code if more than half failed
      if (failureCount > containers.length / 2) {
        console.error(
          "❌ Too many containers failed to create. Exiting with error."
        );
        process.exit(1);
      } else {
        console.log("✅ Core containers created successfully. Continuing...");
      }
    } else {
      console.log("💡 Next steps:");
      console.log("  1. Run seed-data.ts to populate initial data");
      console.log("  2. Configure services to use the database");
      console.log("  3. Test connection and queries");
    }
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

/**
 * Verify connection before initialization
 */
async function verifyConnection(): Promise<boolean> {
  try {
    console.log("🔍 Verifying connection to CosmosDB...");
    await client.getDatabaseAccount();
    console.log("✅ Connection verified");
    console.log("");
    return true;
  } catch (error) {
    console.error("❌ Connection failed:", error);
    console.error("");
    console.error("Please check:");
    console.error("  - COSMOSDB_ENDPOINT is correct");
    console.error("  - COSMOSDB_KEY is valid");
    console.error("  - CosmosDB service is running (for emulator)");
    console.error("  - Network connectivity");
    return false;
  }
}

/**
 * Entry point
 */
async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  CosmosDB Database Initialization");
  console.log("  SaaS Management Application");
  console.log("═══════════════════════════════════════════════════════");
  console.log("");

  // Verify connection first
  const isConnected = await verifyConnection();
  if (!isConnected) {
    process.exit(1);
  }

  // Initialize database
  await initializeDatabase();
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { initializeDatabase, verifyConnection };
