# JWT Authentication Service - API Documentation (FastAPI)

## Overview
The JWT Authentication Service provides secure authentication and authorization for the SaaS Management Application using JSON Web Tokens (JWT). **Now implemented with Python and FastAPI!**

## Base URL
```
http://localhost:3001
```

## Interactive Documentation

FastAPI provides automatic interactive API documentation:

- **Swagger UI**: http://localhost:3001/docs
- **ReDoc**: http://localhost:3001/redoc

These interfaces allow you to test the API directly from your browser!

## Authentication Flow

### 1. User Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "tenant_id": "tenant-123",  // Optional: for multi-tenant scenarios
  "remember_me": false
}
```

**Response (200 OK):**
```json
{
  "tokens": {
    "access_token": "******",
    "refresh_token": "******",
    "expires_in": 3600,
    "token_type": "Bearer"
  },
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "display_name": "John Doe",
    "first_name": "John",
    "last_name": "Doe",
    "status": "active"
  }
}
```

**Error Responses:**
- `400`: Missing required fields or validation error
- `401`: Invalid credentials or account locked
- `422`: Validation error (Pydantic)

### 2. Token Refresh
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "******"
}
```

**Response (200 OK):**
```json
{
  "tokens": {
    "access_token": "******",
    "refresh_token": "******",
    "expires_in": 3600,
    "token_type": "Bearer"
  }
}
```

### 3. User Logout
```http
POST /auth/logout
Authorization: ******
Content-Type: application/json

{
  "refresh_token": "******",
  "all_devices": false  // Set to true to logout from all devices
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
Authorization: ******
```

**Response (200 OK):**
```json
{
  "valid": true,
  "user": {
    "sub": "user-123",
    "email": "user@example.com",
    "displayName": "John Doe",
    "tenantId": "tenant-123",
    "roles": ["user"],
    "permissions": ["users.read"],
    "type": "access",
    "iat": 1704988800,
    "exp": 1704992400,
    "iss": "saas-auth-service",
    "aud": "saas-app"
  }
}
```

### Get Current User
```http
GET /auth/me
Authorization: ******
```

**Response (200 OK):**
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "display_name": "John Doe",
  "tenant_id": "tenant-123",
  "roles": ["user"],
  "permissions": ["users.read"]
}
```

## Security Features

### Rate Limiting

FastAPI supports rate limiting via middleware. Configuration:

- **General API**: Configurable (default: no limit)
- **Auth endpoints**: Can be added with slowapi or custom middleware

### Account Lockout

- **Max failed attempts**: 5 (configurable via `MAX_LOGIN_ATTEMPTS`)
- **Lockout duration**: 15 minutes (configurable via `LOCKOUT_DURATION_MINUTES`)
- Automatic unlock after lockout period

### Token Security

- **Access Token**: 1 hour expiry (configurable via `JWT_EXPIRES_IN`)
- **Refresh Token**: 7 days expiry (configurable via `JWT_REFRESH_EXPIRES_IN`)
- **Token Revocation**: Supports single and multi-device logout
- **Token Validation**: Verifies issuer, audience, and expiry
- **Algorithm**: HS256 (can be changed to RS256 for production)

### Password Requirements

Configurable via environment variables:

- Minimum 8 characters (via `PASSWORD_MIN_LENGTH`)
- At least one uppercase letter (via `PASSWORD_REQUIRE_UPPERCASE`)
- At least one lowercase letter (via `PASSWORD_REQUIRE_LOWERCASE`)
- At least one number (via `PASSWORD_REQUIRE_NUMBERS`)
- At least one special character (via `PASSWORD_REQUIRE_SPECIAL_CHARS`)

## Error Codes

FastAPI uses HTTP status codes and provides detailed error responses:

| Status | Description |
|--------|-------------|
| `400` | Bad Request - Invalid input data |
| `401` | Unauthorized - Authentication failed |
| `403` | Forbidden - Access denied |
| `404` | Not Found - Resource not found |
| `422` | Unprocessable Entity - Validation error |
| `500` | Internal Server Error |

**Error Response Format:**
```json
{
  "detail": "Error message here"
}
```

**Validation Error Format (422):**
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

## Integration Examples

### Python

```python
import httpx

# Login
response = httpx.post(
    "http://localhost:3001/auth/login",
    json={
        "email": "user@example.com",
        "password": "SecurePassword123!"
    }
)
data = response.json()
access_token = data["tokens"]["access_token"]

# Make authenticated request
response = httpx.get(
    "http://localhost:3001/auth/me",
    headers={"Authorization": f"******}
)
print(response.json())
```

### JavaScript/TypeScript

```typescript
// Login
const loginResponse = await fetch('http://localhost:3001/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123!'
  })
});
const { tokens } = await loginResponse.json();

// Make authenticated request
const response = await fetch('http://localhost:3001/auth/me', {
  headers: { 'Authorization': `******` }
});
const user = await response.json();
```

### cURL

```bash
# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePassword123!"}'

# Get current user
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: ******"
```

## FastAPI Features

### Automatic Validation

FastAPI automatically validates all requests using Pydantic models:

```python
# Invalid email
POST /auth/login
{
  "email": "not-an-email",
  "password": "pass"
}

# Returns 422 with validation details
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

### Type Hints

All endpoints have full type hints for better IDE support and documentation:

```python
@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest) -> LoginResponse:
    return await auth_service.login(request)
```

### Async/Await

FastAPI is fully async for better performance:

```python
async def login(request: LoginRequest) -> LoginResponse:
    user = await cosmos_db.find_user_by_email(request.email)
    # ... async operations
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
  "timestamp": "2024-01-11T12:00:00.000000Z",
  "uptime": 3600.5
}
```

## OpenAPI Schema

The complete OpenAPI 3.0 schema is available at:

```
http://localhost:3001/openapi.json
```

This can be used for:
- Client code generation
- API testing tools
- Documentation generators
- Integration with API gateways

## Environment Configuration

See `.env.template` in the project root for all available configuration options.

Key settings:
- `AUTH_SERVICE_PORT`: Service port (default: 3001)
- `JWT_SECRET`: Secret for signing tokens
- `JWT_ALGORITHM`: Algorithm (HS256 or RS256)
- `JWT_EXPIRES_IN`: Access token expiry in seconds (default: 3600)
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiry in seconds (default: 604800)
- `COSMOSDB_ENDPOINT`: CosmosDB endpoint
- `COSMOSDB_KEY`: CosmosDB key
- `MAX_LOGIN_ATTEMPTS`: Maximum failed login attempts
- `LOCKOUT_DURATION_MINUTES`: Account lockout duration

## Migration from Node.js

This service was migrated from Node.js/Express to Python/FastAPI. See [MIGRATION_NODEJS_TO_PYTHON.md](../MIGRATION_NODEJS_TO_PYTHON.md) for details.

**API contract remains 100% compatible!** No client changes required.

## License

MIT
