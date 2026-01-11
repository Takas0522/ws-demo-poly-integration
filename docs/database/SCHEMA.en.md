# CosmosDB Schema Documentation

## Overview

This document provides a comprehensive guide to the CosmosDB database schema for the SaaS Management Application. The schema is designed with multi-tenancy in mind, using tenant ID as the partition key across all containers.

## Database Information

- **Database Name**: `saas-management` (production), `saas-management-dev` (development)
- **API**: SQL API (Core)
- **Partition Strategy**: Tenant-based partitioning using `/tenantId`
- **Consistency Level**: Session (default for most operations)

## Containers

### 1. Tenants Container

**Purpose**: Stores tenant (customer organization) information and subscription details.

**Partition Key**: `/tenantId`

**Throughput**: 400 RU/s (Manual) or Autoscale (400-4000 RU/s)

#### Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique tenant identifier (format: `tenant-{uuid}`) |
| tenantId | string | Yes | Same as id, used as partition key |
| name | string | Yes | Tenant organization name |
| status | string | Yes | Tenant status: `active`, `suspended`, `inactive` |
| subscription | object | Yes | Subscription details |
| subscription.plan | string | Yes | Plan type: `free`, `basic`, `professional`, `enterprise` |
| subscription.startDate | string | Yes | ISO 8601 date string |
| subscription.endDate | string | Yes | ISO 8601 date string |
| subscription.maxUsers | number | Yes | Maximum allowed users |
| settings | object | No | Tenant-specific settings |
| settings.timezone | string | No | IANA timezone identifier |
| settings.locale | string | No | Locale identifier (e.g., `ja-JP`, `en-US`) |
| settings.features | object | No | Feature flags for the tenant |
| createdAt | string | Yes | ISO 8601 timestamp |
| updatedAt | string | Yes | ISO 8601 timestamp |
| createdBy | string | Yes | User ID who created the record |
| updatedBy | string | Yes | User ID who last updated the record |

#### Example Document

```json
{
  "id": "tenant-123",
  "tenantId": "tenant-123",
  "name": "Acme Corporation",
  "status": "active",
  "subscription": {
    "plan": "enterprise",
    "startDate": "2026-01-01T00:00:00Z",
    "endDate": "2027-01-01T00:00:00Z",
    "maxUsers": 100
  },
  "settings": {
    "timezone": "Asia/Tokyo",
    "locale": "ja-JP",
    "features": {
      "twoFactorAuth": true,
      "apiAccess": true,
      "advancedReporting": false
    }
  },
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-09T00:00:00Z",
  "createdBy": "system",
  "updatedBy": "admin-user-id"
}
```

#### Indexing Policy

```json
{
  "indexingMode": "consistent",
  "automatic": true,
  "includedPaths": [
    {"path": "/tenantId/?"},
    {"path": "/status/?"},
    {"path": "/subscription/plan/?"},
    {"path": "/createdAt/?"}
  ],
  "excludedPaths": [
    {"path": "/settings/*"},
    {"path": "/_etag/?"}
  ]
}
```

#### Common Queries

```typescript
// Get active tenant by ID
const tenant = await container.item("tenant-123", "tenant-123").read();

// Get all active tenants (cross-partition - admin only)
SELECT * FROM c WHERE c.status = 'active'

// Get tenants by subscription plan (cross-partition - admin only)
SELECT * FROM c WHERE c.subscription.plan = 'enterprise'
```

---

### 2. Users Container

**Purpose**: Stores user accounts, profiles, and authentication information.

**Partition Key**: `/tenantId`

**Throughput**: 400 RU/s (Manual) or Autoscale (400-4000 RU/s)

#### Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique user identifier (format: `user-{uuid}`) |
| tenantId | string | Yes | Tenant identifier (partition key) |
| email | string | Yes | User email address (unique within tenant) |
| username | string | Yes | Username (unique within tenant) |
| firstName | string | Yes | User's first name |
| lastName | string | Yes | User's last name |
| passwordHash | string | Yes | Bcrypt hashed password |
| status | string | Yes | User status: `active`, `inactive`, `suspended`, `locked` |
| roles | string[] | Yes | Array of role names |
| permissions | string[] | Yes | Array of dot-notation permissions |
| profile | object | No | User profile information |
| profile.phoneNumber | string | No | Phone number |
| profile.department | string | No | Department name |
| profile.jobTitle | string | No | Job title |
| profile.avatarUrl | string | No | Avatar image URL |
| security | object | Yes | Security-related fields |
| security.lastLoginAt | string | No | Last login timestamp |
| security.lastPasswordChangeAt | string | Yes | Last password change timestamp |
| security.failedLoginAttempts | number | Yes | Failed login attempt counter |
| security.lockedUntil | string | No | Account lock expiry timestamp |
| security.twoFactorEnabled | boolean | Yes | Two-factor authentication status |
| security.twoFactorSecret | string | No | TOTP secret (encrypted) |
| createdAt | string | Yes | ISO 8601 timestamp |
| updatedAt | string | Yes | ISO 8601 timestamp |
| createdBy | string | Yes | User ID who created the record |
| updatedBy | string | Yes | User ID who last updated the record |

