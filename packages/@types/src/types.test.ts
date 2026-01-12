/**
 * Tests to verify all types can be imported and used correctly
 */

import {
  // User types
  User,
  UserStatus,
  UserProfile,
  CreateUserRequest,
  UpdateUserRequest,
  
  // Tenant types
  Tenant,
  TenantStatus,
  TenantTier,
  TenantSummary,
  CreateTenantRequest,
  
  // Permission types
  Role,
  PermissionString,
  ParsedPermission,
  UserPermissionContext,
  PermissionCheckResult,
  
  // JWT types
  JWTAccessPayload,
  JWTRefreshPayload,
  JWTTokenPair,
  JWTVerificationResult,
  
  // API types
  APIResponse,
  PaginatedAPIResponse,
  PaginationParams,
  APIErrorResponse,
  ValidationError,
  HealthCheckResponse,
  
  // Auth types
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RefreshTokenRequest,
  SessionInfo,
} from './index';

describe('Type Definitions', () => {
  describe('User types', () => {
    it('should create valid User object', () => {
      const testUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        status: UserStatus.Active,
        tenantId: 'tenant-1',
        roles: ['user'],
        permissions: ['users.read'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(testUser.id).toBe('user-123');
      expect(testUser.email).toBe('test@example.com');
      expect(testUser.status).toBe(UserStatus.Active);
    });

    it('should create valid UserProfile object', () => {
      const testUserProfile: UserProfile = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        status: UserStatus.Active,
      };

      expect(testUserProfile.id).toBe('user-123');
      expect(testUserProfile.email).toBe('test@example.com');
    });

    it('should support all UserStatus values', () => {
      expect(UserStatus.Active).toBe('active');
      expect(UserStatus.Inactive).toBe('inactive');
      expect(UserStatus.Suspended).toBe('suspended');
      expect(UserStatus.Pending).toBe('pending');
    });
  });

  describe('Tenant types', () => {
    it('should create valid Tenant object', () => {
      const testTenant: Tenant = {
        id: 'tenant-1',
        name: 'test-tenant',
        displayName: 'Test Tenant',
        status: TenantStatus.Active,
        tier: TenantTier.Professional,
        contactEmail: 'admin@test-tenant.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(testTenant.id).toBe('tenant-1');
      expect(testTenant.tier).toBe(TenantTier.Professional);
    });

    it('should support all TenantStatus values', () => {
      expect(TenantStatus.Active).toBe('active');
      expect(TenantStatus.Inactive).toBe('inactive');
      expect(TenantStatus.Suspended).toBe('suspended');
      expect(TenantStatus.Trial).toBe('trial');
    });

    it('should support all TenantTier values', () => {
      expect(TenantTier.Free).toBe('free');
      expect(TenantTier.Basic).toBe('basic');
      expect(TenantTier.Professional).toBe('professional');
      expect(TenantTier.Enterprise).toBe('enterprise');
    });
  });

  describe('Permission types', () => {
    it('should create valid Role object', () => {
      const testRole: Role = {
        id: 'role-1',
        name: 'admin',
        displayName: 'Administrator',
        description: 'Full access',
        permissions: ['users.*', 'tenants.*'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(testRole.name).toBe('admin');
      expect(testRole.permissions).toHaveLength(2);
    });

    it('should create valid UserPermissionContext', () => {
      const testPermissionContext: UserPermissionContext = {
        userId: 'user-123',
        tenantId: 'tenant-1',
        roles: ['admin'],
        permissions: ['users.*'],
      };

      expect(testPermissionContext.userId).toBe('user-123');
      expect(testPermissionContext.roles).toContain('admin');
    });
  });

  describe('JWT types', () => {
    it('should create valid JWTAccessPayload', () => {
      const testAccessPayload: JWTAccessPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        tenantId: 'tenant-1',
        roles: ['user'],
        permissions: ['users.read'],
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      expect(testAccessPayload.sub).toBe('user-123');
      expect(testAccessPayload.type).toBe('access');
    });

    it('should create valid JWTTokenPair', () => {
      const testTokenPair: JWTTokenPair = {
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      expect(testTokenPair.tokenType).toBe('Bearer');
      expect(testTokenPair.expiresIn).toBe(3600);
    });
  });

  describe('API types', () => {
    it('should create valid APIResponse', () => {
      const testUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        status: UserStatus.Active,
        tenantId: 'tenant-1',
        roles: ['user'],
        permissions: ['users.read'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const testAPIResponse: APIResponse<User> = {
        success: true,
        data: testUser,
      };

      expect(testAPIResponse.success).toBe(true);
      expect(testAPIResponse.data.id).toBe('user-123');
    });

    it('should create valid PaginatedAPIResponse', () => {
      const testUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        status: UserStatus.Active,
        tenantId: 'tenant-1',
        roles: ['user'],
        permissions: ['users.read'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const testPaginatedResponse: PaginatedAPIResponse<User> = {
        success: true,
        data: [testUser],
        pagination: {
          page: 1,
          pageSize: 20,
          totalItems: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      };

      expect(testPaginatedResponse.pagination.page).toBe(1);
      expect(testPaginatedResponse.data).toHaveLength(1);
    });

    it('should create valid APIErrorResponse', () => {
      const testErrorResponse: APIErrorResponse = {
        error: true,
        message: 'Test error',
        code: 'TEST_ERROR',
        statusCode: 400,
      };

      expect(testErrorResponse.error).toBe(true);
      expect(testErrorResponse.statusCode).toBe(400);
    });

    it('should create valid HealthCheckResponse', () => {
      const testHealthCheck: HealthCheckResponse = {
        status: 'healthy',
        service: 'test-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: 3600,
      };

      expect(testHealthCheck.status).toBe('healthy');
      expect(testHealthCheck.uptime).toBe(3600);
    });
  });

  describe('Auth types', () => {
    it('should create valid LoginRequest', () => {
      const testLoginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      expect(testLoginRequest.email).toBe('test@example.com');
    });

    it('should create valid LoginResponse', () => {
      const testTokenPair: JWTTokenPair = {
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
      };

      const testUserProfile: UserProfile = {
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        status: UserStatus.Active,
      };

      const testLoginResponse: LoginResponse = {
        tokens: testTokenPair,
        user: testUserProfile,
      };

      expect(testLoginResponse.tokens.tokenType).toBe('Bearer');
      expect(testLoginResponse.user.id).toBe('user-123');
    });
  });

  describe('Type verification', () => {
    it('should verify all types are importable', () => {
      // If this test runs without TypeScript errors, all types are correctly exported
      expect(true).toBe(true);
    });
  });
});
