/**
 * Type definitions for the permission system
 */

/**
 * Permission scope defines the context in which a permission applies
 */
export type PermissionScope = 'tenant' | 'global' | 'own';

/**
 * Permission action types
 */
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'execute';

/**
 * A parsed permission object from dot notation
 * Format: app.module.action or module.action
 */
export interface ParsedPermission {
  /** Full permission string (e.g., "app.users.create") */
  full: string;
  /** Application/service name (optional first segment) */
  app?: string;
  /** Module/resource name */
  module: string;
  /** Action to perform */
  action: string;
  /** Whether this is a wildcard permission */
  isWildcard: boolean;
  /** The wildcard level (e.g., "app.*", "app.users.*") */
  wildcardPrefix?: string;
}

/**
 * Role definition with permissions
 */
export interface Role {
  /** Unique role identifier */
  id: string;
  /** Role name (e.g., "admin", "user", "manager") */
  name: string;
  /** Human-readable display name */
  displayName: string;
  /** Role description */
  description: string;
  /** Permissions granted to this role */
  permissions: string[];
  /** Parent roles to inherit permissions from */
  inheritsFrom?: string[];
  /** Whether this role is active */
  isActive: boolean;
  /** Tenant ID for tenant-specific roles */
  tenantId?: string;
}

/**
 * User context for permission checking
 */
export interface UserPermissionContext {
  /** User ID */
  userId: string;
  /** Tenant ID */
  tenantId: string;
  /** User roles */
  roles: string[];
  /** Direct user permissions */
  permissions: string[];
  /** Resource owner ID (for 'own' scope checks) */
  resourceOwnerId?: string;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  /** Whether the permission check passed */
  granted: boolean;
  /** Reason for the result */
  reason?: string;
  /** Matching permission that granted access */
  matchedPermission?: string;
}

/**
 * Permission validation result
 */
export interface PermissionValidationResult {
  /** Whether the permission format is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
}