#### Example Document

```json
{
  "id": "user-456",
  "tenantId": "tenant-123",
  "email": "user@example.com",
  "username": "john.doe",
  "firstName": "John",
  "lastName": "Doe",
  "passwordHash": "$2b$10$...",
  "status": "active",
  "roles": ["admin", "user"],
  "permissions": [
    "users.create",
    "users.read",
    "users.update",
    "services.read"
  ],
  "profile": {
    "phoneNumber": "+81-90-1234-5678",
    "department": "Engineering",
    "jobTitle": "Senior Developer",
    "avatarUrl": "https://example.com/avatars/user-456.jpg"
  },
  "security": {
    "lastLoginAt": "2026-01-09T10:00:00Z",
    "lastPasswordChangeAt": "2026-01-01T00:00:00Z",
    "failedLoginAttempts": 0,
    "lockedUntil": null,
    "twoFactorEnabled": false,
    "twoFactorSecret": null
  },
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-09T00:00:00Z",
  "createdBy": "admin-user-id",
  "updatedBy": "admin-user-id"
}
```

#### Indexing Policy

```json
{
  "indexingMode": "consistent",
  "automatic": true,
  "includedPaths": [
    {"path": "/tenantId/?"},
    {"path": "/email/?"},
    {"path": "/username/?"},
    {"path": "/status/?"},
    {"path": "/roles/*"},
    {"path": "/permissions/*"},
    {"path": "/createdAt/?"},
    {"path": "/updatedAt/?"}
  ],
  "excludedPaths": [
    {"path": "/passwordHash/?"},
    {"path": "/profile/*"},
    {"path": "/security/twoFactorSecret/?"},
    {"path": "/_etag/?"}
  ],
  "compositeIndexes": [
    [
      {"path": "/tenantId", "order": "ascending"},
      {"path": "/email", "order": "ascending"}
    ],
    [
      {"path": "/tenantId", "order": "ascending"},
      {"path": "/status", "order": "ascending"}
    ]
  ]
}
```

#### Common Queries

```typescript
// Get user by ID (point read - most efficient)
const user = await container.item("user-456", "tenant-123").read();

// Get users by tenant (single partition query)
SELECT * FROM c 
WHERE c.tenantId = 'tenant-123' 
AND c.status = 'active'
ORDER BY c.createdAt DESC

// Get user by email within tenant
SELECT * FROM c 
WHERE c.tenantId = 'tenant-123' 
AND c.email = 'user@example.com'

// Get users with specific permission
SELECT * FROM c 
WHERE c.tenantId = 'tenant-123' 
AND ARRAY_CONTAINS(c.permissions, 'users.create')

// Get users by role
SELECT * FROM c 
WHERE c.tenantId = 'tenant-123' 
AND ARRAY_CONTAINS(c.roles, 'admin')
```

---

### 3. Permissions Container

**Purpose**: Stores dot-notation permission definitions for fine-grained access control.

**Partition Key**: `/tenantId`

**Throughput**: 400 RU/s (Manual) or Autoscale (400-4000 RU/s)

#### Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique permission identifier (format: `permission-{uuid}`) |
| tenantId | string | Yes | Tenant identifier (partition key) |
| name | string | Yes | Dot-notation permission name (e.g., `users.create`) |
| displayName | string | Yes | Human-readable display name |
| description | string | Yes | Permission description |
| category | string | Yes | Permission category: `users`, `services`, `settings`, `system` |
| resource | string | Yes | Resource name (e.g., `users`, `services`) |
| action | string | Yes | Action type: `create`, `read`, `update`, `delete`, `execute` |
| scope | string | Yes | Permission scope: `tenant`, `global`, `own` |
| isActive | boolean | Yes | Whether permission is active |
| requiredPlan | string | No | Minimum subscription plan required |
| metadata | object | No | Additional metadata |
| metadata.uiSection | string | No | UI section name |
| metadata.uiButton | string | No | UI button label |
| metadata.requiresConfirmation | boolean | No | Whether action requires confirmation |
| createdAt | string | Yes | ISO 8601 timestamp |
| updatedAt | string | Yes | ISO 8601 timestamp |
| createdBy | string | Yes | User ID who created the record |
| updatedBy | string | Yes | User ID who last updated the record |

#### Example Document

