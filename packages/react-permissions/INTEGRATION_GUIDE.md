# Frontend Integration Guide

This guide explains how to integrate the `@saas-app/react-permissions` package into the frontend submodule (`src/front`).

## Prerequisites

- Frontend repository: `ws-demo-poly1`
- Branch: Same as integration repository (e.g., `copilot/add-frontend-authorization-controls`)
- The `@saas-app/react-permissions` package is built and available

## Integration Steps

### 1. Build the Package

First, build the react-permissions package:

```bash
cd packages/react-permissions
npm install
npm run build
```

### 2. Link the Package to Frontend

Since the frontend is in a submodule, you need to link the package:

```bash
# From the react-permissions package directory
npm link

# Navigate to frontend submodule
cd ../../src/front
npm link @saas-app/react-permissions
```

Alternatively, reference it directly in package.json:

```json
{
  "dependencies": {
    "@saas-app/react-permissions": "file:../../packages/react-permissions"
  }
}
```

### 3. Update Frontend App Structure

Update your main App component to include the PermissionProvider:

```tsx
// src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { PermissionProvider, PermissionDebugger } from '@saas-app/react-permissions';

function App() {
  const [token, setToken] = useState<string | null>(null);

  // Load token from storage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    setToken(storedToken);
  }, []);

  return (
    <PermissionProvider
      token={token}
      loadingComponent={
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading application...</p>
        </div>
      }
      errorComponent={
        <div className="error-container">
          <h1>Authentication Error</h1>
          <p>Please log in to continue.</p>
        </div>
      }
      onPermissionsLoaded={(payload) => {
        console.log('User permissions loaded:', payload.permissions);
      }}
      onError={(error) => {
        console.error('Permission error:', error);
        // Redirect to login or show error
      }}
    >
      <Router>
        {/* Your routes */}
      </Router>
      
      {/* Add permission debugger in development */}
      {process.env.NODE_ENV === 'development' && (
        <PermissionDebugger position="bottom-right" />
      )}
    </PermissionProvider>
  );
}

export default App;
```

### 4. Create Auth Context (Optional)

If you want to manage authentication state separately:

```tsx
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('accessToken')
  );

  const login = useCallback((newToken: string) => {
    localStorage.setItem('accessToken', newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

Then update App.tsx:

```tsx
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PermissionProvider } from '@saas-app/react-permissions';

function AppContent() {
  const { token } = useAuth();
  
  return (
    <PermissionProvider token={token}>
      {/* Your app content */}
    </PermissionProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
```

### 5. Update Login Component

Update your login component to store the JWT token:

```tsx
// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Store token and update auth state
      login(data.tokens.accessToken);
      
      // Navigate to home page
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Login</h1>
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      
      <button type="submit">Login</button>
    </form>
  );
}
```

### 6. Add Permission Checks to Components

Example: User Management Page

```tsx
// src/pages/UserManagement.tsx
import React, { useState, useEffect } from 'react';
import {
  AuthorizedComponent,
  AuthorizedButton,
  useHasPermission,
  usePermissions,
} from '@saas-app/react-permissions';

