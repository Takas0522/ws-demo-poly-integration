/**
 * React-specific permission types
 */

import { PermissionString, JWTAccessPayload } from '@saas-app/types';
import { ReactNode } from 'react';

/**
 * Permission context value
 */
export interface PermissionContextValue {
  /** User's permissions from JWT */
  permissions: PermissionString[];
  /** User's roles from JWT */
  roles: string[];
  /** User ID */
  userId: string;
  /** Tenant ID */
  tenantId: string;
  /** User email */
  email: string;
  /** User display name */
  displayName: string;
  /** Whether the context is loading */
  isLoading: boolean;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Error if any occurred during authentication */
  error?: Error;
  /** Check if user has a specific permission */
  hasPermission: (permission: PermissionString) => boolean;
  /** Check if user has any of the specified permissions */
  hasAnyPermission: (permissions: PermissionString[]) => boolean;
  /** Check if user has all of the specified permissions */
  hasAllPermissions: (permissions: PermissionString[]) => boolean;
  /** Check if user has a specific role */
  hasRole: (role: string) => boolean;
  /** Check if user has any of the specified roles */
  hasAnyRole: (roles: string[]) => boolean;
  /** Refresh the permission context */
  refresh: () => Promise<void>;
}

/**
 * Permission provider props
 */
export interface PermissionProviderProps {
  /** Child components */
  children: ReactNode;
  /** JWT access token or payload */
  token?: string | JWTAccessPayload;
  /** Custom permission loader function */
  loadPermissions?: () => Promise<JWTAccessPayload>;
  /** Loading component to show while permissions are being loaded */
  loadingComponent?: ReactNode;
  /** Fallback component to show on error */
  errorComponent?: ReactNode;
  /** Callback when permissions are loaded */
  onPermissionsLoaded?: (payload: JWTAccessPayload) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

/**
 * Authorized component props
 */
export interface AuthorizedComponentProps {
  /** Child components to render if authorized */
  children: ReactNode;
  /** Required permission(s) - string or array */
  permission?: PermissionString | PermissionString[];
  /** Required role(s) - string or array */
  role?: string | string[];
  /** Require ALL permissions (default: false = ANY permission) */
  requireAll?: boolean;
  /** Fallback component to render if not authorized */
  fallback?: ReactNode;
  /** Loading component to show while checking permissions */
  loading?: ReactNode;
  /** Render prop alternative - receives isAuthorized boolean */
  render?: (isAuthorized: boolean) => ReactNode;
  /** Invert the authorization check (show when NOT authorized) */
  invert?: boolean;
}

/**
 * HOC with permission options
 */
export interface WithPermissionOptions {
  /** Required permission(s) */
  permission?: PermissionString | PermissionString[];
  /** Required role(s) */
  role?: string | string[];
  /** Require ALL permissions (default: false = ANY) */
  requireAll?: boolean;
  /** Fallback component if not authorized */
  fallback?: ReactNode;
  /** Loading component */
  loading?: ReactNode;
}

/**
 * Permission debugger props
 */
export interface PermissionDebuggerProps {
  /** Position on screen */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Whether to show by default (default: false) */
  defaultOpen?: boolean;
  /** Enable keyboard shortcut to toggle (default: true) */
  enableShortcut?: boolean;
  /** Keyboard shortcut (default: 'Ctrl+Shift+P') */
  shortcut?: string;
  /** Show only in development (default: true) */
  onlyInDev?: boolean;
}

/**
 * Permission check result for debugging
 */
export interface PermissionCheckDebugResult {
  /** Permission being checked */
  permission: PermissionString;
  /** Whether check passed */
  granted: boolean;
  /** Reason for the result */
  reason: string;
  /** Timestamp of check */
  timestamp: number;
  /** Matched permission if granted */
  matchedPermission?: string;
}
