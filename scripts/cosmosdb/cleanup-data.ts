/**
 * CosmosDB Data Cleanup Utilities
 * 
 * This script provides utilities to clean up test data from the database.
 * Use with caution as these operations are destructive!
 * 
 * Usage:
 *   ts-node scripts/cosmosdb/cleanup-data.ts [options]
 * 
 * Options:
 *   --all              Delete all data from all containers
 *   --tenant <id>      Delete all data for specific tenant
 *   --container <name> Delete all data from specific container
 *   --confirm          Skip confirmation prompt (use with caution!)
 * 
 * Environment Variables Required:
 *   COSMOSDB_ENDPOINT - CosmosDB endpoint URL
 *   COSMOSDB_KEY - CosmosDB master key
 *   COSMOSDB_DATABASE - Database name
 */

import { CosmosClient, Container } from '@azure/cosmos';
import * as readline from 'readline';

// Configuration from environment variables
const config = {
  endpoint: process.env.COSMOSDB_ENDPOINT || 'https://localhost:8081',
  key: process.env.COSMOSDB_KEY || '',
  databaseId: process.env.COSMOSDB_DATABASE || 'saas-management-dev',
};

// Validate configuration
if (!config.key) {
  console.error('❌ Error: COSMOSDB_KEY environment variable is required');
  process.exit(1);
}

// Initialize Cosmos Client
const client = new CosmosClient({
  endpoint: config.endpoint,
  key: config.key,
});

const database = client.database(config.databaseId);

/**
 * Container names
 */
const CONTAINERS = ['Tenants', 'Users', 'Permissions', 'AuditLogs'];

/**
 * Ask for user confirmation
 */
async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Delete all documents from a container
 */
async function cleanupContainer(containerName: string): Promise<number> {
  console.log(`🧹 Cleaning up container: ${containerName}...`);
  const container = database.container(containerName);

  try {
    // Query all documents
    const querySpec = {
      query: 'SELECT c.id, c.tenantId FROM c',
    };

    const { resources: items } = await container.items.query(querySpec).fetchAll();
    
    if (items.length === 0) {
      console.log(`  ℹ️  Container ${containerName} is already empty`);
      return 0;
    }

    console.log(`  Found ${items.length} document(s) to delete`);

    // Delete each document
    let deletedCount = 0;
    for (const item of items) {
      try {
        await container.item(item.id, item.tenantId).delete();
        deletedCount++;
      } catch (error) {
        console.error(`  ⚠️  Failed to delete document ${item.id}:`, error);
      }
    }

    console.log(`  ✅ Deleted ${deletedCount} document(s) from ${containerName}`);
    return deletedCount;
  } catch (error) {
    console.error(`  ❌ Error cleaning up container ${containerName}:`, error);
    return 0;
  }
}

/**
 * Delete all documents for a specific tenant
 */
async function cleanupTenant(tenantId: string): Promise<void> {
  console.log(`🧹 Cleaning up all data for tenant: ${tenantId}...`);
  console.log('');

  let totalDeleted = 0;

  for (const containerName of CONTAINERS) {
    const container = database.container(containerName);

    try {
      // Query documents for this tenant
      const querySpec = {
        query: 'SELECT c.id, c.tenantId FROM c WHERE c.tenantId = @tenantId',
        parameters: [{ name: '@tenantId', value: tenantId }],
      };

      const { resources: items } = await container.items.query(querySpec).fetchAll();

      if (items.length === 0) {
        console.log(`  ℹ️  No documents found in ${containerName}`);
        continue;
      }

      console.log(`  Deleting ${items.length} document(s) from ${containerName}...`);

      // Delete each document
      for (const item of items) {
        await container.item(item.id, item.tenantId).delete();
        totalDeleted++;
      }

      console.log(`  ✅ Deleted ${items.length} document(s) from ${containerName}`);
    } catch (error) {
      console.error(`  ❌ Error cleaning up ${containerName}:`, error);
    }
  }

  console.log('');
  console.log(`✅ Cleanup complete! Total deleted: ${totalDeleted} document(s)`);
}

/**
 * Delete all documents from all containers
 */
async function cleanupAll(): Promise<void> {
  console.log('🧹 Cleaning up ALL data from database...');
  console.log('');

  let totalDeleted = 0;

  for (const containerName of CONTAINERS) {
    const deleted = await cleanupContainer(containerName);
    totalDeleted += deleted;
    console.log('');
  }

  console.log(`✅ Cleanup complete! Total deleted: ${totalDeleted} document(s)`);
}

/**
 * List all tenants in the database
 */
