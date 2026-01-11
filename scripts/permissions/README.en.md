# Dot Notation Permission System

A hierarchical permission system with role-based access control (RBAC) for multi-tenant SaaS applications. This library provides fine-grained permission checking with support for wildcard permissions and role inheritance.

## Features

- ✅ **Dot Notation Format**: Permissions use intuitive dot notation (e.g., `app.users.create`, `users.read`)
- ✅ **Wildcard Support**: Define broad permissions with wildcards (e.g., `users.*`, `app.*`)
- ✅ **Role-Based Access Control (RBAC)**: Assign permissions to roles and roles to users
- ✅ **Role Inheritance**: Roles can inherit permissions from parent roles
- ✅ **Scope-Based Permissions**: Support for tenant, global, and ownership-based scopes
- ✅ **Express Middleware**: Ready-to-use middleware for protecting routes
- ✅ **Type-Safe**: Written in TypeScript with full type definitions
- ✅ **Performance Optimized**: Efficient permission checking with caching support

## Installation

```bash
npm install @saas-app/permissions
```

## Quick Start

### Basic Permission Checking

```typescript
import { hasPermission, createPermissionContext } from '@saas-app/permissions';

// Create a user context
const userContext = createPermissionContext(
  'user-123',           // userId
  'tenant-456',         // tenantId
  ['admin'],            // roles
  ['users.read']        // direct permissions
);

// Check if user has permission
const result = hasPermission(userContext, 'users.read');
if (result.granted) {
  console.log('User can read users');
}
```

### Express Middleware

```typescript
import express from 'express';
import { requirePermission, requireAnyPermission } from '@saas-app/permissions';

const app = express();

// Protect a route with a specific permission
app.post('/users', requirePermission('users.create'), (req, res) => {
  // Only users with 'users.create' permission can access
  res.json({ message: 'User created' });
});

// Require any of multiple permissions
app.get('/dashboard', 
  requireAnyPermission(['dashboard.view', 'admin.*']), 
  (req, res) => {
    res.json({ message: 'Dashboard data' });
  }
);
```

## Permission Format

Permissions follow a hierarchical dot notation format:

### Two-Segment Format
```
module.action
```
Examples: `users.create`, `users.read`, `services.update`

### Three-Segment Format
```
app.module.action
```
Examples: `app.users.create`, `myapp.services.delete`

### Wildcard Permissions
```
module.*
app.module.*
app.*
```
Examples: `users.*` (all user actions), `app.*` (all actions in app)

### Naming Rules
- Use lowercase letters, numbers, and hyphens
- Segments separated by dots (`.`)
- Wildcard (`*`) only at the end after a dot
- Minimum 2 segments required

✅ Valid: `users.create`, `api-keys.delete`, `app.user-profiles.update`, `users.*`

❌ Invalid: `Users.Create`, `users*`, `users.*.create`, `users`

## Core Concepts

### 1. Permission Scopes

Permissions can be scoped to different contexts:

- **`tenant`** (default): Permission applies within the user's tenant
- **`global`**: Permission applies across all tenants (admin features)
- **`own`**: Permission applies only to resources owned by the user

```typescript
// Check tenant-scoped permission
hasPermission(context, 'users.read', 'tenant');

// Check if user can edit their own profile
hasPermission(
  { ...context, resourceOwnerId: 'user-123' },
  'profile.update',
  'own'
);
```

### 2. Role-Based Access Control

Roles aggregate permissions and can inherit from other roles:

```typescript
import { Role } from '@saas-app/permissions';

const roles: Role[] = [
  {
    id: 'role-1',
    name: 'user',
    displayName: 'User',
    description: 'Basic user role',
    permissions: ['users.read', 'profile.update'],
    isActive: true
  },
  {
    id: 'role-2',
    name: 'admin',
    displayName: 'Administrator',
    description: 'Admin with full user management',
    permissions: ['users.*', 'services.*'],
    inheritsFrom: ['user'],  // Inherits all permissions from 'user'
    isActive: true
  }
];
```

### 3. Permission Inheritance

