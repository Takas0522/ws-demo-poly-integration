/**
 * Tests for usePermissions hook and PermissionProvider
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import {
  PermissionProvider,
  usePermissions,
  useHasPermission,
  useHasAnyPermission,
  useHasAllPermissions,
  useHasRole,
  useHasAnyRole,
} from '../hooks/usePermissions';
import {
  createMockJWTToken,
  createMockJWTPayload,
  createExpiredJWTToken,
} from '../__tests__/test-utils';

// Test component that uses the hook
const TestComponent: React.FC<{ testHook?: () => any }> = ({ testHook }) => {
  const permissions = usePermissions();
  
  if (testHook) {
    const hookResult = testHook();
    return <div data-testid="result">{JSON.stringify(hookResult)}</div>;
  }
  
  return (
    <div>
      <div data-testid="user-id">{permissions.userId}</div>
      <div data-testid="email">{permissions.email}</div>
      <div data-testid="authenticated">{permissions.isAuthenticated.toString()}</div>
      <div data-testid="loading">{permissions.isLoading.toString()}</div>
    </div>
  );
};

describe('PermissionProvider', () => {
  describe('with JWT token string', () => {
    it('should parse and provide JWT payload', async () => {
      const token = createMockJWTToken({
        sub: 'test-user-id',
        email: 'test@example.com',
      });

      render(
        <PermissionProvider token={token}>
          <TestComponent />
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-id')).toHaveTextContent('test-user-id');
        expect(screen.getByTestId('email')).toHaveTextContent('test@example.com');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });

    it('should handle expired tokens', async () => {
      const token = createExpiredJWTToken();

      const onError = jest.fn();

      render(
        <PermissionProvider token={token} onError={onError}>
          <TestComponent />
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        expect(onError.mock.calls[0][0].message).toContain('expired');
      });
    });

    it('should handle invalid tokens', async () => {
      const onError = jest.fn();

      render(
        <PermissionProvider token="invalid-token" onError={onError}>
          <TestComponent />
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  describe('with JWT payload object', () => {
    it('should use provided payload directly', async () => {
      const payload = createMockJWTPayload({
        sub: 'direct-user',
        email: 'direct@example.com',
      });

      render(
        <PermissionProvider token={payload}>
          <TestComponent />
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-id')).toHaveTextContent('direct-user');
        expect(screen.getByTestId('email')).toHaveTextContent('direct@example.com');
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });
    });
  });

  describe('with custom loader', () => {
    it('should load permissions from custom function', async () => {
      const loadPermissions = jest.fn().mockResolvedValue(
        createMockJWTPayload({
          sub: 'loaded-user',
          email: 'loaded@example.com',
        })
      );

      render(
        <PermissionProvider loadPermissions={loadPermissions}>
          <TestComponent />
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(loadPermissions).toHaveBeenCalled();
        expect(screen.getByTestId('user-id')).toHaveTextContent('loaded-user');
      });
    });

    it('should handle loader errors', async () => {
      const loadPermissions = jest.fn().mockRejectedValue(new Error('Load failed'));
      const onError = jest.fn();

      render(
        <PermissionProvider loadPermissions={loadPermissions} onError={onError}>
          <TestComponent />
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        expect(onError.mock.calls[0][0].message).toBe('Load failed');
      });
    });
  });

  describe('loading states', () => {
    it('should show loading component while loading', () => {
      const LoadingComponent = <div data-testid="loading-state">Loading...</div>;
      const loadPermissions = jest.fn(() => new Promise(() => {})); // Never resolves

      render(
        <PermissionProvider
          loadPermissions={loadPermissions}
          loadingComponent={LoadingComponent}
        >
          <TestComponent />
        </PermissionProvider>
      );

      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    });

    it('should show error component on error', async () => {
      const ErrorComponent = <div data-testid="error-state">Error occurred</div>;
      const loadPermissions = jest.fn().mockRejectedValue(new Error('Failed'));

      render(
        <PermissionProvider
          loadPermissions={loadPermissions}
          errorComponent={ErrorComponent}
        >
          <TestComponent />
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });
    });
  });

  describe('callbacks', () => {
    it('should call onPermissionsLoaded when loaded', async () => {
      const onPermissionsLoaded = jest.fn();
      const payload = createMockJWTPayload();

      render(
        <PermissionProvider token={payload} onPermissionsLoaded={onPermissionsLoaded}>
          <TestComponent />
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(onPermissionsLoaded).toHaveBeenCalledWith(payload);
      });
    });
  });
});

describe('usePermissions', () => {
  it('should throw error when used outside PermissionProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('usePermissions must be used within a PermissionProvider');

    console.error = originalError;
  });

  it('should provide permission check methods', async () => {
    const payload = createMockJWTPayload({
      permissions: ['users.read', 'users.write'],
      roles: ['user', 'admin'],
    });

    const PermissionChecker: React.FC = () => {
      const { hasPermission, hasRole } = usePermissions();
      return (
        <div>
          <div data-testid="has-read">{hasPermission('users.read').toString()}</div>
          <div data-testid="has-delete">{hasPermission('users.delete').toString()}</div>
          <div data-testid="has-admin">{hasRole('admin').toString()}</div>
          <div data-testid="has-superadmin">{hasRole('superadmin').toString()}</div>
        </div>
      );
    };

    render(
      <PermissionProvider token={payload}>
        <PermissionChecker />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('has-read')).toHaveTextContent('true');
      expect(screen.getByTestId('has-delete')).toHaveTextContent('false');
      expect(screen.getByTestId('has-admin')).toHaveTextContent('true');
      expect(screen.getByTestId('has-superadmin')).toHaveTextContent('false');
    });
  });
});

describe('useHasPermission', () => {
  it('should return true when user has permission', async () => {
    const HasPermissionComponent: React.FC = () => {
      const hasRead = useHasPermission('users.read');
      return <div data-testid="result">{hasRead.toString()}</div>;
    };

    const payload = createMockJWTPayload({
      permissions: ['users.read'],
    });

    render(
      <PermissionProvider token={payload}>
        <HasPermissionComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('true');
    });
  });

  it('should return false when user does not have permission', async () => {
    const HasPermissionComponent: React.FC = () => {
      const hasWrite = useHasPermission('users.write');
      return <div data-testid="result">{hasWrite.toString()}</div>;
    };

    const payload = createMockJWTPayload({
      permissions: ['users.read'],
    });

    render(
      <PermissionProvider token={payload}>
        <HasPermissionComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('false');
    });
  });
});

describe('useHasAnyPermission', () => {
  it('should return true when user has at least one permission', async () => {
    const Component: React.FC = () => {
      const hasAny = useHasAnyPermission(['users.read', 'users.write']);
      return <div data-testid="result">{hasAny.toString()}</div>;
    };

    const payload = createMockJWTPayload({
      permissions: ['users.read'],
    });

    render(
      <PermissionProvider token={payload}>
        <Component />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('true');
    });
  });

  it('should return false when user has none of the permissions', async () => {
    const Component: React.FC = () => {
      const hasAny = useHasAnyPermission(['users.write', 'users.delete']);
      return <div data-testid="result">{hasAny.toString()}</div>;
    };

    const payload = createMockJWTPayload({
      permissions: ['users.read'],
    });

    render(
      <PermissionProvider token={payload}>
        <Component />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('false');
    });
  });
});

describe('useHasAllPermissions', () => {
  it('should return true when user has all permissions', async () => {
    const Component: React.FC = () => {
      const hasAll = useHasAllPermissions(['users.read', 'users.write']);
      return <div data-testid="result">{hasAll.toString()}</div>;
    };

    const payload = createMockJWTPayload({
      permissions: ['users.read', 'users.write', 'users.delete'],
    });

    render(
      <PermissionProvider token={payload}>
        <Component />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('true');
    });
  });

  it('should return false when user is missing any permission', async () => {
    const Component: React.FC = () => {
      const hasAll = useHasAllPermissions(['users.read', 'users.write']);
      return <div data-testid="result">{hasAll.toString()}</div>;
    };

    const payload = createMockJWTPayload({
      permissions: ['users.read'],
    });

    render(
      <PermissionProvider token={payload}>
        <Component />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('false');
    });
  });
});

describe('useHasRole', () => {
  it('should return true when user has role', async () => {
    const Component: React.FC = () => {
      const hasAdmin = useHasRole('admin');
      return <div data-testid="result">{hasAdmin.toString()}</div>;
    };

    const payload = createMockJWTPayload({
      roles: ['user', 'admin'],
    });

    render(
      <PermissionProvider token={payload}>
        <Component />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('true');
    });
  });

  it('should return false when user does not have role', async () => {
    const Component: React.FC = () => {
      const hasSuperAdmin = useHasRole('superadmin');
      return <div data-testid="result">{hasSuperAdmin.toString()}</div>;
    };

    const payload = createMockJWTPayload({
      roles: ['user'],
    });

    render(
      <PermissionProvider token={payload}>
        <Component />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('false');
    });
  });
});

describe('useHasAnyRole', () => {
  it('should return true when user has at least one role', async () => {
    const Component: React.FC = () => {
      const hasAny = useHasAnyRole(['admin', 'moderator']);
      return <div data-testid="result">{hasAny.toString()}</div>;
    };

    const payload = createMockJWTPayload({
      roles: ['user', 'admin'],
    });

    render(
      <PermissionProvider token={payload}>
        <Component />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('true');
    });
  });

  it('should return false when user has none of the roles', async () => {
    const Component: React.FC = () => {
      const hasAny = useHasAnyRole(['admin', 'superadmin']);
      return <div data-testid="result">{hasAny.toString()}</div>;
    };

    const payload = createMockJWTPayload({
      roles: ['user'],
    });

    render(
      <PermissionProvider token={payload}>
        <Component />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('result')).toHaveTextContent('false');
    });
  });
});