```json
{
  "id": "permission-789",
  "tenantId": "tenant-123",
  "name": "users.create",
  "displayName": "Create User",
  "description": "Permission to create new users",
  "category": "users",
  "resource": "users",
  "action": "create",
  "scope": "tenant",
  "isActive": true,
  "requiredPlan": "basic",
  "metadata": {
    "uiSection": "User Management",
    "uiButton": "Create User",
    "requiresConfirmation": true
  },
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-09T00:00:00Z",
  "createdBy": "system",
  "updatedBy": "system"
}
```

#### Indexing Policy

```json
{
  "indexingMode": "consistent",
  "automatic": true,
  "includedPaths": [
    {"path": "/tenantId/?"},
    {"path": "/name/?"},
    {"path": "/category/?"},
    {"path": "/resource/?"},
    {"path": "/action/?"},
    {"path": "/isActive/?"}
  ],
  "excludedPaths": [
    {"path": "/metadata/*"},
    {"path": "/_etag/?"}
  ]
}
```

#### Common Queries

```typescript
// Get permission by ID
const permission = await container.item("permission-789", "tenant-123").read();

// Get all active permissions for tenant
SELECT * FROM c 
WHERE c.tenantId = 'tenant-123' 
AND c.isActive = true
ORDER BY c.category, c.name

// Get permissions by category
SELECT * FROM c 
WHERE c.tenantId = 'tenant-123' 
AND c.category = 'users'

// Get permission by name
SELECT * FROM c 
WHERE c.tenantId = 'tenant-123' 
AND c.name = 'users.create'
```

---

### 4. AuditLogs Container

**Purpose**: Stores audit trail of all data changes and user actions.

**Partition Key**: `/tenantId`

**Throughput**: 400 RU/s (Manual) or Autoscale (400-4000 RU/s)

**TTL**: Enabled with default TTL of 7,776,000 seconds (90 days)

#### Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique log identifier (format: `log-{uuid}`) |
| tenantId | string | Yes | Tenant identifier (partition key) |
| timestamp | string | Yes | ISO 8601 timestamp of the action |
| userId | string | Yes | User who performed the action |
| userName | string | Yes | Username for quick reference |
| action | string | Yes | Action performed (format: `{resource}.{action}`) |
| resource | object | Yes | Resource information |
| resource.type | string | Yes | Resource type (e.g., `User`, `Tenant`) |
| resource.id | string | Yes | Resource identifier |
| resource.name | string | No | Resource name for quick reference |
| details | object | No | Action details |
| details.changes | object | No | Before/after values for updates |
| details.reason | string | No | Reason for the action |
| metadata | object | No | Request metadata |
| metadata.ipAddress | string | No | Client IP address |
| metadata.userAgent | string | No | User agent string |
| metadata.requestId | string | No | Request identifier |
| metadata.sessionId | string | No | Session identifier |
| status | string | Yes | Action status: `success`, `failure`, `warning` |
| ttl | number | No | Time to live in seconds (-1 for no expiry) |

#### Example Document

```json
{
  "id": "log-101112",
  "tenantId": "tenant-123",
  "timestamp": "2026-01-09T12:00:00Z",
  "userId": "user-456",
  "userName": "john.doe",
  "action": "user.update",
  "resource": {
    "type": "User",
    "id": "user-789",
    "name": "jane.smith"
  },
  "details": {
    "changes": {
      "roles": {
        "before": ["user"],
        "after": ["user", "admin"]
      }
    },
    "reason": "Promoted to admin role"
  },
  "metadata": {
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "requestId": "req-123456",
    "sessionId": "session-789"
  },
  "status": "success",
  "ttl": 7776000
}
```

#### Indexing Policy

```json
{
  "indexingMode": "consistent",
  "automatic": true,
  "includedPaths": [
    {"path": "/tenantId/?"},
    {"path": "/timestamp/?"},
    {"path": "/userId/?"},
    {"path": "/action/?"},
    {"path": "/resource/type/?"},
    {"path": "/status/?"}
  ],
  "excludedPaths": [
    {"path": "/details/*"},
    {"path": "/metadata/*"},
    {"path": "/_etag/?"}
  ],
  "compositeIndexes": [
    [
      {"path": "/tenantId", "order": "ascending"},
      {"path": "/timestamp", "order": "descending"}
    ],
    [
      {"path": "/tenantId", "order": "ascending"},
      {"path": "/userId", "order": "ascending"},
      {"path": "/timestamp", "order": "descending"}
    ]
  ]
}
```

#### Common Queries

```typescript
// Get recent audit logs for tenant (with pagination)
SELECT * FROM c 
WHERE c.tenantId = 'tenant-123'
ORDER BY c.timestamp DESC
OFFSET 0 LIMIT 50

// Get audit logs by user
SELECT * FROM c 
WHERE c.tenantId = 'tenant-123' 
AND c.userId = 'user-456'
ORDER BY c.timestamp DESC

// Get audit logs by action
SELECT * FROM c 
WHERE c.tenantId = 'tenant-123' 
AND c.action = 'user.delete'
ORDER BY c.timestamp DESC

// Get failed actions
SELECT * FROM c 
WHERE c.tenantId = 'tenant-123' 
AND c.status = 'failure'
ORDER BY c.timestamp DESC
```