Roles can inherit permissions from parent roles, creating a hierarchy:

```typescript
import { aggregateRolePermissions } from '@saas-app/permissions';

// Get all permissions for a role (including inherited)
const allPermissions = aggregateRolePermissions(adminRole, allRoles);
// Returns: ['users.*', 'services.*', 'users.read', 'profile.update']
```

### 4. Wildcard Matching

Wildcard permissions grant access to multiple specific permissions:

```typescript
import { matchesWildcard } from '@saas-app/permissions';

matchesWildcard('users.create', 'users.*');  // true
matchesWildcard('users.delete', 'users.*');  // true
matchesWildcard('services.read', 'users.*'); // false

matchesWildcard('app.users.create', 'app.*'); // true
matchesWildcard('app.services.read', 'app.*'); // true
```

## API Reference

### Permission Checking Functions

#### `hasPermission(context, permission, scope?, roles?)`

Checks if a user has a specific permission.

```typescript
const result = hasPermission(userContext, 'users.create', 'tenant', allRoles);
// Returns: { granted: boolean, reason?: string, matchedPermission?: string }
```

#### `hasAnyPermission(context, permissions, scope?, roles?)`

Checks if a user has any of the specified permissions.

```typescript
const result = hasAnyPermission(
  userContext, 
  ['users.create', 'users.update'],
  'tenant',
  allRoles
);
```

#### `hasAllPermissions(context, permissions, scope?, roles?)`

Checks if a user has all of the specified permissions.

```typescript
const result = hasAllPermissions(
  userContext,
  ['users.create', 'audit.create'],
  'tenant',
  allRoles
);
```

#### `canPerformAction(context, resource, action, scope?, roles?)`

Convenience function to check if a user can perform an action on a resource.

```typescript
const result = canPerformAction(userContext, 'users', 'create', 'tenant', allRoles);
// Equivalent to hasPermission(context, 'users.create', ...)
```

### Express Middleware

#### `requirePermission(permission, options?)`

Middleware to require a specific permission.

```typescript
app.post('/users', 
  requirePermission('users.create', {
    scope: 'tenant',
    errorMessage: 'You cannot create users',
    errorStatus: 403
  }),
  createUserHandler
);
```

#### `requireAnyPermission(permissions, options?)`

Middleware to require any of multiple permissions.

```typescript
app.get('/reports',
  requireAnyPermission(['reports.view', 'admin.*']),
  getReportsHandler
);
```

#### `requireAllPermissions(permissions, options?)`

Middleware to require all specified permissions.

```typescript
app.delete('/users/:id',
  requireAllPermissions(['users.delete', 'audit.create']),
  deleteUserHandler
);
```

#### `requireRole(roleName)`

Middleware to require a specific role.

```typescript
app.get('/admin', requireRole('admin'), adminDashboardHandler);
```

### RBAC Functions

#### `aggregateRolePermissions(role, allRoles)`

Gets all permissions for a role including inherited permissions.

```typescript
const permissions = aggregateRolePermissions(adminRole, allRoles);
```

#### `validateRoleInheritance(role, allRoles)`

Validates role inheritance to detect circular dependencies.

```typescript
const validation = validateRoleInheritance(role, allRoles);
if (!validation.valid) {
  console.error(validation.error);
}
```

#### `getEffectivePermissions(roleNames, allRoles)`

Gets the final set of permissions for a list of roles.

```typescript
const permissions = getEffectivePermissions(['user', 'manager'], allRoles);
```

### Parser Functions

#### `validatePermissionFormat(permission)`

Validates a permission string format.

```typescript
const result = validatePermissionFormat('users.create');
// Returns: { valid: boolean, error?: string }
```

#### `parsePermission(permission)`

Parses a permission string into its components.

```typescript
const parsed = parsePermission('app.users.create');
// Returns: { full, app, module, action, isWildcard, wildcardPrefix? }
```

## Advanced Usage

### Custom Resource Ownership

Check if a user can edit their own resources:

