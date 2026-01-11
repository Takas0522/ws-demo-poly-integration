# Changelog

All notable changes to the @saas-app/types package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-11

### Added
- Initial release of shared types library
- User types: `User`, `UserProfile`, `CreateUserRequest`, `UpdateUserRequest`, `UserStatus`
- Tenant types: `Tenant`, `TenantSummary`, `CreateTenantRequest`, `UpdateTenantRequest`, `TenantStatus`, `TenantTier`
- Permission types: `Role`, `PermissionString`, `ParsedPermission`, `UserPermissionContext`, `PermissionCheckResult`
- JWT types: `JWTAccessPayload`, `JWTRefreshPayload`, `JWTTokenPair`, `JWTVerificationResult`
- API types: `APIResponse`, `PaginatedAPIResponse`, `PaginationParams`, `APIErrorResponse`, `ValidationError`, `BulkOperationRequest`, `HealthCheckResponse`
- Auth types: `LoginRequest`, `LoginResponse`, `RegisterRequest`, `RefreshTokenRequest`, `PasswordResetRequest`, `SessionInfo`
- Full TypeScript support with declaration files and source maps
- Comprehensive README with usage examples
- Build and type-check scripts
