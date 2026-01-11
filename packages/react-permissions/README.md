# @saas-app/react-permissions

React components and hooks for permission-based UI authorization in the SaaS Management Application.

## 📋 Overview

This package provides a comprehensive set of React components, hooks, and utilities for implementing button-level and component-level authorization controls based on user permissions and roles. It integrates seamlessly with the JWT-based authentication system and the dot-notation permission system.

## ✨ Features

- **Permission Context Provider** - Centralized permission state management
- **Authorized Component Wrapper** - Conditional rendering based on permissions
- **React Hooks** - Easy-to-use hooks for permission checks
- **Higher-Order Components** - HOCs for wrapping components with authorization
- **Permission Debugger** - Development tool for debugging permissions
- **TypeScript Support** - Full TypeScript type definitions
- **Loading States** - Built-in loading indicators for async permission checks
- **Wildcard Support** - Supports wildcard permissions like `users.*`
- **Role-Based Access** - Check both permissions and roles

## 📦 Installation

```bash
npm install @saas-app/react-permissions
# or
yarn add @saas-app/react-permissions
```

**Peer Dependencies:**
- `react >= 18.0.0`
- `react-dom >= 18.0.0`
- `@saas-app/types ^1.0.0`

## 🚀 Quick Start

### 1. Wrap your app with PermissionProvider

```tsx
import { PermissionProvider } from '@saas-app/react-permissions';

function App() {
  // Get JWT token from your auth system
  const token = localStorage.getItem('accessToken');

  return (
    <PermissionProvider token={token}>
      <YourApp />
    </PermissionProvider>
  );
}
```

### 2. Use AuthorizedComponent for conditional rendering

```tsx
import { AuthorizedComponent } from '@saas-app/react-permissions';

function UserManagementPage() {
  return (
    <div>
      <h1>User Management</h1>
      
      {/* Show create button only if user has permission */}
      <AuthorizedComponent permission="users.create">
        <button onClick={createUser}>Create User</button>
      </AuthorizedComponent>
      
      {/* Show edit button with fallback */}
      <AuthorizedComponent 
        permission="users.update"
        fallback={<span>No edit access</span>}
      >
        <button onClick={editUser}>Edit User</button>
      </AuthorizedComponent>
    </div>
  );
}
```

### 3. Use hooks for programmatic permission checks

```tsx
import { useHasPermission, usePermissions } from '@saas-app/react-permissions';

function UserActions() {
  const canDelete = useHasPermission('users.delete');
  const { hasAnyPermission } = usePermissions();
  
  const canModify = hasAnyPermission(['users.update', 'users.delete']);

  const handleAction = () => {
    if (canDelete) {
      deleteUser();
    } else {
      showAccessDenied();
    }
  };

  return (
    <div>
      <button onClick={handleAction} disabled={!canModify}>
        {canDelete ? 'Delete User' : 'View User'}
      </button>
    </div>
  );
}
```

## 📚 API Reference

### Components

#### PermissionProvider

Provides permission context to all child components.

```tsx
<PermissionProvider
  token={jwtToken}                    // JWT token string or payload object
  loadPermissions={customLoader}       // Optional custom permission loader
  loadingComponent={<Spinner />}       // Loading indicator
  errorComponent={<Error />}           // Error fallback
  onPermissionsLoaded={handleLoaded}   // Callback when loaded
  onError={handleError}                // Error callback
>
  {children}
</PermissionProvider>
```

**Props:**
- `token?: string | JWTAccessPayload` - JWT token or parsed payload
- `loadPermissions?: () => Promise<JWTAccessPayload>` - Custom loader function
- `loadingComponent?: ReactNode` - Component to show while loading
- `errorComponent?: ReactNode` - Component to show on error
- `onPermissionsLoaded?: (payload: JWTAccessPayload) => void` - Success callback
- `onError?: (error: Error) => void` - Error callback

#### AuthorizedComponent

Conditionally renders children based on permissions or roles.

```tsx
<AuthorizedComponent
  permission="users.create"           // Single permission
  permission={["users.update", "users.delete"]}  // Multiple permissions
  role="admin"                        // Single role
  role={["admin", "manager"]}        // Multiple roles
  requireAll={true}                   // Require ALL permissions (default: ANY)
  fallback={<AccessDenied />}        // Fallback component
  loading={<Spinner />}              // Loading component
  invert={false}                     // Invert check (show when NOT authorized)
  render={(isAuthorized) => ...}     // Render prop alternative
>
  {children}
</AuthorizedComponent>
```