export function UserManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  const canCreate = useHasPermission('users.create');
  const canEdit = useHasPermission('users.update');
  const canDelete = useHasPermission('users.delete');
  const { hasAnyPermission } = usePermissions();
  
  const canManage = hasAnyPermission(['users.create', 'users.update', 'users.delete']);

  const handleCreateUser = () => {
    // Create user logic
  };

  const handleEditUser = (userId: string) => {
    // Edit user logic
  };

  const handleDeleteUsers = () => {
    // Delete users logic
  };

  return (
    <div className="user-management">
      <div className="header">
        <h1>User Management</h1>
        
        {/* Show create button only if user has permission */}
        <AuthorizedButton
          permission="users.create"
          onClick={handleCreateUser}
          className="btn-primary"
        >
          Create User
        </AuthorizedButton>
      </div>

      {/* Toolbar with bulk actions */}
      <div className="toolbar">
        <AuthorizedComponent 
          permission="users.import"
          fallback={<span className="disabled">Import (No Access)</span>}
        >
          <button onClick={handleImport}>Import Users</button>
        </AuthorizedComponent>

        <AuthorizedComponent permission="users.delete">
          <button
            onClick={handleDeleteUsers}
            disabled={selectedUsers.length === 0}
            className="btn-danger"
          >
            Delete Selected ({selectedUsers.length})
          </button>
        </AuthorizedComponent>
      </div>

      {/* User list */}
      <div className="user-list">
        {users.map((user) => (
          <div key={user.id} className="user-card">
            <div className="user-info">
              <h3>{user.displayName}</h3>
              <p>{user.email}</p>
            </div>
            
            <div className="user-actions">
              {/* Edit button */}
              <AuthorizedComponent permission="users.update">
                <button onClick={() => handleEditUser(user.id)}>
                  Edit
                </button>
              </AuthorizedComponent>

              {/* Delete button */}
              <AuthorizedComponent permission="users.delete">
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="btn-danger"
                >
                  Delete
                </button>
              </AuthorizedComponent>

              {/* Admin-only impersonate button */}
              <AuthorizedComponent role="admin">
                <button onClick={() => impersonateUser(user.id)}>
                  Impersonate
                </button>
              </AuthorizedComponent>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 7. Add Permission Checks to Navigation

```tsx
// src/components/Navigation.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { AuthorizedLink } from '@saas-app/react-permissions';

export function Navigation() {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        
        {/* Show Users link only if user can read users */}
        <AuthorizedLink permission="users.read" href="/users">
          <li>Users</li>
        </AuthorizedLink>

        {/* Show Admin link only to admins */}
        <AuthorizedLink role="admin" href="/admin">
          <li>Admin Panel</li>
        </AuthorizedLink>

        {/* Show Settings link if user has any settings permission */}
        <AuthorizedLink 
          permission={["settings.read", "settings.update"]}
          href="/settings"
        >
          <li>Settings</li>
        </AuthorizedLink>
      </ul>
    </nav>
  );
}
```

### 8. Protect Routes

```tsx
// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthorizedComponent } from '@saas-app/react-permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string | string[];
  role?: string | string[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  permission,
  role,
  redirectTo = '/access-denied',
}: ProtectedRouteProps) {
  return (
    <AuthorizedComponent
      permission={permission}
      role={role}
      fallback={<Navigate to={redirectTo} replace />}
    >
      {children}
    </AuthorizedComponent>
  );
}
```

Use in routes:

```tsx
// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route
        path="/users"
        element={
          <ProtectedRoute permission="users.read">
            <UserManagement />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminPanel />
          </ProtectedRoute>
        }
      />
      
      <Route path="/access-denied" element={<AccessDenied />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
```

### 9. Add TypeScript Types

Create a types file for your frontend:

```tsx
// src/types/permissions.ts
import type { PermissionString } from '@saas-app/react-permissions';

// Define your application's permissions
export const AppPermissions = {
  // User permissions
  USERS_CREATE: 'users.create' as PermissionString,
  USERS_READ: 'users.read' as PermissionString,
  USERS_UPDATE: 'users.update' as PermissionString,
  USERS_DELETE: 'users.delete' as PermissionString,
  USERS_ALL: 'users.*' as PermissionString,

  // Role permissions
  ROLES_CREATE: 'roles.create' as PermissionString,
  ROLES_READ: 'roles.read' as PermissionString,
  ROLES_UPDATE: 'roles.update' as PermissionString,
  ROLES_DELETE: 'roles.delete' as PermissionString,

  // Settings permissions
  SETTINGS_READ: 'settings.read' as PermissionString,
  SETTINGS_UPDATE: 'settings.update' as PermissionString,
} as const;

// Define your application's roles
export const AppRoles = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
} as const;
```

Use in components:

```tsx
import { AuthorizedComponent } from '@saas-app/react-permissions';
import { AppPermissions } from '../types/permissions';

<AuthorizedComponent permission={AppPermissions.USERS_CREATE}>
  <CreateUserButton />
</AuthorizedComponent>
```

### 10. Testing

Create test utilities:

```tsx
// src/test-utils/permission-wrapper.tsx
import React from 'react';
import { render } from '@testing-library/react';
import { PermissionProvider } from '@saas-app/react-permissions';
import type { JWTAccessPayload } from '@saas-app/types';

export function createMockUser(overrides?: Partial<JWTAccessPayload>): JWTAccessPayload {
  return {
    sub: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    tenantId: 'test-tenant-id',
    roles: ['user'],
    permissions: ['users.read'],
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  };
}

export function renderWithPermissions(
  ui: React.ReactElement,
  payload?: JWTAccessPayload
) {
  const mockPayload = payload || createMockUser();

  return render(
    <PermissionProvider token={mockPayload}>
      {ui}
    </PermissionProvider>
  );
}
```

Write tests:

```tsx
// src/pages/UserManagement.test.tsx
import { screen } from '@testing-library/react';
import { renderWithPermissions, createMockUser } from '../test-utils/permission-wrapper';
import { UserManagement } from './UserManagement';

describe('UserManagement', () => {
  it('shows create button when user has permission', () => {
    const user = createMockUser({
      permissions: ['users.read', 'users.create'],
    });

    renderWithPermissions(<UserManagement />, user);

    expect(screen.getByText('Create User')).toBeInTheDocument();
  });

  it('hides delete button when user lacks permission', () => {
    const user = createMockUser({
      permissions: ['users.read'], // No delete permission
    });

    renderWithPermissions(<UserManagement />, user);

    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('shows admin features for admin users', () => {
    const admin = createMockUser({
      roles: ['admin'],
      permissions: ['users.*'],
    });

    renderWithPermissions(<UserManagement />, admin);

    expect(screen.getByText('Impersonate')).toBeInTheDocument();
  });
});
```

## Commit Changes to Submodule

After integrating the package into the frontend:

```bash
# In the frontend submodule (src/front)
cd src/front
git add .
git commit -m "feat: add button-level authorization controls"
git push origin copilot/add-frontend-authorization-controls

# Return to main repo
cd ../..

# Update the submodule reference
git add src/front
git commit -m "Update frontend submodule with authorization controls"
git push
```

## Troubleshooting

### Issue: Package not found

**Solution**: Make sure you've built the package and linked it correctly:
```bash
cd packages/react-permissions
npm install
npm run build
npm link
cd ../../src/front
npm link @saas-app/react-permissions
```

### Issue: Token expired errors

**Solution**: Implement token refresh logic:
```tsx
const { refresh } = usePermissions();

// Refresh on 401 errors
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      await refresh();
      return axios.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

### Issue: Permissions not updating

**Solution**: Call the refresh function when permissions might have changed:
```tsx
const { refresh } = usePermissions();

const handleRoleUpdate = async () => {
  await updateUserRole();
  await refresh(); // Reload permissions
};
```

## Next Steps

1. Build the package: `npm run build` in `packages/react-permissions`
2. Test locally with the frontend
3. Create comprehensive integration tests
4. Document any frontend-specific permission requirements
5. Update frontend documentation with permission examples

## Related Documentation

- [Package README](../README.md)
- [Main Repository README](../../README.md)
- [Issue #009: Button-Level Authorization Controls](https://github.com/Takas0522/ws-demo-poly-integration/issues/9)
