/**
 * Dot Notation Permission System
 * 
 * A hierarchical permission system with role-based access control (RBAC)
 * for multi-tenant SaaS applications.
 * 
 * @example
 * ```typescript
 * import { hasPermission, requirePermission } from '@saas-app/permissions';
 * 
 * // Check permission in code
 * const result = hasPermission(userContext, 'users.create');
 * if (result.granted) {
 *   // User can create users
 * }
 * 
 * // Protect Express routes
 * router.post('/users', requirePermission('users.create'), createUser);
 * ```
 */

// Export types
export * from './types';

// Export parser functions
export {
  validatePermissionFormat,
  parsePermission,
  matchesWildcard,
  isMoreSpecific,
  normalizePermission,
  expandWildcard
} from './parser';

// Export RBAC functions
export {
  aggregateRolePermissions,
  aggregatePermissionsFromRoles,
  validateRoleInheritance,
  getChildRoles,
  getParentRoles,
  buildRoleHierarchy,
  roleHasPermission,
  getEffectivePermissions
} from './rbac';

// Export checker functions
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  canPerformAction,
  createPermissionContext
} from './checker';

// Export middleware
export {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireAnyRole
} from './middleware';

export type { AuthenticatedRequest, PermissionMiddlewareOptions } from './middleware';
export type { RoleNode } from './rbac';
