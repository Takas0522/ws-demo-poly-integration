/**
 * CosmosDB Schema Migration Script V1 -> V2
 * 
 * This script migrates the database schema from V1 to V2, adding:
 * - TenantUsers container (multi-tenant user relationships)
 * - Services container (service catalog)
 * - system-internal tenant
 * - User.userType and User.primaryTenantId fields
 * - Tenant.settings.allowedDomains and Tenant.services fields
 * 
 * Usage:
 *   cd scripts/cosmosdb
 *   export COSMOSDB_ENDPOINT="https://localhost:8081"
 *   export COSMOSDB_KEY="your-key"
 *   export COSMOSDB_DATABASE="saas-management-dev"
 *   ts-node migrate-to-v2.ts
 * 
 * IMPORTANT: 
 * - Backup your database before running this migration
 * - Run in development environment first
 * - System should be in maintenance mode during migration
 * - Estimated downtime: 5-10 minutes
 */

import { CosmosClient, IndexingPolicy } from '@azure/cosmos';
import { v4 as uuidv4 } from 'uuid';
import { TenantUser, Service, User, Tenant } from './types';

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
 * Create TenantUsers container with composite indexes
 */
async function createTenantUsersContainer(): Promise<void> {
  console.log('Creating TenantUsers container...');
  
  const indexingPolicy: IndexingPolicy = {
    indexingMode: 'consistent',
    automatic: true,
    includedPaths: [{ path: '/*' }],
    excludedPaths: [{ path: '/"_etag"/?' }],
    compositeIndexes: [
      [
        { path: '/userId', order: 'ascending' },
        { path: '/status', order: 'ascending' }
      ],
      [
        { path: '/tenantId', order: 'ascending' },
        { path: '/status', order: 'ascending' }
      ]
    ]
  };
  
  await database.containers.createIfNotExists(
    {
      id: 'TenantUsers',
      partitionKey: { paths: ['/userId'] },
      indexingPolicy: indexingPolicy
    },
    { offerThroughput: 400 }
  );
  
  console.log('✓ TenantUsers container created');
}

/**
 * Create Services container
 */
async function createServicesContainer(): Promise<void> {
  console.log('Creating Services container...');
  
  await database.containers.createIfNotExists(
    {
      id: 'Services',
      partitionKey: { paths: ['/tenantId'] }
    },
    { offerThroughput: 400 }
  );
  
  console.log('✓ Services container created');
}

/**
 * Create system-internal tenant
 */
async function createSystemInternalTenant(): Promise<void> {
  console.log('Creating system-internal tenant...');
  
  const container = database.container('Tenants');
  
  // Check if system-internal tenant already exists
  try {
    const { resource } = await container.item('system-internal', 'system-internal').read();
    if (resource) {
      console.log('✓ system-internal tenant already exists');
      return;
    }
  } catch (error: any) {
    // Tenant doesn't exist, create it
    if (error.code !== 404) {
      throw error;
    }
  }
  
  const tenant: Tenant = {
    id: 'system-internal',
    tenantId: 'system-internal',
    name: '管理会社',
    status: 'active',
    subscription: {
      plan: 'enterprise',
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2099-12-31T23:59:59.000Z',
      maxUsers: 9999
    },
    settings: {
      timezone: 'Asia/Tokyo',
      locale: 'ja-JP',
      features: {
        twoFactorAuth: true,
        apiAccess: true,
        advancedReporting: true
      },
      // Configure allowedDomains based on your organization's email domains
      // Example: ['@company.com', '@company.co.jp']
      // Can be set via environment variable: SYSTEM_INTERNAL_ALLOWED_DOMAINS
      allowedDomains: process.env.SYSTEM_INTERNAL_ALLOWED_DOMAINS 
        ? process.env.SYSTEM_INTERNAL_ALLOWED_DOMAINS.split(',').map(d => d.trim())
        : ['@company.com']  // Default value
    },
    services: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'migration-script',
    updatedBy: 'migration-script'
  };
  
  await container.items.upsert(tenant);
  console.log('✓ system-internal tenant created');
}

/**
 * Migrate existing Users to V2
 */
