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

import { CosmosClient } from "@azure/cosmos";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

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

const database = client.database(config.databaseId);

/**
 * Seed data for system-internal tenant (V2)
 */
async function seedSystemInternalTenant() {
  console.log("📋 Seeding System Internal Tenant...");
  const container = database.container("Tenants");

  const tenantId = "system-internal";
  const tenant = {
    id: tenantId,
    tenantId: tenantId,
    name: "管理会社",
    status: "active",
    subscription: {
      plan: "enterprise",
      startDate: new Date("2026-01-01").toISOString(),
      endDate: new Date("2099-12-31").toISOString(),
      maxUsers: 9999,
    },
    settings: {
      timezone: "Asia/Tokyo",
      locale: "ja-JP",
      features: {
        twoFactorAuth: true,
        apiAccess: true,
        advancedReporting: true,
      },
      allowedDomains: ["@company.com", "@company.co.jp"],
    },
    services: [
      {
        serviceId: "service-file-management",
        enabled: true,
        enabledAt: new Date("2026-01-01").toISOString(),
        disabledAt: null,
      },
      {
        serviceId: "service-external-sharing",
        enabled: true,
        enabledAt: new Date("2026-01-01").toISOString(),
        disabledAt: null,
      },
      {
        serviceId: "service-ai-agent",
        enabled: true,
        enabledAt: new Date("2026-01-10").toISOString(),
        disabledAt: null,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "system",
    updatedBy: "system",
  };

  await container.items.upsert(tenant);
  console.log(`  ✅ Created tenant: ${tenant.name} (${tenant.id})`);

  return tenantId;
}

/**
 * Seed data for default tenant
 */
async function seedTenants() {
  console.log("📋 Seeding Tenants...");
  const container = database.container("Tenants");

  const tenantId = "dev-tenant";
  const tenant = {
    id: tenantId,
    tenantId: tenantId,
    name: "Development Tenant",
    status: "active",
    subscription: {
      plan: "enterprise",
      startDate: new Date("2026-01-01").toISOString(),
      endDate: new Date("2027-01-01").toISOString(),
      maxUsers: 100,
    },
    settings: {
      timezone: "Asia/Tokyo",
      locale: "ja-JP",
      features: {
        twoFactorAuth: true,
        apiAccess: true,
        advancedReporting: true,
      },
      allowedDomains: [],
    },
    services: [
      {
        serviceId: "service-file-management",
        enabled: true,
        enabledAt: new Date("2026-01-01").toISOString(),
        disabledAt: null,
      },
      {
        serviceId: "service-external-sharing",
        enabled: true,
        enabledAt: new Date("2026-01-01").toISOString(),
        disabledAt: null,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "system",
    updatedBy: "system",
  };

  await container.items.upsert(tenant);
  console.log(`  ✅ Created tenant: ${tenant.name} (${tenant.id})`);

  return tenantId;
}

/**
 * Seed data for default admin user with V2 schema
 */
async function seedUsers(tenantId: string) {
  console.log("👤 Seeding Users...");
  const container = database.container("Users");

  // ⚠️ WARNING: These are hardcoded development-only credentials
  // NEVER use these passwords in production or staging environments
  // For production, use environment variables or secure secret management
  const passwordHash = await bcrypt.hash("Admin@123", 10);

  const adminUserId = `user-${uuidv4()}`;
  const adminUser = {
    id: adminUserId,
    tenantId: tenantId,
    email: "admin@example.com",
    username: "admin",
    firstName: "Admin",
    lastName: "User",
    passwordHash: passwordHash,
    status: "active",
    roles: ["admin", "user"],
    permissions: [
      "users.create",
      "users.read",
      "users.update",
      "users.delete",
      "services.create",
      "services.read",
      "services.update",
      "services.delete",
      "settings.read",
      "settings.update",
      "permissions.read",
      "permissions.update",
      "audit.read",
    ],
    profile: {
      phoneNumber: "+81-90-1234-5678",
      department: "IT",
      jobTitle: "System Administrator",
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
    userType: "external", // V2: external user for dev-tenant
    primaryTenantId: tenantId, // V2: primary tenant
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "system",
    updatedBy: "system",
  };

  await container.items.upsert(adminUser);
  console.log(`  ✅ Created user: ${adminUser.username} (${adminUser.email})`);
  console.log(`     Default password set (see documentation for credentials)`);

  // Create a regular user
  const regularUserId = `user-${uuidv4()}`;
  const regularUser = {
    id: regularUserId,
    tenantId: tenantId,
    email: "user@example.com",
    username: "user",
    firstName: "Regular",
    lastName: "User",
    passwordHash: await bcrypt.hash("User@123", 10),
    status: "active",
    roles: ["user"],
    permissions: ["users.read", "services.read", "settings.read"],
    profile: {
      phoneNumber: "+81-90-8765-4321",
      department: "Sales",
      jobTitle: "Sales Representative",
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
    userType: "external", // V2: external user
    primaryTenantId: tenantId, // V2: primary tenant
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: adminUserId,
    updatedBy: adminUserId,
  };

  await container.items.upsert(regularUser);
  console.log(
    `  ✅ Created user: ${regularUser.username} (${regularUser.email})`
  );
  console.log(`     Default password set (see documentation for credentials)`);

  return { adminUserId, regularUserId };
}

/**
 * Seed data for internal users (V2)
 */
async function seedInternalUsers(systemTenantId: string) {
  console.log("👤 Seeding Internal Users...");
  const container = database.container("Users");

  // Internal admin user
  const internalAdminId = `user-${uuidv4()}`;
  const internalAdmin = {
    id: internalAdminId,
    tenantId: systemTenantId,
    email: "admin@company.com",
    username: "internal-admin",
    firstName: "Internal",
    lastName: "Admin",
    passwordHash: await bcrypt.hash("InternalAdmin@123", 10),
    status: "active",
    roles: ["global-admin", "user"],
    permissions: [
      "system.*",
      "users.*",
      "services.*",
      "settings.*",
      "permissions.*",
      "audit.*",
    ],
    profile: {
      phoneNumber: "+81-90-1111-2222",
      department: "Management",
      jobTitle: "Global Administrator",
      avatarUrl: null,
    },
    security: {
      lastLoginAt: null,
      lastPasswordChangeAt: new Date().toISOString(),
      failedLoginAttempts: 0,
      lockedUntil: null,
      twoFactorEnabled: true,
      twoFactorSecret: null,
    },
    userType: "internal", // V2: internal user (can log in)
    primaryTenantId: systemTenantId, // V2: system-internal
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "system",
    updatedBy: "system",
  };

  await container.items.upsert(internalAdmin);
  console.log(
    `  ✅ Created internal user: ${internalAdmin.username} (${internalAdmin.email})`
  );

  // Multi-tenant support user
  const multiTenantUserId = `user-${uuidv4()}`;
  const multiTenantUser = {
    id: multiTenantUserId,
    tenantId: systemTenantId,
    email: "support@company.com",
    username: "support",
    firstName: "Multi",
    lastName: "Tenant",
    passwordHash: await bcrypt.hash("Support@123", 10),
    status: "active",
    roles: ["support", "user"],
    permissions: ["users.read", "services.read", "settings.read"],
    profile: {
      phoneNumber: "+81-90-3333-4444",
      department: "Support",
      jobTitle: "Support Engineer",
      avatarUrl: null,
    },
    security: {
      lastLoginAt: null,
      lastPasswordChangeAt: new Date().toISOString(),
      failedLoginAttempts: 0,
      lockedUntil: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
    userType: "internal", // V2: internal user
    primaryTenantId: systemTenantId, // V2: system-internal
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: internalAdminId,
    updatedBy: internalAdminId,
  };

  await container.items.upsert(multiTenantUser);
  console.log(
    `  ✅ Created multi-tenant user: ${multiTenantUser.username} (${multiTenantUser.email})`
  );

  return { internalAdminId, multiTenantUserId };
}

/**
 * Seed data for services (V2)
 */
async function seedServices() {
  console.log("🔧 Seeding Services...");
  const container = database.container("Services");

  const services = [
    {
      id: "service-file-management",
      tenantId: "system-internal",
      name: "file-management",
      displayName: {
        ja: "ファイル管理",
        en: "File Management",
      },
      description: {
        ja: "安全なファイルストレージと管理機能を提供します",
        en: "Provides secure file storage and management capabilities",
      },
      category: "storage",
      icon: "folder-icon",
      status: "active",
      requiredPlan: ["basic", "professional", "enterprise"],
      features: [
        {
          key: "upload",
          displayName: { ja: "ファイルアップロード", en: "File Upload" },
          description: {
            ja: "ファイルをアップロードできます",
            en: "Upload files",
          },
          enabled: true,
        },
        {
          key: "versioning",
          displayName: { ja: "バージョン管理", en: "Versioning" },
          description: {
            ja: "ファイルのバージョンを管理",
            en: "Manage file versions",
          },
          enabled: true,
        },
      ],
      pricing: [
        {
          plan: "basic",
          price: 1000,
          currency: "JPY",
          billingCycle: "monthly",
        },
        {
          plan: "professional",
          price: 2500,
          currency: "JPY",
          billingCycle: "monthly",
        },
        {
          plan: "enterprise",
          price: 5000,
          currency: "JPY",
          billingCycle: "monthly",
        },
      ],
      metadata: {
        version: "1.0.0",
        releaseDate: "2026-01-01T00:00:00Z",
        deprecated: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system",
      updatedBy: "system",
    },
    {
      id: "service-external-sharing",
      tenantId: "system-internal",
      name: "external-sharing",
      displayName: {
        ja: "外部共有",
        en: "External Sharing",
      },
      description: {
        ja: "外部ユーザーとのセキュアなファイル共有機能を提供します",
        en: "Provides secure file sharing capabilities with external users",
      },
      category: "collaboration",
      icon: "share-icon",
      status: "active",
      requiredPlan: ["professional", "enterprise"],
      features: [
        {
          key: "public-links",
          displayName: { ja: "公開リンク", en: "Public Links" },
          description: {
            ja: "公開リンクでファイルを共有",
            en: "Share files via public links",
          },
          enabled: true,
        },
        {
          key: "password-protection",
          displayName: { ja: "パスワード保護", en: "Password Protection" },
          description: {
            ja: "共有リンクをパスワードで保護",
            en: "Protect shared links with passwords",
          },
          enabled: true,
        },
      ],
      pricing: [
        {
          plan: "professional",
          price: 1500,
          currency: "JPY",
          billingCycle: "monthly",
        },
        {
          plan: "enterprise",
          price: 3000,
          currency: "JPY",
          billingCycle: "monthly",
        },
      ],
      metadata: {
        version: "1.0.0",
        releaseDate: "2026-01-01T00:00:00Z",
        deprecated: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system",
      updatedBy: "system",
    },
    {
      id: "service-ai-agent",
      tenantId: "system-internal",
      name: "ai-agent",
      displayName: {
        ja: "AIエージェント",
        en: "AI Agent",
      },
      description: {
        ja: "インテリジェントなAIアシスタント機能を提供します",
        en: "Provides intelligent AI assistant capabilities",
      },
      category: "ai",
      icon: "ai-icon",
      status: "beta",
      requiredPlan: ["enterprise"],
      features: [
        {
          key: "chat-assistant",
          displayName: { ja: "チャットアシスタント", en: "Chat Assistant" },
          description: {
            ja: "自然言語でのチャットサポート",
            en: "Natural language chat support",
          },
          enabled: true,
        },
        {
          key: "document-analysis",
          displayName: { ja: "ドキュメント分析", en: "Document Analysis" },
          description: {
            ja: "ドキュメントの自動分析と要約",
            en: "Automatic document analysis and summarization",
          },
          enabled: true,
        },
      ],
      pricing: [
        {
          plan: "enterprise",
          price: 10000,
          currency: "JPY",
          billingCycle: "monthly",
        },
      ],
      metadata: {
        version: "0.9.0",
        releaseDate: "2026-01-10T00:00:00Z",
        deprecated: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system",
      updatedBy: "system",
    },
  ];

  for (const service of services) {
    await container.items.upsert(service);
    console.log(`  ✅ Created service: ${service.name} (${service.status})`);
  }
}

/**
 * Seed data for tenant users (V2) - Multi-tenant memberships
 */
async function seedTenantUsers(
  userIds: { [key: string]: string },
  tenantIds: string[]
) {
  console.log("🔗 Seeding TenantUsers (Multi-tenant memberships)...");
  const container = database.container("TenantUsers");

  const tenantUsers = [
    // Internal admin in system-internal
    {
      id: `tenantuser-${uuidv4()}`,
      userId: userIds.internalAdminId,
      tenantId: tenantIds[0], // system-internal
      roles: ["global-admin", "user"],
      permissions: [
        "system.*",
        "users.*",
        "services.*",
        "settings.*",
        "permissions.*",
        "audit.*",
      ],
      status: "active",
      joinedAt: new Date("2026-01-01").toISOString(),
      leftAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system",
      updatedBy: "system",
    },
    // Multi-tenant user in system-internal
    {
      id: `tenantuser-${uuidv4()}`,
      userId: userIds.multiTenantUserId,
      tenantId: tenantIds[0], // system-internal
      roles: ["support", "user"],
      permissions: ["users.read", "services.read", "settings.read"],
      status: "active",
      joinedAt: new Date("2026-01-01").toISOString(),
      leftAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userIds.internalAdminId,
      updatedBy: userIds.internalAdminId,
    },
    // Multi-tenant user in dev-tenant
    {
      id: `tenantuser-${uuidv4()}`,
      userId: userIds.multiTenantUserId,
      tenantId: tenantIds[1], // dev-tenant
      roles: ["support", "user"],
      permissions: ["users.read", "services.read"],
      status: "active",
      joinedAt: new Date("2026-01-05").toISOString(),
      leftAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userIds.internalAdminId,
      updatedBy: userIds.internalAdminId,
    },
    // Dev-tenant admin
    {
      id: `tenantuser-${uuidv4()}`,
      userId: userIds.adminUserId,
      tenantId: tenantIds[1], // dev-tenant
      roles: ["admin", "user"],
      permissions: [
        "users.create",
        "users.read",
        "users.update",
        "users.delete",
        "services.create",
        "services.read",
        "services.update",
        "services.delete",
        "settings.read",
        "settings.update",
        "permissions.read",
        "permissions.update",
        "audit.read",
      ],
      status: "active",
      joinedAt: new Date("2026-01-02").toISOString(),
      leftAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system",
      updatedBy: "system",
    },
    // Dev-tenant regular user
    {
      id: `tenantuser-${uuidv4()}`,
      userId: userIds.regularUserId,
      tenantId: tenantIds[1], // dev-tenant
      roles: ["user"],
      permissions: ["users.read", "services.read", "settings.read"],
      status: "active",
      joinedAt: new Date("2026-01-02").toISOString(),
      leftAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userIds.adminUserId,
      updatedBy: userIds.adminUserId,
    },
  ];

  for (const tenantUser of tenantUsers) {
    await container.items.upsert(tenantUser);
  }

  console.log(`  ✅ Created ${tenantUsers.length} TenantUser records`);
  console.log(
    `     Multi-tenant user (${userIds.multiTenantUserId}) is now in 2 tenants`
  );
}

/**
 * Seed data for permissions
 */
async function seedPermissions(tenantId: string) {
  console.log("🔐 Seeding Permissions...");
  const container = database.container("Permissions");

  const permissions = [
    // User permissions
    {
      name: "users.create",
      displayName: "Create User",
      description: "Permission to create new users",
      category: "users",
      resource: "users",
      action: "create",
      requiredPlan: "basic",
      metadata: {
        uiSection: "User Management",
        uiButton: "Create User",
        requiresConfirmation: true,
      },
    },
    {
      name: "users.read",
      displayName: "View Users",
      description: "Permission to view user information",
      category: "users",
      resource: "users",
      action: "read",
      requiredPlan: "free",
      metadata: {
        uiSection: "User Management",
        uiButton: "View Users",
        requiresConfirmation: false,
      },
    },
    {
      name: "users.update",
      displayName: "Update User",
      description: "Permission to update user information",
      category: "users",
      resource: "users",
      action: "update",
      requiredPlan: "basic",
      metadata: {
        uiSection: "User Management",
        uiButton: "Edit User",
        requiresConfirmation: true,
      },
    },
    {
      name: "users.delete",
      displayName: "Delete User",
      description: "Permission to delete users",
      category: "users",
      resource: "users",
      action: "delete",
      requiredPlan: "professional",
      metadata: {
        uiSection: "User Management",
        uiButton: "Delete User",
        requiresConfirmation: true,
      },
    },
    // Service permissions
    {
      name: "services.create",
      displayName: "Create Service",
      description: "Permission to create new services",
      category: "services",
      resource: "services",
      action: "create",
      requiredPlan: "professional",
      metadata: {
        uiSection: "Service Management",
        uiButton: "Create Service",
        requiresConfirmation: true,
      },
    },
    {
      name: "services.read",
      displayName: "View Services",
      description: "Permission to view service information",
      category: "services",
      resource: "services",
      action: "read",
      requiredPlan: "free",
      metadata: {
        uiSection: "Service Management",
        uiButton: "View Services",
        requiresConfirmation: false,
      },
    },
    {
      name: "services.update",
      displayName: "Update Service",
      description: "Permission to update service settings",
      category: "services",
      resource: "services",
      action: "update",
      requiredPlan: "professional",
      metadata: {
        uiSection: "Service Management",
        uiButton: "Edit Service",
        requiresConfirmation: true,
      },
    },
    {
      name: "services.delete",
      displayName: "Delete Service",
      description: "Permission to delete services",
      category: "services",
      resource: "services",
      action: "delete",
      requiredPlan: "enterprise",
      metadata: {
        uiSection: "Service Management",
        uiButton: "Delete Service",
        requiresConfirmation: true,
      },
    },
    // Settings permissions
    {
      name: "settings.read",
      displayName: "View Settings",
      description: "Permission to view tenant settings",
      category: "settings",
      resource: "settings",
      action: "read",
      requiredPlan: "free",
      metadata: {
        uiSection: "Settings",
        uiButton: "View Settings",
        requiresConfirmation: false,
      },
    },
    {
      name: "settings.update",
      displayName: "Update Settings",
      description: "Permission to modify tenant settings",
      category: "settings",
      resource: "settings",
      action: "update",
      requiredPlan: "basic",
      metadata: {
        uiSection: "Settings",
        uiButton: "Edit Settings",
        requiresConfirmation: true,
      },
    },
    // Permission management
    {
      name: "permissions.read",
      displayName: "View Permissions",
      description: "Permission to view permission definitions",
      category: "system",
      resource: "permissions",
      action: "read",
      requiredPlan: "basic",
      metadata: {
        uiSection: "Permission Management",
        uiButton: "View Permissions",
        requiresConfirmation: false,
      },
    },
    {
      name: "permissions.update",
      displayName: "Manage Permissions",
      description: "Permission to create and update permission definitions",
      category: "system",
      resource: "permissions",
      action: "update",
      requiredPlan: "enterprise",
      metadata: {
        uiSection: "Permission Management",
        uiButton: "Manage Permissions",
        requiresConfirmation: true,
      },
    },
    // Audit permissions
    {
      name: "audit.read",
      displayName: "View Audit Logs",
      description: "Permission to view audit logs",
      category: "system",
      resource: "audit",
      action: "read",
      requiredPlan: "professional",
      metadata: {
        uiSection: "Audit Logs",
        uiButton: "View Audit Logs",
        requiresConfirmation: false,
      },
    },
  ];

  for (const perm of permissions) {
    const permission = {
      id: `permission-${uuidv4()}`,
      tenantId: tenantId,
      ...perm,
      scope: "tenant",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system",
      updatedBy: "system",
    };

    await container.items.upsert(permission);
    console.log(`  ✅ Created permission: ${permission.name}`);
  }
}

/**
 * Seed sample audit logs
 */
async function seedAuditLogs(tenantId: string, userId: string) {
  console.log("📝 Seeding Audit Logs...");
  const container = database.container("AuditLogs");

  const logs = [
    {
      id: `log-${uuidv4()}`,
      tenantId: tenantId,
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      userId: userId,
      userName: "admin",
      action: "user.create",
      resource: {
        type: "User",
        id: "user-789",
        name: "user@example.com",
      },
      details: {
        changes: null,
        reason: "Initial user setup",
      },
      metadata: {
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        requestId: `req-${uuidv4()}`,
        sessionId: `session-${uuidv4()}`,
      },
      status: "success",
      ttl: 7776000, // 90 days
    },
    {
      id: `log-${uuidv4()}`,
      tenantId: tenantId,
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      userId: userId,
      userName: "admin",
      action: "permission.create",
      resource: {
        type: "Permission",
        id: "permission-123",
        name: "users.create",
      },
      details: {
        changes: null,
        reason: "Initial permission setup",
      },
      metadata: {
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        requestId: `req-${uuidv4()}`,
        sessionId: `session-${uuidv4()}`,
      },
      status: "success",
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
/**
 * Check if a container exists
 */
async function containerExists(containerName: string): Promise<boolean> {
  try {
    await database.container(containerName).read();
    return true;
  } catch (error: any) {
    if (error.code === 404) {
      return false;
    }
    throw error;
  }
}

async function seedData() {
  console.log("🌱 Starting data seeding...");
  console.log(`📍 Endpoint: ${config.endpoint}`);
  console.log(`📁 Database: ${config.databaseId}`);
  console.log("");

  try {
    // Check which containers are available
    const hasServicesContainer = await containerExists("Services");
    const hasTenantUsersContainer = await containerExists("TenantUsers");

    if (!hasServicesContainer) {
      console.log(
        "⚠️  Services container not found - skipping service seeding"
      );
    }
    if (!hasTenantUsersContainer) {
      console.log(
        "⚠️  TenantUsers container not found - skipping tenant users seeding"
      );
    }
    console.log("");

    // V2: Seed in order due to dependencies
    // 1. Create system-internal tenant first
    const systemTenantId = await seedSystemInternalTenant();

    // 2. Create development tenant
    const devTenantId = await seedTenants();

    // 3. Create services (goes into system-internal tenant) - OPTIONAL
    if (hasServicesContainer) {
      await seedServices();
    }

    // 4. Create internal users (for system-internal tenant)
    const { internalAdminId, multiTenantUserId } = await seedInternalUsers(
      systemTenantId
    );

    // 5. Create external users (for dev-tenant)
    const { adminUserId, regularUserId } = await seedUsers(devTenantId);

    // 6. Create TenantUsers for multi-tenant memberships - OPTIONAL
    if (hasTenantUsersContainer) {
      await seedTenantUsers(
        { internalAdminId, multiTenantUserId, adminUserId, regularUserId },
        [systemTenantId, devTenantId]
      );
    }

    // 7. Create permissions
    await seedPermissions(devTenantId);

    // 8. Create audit logs
    await seedAuditLogs(devTenantId, adminUserId);

    console.log("");
    console.log("🎉 Data seeding completed successfully!");
    console.log("");
    console.log("📊 Summary:");
    console.log("  - Tenants: 2 (system-internal, dev-tenant)");
    console.log("  - Users: 4 (2 internal, 2 external)");
    if (hasServicesContainer) {
      console.log(
        "  - Services: 3 (file-management, external-sharing, ai-agent)"
      );
    } else {
      console.log("  - Services: ⚠️  Skipped (container not available)");
    }
    if (hasTenantUsersContainer) {
      console.log("  - TenantUsers: 5 (1 user in 2 tenants)");
    } else {
      console.log("  - TenantUsers: ⚠️  Skipped (container not available)");
    }
    console.log("  - Permissions: 13");
    console.log("  - Audit Logs: 2");
    console.log("");
    console.log("🔐 Default Credentials:");
    console.log("  Internal Admin: admin@company.com / InternalAdmin@123");
    console.log("  Multi-tenant Support: support@company.com / Support@123");
    console.log("  Dev Tenant Admin: admin@example.com / Admin@123");
    console.log("  Dev Tenant User: user@example.com / User@123");
    console.log("");
    console.log("⚠️  IMPORTANT: These are development-only credentials!");
    console.log(
      "⚠️  Change all passwords before deploying to staging or production!"
    );
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

/**
 * Entry point
 */
async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  CosmosDB Seed Data");
  console.log("  SaaS Management Application");
  console.log("═══════════════════════════════════════════════════════");
  console.log("");

  await seedData();
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { seedData };
