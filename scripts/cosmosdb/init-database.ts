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

import { CosmosClient, IndexingPolicy, ContainerDefinition } from '@azure/cosmos';

// Configuration from environment variables
// Note: Default values are for local CosmosDB Emulator only
const config = {
  endpoint: process.env.COSMOSDB_ENDPOINT || 'https://localhost:8081',
  key: process.env.COSMOSDB_KEY || '',
  databaseId: process.env.COSMOSDB_DATABASE || 'saas-management-dev',
};

// Validate configuration
if (!config.key) {
  console.error('❌ Error: COSMOSDB_KEY environment variable is required');
  console.error('');
  console.error('For CosmosDB Emulator, use:');
  console.error('  export COSMOSDB_KEY="C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="');
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
  indexingMode: 'consistent',
  automatic: true,
  includedPaths: [
    { path: '/tenantId/?' },
    { path: '/status/?' },
    { path: '/subscription/plan/?' },
    { path: '/createdAt/?' },
  ],
  excludedPaths: [
    { path: '/settings/*' },
    { path: '/_etag/?' },
  ],
};

/**
 * Indexing policy for Users container
 */
const usersIndexingPolicy: IndexingPolicy = {
  indexingMode: 'consistent',
  automatic: true,
  includedPaths: [
    { path: '/tenantId/?' },
    { path: '/email/?' },
    { path: '/username/?' },
    { path: '/status/?' },
    { path: '/roles/*' },
    { path: '/permissions/*' },
    { path: '/createdAt/?' },
    { path: '/updatedAt/?' },
  ],
  excludedPaths: [
    { path: '/passwordHash/?' },
    { path: '/profile/*' },
    { path: '/security/twoFactorSecret/?' },
    { path: '/_etag/?' },
  ],
  compositeIndexes: [
    [
      { path: '/tenantId', order: 'ascending' },
      { path: '/email', order: 'ascending' },
    ],
    [
      { path: '/tenantId', order: 'ascending' },
      { path: '/status', order: 'ascending' },
    ],
  ],
};

/**
 * Indexing policy for Permissions container
 */
const permissionsIndexingPolicy: IndexingPolicy = {
  indexingMode: 'consistent',
  automatic: true,
  includedPaths: [
    { path: '/tenantId/?' },
    { path: '/name/?' },
    { path: '/category/?' },
    { path: '/resource/?' },
    { path: '/action/?' },
    { path: '/isActive/?' },
  ],
  excludedPaths: [
    { path: '/metadata/*' },
    { path: '/_etag/?' },
  ],
};

/**
 * Indexing policy for AuditLogs container
 */
const auditLogsIndexingPolicy: IndexingPolicy = {
  indexingMode: 'consistent',
  automatic: true,
  includedPaths: [
    { path: '/tenantId/?' },
    { path: '/timestamp/?' },
    { path: '/userId/?' },
    { path: '/action/?' },
    { path: '/resource/type/?' },
    { path: '/status/?' },
  ],
  excludedPaths: [
    { path: '/details/*' },
    { path: '/metadata/*' },
    { path: '/_etag/?' },
  ],
  compositeIndexes: [
    [
      { path: '/tenantId', order: 'ascending' },
      { path: '/timestamp', order: 'descending' },
    ],
    [
      { path: '/tenantId', order: 'ascending' },
      { path: '/userId', order: 'ascending' },
      { path: '/timestamp', order: 'descending' },
    ],
  ],
};

/**
 * Container definitions
 */
const containers: ContainerDefinition[] = [
  {
    id: 'Tenants',
    partitionKey: { paths: ['/tenantId'], kind: 'Hash' },
    indexingPolicy: tenantsIndexingPolicy,
    throughput: 400,
  },
  {
    id: 'Users',
    partitionKey: { paths: ['/tenantId'], kind: 'Hash' },
    indexingPolicy: usersIndexingPolicy,
    throughput: 400,
  },
  {
    id: 'Permissions',
    partitionKey: { paths: ['/tenantId'], kind: 'Hash' },
    indexingPolicy: permissionsIndexingPolicy,
    throughput: 400,
  },
  {
    id: 'AuditLogs',
    partitionKey: { paths: ['/tenantId'], kind: 'Hash' },
    indexingPolicy: auditLogsIndexingPolicy,
    defaultTtl: 7776000, // 90 days in seconds
    throughput: 400,
  },
];

/**
 * Main initialization function
 */
async function initializeDatabase(): Promise<void> {
  console.log('🚀 Starting CosmosDB initialization...');
  console.log(`📍 Endpoint: ${config.endpoint}`);
  console.log(`📁 Database: ${config.databaseId}`);
  console.log('');

  try {
    // Create database if it doesn't exist
    console.log(`Creating database: ${config.databaseId}...`);
    const { database } = await client.databases.createIfNotExists({
      id: config.databaseId,
    });
    console.log(`✅ Database "${config.databaseId}" ready`);
    console.log('');

    // Create containers
    for (const containerDef of containers) {
      console.log(`Creating container: ${containerDef.id}...`);
      console.log(`  - Partition Key: ${containerDef.partitionKey.paths[0]}`);
      console.log(`  - Throughput: ${containerDef.throughput} RU/s`);
      
      if (containerDef.defaultTtl) {
        console.log(`  - TTL: ${containerDef.defaultTtl} seconds (${containerDef.defaultTtl / 86400} days)`);
      }

      const { container } = await database.containers.createIfNotExists(containerDef);
      console.log(`✅ Container "${containerDef.id}" ready`);
      console.log('');
    }

    console.log('🎉 Database initialization completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`  - Database: ${config.databaseId}`);
    console.log(`  - Containers: ${containers.length}`);
    containers.forEach(c => {
      console.log(`    • ${c.id} (partition: ${c.partitionKey.paths[0]})`);
    });
    console.log('');
    console.log('💡 Next steps:');
    console.log('  1. Run seed-data.ts to populate initial data');
    console.log('  2. Configure services to use the database');
    console.log('  3. Test connection and queries');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

/**
 * Verify connection before initialization
 */
async function verifyConnection(): Promise<boolean> {
  try {
    console.log('🔍 Verifying connection to CosmosDB...');
    await client.getDatabaseAccount();
    console.log('✅ Connection verified');
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error);
    console.error('');
    console.error('Please check:');
    console.error('  - COSMOSDB_ENDPOINT is correct');
    console.error('  - COSMOSDB_KEY is valid');
    console.error('  - CosmosDB service is running (for emulator)');
    console.error('  - Network connectivity');
    return false;
  }
}

/**
 * Entry point
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  CosmosDB Database Initialization');
  console.log('  SaaS Management Application');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

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
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { initializeDatabase, verifyConnection };
