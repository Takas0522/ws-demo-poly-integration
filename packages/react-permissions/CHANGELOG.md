# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-11

### Added
- Initial release of `@saas-app/react-permissions` package
- **PermissionProvider** - React Context provider for managing permission state
  - JWT token parsing and validation
  - Custom permission loader support
  - Loading and error state handling
  - Auto-refresh on token changes
- **AuthorizedComponent** - Main wrapper component for conditional rendering
  - Single and multiple permission support
  - Role-based access checks
  - RequireAll/Any logic
  - Custom fallback components
  - Loading indicators
  - Render prop pattern
  - Invert logic option
- **AuthorizedButton** - Convenience wrapper for buttons with permission checks
- **AuthorizedLink** - Convenience wrapper for links with permission checks
- **React Hooks** for permission checks:
  - `usePermissions()` - Full permission context access
  - `useHasPermission()` - Check single permission
  - `useHasAnyPermission()` - Check any of multiple permissions
  - `useHasAllPermissions()` - Check all permissions
  - `useHasRole()` - Check single role
  - `useHasAnyRole()` - Check any of multiple roles
- **Higher-Order Components**:
  - `withPermission()` - Generic HOC with options
  - `requirePermission()` - Require specific permission decorator
  - `requireRole()` - Require specific role decorator
  - `requireAdmin()` - Require admin role decorator
  - `requireAuth()` - Require authentication decorator
- **PermissionDebugger** - Development tool for debugging permissions
  - User info display (ID, email, tenant, etc.)
  - Role and permission listing
  - Keyboard shortcut support (Ctrl+Shift+P)
  - Configurable position
  - Development-only mode
- **Utility Functions**:
  - Permission checking with wildcard support
  - JWT token parsing and validation
  - Token expiration checking
  - Permission normalization and matching
- **TypeScript Support**:
  - Full type definitions
  - Exported types for all components and hooks
  - Type-safe permission strings
- **Documentation**:
  - Comprehensive README (18.8 KB)
  - Integration guide for frontend (16.7 KB)
  - Usage examples document (15.8 KB)
  - Implementation summary

### Security
- JWT token validation and expiration checking
- Type-safe permission handling
- No security vulnerabilities (CodeQL scan passed)
- Proper input validation

### Performance
- Memoized context values to prevent unnecessary re-renders
- useCallback hooks for stable function references
- Efficient wildcard matching (O(n))
- Context-based state management

## [Unreleased]

### Planned
- Unit tests for all hooks
- Component tests with React Testing Library
- Integration tests
- Permission caching mechanism
- Permission audit logging
- Analytics integration
- Offline support

---

[1.0.0]: https://github.com/Takas0522/ws-demo-poly-integration/releases/tag/react-permissions-v1.0.0
