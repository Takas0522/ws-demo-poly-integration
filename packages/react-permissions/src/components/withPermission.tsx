/**
 * Higher-Order Component for permission-based authorization
 */

import React from 'react';
import { WithPermissionOptions } from '../types';
import { AuthorizedComponent } from './AuthorizedComponent';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Higher-Order Component that wraps a component with permission checks
 * 
 * Example usage:
 * ```tsx
 * const ProtectedUserList = withPermission(UserList, {
 *   permission: 'users.read',
 *   fallback: <AccessDenied />
 * });
 * 
 * const AdminPanel = withPermission(AdminDashboard, {
 *   role: 'admin',
 *   fallback: <NotAuthorized />
 * });
 * ```
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  options: WithPermissionOptions
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <AuthorizedComponent
        permission={options.permission}
        role={options.role}
        requireAll={options.requireAll}
        fallback={options.fallback}
        loading={options.loading}
      >
        <Component {...props} />
      </AuthorizedComponent>
    );
  };

  // Set display name for debugging
  WrappedComponent.displayName = `withPermission(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WrappedComponent;
}

/**
 * HOC that requires a specific permission
 */
export function requirePermission<P extends object>(
  permission: string | string[]
) {
  return (Component: React.ComponentType<P>) =>
    withPermission(Component, { permission });
}

/**
 * HOC that requires a specific role
 */
export function requireRole<P extends object>(role: string | string[]) {
  return (Component: React.ComponentType<P>) =>
    withPermission(Component, { role });
}

/**
 * HOC that requires admin role
 */
export function requireAdmin<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return withPermission(Component, { role: 'admin' });
}

/**
 * HOC that shows component only to authenticated users
 */
export function requireAuth<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => {
    const { isAuthenticated } = usePermissions();
    
    if (!isAuthenticated) {
      return <>{fallback}</>;
    }
    
    return <Component {...props} />;
  };

  WrappedComponent.displayName = `requireAuth(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WrappedComponent;
}
