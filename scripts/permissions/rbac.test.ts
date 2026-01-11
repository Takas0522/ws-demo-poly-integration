/**
 * Tests for RBAC system
 */

import {
  aggregateRolePermissions,
  aggregatePermissionsFromRoles,
  validateRoleInheritance,
  getChildRoles,
  getParentRoles,
  buildRoleHierarchy,
  roleHasPermission,
  getEffectivePermissions
} from './rbac';
import { Role } from './types';

describe('aggregateRolePermissions', () => {
  const roles: Role[] = [
    {
      id: 'role-1',
      name: 'user',
      displayName: 'User',
      description: 'Basic user',
      permissions: ['users.read', 'services.read'],
      isActive: true,
      tenantId: 'tenant-1'
    },
    {
      id: 'role-2',
      name: 'admin',
      displayName: 'Admin',
      description: 'Administrator',
      permissions: ['users.*', 'services.*'],
      inheritsFrom: ['user'],
      isActive: true,
      tenantId: 'tenant-1'
    },
    {
      id: 'role-3',
      name: 'superadmin',
      displayName: 'Super Admin',
      description: 'Super Administrator',
      permissions: ['system.*'],
      inheritsFrom: ['admin'],
      isActive: true,
      tenantId: 'tenant-1'
    }
  ];

  test('should aggregate permissions from single role', () => {
    const permissions = aggregateRolePermissions(roles[0], roles);
    expect(permissions).toContain('users.read');
    expect(permissions).toContain('services.read');
    expect(permissions).toHaveLength(2);
  });

  test('should aggregate permissions with inheritance', () => {
    const permissions = aggregateRolePermissions(roles[1], roles);
    expect(permissions).toContain('users.*');
    expect(permissions).toContain('services.*');
    expect(permissions).toContain('users.read');
    expect(permissions).toContain('services.read');
  });

  test('should aggregate permissions with multi-level inheritance', () => {
    const permissions = aggregateRolePermissions(roles[2], roles);
    expect(permissions).toContain('system.*');
    expect(permissions).toContain('users.*');
    expect(permissions).toContain('services.*');
    expect(permissions).toContain('users.read');
    expect(permissions).toContain('services.read');
  });

  test('should handle circular inheritance gracefully', () => {
    const circularRoles: Role[] = [
      {
        id: 'role-a',
        name: 'roleA',
        displayName: 'Role A',
        description: 'Role A',
        permissions: ['a.read'],
        inheritsFrom: ['roleB'],
        isActive: true
      },
      {
        id: 'role-b',
        name: 'roleB',
        displayName: 'Role B',
        description: 'Role B',
        permissions: ['b.read'],
        inheritsFrom: ['roleA'],
        isActive: true
      }
    ];

    const permissions = aggregateRolePermissions(circularRoles[0], circularRoles);
    expect(permissions.length).toBeGreaterThan(0);
  });

  test('should skip inactive parent roles', () => {
    const rolesWithInactive: Role[] = [
      {
        id: 'role-1',
        name: 'inactive',
        displayName: 'Inactive',
        description: 'Inactive role',
        permissions: ['inactive.read'],
        isActive: false
      },
      {
        id: 'role-2',
        name: 'active',
        displayName: 'Active',
        description: 'Active role',
        permissions: ['active.read'],
        inheritsFrom: ['inactive'],
        isActive: true
      }
    ];

    const permissions = aggregateRolePermissions(rolesWithInactive[1], rolesWithInactive);
    expect(permissions).toContain('active.read');
    expect(permissions).not.toContain('inactive.read');
  });
});

