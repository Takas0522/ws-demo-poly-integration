/**
 * Tests for AuthorizedComponent
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthorizedComponent, AuthorizedButton, AuthorizedLink } from '../components/AuthorizedComponent';
import { PermissionProvider } from '../hooks/usePermissions';
import { createMockJWTPayload } from '../__tests__/test-utils';

describe('AuthorizedComponent', () => {
  describe('permission checks', () => {
    it('should render children when user has required permission', async () => {
      const payload = createMockJWTPayload({
        permissions: ['users.read'],
      });

      render(
        <PermissionProvider token={payload}>
          <AuthorizedComponent permission="users.read">
            <div data-testid="content">Protected Content</div>
          </AuthorizedComponent>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });

    it('should render fallback when user lacks required permission', async () => {
      const payload = createMockJWTPayload({
        permissions: ['users.read'],
      });

      render(
        <PermissionProvider token={payload}>
          <AuthorizedComponent
            permission="users.write"
            fallback={<div data-testid="fallback">Access Denied</div>}
          >
            <div data-testid="content">Protected Content</div>
          </AuthorizedComponent>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('content')).not.toBeInTheDocument();
        expect(screen.getByTestId('fallback')).toBeInTheDocument();
      });
    });

    it('should work with wildcard permissions', async () => {
      const payload = createMockJWTPayload({
        permissions: ['users.*'],
      });

      render(
        <PermissionProvider token={payload}>
          <AuthorizedComponent permission="users.write">
            <div data-testid="content">Protected Content</div>
          </AuthorizedComponent>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });
  });

  describe('array permissions', () => {
    it('should render when user has any permission (default)', async () => {
      const payload = createMockJWTPayload({
        permissions: ['users.read'],
      });

      render(
        <PermissionProvider token={payload}>
          <AuthorizedComponent permission={['users.read', 'users.write']}>
            <div data-testid="content">Protected Content</div>
          </AuthorizedComponent>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });

    it('should render when user has all permissions with requireAll', async () => {
      const payload = createMockJWTPayload({
        permissions: ['users.read', 'users.write'],
      });

      render(
        <PermissionProvider token={payload}>
          <AuthorizedComponent
            permission={['users.read', 'users.write']}
            requireAll
          >
            <div data-testid="content">Protected Content</div>
          </AuthorizedComponent>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });

    it('should not render when user lacks all permissions with requireAll', async () => {
      const payload = createMockJWTPayload({
        permissions: ['users.read'],
      });

      render(
        <PermissionProvider token={payload}>
          <AuthorizedComponent
            permission={['users.read', 'users.write']}
            requireAll
            fallback={<div data-testid="fallback">Denied</div>}
          >
            <div data-testid="content">Protected Content</div>
          </AuthorizedComponent>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('content')).not.toBeInTheDocument();
        expect(screen.getByTestId('fallback')).toBeInTheDocument();
      });
    });
  });

  describe('role checks', () => {
    it('should render when user has required role', async () => {
      const payload = createMockJWTPayload({
        roles: ['admin'],
      });

      render(
        <PermissionProvider token={payload}>
          <AuthorizedComponent role="admin">
            <div data-testid="content">Admin Content</div>
          </AuthorizedComponent>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });

    it('should not render when user lacks required role', async () => {
      const payload = createMockJWTPayload({
        roles: ['user'],
      });

      render(
        <PermissionProvider token={payload}>
          <AuthorizedComponent
            role="admin"
            fallback={<div data-testid="fallback">Denied</div>}
          >
            <div data-testid="content">Admin Content</div>
          </AuthorizedComponent>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('content')).not.toBeInTheDocument();
        expect(screen.getByTestId('fallback')).toBeInTheDocument();
      });
    });

    it('should work with array of roles', async () => {
      const payload = createMockJWTPayload({
        roles: ['user', 'moderator'],
      });

      render(
        <PermissionProvider token={payload}>
          <AuthorizedComponent role={['admin', 'moderator']}>
            <div data-testid="content">Content</div>
          </AuthorizedComponent>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });
  });

  describe('combined permission and role checks', () => {
    it('should require both permission and role when both specified', async () => {
      const payload = createMockJWTPayload({
        permissions: ['users.write'],
        roles: ['admin'],
      });

      render(
        <PermissionProvider token={payload}>
          <AuthorizedComponent permission="users.write" role="admin">
            <div data-testid="content">Protected Content</div>
          </AuthorizedComponent>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });

    it('should not render when user has permission but not role', async () => {
      const payload = createMockJWTPayload({
        permissions: ['users.write'],
        roles: ['user'],
      });

      render(
        <PermissionProvider token={payload}>
          <AuthorizedComponent
            permission="users.write"
            role="admin"
            fallback={<div data-testid="fallback">Denied</div>}
          >
            <div data-testid="content">Protected Content</div>
          </AuthorizedComponent>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('content')).not.toBeInTheDocument();
        expect(screen.getByTestId('fallback')).toBeInTheDocument();
      });
    });

    it('should not render when user has role but not permission', async () => {
      const payload = createMockJWTPayload({
        permissions: ['users.read'],
        roles: ['admin'],
      });

      render(
        <PermissionProvider token={payload}>
          <AuthorizedComponent
            permission="users.write"
            role="admin"
            fallback={<div data-testid="fallback">Denied</div>}
          >
            <div data-testid="content">Protected Content</div>
          </AuthorizedComponent>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('content')).not.toBeInTheDocument();
        expect(screen.getByTestId('fallback')).toBeInTheDocument();
      });
    });
  });

  describe('invert option', () => {
    it('should render when user does not have permission with invert', async () => {
      const payload = createMockJWTPayload({
        permissions: ['users.read'],
      });

      render(
        <PermissionProvider token={payload}>
          <AuthorizedComponent permission="users.write" invert>
            <div data-testid="content">Show when no permission</div>
          </AuthorizedComponent>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('content')).toBeInTheDocument();
      });
    });

    it('should not render when user has permission with invert', async () => {
      const payload = createMockJWTPayload({
        permissions: ['users.write'],
      });

      render(
        <PermissionProvider token={payload}>
          <AuthorizedComponent
            permission="users.write"
            invert
            fallback={<div data-testid="fallback">Hidden</div>}
          >
            <div data-testid="content">Show when no permission</div>
          </AuthorizedComponent>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('content')).not.toBeInTheDocument();
        expect(screen.getByTestId('fallback')).toBeInTheDocument();
      });
    });
  });

  describe('render prop', () => {
    it('should use render prop when provided', async () => {
      const payload = createMockJWTPayload({
        permissions: ['users.read'],
      });

      render(
        <PermissionProvider token={payload}>
          <AuthorizedComponent
            permission="users.read"
            render={(isAuthorized) => (
              <div data-testid="result">{isAuthorized ? 'Authorized' : 'Not Authorized'}</div>
            )}
          />
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('Authorized');
      });
    });

    it('should pass false to render prop when not authorized', async () => {
      const payload = createMockJWTPayload({
        permissions: ['users.read'],
      });

      render(
        <PermissionProvider token={payload}>
          <AuthorizedComponent
            permission="users.write"
            render={(isAuthorized) => (
              <div data-testid="result">{isAuthorized ? 'Authorized' : 'Not Authorized'}</div>
            )}
          />
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('Not Authorized');
      });
    });
  });

  describe('loading state', () => {
    it('should show loading component while loading', () => {
      const loadPermissions = jest.fn(() => new Promise(() => {})); // Never resolves

      render(
        <PermissionProvider
          loadPermissions={loadPermissions}
          loadingComponent={<div data-testid="provider-loading">Loading...</div>}
        >
          <AuthorizedComponent
            permission="users.read"
            loading={<div data-testid="component-loading">Checking...</div>}
          >
            <div data-testid="content">Content</div>
          </AuthorizedComponent>
        </PermissionProvider>
      );

      expect(screen.getByTestId('provider-loading')).toBeInTheDocument();
    });
  });

  describe('authentication check', () => {
    it('should render fallback when not authenticated', async () => {
      const loadPermissions = jest.fn().mockRejectedValue(new Error('Auth failed'));

      render(
        <PermissionProvider loadPermissions={loadPermissions}>
          <AuthorizedComponent
            permission="users.read"
            fallback={<div data-testid="fallback">Not Authenticated</div>}
          >
            <div data-testid="content">Content</div>
          </AuthorizedComponent>
        </PermissionProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('fallback')).toBeInTheDocument();
        expect(screen.queryByTestId('content')).not.toBeInTheDocument();
      });
    });
  });
});

describe('AuthorizedButton', () => {
  it('should render button when authorized', async () => {
    const payload = createMockJWTPayload({
      permissions: ['users.create'],
    });

    const handleClick = jest.fn();

    render(
      <PermissionProvider token={payload}>
        <AuthorizedButton
          permission="users.create"
          onClick={handleClick}
          data-testid="button"
        >
          Create User
        </AuthorizedButton>
      </PermissionProvider>
    );

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Create User');
    });
  });

  it('should not render button when not authorized', async () => {
    const payload = createMockJWTPayload({
      permissions: ['users.read'],
    });

    render(
      <PermissionProvider token={payload}>
        <AuthorizedButton permission="users.create">
          Create User
        </AuthorizedButton>
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});

describe('AuthorizedLink', () => {
  it('should render link when authorized', async () => {
    const payload = createMockJWTPayload({
      permissions: ['users.read'],
    });

    render(
      <PermissionProvider token={payload}>
        <AuthorizedLink permission="users.read" href="/users">
          View Users
        </AuthorizedLink>
      </PermissionProvider>
    );

    await waitFor(() => {
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveTextContent('View Users');
      expect(link).toHaveAttribute('href', '/users');
    });
  });

  it('should not render link when not authorized', async () => {
    const payload = createMockJWTPayload({
      permissions: ['users.read'],
    });

    render(
      <PermissionProvider token={payload}>
        <AuthorizedLink permission="users.write" href="/users/edit">
          Edit Users
        </AuthorizedLink>
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
  });
});