```typescript
app.put('/users/:id',
  requirePermission('users.update', {
    scope: 'own',
    getResourceOwnerId: (req) => req.params.id
  }),
  updateUserHandler
);
```

### Combining Multiple Checks

```typescript
import { hasPermission, hasAnyPermission } from '@saas-app/permissions';

function canAccessFeature(userContext: UserPermissionContext): boolean {
  // Must have read permission
  const canRead = hasPermission(userContext, 'feature.read');
  if (!canRead.granted) return false;

  // Must have either create or update permission
  const canModify = hasAnyPermission(userContext, ['feature.create', 'feature.update']);
  return canModify.granted;
}
```

### Building Role Hierarchies

```typescript
import { buildRoleHierarchy } from '@saas-app/permissions';

const hierarchy = buildRoleHierarchy(allRoles);
// Returns a tree structure showing role relationships

function printHierarchy(nodes: RoleNode[], indent = 0) {
  for (const node of nodes) {
    console.log('  '.repeat(indent) + node.role.name);
    printHierarchy(node.children, indent + 1);
  }
}

printHierarchy(hierarchy);
// Output:
// user
//   manager
//     admin
//       superadmin
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Best Practices

### 1. Use Wildcards Judiciously

Wildcards are powerful but can grant more access than intended. Use them for administrative roles:

✅ Good: `admin` role has `users.*`, `services.*`
❌ Avoid: Regular users with `*.*` or overly broad wildcards

### 2. Prefer Specific Permissions

For regular users, grant specific permissions rather than wildcards:

```typescript
// Good
permissions: ['users.read', 'users.update', 'profile.update']

// Avoid for regular users
permissions: ['users.*']
```

### 3. Validate Role Inheritance

Always validate role hierarchies to prevent circular dependencies:

```typescript
const validation = validateRoleInheritance(newRole, existingRoles);
if (!validation.valid) {
  throw new Error(validation.error);
}
```

### 4. Cache Role Permissions

For better performance, cache aggregated role permissions:

```typescript
const rolePermissionCache = new Map<string, string[]>();

function getCachedRolePermissions(roleName: string, allRoles: Role[]): string[] {
  if (!rolePermissionCache.has(roleName)) {
    const role = allRoles.find(r => r.name === roleName);
    if (role) {
      rolePermissionCache.set(roleName, aggregateRolePermissions(role, allRoles));
    }
  }
  return rolePermissionCache.get(roleName) || [];
}
```

### 5. Use Middleware for Route Protection

Always use middleware for Express routes rather than checking permissions in handlers:

```typescript
// Good
app.post('/users', requirePermission('users.create'), createUser);

// Avoid
app.post('/users', (req, res) => {
  if (!hasPermission(req.user, 'users.create').granted) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  // ... handler code
});
```

## Examples

### Complete Express Application

```typescript
import express from 'express';
import {
  requirePermission,
  requireAnyPermission,
  createPermissionContext,
  AuthenticatedRequest
} from '@saas-app/permissions';

const app = express();

// Authentication middleware (populate req.user)
app.use((req: AuthenticatedRequest, res, next) => {
  // Get user from JWT token or session
  const user = getUserFromToken(req);
  
  req.user = createPermissionContext(
    user.id,
    user.tenantId,
    user.roles,
    user.permissions
  );
  
  next();
});

// Routes
app.get('/users', 
  requirePermission('users.read'), 
  (req, res) => {
    res.json({ users: [] });
  }
);

app.post('/users',
  requirePermission('users.create'),
  (req, res) => {
    res.json({ message: 'User created' });
  }
);

app.put('/users/:id',
  requirePermission('users.update', {
    scope: 'own',
    getResourceOwnerId: (req) => req.params.id
  }),
  (req, res) => {
    res.json({ message: 'User updated' });
  }
);

app.delete('/users/:id',
  requireAllPermissions(['users.delete', 'audit.create']),
  (req, res) => {
    res.json({ message: 'User deleted' });
  }
);

app.listen(3000);
```

## License

MIT

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting pull requests.

## Support

For issues and questions, please file an issue on GitHub.
