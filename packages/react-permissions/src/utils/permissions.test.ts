/**
 * Tests for permission utilities
 */

import {
  normalizePermission,
  matchesPermission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  hasAllRoles,
  parseJWT,
  isTokenExpired,
  checkPermissionWithReason,
} from '../utils/permissions';
import {
  createMockJWTToken,
  createExpiredJWTToken,
  createTokenWithPermissions,
} from '../__tests__/test-utils';

describe('normalizePermission', () => {
  it('should normalize permission to lowercase', () => {
    expect(normalizePermission('USERS.READ')).toBe('users.read');
    expect(normalizePermission('Users.Read')).toBe('users.read');
  });

  it('should trim whitespace', () => {
    expect(normalizePermission('  users.read  ')).toBe('users.read');
    expect(normalizePermission('\tusers.read\n')).toBe('users.read');
  });
});

describe('matchesPermission', () => {
  it('should match exact permissions', () => {
    expect(matchesPermission('users.read', 'users.read')).toBe(true);
    expect(matchesPermission('users.read', 'users.write')).toBe(false);
  });

  it('should match wildcard permissions', () => {
    expect(matchesPermission('users.*', 'users.read')).toBe(true);
    expect(matchesPermission('users.*', 'users.write')).toBe(true);
    expect(matchesPermission('users.*', 'users.delete')).toBe(true);
    expect(matchesPermission('users.*', 'tenants.read')).toBe(false);
  });

  it('should handle case insensitivity', () => {
    expect(matchesPermission('USERS.READ', 'users.read')).toBe(true);
    expect(matchesPermission('users.*', 'USERS.READ')).toBe(true);
  });

  it('should not match partial wildcards', () => {
    expect(matchesPermission('users.*', 'users')).toBe(false);
  });
});

describe('hasPermission', () => {
  it('should return true when user has exact permission', () => {
    const userPerms = ['users.read', 'users.write'];
    expect(hasPermission(userPerms, 'users.read')).toBe(true);
    expect(hasPermission(userPerms, 'users.write')).toBe(true);
  });

  it('should return true when user has wildcard permission', () => {
    const userPerms = ['users.*'];
    expect(hasPermission(userPerms, 'users.read')).toBe(true);
    expect(hasPermission(userPerms, 'users.write')).toBe(true);
    expect(hasPermission(userPerms, 'users.delete')).toBe(true);
  });

  it('should return false when user does not have permission', () => {
    const userPerms = ['users.read'];
    expect(hasPermission(userPerms, 'users.write')).toBe(false);
    expect(hasPermission(userPerms, 'tenants.read')).toBe(false);
  });

  it('should handle empty permission arrays', () => {
    expect(hasPermission([], 'users.read')).toBe(false);
  });
});

describe('hasAnyPermission', () => {
  it('should return true when user has at least one permission', () => {
    const userPerms = ['users.read'];
    expect(hasAnyPermission(userPerms, ['users.read', 'users.write'])).toBe(true);
    expect(hasAnyPermission(userPerms, ['users.write', 'users.read'])).toBe(true);
  });

  it('should return false when user has none of the permissions', () => {
    const userPerms = ['users.read'];
    expect(hasAnyPermission(userPerms, ['users.write', 'users.delete'])).toBe(false);
  });

  it('should work with wildcards', () => {
    const userPerms = ['users.*'];
    expect(hasAnyPermission(userPerms, ['users.read', 'tenants.read'])).toBe(true);
  });

  it('should handle empty arrays', () => {
    expect(hasAnyPermission([], ['users.read'])).toBe(false);
    expect(hasAnyPermission(['users.read'], [])).toBe(false);
  });
});

describe('hasAllPermissions', () => {
  it('should return true when user has all permissions', () => {
    const userPerms = ['users.read', 'users.write', 'users.delete'];
    expect(hasAllPermissions(userPerms, ['users.read', 'users.write'])).toBe(true);
  });

  it('should return false when user is missing any permission', () => {
    const userPerms = ['users.read'];
    expect(hasAllPermissions(userPerms, ['users.read', 'users.write'])).toBe(false);
  });

  it('should work with wildcards', () => {
    const userPerms = ['users.*'];
    expect(hasAllPermissions(userPerms, ['users.read', 'users.write', 'users.delete'])).toBe(true);
  });

  it('should return true for empty required permissions', () => {
    expect(hasAllPermissions(['users.read'], [])).toBe(true);
  });
});

