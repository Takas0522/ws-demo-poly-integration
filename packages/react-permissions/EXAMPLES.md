# Usage Examples for @saas-app/react-permissions

This document provides practical examples of using the permission components in your React application.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [Button Authorization](#button-authorization)
3. [Page Protection](#page-protection)
4. [Navigation Menu](#navigation-menu)
5. [Form Fields](#form-fields)
6. [Data Tables](#data-tables)
7. [Dashboard Widgets](#dashboard-widgets)
8. [Advanced Patterns](#advanced-patterns)

## Basic Setup

### App Root with PermissionProvider

```tsx
// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PermissionProvider, PermissionDebugger } from '@saas-app/react-permissions';

function App() {
  const token = localStorage.getItem('accessToken');

  return (
    <PermissionProvider
      token={token}
      loadingComponent={<LoadingScreen />}
      errorComponent={<ErrorScreen />}
    >
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Router>
      
      {process.env.NODE_ENV === 'development' && (
        <PermissionDebugger position="bottom-right" />
      )}
    </PermissionProvider>
  );
}
```

## Button Authorization

### Simple Button Visibility

```tsx
import { AuthorizedComponent } from '@saas-app/react-permissions';

function Toolbar() {
  return (
    <div className="toolbar">
      {/* Show only if user can create */}
      <AuthorizedComponent permission="users.create">
        <button onClick={handleCreate}>Create User</button>
      </AuthorizedComponent>

      {/* Show only if user can delete */}
      <AuthorizedComponent permission="users.delete">
        <button onClick={handleDelete}>Delete User</button>
      </AuthorizedComponent>
    </div>
  );
}
```

### Button with Fallback

```tsx
<AuthorizedComponent
  permission="users.delete"
  fallback={
    <button disabled title="You don't have permission to delete">
      Delete (No Access)
    </button>
  }
>
  <button onClick={handleDelete} className="btn-danger">
    Delete User
  </button>
</AuthorizedComponent>
```

### Multiple Permissions (ANY)

```tsx
<AuthorizedComponent permission={["users.update", "users.delete"]}>
  <button>Edit or Delete</button>
</AuthorizedComponent>
```

### Multiple Permissions (ALL)

```tsx
<AuthorizedComponent
  permission={["users.update", "audit.create"]}
  requireAll={true}
>
  <button>Edit with Audit</button>
</AuthorizedComponent>
```

### Using AuthorizedButton

```tsx
import { AuthorizedButton } from '@saas-app/react-permissions';

<AuthorizedButton
  permission="users.create"
  onClick={handleCreate}
  className="btn-primary"
>
  Create User
</AuthorizedButton>
```

## Page Protection

### Protect Entire Page

```tsx
import { AuthorizedComponent } from '@saas-app/react-permissions';

function AdminPage() {
  return (
    <AuthorizedComponent
      role="admin"
      fallback={
        <div className="access-denied">
          <h1>Access Denied</h1>
          <p>You need admin privileges to view this page.</p>
          <Link to="/">Go Home</Link>
        </div>
      }
    >
      <div className="admin-panel">
        <h1>Admin Panel</h1>
        {/* Admin content */}
      </div>
    </AuthorizedComponent>
  );
}
```

### Protected Route Component

```tsx
// ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { AuthorizedComponent } from '@saas-app/react-permissions';

function ProtectedRoute({ children, permission, role }) {
  return (
    <AuthorizedComponent
      permission={permission}
      role={role}
      fallback={<Navigate to="/access-denied" replace />}
    >
      {children}
    </AuthorizedComponent>
  );
}

// Usage in routes
<Route
  path="/users"
  element={
    <ProtectedRoute permission="users.read">
      <UserManagement />
    </ProtectedRoute>
  }
/>
```

## Navigation Menu

### Navigation with Permissions

```tsx
import { AuthorizedLink, usePermissions } from '@saas-app/react-permissions';

function Navigation() {
  const { isAuthenticated } = usePermissions();

  return (
    <nav className="navbar">
      <ul>
        <li><Link to="/">Home</Link></li>

        {isAuthenticated && (
          <>
            <AuthorizedLink permission="users.read" href="/users">
              <li>Users</li>
            </AuthorizedLink>

            <AuthorizedLink permission="roles.read" href="/roles">
              <li>Roles</li>
            </AuthorizedLink>

            <AuthorizedLink role="admin" href="/admin">
              <li>Admin</li>
            </AuthorizedLink>

            <AuthorizedLink
              permission={["settings.read", "settings.update"]}
              href="/settings"
            >
              <li>Settings</li>
            </AuthorizedLink>
          </>
        )}
      </ul>
    </nav>
  );
}
```

### Dropdown Menu with Permissions

```tsx
function UserDropdown() {
  const canEdit = useHasPermission('users.update');
  const canDelete = useHasPermission('users.delete');
  const isAdmin = useHasRole('admin');

  return (
    <div className="dropdown">
      <button>Actions ▼</button>
      <ul className="dropdown-menu">
        <li><a onClick={handleView}>View Details</a></li>
        
        {canEdit && (
          <li><a onClick={handleEdit}>Edit User</a></li>
        )}
        
        {canDelete && (
          <li><a onClick={handleDelete}>Delete User</a></li>
        )}
        
        {isAdmin && (
          <>
            <li className="divider" />
            <li><a onClick={handleImpersonate}>Impersonate</a></li>
            <li><a onClick={handleResetPassword}>Reset Password</a></li>
          </>
        )}
      </ul>
    </div>
  );
}
```

## Form Fields

### Conditional Form Fields

```tsx
import { AuthorizedComponent, useHasPermission } from '@saas-app/react-permissions';

function UserForm({ user }) {
  const canEditRoles = useHasPermission('users.roles.update');
  const canEditPermissions = useHasPermission('users.permissions.update');

  return (
    <form>
      <input name="name" placeholder="Name" required />
      <input name="email" placeholder="Email" required />
      
      {/* Only show role selector if authorized */}
      <AuthorizedComponent permission="users.roles.update">
        <select name="role">
          <option value="user">User</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </AuthorizedComponent>

      {/* Only show permissions editor if authorized */}
      <AuthorizedComponent permission="users.permissions.update">
        <div className="permissions-editor">
          <h3>Permissions</h3>
          <PermissionSelector permissions={user.permissions} />
        </div>
      </AuthorizedComponent>

      <button type="submit">
        {canEditRoles || canEditPermissions ? 'Save All Changes' : 'Save Basic Info'}
      </button>
    </form>
  );
}
```

## Data Tables

### Table with Row Actions

```tsx
import { AuthorizedComponent } from '@saas-app/react-permissions';

function UserTable({ users }) {
  const { hasPermission } = usePermissions();
  
  const canEdit = hasPermission('users.update');
  const canDelete = hasPermission('users.delete');
  const showActions = canEdit || canDelete;

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          {showActions && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            {showActions && (
              <td>
                <AuthorizedComponent permission="users.update">
                  <button onClick={() => handleEdit(user)}>Edit</button>
                </AuthorizedComponent>
                
                <AuthorizedComponent permission="users.delete">
                  <button onClick={() => handleDelete(user)}>Delete</button>
                </AuthorizedComponent>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Bulk Actions

```tsx
function UserTableToolbar({ selectedUsers }) {
  return (
    <div className="toolbar">
      <span>{selectedUsers.length} selected</span>
      
      <AuthorizedComponent permission="users.update">
        <button onClick={handleBulkEdit}>
          Edit Selected
        </button>
      </AuthorizedComponent>

      <AuthorizedComponent permission="users.delete">
        <button
          onClick={handleBulkDelete}
          className="btn-danger"
          disabled={selectedUsers.length === 0}
        >
          Delete Selected
        </button>
      </AuthorizedComponent>

      <AuthorizedComponent permission="users.export">
        <button onClick={handleExport}>
          Export to CSV
        </button>
      </AuthorizedComponent>
    </div>
  );
}
```

## Dashboard Widgets

### Conditional Widget Display

```tsx
import { AuthorizedComponent } from '@saas-app/react-permissions';

function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      
      <div className="widgets">
        {/* Everyone can see this */}
        <Widget title="My Profile">
          <UserProfile />
        </Widget>

        {/* Only if can read users */}
        <AuthorizedComponent permission="users.read">
          <Widget title="User Statistics">
            <UserStats />
          </Widget>
        </AuthorizedComponent>

        {/* Only admins */}
        <AuthorizedComponent role="admin">
          <Widget title="System Health">
            <SystemHealth />
          </Widget>
        </AuthorizedComponent>

        {/* Multiple permissions */}
        <AuthorizedComponent
          permission={["analytics.read", "reports.read"]}
        >
          <Widget title="Analytics">
            <Analytics />
          </Widget>
        </AuthorizedComponent>
      </div>
    </div>
  );
}
```

## Advanced Patterns

### Render Props Pattern

```tsx
<AuthorizedComponent
  permission="users.delete"
  render={(isAuthorized) => (
    <button
      onClick={handleAction}
      disabled={!isAuthorized}
      className={isAuthorized ? 'btn-danger' : 'btn-disabled'}
      title={isAuthorized ? 'Delete user' : 'No permission to delete'}
    >
      {isAuthorized ? 'Delete User' : 'Delete (No Access)'}
    </button>
  )}
/>
```

### Programmatic Permission Checks

```tsx
import { usePermissions } from '@saas-app/react-permissions';

function ComplexComponent() {
  const { hasPermission, hasAnyPermission, hasRole } = usePermissions();

  const handleAction = () => {
    if (hasPermission('users.delete')) {
      // Perform delete
      deleteUser();
    } else if (hasPermission('users.archive')) {
      // Alternative action
      archiveUser();
    } else {
      showError('No permission to perform this action');
    }
  };

  const canManageUsers = hasAnyPermission([
    'users.create',
    'users.update',
    'users.delete'
  ]);

  const isPrivileged = hasRole('admin') || hasRole('manager');

  return (
    <div>
      {canManageUsers && <button onClick={handleManage}>Manage Users</button>}
      {isPrivileged && <button onClick={handlePrivileged}>Admin Action</button>}
    </div>
  );
}
```

### HOC Pattern

```tsx
import { withPermission, requireAdmin } from '@saas-app/react-permissions';

// Using withPermission
const ProtectedUserList = withPermission(UserListComponent, {
  permission: 'users.read',
  fallback: <div>You don't have access to view users</div>
});

// Using requireAdmin
const AdminDashboard = requireAdmin(DashboardComponent);

// Usage
function App() {
  return (
    <div>
      <ProtectedUserList />
      <AdminDashboard />
    </div>
  );
}
```

### Custom Hook Composition

```tsx
// Custom hook combining multiple permission checks
function useUserManagementPermissions() {
  const { hasPermission } = usePermissions();

  return {
    canView: hasPermission('users.read'),
    canCreate: hasPermission('users.create'),
    canEdit: hasPermission('users.update'),
    canDelete: hasPermission('users.delete'),
    canManageRoles: hasPermission('users.roles.update'),
    canManagePermissions: hasPermission('users.permissions.update'),
    canExport: hasPermission('users.export'),
    canImport: hasPermission('users.import'),
  };
}

// Usage
function UserManagement() {
  const perms = useUserManagementPermissions();

  return (
    <div>
      {perms.canCreate && <button>Create</button>}
      {perms.canEdit && <button>Edit</button>}
      {perms.canDelete && <button>Delete</button>}
      {perms.canExport && <button>Export</button>}
    </div>
  );
}
```

### Inverted Logic

```tsx
// Show content only when NOT authorized (e.g., upgrade prompts)
<AuthorizedComponent
  permission="premium.features"
  invert={true}
>
  <div className="upgrade-prompt">
    <h3>Upgrade to Premium</h3>
    <p>Unlock premium features with a subscription!</p>
    <button>Upgrade Now</button>
  </div>
</AuthorizedComponent>
```

### Loading States

```tsx
<PermissionProvider
  token={token}
  loadingComponent={
    <div className="loading-screen">
      <Spinner size="large" />
      <p>Loading your permissions...</p>
    </div>
  }
  errorComponent={
    <div className="error-screen">
      <h1>Authentication Error</h1>
      <p>Failed to load permissions. Please try logging in again.</p>
      <button onClick={handleRelogin}>Login Again</button>
    </div>
  }
>
  <YourApp />
</PermissionProvider>
```

## Best Practices

1. **Always check permissions on the backend** - Client-side checks are for UI only
2. **Use specific permissions** - Prefer `users.delete` over `users.*`
3. **Cache permission checks** - Use `useMemo` for expensive checks
4. **Provide clear fallbacks** - Tell users why they can't access something
5. **Test permission scenarios** - Write tests for different permission sets
6. **Use the debugger** - Enable `<PermissionDebugger />` during development
7. **Document permissions** - Keep a list of all permissions your app uses
8. **Handle loading states** - Always show appropriate loading indicators

## Common Patterns

### Permission Constants

```tsx
// permissions.ts
export const PERMISSIONS = {
  USERS_CREATE: 'users.create',
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_ALL: 'users.*',
} as const;

// Usage
<AuthorizedComponent permission={PERMISSIONS.USERS_CREATE}>
  <CreateButton />
</AuthorizedComponent>
```

### Permission Groups

```tsx
const ADMIN_PERMISSIONS = ['admin.*', 'system.manage'];
const MANAGER_PERMISSIONS = ['users.*', 'roles.read'];

<AuthorizedComponent permission={ADMIN_PERMISSIONS}>
  <AdminPanel />
</AuthorizedComponent>
```

## Troubleshooting

### Permission not working?

1. Check if user is authenticated: `const { isAuthenticated } = usePermissions()`
2. Verify token includes permission: Use `<PermissionDebugger />`
3. Check permission spelling: Permissions are case-sensitive
4. Check wildcard matching: `users.*` grants `users.create`, `users.read`, etc.
5. Verify component is inside `<PermissionProvider>`

### Token expired?

```tsx
const { refresh, error } = usePermissions();

useEffect(() => {
  if (error?.message === 'JWT token is expired') {
    // Refresh token
    refreshAuthToken().then(newToken => {
      refresh();
    });
  }
}, [error]);
```

## More Examples

See the [README.md](../README.md) for more detailed API documentation and examples.
