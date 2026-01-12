/**
 * CosmosDB Schema Rollback Script V2 -> V1
 * 
 * This script rolls back the database schema from V2 to V1, removing:
 * - TenantUsers container
 * - Services container
 * - system-internal tenant
 * - User.userType and User.primaryTenantId fields (optional)
 * - Tenant.settings.allowedDomains and Tenant.services fields (optional)
 * 
 * Usage:
 *   cd scripts/cosmosdb
 *   export COSMOSDB_ENDPOINT="https://localhost:8081"
 *   export COSMOSDB_KEY="your-key"
 *   export COSMOSDB_DATABASE="saas-management-dev"
 *   ts-node rollback-to-v1.ts
 * 
 * IMPORTANT: 
 * - This will DELETE the TenantUsers and Services containers
 * - All data in these containers will be PERMANENTLY LOST
 * - Backup your database before running this rollback
 * - System should be in maintenance mode during rollback
 */

import { CosmosClient } from '@azure/cosmos';

// Configuration from environment variables
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

const database = client.database(config.databaseId);

/**
 * Delete TenantUsers container
 */
async function deleteTenantUsersContainer(): Promise<void> {
  console.log('Deleting TenantUsers container...');
  
  try {
    const container = database.container('TenantUsers');
    await container.delete();
    console.log('✓ TenantUsers container deleted');
  } catch (error: any) {
    if (error.code === 404) {
      console.log('✓ TenantUsers container does not exist');
    } else {
      throw error;
    }
  }
}

/**
 * Delete Services container
 */
async function deleteServicesContainer(): Promise<void> {
  console.log('Deleting Services container...');
  
  try {
    const container = database.container('Services');
    await container.delete();
    console.log('✓ Services container deleted');
  } catch (error: any) {
    if (error.code === 404) {
      console.log('✓ Services container does not exist');
    } else {
      throw error;
    }
  }
}

/**
 * Delete system-internal tenant
 */
async function deleteSystemInternalTenant(): Promise<void> {
  console.log('Deleting system-internal tenant...');
  
  try {
    const container = database.container('Tenants');
    await container.item('system-internal', 'system-internal').delete();
    console.log('✓ system-internal tenant deleted');
  } catch (error: any) {
    if (error.code === 404) {
      console.log('✓ system-internal tenant does not exist');
    } else {
      throw error;
    }
  }
}

/**
 * Remove V2 fields from Users (optional)
 * Note: CosmosDB is schema-less, so leaving these fields won't cause issues
 */
async function removeV2FieldsFromUsers(): Promise<number> {
  console.log('Removing V2 fields from Users (optional)...');
  
  const container = database.container('Users');
  const { resources: users } = await container.items
    .query('SELECT * FROM c')
    .fetchAll();
  
  let updatedCount = 0;
  
  for (const user of users) {
    if (user.userType || user.primaryTenantId) {
      delete user.userType;
      delete user.primaryTenantId;
      user.updatedAt = new Date().toISOString();
      
      await container.items.upsert(user);
      updatedCount++;
    }
  }
  
  console.log(`✓ Removed V2 fields from ${updatedCount} users`);
  return updatedCount;
}

/**
 * Remove V2 fields from Tenants (optional)
 * Note: CosmosDB is schema-less, so leaving these fields won't cause issues
 */
async function removeV2FieldsFromTenants(): Promise<number> {
  console.log('Removing V2 fields from Tenants (optional)...');
  
  const container = database.container('Tenants');
  const { resources: tenants } = await container.items
    .query('SELECT * FROM c')
    .fetchAll();
  
  let updatedCount = 0;
  
  for (const tenant of tenants) {
    let modified = false;
    
    if (tenant.settings?.allowedDomains !== undefined) {
      delete tenant.settings.allowedDomains;
      modified = true;
    }
    
    if (tenant.services !== undefined) {
      delete tenant.services;
      modified = true;
    }
    
    if (modified) {
      tenant.updatedAt = new Date().toISOString();
      await container.items.upsert(tenant);
      updatedCount++;
    }
  }
  
  console.log(`✓ Removed V2 fields from ${updatedCount} tenants`);
  return updatedCount;
}

/**
 * Verify rollback results
 */
