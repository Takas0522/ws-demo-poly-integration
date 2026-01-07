# Authentication Service API

REST API for JWT-based authentication and token management.

## Base URL

- **Development**: `http://localhost:3001/api`
- **Staging**: `https://auth-staging.example.com/api`
- **Production**: `https://auth.example.com/api`

## Overview

The Authentication Service handles:
- User login and logout
- JWT token generation and validation
- Token refresh mechanism
- Password reset flows
- Session management

## Endpoints

### POST /auth/login

Authenticate a user and return a JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh-token-string",
    "expiresIn": "24h",
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe",
      "tenantId": "tenant-456",
      "permissions": ["user.read", "user.write"]
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Missing required fields

---

### POST /auth/refresh

Refresh an existing JWT token.

**Request Headers:**
```
Authorization: Bearer <existing-token>
```

**Request:**
```json
{
  "refreshToken": "refresh-token-string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

---

### POST /auth/logout

Invalidate the current JWT token.

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (204 No Content)**

---

### POST /auth/forgot-password

Initiate password reset flow.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

### POST /auth/reset-password

Reset password using reset token.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

### POST /auth/verify-token

Verify if a JWT token is valid.

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": "user-123",
      "email": "user@example.com"
    }
  }
}
```

---

## Token Structure

JWT tokens include the following claims:

```json
{
  "sub": "user-123",           // User ID
  "email": "user@example.com",
  "tenantId": "tenant-456",
  "permissions": ["user.read", "user.write"],
  "iat": 1704672000,           // Issued at
  "exp": 1704758400            // Expires at
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_INVALID_CREDENTIALS` | Email or password is incorrect |
| `AUTH_TOKEN_EXPIRED` | JWT token has expired |
| `AUTH_TOKEN_INVALID` | JWT token is malformed or invalid |
| `AUTH_REFRESH_TOKEN_INVALID` | Refresh token is invalid or expired |
| `AUTH_USER_NOT_FOUND` | User account doesn't exist |
| `AUTH_PASSWORD_RESET_INVALID` | Password reset token is invalid or expired |

## OpenAPI Specification

See [openapi.yaml](./openapi.yaml) for the complete OpenAPI 3.0 specification.

---

**Last Updated**: 2026-01-07
