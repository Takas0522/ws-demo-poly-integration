/**
 * JSON-based Seed Data Loader
 * 
 * Loads seed data from JSON files based on environment and seeds the database.
 * This provides environment-specific, idempotent seeding operations.
 * 
 * Usage:
 *   ts-node scripts/cosmosdb/seed-data-json.ts [environment]
 * 
 * Environment (optional, defaults to NODE_ENV or 'development'):
 *   development - Loads data from data/seeds/development/
 *   staging     - Loads data from data/seeds/staging/
 *   testing     - Loads data from data/seeds/testing/
 * 
 * Environment Variables:
 *   COSMOSDB_ENDPOINT - CosmosDB endpoint URL
 *   COSMOSDB_KEY - CosmosDB master key
 *   COSMOSDB_DATABASE - Database name
 *   NODE_ENV - Environment name (if not specified as argument)
 */

import { CosmosClient } from '@azure/cosmos';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { validateSeedData, printValidationResults } from './validation';
import { Tenant, User, Permission } from './types';

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
 * Determine environment from argument or NODE_ENV
 */
function getEnvironment(): string {
  const arg = process.argv[2];
  if (arg && ['development', 'staging', 'testing'].includes(arg)) {
    return arg;
  }
  
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv && ['development', 'staging', 'testing'].includes(nodeEnv)) {
    return nodeEnv;
  }
  
  return 'development';
}

/**
 * Load JSON seed data files
 */
function loadSeedData(environment: string): {
  tenants: any[];
  users: any[];
  permissions: any[];
} {
  const seedsDir = path.join(__dirname, 'data', 'seeds', environment);
  
  console.log(`📂 Loading seed data from: ${seedsDir}`);
  
  // Check if directory exists
  if (!fs.existsSync(seedsDir)) {
    throw new Error(`Seed data directory not found: ${seedsDir}`);
  }
  
  // Load JSON files
  const tenantsFile = path.join(seedsDir, 'tenants.json');
  const usersFile = path.join(seedsDir, 'users.json');
  const permissionsFile = path.join(seedsDir, 'permissions.json');
  
  const tenants = fs.existsSync(tenantsFile)
    ? JSON.parse(fs.readFileSync(tenantsFile, 'utf-8'))
    : [];
  
  const users = fs.existsSync(usersFile)
    ? JSON.parse(fs.readFileSync(usersFile, 'utf-8'))
    : [];
  
  const permissions = fs.existsSync(permissionsFile)
    ? JSON.parse(fs.readFileSync(permissionsFile, 'utf-8'))
    : [];
  
  console.log(`  ✅ Loaded ${tenants.length} tenant(s)`);
  console.log(`  ✅ Loaded ${users.length} user(s)`);
  console.log(`  ✅ Loaded ${permissions.length} permission(s)`);
  console.log('');
  
  return { tenants, users, permissions };
}

/**
 * Seed tenants (idempotent - uses upsert)
 */
async function seedTenants(tenants: any[]): Promise<Map<string, string>> {
  console.log('📋 Seeding Tenants...');
  const container = database.container('Tenants');
  const tenantMap = new Map<string, string>();
  
  for (const tenantData of tenants) {
    const now = new Date().toISOString();
    const tenant: Tenant = {
      ...tenantData,
      createdAt: tenantData.createdAt || now,
      updatedAt: now,
      createdBy: tenantData.createdBy || 'system',
      updatedBy: 'system',
    };
    
    await container.items.upsert(tenant);
    tenantMap.set(tenant.tenantId, tenant.id);
    console.log(`  ✅ Upserted tenant: ${tenant.name} (${tenant.tenantId})`);
  }
  
  return tenantMap;
}

/**
 * Seed users (idempotent - uses upsert)
 */
async function seedUsers(users: any[]): Promise<Map<string, string>> {
  console.log('👤 Seeding Users...');
  const container = database.container('Users');
  const userMap = new Map<string, string>();
  
  for (const userData of users) {
    const now = new Date().toISOString();
    
    // Validate that user has an ID
    if (!userData.id) {
      console.error(`  ❌ Error: User ${userData.email} is missing required 'id' field`);
      throw new Error(`User ${userData.email} must have an 'id' field in seed data`);
    }
    
    // Hash password if provided
    let passwordHash = userData.passwordHash;
    if (!passwordHash && userData.password) {
      passwordHash = await bcrypt.hash(userData.password, 10);
    }
    
    const userId = userData.id;
    
    const user: User = {
      id: userId,
      tenantId: userData.tenantId,
      email: userData.email,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      passwordHash: passwordHash,
      status: userData.status || 'active',
      roles: userData.roles || ['user'],
      permissions: userData.permissions || [],
      profile: {
        phoneNumber: userData.profile?.phoneNumber,
        department: userData.profile?.department,
        jobTitle: userData.profile?.jobTitle,
        avatarUrl: userData.profile?.avatarUrl,
      },
      security: {
        lastLoginAt: userData.security?.lastLoginAt,
        lastPasswordChangeAt: userData.security?.lastPasswordChangeAt || now,
        failedLoginAttempts: userData.security?.failedLoginAttempts || 0,
        lockedUntil: userData.security?.lockedUntil,
        twoFactorEnabled: userData.security?.twoFactorEnabled || false,
        twoFactorSecret: userData.security?.twoFactorSecret,
      },
      createdAt: userData.createdAt || now,
      updatedAt: now,
      createdBy: userData.createdBy || 'system',
      updatedBy: 'system',
    };
    
    await container.items.upsert(user);
    userMap.set(user.email, user.id);
    console.log(`  ✅ Upserted user: ${user.username} (${user.email})`);
  }
  
  return userMap;
}

