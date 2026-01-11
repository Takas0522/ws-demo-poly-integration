# Quick Reference - @saas-app/react-permissions

## Setup

```tsx
import { PermissionProvider } from '@saas-app/react-permissions';

<PermissionProvider token={jwtToken}>
  <App />
</PermissionProvider>
```

## Basic Usage

### Show/Hide Components

```tsx
import { AuthorizedComponent } from '@saas-app/react-permissions';

// Single permission
<AuthorizedComponent permission="users.create">
  <CreateButton />
</AuthorizedComponent>

// Multiple permissions (ANY)
<AuthorizedComponent permission={["users.update", "users.delete"]}>
  <EditButton />
</AuthorizedComponent>

// Multiple permissions (ALL required)
<AuthorizedComponent permission={["users.update", "audit.create"]} requireAll>
  <AuditedEditButton />
</AuthorizedComponent>

// Role-based
<AuthorizedComponent role="admin">
  <AdminPanel />
</AuthorizedComponent>

// With fallback
<AuthorizedComponent permission="users.delete" fallback={<span>No access</span>}>
  <DeleteButton />
</AuthorizedComponent>
```

## Hooks

```tsx
import { usePermissions, useHasPermission, useHasRole } from '@saas-app/react-permissions';

// Get full context
const { permissions, roles, hasPermission, isAuthenticated } = usePermissions();

// Check single permission
const canCreate = useHasPermission('users.create');

// Check any permission
const { hasAnyPermission } = usePermissions();
const canModify = hasAnyPermission(['users.update', 'users.delete']);

// Check all permissions
const { hasAllPermissions } = usePermissions();
const fullAccess = hasAllPermissions(['users.create', 'users.update', 'users.delete']);

// Check role
const isAdmin = useHasRole('admin');
```

## Buttons & Links

```tsx
import { AuthorizedButton, AuthorizedLink } from '@saas-app/react-permissions';

<AuthorizedButton permission="users.delete" onClick={handleDelete}>
  Delete
</AuthorizedButton>

<AuthorizedLink permission="admin.access" href="/admin">
  Admin Panel
</AuthorizedLink>
```

## Higher-Order Components

```tsx
import { withPermission, requirePermission, requireRole, requireAdmin } from '@saas-app/react-permissions';

// Generic HOC
const ProtectedComponent = withPermission(MyComponent, {
  permission: 'users.read',
  fallback: <AccessDenied />
});

// Decorator style
const UserList = requirePermission('users.read')(UserListComponent);
const AdminPanel = requireAdmin(AdminPanelComponent);
const ManagerDashboard = requireRole('manager')(DashboardComponent);
```

## Debugging

```tsx
import { PermissionDebugger } from '@saas-app/react-permissions';

// Add to your app (development only)
{process.env.NODE_ENV === 'development' && (
  <PermissionDebugger position="bottom-right" />
)}

// Press Ctrl+Shift+P to toggle
```

## Permission Format

```tsx
// Simple permissions
"users.create"
"users.read"
"users.update"
"users.delete"

// Hierarchical
"app.users.create"
"services.auth.execute"

// Wildcards
"users.*"        // All user permissions
"app.users.*"    // All app user permissions
"*"              // All permissions (admin only!)
```

## Utility Functions

```tsx
import { hasPermission, parseJWT, isTokenExpired } from '@saas-app/react-permissions';

// Check permission
const granted = hasPermission(['users.*'], 'users.create'); // true

// Parse token
const payload = parseJWT(jwtToken);

// Check expiration
const expired = isTokenExpired(jwtToken);
```

## TypeScript

```tsx
import type {
  PermissionString,
  PermissionContextValue,
  AuthorizedComponentProps,
} from '@saas-app/react-permissions';

const permission: PermissionString = 'users.create';
```

## Common Patterns

### Conditional Rendering

```tsx
const canEdit = useHasPermission('users.update');
const isAdmin = useHasRole('admin');

return (
  <div>
    {canEdit && <EditButton />}
    {isAdmin && <AdminTools />}
  </div>
);
```

### Render Props

```tsx
<AuthorizedComponent
  permission="users.delete"
  render={(isAuthorized) => (
    <button disabled={!isAuthorized}>
      {isAuthorized ? 'Delete' : 'No Access'}
    </button>
  )}
/>
```

### Protected Routes

```tsx
import { Navigate } from 'react-router-dom';

<Route
  path="/admin"
  element={
    <AuthorizedComponent
      role="admin"
      fallback={<Navigate to="/access-denied" />}
    >
      <AdminPanel />
    </AuthorizedComponent>
  }
/>
```

### Form Fields

```tsx
<form>
  <input name="name" />
  <input name="email" />
  
  <AuthorizedComponent permission="users.roles.update">
    <select name="role">
      <option value="user">User</option>
      <option value="admin">Admin</option>
    </select>
  </AuthorizedComponent>
</form>
```

### Navigation Menu

```tsx
<nav>
  <Link to="/">Home</Link>
  
  <AuthorizedLink permission="users.read" href="/users">
    Users
  </AuthorizedLink>
  
  <AuthorizedLink role="admin" href="/admin">
    Admin
  </AuthorizedLink>
</nav>
```

## Testing

```tsx
import { PermissionProvider } from '@saas-app/react-permissions';
import { render } from '@testing-library/react';

const mockUser = {
  sub: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  tenantId: 'tenant-456',
  roles: ['user'],
  permissions: ['users.read'],
  type: 'access',
  iat: Date.now() / 1000,
  exp: Date.now() / 1000 + 3600,
};

render(
  <PermissionProvider token={mockUser}>
    <YourComponent />
  </PermissionProvider>
);
```

## Best Practices

✅ **DO:**
- Always validate permissions on the backend
- Use specific permissions (`users.create` not `users.*`)
- Provide clear fallback messages
- Test different permission scenarios
- Use the debugger during development

❌ **DON'T:**
- Don't rely on client-side checks for security
- Don't grant wildcard permissions to regular users
- Don't forget to handle loading states
- Don't skip authentication checks on the backend

## Quick Links

- [Full Documentation](./README.md)
- [Integration Guide](./INTEGRATION_GUIDE.md)
- [Usage Examples](./EXAMPLES.md)
- [Changelog](./CHANGELOG.md)

## Support

For issues or questions, please visit:
https://github.com/Takas0522/ws-demo-poly-integration/issues