async function migrateUsersToV2(): Promise<number> {
  console.log('Migrating Users to V2...');
  
  const container = database.container('Users');
  const { resources: users } = await container.items
    .query('SELECT * FROM c')
    .fetchAll();
  
  let migratedCount = 0;
  
  for (const user of users) {
    // Skip if already migrated
    if (user.userType && user.primaryTenantId) {
      continue;
    }
    
    // Add V2 fields
    const updatedUser: User = {
      ...user,
      userType: 'internal',  // Default to internal
      primaryTenantId: user.tenantId  // Use existing tenantId as primary
    };
    
    updatedUser.updatedAt = new Date().toISOString();
    
    await container.items.upsert(updatedUser);
    migratedCount++;
  }
  
  console.log(`✓ Migrated ${migratedCount} users to V2`);
  return migratedCount;
}

/**
 * Migrate existing Tenants to V2
 */
async function migrateTenantsToV2(): Promise<number> {
  console.log('Migrating Tenants to V2...');
  
  const container = database.container('Tenants');
  const { resources: tenants } = await container.items
    .query('SELECT * FROM c')
    .fetchAll();
  
  let migratedCount = 0;
  
  for (const tenant of tenants) {
    // Skip if already migrated
    if (tenant.settings?.allowedDomains !== undefined && tenant.services !== undefined) {
      continue;
    }
    
    // Add V2 fields
    const updatedTenant: Tenant = {
      ...tenant,
      settings: {
        ...tenant.settings,
        allowedDomains: tenant.settings?.allowedDomains || []
      },
      services: tenant.services || []
    };
    
    updatedTenant.updatedAt = new Date().toISOString();
    
    await container.items.upsert(updatedTenant);
    migratedCount++;
  }
  
  console.log(`✓ Migrated ${migratedCount} tenants to V2`);
  return migratedCount;
}

/**
 * Generate TenantUsers records from existing Users
 */
async function generateTenantUsersFromExistingData(): Promise<number> {
  console.log('Generating TenantUsers from existing Users...');
  
  const usersContainer = database.container('Users');
  const tenantUsersContainer = database.container('TenantUsers');
  
  const { resources: users } = await usersContainer.items
    .query('SELECT * FROM c')
    .fetchAll();
  
  let createdCount = 0;
  
  for (const user of users) {
    // Check if TenantUser record already exists
    const { resources: existing } = await tenantUsersContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.userId = @userId AND c.tenantId = @tenantId',
        parameters: [
          { name: '@userId', value: user.id },
          { name: '@tenantId', value: user.tenantId }
        ]
      })
      .fetchAll();
    
    if (existing.length > 0) {
      continue; // Skip if already exists
    }
    
    // Create TenantUser record
    const tenantUser: TenantUser = {
      id: `tenantuser-${uuidv4()}`,
      userId: user.id,
      tenantId: user.tenantId,
      roles: user.roles || [],
      permissions: user.permissions || [],
      status: user.status === 'active' ? 'active' : 'inactive',
      joinedAt: user.createdAt,
      leftAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'migration-script',
      updatedBy: 'migration-script'
    };
    
    await tenantUsersContainer.items.upsert(tenantUser);
    createdCount++;
  }
  
  console.log(`✓ Created ${createdCount} TenantUsers records`);
  return createdCount;
}

/**
 * Verify migration results
 */