**Props:**
- `permission?: string | string[]` - Required permission(s)
- `role?: string | string[]` - Required role(s)
- `requireAll?: boolean` - Require all permissions/roles (default: false = ANY)
- `fallback?: ReactNode` - Render when not authorized
- `loading?: ReactNode` - Render while loading
- `render?: (isAuthorized: boolean) => ReactNode` - Render prop
- `invert?: boolean` - Show when NOT authorized (default: false)

#### AuthorizedButton

Convenience wrapper for buttons with permission checks.

```tsx
<AuthorizedButton
  permission="users.delete"
  onClick={handleDelete}
  className="btn-danger"
  disabled={false}
  type="button"
  fallback={null}
>
  Delete User
</AuthorizedButton>
```

#### AuthorizedLink

Convenience wrapper for links with permission checks.

```tsx
<AuthorizedLink
  permission="admin.access"
  href="/admin"
  className="nav-link"
  target="_blank"
>
  Admin Panel
</AuthorizedLink>
```

#### PermissionDebugger

Development tool for debugging permissions.

```tsx
<PermissionDebugger
  position="bottom-right"            // Position on screen
  defaultOpen={false}                // Open by default
  enableShortcut={true}              // Enable keyboard shortcut
  shortcut="Ctrl+Shift+P"           // Keyboard shortcut
  onlyInDev={true}                  // Only show in development
/>
```

Press `Ctrl+Shift+P` to toggle the debugger panel.

### Hooks

#### usePermissions()

Returns the full permission context.

```tsx
const {
  permissions,        // Array of permission strings
  roles,              // Array of role names
  userId,             // User ID
  tenantId,           // Tenant ID
  email,              // User email
  displayName,        // User display name
  isLoading,          // Loading state
  isAuthenticated,    // Authentication state
  error,              // Error if any
  hasPermission,      // Check single permission
  hasAnyPermission,   // Check any permission
  hasAllPermissions,  // Check all permissions
  hasRole,            // Check single role
  hasAnyRole,         // Check any role
  refresh,            // Refresh permissions
} = usePermissions();
```

#### useHasPermission(permission)

Check if user has a specific permission.

```tsx
const canCreate = useHasPermission('users.create');
const canDelete = useHasPermission('users.delete');
```

#### useHasAnyPermission(permissions)

Check if user has any of the specified permissions.

```tsx
const canModify = useHasAnyPermission(['users.update', 'users.delete']);
```

#### useHasAllPermissions(permissions)

Check if user has all of the specified permissions.

```tsx
const isFullAccess = useHasAllPermissions(['users.create', 'users.update', 'users.delete']);
```

#### useHasRole(role)

Check if user has a specific role.

```tsx
const isAdmin = useHasRole('admin');
const isManager = useHasRole('manager');
```

#### useHasAnyRole(roles)

Check if user has any of the specified roles.

```tsx
const canManage = useHasAnyRole(['admin', 'manager']);
```

### Higher-Order Components

#### withPermission(Component, options)

HOC that wraps a component with permission checks.

```tsx
const ProtectedComponent = withPermission(MyComponent, {
  permission: 'users.read',
  role: 'admin',
  requireAll: false,
  fallback: <AccessDenied />,
  loading: <Spinner />,
});
```

#### requirePermission(permission)

HOC decorator for requiring a specific permission.

```tsx
const UserList = requirePermission('users.read')(UserListComponent);
```

#### requireRole(role)

HOC decorator for requiring a specific role.

```tsx
const AdminPanel = requireRole('admin')(AdminPanelComponent);
```

#### requireAdmin(Component)

HOC that requires admin role.

```tsx
const AdminDashboard = requireAdmin(DashboardComponent);
```

### Utility Functions

#### hasPermission(userPermissions, requiredPermission)

Check if user has a specific permission (with wildcard support).

```tsx
import { hasPermission } from '@saas-app/react-permissions';

const canCreate = hasPermission(['users.*'], 'users.create'); // true
```

#### hasAnyPermission(userPermissions, requiredPermissions)

Check if user has any of the required permissions.

```tsx
const canModify = hasAnyPermission(
  ['users.read', 'users.update'],
  ['users.update', 'users.delete']
); // true (has update)
```

#### hasAllPermissions(userPermissions, requiredPermissions)

Check if user has all of the required permissions.

```tsx
const isFullAccess = hasAllPermissions(
  ['users.read', 'users.update', 'users.delete'],
  ['users.update', 'users.delete']
); // true
```

#### parseJWT(token)

Parse a JWT token and extract the payload.

```tsx
import { parseJWT } from '@saas-app/react-permissions';

const payload = parseJWT(jwtToken);
console.log(payload.permissions);
```

