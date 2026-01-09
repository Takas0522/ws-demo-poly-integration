# CosmosDB Database Documentation

This directory contains comprehensive documentation for the CosmosDB database design and implementation for the SaaS Management Application.

## 📚 Documentation Index

### [SCHEMA.md](./SCHEMA.md)
Complete database schema documentation including:
- Container definitions (Tenants, Users, Permissions, AuditLogs)
- Field specifications and data types
- Indexing policies
- Example documents
- Common query examples
- Performance optimization guidelines
- Security considerations

### [DATA_ACCESS_PATTERNS.md](./DATA_ACCESS_PATTERNS.md)
Detailed guide to data access patterns:
- 9 comprehensive patterns with examples
- Request Unit (RU) cost analysis
- Performance comparison table
- Anti-patterns to avoid
- Monitoring and optimization tips

## 🏗️ Architecture

### Database Design Philosophy

The database design follows these core principles:

1. **Multi-Tenancy First**: Tenant ID partitioning ensures data isolation and scalability
2. **Performance Optimized**: Strategic indexing minimizes RU costs
3. **Security Focused**: Built-in data isolation and audit logging
4. **Developer Friendly**: Clear patterns and TypeScript types

### Partition Strategy

All containers use `/tenantId` as the partition key:

```json
{
  "id": "document-id",
  "tenantId": "tenant-123",  // Partition Key
  // other fields...
}
```

**Benefits**:
- Efficient data isolation per tenant
- Optimal query performance within tenants
- Automatic horizontal scaling
- Physical data separation for security

### Containers Overview

| Container | Purpose | Partition Key | TTL | Throughput |
|-----------|---------|---------------|-----|------------|
| **Tenants** | Organization information | `/tenantId` | None | 400 RU/s |
| **Users** | User accounts & profiles | `/tenantId` | None | 400 RU/s |
| **Permissions** | Permission definitions | `/tenantId` | None | 400 RU/s |
| **AuditLogs** | Activity audit trail | `/tenantId` | 90 days | 400 RU/s |

## 🚀 Quick Start

### 1. Initialize Database

```bash
cd scripts/cosmosdb
npm install
npm run init
```

This creates:
- Database: `saas-management-dev`
- All 4 containers with proper configuration
- Indexing policies
- TTL settings

### 2. Seed Development Data

```bash
npm run seed
```

This populates:
- 1 development tenant
- 2 users (admin and regular)
- 13 permission definitions
- Sample audit logs

**Default Credentials**:
- Admin: `admin@example.com` / `Admin@123`
- User: `user@example.com` / `User@123`

### 3. Connect from Application

```typescript
import { CosmosClient } from '@azure/cosmos';

const client = new CosmosClient({
  endpoint: process.env.COSMOSDB_ENDPOINT,
  key: process.env.COSMOSDB_KEY
});

const database = client.database(process.env.COSMOSDB_DATABASE);
const usersContainer = database.container('Users');

// Point read - most efficient (1 RU)
const { resource: user } = await usersContainer
  .item('user-123', 'tenant-456')
  .read();
```

## 📊 Data Model Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Tenants                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ id: tenant-123                                       │  │
│  │ tenantId: tenant-123 (Partition Key)                │  │
│  │ name: "Acme Corp"                                   │  │
│  │ status: "active"                                    │  │
│  │ subscription: { plan, dates, maxUsers }            │  │
│  │ settings: { timezone, locale, features }           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          Users                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ id: user-456                                         │  │
│  │ tenantId: tenant-123 (Partition Key)                │  │
│  │ email: "user@example.com"                           │  │
│  │ username: "john.doe"                                │  │
│  │ passwordHash: "..."                                 │  │
│  │ roles: ["admin", "user"]                            │  │
│  │ permissions: ["users.create", "users.read", ...]   │  │
│  │ profile: { phone, department, jobTitle }           │  │
│  │ security: { lastLogin, failedAttempts, ... }       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ N:M
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Permissions                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ id: permission-789                                   │  │
│  │ tenantId: tenant-123 (Partition Key)                │  │
│  │ name: "users.create"                                │  │
│  │ displayName: "Create User"                          │  │
│  │ category: "users"                                   │  │
│  │ action: "create"                                    │  │
│  │ scope: "tenant"                                     │  │
│  │ metadata: { uiSection, uiButton, ... }             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       AuditLogs                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ id: log-101112                                       │  │
│  │ tenantId: tenant-123 (Partition Key)                │  │
│  │ timestamp: "2026-01-09T12:00:00Z"                   │  │
│  │ userId: "user-456"                                  │  │
│  │ action: "user.update"                               │  │
│  │ resource: { type, id, name }                        │  │
│  │ details: { changes, reason }                        │  │
│  │ metadata: { ipAddress, userAgent, ... }            │  │
│  │ status: "success"                                   │  │
│  │ ttl: 7776000 (90 days)                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔑 Key Features

