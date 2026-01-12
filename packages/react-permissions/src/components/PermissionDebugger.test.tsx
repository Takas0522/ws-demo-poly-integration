/**
 * Tests for PermissionDebugger component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PermissionDebugger } from '../components/PermissionDebugger';
import { PermissionProvider } from '../hooks/usePermissions';
import { createMockJWTPayload } from '../__tests__/test-utils';

describe('PermissionDebugger', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should render in development mode', async () => {
    process.env.NODE_ENV = 'development';
    const payload = createMockJWTPayload({
      permissions: ['users.read', 'users.write'],
      roles: ['admin'],
    });

    render(
      <PermissionProvider token={payload}>
        <PermissionDebugger defaultOpen={true} />
      </PermissionProvider>
    );

    await waitFor(() => {
      // Check if component renders (looking for permission/role content)
      expect(screen.getByText('admin', { exact: false })).toBeInTheDocument();
    });
  });

  it('should not render in production when onlyInDev is true', () => {
    process.env.NODE_ENV = 'production';
    const payload = createMockJWTPayload();

    const { container } = render(
      <PermissionProvider token={payload}>
        <PermissionDebugger onlyInDev={true} defaultOpen={true} />
      </PermissionProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render in production when onlyInDev is false', async () => {
    process.env.NODE_ENV = 'production';
    const payload = createMockJWTPayload({
      roles: ['user'],
    });

    const { container } = render(
      <PermissionProvider token={payload}>
        <PermissionDebugger onlyInDev={false} defaultOpen={true} />
      </PermissionProvider>
    );

    await waitFor(() => {
      // Check that the component renders (not null)
      expect(container.firstChild).not.toBeNull();
      // Check for the title of the debugger
      expect(screen.getByText('Permission Debugger')).toBeInTheDocument();
    });
  });

  it('should be closed by default', async () => {
    process.env.NODE_ENV = 'development';
    const payload = createMockJWTPayload();

    const { container } = render(
      <PermissionProvider token={payload}>
        <PermissionDebugger defaultOpen={false} />
      </PermissionProvider>
    );

    await waitFor(() => {
      // When closed, should see the toggle button
      expect(screen.getByText('🔐 Permissions')).toBeInTheDocument();
      // Should not see the debugger panel
      expect(screen.queryByText('Permission Debugger')).not.toBeInTheDocument();
    });
  });

  it('should start open when defaultOpen is true', async () => {
    process.env.NODE_ENV = 'development';
    const payload = createMockJWTPayload();

    render(
      <PermissionProvider token={payload}>
        <PermissionDebugger defaultOpen={true} />
      </PermissionProvider>
    );

    await waitFor(() => {
      // When open, should see the debugger panel
      expect(screen.getByText('Permission Debugger')).toBeInTheDocument();
      // Should not see the toggle button
      expect(screen.queryByText('🔐 Permissions')).not.toBeInTheDocument();
    });
  });
});
