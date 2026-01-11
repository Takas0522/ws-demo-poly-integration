/**
 * @saas-app/react-permissions
 * React components and hooks for permission-based UI authorization
 */

// Context and Provider
export {
  PermissionProvider,
  usePermissions,
  useHasPermission,
  useHasAnyPermission,
  useHasAllPermissions,
  useHasRole,
  useHasAnyRole,
} from './hooks/usePermissions';

// Components
export {
  AuthorizedComponent,
  AuthorizedButton,
  AuthorizedLink,
} from './components/AuthorizedComponent';

export {
  withPermission,
  requirePermission,
  requireRole,
  requireAdmin,
  requireAuth,
} from './components/withPermission';

export { PermissionDebugger } from './components/PermissionDebugger';

// Utilities
export {
  normalizePermission,
  matchesPermission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  hasAllRoles,
  parseJWT,
  isTokenExpired,
  checkPermissionWithReason,
  logPermissionCheck,
} from './utils/permissions';

// Types
export type {
  PermissionContextValue,
  PermissionProviderProps,
  AuthorizedComponentProps,
  WithPermissionOptions,
  PermissionDebuggerProps,
  PermissionCheckDebugResult,
} from './types';

// Re-export types from @saas-app/types for convenience
export type {
  PermissionString,
  PermissionScope,
  PermissionAction,
  ParsedPermission,
  Role,
  UserPermissionContext,
  PermissionCheckResult,
  PermissionValidationResult,
} from '@saas-app/types';
