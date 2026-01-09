/**
 * CosmosDB Seed Data Script
 * 
 * This script populates the database with initial development data including
 * a default tenant, admin user, and permissions.
 * 
 * Usage:
 *   npm install @azure/cosmos bcryptjs uuid
 *   ts-node scripts/cosmosdb/seed-data.ts
 * 
 * Environment Variables Required:
 *   COSMOSDB_ENDPOINT - CosmosDB endpoint URL
 *   COSMOSDB_KEY - CosmosDB master key
 *   COSMOSDB_DATABASE - Database name
 */

import { CosmosClient } from '@azure/cosmos';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

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

const database = client.database(config.databaseId);

/**
 * Seed data for default tenant
 */
async function seedTenants() {
  console.log('📋 Seeding Tenants...');
  const container = database.container('Tenants');
  
  const tenantId = 'dev-tenant';
  const tenant = {
    id: tenantId,
    tenantId: tenantId,
    name: 'Development Tenant',
    status: 'active',
    subscription: {
      plan: 'enterprise',
      startDate: new Date('2026-01-01').toISOString(),
      endDate: new Date('2027-01-01').toISOString(),
      maxUsers: 100,
    },
    settings: {
      timezone: 'Asia/Tokyo',
      locale: 'ja-JP',
      features: {
        twoFactorAuth: true,
        apiAccess: true,
        advancedReporting: true,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    updatedBy: 'system',
  };

  await container.items.upsert(tenant);
  console.log(`  ✅ Created tenant: ${tenant.name} (${tenant.id})`);
  
  return tenantId;
}

/**
 * Seed data for default admin user
 */
async function seedUsers(tenantId: string) {
  console.log('👤 Seeding Users...');
  const container = database.container('Users');
  
  // Hash default password
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  
  const adminUserId = `user-${uuidv4()}`;
  const adminUser = {
    id: adminUserId,
    tenantId: tenantId,
    email: 'admin@example.com',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    passwordHash: passwordHash,
    status: 'active',
    roles: ['admin', 'user'],
    permissions: [
      'users.create',
      'users.read',
      'users.update',
      'users.delete',
      'services.create',
      'services.read',
      'services.update',
      'services.delete',
      'settings.read',
      'settings.update',
      'permissions.read',
      'permissions.update',
      'audit.read',
    ],
    profile: {
      phoneNumber: '+81-90-1234-5678',
      department: 'IT',
      jobTitle: 'System Administrator',
      avatarUrl: null,
    },
    security: {
      lastLoginAt: null,
      lastPasswordChangeAt: new Date().toISOString(),
      failedLoginAttempts: 0,
      lockedUntil: null,
      twoFactorEnabled: false,
      twoFactorSecret: null, // Should be encrypted TOTP secret when 2FA is enabled
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    updatedBy: 'system',
  };

  await container.items.upsert(adminUser);
  console.log(`  ✅ Created user: ${adminUser.username} (${adminUser.email})`);
  console.log(`     Default password set (see documentation for credentials)`);

  // Create a regular user
  const regularUserId = `user-${uuidv4()}`;
  const regularUser = {
    id: regularUserId,
    tenantId: tenantId,
    email: 'user@example.com',
    username: 'user',
    firstName: 'Regular',
    lastName: 'User',
    passwordHash: await bcrypt.hash('User@123', 10),
    status: 'active',
    roles: ['user'],
    permissions: [
      'users.read',
      'services.read',
      'settings.read',
    ],
    profile: {
      phoneNumber: '+81-90-8765-4321',
      department: 'Sales',
      jobTitle: 'Sales Representative',
      avatarUrl: null,
    },
    security: {
      lastLoginAt: null,
      lastPasswordChangeAt: new Date().toISOString(),
      failedLoginAttempts: 0,
      lockedUntil: null,
      twoFactorEnabled: false,
      twoFactorSecret: null, // Should be encrypted TOTP secret when 2FA is enabled
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: adminUserId,
    updatedBy: adminUserId,
  };

  await container.items.upsert(regularUser);
  console.log(`  ✅ Created user: ${regularUser.username} (${regularUser.email})`);
  console.log(`     Default password set (see documentation for credentials)`);

  return { adminUserId, regularUserId };
}

/**
 * Seed data for permissions
 */
async function seedPermissions(tenantId: string) {
  console.log('🔐 Seeding Permissions...');
  const container = database.container('Permissions');
  
  const permissions = [
    // User permissions
    {
      name: 'users.create',
      displayName: 'Create User',
      description: 'Permission to create new users',
      category: 'users',
      resource: 'users',
      action: 'create',
      requiredPlan: 'basic',
      metadata: {
        uiSection: 'User Management',
        uiButton: 'Create User',
        requiresConfirmation: true,
      },
    },
    {
      name: 'users.read',
      displayName: 'View Users',
      description: 'Permission to view user information',
      category: 'users',
      resource: 'users',
      action: 'read',
      requiredPlan: 'free',
      metadata: {
        uiSection: 'User Management',
        uiButton: 'View Users',
        requiresConfirmation: false,
      },
    },
    {
      name: 'users.update',
      displayName: 'Update User',
      description: 'Permission to update user information',
      category: 'users',
      resource: 'users',
      action: 'update',
      requiredPlan: 'basic',
      metadata: {
        uiSection: 'User Management',
        uiButton: 'Edit User',
        requiresConfirmation: true,
      },
    },
    {
      name: 'users.delete',
      displayName: 'Delete User',
      description: 'Permission to delete users',
      category: 'users',
      resource: 'users',
      action: 'delete',
      requiredPlan: 'professional',
      metadata: {
        uiSection: 'User Management',
        uiButton: 'Delete User',
        requiresConfirmation: true,
      },
    },
    // Service permissions
    {
      name: 'services.create',
      displayName: 'Create Service',
      description: 'Permission to create new services',
      category: 'services',
      resource: 'services',
      action: 'create',
      requiredPlan: 'professional',
      metadata: {
        uiSection: 'Service Management',
        uiButton: 'Create Service',
        requiresConfirmation: true,
      },
    },
    {
      name: 'services.read',
      displayName: 'View Services',
      description: 'Permission to view service information',
      category: 'services',
      resource: 'services',
      action: 'read',
      requiredPlan: 'free',
      metadata: {
        uiSection: 'Service Management',
        uiButton: 'View Services',
        requiresConfirmation: false,
      },
    },
    {
      name: 'services.update',
      displayName: 'Update Service',
      description: 'Permission to update service settings',
      category: 'services',
      resource: 'services',
      action: 'update',
      requiredPlan: 'professional',
      metadata: {
        uiSection: 'Service Management',
        uiButton: 'Edit Service',
        requiresConfirmation: true,
      },
    },
    {
      name: 'services.delete',
      displayName: 'Delete Service',
      description: 'Permission to delete services',
      category: 'services',
      resource: 'services',
      action: 'delete',
      requiredPlan: 'enterprise',
      metadata: {
        uiSection: 'Service Management',
        uiButton: 'Delete Service',
        requiresConfirmation: true,
      },
    },
    // Settings permissions
    {
      name: 'settings.read',
      displayName: 'View Settings',
      description: 'Permission to view tenant settings',
      category: 'settings',
      resource: 'settings',
      action: 'read',
      requiredPlan: 'free',
      metadata: {
        uiSection: 'Settings',
        uiButton: 'View Settings',
        requiresConfirmation: false,
      },
    },
    {
      name: 'settings.update',
      displayName: 'Update Settings',
      description: 'Permission to modify tenant settings',
      category: 'settings',
      resource: 'settings',
      action: 'update',
      requiredPlan: 'basic',
      metadata: {
        uiSection: 'Settings',
        uiButton: 'Edit Settings',
        requiresConfirmation: true,
      },
    },
    // Permission management
    {
      name: 'permissions.read',
      displayName: 'View Permissions',
      description: 'Permission to view permission definitions',
      category: 'system',
      resource: 'permissions',
      action: 'read',
      requiredPlan: 'basic',
      metadata: {
        uiSection: 'Permission Management',
        uiButton: 'View Permissions',
        requiresConfirmation: false,
      },
    },
    {
      name: 'permissions.update',
      displayName: 'Manage Permissions',
      description: 'Permission to create and update permission definitions',
      category: 'system',
      resource: 'permissions',
      action: 'update',
      requiredPlan: 'enterprise',
      metadata: {
        uiSection: 'Permission Management',
        uiButton: 'Manage Permissions',
        requiresConfirmation: true,
      },
    },
    // Audit permissions
    {
      name: 'audit.read',
      displayName: 'View Audit Logs',
      description: 'Permission to view audit logs',
      category: 'system',
      resource: 'audit',
      action: 'read',
      requiredPlan: 'professional',
      metadata: {
        uiSection: 'Audit Logs',
        uiButton: 'View Audit Logs',
        requiresConfirmation: false,
      },
    },
  ];

  for (const perm of permissions) {
    const permission = {
      id: `permission-${uuidv4()}`,
      tenantId: tenantId,
      ...perm,
      scope: 'tenant',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      updatedBy: 'system',
    };

    await container.items.upsert(permission);
    console.log(`  ✅ Created permission: ${permission.name}`);
  }
}

/**
 * Seed sample audit logs
 */
async function seedAuditLogs(tenantId: string, userId: string) {
  console.log('📝 Seeding Audit Logs...');
  const container = database.container('AuditLogs');
  
  const logs = [
    {
      id: `log-${uuidv4()}`,
      tenantId: tenantId,
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      userId: userId,
      userName: 'admin',
      action: 'user.create',
      resource: {
        type: 'User',
        id: 'user-789',
        name: 'user@example.com',
      },
      details: {
        changes: null,
        reason: 'Initial user setup',
      },
      metadata: {
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        requestId: `req-${uuidv4()}`,
        sessionId: `session-${uuidv4()}`,
      },
      status: 'success',
      ttl: 7776000, // 90 days
    },
    {
      id: `log-${uuidv4()}`,
      tenantId: tenantId,
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      userId: userId,
      userName: 'admin',
      action: 'permission.create',
      resource: {
        type: 'Permission',
        id: 'permission-123',
        name: 'users.create',
      },
      details: {
        changes: null,
        reason: 'Initial permission setup',
      },
      metadata: {
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        requestId: `req-${uuidv4()}`,
        sessionId: `session-${uuidv4()}`,
      },
      status: 'success',
      ttl: 7776000,
    },
  ];

  for (const log of logs) {
    await container.items.upsert(log);
  }
  
  console.log(`  ✅ Created ${logs.length} audit log entries`);
}

/**
 * Main seeding function
 */
async function seedData() {
  console.log('🌱 Starting data seeding...');
  console.log(`📍 Endpoint: ${config.endpoint}`);
  console.log(`📁 Database: ${config.databaseId}`);
  console.log('');

  try {
    // Seed in order due to dependencies
    const tenantId = await seedTenants();
    const { adminUserId } = await seedUsers(tenantId);
    await seedPermissions(tenantId);
    await seedAuditLogs(tenantId, adminUserId);

    console.log('');
    console.log('🎉 Data seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log('  - Tenants: 1');
    console.log('  - Users: 2 (admin, user)');
    console.log('  - Permissions: 13');
    console.log('  - Audit Logs: 2');
    console.log('');
    console.log('🔐 Default Credentials:');
    console.log('  Credentials are stored in seed-data.ts');
    console.log('  See scripts/cosmosdb/README.md for access details');
    console.log('');
    console.log('⚠️  IMPORTANT: These are development-only credentials!');
    console.log('⚠️  Change all passwords before deploying to staging or production!');

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
  console.log('  CosmosDB Seed Data');
  console.log('  SaaS Management Application');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  await seedData();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { seedData };