### 1. Tenant Isolation

Physical data separation through partitioning:
- Each tenant's data in separate partitions
- Queries scoped to single tenant by default
- Prevents accidental cross-tenant data access

### 2. Performance Optimization

Strategic indexing reduces costs:
- Composite indexes for common queries
- Excluded paths for unused fields
- Point reads for single-document access

### 3. Audit Logging

Comprehensive activity tracking:
- All data changes logged automatically
- 90-day retention with automatic cleanup
- Compliance-ready audit trail

### 4. Type Safety

TypeScript definitions for all models:
- Strong typing prevents errors
- IntelliSense support
- Runtime validation helpers

## 📈 Performance Guidelines

### Query Cost Comparison

| Operation | RU Cost | Use Case |
|-----------|---------|----------|
| Point Read | 1 RU | Get document by ID |
| Single Partition Query | 2-10 RUs | List within tenant |
| Cross-Partition Query | 10-1000+ RUs | Admin only |
| Insert | 5-15 RUs | Create document |
| Update | 5-15 RUs | Modify document |
| Delete | 5-10 RUs | Remove document |

### Best Practices

✅ **DO**:
- Include `tenantId` in all queries
- Use point reads when possible
- Implement pagination for large results
- Monitor RU consumption
- Index only queried fields

❌ **DON'T**:
- Query without partition key
- Use `SELECT *` unnecessarily
- Fetch all results at once
- Over-index fields
- Run cross-partition queries in user flows

## 🔒 Security Considerations

### Data Protection

1. **Partition-Level Isolation**: Tenant data physically separated
2. **Password Security**: Bcrypt with 10+ salt rounds
3. **Secret Encryption**: Two-factor secrets encrypted at rest
4. **Audit Logging**: All access and modifications logged
5. **No Secrets in Logs**: Passwords never logged

### Access Control

1. **Application-Level**: Validate tenant context from auth token
2. **Never Trust Client**: Always verify tenant ID server-side
3. **Least Privilege**: Users get minimum required permissions
4. **Regular Audits**: Review access patterns and permissions

## 🧪 Testing

### Unit Tests

Test data access layer with mocked CosmosDB client:

```typescript
import { jest } from '@jest/globals';
import { CosmosClient } from '@azure/cosmos';

// Mock CosmosDB client
jest.mock('@azure/cosmos');

describe('UserRepository', () => {
  it('should fetch user by id', async () => {
    // Test implementation
  });
});
```

### Integration Tests

Test against CosmosDB Emulator:

```bash
# Start emulator (in DevContainer)
docker run -p 8081:8081 mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator

# Run tests
npm test
```

## 📚 Additional Resources

- [ADR 003: CosmosDB Schema Design](../adr/003-cosmosdb-schema-tenant-partitioning.md)
- [Database Scripts README](../../scripts/cosmosdb/README.md)
- [Azure CosmosDB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
- [SQL Query Reference](https://docs.microsoft.com/azure/cosmos-db/sql-query-getting-started)
- [Partitioning Best Practices](https://docs.microsoft.com/azure/cosmos-db/partitioning-overview)

## 🤝 Contributing

When making schema changes:

1. Update ADR with justification
2. Modify schema documentation
3. Update TypeScript types
4. Create migration script if needed
5. Update seed data if applicable
6. Document in CHANGELOG

## 📝 Changelog

### 2026-01-09 - Initial Schema Design
- Defined all 4 containers with partition strategy
- Created indexing policies for optimization
- Implemented TTL for audit logs
- Added TypeScript type definitions
- Created initialization and seed scripts

---

**Last Updated**: 2026-01-09

**Maintained By**: Development Team

**Questions?**: See [CONTRIBUTING.md](../../CONTRIBUTING.md) for how to get help