async function verifyRollback(): Promise<boolean> {
  console.log('');
  console.log('Verifying rollback...');
  
  const errors: string[] = [];
  
  // Check TenantUsers container doesn't exist
  try {
    const container = database.container('TenantUsers');
    await container.read();
    errors.push('TenantUsers container still exists');
  } catch (error: any) {
    if (error.code === 404) {
      console.log('  ✓ TenantUsers container removed');
    } else {
      errors.push('Failed to verify TenantUsers container deletion');
    }
  }
  
  // Check Services container doesn't exist
  try {
    const container = database.container('Services');
    await container.read();
    errors.push('Services container still exists');
  } catch (error: any) {
    if (error.code === 404) {
      console.log('  ✓ Services container removed');
    } else {
      errors.push('Failed to verify Services container deletion');
    }
  }
  
  // Check system-internal tenant doesn't exist
  try {
    const container = database.container('Tenants');
    const { resource } = await container.item('system-internal', 'system-internal').read();
    if (resource) {
      errors.push('system-internal tenant still exists');
    }
  } catch (error: any) {
    if (error.code === 404) {
      console.log('  ✓ system-internal tenant removed');
    } else {
      errors.push('Failed to verify system-internal tenant deletion');
    }
  }
  
  if (errors.length > 0) {
    console.log('');
    console.log('❌ Verification failed:');
    errors.forEach(err => console.log(`  - ${err}`));
    return false;
  }
  
  console.log('');
  console.log('✅ Rollback verification passed');
  return true;
}

/**
 * Main rollback function
 */
async function rollbackToV1(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  CosmosDB Schema Rollback V2 → V1');
  console.log('  SaaS Management Application');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`📍 Endpoint: ${config.endpoint}`);
  console.log(`📁 Database: ${config.databaseId}`);
  console.log('');
  console.log('⚠️  WARNING: This will DELETE data and containers');
  console.log('   - TenantUsers container and ALL its data');
  console.log('   - Services container and ALL its data');
  console.log('   - system-internal tenant');
  console.log('');
  console.log('   Please ensure you have a backup before proceeding');
  console.log('');
  
  try {
    console.log('🚀 Starting rollback to V1...');
    console.log('');
    
    // Step 1: Delete TenantUsers container
    await deleteTenantUsersContainer();
    
    // Step 2: Delete Services container
    await deleteServicesContainer();
    
    // Step 3: Delete system-internal tenant
    await deleteSystemInternalTenant();
    
    // Step 4: Remove V2 fields from Users (optional)
    console.log('');
    console.log('Note: Removing V2 fields from Users and Tenants is optional.');
    console.log('      CosmosDB is schema-less, so leaving them won\'t cause issues.');
    console.log('      Skipping field removal to preserve data...');
    console.log('');
    // Uncomment below to remove V2 fields:
    // const usersUpdated = await removeV2FieldsFromUsers();
    // const tenantsUpdated = await removeV2FieldsFromTenants();
    
    // Verify rollback
    const verified = await verifyRollback();
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Rollback to V1 completed!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📊 Rollback Summary:');
    console.log('  - TenantUsers container: DELETED');
    console.log('  - Services container: DELETED');
    console.log('  - system-internal tenant: DELETED');
    console.log('  - V2 fields in Users: PRESERVED (optional removal)');
    console.log('  - V2 fields in Tenants: PRESERVED (optional removal)');
    console.log(`  - Verification: ${verified ? 'PASSED' : 'FAILED'}`);
    console.log('');
    console.log('💡 Next steps:');
    console.log('  1. Review the database in Azure Portal or Data Explorer');
    console.log('  2. Test application functionality with V1 schema');
    console.log('  3. Update application code if needed');
    console.log('');
    
    if (!verified) {
      console.log('⚠️  Rollback completed but verification failed');
      console.log('   Please review the errors above and fix any issues');
      process.exit(1);
    }
  } catch (error) {
    console.error('');
    console.error('❌ Rollback failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    console.error('');
    console.error('💡 Manual cleanup may be required');
    process.exit(1);
  }
}

/**
 * Entry point
 */
if (require.main === module) {
  rollbackToV1().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export {
  deleteTenantUsersContainer,
  deleteServicesContainer,
  deleteSystemInternalTenant,
  removeV2FieldsFromUsers,
  removeV2FieldsFromTenants,
  verifyRollback
};
