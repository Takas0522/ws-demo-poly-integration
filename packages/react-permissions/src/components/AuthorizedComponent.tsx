/**
 * Authorized Component Wrapper
 * Conditionally renders children based on user permissions
 */

import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { AuthorizedComponentProps } from '../types';

/**
 * AuthorizedComponent wrapper
 * 
 * Example usage:
 * ```tsx
 * <AuthorizedComponent permission="users.create">
 *   <CreateUserButton />
 * </AuthorizedComponent>
 * 
 * <AuthorizedComponent permission={["users.update", "users.delete"]} requireAll>
 *   <EditUserForm />
 * </AuthorizedComponent>
 * 
 * <AuthorizedComponent role="admin" fallback={<AccessDenied />}>
 *   <AdminPanel />
 * </AuthorizedComponent>
 * ```
 */
export const AuthorizedComponent: React.FC<AuthorizedComponentProps> = ({
  children,
  permission,
  role,
  requireAll = false,
  fallback = null,
  loading = null,
  render,
  invert = false,
}) => {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isLoading,
    isAuthenticated,
  } = usePermissions();

  // Show loading state
  if (isLoading) {
    return <>{loading}</>;
  }

  // Check if authenticated
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  let isAuthorized = true;

  // Check permissions
  if (permission) {
    if (Array.isArray(permission)) {
      isAuthorized = requireAll
        ? hasAllPermissions(permission)
        : hasAnyPermission(permission);
    } else {
      isAuthorized = hasPermission(permission);
    }
  }

  // Check roles (AND with permission check if both specified)
  if (role) {
    let roleAuthorized: boolean;
    if (Array.isArray(role)) {
      roleAuthorized = requireAll
        ? role.every((r) => hasRole(r))
        : hasAnyRole(role);
    } else {
      roleAuthorized = hasRole(role);
    }
    
    // Combine with permission check if both are specified
    if (permission) {
      isAuthorized = isAuthorized && roleAuthorized;
    } else {
      isAuthorized = roleAuthorized;
    }
  }

  // Invert authorization if requested
  if (invert) {
    isAuthorized = !isAuthorized;
  }

  // Use render prop if provided
  if (render) {
    return <>{render(isAuthorized)}</>;
  }

  // Render children or fallback
  return isAuthorized ? <>{children}</> : <>{fallback}</>;
};

/**
 * Authorized Button - convenience wrapper for buttons
 */
export const AuthorizedButton: React.FC<
  AuthorizedComponentProps & {
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
  }
> = ({ children, onClick, className, disabled, type = 'button', ...authProps }) => {
  return (
    <AuthorizedComponent {...authProps}>
      <button
        type={type}
        onClick={onClick}
        className={className}
        disabled={disabled}
      >
        {children}
      </button>
    </AuthorizedComponent>
  );
};

/**
 * Authorized Link - convenience wrapper for links
 */
export const AuthorizedLink: React.FC<
  AuthorizedComponentProps & {
    href?: string;
    className?: string;
    target?: string;
  }
> = ({ children, href, className, target, ...authProps }) => {
  return (
    <AuthorizedComponent {...authProps}>
      <a href={href} className={className} target={target}>
        {children}
      </a>
    </AuthorizedComponent>
  );
};
