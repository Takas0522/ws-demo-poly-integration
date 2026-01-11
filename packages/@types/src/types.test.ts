/**
 * Simple test to verify all types can be imported and used correctly
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

// Test User types
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

const testUserProfile: UserProfile = {
  id: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  status: UserStatus.Active,
};

// Test Tenant types
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

// Test Permission types
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

const testPermissionContext: UserPermissionContext = {
  userId: 'user-123',
  tenantId: 'tenant-1',
  roles: ['admin'],
  permissions: ['users.*'],
};

// Test JWT types
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

const testTokenPair: JWTTokenPair = {
  accessToken: 'jwt-access-token',
  refreshToken: 'jwt-refresh-token',
  expiresIn: 3600,
  tokenType: 'Bearer',
};

// Test API types
const testAPIResponse: APIResponse<User> = {
  success: true,
  data: testUser,
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

const testErrorResponse: APIErrorResponse = {
  error: true,
  message: 'Test error',
  code: 'TEST_ERROR',
  statusCode: 400,
};

const testHealthCheck: HealthCheckResponse = {
  status: 'healthy',
  service: 'test-service',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  uptime: 3600,
};

// Test Auth types
const testLoginRequest: LoginRequest = {
  email: 'test@example.com',
  password: 'password123',
};

const testLoginResponse: LoginResponse = {
  tokens: testTokenPair,
  user: testUserProfile,
};

// If this file compiles without errors, all type imports work correctly
console.log('✅ All types imported and validated successfully');

// Export a verification function
export function verifyTypes(): boolean {
  return (
    testUser.id === 'user-123' &&
    testTenant.id === 'tenant-1' &&
    testRole.id === 'role-1' &&
    testAPIResponse.success === true &&
    testHealthCheck.status === 'healthy'
  );
}
