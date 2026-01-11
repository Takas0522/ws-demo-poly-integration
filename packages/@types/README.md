# @saas-app/types

Shared TypeScript type definitions for the SaaS Management Application. This package provides centralized, strongly-typed interfaces for all services in the polyrepo architecture.

## 📦 Installation

```bash
# For local development (from monorepo root)
npm install

# For services using this as a dependency
npm install @saas-app/types
```

## 🎯 Purpose

This package serves as the single source of truth for type definitions across:
- Frontend application
- Authentication service
- User management service
- Service settings service

## 📚 Type Categories

### User Types (`user.types.ts`)

Defines user-related interfaces including:
- `User` - Complete user entity
- `UserProfile` - Public-facing user information
- `CreateUserRequest` / `UpdateUserRequest` - User operations
- `UserStatus` - User status enumeration

```typescript
import { User, UserProfile, CreateUserRequest } from '@saas-app/types';

const user: User = {
  id: '123',
  email: 'user@example.com',
  displayName: 'John Doe',
  status: UserStatus.Active,
  tenantId: 'tenant-1',
  roles: ['user'],
  permissions: ['users.read'],
  createdAt: new Date(),
  updatedAt: new Date()
};
```

### Tenant Types (`tenant.types.ts`)

Multi-tenancy support types:
- `Tenant` - Tenant entity with subscription information
- `TenantSummary` - Lightweight tenant information
- `CreateTenantRequest` / `UpdateTenantRequest` - Tenant operations
- `TenantStatus` / `TenantTier` - Tenant enumerations

```typescript
import { Tenant, TenantTier, TenantStatus } from '@saas-app/types';

const tenant: Tenant = {
  id: 'tenant-1',
  name: 'acme-corp',
  displayName: 'ACME Corporation',
  status: TenantStatus.Active,
  tier: TenantTier.Enterprise,
  contactEmail: 'admin@acme.com',
  createdAt: new Date(),
  updatedAt: new Date()
};
```

### Permission Types (`permission.types.ts`)

Dot notation permission system types:
- `Role` - Role definition with permissions
- `PermissionString` - Type-safe permission strings
- `ParsedPermission` - Parsed permission structure
- `UserPermissionContext` - Context for permission checks
- `PermissionCheckResult` - Permission check outcomes

```typescript
import { Role, PermissionString, UserPermissionContext } from '@saas-app/types';

const adminRole: Role = {
  id: 'role-admin',
  name: 'admin',
  displayName: 'Administrator',
  description: 'Full system access',
  permissions: ['users.*', 'tenants.*', 'settings.*'],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

const context: UserPermissionContext = {
  userId: '123',
  tenantId: 'tenant-1',
  roles: ['admin'],
  permissions: ['users.*']
};
```

### JWT Types (`jwt.types.ts`)

JSON Web Token definitions:
- `JWTAccessPayload` - Access token payload structure
- `JWTRefreshPayload` - Refresh token payload structure
- `JWTTokenPair` - Access and refresh token pair
- `JWTVerificationResult` - Token verification outcomes
- `DecodedJWT` - Decoded token structure

```typescript
import { JWTAccessPayload, JWTTokenPair } from '@saas-app/types';

const accessPayload: JWTAccessPayload = {
  sub: 'user-123',
  email: 'user@example.com',
  displayName: 'John Doe',
  tenantId: 'tenant-1',
  roles: ['user'],
  permissions: ['users.read'],
  type: 'access',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600
};
```

### API Types (`api.types.ts`)

Standard API request/response patterns:
- `APIResponse<T>` - Standard response wrapper
- `PaginatedAPIResponse<T>` - Paginated responses
- `PaginationParams` / `PaginationInfo` - Pagination support
- `APIErrorResponse` - Error responses
- `ValidationError` - Validation error details
- `BulkOperationRequest` / `BulkOperationResponse` - Bulk operations
- `HealthCheckResponse` - Service health checks

```typescript
import { APIResponse, PaginatedAPIResponse, PaginationParams } from '@saas-app/types';

// Simple response
const response: APIResponse<User> = {
  success: true,
  data: user
};

// Paginated response
const paginatedResponse: PaginatedAPIResponse<User> = {
  success: true,
  data: [user1, user2, user3],
  pagination: {
    page: 1,
    pageSize: 20,
    totalItems: 100,
    totalPages: 5,
    hasNext: true,
    hasPrevious: false
  }
};
```