/**
 * Seed permissions (idempotent - uses upsert per tenant)
 */
async function seedPermissions(permissions: any[], tenantIds: string[]): Promise<void> {
  console.log('🔐 Seeding Permissions...');
  const container = database.container('Permissions');
  
  // Create permissions for each tenant
  for (const tenantId of tenantIds) {
    for (const permData of permissions) {
      const now = new Date().toISOString();
      
      // Generate deterministic ID based on tenant and permission name
      const permissionId = `perm-${tenantId}-${permData.name}`;
      
      const permission: Permission = {
        id: permissionId,
        tenantId: tenantId,
        name: permData.name,
        displayName: permData.displayName,
        description: permData.description,
        category: permData.category,
        resource: permData.resource,
        action: permData.action,
        scope: permData.scope || 'tenant',
        isActive: permData.isActive !== undefined ? permData.isActive : true,
        requiredPlan: permData.requiredPlan,
        metadata: permData.metadata,
        createdAt: permData.createdAt || now,
        updatedAt: now,
        createdBy: permData.createdBy || 'system',
        updatedBy: 'system',
      };
      
      await container.items.upsert(permission);
    }
    console.log(`  ✅ Upserted ${permissions.length} permission(s) for tenant: ${tenantId}`);
  }
}

/**
 * Seed sample audit logs
 */
async function seedAuditLogs(userMap: Map<string, string>, tenantIds: string[]): Promise<void> {
  console.log('📝 Seeding Sample Audit Logs...');
  const container = database.container('AuditLogs');
  
  // Create a few sample logs for the first user in the first tenant
  if (tenantIds.length === 0 || userMap.size === 0) {
    console.log('  ℹ️  Skipping audit logs (no tenants or users)');
    return;
  }
  
  const tenantId = tenantIds[0];
  const userId = Array.from(userMap.values())[0];
  const userName = Array.from(userMap.keys())[0];
  
  const logs = [
    {
      id: `log-${uuidv4()}`,
      tenantId: tenantId,
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      userId: userId,
      userName: userName,
      action: 'user.login',
      resource: {
        type: 'User',
        id: userId,
        name: userName,
      },
      details: {
        reason: 'Initial login after seeding',
      },
      metadata: {
        ipAddress: '127.0.0.1',
        userAgent: 'Seed Data Script',
        requestId: `req-${uuidv4()}`,
        sessionId: `session-${uuidv4()}`,
      },
      status: 'success' as const,
      ttl: 7776000, // 90 days
    },
    {
      id: `log-${uuidv4()}`,
      tenantId: tenantId,
      timestamp: new Date().toISOString(),
      userId: userId,
      userName: userName,
      action: 'database.seed',
      resource: {
        type: 'Database',
        id: config.databaseId,
        name: 'SaaS Management Database',
      },
      details: {
        reason: 'Initial database seeding',
      },
      metadata: {
        ipAddress: '127.0.0.1',
        userAgent: 'Seed Data Script',
        requestId: `req-${uuidv4()}`,
      },
      status: 'success' as const,
      ttl: 7776000,
    },
  ];
  
  for (const log of logs) {
    await container.items.upsert(log);
  }
  
  console.log(`  ✅ Created ${logs.length} sample audit log(s)`);
}

/**
 * Main seeding function
 */
async function seedData(environment: string) {
  console.log('🌱 Starting data seeding...');
  console.log(`📍 Endpoint: ${config.endpoint}`);
  console.log(`📁 Database: ${config.databaseId}`);
  console.log(`🌍 Environment: ${environment}`);
  console.log('');
  
  try {
    // Load seed data
    const { tenants, users, permissions } = loadSeedData(environment);
    
    // Validate seed data
    console.log('🔍 Validating seed data...');
    const validationResult = validateSeedData(tenants, users, permissions);
    printValidationResults(validationResult);
    
    if (!validationResult.valid) {
      console.error('❌ Seed data validation failed. Please fix errors and try again.');
      process.exit(1);
    }
    
    console.log('✅ Validation passed! Proceeding with seeding...');
    console.log('');
    
    // Seed in order due to dependencies
    const tenantMap = await seedTenants(tenants);
    const userMap = await seedUsers(users);
    const tenantIds = Array.from(tenantMap.keys());
    await seedPermissions(permissions, tenantIds);
    await seedAuditLogs(userMap, tenantIds);
    
    console.log('');
    console.log('🎉 Data seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`  - Environment: ${environment}`);
    console.log(`  - Tenants: ${tenants.length}`);
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Permissions: ${permissions.length} × ${tenantIds.length} tenant(s) = ${permissions.length * tenantIds.length}`);
    console.log(`  - Audit Logs: 2 (sample)`);
    console.log('');
    
    if (environment === 'development') {
      console.log('🔐 Development Credentials:');
      console.log('  See data/seeds/development/users.json for user credentials');
      console.log('');
      console.log('⚠️  IMPORTANT: These are development-only credentials!');
      console.log('⚠️  Change all passwords before deploying to staging or production!');
    }
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

/**
 * Entry point
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  CosmosDB JSON-Based Seed Data');
  console.log('  SaaS Management Application');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  
  const environment = getEnvironment();
  await seedData(environment);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { seedData, loadSeedData };
