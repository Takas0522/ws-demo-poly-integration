/**
 * Permission Debugger Component
 * Development tool for debugging permission checks
 */

import React, { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionDebuggerProps } from '../types';

/**
 * Permission Debugger Component
 * 
 * Shows current user permissions, roles, and logs permission checks
 * 
 * Example usage:
 * ```tsx
 * <PermissionDebugger position="bottom-right" />
 * ```
 */
export const PermissionDebugger: React.FC<PermissionDebuggerProps> = ({
  position = 'bottom-right',
  defaultOpen = false,
  enableShortcut = true,
  shortcut = 'Ctrl+Shift+P',
  onlyInDev = true,
}) => {
  const {
    permissions,
    roles,
    userId,
    tenantId,
    email,
    displayName,
    isAuthenticated,
  } = usePermissions();

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [testPermission, setTestPermission] = useState('');

  // Don't render in production if onlyInDev is true
  if (onlyInDev && process.env.NODE_ENV === 'production') {
    return null;
  }

  // Toggle debugger
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Handle keyboard shortcut
  useEffect(() => {
    if (!enableShortcut) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [enableShortcut, toggle]);

  // Position styles
  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left': { top: 10, left: 10 },
    'top-right': { top: 10, right: 10 },
    'bottom-left': { bottom: 10, left: 10 },
    'bottom-right': { bottom: 10, right: 10 },
  };

  // Base styles
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    ...positionStyles[position],
    zIndex: 9999,
    fontFamily: 'monospace',
    fontSize: '12px',
  };

  const panelStyle: React.CSSProperties = {
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    border: '1px solid #404040',
    borderRadius: '4px',
    padding: '12px',
    maxWidth: '500px',
    maxHeight: '600px',
    overflow: 'auto',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#007acc',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: '12px',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #404040',
  };

  return (
    <div style={containerStyle}>
      {!isOpen ? (
        <button style={buttonStyle} onClick={toggle}>
          🔐 Permissions
        </button>
      ) : (
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
              Permission Debugger
            </h3>
            <button
              style={{ ...buttonStyle, padding: '4px 8px' }}
              onClick={toggle}
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div style={sectionStyle}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>User Info</h4>
            <div>
              <strong>Authenticated:</strong> {isAuthenticated ? '✓ Yes' : '✗ No'}
            </div>
            <div><strong>User ID:</strong> {userId || 'N/A'}</div>
            <div><strong>Email:</strong> {email || 'N/A'}</div>
            <div><strong>Display Name:</strong> {displayName || 'N/A'}</div>
            <div><strong>Tenant ID:</strong> {tenantId || 'N/A'}</div>
          </div>

          {/* Roles */}
          <div style={sectionStyle}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>
              Roles ({roles.length})
            </h4>
            {roles.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {roles.map((role) => (
                  <li key={role}>{role}</li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#888' }}>No roles assigned</div>
            )}
          </div>

          {/* Permissions */}
          <div style={sectionStyle}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>
              Permissions ({permissions.length})
            </h4>
            {permissions.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {permissions.map((perm) => (
                  <li key={perm} style={{ wordBreak: 'break-all' }}>
                    {perm}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#888' }}>No permissions granted</div>
            )}
          </div>

          {/* Test Permission */}
          <div style={sectionStyle}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>
              Test Permission
            </h4>
            <input
              type="text"
              value={testPermission}
              onChange={(e) => setTestPermission(e.target.value)}
              placeholder="Enter permission to test"
              style={{
                width: '100%',
                padding: '6px',
                backgroundColor: '#2d2d2d',
                color: '#d4d4d4',
                border: '1px solid #404040',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
          </div>

          {/* Keyboard Shortcut */}
          <div style={{ fontSize: '11px', color: '#888', textAlign: 'center' }}>
            Toggle with {shortcut}
          </div>
        </div>
      )}
    </div>
  );
};
