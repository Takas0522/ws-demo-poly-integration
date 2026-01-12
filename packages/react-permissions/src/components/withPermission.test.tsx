/**
 * Tests for withPermission HOC
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import {
  withPermission,
  requirePermission,
  requireRole,
  requireAdmin,
  requireAuth,
} from '../components/withPermission';
import { PermissionProvider } from '../hooks/usePermissions';
import { createMockJWTPayload } from '../__tests__/test-utils';

// Test component
interface TestComponentProps {
  message?: string;
  testId?: string;
}

const TestComponent: React.FC<TestComponentProps> = ({ message = 'Test Content', testId = 'content' }) => {
  return <div data-testid={testId}>{message}</div>;
};

describe('withPermission', () => {
  it('should render component when user has required permission', async () => {
    const payload = createMockJWTPayload({
      permissions: ['users.read'],
    });

    const ProtectedComponent = withPermission(TestComponent, {
      permission: 'users.read',
    });

    render(
      <PermissionProvider token={payload}>
        <ProtectedComponent message="Protected" />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('content')).toHaveTextContent('Protected');
    });
  });

  it('should not render component when user lacks permission', async () => {
    const payload = createMockJWTPayload({
      permissions: ['users.read'],
    });

    const ProtectedComponent = withPermission(TestComponent, {
      permission: 'users.write',
      fallback: <div data-testid="fallback">Access Denied</div>,
    });

    render(
      <PermissionProvider token={payload}>
        <ProtectedComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });
  });

  it('should pass props through to wrapped component', async () => {
    const payload = createMockJWTPayload({
      permissions: ['users.read'],
    });

    const ProtectedComponent = withPermission(TestComponent, {
      permission: 'users.read',
    });

    render(
      <PermissionProvider token={payload}>
        <ProtectedComponent message="Custom Message" testId="custom" />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('custom')).toHaveTextContent('Custom Message');
    });
  });

  it('should work with role checks', async () => {
    const payload = createMockJWTPayload({
      roles: ['admin'],
    });

    const ProtectedComponent = withPermission(TestComponent, {
      role: 'admin',
    });

    render(
      <PermissionProvider token={payload}>
        <ProtectedComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  it('should work with combined permission and role checks', async () => {
    const payload = createMockJWTPayload({
      permissions: ['users.write'],
      roles: ['admin'],
    });

    const ProtectedComponent = withPermission(TestComponent, {
      permission: 'users.write',
      role: 'admin',
    });

    render(
      <PermissionProvider token={payload}>
        <ProtectedComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  it('should set correct display name', () => {
    const ProtectedComponent = withPermission(TestComponent, {
      permission: 'users.read',
    });

    expect(ProtectedComponent.displayName).toBe('withPermission(TestComponent)');
  });

  it('should handle components without names', () => {
    const AnonymousComponent: React.FC = () => <div>Anonymous</div>;
    Object.defineProperty(AnonymousComponent, 'name', { value: undefined });
    Object.defineProperty(AnonymousComponent, 'displayName', { value: undefined });

    const ProtectedComponent = withPermission(AnonymousComponent, {
      permission: 'users.read',
    });

    expect(ProtectedComponent.displayName).toBe('withPermission(Component)');
  });
});

describe('requirePermission', () => {
  it('should create HOC that requires single permission', async () => {
    const payload = createMockJWTPayload({
      permissions: ['users.read'],
    });

    const ProtectedComponent = requirePermission<TestComponentProps>('users.read')(TestComponent);

    render(
      <PermissionProvider token={payload}>
        <ProtectedComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  it('should work with array of permissions', async () => {
    const payload = createMockJWTPayload({
      permissions: ['users.read'],
    });

    const ProtectedComponent = requirePermission<TestComponentProps>(['users.read', 'users.write'])(
      TestComponent
    );

    render(
      <PermissionProvider token={payload}>
        <ProtectedComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  it('should not render when permission is missing', async () => {
    const payload = createMockJWTPayload({
      permissions: ['users.read'],
    });

    const ProtectedComponent = requirePermission<TestComponentProps>('users.write')(TestComponent);

    render(
      <PermissionProvider token={payload}>
        <ProtectedComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });
  });
});

describe('requireRole', () => {
  it('should create HOC that requires single role', async () => {
    const payload = createMockJWTPayload({
      roles: ['admin'],
    });

    const ProtectedComponent = requireRole<TestComponentProps>('admin')(TestComponent);

    render(
      <PermissionProvider token={payload}>
        <ProtectedComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  it('should work with array of roles', async () => {
    const payload = createMockJWTPayload({
      roles: ['moderator'],
    });

    const ProtectedComponent = requireRole<TestComponentProps>(['admin', 'moderator'])(TestComponent);

    render(
      <PermissionProvider token={payload}>
        <ProtectedComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  it('should not render when role is missing', async () => {
    const payload = createMockJWTPayload({
      roles: ['user'],
    });

    const ProtectedComponent = requireRole<TestComponentProps>('admin')(TestComponent);

    render(
      <PermissionProvider token={payload}>
        <ProtectedComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });
  });
});

describe('requireAdmin', () => {
  it('should render when user has admin role', async () => {
    const payload = createMockJWTPayload({
      roles: ['user', 'admin'],
    });

    const ProtectedComponent = requireAdmin(TestComponent);

    render(
      <PermissionProvider token={payload}>
        <ProtectedComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  it('should not render when user lacks admin role', async () => {
    const payload = createMockJWTPayload({
      roles: ['user'],
    });

    const ProtectedComponent = requireAdmin(TestComponent);

    render(
      <PermissionProvider token={payload}>
        <ProtectedComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });
  });

  it('should set correct display name', () => {
    const ProtectedComponent = requireAdmin(TestComponent);
    expect(ProtectedComponent.displayName).toBe('withPermission(TestComponent)');
  });
});

describe('requireAuth', () => {
  it('should render when user is authenticated', async () => {
    const payload = createMockJWTPayload();

    const ProtectedComponent = requireAuth(TestComponent);

    render(
      <PermissionProvider token={payload}>
        <ProtectedComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  it('should render fallback when user is not authenticated', async () => {
    const loadPermissions = jest.fn().mockRejectedValue(new Error('Not authenticated'));

    const ProtectedComponent = requireAuth(
      TestComponent,
      <div data-testid="fallback">Please log in</div>
    );

    render(
      <PermissionProvider loadPermissions={loadPermissions}>
        <ProtectedComponent />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });
  });

  it('should set correct display name', () => {
    const ProtectedComponent = requireAuth(TestComponent);
    expect(ProtectedComponent.displayName).toBe('requireAuth(TestComponent)');
  });

  it('should pass props through to wrapped component', async () => {
    const payload = createMockJWTPayload();

    const ProtectedComponent = requireAuth(TestComponent);

    render(
      <PermissionProvider token={payload}>
        <ProtectedComponent message="Authenticated Content" testId="auth-content" />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-content')).toHaveTextContent('Authenticated Content');
    });
  });
});
