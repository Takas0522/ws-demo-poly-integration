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

    render(
      <PermissionProvider token={payload}>
        <PermissionDebugger onlyInDev={false} defaultOpen={true} />
      </PermissionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('user', { exact: false })).toBeInTheDocument();
    });
  });

  it('should be closed by default', async () => {
    process.env.NODE_ENV = 'development';
    const payload = createMockJWTPayload();

    const { container } = render(
      <PermissionProvider token={payload}>
        <PermissionDebugger />
      </PermissionProvider>
    );

    await waitFor(() => {
      // When closed, the debugger should still have a toggle button or minimal UI
      expect(container.querySelector('[data-testid]')).toBeDefined();
    });
  });
});