describe('aggregatePermissionsFromRoles', () => {
  const roles: Role[] = [
    {
      id: 'role-1',
      name: 'user',
      displayName: 'User',
      description: 'User',
      permissions: ['users.read'],
      isActive: true
    },
    {
      id: 'role-2',
      name: 'manager',
      displayName: 'Manager',
      description: 'Manager',
      permissions: ['users.update'],
      isActive: true
    }
  ];

  test('should aggregate permissions from multiple roles', () => {
    const permissions = aggregatePermissionsFromRoles(['user', 'manager'], roles);
    expect(permissions).toContain('users.read');
    expect(permissions).toContain('users.update');
  });

  test('should deduplicate permissions', () => {
    const rolesWithDupes: Role[] = [
      ...roles,
      {
        id: 'role-3',
        name: 'viewer',
        displayName: 'Viewer',
        description: 'Viewer',
        permissions: ['users.read'], // Duplicate
        isActive: true
      }
    ];

    const permissions = aggregatePermissionsFromRoles(['user', 'viewer'], rolesWithDupes);
    const readCount = permissions.filter(p => p === 'users.read').length;
    expect(readCount).toBe(1);
  });

  test('should handle empty role list', () => {
    const permissions = aggregatePermissionsFromRoles([], roles);
    expect(permissions).toHaveLength(0);
  });

  test('should skip non-existent roles', () => {
    const permissions = aggregatePermissionsFromRoles(['nonexistent'], roles);
    expect(permissions).toHaveLength(0);
  });
});

describe('validateRoleInheritance', () => {
  test('should validate valid role hierarchy', () => {
    const roles: Role[] = [
      {
        id: 'role-1',
        name: 'user',
        displayName: 'User',
        description: 'User',
        permissions: [],
        isActive: true
      },
      {
        id: 'role-2',
        name: 'admin',
        displayName: 'Admin',
        description: 'Admin',
        permissions: [],
        inheritsFrom: ['user'],
        isActive: true
      }
    ];

    const result = validateRoleInheritance(roles[1], roles);
    expect(result.valid).toBe(true);
  });

  test('should detect circular inheritance', () => {
    const roles: Role[] = [
      {
        id: 'role-a',
        name: 'roleA',
        displayName: 'Role A',
        description: 'Role A',
        permissions: [],
        inheritsFrom: ['roleB'],
        isActive: true
      },
      {
        id: 'role-b',
        name: 'roleB',
        displayName: 'Role B',
        description: 'Role B',
        permissions: [],
        inheritsFrom: ['roleA'],
        isActive: true
      }
    ];

    const result = validateRoleInheritance(roles[0], roles);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Circular');
    expect(result.circularPath).toBeDefined();
  });

  test('should detect missing parent role', () => {
    const roles: Role[] = [
      {
        id: 'role-1',
        name: 'admin',
        displayName: 'Admin',
        description: 'Admin',
        permissions: [],
        inheritsFrom: ['nonexistent'],
        isActive: true
      }
    ];

    const result = validateRoleInheritance(roles[0], roles);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not found');
  });
});

describe('getChildRoles', () => {
  const roles: Role[] = [
    {
      id: 'role-1',
      name: 'user',
      displayName: 'User',
      description: 'User',
      permissions: [],
      isActive: true
    },
    {
      id: 'role-2',
      name: 'admin',
      displayName: 'Admin',
      description: 'Admin',
      permissions: [],
      inheritsFrom: ['user'],
      isActive: true
    },
    {
      id: 'role-3',
      name: 'superadmin',
      displayName: 'Super Admin',
      description: 'Super Admin',
      permissions: [],
      inheritsFrom: ['admin'],
      isActive: true
    }
  ];

  test('should get direct child roles', () => {
    const children = getChildRoles('user', roles);
    expect(children.some(r => r.name === 'admin')).toBe(true);
  });

  test('should get nested child roles', () => {
    const children = getChildRoles('user', roles);
    expect(children.some(r => r.name === 'superadmin')).toBe(true);
  });

  test('should return empty for leaf roles', () => {
    const children = getChildRoles('superadmin', roles);
    expect(children).toHaveLength(0);
  });
});