### Auth Types (`auth.types.ts`)

Authentication flow types:
- `LoginRequest` / `LoginResponse` - Login operations
- `RegisterRequest` / `RegisterResponse` - Registration
- `RefreshTokenRequest` / `RefreshTokenResponse` - Token refresh
- `PasswordResetRequest` / `ChangePasswordRequest` - Password management
- `SessionInfo` - Session tracking

```typescript
import { LoginRequest, LoginResponse } from '@saas-app/types';

const loginRequest: LoginRequest = {
  email: 'user@example.com',
  password: 'secure-password',
  rememberMe: true
};

const loginResponse: LoginResponse = {
  tokens: {
    accessToken: 'jwt-access-token',
    refreshToken: 'jwt-refresh-token',
    expiresIn: 3600,
    tokenType: 'Bearer'
  },
  user: userProfile
};
```

## 🔧 Usage Patterns

### Namespace Imports

```typescript
// Import entire namespace
import { UserTypes, APITypes } from '@saas-app/types';

const user: UserTypes.User = { /* ... */ };
const response: APITypes.APIResponse<UserTypes.User> = { /* ... */ };
```

### Direct Imports

```typescript
// Import specific types
import { User, APIResponse, JWTAccessPayload } from '@saas-app/types';

const user: User = { /* ... */ };
const response: APIResponse<User> = { /* ... */ };
```

### Type Guards

```typescript
import { UserStatus, TenantStatus } from '@saas-app/types';

function isActiveUser(user: User): boolean {
  return user.status === UserStatus.Active;
}

function isActiveTenant(tenant: Tenant): boolean {
  return tenant.status === TenantStatus.Active;
}
```

## 🏗️ Development

### Build

```bash
npm run build
```

This compiles TypeScript files to JavaScript and generates type declaration files in the `dist/` directory.

### Type Checking

```bash
npm run type-check
```

Verifies that all type definitions are valid without emitting files.

### Watch Mode

```bash
npm run watch
```

Automatically rebuilds on file changes during development.

## 📁 Project Structure

```
packages/@types/
├── src/
│   ├── user.types.ts         # User-related types
│   ├── tenant.types.ts       # Tenant/multi-tenancy types
│   ├── permission.types.ts   # Permission system types
│   ├── jwt.types.ts          # JWT token types
│   ├── api.types.ts          # API request/response types
│   ├── auth.types.ts         # Authentication types
│   └── index.ts              # Main export file
├── dist/                     # Compiled output (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## 🔄 Version Management

This package follows semantic versioning (semver):

- **Major version** (1.x.x): Breaking changes to existing types
- **Minor version** (x.1.x): New types added (backward compatible)
- **Patch version** (x.x.1): Bug fixes and documentation updates

## 🤝 Integration with Services

### In Backend Services (Express)

```typescript
// In auth-service, user-management-service, etc.
import { User, APIResponse, LoginRequest, LoginResponse } from '@saas-app/types';

app.post('/api/auth/login', async (req, res) => {
  const loginData: LoginRequest = req.body;
  
  // ... authentication logic ...
  
  const response: APIResponse<LoginResponse> = {
    success: true,
    data: {
      tokens: tokenPair,
      user: userProfile
    }
  };
  
  res.json(response);
});
```

### In Frontend (React)

```typescript
// In React components
import { User, UserProfile, APIResponse } from '@saas-app/types';

interface UserListProps {
  users: User[];
}

const UserList: React.FC<UserListProps> = ({ users }) => {
  // Component implementation
};

// API calls
async function fetchUsers(): Promise<APIResponse<User[]>> {
  const response = await fetch('/api/users');
  return response.json();
}
```

## 🔐 Security Considerations

- Never include sensitive data (passwords, secrets) in type definitions
- JWT payload types match security requirements
- Permission strings follow the dot notation pattern documented in the permission system

## 📝 Contributing

When adding new types:

1. Create types in the appropriate file (or create a new file if needed)
2. Export types from the file
3. Add exports to `src/index.ts`
4. Update this README with usage examples
5. Run `npm run type-check` to verify
6. Run `npm run build` to compile

## 🔗 Related Documentation

- [Permission System Documentation](../../docs/PERMISSIONS.en.md)
- [API Documentation](../../docs/api/)
- [Development Plan](../../DEVELOPMENT_PLAN.md)

## 📄 License

MIT
