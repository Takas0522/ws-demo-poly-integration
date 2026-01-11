# Using @saas-app/types in Services

This guide provides practical examples of using the shared types library in different services.

## Installation in Services

### For Local Development (Recommended)

Since this is a polyrepo with services as submodules, the preferred approach is to use relative path references:

```json
// In service package.json
{
  "dependencies": {
    "@saas-app/types": "file:../../packages/@types"
  }
}
```

Then install:
```bash
cd src/auth-service
npm install
```

### For Published Package (Future)

Once published to npm registry:
```bash
npm install @saas-app/types
```

## Usage Examples

### 1. In Authentication Service

#### Login Endpoint
```typescript
// src/auth-service/src/controllers/auth.controller.ts
import express from 'express';
import { LoginRequest, LoginResponse, APIResponse } from '@saas-app/types';

export async function loginHandler(req: express.Request, res: express.Response) {
  const loginData: LoginRequest = req.body;
  
  // Validate credentials
  const user = await authenticateUser(loginData.email, loginData.password);
  
  if (!user) {
    const errorResponse: APIResponse = {
      success: false,
      error: 'Invalid credentials',
      errorCode: 'AUTH_INVALID_CREDENTIALS'
    };
    return res.status(401).json(errorResponse);
  }
  
  // Generate tokens
  const tokens = await generateTokenPair(user);
  
  const response: APIResponse<LoginResponse> = {
    success: true,
    data: {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status
      }
    }
  };
  
  res.json(response);
}
```

#### JWT Token Generation
```typescript
// src/auth-service/src/services/jwt.service.ts
import jwt from 'jsonwebtoken';
import { JWTAccessPayload, JWTRefreshPayload, JWTTokenPair, User } from '@saas-app/types';

export function generateAccessToken(user: User): string {
  const payload: JWTAccessPayload = {
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
    tenantId: user.tenantId,
    roles: user.roles,
    permissions: user.permissions,
    type: 'access',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET!);
}

export function generateTokenPair(user: User): JWTTokenPair {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 3600,
    tokenType: 'Bearer'
  };
}
```

### 2. In User Management Service

#### User CRUD Operations
```typescript
// src/user-management-service/src/controllers/user.controller.ts
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  APIResponse,
  PaginatedAPIResponse,
  PaginationParams,
  UserStatus 
} from '@saas-app/types';

export async function createUser(req: express.Request, res: express.Response) {
  const userData: CreateUserRequest = req.body;
  
  // Validate and create user
  const newUser: User = {
    id: generateId(),
    email: userData.email,
    displayName: userData.displayName,
    firstName: userData.firstName,
    lastName: userData.lastName,
    status: UserStatus.Active,
    tenantId: userData.tenantId,
    roles: userData.roles || [],
    permissions: userData.permissions || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await saveUser(newUser);
  
  const response: APIResponse<User> = {
    success: true,
    data: newUser
  };
  
  res.status(201).json(response);
}

export async function listUsers(req: express.Request, res: express.Response) {
  const pagination: PaginationParams = {
    page: parseInt(req.query.page as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as 'asc' | 'desc'
  };
  
  const { users, totalCount } = await getUsersWithPagination(pagination);
  
  const response: PaginatedAPIResponse<User> = {
    success: true,
    data: users,
    pagination: {
      page: pagination.page!,
      pageSize: pagination.pageSize!,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / pagination.pageSize!),
      hasNext: pagination.page! < Math.ceil(totalCount / pagination.pageSize!),
      hasPrevious: pagination.page! > 1
    }
  };
  
  res.json(response);
}
```

### 3. In Frontend Application

#### API Client
```typescript
// src/front/src/api/client.ts
import { APIResponse, APIErrorResponse } from '@saas-app/types';

export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<APIResponse<T>> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw data as APIErrorResponse;
  }
  
  return data as APIResponse<T>;
}
```

