/**
 * JWT Test Utilities
 * 
 * Helper functions for testing JWT token generation, validation, and cross-service flows
 */

import * as jwt from 'jsonwebtoken';
import { testConfig } from '../setup';

/**
 * JWT Payload interface matching the application's JWT structure
 */
export interface TestJWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

/**
 * Generate a test JWT token
 */
export function generateTestToken(
  payload: Partial<TestJWTPayload>,
  expiresIn: string | number = '2h'
): string {
  const fullPayload: TestJWTPayload = {
    userId: payload.userId || 'test-user-id',
    tenantId: payload.tenantId || 'test-tenant-id',
    email: payload.email || 'test@example.com',
    roles: payload.roles || ['user'],
    permissions: payload.permissions || ['users.read'],
    ...payload,
  };
  
  return jwt.sign(fullPayload, testConfig.jwtSecret, {
    expiresIn: expiresIn,
    issuer: process.env.JWT_ISSUER || 'saas-auth-service',
    audience: process.env.JWT_AUDIENCE || 'saas-app',
  } as jwt.SignOptions);
}

/**
 * Generate an expired test JWT token
 */
export function generateExpiredToken(payload: Partial<TestJWTPayload>): string {
  return generateTestToken(payload, '-1h'); // Expired 1 hour ago
}

/**
 * Decode a JWT token without verification (for testing)
 */
export function decodeToken(token: string): TestJWTPayload | null {
  try {
    return jwt.decode(token) as TestJWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): TestJWTPayload | null {
  try {
    return jwt.verify(token, testConfig.jwtSecret) as TestJWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Generate tokens for different user roles
 */
export const testTokens = {
  /**
   * Admin user token with full permissions
   */
  admin: (tenantId: string = 'test-tenant-id'): string => {
    return generateTestToken({
      userId: 'admin-user-id',
      tenantId,
      email: 'admin@example.com',
      roles: ['admin', 'user'],
      permissions: [
        'users.*',
        'tenants.*',
        'permissions.*',
        'settings.*',
      ],
    });
  },
  
  /**
   * Regular user token with limited permissions
   */
  user: (tenantId: string = 'test-tenant-id'): string => {
    return generateTestToken({
      userId: 'user-id',
      tenantId,
      email: 'user@example.com',
      roles: ['user'],
      permissions: [
        'users.read',
        'users.update',
        'settings.read',
      ],
    });
  },
  
  /**
   * Viewer token with read-only permissions
   */
  viewer: (tenantId: string = 'test-tenant-id'): string => {
    return generateTestToken({
      userId: 'viewer-id',
      tenantId,
      email: 'viewer@example.com',
      roles: ['viewer'],
      permissions: [
        'users.read',
        'settings.read',
      ],
    });
  },
  
  /**
   * Token with no permissions
   */
  noPermissions: (tenantId: string = 'test-tenant-id'): string => {
    return generateTestToken({
      userId: 'no-perm-user-id',
      tenantId,
      email: 'noperm@example.com',
      roles: [],
      permissions: [],
    });
  },
};

/**
 * Extract token from authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Create authorization header
 */
export function createAuthHeader(token: string): { Authorization: string } {
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Token validation helpers
 */
export const tokenValidation = {
  /**
   * Check if token is expired
   */
  isExpired(token: string): boolean {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    return decoded.exp * 1000 < Date.now();
  },
  
  /**
   * Check if token has specific permission
   */
  hasPermission(token: string, permission: string): boolean {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.permissions) {
      return false;
    }
    
    // Check for exact match
    if (decoded.permissions.includes(permission)) {
      return true;
    }
    
    // Check for wildcard match
    const [resource, action] = permission.split('.');
    return decoded.permissions.some(p => {
      if (p === '*' || p === `${resource}.*`) {
        return true;
      }
      return false;
    });
  },
  
  /**
   * Check if token has specific role
   */
  hasRole(token: string, role: string): boolean {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.roles) {
      return false;
    }
    return decoded.roles.includes(role);
  },
  
  /**
   * Get token expiry time remaining in seconds
   */
  getTimeRemaining(token: string): number | null {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    const remaining = decoded.exp * 1000 - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  },
};
