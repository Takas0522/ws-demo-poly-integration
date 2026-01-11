/**
 * Tests for Express middleware
 */

import { Request, Response, NextFunction } from 'express';
import {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireAnyRole,
  AuthenticatedRequest
} from './middleware';
import { UserPermissionContext, Role } from './types';

// Mock Express request, response, and next function
function createMockRequest(user?: UserPermissionContext, roles?: Role[]): AuthenticatedRequest {
  return {
    user,
    roles,
    params: {},
    query: {},
    body: {}
  } as AuthenticatedRequest;
}

function createMockResponse() {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const mockNext: NextFunction = jest.fn();

describe('requirePermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should allow access when user has permission', () => {
    const user: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: [],
      permissions: ['users.create']
    };

    const req = createMockRequest(user);
    const res = createMockResponse();

    const middleware = requirePermission('users.create');
    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should deny access when user lacks permission', () => {
    const user: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: [],
      permissions: ['users.read']
    };

    const req = createMockRequest(user);
    const res = createMockResponse();

    const middleware = requirePermission('users.create');
    middleware(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: expect.stringContaining('does not have permission'),
      required: 'users.create'
    });
  });

  test('should deny access when user is not authenticated', () => {
    const req = createMockRequest(); // No user
    const res = createMockResponse();

    const middleware = requirePermission('users.create');
    middleware(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'User must be authenticated'
    });
  });

  test('should use custom error message', () => {
    const user: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: [],
      permissions: []
    };

    const req = createMockRequest(user);
    const res = createMockResponse();

    const middleware = requirePermission('users.create', {
      errorMessage: 'Custom error message'
    });
    middleware(req, res, mockNext);

    expect(res.json).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: 'Custom error message',
      required: 'users.create'
    });
  });

  test('should use custom error status', () => {
    const user: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: [],
      permissions: []
    };

    const req = createMockRequest(user);
    const res = createMockResponse();

    const middleware = requirePermission('users.create', {
      errorStatus: 404
    });
    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('should check ownership for "own" scope', () => {
    const user: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: [],
      permissions: ['users.update']
    };

    const req = createMockRequest(user);
    req.params = { id: 'user-1' };
    const res = createMockResponse();

    const middleware = requirePermission('users.update', {
      scope: 'own',
      getResourceOwnerId: (req) => req.params.id
    });
    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  test('should deny when user is not owner', () => {
    const user: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: [],
      permissions: ['users.update']
    };

    const req = createMockRequest(user);
    req.params = { id: 'user-2' };
    const res = createMockResponse();

    const middleware = requirePermission('users.update', {
      scope: 'own',
      getResourceOwnerId: (req) => req.params.id
    });
    middleware(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('requireAnyPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should allow access when user has one of the permissions', () => {
    const user: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: [],
      permissions: ['users.read']
    };

    const req = createMockRequest(user);
    const res = createMockResponse();

    const middleware = requireAnyPermission(['users.read', 'users.create']);
    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  test('should deny access when user has none of the permissions', () => {
    const user: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: [],
      permissions: ['services.read']
    };

    const req = createMockRequest(user);
    const res = createMockResponse();

    const middleware = requireAnyPermission(['users.read', 'users.create']);
    middleware(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('requireAllPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should allow access when user has all permissions', () => {
    const user: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: [],
      permissions: ['users.read', 'users.create']
    };

    const req = createMockRequest(user);
    const res = createMockResponse();

    const middleware = requireAllPermissions(['users.read', 'users.create']);
    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  test('should deny access when user is missing some permissions', () => {
    const user: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: [],
      permissions: ['users.read']
    };

    const req = createMockRequest(user);
    const res = createMockResponse();

    const middleware = requireAllPermissions(['users.read', 'users.create']);
    middleware(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('requireRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should allow access when user has role', () => {
    const user: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: ['admin'],
      permissions: []
    };

    const req = createMockRequest(user);
    const res = createMockResponse();

    const middleware = requireRole('admin');
    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  test('should deny access when user lacks role', () => {
    const user: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: ['user'],
      permissions: []
    };

    const req = createMockRequest(user);
    const res = createMockResponse();

    const middleware = requireRole('admin');
    middleware(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: 'User must have role: admin',
      required: 'admin'
    });
  });

  test('should deny access when user is not authenticated', () => {
    const req = createMockRequest();
    const res = createMockResponse();

    const middleware = requireRole('admin');
    middleware(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('requireAnyRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should allow access when user has one of the roles', () => {
    const user: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: ['manager'],
      permissions: []
    };

    const req = createMockRequest(user);
    const res = createMockResponse();

    const middleware = requireAnyRole(['admin', 'manager']);
    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  test('should deny access when user has none of the roles', () => {
    const user: UserPermissionContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      roles: ['user'],
      permissions: []
    };

    const req = createMockRequest(user);
    const res = createMockResponse();

    const middleware = requireAnyRole(['admin', 'manager']);
    middleware(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
