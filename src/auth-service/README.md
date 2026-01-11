# Auth Service

JWT-based authentication service for the SaaS Management Application with tenant-aware authentication and refresh token mechanism.

## Features

- ✅ JWT token generation with configurable expiry (1 hour access tokens)
- ✅ Refresh token mechanism with CosmosDB storage and TTL
- ✅ Password hashing using bcryptjs
- ✅ Tenant-aware authentication
- ✅ Rate limiting for security
- ✅ Account lockout after failed login attempts
- ✅ Token revocation support
- ✅ Comprehensive error handling

## Tech Stack

- Node.js + Express + TypeScript
- JWT (jsonwebtoken) with HS256/RS256 support
- Azure CosmosDB for token storage
- bcryptjs for password hashing
- express-rate-limit for rate limiting

## Installation

```bash
npm install
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Check test coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

## Environment Variables

The service uses environment variables from the root `.env` file. Key variables:

```env
# Server
AUTH_SERVICE_PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CosmosDB
COSMOSDB_ENDPOINT=https://localhost:8081
COSMOSDB_KEY=<your-cosmosdb-key>
COSMOSDB_DATABASE=saas-management

# Security
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
PASSWORD_MIN_LENGTH=8

# Rate Limiting
FEATURE_RATE_LIMITING=enabled
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

## API Endpoints

### Authentication

#### POST /auth/login
Authenticate user and return JWT tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "tenantId": "tenant-123" // optional
}
```

**Response:**
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

#### POST /auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
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

#### POST /auth/logout
Logout user by revoking refresh tokens.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "allDevices": false // optional, revoke all tokens
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /auth/verify
Verify current access token.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
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

#### GET /auth/me
Get current user information from token.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
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

### Health Check

#### GET /health
Check service health status.

**Response:**
```json
{
  "status": "healthy",
  "service": "auth-service",
  "version": "1.0.0",
  "timestamp": "2024-01-11T12:00:00.000Z",
  "uptime": 3600
}
```

## Architecture

### Components

1. **Token Service** (`services/token.service.ts`)
   - JWT token generation and verification
   - Access token (1 hour expiry)
   - Refresh token (7 days expiry)
   - Token validation

2. **Auth Service** (`services/auth.service.ts`)
   - User authentication
   - Token refresh
   - Logout (token revocation)
   - Failed login tracking
   - Account lockout

3. **CosmosDB Service** (`services/cosmosdb.service.ts`)
   - Database connection management
   - Container access
   - Automatic initialization

4. **Middleware**
   - `auth.middleware.ts` - JWT authentication
   - `rate-limit.middleware.ts` - Rate limiting

5. **Utilities**
   - `password.ts` - Password hashing and validation

### Security Features

- **Password Hashing**: bcryptjs with 10 salt rounds
- **Account Lockout**: Configurable failed login attempts and lockout duration
- **Rate Limiting**: Configurable per-endpoint rate limits
- **Token Expiry**: Access tokens expire in 1 hour, refresh tokens in 7 days
- **Token Revocation**: Refresh tokens can be revoked individually or all at once
- **Tenant Isolation**: Users can only access their own tenant's resources

### CosmosDB Schema

#### Users Container
Partition Key: `/tenantId`

```typescript
{
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  status: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  security: {
    lastLoginAt?: string;
    failedLoginAttempts: number;
    lockedUntil?: string;
  };
}
```

#### Refresh Tokens Container
Partition Key: `/userId`
TTL: 7 days

```typescript
{
  id: string;
  userId: string;
  tenantId: string;
  tokenId: string; // jti from JWT
  token: string;
  expiresAt: string;
  createdAt: string;
}
```

## Testing

Run tests:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

## Production Considerations

1. **JWT Algorithm**: Consider using RS256 (asymmetric) instead of HS256 in production for better security
2. **Key Management**: Store JWT secrets in Azure Key Vault or similar secure storage
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Adjust rate limits based on your traffic patterns
5. **Monitoring**: Implement proper logging and monitoring (Application Insights)
6. **Token Rotation**: Consider implementing automatic token rotation
7. **Security Headers**: Add security headers (helmet.js)

## License

MIT
