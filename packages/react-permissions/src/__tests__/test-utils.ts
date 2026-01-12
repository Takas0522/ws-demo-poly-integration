/**
 * Test utilities and mock factories
 */

import { JWTAccessPayload } from '@saas-app/types';

/**
 * Create a mock JWT access payload
 */
export function createMockJWTPayload(
  overrides?: Partial<JWTAccessPayload>
): JWTAccessPayload {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    tenantId: 'tenant-1',
    roles: ['user'],
    permissions: ['users.read'],
    type: 'access',
    iat: now,
    exp: now + 3600, // 1 hour from now
    ...overrides,
  };
}

/**
 * Create a mock JWT token string
 */
export function createMockJWTToken(
  payload?: Partial<JWTAccessPayload>
): string {
  const mockPayload = createMockJWTPayload(payload);
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const base64Header = btoa(JSON.stringify(header));
  const base64Payload = btoa(JSON.stringify(mockPayload));
  const signature = 'mock-signature';
  
  return `${base64Header}.${base64Payload}.${signature}`;
}

/**
 * Create an expired JWT token
 */
export function createExpiredJWTToken(): string {
  const now = Math.floor(Date.now() / 1000);
  return createMockJWTToken({
    iat: now - 7200, // 2 hours ago
    exp: now - 3600, // 1 hour ago (expired)
  });
}

/**
 * Create a JWT token with specific permissions
 */
export function createTokenWithPermissions(permissions: string[]): string {
  return createMockJWTToken({ permissions });
}

/**
 * Create a JWT token with specific roles
 */
export function createTokenWithRoles(roles: string[]): string {
  return createMockJWTToken({ roles });
}

/**
 * Mock permission context value
 */
export function createMockPermissionContext(overrides?: {
  permissions?: string[];
  roles?: string[];
  userId?: string;
  tenantId?: string;
  email?: string;
  displayName?: string;
  isLoading?: boolean;
  isAuthenticated?: boolean;
  error?: Error;
}) {
  return {
    permissions: overrides?.permissions || ['users.read'],
    roles: overrides?.roles || ['user'],
    userId: overrides?.userId || 'user-123',
    tenantId: overrides?.tenantId || 'tenant-1',
    email: overrides?.email || 'test@example.com',
    displayName: overrides?.displayName || 'Test User',
    isLoading: overrides?.isLoading || false,
    isAuthenticated: overrides?.isAuthenticated ?? true,
    error: overrides?.error,
    hasPermission: jest.fn((perm: string) => 
      (overrides?.permissions || ['users.read']).some(p => 
        p === perm || (p.endsWith('.*') && perm.startsWith(p.slice(0, -2) + '.'))
      )
    ),
    hasAnyPermission: jest.fn((perms: string[]) => 
      perms.some(perm => 
        (overrides?.permissions || ['users.read']).some(p => 
          p === perm || (p.endsWith('.*') && perm.startsWith(p.slice(0, -2) + '.'))
        )
      )
    ),
    hasAllPermissions: jest.fn((perms: string[]) => 
      perms.every(perm => 
        (overrides?.permissions || ['users.read']).some(p => 
          p === perm || (p.endsWith('.*') && perm.startsWith(p.slice(0, -2) + '.'))
        )
      )
    ),
    hasRole: jest.fn((role: string) => 
      (overrides?.roles || ['user']).some(r => r.toLowerCase() === role.toLowerCase())
    ),
    hasAnyRole: jest.fn((roles: string[]) => 
      roles.some(role => 
        (overrides?.roles || ['user']).some(r => r.toLowerCase() === role.toLowerCase())
      )
    ),
    refresh: jest.fn(),
  };
}

/**
 * Wait for async updates in tests
 */
export const waitFor = (ms: number = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Flush all pending promises
 */
export const flushPromises = () => new Promise(setImmediate);
