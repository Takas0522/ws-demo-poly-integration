/**
 * Permission Checker
 * 
 * Core logic for checking if a user has required permissions
 */

import { UserPermissionContext, PermissionCheckResult, PermissionScope, Role } from './types';
import { normalizePermission, matchesWildcard } from './parser';
import { aggregatePermissionsFromRoles } from './rbac';

/**
 * Checks if a user has a specific permission
 */
export function hasPermission(
  context: UserPermissionContext,
  requiredPermission: string,
  scope: PermissionScope = 'tenant',
  allRoles?: Role[]
): PermissionCheckResult {
  const normalized = normalizePermission(requiredPermission);

  // Handle 'own' scope - user must be the resource owner
  if (scope === 'own') {
    if (!context.resourceOwnerId) {
      return {
        granted: false,
        reason: 'Resource owner information not provided for "own" scope check'
      };
    }
    if (context.userId !== context.resourceOwnerId) {
      return {
        granted: false,
        reason: 'User is not the owner of this resource'
      };
    }
  }

  // Aggregate all permissions from roles and direct permissions
  let allPermissions = [...context.permissions.map(normalizePermission)];
  
  if (allRoles && context.roles.length > 0) {
    const rolePermissions = aggregatePermissionsFromRoles(context.roles, allRoles);
    allPermissions = [...allPermissions, ...rolePermissions.map(normalizePermission)];
  }

  // Remove duplicates
  allPermissions = Array.from(new Set(allPermissions));

  // Check for exact match
  if (allPermissions.includes(normalized)) {
    return {
      granted: true,
      matchedPermission: normalized
    };
  }

  // Check for wildcard matches
  for (const userPermission of allPermissions) {
    if (userPermission.endsWith('.*') && matchesWildcard(normalized, userPermission)) {
      return {
        granted: true,
        matchedPermission: userPermission
      };
    }
  }

  return {
    granted: false,
    reason: `User does not have permission: ${requiredPermission}`
  };
}

/**
 * Checks if a user has any of the specified permissions
 */
export function hasAnyPermission(
  context: UserPermissionContext,
  requiredPermissions: string[],
  scope: PermissionScope = 'tenant',
  allRoles?: Role[]
): PermissionCheckResult {
  if (requiredPermissions.length === 0) {
    return {
      granted: false,
      reason: 'No permissions specified'
    };
  }

  for (const permission of requiredPermissions) {
    const result = hasPermission(context, permission, scope, allRoles);
    if (result.granted) {
      return result;
    }
  }

  return {
    granted: false,
    reason: `User does not have any of the required permissions: ${requiredPermissions.join(', ')}`
  };
}

/**
 * Checks if a user has all of the specified permissions
 */
export function hasAllPermissions(
  context: UserPermissionContext,
  requiredPermissions: string[],
  scope: PermissionScope = 'tenant',
  allRoles?: Role[]
): PermissionCheckResult {
  if (requiredPermissions.length === 0) {
    return {
      granted: true,
      reason: 'No permissions required'
    };
  }

  const missingPermissions: string[] = [];

  for (const permission of requiredPermissions) {
    const result = hasPermission(context, permission, scope, allRoles);
    if (!result.granted) {
      missingPermissions.push(permission);
    }
  }

  if (missingPermissions.length > 0) {
    return {
      granted: false,
      reason: `User is missing permissions: ${missingPermissions.join(', ')}`
    };
  }

  return {
    granted: true,
    matchedPermission: requiredPermissions.join(', ')
  };
}

/**
 * Gets all permissions for a user (including role-based permissions)
 */
export function getUserPermissions(
  context: UserPermissionContext,
  allRoles?: Role[]
): string[] {
  let allPermissions = [...context.permissions.map(normalizePermission)];
  
  if (allRoles && context.roles.length > 0) {
    const rolePermissions = aggregatePermissionsFromRoles(context.roles, allRoles);
    allPermissions = [...allPermissions, ...rolePermissions.map(normalizePermission)];
  }

  // Remove duplicates and sort
  return Array.from(new Set(allPermissions)).sort();
}

/**
 * Checks if a user can perform an action on a resource
 * Combines permission checking with scope validation
 */
export function canPerformAction(
  context: UserPermissionContext,
  resource: string,
  action: string,
  scope: PermissionScope = 'tenant',
  allRoles?: Role[]
): PermissionCheckResult {
  const permission = `${resource}.${action}`;
  return hasPermission(context, permission, scope, allRoles);
}

/**
 * Creates a permission context from user data
 * Utility function to construct UserPermissionContext
 */
export function createPermissionContext(
  userId: string,
  tenantId: string,
  roles: string[],
  permissions: string[],
  resourceOwnerId?: string
): UserPermissionContext {
  return {
    userId,
    tenantId,
    roles,
    permissions,
    resourceOwnerId
  };
}
