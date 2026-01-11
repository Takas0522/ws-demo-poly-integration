/**
 * Permission checking utilities
 */

import { PermissionString } from '@saas-app/types';

/**
 * Normalize a permission string
 */
export function normalizePermission(permission: string): string {
  return permission.trim().toLowerCase();
}

/**
 * Check if a permission matches a pattern (with wildcard support)
 */
export function matchesPermission(
  userPermission: PermissionString,
  requiredPermission: PermissionString
): boolean {
  const normalized = normalizePermission(userPermission);
  const required = normalizePermission(requiredPermission);

  // Exact match
  if (normalized === required) {
    return true;
  }

  // Wildcard matching
  if (normalized.endsWith('.*')) {
    const prefix = normalized.slice(0, -2);
    return required.startsWith(prefix + '.');
  }

  return false;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  userPermissions: PermissionString[],
  requiredPermission: PermissionString
): boolean {
  return userPermissions.some((perm) =>
    matchesPermission(perm, requiredPermission)
  );
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(
  userPermissions: PermissionString[],
  requiredPermissions: PermissionString[]
): boolean {
  return requiredPermissions.some((required) =>
    hasPermission(userPermissions, required)
  );
}

/**
 * Check if user has all of the required permissions
 */
export function hasAllPermissions(
  userPermissions: PermissionString[],
  requiredPermissions: PermissionString[]
): boolean {
  return requiredPermissions.every((required) =>
    hasPermission(userPermissions, required)
  );
}

/**
 * Check if user has a specific role
 */
export function hasRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.some(
    (role) => role.toLowerCase() === requiredRole.toLowerCase()
  );
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(
  userRoles: string[],
  requiredRoles: string[]
): boolean {
  return requiredRoles.some((required) => hasRole(userRoles, required));
}

/**
 * Check if user has all of the required roles
 */
export function hasAllRoles(
  userRoles: string[],
  requiredRoles: string[]
): boolean {
  return requiredRoles.every((required) => hasRole(userRoles, required));
}

/**
 * Parse JWT token payload
 */
export function parseJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = parseJWT(token);
    if (!payload || !payload.exp) {
      return true;
    }
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (error) {
    return true;
  }
}

/**
 * Get permission check result with reason
 */
export function checkPermissionWithReason(
  userPermissions: PermissionString[],
  requiredPermission: PermissionString
): { granted: boolean; reason: string; matchedPermission?: string } {
  const matchedPermission = userPermissions.find((perm) =>
    matchesPermission(perm, requiredPermission)
  );

  if (matchedPermission) {
    return {
      granted: true,
      reason: `Granted by permission: ${matchedPermission}`,
      matchedPermission,
    };
  }

  return {
    granted: false,
    reason: `Missing required permission: ${requiredPermission}`,
  };
}

/**
 * Log permission check for debugging
 */
export function logPermissionCheck(
  permission: PermissionString,
  granted: boolean,
  reason: string
): void {
  if (process.env.NODE_ENV === 'development') {
    const style = granted
      ? 'color: green; font-weight: bold'
      : 'color: red; font-weight: bold';
    console.log(
      `%c[Permission Check] ${permission}: ${granted ? '✓ GRANTED' : '✗ DENIED'}`,
      style
    );
    console.log(`  Reason: ${reason}`);
  }
}
