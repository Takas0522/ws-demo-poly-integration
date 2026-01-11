/**
 * Permission Context Provider
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { JWTAccessPayload } from '@saas-app/types';
import {
  PermissionContextValue,
  PermissionProviderProps,
} from '../types';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  parseJWT,
  isTokenExpired,
} from '../utils/permissions';

// Create the context
const PermissionContext = createContext<PermissionContextValue | undefined>(
  undefined
);

/**
 * Permission Provider Component
 */
export const PermissionProvider: React.FC<PermissionProviderProps> = ({
  children,
  token,
  loadPermissions,
  loadingComponent = <div>Loading permissions...</div>,
  errorComponent,
  onPermissionsLoaded,
  onError,
}) => {
  const [payload, setPayload] = useState<JWTAccessPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  // Load permissions from token or custom loader
  const loadPermissionsData = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      let permissionPayload: JWTAccessPayload | null = null;

      if (typeof token === 'string') {
        // Parse JWT token
        if (isTokenExpired(token)) {
          throw new Error('JWT token is expired');
        }
        permissionPayload = parseJWT(token) as JWTAccessPayload;
      } else if (typeof token === 'object' && token !== null) {
        // Use provided payload directly
        permissionPayload = token;
      } else if (loadPermissions) {
        // Use custom loader
        permissionPayload = await loadPermissions();
      }

      if (!permissionPayload) {
        throw new Error('No valid permission data available');
      }

      setPayload(permissionPayload);
      onPermissionsLoaded?.(permissionPayload);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [token, loadPermissions, onPermissionsLoaded, onError]);

  // Load permissions on mount and when token changes
  useEffect(() => {
    loadPermissionsData();
  }, [loadPermissionsData]);

  // Create context value with memoized functions
  const contextValue = useMemo<PermissionContextValue>(() => {
    const permissions = payload?.permissions || [];
    const roles = payload?.roles || [];

    return {
      permissions,
      roles,
      userId: payload?.sub || '',
      tenantId: payload?.tenantId || '',
      email: payload?.email || '',
      displayName: payload?.displayName || '',
      isLoading,
      isAuthenticated: !!payload && !error,
      error,
      hasPermission: (permission) => hasPermission(permissions, permission),
      hasAnyPermission: (perms) => hasAnyPermission(permissions, perms),
      hasAllPermissions: (perms) => hasAllPermissions(permissions, perms),
      hasRole: (role) => hasRole(roles, role),
      hasAnyRole: (roleList) => hasAnyRole(roles, roleList),
      refresh: loadPermissionsData,
    };
  }, [payload, isLoading, error, loadPermissionsData]);

  // Show loading state
  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  // Show error state
  if (error && errorComponent) {
    return <>{errorComponent}</>;
  }

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
};

/**
 * Hook to use permission context
 */
export function usePermissions(): PermissionContextValue {
  const context = useContext(PermissionContext);

  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }

  return context;
}

/**
 * Hook to check if user has a specific permission
 */
export function useHasPermission(permission: string): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
}

/**
 * Hook to check if user has any of the specified permissions
 */
export function useHasAnyPermission(permissions: string[]): boolean {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(permissions);
}

/**
 * Hook to check if user has all of the specified permissions
 */
export function useHasAllPermissions(permissions: string[]): boolean {
  const { hasAllPermissions } = usePermissions();
  return hasAllPermissions(permissions);
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(role: string): boolean {
  const { hasRole } = usePermissions();
  return hasRole(role);
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useHasAnyRole(roles: string[]): boolean {
  const { hasAnyRole } = usePermissions();
  return hasAnyRole(roles);
}
