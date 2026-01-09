# CosmosDB Data Access Patterns

This document describes recommended data access patterns for the SaaS Management Application's CosmosDB implementation.

## Overview

The application uses Azure CosmosDB with tenant-based partitioning (`/tenantId`). This design enables:
- Efficient data isolation per tenant
- Optimal query performance within tenant boundaries
- Automatic scalability as tenants grow

## Key Principles

1. **Always include tenantId** - All queries should include the partition key
2. **Prefer point reads** - Use `item(id, partitionKey).read()` when possible
3. **Paginate results** - Never fetch all results at once
4. **Monitor RU consumption** - Track and optimize Request Unit usage
5. **Avoid cross-partition queries** - Reserve for admin/analytics only

## Pattern Categories

### 1. Point Read Pattern (Most Efficient)

**Use Case**: Retrieve a single document when you know both ID and partition key

**RU Cost**: 1 RU

**Example**:
```typescript
import { CosmosClient } from '@azure/cosmos';

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);
const container = database.container('Users');

// Most efficient - requires both ID and partition key
const { resource: user } = await container
  .item('user-123', 'tenant-456')
  .read();

console.log(`User: ${user.email}`);
```

**When to Use**:
- Fetching a user by ID from authentication token
- Loading tenant settings
- Retrieving specific permission or audit log

---

### 2. Single Partition Query Pattern (Efficient)

**Use Case**: Query documents within a single tenant partition

**RU Cost**: 2-10 RUs (depends on result size and indexes)

**Example**:
```typescript
// Get all active users for a tenant
const querySpec = {
  query: `
    SELECT * FROM c 
    WHERE c.tenantId = @tenantId 
    AND c.status = @status
    ORDER BY c.createdAt DESC
  `,
  parameters: [
    { name: '@tenantId', value: 'tenant-456' },
    { name: '@status', value: 'active' }
  ]
};

const { resources: users } = await container.items
  .query(querySpec)
  .fetchAll();
```

**When to Use**:
- Listing users within a tenant
- Finding permissions for a tenant
- Recent audit logs for a tenant

**Optimization Tips**:
- Select only needed fields: `SELECT c.id, c.email FROM c`
- Use indexed fields in WHERE clause
- Add ORDER BY only when necessary

---

### 3. Pagination Pattern (Essential for Large Datasets)

**Use Case**: Retrieve large result sets in manageable chunks

**RU Cost**: Variable per page (typically 2-5 RUs per page)

**Example**:
```typescript
// Paginated user list
const querySpec = {
  query: `
    SELECT * FROM c 
    WHERE c.tenantId = @tenantId 
    ORDER BY c.createdAt DESC
  `,
  parameters: [
    { name: '@tenantId', value: 'tenant-456' }
  ]
};

const queryIterator = container.items.query(querySpec, {
  maxItemCount: 20 // Page size
});

const allPages = [];
while (queryIterator.hasMoreResults()) {
  const { resources: page, continuationToken } = await queryIterator.fetchNext();
  allPages.push(page);
  
  // Store continuationToken for next page request
  if (!queryIterator.hasMoreResults()) {
    console.log('All pages fetched');
  }
}
```

**When to Use**:
- User lists with many records
- Audit log history
- Any query that could return 50+ items

**Best Practices**:
- Set reasonable page size (10-50 items)
- Store continuation token for next page
- Display loading indicators in UI
- Implement infinite scroll or page navigation

---

### 4. Filter and Search Pattern

**Use Case**: Search within tenant data with multiple criteria

**RU Cost**: 3-15 RUs (depends on indexes and result size)

**Example**:
```typescript
// Search users by multiple criteria
const querySpec = {
  query: `
    SELECT * FROM c 
    WHERE c.tenantId = @tenantId 
    AND c.status = @status
    AND (
      CONTAINS(LOWER(c.firstName), LOWER(@searchTerm))
      OR CONTAINS(LOWER(c.lastName), LOWER(@searchTerm))
      OR CONTAINS(LOWER(c.email), LOWER(@searchTerm))
    )
    ORDER BY c.lastName, c.firstName
  `,
  parameters: [
    { name: '@tenantId', value: 'tenant-456' },
    { name: '@status', value: 'active' },
    { name: '@searchTerm', value: 'john' }
  ]
};

const { resources: matchedUsers } = await container.items
  .query(querySpec)
  .fetchAll();
```

**When to Use**:
- User search functionality
- Permission filtering by category
- Audit log filtering

**Optimization Tips**:
- Index fields used in WHERE clause
- Use CONTAINS for case-insensitive search
- Combine with pagination for large results
- Consider adding search-specific indexes

---

### 5. Array Query Pattern

**Use Case**: Query documents based on array membership

**RU Cost**: 3-10 RUs

