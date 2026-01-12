/**
 * Database Integration Tests
 * 
 * Tests for CosmosDB operations, data isolation, and cleanup
 */

import {
  createTestTenant,
  createTestUser,
  createTestPermission,
  createTestDataCleanup,
  generateTestId,
  testIsolation,
  mockDbOperations,
} from '../utils/database-helpers';

describe('Database Integration Tests', () => {
  const cleanup = createTestDataCleanup();
  
  afterEach(() => {
    mockDbOperations.resetAll();
  });
  
  afterAll(() => {
    console.log('Database test cleanup summary:', cleanup.getSummary());
  });
  
  describe('Tenant Data Management', () => {
    it('should create tenant with proper structure', () => {
      const tenant = createTestTenant();
      
      expect(tenant.id).toBeDefined();
      expect(tenant.tenantId).toBe(tenant.id);
      expect(tenant.name).toContain('test-');
      expect(tenant.status).toBe('active');
      expect(tenant.createdAt).toBeDefined();
      expect(tenant.settings).toBeDefined();
      expect(tenant.settings.maxUsers).toBe(100);
      
      cleanup.track('tenants', tenant.id);
    });
    
    it('should create tenant with custom properties', () => {
      const customTenant = createTestTenant({
        name: 'Custom Test Tenant',
        settings: {
          maxUsers: 50,
          features: ['basic'],
        },
      });
      
      expect(customTenant.name).toBe('Custom Test Tenant');
      expect(customTenant.settings.maxUsers).toBe(50);
      expect(customTenant.settings.features).toContain('basic');
      
      cleanup.track('tenants', customTenant.id);
    });
    
    it('should handle tenant data isolation', () => {
      const tenant1 = createTestTenant();
      const tenant2 = createTestTenant();
      
      expect(tenant1.id).not.toBe(tenant2.id);
      expect(tenant1.tenantId).not.toBe(tenant2.tenantId);
      
      cleanup.track('tenants', tenant1.id);
      cleanup.track('tenants', tenant2.id);
    });
  });
  
  describe('User Data Management', () => {
    it('should create user with proper structure', () => {
      const tenantId = generateTestId('tenant');
      const user = createTestUser(tenantId);
      
      expect(user.id).toBeDefined();
      expect(user.userId).toBe(user.id);
      expect(user.tenantId).toBe(tenantId);
      expect(user.email).toContain('test-');
      expect(user.email).toContain('@example.com');
      expect(user.status).toBe('active');
      expect(user.roles).toContain('user');
      expect(user.permissions).toContain('users.read');
      
      cleanup.track('users', user.id);
    });
    
    it('should create user with custom roles and permissions', () => {
      const tenantId = generateTestId('tenant');
      const adminUser = createTestUser(tenantId, {
        email: 'admin@test.com',
        roles: ['admin', 'user'],
        permissions: ['users.*', 'tenants.*'],
      });
      
      expect(adminUser.roles).toContain('admin');
      expect(adminUser.permissions).toContain('users.*');
      expect(adminUser.permissions).toContain('tenants.*');
      
      cleanup.track('users', adminUser.id);
    });
    
    it('should enforce tenant isolation for users', () => {
      const tenant1Id = generateTestId('tenant');
      const tenant2Id = generateTestId('tenant');
      
      const user1 = createTestUser(tenant1Id);
      const user2 = createTestUser(tenant2Id);
      
      expect(user1.tenantId).toBe(tenant1Id);
      expect(user2.tenantId).toBe(tenant2Id);
      expect(user1.tenantId).not.toBe(user2.tenantId);
      
      cleanup.track('users', user1.id);
      cleanup.track('users', user2.id);
    });
  });
  
  describe('Permission Data Management', () => {
    it('should create permission with proper structure', () => {
      const permission = createTestPermission();
      
      expect(permission.id).toBeDefined();
      expect(permission.name).toContain('test-');
      expect(permission.resource).toBe('test-resource');
      expect(permission.action).toBe('read');
      expect(permission.description).toBeDefined();
      
      cleanup.track('permissions', permission.id);
    });
    
    it('should create permission with custom properties', () => {
      const customPermission = createTestPermission({
        resource: 'users',
        action: 'create',
        description: 'Custom permission for user creation',
      });
      
      expect(customPermission.resource).toBe('users');
      expect(customPermission.action).toBe('create');
      expect(customPermission.description).toContain('Custom');
      
      cleanup.track('permissions', customPermission.id);
    });
  });
  
  describe('Data Cleanup and Isolation', () => {
    it('should track created test data', () => {
      const localCleanup = createTestDataCleanup();
      
      const tenantId = generateTestId('tenant');
      const userId = generateTestId('user');
      
      localCleanup.track('tenants', tenantId);
      localCleanup.track('users', userId);
      
      expect(localCleanup.getTracked('tenants')).toContain(tenantId);
      expect(localCleanup.getTracked('users')).toContain(userId);
      
      const summary = localCleanup.getSummary();
      expect(summary.tenants).toBe(1);
      expect(summary.users).toBe(1);
    });
    
    it('should clear tracked data by collection', () => {
      const localCleanup = createTestDataCleanup();
      
      localCleanup.track('tenants', generateTestId('tenant'));
      localCleanup.track('users', generateTestId('user'));
      
      expect(localCleanup.getTracked('tenants').length).toBe(1);
      
      localCleanup.clearTracked('tenants');
      
      expect(localCleanup.getTracked('tenants').length).toBe(0);
      expect(localCleanup.getTracked('users').length).toBe(1);
    });
    
    it('should identify test data by prefix', () => {
      const testData = {
        id: 'test-123',
        name: 'test-tenant',
      };
      
      const productionData = {
        id: 'prod-123',
        name: 'production-tenant',
      };
      
      expect(testIsolation.isTestData(testData)).toBe(true);
      expect(testIsolation.isTestData(productionData)).toBe(false);
    });
    
    it('should create isolated test context', () => {
      const context1 = testIsolation.createContext();
      const context2 = testIsolation.createContext();
      
      expect(context1.tenantId).toBeDefined();
      expect(context1.cleanup).toBeDefined();
      expect(context1.tenantId).not.toBe(context2.tenantId);
    });
  });
  
  describe('Mock Database Operations', () => {
    it('should mock successful insert operation', async () => {
      const result = await mockDbOperations.mockInsert({ data: 'test' });
      
      expect(result.id).toBeDefined();
      expect(result.success).toBe(true);
      expect(mockDbOperations.mockInsert).toHaveBeenCalledTimes(1);
    });
    
    it('should mock successful query operation', async () => {
      const result = await mockDbOperations.mockQuery({ filter: 'test' });
      
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.count).toBe(0);
      expect(mockDbOperations.mockQuery).toHaveBeenCalledTimes(1);
    });
    
    it('should mock successful update operation', async () => {
      const result = await mockDbOperations.mockUpdate({ id: '123', data: 'updated' });
      
      expect(result.success).toBe(true);
      expect(mockDbOperations.mockUpdate).toHaveBeenCalledTimes(1);
    });
    
    it('should mock successful delete operation', async () => {
      const result = await mockDbOperations.mockDelete({ id: '123' });
      
      expect(result.success).toBe(true);
      expect(mockDbOperations.mockDelete).toHaveBeenCalledTimes(1);
    });
    
    it('should reset all mock operations', () => {
      mockDbOperations.mockInsert({ data: 'test' });
      mockDbOperations.mockQuery({ filter: 'test' });
      
      expect(mockDbOperations.mockInsert).toHaveBeenCalledTimes(1);
      expect(mockDbOperations.mockQuery).toHaveBeenCalledTimes(1);
      
      mockDbOperations.resetAll();
      
      expect(mockDbOperations.mockInsert).not.toHaveBeenCalled();
      expect(mockDbOperations.mockQuery).not.toHaveBeenCalled();
    });
  });
  
  describe('Test ID Generation', () => {
    it('should generate unique test IDs', () => {
      const id1 = generateTestId('user');
      const id2 = generateTestId('user');
      
      expect(id1).not.toBe(id2);
      expect(id1).toContain('user-');
      expect(id2).toContain('user-');
    });
    
    it('should generate IDs with different prefixes', () => {
      const userId = generateTestId('user');
      const tenantId = generateTestId('tenant');
      
      expect(userId).toContain('user-');
      expect(tenantId).toContain('tenant-');
      expect(userId).not.toBe(tenantId);
    });
  });
  
  describe('Tenant Partitioning', () => {
    it('should properly partition data by tenant', () => {
      const tenant1Id = generateTestId('tenant');
      const tenant2Id = generateTestId('tenant');
      
      const tenant1Users = [
        createTestUser(tenant1Id),
        createTestUser(tenant1Id),
      ];
      
      const tenant2Users = [
        createTestUser(tenant2Id),
        createTestUser(tenant2Id),
      ];
      
      // All tenant1 users should have tenant1Id
      tenant1Users.forEach(user => {
        expect(user.tenantId).toBe(tenant1Id);
      });
      
      // All tenant2 users should have tenant2Id
      tenant2Users.forEach(user => {
        expect(user.tenantId).toBe(tenant2Id);
      });
      
      // Users should be isolated by tenant
      const allTenantIds = [...tenant1Users, ...tenant2Users].map(u => u.tenantId);
      expect(new Set(allTenantIds).size).toBe(2);
    });
  });
});