#### Login Component
```typescript
// src/front/src/components/Login.tsx
import React, { useState } from 'react';
import { LoginRequest, LoginResponse, APIResponse } from '@saas-app/types';
import { apiRequest } from '../api/client';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const loginData: LoginRequest = { email, password };
      const response = await apiRequest<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData)
      });
      
      if (response.success && response.data) {
        // Store tokens and redirect
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        // Redirect to dashboard
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email} 
        onChange={e => setEmail(e.target.value)} 
        placeholder="Email"
      />
      <input 
        type="password" 
        value={password} 
        onChange={e => setPassword(e.target.value)} 
        placeholder="Password"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

#### User List Component
```typescript
// src/front/src/components/UserList.tsx
import React, { useEffect, useState } from 'react';
import { User, PaginatedAPIResponse } from '@saas-app/types';
import { apiRequest } from '../api/client';

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const response = await apiRequest<User[]>(
          `/api/users?page=${page}&pageSize=20`
        ) as PaginatedAPIResponse<User>;
        
        if (response.success && response.data) {
          setUsers(response.data);
          setTotalPages(response.pagination.totalPages);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, [page]);
  
  return (
    <div>
      <h2>Users</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {users.map(user => (
            <li key={user.id}>
              {user.displayName} ({user.email})
            </li>
          ))}
        </ul>
      )}
      <div>
        <button 
          disabled={page === 1} 
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button 
          disabled={page === totalPages} 
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### 4. Permission Middleware

```typescript
// src/auth-service/src/middleware/permission.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { 
  UserPermissionContext, 
  PermissionCheckResult,
  JWTAccessPayload 
} from '@saas-app/types';
import { checkPermission } from '@saas-app/permissions';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTAccessPayload;
    }
  }
}

export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized' 
      });
    }
    
    const context: UserPermissionContext = {
      userId: req.user.sub,
      tenantId: req.user.tenantId,
      roles: req.user.roles,
      permissions: req.user.permissions
    };
    
    const result: PermissionCheckResult = await checkPermission(context, permission);
    
    if (!result.granted) {
      return res.status(403).json({ 
        success: false, 
        error: 'Forbidden',
        errorCode: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    next();
  };
}
```

### 5. Health Check Endpoint

```typescript
// Any service - src/controllers/health.controller.ts
import { Request, Response } from 'express';
import { HealthCheckResponse } from '@saas-app/types';

export function healthCheck(req: Request, res: Response) {
  const startTime = Date.now() - (process.uptime() * 1000);
  
  const health: HealthCheckResponse = {
    status: 'healthy',
    service: 'auth-service',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    dependencies: {
      database: {
        status: 'healthy', // Check actual DB connection
      },
      cache: {
        status: 'healthy', // Check Redis/cache if used
      }
    }
  };
  
  res.json(health);
}
```

## Type Guards and Utilities

### Custom Type Guards
```typescript
// src/utils/type-guards.ts
import { User, UserStatus, Tenant, TenantStatus } from '@saas-app/types';

export function isActiveUser(user: User): boolean {
  return user.status === UserStatus.Active;
}

export function isActiveTenant(tenant: Tenant): boolean {
  return tenant.status === TenantStatus.Active;
}

export function canUserAccessTenant(user: User, tenantId: string): boolean {
  return user.tenantId === tenantId && isActiveUser(user);
}
```

## Best Practices

1. **Always import types from @saas-app/types**
   - Don't duplicate type definitions
   - Keep types in sync across services

2. **Use proper error handling**
   - Return `APIErrorResponse` for errors
   - Include meaningful error codes

3. **Leverage TypeScript strict mode**
   - Enable strict type checking
   - Use proper type assertions

4. **Document custom types**
   - Add JSDoc comments for clarity
   - Document expected formats

5. **Version carefully**
   - Breaking changes require major version bump
   - Coordinate updates across services

## Troubleshooting

### Types not found
```bash
# Rebuild types package
cd packages/@types
npm run build

# Reinstall in service
cd ../../src/your-service
npm install
```

### Type conflicts
- Check that all services use the same version of @saas-app/types
- Rebuild the types package after updates
- Clear node_modules and reinstall if needed

## Related Documentation

- [Types Package README](../packages/@types/README.md)
- [Permission System](../docs/PERMISSIONS.en.md)
- [API Documentation](../docs/api/README.md)