#### isTokenExpired(token)

Check if a JWT token is expired.

```tsx
import { isTokenExpired } from '@saas-app/react-permissions';

if (isTokenExpired(token)) {
  refreshToken();
}
```

## 💡 Usage Examples

### Example 1: Button-Level Authorization

```tsx
import { AuthorizedComponent } from '@saas-app/react-permissions';

function UserManagementToolbar() {
  return (
    <div className="toolbar">
      <AuthorizedComponent permission="users.create">
        <button onClick={handleCreate}>Create User</button>
      </AuthorizedComponent>
      
      <AuthorizedComponent permission="users.import">
        <button onClick={handleImport}>Import Users</button>
      </AuthorizedComponent>
      
      <AuthorizedComponent 
        permission={["users.delete", "users.bulk_delete"]}
        fallback={<button disabled>Delete (No Access)</button>}
      >
        <button onClick={handleDelete}>Delete Selected</button>
      </AuthorizedComponent>
    </div>
  );
}
```

### Example 2: Page-Level Authorization

```tsx
import { AuthorizedComponent } from '@saas-app/react-permissions';

function AdminPage() {
  return (
    <AuthorizedComponent
      role="admin"
      fallback={
        <div>
          <h1>Access Denied</h1>
          <p>You need admin privileges to view this page.</p>
        </div>
      }
    >
      <AdminDashboard />
    </AuthorizedComponent>
  );
}
```

### Example 3: Conditional UI with Hooks

```tsx
import { usePermissions } from '@saas-app/react-permissions';

function UserCard({ user }) {
  const { hasPermission, hasRole } = usePermissions();

  const canEdit = hasPermission('users.update');
  const canDelete = hasPermission('users.delete');
  const isAdmin = hasRole('admin');

  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      
      <div className="actions">
        {canEdit && <button onClick={() => editUser(user)}>Edit</button>}
        {canDelete && <button onClick={() => deleteUser(user)}>Delete</button>}
        {isAdmin && <button onClick={() => impersonate(user)}>Impersonate</button>}
      </div>
    </div>
  );
}
```

### Example 4: Render Props Pattern

```tsx
import { AuthorizedComponent } from '@saas-app/react-permissions';

function PermissionAwareButton() {
  return (
    <AuthorizedComponent
      permission="users.delete"
      render={(isAuthorized) => (
        <button 
          onClick={handleAction}
          disabled={!isAuthorized}
          className={isAuthorized ? 'btn-danger' : 'btn-disabled'}
        >
          {isAuthorized ? 'Delete User' : 'Delete (No Access)'}
        </button>
      )}
    />
  );
}
```

### Example 5: HOC Pattern

```tsx
import { withPermission, requireAdmin } from '@saas-app/react-permissions';

// Using withPermission
const ProtectedUserList = withPermission(UserListComponent, {
  permission: 'users.read',
  fallback: <div>You don't have access to view users.</div>,
});

// Using requireAdmin decorator
const AdminPanel = requireAdmin(AdminPanelComponent);

// Using requirePermission decorator
const CreateUserForm = requirePermission('users.create')(CreateUserFormComponent);
```

### Example 6: Multiple Permissions

```tsx
import { AuthorizedComponent } from '@saas-app/react-permissions';

function AdvancedUserEditor() {
  return (
    <div>
      {/* Require ANY of the permissions */}
      <AuthorizedComponent permission={["users.update", "users.admin"]}>
        <BasicEditForm />
      </AuthorizedComponent>
      
      {/* Require ALL permissions */}
      <AuthorizedComponent 
        permission={["users.update", "users.roles", "users.permissions"]}
        requireAll={true}
      >
        <AdvancedEditForm />
      </AuthorizedComponent>
    </div>
  );
}
```

### Example 7: Loading States

```tsx
import { PermissionProvider } from '@saas-app/react-permissions';

function App() {
  return (
    <PermissionProvider
      token={getToken()}
      loadingComponent={
        <div className="loading-screen">
          <Spinner />
          <p>Loading permissions...</p>
        </div>
      }
      errorComponent={
        <div className="error-screen">
          <h1>Authentication Error</h1>
          <p>Failed to load permissions. Please login again.</p>
        </div>
      }
    >
      <YourApp />
    </PermissionProvider>
  );
}
```

### Example 8: Custom Permission Loader

