# CosmosDB Schema Migration V2 - Implementation Guide

## Overview

This directory contains scripts for migrating the CosmosDB schema from V1 to V2, which adds support for:
- **TenantUsers container**: Multi-tenant user relationships
- **Services container**: Service catalog management
- **User extensions**: `userType` and `primaryTenantId` fields
- **Tenant extensions**: `settings.allowedDomains` and `services` array

## Files

- **`migrate-to-v2.ts`**: Migration script from V1 to V2
- **`rollback-to-v1.ts`**: Rollback script from V2 to V1
- **`migrate-to-v2.test.ts`**: Unit tests for migration functions
- **`types.ts`**: Extended TypeScript type definitions
- **`validation.ts`**: Validation functions for V2 types
- **`init-database.ts`**: Updated to include V2 containers

## Pre-Migration Checklist

Before running the migration, ensure:

- [ ] **Backup your database** - Take a full backup of your CosmosDB database
- [ ] **Test in development** - Run migration in dev environment first
- [ ] **Schedule maintenance** - Plan for 5-10 minutes of downtime
- [ ] **Notify stakeholders** - Inform users of the maintenance window
- [ ] **Review documentation** - Read `docs/database/SCHEMA_MIGRATION_V2.md`
- [ ] **Verify credentials** - Ensure you have proper access rights

## Environment Setup

Set the following environment variables:

```bash
export COSMOSDB_ENDPOINT="https://your-account.documents.azure.com:443/"
export COSMOSDB_KEY="your-primary-key-here"
export COSMOSDB_DATABASE="saas-management-dev"

# Optional: Configure allowed domains for system-internal tenant
export SYSTEM_INTERNAL_ALLOWED_DOMAINS="@company.com,@company.co.jp"
```

For local CosmosDB Emulator:

```bash
export COSMOSDB_ENDPOINT="https://localhost:8081"
export COSMOSDB_KEY="C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
export COSMOSDB_DATABASE="saas-management-dev"
export SYSTEM_INTERNAL_ALLOWED_DOMAINS="@company.com"
```

## Migration Steps

### Step 1: Install Dependencies

```bash
cd scripts/cosmosdb
npm install
```

### Step 2: Type Check

Verify all TypeScript files compile without errors:

```bash
npm run type-check
```

### Step 3: Run Migration

Execute the migration script:

```bash
npm run migrate:v2
```

Or directly with ts-node:

```bash
ts-node migrate-to-v2.ts
```

### Step 4: Verify Migration

The migration script includes automatic verification. Check the output for:

- ✅ TenantUsers container created
- ✅ Services container created
- ✅ system-internal tenant created
- ✅ Users migrated to V2
- ✅ Tenants migrated to V2
- ✅ TenantUsers records generated
- ✅ Verification passed

### Step 5: Test Application

After migration:

1. Start your application services
2. Test authentication and authorization
3. Verify tenant-specific permissions
4. Check multi-tenant user functionality

## Rollback Steps

If issues occur, rollback to V1:

### Step 1: Stop Application

Ensure all services are stopped to prevent data inconsistency.

### Step 2: Run Rollback

Basic rollback (preserves V2 fields):

```bash
npm run rollback:v1
```

Or directly:

```bash
ts-node rollback-to-v1.ts
```

Complete rollback (removes V2 fields):

```bash
ts-node rollback-to-v1.ts --remove-fields
```

Or set environment variable:

```bash
export REMOVE_V2_FIELDS=true
ts-node rollback-to-v1.ts
```

### Step 3: Verify Rollback

Check the output for:

- ✅ TenantUsers container deleted
- ✅ Services container deleted
- ✅ system-internal tenant deleted
- ✅ V2 fields status (PRESERVED or REMOVED)
- ✅ Verification passed

**Note**: By default, V2 fields are preserved in Users and Tenants. Since CosmosDB is schemaless, these fields won't cause issues. Use `--remove-fields` flag only if you need a complete cleanup.

## Migration Details

### What the Migration Does

1. **Creates TenantUsers Container**
   - Partition key: `/userId`
   - Throughput: 400 RU/s
   - Composite indexes for efficient queries

2. **Creates Services Container**
   - Partition key: `/tenantId`
   - Throughput: 400 RU/s

3. **Creates system-internal Tenant**
   - Default management company tenant
   - Enterprise plan with unlimited features
   - TODO: Configure `allowedDomains` for your organization

4. **Migrates Users**
   - Adds `userType: 'internal'` (default)
   - Adds `primaryTenantId` (copies existing `tenantId`)

5. **Migrates Tenants**
   - Adds `settings.allowedDomains: []`
   - Adds `services: []`

6. **Generates TenantUsers**
   - Creates one TenantUser record per existing User
   - Copies roles and permissions
   - Sets status based on user status

### Performance Considerations

- **Small database (< 100 users)**: 2-3 minutes
- **Medium database (100-1000 users)**: 5-7 minutes
- **Large database (> 1000 users)**: 10-15 minutes

RU consumption:
- Container creation: ~50 RU
- Per user migration: ~10 RU
- Per tenant migration: ~5 RU
- Per TenantUser creation: ~5 RU

## Testing

### Unit Tests

Run the unit tests:

```bash
# Note: Test runner not yet configured in this package
# Tests are written in migrate-to-v2.test.ts
# You can run them using the root package.json test configuration
```

### Manual Testing

Test the migration in a safe environment:

1. **Use CosmosDB Emulator** (recommended for initial testing)
2. **Use a dedicated test database** (never test on production)
3. **Verify each step** manually in Azure Portal/Data Explorer

## Troubleshooting

### Issue: "Connection failed"

**Solution**: 
- Verify `COSMOSDB_ENDPOINT` and `COSMOSDB_KEY`
- Check network connectivity
- Ensure CosmosDB service is running (for emulator)

### Issue: "Container already exists"

**Solution**: 
- The script uses `createIfNotExists`, so this is safe
- Verify container was created correctly in previous run

### Issue: "Migration completed but verification failed"

**Solution**: 
- Review the verification errors in the output
- Check Azure Portal for container status
- Verify data integrity manually
- Contact support if issues persist

### Issue: "Timeout during migration"

**Solution**: 
- Increase RU/s temporarily for faster migration
- Check network latency
- Run migration during off-peak hours

## Post-Migration Tasks

After successful migration:

1. **Update Application Code**
   - Implement multi-tenant user features
   - Add service catalog functionality
   - Update authentication logic for `userType`

2. **Configure system-internal Tenant**
   - Set appropriate `allowedDomains`
   - Configure required services
   - Set up initial permissions

3. **Monitor Performance**
   - Check RU/s consumption
   - Verify query performance
   - Adjust indexes if needed

4. **Update Documentation**
   - Document new features for users
   - Update API documentation
   - Create training materials

## Schema Version History

- **V1** (Initial): Basic multi-tenant structure with Users, Tenants, Permissions, AuditLogs
- **V2** (Current): Added TenantUsers, Services, and extended User/Tenant fields

## Related Documentation

- [Schema Migration V2 Guide](../../docs/database/SCHEMA_MIGRATION_V2.md)
- [Multi-Tenant Implementation](../../docs/MULTI_TENANT_IMPLEMENTATION.md)
- [CosmosDB Schema](../../docs/database/SCHEMA.md)

## Support

For issues or questions:
- Check the troubleshooting section above
- Review related documentation
- Create an issue in the repository
- Contact the development team

## License

MIT License - See LICENSE file for details
