/**
 * Database Test Utilities
 * 
 * Helper functions for CosmosDB integration testing with data isolation and cleanup
 */

import { testConfig } from '../setup';

/**
 * Test data prefix to identify test data
 */
export const TEST_DATA_PREFIX = 'test-';

/**
 * Generate a unique test ID
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Test tenant data factory
 */
export function createTestTenant(overrides?: Partial<any>): any {
  const tenantId = generateTestId('tenant');
  
  return {
    id: tenantId,
    tenantId,
    name: `${TEST_DATA_PREFIX}Tenant ${tenantId}`,
    displayName: `Test Tenant ${tenantId}`,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      maxUsers: 100,
      features: ['users', 'permissions', 'settings'],
    },
    ...overrides,
  };
}

/**
 * Test user data factory
 */
export function createTestUser(tenantId: string, overrides?: Partial<any>): any {
  const userId = generateTestId('user');
  
  return {
    id: userId,
    userId,
    tenantId,
    email: `${TEST_DATA_PREFIX}${userId}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    status: 'active',
    roles: ['user'],
    permissions: ['users.read'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Test permission data factory
 */
export function createTestPermission(overrides?: Partial<any>): any {
  const permissionId = generateTestId('permission');
  
  return {
    id: permissionId,
    name: `${TEST_DATA_PREFIX}${permissionId}`,
    resource: 'test-resource',
    action: 'read',
    description: `Test permission ${permissionId}`,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Mock CosmosDB client interface for testing
 */
export interface MockCosmosDBClient {
  database: string;
  endpoint: string;
  connected: boolean;
}

/**
 * Create a mock CosmosDB client
 */
export function createMockCosmosDBClient(): MockCosmosDBClient {
  return {
    database: testConfig.cosmosDbDatabase,
    endpoint: testConfig.cosmosDbEndpoint,
    connected: false,
  };
}

/**
 * Data cleanup utilities
 */
export class TestDataCleanup {
  private createdIds: Map<string, string[]> = new Map();
  
  /**
   * Track created test data
   */
  track(collection: string, id: string): void {
    if (!this.createdIds.has(collection)) {
      this.createdIds.set(collection, []);
    }
    this.createdIds.get(collection)!.push(id);
  }
  
  /**
   * Get all tracked IDs for a collection
   */
  getTracked(collection: string): string[] {
    return this.createdIds.get(collection) || [];
  }
  
  /**
   * Clear tracking for a collection
   */
  clearTracked(collection: string): void {
    this.createdIds.delete(collection);
  }
  
  /**
   * Clear all tracked data
   */
  clearAll(): void {
    this.createdIds.clear();
  }
  
  /**
   * Get summary of tracked data
   */
  getSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    this.createdIds.forEach((ids, collection) => {
      summary[collection] = ids.length;
    });
    return summary;
  }
}

/**
 * Create a test data cleanup instance
 */
export function createTestDataCleanup(): TestDataCleanup {
  return new TestDataCleanup();
}

/**
 * Test isolation utilities
 */
export const testIsolation = {
  /**
   * Create isolated test context
   */
  createContext(): {
    tenantId: string;
    cleanup: TestDataCleanup;
  } {
    return {
      tenantId: generateTestId('tenant'),
      cleanup: createTestDataCleanup(),
    };
  },
  
  /**
   * Check if data belongs to test
   */
  isTestData(data: any): boolean {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    
    return !!(
      data.id?.startsWith?.(TEST_DATA_PREFIX) ||
      data.name?.startsWith?.(TEST_DATA_PREFIX) ||
      data.email?.includes?.(TEST_DATA_PREFIX)
    );
  },
};

/**
 * Database operation mocks for testing when services are not available
 */
export const mockDbOperations = {
  /**
   * Mock successful database insert
   */
  mockInsert: jest.fn().mockResolvedValue({ id: 'mock-id', success: true }),
  
  /**
   * Mock successful database query
   */
  mockQuery: jest.fn().mockResolvedValue({ items: [], count: 0 }),
  
  /**
   * Mock successful database update
   */
  mockUpdate: jest.fn().mockResolvedValue({ id: 'mock-id', success: true }),
  
  /**
   * Mock successful database delete
   */
  mockDelete: jest.fn().mockResolvedValue({ success: true }),
  
  /**
   * Reset all mocks
   */
  resetAll(): void {
    this.mockInsert.mockClear();
    this.mockQuery.mockClear();
    this.mockUpdate.mockClear();
    this.mockDelete.mockClear();
  },
};