```tsx
import { PermissionProvider } from '@saas-app/react-permissions';

async function loadPermissionsFromAPI() {
  const response = await fetch('/api/auth/me');
  const data = await response.json();
  return data.user; // Returns JWTAccessPayload
}

function App() {
  return (
    <PermissionProvider
      loadPermissions={loadPermissionsFromAPI}
      onPermissionsLoaded={(payload) => {
        console.log('Permissions loaded:', payload.permissions);
      }}
      onError={(error) => {
        console.error('Failed to load permissions:', error);
      }}
    >
      <YourApp />
    </PermissionProvider>
  );
}
```

### Example 9: Permission Debugging

```tsx
import { PermissionDebugger } from '@saas-app/react-permissions';

function App() {
  return (
    <div>
      <YourApp />
      
      {/* Add debugger in development */}
      {process.env.NODE_ENV === 'development' && (
        <PermissionDebugger position="bottom-right" />
      )}
    </div>
  );
}
```

## 🔒 Permission Format

This package supports the dot-notation permission format used by the SaaS Management Application:

- **Simple permissions**: `users.create`, `users.read`, `users.update`, `users.delete`
- **Hierarchical permissions**: `app.users.create`, `services.auth.execute`
- **Wildcard permissions**: `users.*` (grants all user permissions), `app.*` (grants all app permissions)

### Wildcard Matching Examples

```tsx
// User has permission: "users.*"
hasPermission(['users.*'], 'users.create')  // ✓ true
hasPermission(['users.*'], 'users.read')    // ✓ true
hasPermission(['users.*'], 'users.update')  // ✓ true
hasPermission(['users.*'], 'roles.create')  // ✗ false

// User has permission: "app.users.*"
hasPermission(['app.users.*'], 'app.users.create')  // ✓ true
hasPermission(['app.users.*'], 'app.roles.create')  // ✗ false
```

## 🏗️ Integration with Frontend

To integrate this package into the frontend submodule (`src/front`):

### 1. Install the package

```bash
cd src/front
npm install @saas-app/react-permissions
```

### 2. Update your App component

```tsx
// src/App.tsx
import { PermissionProvider, PermissionDebugger } from '@saas-app/react-permissions';

function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('accessToken')
  );

  return (
    <PermissionProvider token={token}>
      <Router>
        <Routes>
          {/* Your routes */}
        </Routes>
      </Router>
      
      {process.env.NODE_ENV === 'development' && (
        <PermissionDebugger />
      )}
    </PermissionProvider>
  );
}
```

### 3. Use in your components

```tsx
// src/pages/UserManagement.tsx
import { AuthorizedComponent, useHasPermission } from '@saas-app/react-permissions';

export function UserManagement() {
  const canCreate = useHasPermission('users.create');

  return (
    <div>
      <h1>User Management</h1>
      
      {canCreate && (
        <button onClick={handleCreate}>Create User</button>
      )}
      
      <AuthorizedComponent permission="users.delete">
        <button onClick={handleDelete}>Delete Selected</button>
      </AuthorizedComponent>
    </div>
  );
}
```

## 🧪 Testing

### Testing Components with Permissions

```tsx
import { render, screen } from '@testing-library/react';
import { PermissionProvider } from '@saas-app/react-permissions';

const mockPayload = {
  sub: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  tenantId: 'tenant-456',
  roles: ['user'],
  permissions: ['users.read', 'users.create'],
  type: 'access' as const,
  iat: Date.now() / 1000,
  exp: Date.now() / 1000 + 3600,
};

describe('UserManagementPage', () => {
  it('shows create button when user has permission', () => {
    render(
      <PermissionProvider token={mockPayload}>
        <UserManagementPage />
      </PermissionProvider>
    );

    expect(screen.getByText('Create User')).toBeInTheDocument();
  });

  it('hides delete button when user lacks permission', () => {
    render(
      <PermissionProvider token={mockPayload}>
        <UserManagementPage />
      </PermissionProvider>
    );

    expect(screen.queryByText('Delete User')).not.toBeInTheDocument();
  });
});
```

## 📖 TypeScript Support

This package is written in TypeScript and provides full type definitions:

```tsx
import type {
  PermissionString,
  PermissionContextValue,
  AuthorizedComponentProps,
  WithPermissionOptions,
} from '@saas-app/react-permissions';

// Your TypeScript code with full type safety
```

## 🔗 Related Packages

- `@saas-app/types` - Shared TypeScript type definitions
- `py-permissions` - Python/FastAPI permission system (backend)

## 📄 License

MIT

## 🤝 Contributing

See the main repository's [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## 📞 Support

For questions or issues, please create an issue in the main repository: [ws-demo-poly-integration](https://github.com/Takas0522/ws-demo-poly-integration)
