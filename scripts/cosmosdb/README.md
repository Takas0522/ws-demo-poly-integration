# CosmosDB Scripts

This directory contains scripts for initializing and managing the CosmosDB database for the SaaS Management Application.

## 📁 Files

- **`init-database.ts`** - Creates the database and containers with proper configuration
- **`seed-data.ts`** - Populates the database with initial development data
- **`types.ts`** - TypeScript type definitions for all database models
- **`README.md`** - This file

## 🚀 Quick Start

### Prerequisites

1. CosmosDB Emulator running locally OR Azure CosmosDB instance
2. Node.js 18+ and npm installed
3. Required npm packages:

```bash
npm install @azure/cosmos bcryptjs uuid
npm install --save-dev @types/bcryptjs @types/uuid ts-node typescript
```

### Setup Environment Variables

Create a `.env` file or set environment variables:

```bash
COSMOSDB_ENDPOINT=https://localhost:8081
COSMOSDB_KEY=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==
COSMOSDB_DATABASE=saas-management-dev
```

### Initialize Database

Run the initialization script to create the database and containers:

```bash
# Using ts-node
npx ts-node scripts/cosmosdb/init-database.ts

# Or compile first
tsc scripts/cosmosdb/init-database.ts
node scripts/cosmosdb/init-database.js
```

This will create:
- Database: `saas-management-dev`
- Containers:
  - **Tenants** - Tenant/organization information
  - **Users** - User accounts and profiles
  - **Permissions** - Permission definitions
  - **AuditLogs** - Audit trail (with 90-day TTL)

### Seed Development Data

Run the seed script to populate initial data:

```bash
npx ts-node scripts/cosmosdb/seed-data.ts
```

This will create:
- 1 default tenant (`dev-tenant`)
- 2 users (admin and regular user)
- 13 permission definitions
- 2 sample audit log entries

**Default Credentials:**
- **Admin User**
  - Email: `admin@example.com`
  - Password: `Admin@123`
  - Roles: admin, user
  
- **Regular User**
  - Email: `user@example.com`
  - Password: `User@123`
  - Roles: user

⚠️ **IMPORTANT:** Change these passwords before deploying to production!

## 📊 Database Schema

### Tenants Container

Stores tenant (customer organization) information.

**Partition Key:** `/tenantId`

**Key Fields:**
- `id` - Unique tenant identifier
- `tenantId` - Same as id (partition key)
- `name` - Organization name
- `status` - Tenant status (active, suspended, inactive)
- `subscription` - Subscription plan and details
- `settings` - Tenant-specific settings

### Users Container

Stores user accounts and authentication information.

**Partition Key:** `/tenantId`

**Key Fields:**
- `id` - Unique user identifier
- `tenantId` - Tenant identifier (partition key)
- `email` - User email address
- `username` - Username
- `passwordHash` - Bcrypt hashed password
- `status` - User status (active, inactive, suspended, locked)
- `roles` - Array of role names
- `permissions` - Array of dot-notation permissions
- `profile` - User profile information
- `security` - Security-related fields

### Permissions Container

Stores dot-notation permission definitions.

**Partition Key:** `/tenantId`

**Key Fields:**
- `id` - Unique permission identifier
- `tenantId` - Tenant identifier (partition key)
- `name` - Dot-notation permission name (e.g., `users.create`)
- `category` - Permission category (users, services, settings, system)
- `action` - Action type (create, read, update, delete, execute)
- `scope` - Permission scope (tenant, global, own)

### AuditLogs Container

Stores audit trail of all data changes.

**Partition Key:** `/tenantId`

**TTL:** 7,776,000 seconds (90 days)

**Key Fields:**
- `id` - Unique log identifier
- `tenantId` - Tenant identifier (partition key)
- `timestamp` - Action timestamp
- `userId` - User who performed the action
- `action` - Action performed (format: `{resource}.{action}`)
- `resource` - Resource information
- `status` - Action status (success, failure, warning)
- `ttl` - Time to live in seconds

## 🔍 Querying Data

### Point Read (Most Efficient - 1 RU)

```typescript
import { CosmosClient } from '@azure/cosmos';

const client = new CosmosClient({ endpoint, key });
const container = client.database(databaseId).container('Users');

// Most efficient query - requires both ID and partition key
const { resource: user } = await container
  .item('user-123', 'tenant-456')
  .read();
```

### Single Partition Query (Efficient)

```typescript
// Query within a single tenant partition
const querySpec = {
  query: 'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status = @status',
  parameters: [
    { name: '@tenantId', value: 'tenant-123' },
    { name: '@status', value: 'active' }
  ]
};

const { resources: users } = await container.items
  .query(querySpec)
  .fetchAll();
```

### Pagination

```typescript
// Efficient pagination for large result sets
const queryIterator = container.items.query(querySpec, {
  maxItemCount: 20
});

while (queryIterator.hasMoreResults()) {
  const { resources: page } = await queryIterator.fetchNext();
  // Process page
}
```

## 🛠️ Maintenance Scripts

### Backup Data

```bash
# Export all data to JSON files
az cosmosdb sql container export \
  --resource-group myResourceGroup \
  --account-name myCosmosAccount \
  --database-name saas-management \
  --name Users \
  --output-format json
```

### Monitor RU Usage

```typescript
// Track Request Units consumed by queries
const { resources, requestCharge } = await container.items
  .query(querySpec)
  .fetchAll();

console.log(`Query consumed ${requestCharge} RUs`);
```

### Update Indexing Policy

```typescript
// Modify indexing policy after container creation
const { resource: containerDef } = await container.read();
containerDef.indexingPolicy = newIndexingPolicy;
await container.replace(containerDef);
```

## 🔐 Security Best Practices

1. **Never commit secrets** - Keep CosmosDB keys out of version control
2. **Use environment variables** - Store credentials in environment variables or Azure Key Vault
3. **Rotate keys regularly** - Regenerate CosmosDB keys periodically
4. **Validate tenant context** - Always verify tenantId from authentication token
5. **Hash passwords** - Use bcrypt with minimum 10 salt rounds
6. **Encrypt sensitive data** - Encrypt two-factor secrets and PII before storing
7. **Enable audit logging** - Log all data access and modifications

## 📈 Performance Optimization

### Best Practices

1. ✅ **Always include partition key** in queries
2. ✅ **Use point reads** when you know both ID and partition key
3. ✅ **Implement pagination** for large result sets
4. ✅ **Monitor RU consumption** and optimize queries
5. ✅ **Only index fields you query** on
6. ✅ **Use TTL** for temporary data
7. ❌ **Avoid cross-partition queries** in user-facing flows
8. ❌ **Don't use SELECT *** when you only need specific fields

### Query Cost Comparison

| Query Type | Estimated RU Cost | Use Case |
|------------|------------------|----------|
| Point Read | 1 RU | Get single item by ID |
| Single Partition Query | 2-10 RUs | Query within one tenant |
| Cross-Partition Query | 10-100+ RUs | Admin/analytics only |
| Full Scan | 100-1000+ RUs | Avoid in production |

## 🔗 References

- [Schema Documentation](../../docs/database/SCHEMA.md)
- [ADR 003: CosmosDB Schema Design](../../docs/adr/003-cosmosdb-schema-tenant-partitioning.md)
- [Azure CosmosDB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
- [Partitioning Best Practices](https://docs.microsoft.com/azure/cosmos-db/partitioning-overview)

## 📝 Changelog

### 2026-01-09
- Initial database schema design
- Created initialization and seed scripts
- Defined TypeScript types
- Documented schema and access patterns

---

**Last Updated:** 2026-01-09
