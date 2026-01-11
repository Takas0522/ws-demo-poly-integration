/**
 * Role-Based Access Control (RBAC) System
 * 
 * Provides role management, permission aggregation, and role inheritance
 */

import { Role } from './types';
import { normalizePermission } from './parser';

/**
 * Aggregates all permissions from a role and its inherited roles
 * Handles circular dependencies and deduplication
 */
export function aggregateRolePermissions(
  role: Role,
  allRoles: Role[],
  visited: Set<string> = new Set()
): string[] {
  // Prevent infinite loops from circular inheritance
  if (visited.has(role.id)) {
    return [];
  }
  visited.add(role.id);

  // Start with direct permissions
  const permissions = new Set<string>(role.permissions.map(normalizePermission));

  // Add permissions from inherited roles
  if (role.inheritsFrom && role.inheritsFrom.length > 0) {
    for (const parentRoleId of role.inheritsFrom) {
      const parentRole = allRoles.find(r => r.id === parentRoleId || r.name === parentRoleId);
      if (parentRole && parentRole.isActive) {
        const parentPermissions = aggregateRolePermissions(parentRole, allRoles, visited);
        parentPermissions.forEach(p => permissions.add(p));
      }
    }
  }

  return Array.from(permissions);
}

/**
 * Aggregates permissions from multiple roles
 */
export function aggregatePermissionsFromRoles(
  roleNames: string[],
  allRoles: Role[]
): string[] {
  const allPermissions = new Set<string>();

  for (const roleName of roleNames) {
    const role = allRoles.find(r => r.name === roleName || r.id === roleName);
    if (role && role.isActive) {
      const rolePermissions = aggregateRolePermissions(role, allRoles);
      rolePermissions.forEach(p => allPermissions.add(p));
    }
  }

  return Array.from(allPermissions);
}

/**
 * Validates role inheritance to detect circular dependencies
 */
export function validateRoleInheritance(
  role: Role,
  allRoles: Role[],
  visited: Set<string> = new Set(),
  path: string[] = []
): { valid: boolean; error?: string; circularPath?: string[] } {
  if (visited.has(role.id)) {
    return {
      valid: false,
      error: 'Circular role inheritance detected',
      circularPath: [...path, role.name]
    };
  }

  visited.add(role.id);
  path.push(role.name);

  if (role.inheritsFrom && role.inheritsFrom.length > 0) {
    for (const parentRoleId of role.inheritsFrom) {
      const parentRole = allRoles.find(r => r.id === parentRoleId || r.name === parentRoleId);
      
      if (!parentRole) {
        return {
          valid: false,
          error: `Parent role '${parentRoleId}' not found`
        };
      }

      const validation = validateRoleInheritance(
        parentRole,
        allRoles,
        new Set(visited),
        [...path]
      );

      if (!validation.valid) {
        return validation;
      }
    }
  }

  return { valid: true };
}

/**
 * Gets all roles that inherit from a given role (directly or indirectly)
 */
export function getChildRoles(roleName: string, allRoles: Role[], visited: Set<string> = new Set()): Role[] {
  // Prevent infinite loops
  if (visited.has(roleName)) {
    return [];
  }
  visited.add(roleName);

  const children: Role[] = [];

  for (const role of allRoles) {
    if (role.inheritsFrom && role.inheritsFrom.includes(roleName)) {
      children.push(role);
      // Recursively get children of this role
      children.push(...getChildRoles(role.name, allRoles, new Set(visited)));
    }
  }

  // Remove duplicates by role ID
  return Array.from(new Map(children.map(r => [r.id, r])).values());
}

/**
 * Gets all parent roles of a given role (directly or indirectly)
 */
export function getParentRoles(roleName: string, allRoles: Role[], visited: Set<string> = new Set()): Role[] {
  // Prevent infinite loops
  if (visited.has(roleName)) {
    return [];
  }
  visited.add(roleName);

  const role = allRoles.find(r => r.name === roleName || r.id === roleName);
  if (!role || !role.inheritsFrom || role.inheritsFrom.length === 0) {
    return [];
  }

  const parents: Role[] = [];
  for (const parentRoleId of role.inheritsFrom) {
    const parentRole = allRoles.find(r => r.id === parentRoleId || r.name === parentRoleId);
    if (parentRole) {
      parents.push(parentRole);
      // Recursively get parents of this parent role
      parents.push(...getParentRoles(parentRole.name, allRoles, new Set(visited)));
    }
  }

  // Remove duplicates by role ID
  return Array.from(new Map(parents.map(r => [r.id, r])).values());
}

/**
 * Creates a role hierarchy tree for visualization
 */
export interface RoleNode {
  role: Role;
  children: RoleNode[];
  depth: number;
}

export function buildRoleHierarchy(allRoles: Role[]): RoleNode[] {
  // Find root roles (roles with no parents)
  const rootRoles = allRoles.filter(
    role => !role.inheritsFrom || role.inheritsFrom.length === 0
  );

  function buildNode(role: Role, depth: number): RoleNode {
    const children = allRoles
      .filter(r => r.inheritsFrom && r.inheritsFrom.includes(role.name))
      .map(child => buildNode(child, depth + 1));

    return {
      role,
      children,
      depth
    };
  }

  return rootRoles.map(role => buildNode(role, 0));
}

/**
 * Checks if a role has a specific permission (including inherited permissions)
 */
export function roleHasPermission(
  roleName: string,
  permission: string,
  allRoles: Role[]
): boolean {
  const role = allRoles.find(r => r.name === roleName || r.id === roleName);
  if (!role || !role.isActive) {
    return false;
  }

  const allPermissions = aggregateRolePermissions(role, allRoles);
  return allPermissions.includes(normalizePermission(permission));
}

/**
 * Gets the effective permissions for a set of roles
 * This is the final set of permissions a user with these roles would have
 */
export function getEffectivePermissions(
  roleNames: string[],
  allRoles: Role[]
): string[] {
  return aggregatePermissionsFromRoles(roleNames, allRoles);
}