describe('hasRole', () => {
  it('should return true when user has the role', () => {
    const userRoles = ['user', 'admin'];
    expect(hasRole(userRoles, 'user')).toBe(true);
    expect(hasRole(userRoles, 'admin')).toBe(true);
  });

  it('should return false when user does not have the role', () => {
    const userRoles = ['user'];
    expect(hasRole(userRoles, 'admin')).toBe(false);
  });

  it('should be case insensitive', () => {
    const userRoles = ['Admin'];
    expect(hasRole(userRoles, 'admin')).toBe(true);
    expect(hasRole(userRoles, 'ADMIN')).toBe(true);
  });

  it('should handle empty role arrays', () => {
    expect(hasRole([], 'admin')).toBe(false);
  });
});

describe('hasAnyRole', () => {
  it('should return true when user has at least one role', () => {
    const userRoles = ['user'];
    expect(hasAnyRole(userRoles, ['user', 'admin'])).toBe(true);
    expect(hasAnyRole(userRoles, ['admin', 'user'])).toBe(true);
  });

  it('should return false when user has none of the roles', () => {
    const userRoles = ['user'];
    expect(hasAnyRole(userRoles, ['admin', 'superadmin'])).toBe(false);
  });

  it('should be case insensitive', () => {
    const userRoles = ['Admin'];
    expect(hasAnyRole(userRoles, ['admin', 'user'])).toBe(true);
  });
});

describe('hasAllRoles', () => {
  it('should return true when user has all roles', () => {
    const userRoles = ['user', 'admin', 'moderator'];
    expect(hasAllRoles(userRoles, ['user', 'admin'])).toBe(true);
  });

  it('should return false when user is missing any role', () => {
    const userRoles = ['user'];
    expect(hasAllRoles(userRoles, ['user', 'admin'])).toBe(false);
  });

  it('should be case insensitive', () => {
    const userRoles = ['User', 'Admin'];
    expect(hasAllRoles(userRoles, ['user', 'admin'])).toBe(true);
  });
});

describe('parseJWT', () => {
  it('should parse a valid JWT token', () => {
    const token = createMockJWTToken();
    const payload = parseJWT(token);
    
    expect(payload).toBeTruthy();
    expect(payload?.sub).toBe('user-123');
    expect(payload?.email).toBe('test@example.com');
    expect(payload?.tenantId).toBe('tenant-1');
  });

  it('should parse a token with custom payload', () => {
    const token = createMockJWTToken({
      sub: 'custom-user',
      permissions: ['admin.*'],
    });
    const payload = parseJWT(token);
    
    expect(payload?.sub).toBe('custom-user');
    expect(payload?.permissions).toContain('admin.*');
  });

  it('should return null for invalid token', () => {
    expect(parseJWT('invalid-token')).toBeNull();
    expect(parseJWT('not.a.token')).toBeNull();
    expect(parseJWT('')).toBeNull();
  });

  it('should handle malformed JWT', () => {
    expect(parseJWT('header.payload')).toBeNull();
    expect(parseJWT('...')).toBeNull();
  });
});

describe('isTokenExpired', () => {
  it('should return false for valid token', () => {
    const token = createMockJWTToken();
    expect(isTokenExpired(token)).toBe(false);
  });

  it('should return true for expired token', () => {
    const token = createExpiredJWTToken();
    expect(isTokenExpired(token)).toBe(true);
  });

  it('should return true for invalid token', () => {
    expect(isTokenExpired('invalid-token')).toBe(true);
    expect(isTokenExpired('')).toBe(true);
  });

  it('should return true for token without exp field', () => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { sub: 'user-123' }; // No exp field
    const token = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.signature`;
    
    expect(isTokenExpired(token)).toBe(true);
  });
});

describe('checkPermissionWithReason', () => {
  it('should return granted with reason when permission is found', () => {
    const userPerms = ['users.read', 'users.write'];
    const result = checkPermissionWithReason(userPerms, 'users.read');
    
    expect(result.granted).toBe(true);
    expect(result.reason).toContain('Granted by permission');
    expect(result.matchedPermission).toBe('users.read');
  });

  it('should work with wildcard permissions', () => {
    const userPerms = ['users.*'];
    const result = checkPermissionWithReason(userPerms, 'users.delete');
    
    expect(result.granted).toBe(true);
    expect(result.matchedPermission).toBe('users.*');
  });

  it('should return denied with reason when permission is not found', () => {
    const userPerms = ['users.read'];
    const result = checkPermissionWithReason(userPerms, 'users.write');
    
    expect(result.granted).toBe(false);
    expect(result.reason).toContain('Missing required permission');
    expect(result.matchedPermission).toBeUndefined();
  });

  it('should handle empty permission arrays', () => {
    const result = checkPermissionWithReason([], 'users.read');
    
    expect(result.granted).toBe(false);
    expect(result.reason).toContain('Missing required permission');
  });
});
