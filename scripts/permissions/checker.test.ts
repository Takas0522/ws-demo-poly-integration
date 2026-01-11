/**
 * Tests for permission checker
 */

import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  canPerformAction,
  createPermissionContext
} from './checker';
import { UserPermissionContext, Role } from './types';

describe('hasPermission', () => {
  const context: UserPermissionContext = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    roles: [],
    permissions: ['users.read', 'users.create', 'services.*']
  };

  test('should grant permission for exact match', () => {
    const result = hasPermission(context, 'users.read');
    expect(result.granted).toBe(true);
    expect(result.matchedPermission).toBe('users.read');
  });

  test('should grant permission for wildcard match', () => {
    const result = hasPermission(context, 'services.create');
    expect(result.granted).toBe(true);
    expect(result.matchedPermission).toBe('services.*');
  });

  test('should deny permission when not present', () => {
    const result = hasPermission(context, 'users.delete');
    expect(result.granted).toBe(false);
    expect(result.reason).toContain('does not have permission');
  });

  test('should handle case-insensitive permissions', () => {
    const result = hasPermission(context, 'USERS.READ');
    expect(result.granted).toBe(true);
  });

  test('should check role-based permissions', () => {
    const roles: Role[] = [
      {
        id: 'role-1',
        name: 'admin',
        displayName: 'Admin',
        description: 'Admin',
        permissions: ['users.delete'],
        isActive: true
      }
    ];

    const contextWithRole: UserPermissionContext = {
      ...context,
      roles: ['admin']
    };

    const result = hasPermission(contextWithRole, 'users.delete', 'tenant', roles);
    expect(result.granted).toBe(true);
  });

  test('should handle "own" scope correctly', () => {
    const ownContext: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: [],
      permissions: ['users.update'],
      resourceOwnerId: 'user-1'
    };

    const result = hasPermission(ownContext, 'users.update', 'own');
    expect(result.granted).toBe(true);
  });

  test('should deny "own" scope when user is not owner', () => {
    const ownContext: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: [],
      permissions: ['users.update'],
      resourceOwnerId: 'user-2'
    };

    const result = hasPermission(ownContext, 'users.update', 'own');
    expect(result.granted).toBe(false);
    expect(result.reason).toContain('not the owner');
  });

  test('should deny "own" scope when resourceOwnerId is missing', () => {
    const ownContext: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: [],
      permissions: ['users.update']
    };

    const result = hasPermission(ownContext, 'users.update', 'own');
    expect(result.granted).toBe(false);
    expect(result.reason).toContain('Resource owner information not provided');
  });
});

describe('hasAnyPermission', () => {
  const context: UserPermissionContext = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    roles: [],
    permissions: ['users.read']
  };

  test('should grant when user has one of the permissions', () => {
    const result = hasAnyPermission(context, ['users.read', 'users.create']);
    expect(result.granted).toBe(true);
  });

  test('should grant when user has any permission', () => {
    const result = hasAnyPermission(context, ['users.create', 'users.read', 'users.delete']);
    expect(result.granted).toBe(true);
  });

  test('should deny when user has none of the permissions', () => {
    const result = hasAnyPermission(context, ['users.create', 'users.delete']);
    expect(result.granted).toBe(false);
    expect(result.reason).toContain('does not have any');
  });

  test('should deny for empty permission list', () => {
    const result = hasAnyPermission(context, []);
    expect(result.granted).toBe(false);
    expect(result.reason).toContain('No permissions specified');
  });
});

describe('hasAllPermissions', () => {
  const context: UserPermissionContext = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    roles: [],
    permissions: ['users.read', 'users.create']
  };

  test('should grant when user has all permissions', () => {
    const result = hasAllPermissions(context, ['users.read', 'users.create']);
    expect(result.granted).toBe(true);
  });

  test('should deny when user is missing some permissions', () => {
    const result = hasAllPermissions(context, ['users.read', 'users.create', 'users.delete']);
    expect(result.granted).toBe(false);
    expect(result.reason).toContain('missing permissions');
    expect(result.reason).toContain('users.delete');
  });

  test('should grant for empty permission list', () => {
    const result = hasAllPermissions(context, []);
    expect(result.granted).toBe(true);
    expect(result.reason).toContain('No permissions required');
  });
});

describe('getUserPermissions', () => {
  test('should get direct permissions', () => {
    const context: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: [],
      permissions: ['users.read', 'users.create']
    };

    const permissions = getUserPermissions(context);
    expect(permissions).toContain('users.read');
    expect(permissions).toContain('users.create');
    expect(permissions).toHaveLength(2);
  });

  test('should aggregate role permissions', () => {
    const roles: Role[] = [
      {
        id: 'role-1',
        name: 'admin',
        displayName: 'Admin',
        description: 'Admin',
        permissions: ['users.delete'],
        isActive: true
      }
    ];

    const context: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: ['admin'],
      permissions: ['users.read']
    };

    const permissions = getUserPermissions(context, roles);
    expect(permissions).toContain('users.read');
    expect(permissions).toContain('users.delete');
  });

  test('should deduplicate permissions', () => {
    const roles: Role[] = [
      {
        id: 'role-1',
        name: 'admin',
        displayName: 'Admin',
        description: 'Admin',
        permissions: ['users.read'],
        isActive: true
      }
    ];

    const context: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: ['admin'],
      permissions: ['users.read']
    };

    const permissions = getUserPermissions(context, roles);
    const readCount = permissions.filter(p => p === 'users.read').length;
    expect(readCount).toBe(1);
  });

  test('should return sorted permissions', () => {
    const context: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: [],
      permissions: ['users.delete', 'users.create', 'users.read']
    };

    const permissions = getUserPermissions(context);
    expect(permissions[0]).toBe('users.create');
    expect(permissions[1]).toBe('users.delete');
    expect(permissions[2]).toBe('users.read');
  });
});

describe('canPerformAction', () => {
  const context: UserPermissionContext = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    roles: [],
    permissions: ['users.create', 'services.*']
  };

  test('should check action on resource', () => {
    const result = canPerformAction(context, 'users', 'create');
    expect(result.granted).toBe(true);
  });

  test('should check action with wildcard', () => {
    const result = canPerformAction(context, 'services', 'read');
    expect(result.granted).toBe(true);
  });

  test('should deny when action not permitted', () => {
    const result = canPerformAction(context, 'users', 'delete');
    expect(result.granted).toBe(false);
  });
});

describe('createPermissionContext', () => {
  test('should create context with all fields', () => {
    const context = createPermissionContext(
      'user-1',
      'tenant-1',
      ['admin'],
      ['users.read'],
      'user-1'
    );

    expect(context.userId).toBe('user-1');
    expect(context.tenantId).toBe('tenant-1');
    expect(context.roles).toEqual(['admin']);
    expect(context.permissions).toEqual(['users.read']);
    expect(context.resourceOwnerId).toBe('user-1');
  });

  test('should create context without resourceOwnerId', () => {
    const context = createPermissionContext(
      'user-1',
      'tenant-1',
      ['admin'],
      ['users.read']
    );

    expect(context.resourceOwnerId).toBeUndefined();
  });
});
