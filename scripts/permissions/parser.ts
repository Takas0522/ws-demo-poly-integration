/**
 * Permission Parser
 * 
 * Parses and validates dot-notation permission strings
 * Supports formats:
 * - module.action (e.g., "users.create")
 * - app.module.action (e.g., "app.users.create")
 * - wildcard permissions (e.g., "users.*", "app.users.*", "app.*")
 */

import { ParsedPermission, PermissionValidationResult } from './types';

/**
 * Regular expression for validating permission format
 * Allows: lowercase letters, numbers, hyphens, dots, and asterisks
 * Format: segment1.segment2[.segment3][.*]
 */
const PERMISSION_PATTERN = /^[a-z][a-z0-9-]*(\.[a-z0-9*-]+)+$/;

/**
 * Validates a permission string format
 */
export function validatePermissionFormat(permission: string): PermissionValidationResult {
  if (!permission || typeof permission !== 'string') {
    return {
      valid: false,
      error: 'Permission must be a non-empty string'
    };
  }

  // Check that it has at least 2 segments first
  const segments = permission.split('.');
  if (segments.length < 2) {
    return {
      valid: false,
      error: 'Permission must have at least 2 segments (e.g., "module.action")'
    };
  }

  // Check for consecutive dots
  if (permission.includes('..')) {
    return {
      valid: false,
      error: 'Permission cannot contain consecutive dots'
    };
  }

  // Check for invalid wildcard usage
  if (permission.includes('*')) {
    if (!permission.endsWith('*')) {
      return {
        valid: false,
        error: 'Wildcard (*) can only appear at the end of a permission'
      };
    }
    if (!permission.endsWith('.*')) {
      return {
        valid: false,
        error: 'Wildcard must follow a dot (e.g., "users.*" not "users*")'
      };
    }
  }

  // Finally check against the pattern
  if (!PERMISSION_PATTERN.test(permission)) {
    return {
      valid: false,
      error: 'Permission must follow dot notation format (e.g., "users.create" or "app.users.create"). Only lowercase letters, numbers, hyphens, dots, and wildcards are allowed.'
    };
  }

  return { valid: true };
}

/**
 * Parses a permission string into its components
 */
export function parsePermission(permission: string): ParsedPermission {
  const validation = validatePermissionFormat(permission);
  if (!validation.valid) {
    throw new Error(`Invalid permission format: ${validation.error}`);
  }

  const segments = permission.split('.');
  const isWildcard = permission.endsWith('.*');
  
  let parsed: ParsedPermission;

  if (segments.length === 2) {
    // Format: module.action or module.*
    parsed = {
      full: permission,
      module: segments[0],
      action: segments[1],
      isWildcard
    };
  } else {
    // Format: app.module.action or app.module.* or app.*
    const action = segments[segments.length - 1];
    const module = segments[segments.length - 2];
    const app = segments.slice(0, -2).join('.');

    parsed = {
      full: permission,
      app: app || undefined,
      module,
      action,
      isWildcard
    };
  }

  if (isWildcard) {
    parsed.wildcardPrefix = permission.substring(0, permission.length - 2);
  }

  return parsed;
}

/**
 * Checks if a permission matches a wildcard pattern
 * 
 * @param permission - The specific permission to check (e.g., "users.create")
 * @param pattern - The wildcard pattern (e.g., "users.*", "app.users.*", "app.*")
 * @returns true if the permission matches the pattern
 */
export function matchesWildcard(permission: string, pattern: string): boolean {
  if (!pattern.endsWith('.*')) {
    return false;
  }

  const prefix = pattern.substring(0, pattern.length - 2);
  
  // Exact prefix match or starts with prefix followed by a dot
  return permission === prefix || permission.startsWith(prefix + '.');
}

/**
 * Checks if one permission is more specific than another
 * Used for permission hierarchy and inheritance
 * 
 * @param permission1 - First permission
 * @param permission2 - Second permission
 * @returns true if permission1 is more specific than permission2
 */
export function isMoreSpecific(permission1: string, permission2: string): boolean {
  const p1 = parsePermission(permission1);
  const p2 = parsePermission(permission2);

  // Wildcard permissions are less specific than concrete ones
  if (p1.isWildcard && !p2.isWildcard) {
    return false;
  }
  if (!p1.isWildcard && p2.isWildcard) {
    return true;
  }

  // More segments means more specific
  const segments1 = permission1.split('.');
  const segments2 = permission2.split('.');
  
  return segments1.length > segments2.length;
}

/**
 * Normalizes a permission string by converting to lowercase and trimming
 */
export function normalizePermission(permission: string): string {
  return permission.toLowerCase().trim();
}

/**
 * Expands wildcard permissions into a list of concrete permissions
 * This is useful for UI display and permission auditing
 * 
 * @param wildcardPermission - A wildcard permission (e.g., "users.*")
 * @param availableActions - List of available actions (e.g., ["create", "read", "update", "delete"])
 * @returns Array of concrete permissions
 */
export function expandWildcard(wildcardPermission: string, availableActions: string[]): string[] {
  if (!wildcardPermission.endsWith('.*')) {
    return [wildcardPermission];
  }

  const prefix = wildcardPermission.substring(0, wildcardPermission.length - 2);
  return availableActions.map(action => `${prefix}.${action}`);
}
