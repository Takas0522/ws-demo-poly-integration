# Permission System Integration Examples

This document provides practical examples of how to integrate the dot notation permission system into your services.

## Table of Contents
- [Basic Setup](#basic-setup)
- [Authentication Service Integration](#authentication-service-integration)
- [User Management Service Integration](#user-management-service-integration)
- [Frontend Integration](#frontend-integration)
- [Common Patterns](#common-patterns)

## Basic Setup

### 1. Install the Package

The permission system is located at `scripts/permissions`. To use it in your service:

```typescript
// Import from the permissions library
import {
  requirePermission,
  hasPermission,
  createPermissionContext,
  Role
} from '../../permissions';
```

### 2. Define Roles and Permissions

Create a file for your role definitions:

```typescript
// src/config/roles.ts
import { Role } from '../../permissions';

export const roles: Role[] = [
  {
    id: 'role-user',
    name: 'user',
    displayName: 'User',
    description: 'Basic user with read access',
    permissions: [
      'users.read',
      'profile.read',
      'profile.update'
    ],
    isActive: true
  },
  {
    id: 'role-manager',
    name: 'manager',
    displayName: 'Manager',
    description: 'Manager with user management capabilities',
    permissions: [
      'users.create',
      'users.update',
      'services.read'
    ],
    inheritsFrom: ['user'],
    isActive: true
  },
  {
    id: 'role-admin',
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system administrator',
    permissions: [
      'users.*',
      'services.*',
      'settings.*'
    ],
    inheritsFrom: ['manager'],
    isActive: true
  }
];
```

## Authentication Service Integration

### JWT Token with Permissions

When generating JWT tokens, include user permissions and roles:

```typescript
// src/auth-service/jwt.ts
import jwt from 'jsonwebtoken';
import { getUserPermissions } from '../../permissions';

interface JWTPayload {
  userId: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  email: string;
}

export function generateToken(user: any, roles: Role[]): string {
  // Create permission context
  const context = createPermissionContext(
    user.id,
    user.tenantId,
    user.roles,
    user.permissions
  );

  // Get all effective permissions (including role-based)
  const effectivePermissions = getUserPermissions(context, roles);

  const payload: JWTPayload = {
    userId: user.id,
    tenantId: user.tenantId,
    roles: user.roles,
    permissions: effectivePermissions,
    email: user.email
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '24h'
  });
}
```

### Authentication Middleware

Create middleware to extract user context from JWT:

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../../permissions';

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Attach user context to request
    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      roles: decoded.roles || [],
      permissions: decoded.permissions || []
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

## User Management Service Integration

### Protecting Routes

```typescript
// src/user-management-service/routes/users.ts
import express from 'express';
import { requirePermission, requireAnyPermission } from '../../permissions';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// List users - requires read permission
router.get('/', 
  requirePermission('users.read'),
  async (req, res) => {
    const users = await getUsersFromDB(req.user!.tenantId);
    res.json(users);
  }
);

// Create user - requires create permission
router.post('/',
  requirePermission('users.create'),
  async (req, res) => {
    const newUser = await createUserInDB(req.body, req.user!.tenantId);
    res.json(newUser);
  }
);

// Update user - requires update permission OR user updating their own profile
router.put('/:id',
  requireAnyPermission(['users.update', 'profile.update'], {
    scope: 'own',
    getResourceOwnerId: (req) => req.params.id
  }),
  async (req, res) => {
    const updatedUser = await updateUserInDB(req.params.id, req.body);
    res.json(updatedUser);
  }
);

// Delete user - requires delete permission
router.delete('/:id',
  requirePermission('users.delete'),
  async (req, res) => {
    await deleteUserFromDB(req.params.id);
    res.json({ message: 'User deleted' });
  }
);

export default router;
```

### Complex Permission Checks in Business Logic

```typescript
// src/user-management-service/services/userService.ts
import { hasPermission, hasAllPermissions } from '../../permissions';

export class UserService {
  async assignRole(
    currentUser: UserPermissionContext,
    targetUserId: string,
    roleId: string
  ) {
    // Check if user can update users
    const canUpdate = hasPermission(currentUser, 'users.update');
    if (!canUpdate.granted) {
      throw new Error('Insufficient permissions to assign roles');
    }

    // Additional check: only admins can assign admin role
    if (roleId === 'admin') {
      const isAdmin = currentUser.roles.includes('admin');
      if (!isAdmin) {
        throw new Error('Only admins can assign admin role');
      }
    }

    // Proceed with role assignment
    await assignRoleInDB(targetUserId, roleId);
  }

  async bulkDeleteUsers(
    currentUser: UserPermissionContext,
    userIds: string[]
  ) {
    // Bulk delete requires both delete and audit permissions
    const result = hasAllPermissions(currentUser, [
      'users.delete',
      'audit.create'
    ]);

    if (!result.granted) {
      throw new Error(result.reason);
    }

    // Proceed with bulk delete
    for (const userId of userIds) {
      await deleteUserFromDB(userId);
      await createAuditLog(currentUser, 'user.delete', userId);
    }
  }
}
```

## Frontend Integration

### Fetching User Permissions

```typescript
// src/front/services/authService.ts
export interface UserInfo {
  userId: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  email: string;
}

export async function getCurrentUser(): Promise<UserInfo> {
  const response = await fetch('/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  return response.json();
}
```

### Permission-Based UI Components

```typescript
// src/front/components/PermissionGuard.tsx
import React from 'react';
import { hasPermission, createPermissionContext } from '../../permissions';
import { useAuth } from '../hooks/useAuth';

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ permission, children, fallback }: PermissionGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback || null}</>;
  }

  const context = createPermissionContext(
    user.userId,
    user.tenantId,
    user.roles,
    user.permissions
  );

  const result = hasPermission(context, permission);

  return <>{result.granted ? children : (fallback || null)}</>;
}

// Usage in components
function UserManagement() {
  return (
    <div>
      <h1>Users</h1>
      
      <PermissionGuard permission="users.create">
        <button onClick={handleCreateUser}>Create User</button>
      </PermissionGuard>

      <UserList />
    </div>
  );
}
```

### Button-Level Authorization Hook

```typescript
// src/front/hooks/usePermission.ts
import { useMemo } from 'react';
import { hasPermission, createPermissionContext } from '../../permissions';
import { useAuth } from './useAuth';

export function usePermission(permission: string): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;

    const context = createPermissionContext(
      user.userId,
      user.tenantId,
      user.roles,
      user.permissions
    );

    return hasPermission(context, permission).granted;
  }, [user, permission]);
}

// Usage in components
function UserTable() {
  const canEdit = usePermission('users.update');
  const canDelete = usePermission('users.delete');

  return (
    <table>
      {users.map(user => (
        <tr key={user.id}>
          <td>{user.name}</td>
          <td>
            {canEdit && <button onClick={() => edit(user.id)}>Edit</button>}
            {canDelete && <button onClick={() => delete(user.id)}>Delete</button>}
          </td>
        </tr>
      ))}
    </table>
  );
}
```

## Common Patterns

### Pattern 1: Wildcard Admin Permissions

```typescript
// Admin role with wildcard permissions
const adminRole: Role = {
  id: 'role-admin',
  name: 'admin',
  displayName: 'Administrator',
  description: 'System administrator',
  permissions: [
    'users.*',
    'services.*',
    'settings.*',
    'audit.*'
  ],
  isActive: true
};

// Check if user has admin access to any user operation
const canManageUsers = hasPermission(userContext, 'users.create');
// Returns true if user has 'users.*' or 'users.create'
```

### Pattern 2: Scope-Based Access Control

```typescript
// Users can update their own profile
router.put('/profile',
  requirePermission('profile.update', {
    scope: 'own',
    getResourceOwnerId: (req) => req.user!.userId
  }),
  updateProfile
);

// Admins can update any user
router.put('/users/:id',
  requireAnyPermission(['users.update', 'profile.update'], {
    scope: 'tenant'  // Default scope
  }),
  updateUser
);
```

### Pattern 3: Multi-Level Role Hierarchy

```typescript
const roles: Role[] = [
  {
    id: 'role-viewer',
    name: 'viewer',
    displayName: 'Viewer',
    description: 'Read-only access',
    permissions: ['users.read', 'services.read'],
    isActive: true
  },
  {
    id: 'role-editor',
    name: 'editor',
    displayName: 'Editor',
    description: 'Can edit content',
    permissions: ['users.update', 'services.update'],
    inheritsFrom: ['viewer'],  // Inherits read permissions
    isActive: true
  },
  {
    id: 'role-admin',
    name: 'admin',
    displayName: 'Admin',
    description: 'Full access',
    permissions: ['users.*', 'services.*'],
    inheritsFrom: ['editor'],  // Inherits edit permissions
    isActive: true
  }
];

// Admin will have: users.*, services.*, users.update, services.update, users.read, services.read
```

### Pattern 4: Dynamic Permission Checking

```typescript
// Check multiple permissions dynamically
async function canPerformBulkAction(
  userContext: UserPermissionContext,
  action: string,
  resourceType: string
): Promise<boolean> {
  const permission = `${resourceType}.${action}`;
  const result = hasPermission(userContext, permission);
  return result.granted;
}

// Usage
if (await canPerformBulkAction(context, 'delete', 'users')) {
  await bulkDeleteUsers(userIds);
}
```

### Pattern 5: Permission Caching

```typescript
// Cache user permissions for better performance
class PermissionCache {
  private cache = new Map<string, string[]>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  async getUserPermissions(userId: string): Promise<string[]> {
    const cached = this.cache.get(userId);
    if (cached) return cached;

    const user = await getUserFromDB(userId);
    const roles = await getRolesFromDB(user.tenantId);
    
    const context = createPermissionContext(
      user.id,
      user.tenantId,
      user.roles,
      user.permissions
    );
    
    const permissions = getUserPermissions(context, roles);
    this.cache.set(userId, permissions);
    
    // Clear cache after TTL
    setTimeout(() => this.cache.delete(userId), this.ttl);
    
    return permissions;
  }
}
```

## Testing

### Unit Testing Permissions

```typescript
// tests/permissions.test.ts
import { hasPermission, createPermissionContext, Role } from '../../permissions';

describe('User Permissions', () => {
  const roles: Role[] = [
    {
      id: 'role-admin',
      name: 'admin',
      displayName: 'Admin',
      description: 'Admin',
      permissions: ['users.*'],
      isActive: true
    }
  ];

  test('admin can create users', () => {
    const context = createPermissionContext(
      'user-1',
      'tenant-1',
      ['admin'],
      []
    );

    const result = hasPermission(context, 'users.create', 'tenant', roles);
    expect(result.granted).toBe(true);
  });

  test('regular user cannot delete users', () => {
    const context = createPermissionContext(
      'user-2',
      'tenant-1',
      ['user'],
      ['users.read']
    );

    const result = hasPermission(context, 'users.delete', 'tenant', roles);
    expect(result.granted).toBe(false);
  });
});
```

### Integration Testing with Express

```typescript
// tests/routes.test.ts
import request from 'supertest';
import app from '../app';
import { generateToken } from '../auth/jwt';

describe('User Routes', () => {
  test('POST /users requires users.create permission', async () => {
    const token = generateToken({
      id: 'user-1',
      tenantId: 'tenant-1',
      roles: ['user'],
      permissions: ['users.read']
    }, roles);

    const response = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New User' });

    expect(response.status).toBe(403);
  });

  test('admin can create users', async () => {
    const token = generateToken({
      id: 'admin-1',
      tenantId: 'tenant-1',
      roles: ['admin'],
      permissions: []
    }, roles);

    const response = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New User' });

    expect(response.status).toBe(200);
  });
});
```

## Best Practices

1. **Define Permissions at Service Boundaries**: Each service should define its own permissions (e.g., `users.*`, `services.*`)

2. **Use Wildcards for Admin Roles**: Grant broad access with wildcards (`users.*`) for administrative roles

3. **Implement Permission Caching**: Cache aggregated permissions to avoid repeated calculations

4. **Validate Permissions at API Gateway**: Check basic authentication and permissions at the gateway level

5. **Log Permission Denials**: Log all permission denials for security auditing

6. **Test Permission Logic**: Write comprehensive tests for permission checks

7. **Document Required Permissions**: Clearly document which permissions each endpoint requires

8. **Use Principle of Least Privilege**: Grant users only the permissions they need

## Troubleshooting

### Common Issues

**Issue**: User has role but middleware denies access
- **Solution**: Ensure roles are properly loaded and passed to middleware via `req.roles`

**Issue**: Wildcard permissions not working
- **Solution**: Verify permission format is correct (e.g., `users.*` not `users*`)

**Issue**: Permission checks are slow
- **Solution**: Implement permission caching and avoid repeated role aggregation

**Issue**: Circular role inheritance
- **Solution**: Use `validateRoleInheritance()` before saving role definitions

## Additional Resources

- [Permission System README](./README.md)
- [CosmosDB Schema Documentation](../../docs/database/SCHEMA.en.md)
- [API Documentation](../../docs/api/README.md)