async function listTenants(): Promise<void> {
  console.log('📋 Listing all tenants...');
  console.log('');

  try {
    const container = database.container('Tenants');
    const querySpec = {
      query: 'SELECT c.id, c.tenantId, c.name, c.status FROM c',
    };

    const { resources: tenants } = await container.items.query(querySpec).fetchAll();

    if (tenants.length === 0) {
      console.log('  No tenants found in database');
      return;
    }

    console.log(`Found ${tenants.length} tenant(s):`);
    console.log('');
    tenants.forEach((tenant) => {
      console.log(`  • ${tenant.name} (${tenant.tenantId}) - Status: ${tenant.status}`);
    });
  } catch (error) {
    console.error('❌ Error listing tenants:', error);
  }
}

/**
 * Get document counts for all containers
 */
async function getStats(): Promise<void> {
  console.log('📊 Database Statistics');
  console.log('');

  for (const containerName of CONTAINERS) {
    try {
      const container = database.container(containerName);
      const querySpec = {
        query: 'SELECT VALUE COUNT(1) FROM c',
      };

      const { resources } = await container.items.query(querySpec).fetchAll();
      const count = resources[0] || 0;

      console.log(`  ${containerName.padEnd(15)} ${count} document(s)`);
    } catch (error) {
      console.error(`  ${containerName.padEnd(15)} Error: ${error}`);
    }
  }

  console.log('');
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    all: false,
    tenant: '',
    container: '',
    confirm: false,
    list: false,
    stats: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--all':
        options.all = true;
        break;
      case '--tenant':
        options.tenant = args[++i];
        break;
      case '--container':
        options.container = args[++i];
        break;
      case '--confirm':
        options.confirm = true;
        break;
      case '--list':
        options.list = true;
        break;
      case '--stats':
        options.stats = true;
        break;
      default:
        console.error(`Unknown option: ${args[i]}`);
        process.exit(1);
    }
  }

  return options;
}

/**
 * Print usage information
 */
function printUsage() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  CosmosDB Data Cleanup Utility');
  console.log('  SaaS Management Application');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('Usage:');
  console.log('  ts-node cleanup-data.ts [options]');
  console.log('');
  console.log('Options:');
  console.log('  --all              Delete all data from all containers');
  console.log('  --tenant <id>      Delete all data for specific tenant');
  console.log('  --container <name> Delete all data from specific container');
  console.log('  --list             List all tenants in database');
  console.log('  --stats            Show document counts for all containers');
  console.log('  --confirm          Skip confirmation prompt (use with caution!)');
  console.log('');
  console.log('Examples:');
  console.log('  ts-node cleanup-data.ts --stats');
  console.log('  ts-node cleanup-data.ts --list');
  console.log('  ts-node cleanup-data.ts --tenant dev-tenant');
  console.log('  ts-node cleanup-data.ts --container Users');
  console.log('  ts-node cleanup-data.ts --all --confirm');
  console.log('');
  console.log('⚠️  WARNING: These operations are destructive and cannot be undone!');
  console.log('');
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();

  // Show usage if no options provided
  if (!options.all && !options.tenant && !options.container && !options.list && !options.stats) {
    printUsage();
    return;
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('  CosmosDB Data Cleanup Utility');
  console.log('  SaaS Management Application');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`📍 Endpoint: ${config.endpoint}`);
  console.log(`📁 Database: ${config.databaseId}`);
  console.log('');

  try {
    // Handle read-only operations
    if (options.stats) {
      await getStats();
      return;
    }

    if (options.list) {
      await listTenants();
      return;
    }

    // Handle destructive operations
    if (options.all) {
      if (!options.confirm) {
        const confirmed = await confirm(
          '⚠️  This will delete ALL data from the database. Are you sure?'
        );
        if (!confirmed) {
          console.log('Operation cancelled.');
          return;
        }
      }
      await cleanupAll();
    } else if (options.tenant) {
      if (!options.confirm) {
        const confirmed = await confirm(
          `⚠️  This will delete all data for tenant "${options.tenant}". Are you sure?`
        );
        if (!confirmed) {
          console.log('Operation cancelled.');
          return;
        }
      }
      await cleanupTenant(options.tenant);
    } else if (options.container) {
      if (!CONTAINERS.includes(options.container)) {
        console.error(`❌ Invalid container name: ${options.container}`);
        console.error(`Valid containers: ${CONTAINERS.join(', ')}`);
        process.exit(1);
      }
      if (!options.confirm) {
        const confirmed = await confirm(
          `⚠️  This will delete all data from container "${options.container}". Are you sure?`
        );
        if (!confirmed) {
          console.log('Operation cancelled.');
          return;
        }
      }
      await cleanupContainer(options.container);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export {
  cleanupContainer,
  cleanupTenant,
  cleanupAll,
  listTenants,
  getStats,
};
