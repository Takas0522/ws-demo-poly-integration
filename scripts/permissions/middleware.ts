/**
 * Express Middleware for Permission Checking
 * 
 * Provides middleware functions to protect routes with permission requirements
 */

import { Request, Response, NextFunction } from 'express';
import { hasPermission, hasAnyPermission, hasAllPermissions } from './checker';
import { UserPermissionContext, PermissionScope, Role } from './types';

/**
 * Extended Express Request with user context
 */
export interface AuthenticatedRequest extends Request {
  user?: UserPermissionContext;
  roles?: Role[];
}

/**
 * Options for permission middleware
 */
export interface PermissionMiddlewareOptions {
  /** Permission scope (default: 'tenant') */
  scope?: PermissionScope;
  /** Custom error message */
  errorMessage?: string;
  /** Custom error status code (default: 403) */
  errorStatus?: number;
  /** Function to extract resource owner ID from request */
  getResourceOwnerId?: (req: AuthenticatedRequest) => string | undefined;
}

/**
 * Middleware to require a specific permission
 * 
 * @example
 * router.post('/users', requirePermission('users.create'), createUser);
 * router.put('/users/:id', requirePermission('users.update', { scope: 'own', getResourceOwnerId: (req) => req.params.id }), updateUser);
 */
export function requirePermission(
  permission: string,
  options: PermissionMiddlewareOptions = {}
) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const {
      scope = 'tenant',
      errorMessage,
      errorStatus = 403,
      getResourceOwnerId
    } = options;

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User must be authenticated'
      });
    }

    // Create context with resource owner if needed
    const context = {
      ...req.user,
      resourceOwnerId: getResourceOwnerId ? getResourceOwnerId(req) : req.user.resourceOwnerId
    };

    // Check permission
    const result = hasPermission(context, permission, scope, req.roles);

    if (!result.granted) {
      return res.status(errorStatus).json({
        error: 'Forbidden',
        message: errorMessage || result.reason,
        required: permission
      });
    }

    next();
  };
}

/**
 * Middleware to require any of the specified permissions
 * 
 * @example
 * router.get('/users', requireAnyPermission(['users.read', 'users.list']), getUsers);
 */
export function requireAnyPermission(
  permissions: string[],
  options: PermissionMiddlewareOptions = {}
) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const {
      scope = 'tenant',
      errorMessage,
      errorStatus = 403,
      getResourceOwnerId
    } = options;

    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User must be authenticated'
      });
    }

    const context = {
      ...req.user,
      resourceOwnerId: getResourceOwnerId ? getResourceOwnerId(req) : req.user.resourceOwnerId
    };

    const result = hasAnyPermission(context, permissions, scope, req.roles);

    if (!result.granted) {
      return res.status(errorStatus).json({
        error: 'Forbidden',
        message: errorMessage || result.reason,
        required: permissions
      });
    }

    next();
  };
}

/**
 * Middleware to require all of the specified permissions
 * 
 * @example
 * router.delete('/users/:id', requireAllPermissions(['users.delete', 'audit.create']), deleteUser);
 */
export function requireAllPermissions(
  permissions: string[],
  options: PermissionMiddlewareOptions = {}
) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const {
      scope = 'tenant',
      errorMessage,
      errorStatus = 403,
      getResourceOwnerId
    } = options;

    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User must be authenticated'
      });
    }

    const context = {
      ...req.user,
      resourceOwnerId: getResourceOwnerId ? getResourceOwnerId(req) : req.user.resourceOwnerId
    };

    const result = hasAllPermissions(context, permissions, scope, req.roles);

    if (!result.granted) {
      return res.status(errorStatus).json({
        error: 'Forbidden',
        message: errorMessage || result.reason,
        required: permissions
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has a role
 * 
 * @example
 * router.get('/admin', requireRole('admin'), adminDashboard);
 */
export function requireRole(roleName: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User must be authenticated'
      });
    }

    if (!req.user.roles.includes(roleName)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `User must have role: ${roleName}`,
        required: roleName
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has any of the specified roles
 * 
 * @example
 * router.get('/dashboard', requireAnyRole(['admin', 'manager']), dashboard);
 */
export function requireAnyRole(roleNames: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User must be authenticated'
      });
    }

    const hasRole = roleNames.some(role => req.user!.roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `User must have one of the roles: ${roleNames.join(', ')}`,
        required: roleNames
      });
    }

    next();
  };
}