**Example**:
```typescript
// Find users with specific permission
const querySpec = {
  query: `
    SELECT * FROM c 
    WHERE c.tenantId = @tenantId 
    AND ARRAY_CONTAINS(c.permissions, @permission)
  `,
  parameters: [
    { name: '@tenantId', value: 'tenant-456' },
    { name: '@permission', value: 'users.create' }
  ]
};

const { resources: usersWithPermission } = await container.items
  .query(querySpec)
  .fetchAll();

// Find users with specific role
const roleQuerySpec = {
  query: `
    SELECT * FROM c 
    WHERE c.tenantId = @tenantId 
    AND ARRAY_CONTAINS(c.roles, @role)
  `,
  parameters: [
    { name: '@tenantId', value: 'tenant-456' },
    { name: '@role', value: 'admin' }
  ]
};

const { resources: admins } = await container.items
  .query(roleQuerySpec)
  .fetchAll();
```

**When to Use**:
- Finding users by permission
- Finding users by role
- Any query on array fields

**Best Practices**:
- Index array fields (roles/*, permissions/*)
- Use ARRAY_CONTAINS for membership checks
- Consider denormalizing if queried frequently

---

### 6. Conditional Update Pattern

**Use Case**: Update with optimistic concurrency control

**RU Cost**: 2-5 RUs (read + write)

**Example**:
```typescript
// Read item with etag
const { resource: user, headers } = await container
  .item('user-123', 'tenant-456')
  .read();

// Modify the item
user.status = 'suspended';
user.updatedAt = new Date().toISOString();
user.updatedBy = 'admin-user-id';

// Update with concurrency check
try {
  const { resource: updatedUser } = await container
    .item(user.id, user.tenantId)
    .replace(user, {
      accessCondition: { 
        type: 'IfMatch', 
        condition: headers.etag 
      }
    });
  
  console.log('User updated successfully');
} catch (error) {
  if (error.code === 412) {
    console.error('Concurrency conflict - item was modified');
    // Retry or notify user
  }
}
```

**When to Use**:
- Concurrent user updates
- Preventing lost updates
- Critical data modifications

**Best Practices**:
- Always use etag for important updates
- Implement retry logic for conflicts
- Log concurrency violations

---

### 7. Batch Operations Pattern

**Use Case**: Perform multiple operations efficiently

**RU Cost**: Sum of individual operations (with some optimization)

**Example**:
```typescript
// Batch read multiple users (same partition)
const userIds = ['user-1', 'user-2', 'user-3'];
const tenantId = 'tenant-456';

const userPromises = userIds.map(id => 
  container.item(id, tenantId).read()
);

const results = await Promise.all(userPromises);
const users = results.map(r => r.resource);

// Bulk insert (using TransactionalBatch for same partition)
const batch = container.items.batch(tenantId);

for (const newUser of newUsers) {
  batch.create(newUser);
}

const batchResponse = await batch.execute();
if (batchResponse.statusCode === 200) {
  console.log('All users created successfully');
}
```

**When to Use**:
- Creating multiple records at once
- Bulk user import
- Batch permission updates

**Best Practices**:
- Use TransactionalBatch for same partition
- Limit batch size to 100 operations
- Handle partial failures gracefully

---

### 8. Cross-Partition Query Pattern (Use Sparingly)

**Use Case**: Admin/analytics queries across all tenants

**RU Cost**: HIGH (10-1000+ RUs depending on data size)

**Example**:
```typescript
// Admin dashboard: count users across all tenants
const querySpec = {
  query: `
    SELECT c.tenantId, COUNT(1) as userCount
    FROM c 
    WHERE c.status = @status
    GROUP BY c.tenantId
  `,
  parameters: [
    { name: '@status', value: 'active' }
  ]
};

// WARNING: This is a cross-partition query!
const { resources: tenantStats } = await container.items
  .query(querySpec, {
    maxItemCount: -1 // No limit
  })
  .fetchAll();

console.log('Active users per tenant:', tenantStats);
```

**When to Use** (ONLY):
- Admin dashboards
- System analytics
- Data export/migration
- Scheduled background jobs

**Best Practices**:
- Never use in user-facing request flows
- Cache results aggressively
- Run during off-peak hours
- Consider separate analytics database
- Use Azure Functions or scheduled jobs

---

### 9. Time-Based Query Pattern

**Use Case**: Query based on date ranges (audit logs, recent activity)

**RU Cost**: 3-20 RUs (with composite index)

**Example**:
```typescript
// Get audit logs for last 24 hours
const yesterday = new Date(Date.now() - 86400000).toISOString();

const querySpec = {
  query: `
    SELECT * FROM c 
    WHERE c.tenantId = @tenantId 
    AND c.timestamp >= @startTime
    ORDER BY c.timestamp DESC
  `,
  parameters: [
    { name: '@tenantId', value: 'tenant-456' },
    { name: '@startTime', value: yesterday }
  ]
};

const { resources: recentLogs } = await container.items
  .query(querySpec, { maxItemCount: 100 })
  .fetchAll();

// Get user activity for specific user in date range
const userActivityQuery = {
  query: `
    SELECT * FROM c 
    WHERE c.tenantId = @tenantId 
    AND c.userId = @userId
    AND c.timestamp BETWEEN @startDate AND @endDate
    ORDER BY c.timestamp DESC
  `,
  parameters: [
    { name: '@tenantId', value: 'tenant-456' },
    { name: '@userId', value: 'user-123' },
    { name: '@startDate', value: '2026-01-01T00:00:00Z' },
    { name: '@endDate', value: '2026-01-31T23:59:59Z' }
  ]
};

const { resources: activity } = await container.items
  .query(userActivityQuery)
  .fetchAll();
```

**When to Use**:
- Recent audit logs
- User activity reports
- Time-based analytics

**Best Practices**:
- Use composite indexes: (tenantId, timestamp)
- Always include partition key
- Limit date ranges for better performance
- Consider data aggregation for old data

---

## Performance Comparison

> **Note**: The following metrics are baseline estimates based on typical workloads with the default indexing policies. Actual performance may vary significantly based on:
> - Document size and complexity
> - Index configuration and number of indexed paths
> - Network latency and geographic distribution
> - CosmosDB consistency level settings
> - Concurrent query load and throttling
> 
> Always test with production-like data and monitor actual RU consumption in your environment.

| Pattern | RU Cost | Latency | Use Case |
|---------|---------|---------|----------|
| Point Read | 1 RU | ~5ms | Get by ID |
| Single Partition Query | 2-10 RUs | ~10-20ms | List within tenant |
| Pagination | 2-5 RUs/page | ~10-15ms | Large result sets |
| Filter & Search | 3-15 RUs | ~15-30ms | Search within tenant |
| Array Query | 3-10 RUs | ~15-25ms | Find by permission/role |
| Conditional Update | 2-5 RUs | ~10-15ms | Safe updates |
| Batch Operations | Variable | ~20-50ms | Multiple operations |
| Cross-Partition Query | 10-1000+ RUs | ~50-500ms | Admin/analytics only |
| Time-Based Query | 3-20 RUs | ~15-30ms | Recent activity |

## Anti-Patterns to Avoid

❌ **Don't**: Query without partition key in user flows
```typescript
// BAD: Cross-partition query for user email
SELECT * FROM c WHERE c.email = 'user@example.com'
```

✅ **Do**: Include tenant context
```typescript
// GOOD: Single partition query
SELECT * FROM c WHERE c.tenantId = @tenantId AND c.email = @email
```

---

❌ **Don't**: Use SELECT * unnecessarily
```typescript
// BAD: Fetching all fields when you only need email
SELECT * FROM c WHERE c.tenantId = @tenantId
```

✅ **Do**: Select only needed fields
```typescript
// GOOD: Select specific fields
SELECT c.id, c.email, c.firstName, c.lastName FROM c WHERE c.tenantId = @tenantId
```

---

❌ **Don't**: Fetch all results without pagination
```typescript
// BAD: Could fetch thousands of records
const { resources } = await container.items.query(query).fetchAll();
```

✅ **Do**: Implement pagination
```typescript
// GOOD: Fetch in pages
const iterator = container.items.query(query, { maxItemCount: 20 });
```

---

❌ **Don't**: Query on non-indexed fields
```typescript
// BAD: profile.department is not indexed
SELECT * FROM c WHERE c.tenantId = @tenantId AND c.profile.department = 'Sales'
```

✅ **Do**: Use indexed fields or add index
```typescript
// GOOD: status is indexed
SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status = 'active'
```

## Monitoring and Optimization

### Key Metrics to Track

```typescript
// Track RU consumption
const { resources, requestCharge, headers } = await container.items
  .query(querySpec)
  .fetchAll();

console.log(`Query RUs: ${requestCharge}`);
console.log(`Continuation token: ${headers['x-ms-continuation']}`);

// Log slow queries
if (requestCharge > 50) {
  logger.warn('High RU query detected', {
    query: querySpec.query,
    rus: requestCharge,
    tenantId: tenantId
  });
}
```

### Query Optimization Checklist

- [ ] Include partition key (tenantId) in all queries
- [ ] Use point reads when possible
- [ ] Implement pagination for > 10 results
- [ ] Select only required fields
- [ ] Index fields used in WHERE clause
- [ ] Avoid cross-partition queries in user flows
- [ ] Monitor and log RU consumption
- [ ] Cache frequently accessed data
- [ ] Test with production-like data volumes

## References

- [Schema Documentation](./SCHEMA.md)
- [ADR 003: CosmosDB Schema Design](../adr/003-cosmosdb-schema-tenant-partitioning.md)
- [Azure CosmosDB Query Best Practices](https://docs.microsoft.com/azure/cosmos-db/sql-query-getting-started)
- [Partitioning in Azure Cosmos DB](https://docs.microsoft.com/azure/cosmos-db/partitioning-overview)

---

**Last Updated**: 2026-01-09
