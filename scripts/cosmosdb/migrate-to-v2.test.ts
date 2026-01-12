/**
 * Migration Script Tests
 * 
 * Unit tests for V1 to V2 schema migration functions
 */

import {
  validateTenantUser,
  validateService,
  ValidationResult,
} from './validation';
import {
  TenantUser,
  Service,
  Validators,
  isTenantUser,
  isService,
} from './types';

describe('V2 Schema Migration Tests', () => {
  
  describe('Type Guards', () => {
    it('should validate TenantUser type correctly', () => {
      const validTenantUser: TenantUser = {
        id: 'tenantuser-123',
        userId: 'user-456',
        tenantId: 'tenant-789',
        roles: ['admin'],
        permissions: ['users.read'],
        status: 'active',
        joinedAt: '2026-01-01T00:00:00.000Z',
        leftAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        createdBy: 'system',
        updatedBy: 'system',
      };
      
      expect(isTenantUser(validTenantUser)).toBe(true);
    });
    
    it('should reject invalid TenantUser', () => {
      const invalid = {
        id: 'tenantuser-123',
        userId: 'user-456',
        // Missing required fields
      };
      
      expect(isTenantUser(invalid)).toBe(false);
    });
    
    it('should validate Service type correctly', () => {
      const validService: Service = {
        id: 'service-file-management',
        tenantId: 'system-internal',
        name: 'file-management',
        displayName: {
          ja: 'ファイル管理',
          en: 'File Management',
        },
        description: {
          ja: 'ファイル管理サービス',
          en: 'File Management Service',
        },
        category: 'storage',
        icon: 'folder-icon',
        status: 'active',
        requiredPlan: ['basic', 'professional', 'enterprise'],
        features: [
          {
            key: 'upload',
            displayName: { ja: 'アップロード', en: 'Upload' },
            description: { ja: 'ファイルをアップロード', en: 'Upload files' },
            enabled: true,
          },
        ],
        pricing: [
          {
            plan: 'basic',
            price: 1000,
            currency: 'JPY',
            billingCycle: 'monthly',
          },
        ],
        metadata: {
          version: '1.0.0',
          releaseDate: '2026-01-01T00:00:00.000Z',
          deprecated: false,
        },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        createdBy: 'system',
        updatedBy: 'system',
      };
      
      expect(isService(validService)).toBe(true);
    });
    
    it('should reject invalid Service', () => {
      const invalid = {
        id: 'service-123',
        tenantId: 'system-internal',
        // Missing required fields
      };
      
      expect(isService(invalid)).toBe(false);
    });
  });
  
  describe('TenantUser Validation', () => {
    const validUserIds = new Set(['user-123', 'user-456']);
    const validTenantIds = new Set(['tenant-789', 'system-internal']);
    
    it('should validate valid TenantUser', () => {
      const tenantUser = {
        id: 'tenantuser-123',
        userId: 'user-123',
        tenantId: 'tenant-789',
        roles: ['admin', 'user'],
        permissions: ['users.read', 'users.write'],
        status: 'active',
        joinedAt: '2026-01-01T00:00:00.000Z',
        leftAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        createdBy: 'system',
        updatedBy: 'system',
      };
      
      const result = validateTenantUser(tenantUser, 0, validUserIds, validTenantIds);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject TenantUser with missing userId', () => {
      const tenantUser = {
        id: 'tenantuser-123',
        userId: '',
        tenantId: 'tenant-789',
        roles: [],
        permissions: [],
        status: 'active',
        joinedAt: '2026-01-01T00:00:00.000Z',
        leftAt: null,
      };
      
      const result = validateTenantUser(tenantUser, 0, validUserIds, validTenantIds);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
    
    it('should reject TenantUser with invalid userId', () => {
      const tenantUser = {
        id: 'tenantuser-123',
        userId: 'invalid-user',
        tenantId: 'tenant-789',
        roles: [],
        permissions: [],
        status: 'active',
        joinedAt: '2026-01-01T00:00:00.000Z',
        leftAt: null,
      };
      
      const result = validateTenantUser(tenantUser, 0, validUserIds, validTenantIds);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'userId')).toBe(true);
    });
    
    it('should reject TenantUser with invalid tenantId', () => {
      const tenantUser = {
        id: 'tenantuser-123',
        userId: 'user-123',
        tenantId: 'invalid-tenant',
        roles: [],
        permissions: [],
        status: 'active',
        joinedAt: '2026-01-01T00:00:00.000Z',
        leftAt: null,
      };
      
      const result = validateTenantUser(tenantUser, 0, validUserIds, validTenantIds);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tenantId')).toBe(true);
    });
    
    it('should reject TenantUser with invalid status', () => {
      const tenantUser = {
        id: 'tenantuser-123',
        userId: 'user-123',
        tenantId: 'tenant-789',
        roles: [],
        permissions: [],
        status: 'invalid',
        joinedAt: '2026-01-01T00:00:00.000Z',
        leftAt: null,
      };
      
      const result = validateTenantUser(tenantUser, 0, validUserIds, validTenantIds);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'status')).toBe(true);
    });
  });
  
  describe('Service Validation', () => {
    it('should validate valid Service', () => {
      const service = {
        id: 'service-file-management',
        tenantId: 'system-internal',
        name: 'file-management',
        displayName: {
          ja: 'ファイル管理',
          en: 'File Management',
        },
        description: {
          ja: 'ファイル管理サービス',
          en: 'File Management Service',
        },
        category: 'storage',
        icon: 'folder-icon',
        status: 'active',
        requiredPlan: ['basic', 'professional'],
        features: [
          {
            key: 'upload',
            displayName: { ja: 'アップロード', en: 'Upload' },
            description: { ja: 'ファイルをアップロード', en: 'Upload files' },
            enabled: true,
          },
        ],
        pricing: [],
        metadata: {
          version: '1.0.0',
          releaseDate: '2026-01-01T00:00:00.000Z',
          deprecated: false,
        },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        createdBy: 'system',
        updatedBy: 'system',
      };
      
      const result = validateService(service, 0);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject Service with invalid tenantId', () => {
      const service = {
        id: 'service-123',
        tenantId: 'wrong-tenant',
        name: 'test-service',
        displayName: { ja: 'テスト', en: 'Test' },
        description: { ja: 'テスト', en: 'Test' },
        category: 'test',
        icon: 'test',
        status: 'active',
        requiredPlan: ['basic'],
        features: [],
      };
      
      const result = validateService(service, 0);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'tenantId')).toBe(true);
    });
    
    it('should reject Service with missing displayName.ja', () => {
      const service = {
        id: 'service-123',
        tenantId: 'system-internal',
        name: 'test-service',
        displayName: { en: 'Test' },
        description: { ja: 'テスト', en: 'Test' },
        category: 'test',
        icon: 'test',
        status: 'active',
        requiredPlan: ['basic'],
        features: [],
      };
      
      const result = validateService(service, 0);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'displayName.ja')).toBe(true);
    });
    
    it('should reject Service with invalid status', () => {
      const service = {
        id: 'service-123',
        tenantId: 'system-internal',
        name: 'test-service',
        displayName: { ja: 'テスト', en: 'Test' },
        description: { ja: 'テスト', en: 'Test' },
        category: 'test',
        icon: 'test',
        status: 'invalid',
        requiredPlan: ['basic'],
        features: [],
      };
      
      const result = validateService(service, 0);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'status')).toBe(true);
    });
    
    it('should reject Service with invalid requiredPlan', () => {
      const service = {
        id: 'service-123',
        tenantId: 'system-internal',
        name: 'test-service',
        displayName: { ja: 'テスト', en: 'Test' },
        description: { ja: 'テスト', en: 'Test' },
        category: 'test',
        icon: 'test',
        status: 'active',
        requiredPlan: ['invalid-plan'],
        features: [],
      };
      
      const result = validateService(service, 0);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field?.startsWith('requiredPlan'))).toBe(true);
    });
  });
  
  describe('Validators', () => {
    it('should validate permission names correctly', () => {
      expect(Validators.isValidPermissionName('users.create')).toBe(true);
      expect(Validators.isValidPermissionName('api-keys.delete')).toBe(true);
      expect(Validators.isValidPermissionName('user-settings.update')).toBe(true);
      expect(Validators.isValidPermissionName('InvalidFormat')).toBe(false);
      expect(Validators.isValidPermissionName('no-dot')).toBe(false);
      expect(Validators.isValidPermissionName('too.many.dots')).toBe(false);
    });
    
    it('should validate ISO timestamps correctly', () => {
      expect(Validators.isValidISOTimestamp('2026-01-01T00:00:00.000Z')).toBe(true);
      expect(Validators.isValidISOTimestamp(new Date().toISOString())).toBe(true);
      expect(Validators.isValidISOTimestamp('2026-01-01')).toBe(false);
      expect(Validators.isValidISOTimestamp('invalid-date')).toBe(false);
    });
  });
});