---

## Data Access Patterns

### Pattern 1: Point Read (Most Efficient)

Use when you know both the ID and partition key:

```typescript
const { resource } = await container.item(id, tenantId).read();
// Cost: 1 RU
```

### Pattern 2: Single Partition Query (Efficient)

Query within a single tenant partition:

```typescript
const querySpec = {
  query: "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status = @status",
  parameters: [
    { name: "@tenantId", value: "tenant-123" },
    { name: "@status", value: "active" }
  ]
};
const { resources } = await container.items.query(querySpec).fetchAll();
// Cost: ~2-10 RUs depending on result size
```

### Pattern 3: Cross-Partition Query (Use Sparingly)

Query across multiple tenants (admin/analytics only):

```typescript
const querySpec = {
  query: "SELECT * FROM c WHERE c.status = @status",
  parameters: [{ name: "@status", value: "active" }]
};
const { resources } = await container.items.query(querySpec).fetchAll();
// Cost: High RU cost, avoid in production user flows
```

### Pattern 4: Pagination

Efficiently retrieve large result sets:

```typescript
const queryIterator = container.items.query(querySpec, {
  maxItemCount: 20
});

const pages = [];
while (queryIterator.hasMoreResults()) {
  const { resources } = await queryIterator.fetchNext();
  pages.push(resources);
}
```

### Pattern 5: Conditional Updates

Update with optimistic concurrency control:

```typescript
const { resource: item, headers } = await container.item(id, tenantId).read();
item.status = "updated";

await container.item(id, tenantId).replace(item, {
  accessCondition: { type: "IfMatch", condition: headers.etag }
});
```

## Performance Optimization

### Best Practices

1. **Always include tenantId**: Include partition key in all queries
2. **Use point reads**: Prefer `item(id, partitionKey).read()` over queries
3. **Implement pagination**: Never fetch all results at once
4. **Monitor RU consumption**: Track Request Unit usage in production
5. **Optimize indexes**: Only index fields you query on
6. **Use TTL for temporary data**: Enable TTL for audit logs and sessions
7. **Avoid cross-partition queries**: Reserve for admin/analytics only
8. **Batch operations**: Use bulk operations for multiple inserts/updates

### Anti-Patterns to Avoid

❌ Querying without partition key in user flows
❌ Using `SELECT *` when you only need specific fields
❌ Not implementing pagination for large result sets
❌ Over-indexing (indexing every field)
❌ Storing large documents (> 2MB)
❌ Frequent cross-partition queries

## Security Considerations

### Data Isolation

- Tenant ID partitioning ensures physical data separation
- Always validate tenantId in application layer
- Never trust client-provided tenant IDs
- Use middleware to inject tenant context from authentication

### Sensitive Data

- Password hashes: Use bcrypt with salt rounds >= 10
- Two-factor secrets: Encrypt before storing
- Audit logs: Never log passwords or secrets
- Personal data: Consider encryption for PII fields

### Access Control

- Implement row-level security in application layer
- Validate user permissions before database operations
- Log all data access and modifications
- Regular security audits of access patterns

## Monitoring and Maintenance

### Key Metrics to Monitor

- Request Units (RUs) per second
- Latency (P50, P95, P99)
- Throttling rate (429 errors)
- Storage usage per container
- Hot partitions

### Regular Maintenance Tasks

- Review and optimize index policies quarterly
- Monitor TTL effectiveness for audit logs
- Analyze query patterns and optimize
- Review and archive old data
- Test disaster recovery procedures

## Migration Strategy

### Schema Changes

1. **Additive Changes**: Add new fields with default values
2. **Field Removal**: Deprecate first, remove after grace period
3. **Breaking Changes**: Use `schemaVersion` field for gradual migration

### Example Migration Script

```typescript
// Migration to add new field
const items = await container.items.readAll().fetchAll();
for (const item of items.resources) {
  if (!item.schemaVersion) {
    item.schemaVersion = "1.0";
    item.newField = "default value";
    await container.item(item.id, item.tenantId).replace(item);
  }
}
```

---

## References

- [Azure CosmosDB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
- [Partitioning Best Practices](https://docs.microsoft.com/azure/cosmos-db/partitioning-overview)
- [SQL Query Reference](https://docs.microsoft.com/azure/cosmos-db/sql-query-getting-started)
- [ADR 003: CosmosDB Schema and Tenant Partitioning](../adr/003-cosmosdb-schema-tenant-partitioning.md)

**Last Updated**: 2026-01-09