describe('getParentRoles', () => {
  const roles: Role[] = [
    {
      id: 'role-1',
      name: 'user',
      displayName: 'User',
      description: 'User',
      permissions: [],
      isActive: true
    },
    {
      id: 'role-2',
      name: 'admin',
      displayName: 'Admin',
      description: 'Admin',
      permissions: [],
      inheritsFrom: ['user'],
      isActive: true
    },
    {
      id: 'role-3',
      name: 'superadmin',
      displayName: 'Super Admin',
      description: 'Super Admin',
      permissions: [],
      inheritsFrom: ['admin'],
      isActive: true
    }
  ];

  test('should get direct parent roles', () => {
    const parents = getParentRoles('admin', roles);
    expect(parents.some(r => r.name === 'user')).toBe(true);
  });

  test('should get nested parent roles', () => {
    const parents = getParentRoles('superadmin', roles);
    expect(parents.some(r => r.name === 'user')).toBe(true);
    expect(parents.some(r => r.name === 'admin')).toBe(true);
  });

  test('should return empty for root roles', () => {
    const parents = getParentRoles('user', roles);
    expect(parents).toHaveLength(0);
  });
});

describe('buildRoleHierarchy', () => {
  const roles: Role[] = [
    {
      id: 'role-1',
      name: 'user',
      displayName: 'User',
      description: 'User',
      permissions: [],
      isActive: true
    },
    {
      id: 'role-2',
      name: 'admin',
      displayName: 'Admin',
      description: 'Admin',
      permissions: [],
      inheritsFrom: ['user'],
      isActive: true
    }
  ];

  test('should build hierarchy tree', () => {
    const hierarchy = buildRoleHierarchy(roles);
    expect(hierarchy).toHaveLength(1);
    expect(hierarchy[0].role.name).toBe('user');
    expect(hierarchy[0].depth).toBe(0);
    expect(hierarchy[0].children).toHaveLength(1);
    expect(hierarchy[0].children[0].role.name).toBe('admin');
    expect(hierarchy[0].children[0].depth).toBe(1);
  });
});

describe('roleHasPermission', () => {
  const roles: Role[] = [
    {
      id: 'role-1',
      name: 'user',
      displayName: 'User',
      description: 'User',
      permissions: ['users.read'],
      isActive: true
    },
    {
      id: 'role-2',
      name: 'admin',
      displayName: 'Admin',
      description: 'Admin',
      permissions: ['users.*'],
      inheritsFrom: ['user'],
      isActive: true
    }
  ];

  test('should check direct permissions', () => {
    expect(roleHasPermission('user', 'users.read', roles)).toBe(true);
    expect(roleHasPermission('user', 'users.create', roles)).toBe(false);
  });

  test('should check inherited permissions', () => {
    expect(roleHasPermission('admin', 'users.read', roles)).toBe(true);
    expect(roleHasPermission('admin', 'users.*', roles)).toBe(true);
  });

  test('should return false for inactive roles', () => {
    const inactiveRoles: Role[] = [
      {
        id: 'role-1',
        name: 'inactive',
        displayName: 'Inactive',
        description: 'Inactive',
        permissions: ['test.read'],
        isActive: false
      }
    ];

    expect(roleHasPermission('inactive', 'test.read', inactiveRoles)).toBe(false);
  });
});

describe('getEffectivePermissions', () => {
  const roles: Role[] = [
    {
      id: 'role-1',
      name: 'user',
      displayName: 'User',
      description: 'User',
      permissions: ['users.read'],
      isActive: true
    },
    {
      id: 'role-2',
      name: 'manager',
      displayName: 'Manager',
      description: 'Manager',
      permissions: ['users.update'],
      isActive: true
    }
  ];

  test('should get effective permissions from multiple roles', () => {
    const permissions = getEffectivePermissions(['user', 'manager'], roles);
    expect(permissions).toContain('users.read');
    expect(permissions).toContain('users.update');
  });
});
