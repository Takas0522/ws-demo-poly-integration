# JWT Authentication Service - API Documentation

## Overview
The JWT Authentication Service provides secure authentication and authorization for the SaaS Management Application using JSON Web Tokens (JWT).

## Base URL
```
http://localhost:3001
```

## Authentication Flow

### 1. User Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "tenantId": "tenant-123"  // Optional: for multi-tenant scenarios
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 3600,
      "tokenType": "Bearer"
    },
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "displayName": "John Doe",
      "status": "active"
    }
  }
}
```

**Error Responses:**
- `400`: Missing required fields
- `401`: Invalid credentials or account locked
- `429`: Too many login attempts

### 2. Token Refresh
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 3600,
      "tokenType": "Bearer"
    }
  }
}
```

### 3. User Logout
```http
POST /auth/logout
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "allDevices": false  // Set to true to logout from all devices
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Protected Endpoints

### Verify Token
```http
GET /auth/verify
Authorization: Bearer <access-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "sub": "user-123",
      "email": "user@example.com",
      "tenantId": "tenant-123",
      "roles": ["user"],
      "permissions": ["users.read"]
    }
  }
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <access-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "displayName": "John Doe",
    "tenantId": "tenant-123",
    "roles": ["user"],
    "permissions": ["users.read"]
  }
}
```

## Security Features

### Rate Limiting
- **General API**: 100 requests per 15 minutes
- **Auth endpoints**: 10 requests per 15 minutes
- **Password reset**: 3 requests per hour

### Account Lockout
- **Max failed attempts**: 5 (configurable)
- **Lockout duration**: 15 minutes (configurable)
- Automatic unlock after lockout period

### Token Security
- **Access Token**: 1 hour expiry
- **Refresh Token**: 7 days expiry with TTL in CosmosDB
- **Token Revocation**: Supports single and multi-device logout
- **Token Validation**: Verifies issuer, audience, and expiry

### Password Requirements
Configurable via environment variables:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## Error Codes

| Code | Description |
|------|-------------|
| `NO_TOKEN` | No authorization token provided |
| `INVALID_HEADER` | Invalid authorization header format |
| `INVALID_TOKEN` | Token is invalid or malformed |
| `EXPIRED` | Token has expired |
| `REVOKED` | Token has been revoked |
| `AUTH_REQUIRED` | Authentication is required |
| `TENANT_ACCESS_DENIED` | Access denied to specified tenant |
| `LOGIN_FAILED` | Login credentials are invalid |
| `REFRESH_FAILED` | Refresh token is invalid or expired |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

## Integration Examples

### Node.js/Express
```javascript
const axios = require('axios');

// Login
const loginResponse = await axios.post('http://localhost:3001/auth/login', {
  email: 'user@example.com',
  password: 'SecurePassword123!'
});

const { accessToken, refreshToken } = loginResponse.data.data.tokens;

// Make authenticated request
const response = await axios.get('http://localhost:3001/auth/me', {
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
});
```

### React/TypeScript
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001'
});

// Add token to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await axios.post('http://localhost:3001/auth/refresh', {
        refreshToken
      });
      
      const { accessToken } = response.data.data.tokens;
      localStorage.setItem('accessToken', accessToken);
      
      // Retry original request
      error.config.headers.Authorization = `Bearer ${accessToken}`;
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

## Middleware Usage

### Protect Routes
```typescript
import { authenticate } from './middleware/auth.middleware';

// Protect a route - requires valid access token
app.get('/api/protected', authenticate, (req, res) => {
  // req.user contains decoded JWT payload
  res.json({ user: req.user });
});
```

### Optional Authentication
```typescript
import { optionalAuthenticate } from './middleware/auth.middleware';

// Optional authentication - attaches user if token present
app.get('/api/public', optionalAuthenticate, (req, res) => {
  if (req.user) {
    // User is authenticated
  } else {
    // Anonymous access
  }
});
```

### Tenant Isolation
```typescript
import { authenticate, requireTenant } from './middleware/auth.middleware';

// Ensure user can only access their tenant's resources
app.get('/api/tenant/:tenantId/data', authenticate, requireTenant, (req, res) => {
  // req.user.tenantId is verified to match :tenantId parameter
});
```

## Health Check
```http
GET /health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "auth-service",
  "version": "1.0.0",
  "timestamp": "2024-01-11T12:00:00.000Z",
  "uptime": 3600
}
```

## Environment Configuration

See `.env.template` in the project root for all available configuration options.

Key settings:
- `AUTH_SERVICE_PORT`: Service port (default: 3001)
- `JWT_SECRET`: Secret for signing tokens
- `JWT_EXPIRES_IN`: Access token expiry (default: 1h)
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiry (default: 7d)
- `FEATURE_RATE_LIMITING`: Enable/disable rate limiting
- `MAX_LOGIN_ATTEMPTS`: Maximum failed login attempts
- `LOCKOUT_DURATION_MINUTES`: Account lockout duration