async function verifyMigration(): Promise<boolean> {
  console.log('');
  console.log('Verifying migration...');
  
  const errors: string[] = [];
  
  // Check TenantUsers container exists
  try {
    const container = database.container('TenantUsers');
    await container.read();
    console.log('  ✓ TenantUsers container exists');
  } catch (error) {
    errors.push('TenantUsers container not found');
  }
  
  // Check Services container exists
  try {
    const container = database.container('Services');
    await container.read();
    console.log('  ✓ Services container exists');
  } catch (error) {
    errors.push('Services container not found');
  }
  
  // Check system-internal tenant exists
  try {
    const container = database.container('Tenants');
    const { resource } = await container.item('system-internal', 'system-internal').read();
    if (resource) {
      console.log('  ✓ system-internal tenant exists');
    } else {
      errors.push('system-internal tenant not found');
    }
  } catch (error) {
    errors.push('system-internal tenant not found');
  }
  
  // Check Users have V2 fields
  try {
    const container = database.container('Users');
    const { resources: users } = await container.items
      .query('SELECT * FROM c')
      .fetchAll();
    
    const usersWithV2Fields = users.filter(u => u.userType && u.primaryTenantId);
    console.log(`  ✓ ${usersWithV2Fields.length}/${users.length} users have V2 fields`);
    
    if (usersWithV2Fields.length < users.length) {
      errors.push(`${users.length - usersWithV2Fields.length} users missing V2 fields`);
    }
  } catch (error) {
    errors.push('Failed to verify Users');
  }
  
  // Check Tenants have V2 fields
  try {
    const container = database.container('Tenants');
    const { resources: tenants } = await container.items
      .query('SELECT * FROM c')
      .fetchAll();
    
    const tenantsWithV2Fields = tenants.filter(t => 
      t.settings?.allowedDomains !== undefined && t.services !== undefined
    );
    console.log(`  ✓ ${tenantsWithV2Fields.length}/${tenants.length} tenants have V2 fields`);
    
    if (tenantsWithV2Fields.length < tenants.length) {
      errors.push(`${tenants.length - tenantsWithV2Fields.length} tenants missing V2 fields`);
    }
  } catch (error) {
    errors.push('Failed to verify Tenants');
  }
  
  // Check TenantUsers records exist
  try {
    const container = database.container('TenantUsers');
    const { resources: tenantUsers } = await container.items
      .query('SELECT VALUE COUNT(1) FROM c')
      .fetchAll();
    
    console.log(`  ✓ ${tenantUsers[0]} TenantUsers records exist`);
  } catch (error) {
    errors.push('Failed to verify TenantUsers');
  }
  
  if (errors.length > 0) {
    console.log('');
    console.log('❌ Verification failed:');
    errors.forEach(err => console.log(`  - ${err}`));
    return false;
  }
  
  console.log('');
  console.log('✅ Migration verification passed');
  return true;
}

/**
 * Main migration function
 */
async function migrateToV2(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  CosmosDB Schema Migration V1 → V2');
  console.log('  SaaS Management Application');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`📍 Endpoint: ${config.endpoint}`);
  console.log(`📁 Database: ${config.databaseId}`);
  console.log('');
  console.log('⚠️  WARNING: This migration will modify your database');
  console.log('   Please ensure you have a backup before proceeding');
  console.log('');
  
  try {
    console.log('🚀 Starting migration to V2...');
    console.log('');
    
    // Step 1: Create TenantUsers container
    await createTenantUsersContainer();
    
    // Step 2: Create Services container
    await createServicesContainer();
    
    // Step 3: Create system-internal tenant
    await createSystemInternalTenant();
    
    // Step 4: Migrate existing Users
    const usersMigrated = await migrateUsersToV2();
    
    // Step 5: Migrate existing Tenants
    const tenantsMigrated = await migrateTenantsToV2();
    
    // Step 6: Generate TenantUsers records
    const tenantUsersCreated = await generateTenantUsersFromExistingData();
    
    // Verify migration
    const verified = await verifyMigration();
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Migration to V2 completed!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📊 Migration Summary:');
    console.log(`  - Users migrated: ${usersMigrated}`);
    console.log(`  - Tenants migrated: ${tenantsMigrated}`);
    console.log(`  - TenantUsers created: ${tenantUsersCreated}`);
    console.log(`  - Verification: ${verified ? 'PASSED' : 'FAILED'}`);
    console.log('');
    console.log('💡 Next steps:');
    console.log('  1. Review the migrated data in Azure Portal or Data Explorer');
    console.log('  2. Test application functionality with the new schema');
    console.log('  3. If issues occur, use rollback-to-v1.ts to revert');
    console.log('  4. Update application code to use new schema features');
    console.log('');
    
    if (!verified) {
      console.log('⚠️  Migration completed but verification failed');
      console.log('   Please review the errors above and fix any issues');
      process.exit(1);
    }
  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    console.error('');
    console.error('💡 To rollback, run: ts-node rollback-to-v1.ts');
    process.exit(1);
  }
}

/**
 * Entry point
 */
if (require.main === module) {
  migrateToV2().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export {
  createTenantUsersContainer,
  createServicesContainer,
  createSystemInternalTenant,
  migrateUsersToV2,
  migrateTenantsToV2,
  generateTenantUsersFromExistingData,
  verifyMigration
};
