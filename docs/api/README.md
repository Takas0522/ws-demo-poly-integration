# API Documentation

This directory contains API documentation for all services in the SaaS Admin Web Application.

## 📋 Overview

Each service in this application exposes RESTful APIs documented using OpenAPI 3.0 specification. This directory provides:

- Unified API documentation standards
- Service-specific API references
- Authentication and authorization guides
- Common API patterns and conventions

## 🏗️ Services

### Authentication Service
- **Path**: [auth-service/](./auth-service/)
- **Base URL**: `http://localhost:3001/api`
- **Purpose**: JWT authentication and token management

### User Management Service
- **Path**: [user-management-service/](./user-management-service/)
- **Base URL**: `http://localhost:3002/api`
- **Purpose**: User CRUD operations and profile management

### Service Settings Service
- **Path**: [service-setting-service/](./service-setting-service/)
- **Base URL**: `http://localhost:3003/api`
- **Purpose**: Service configuration and feature flag management

## 🔐 Authentication

All APIs (except public endpoints) require JWT authentication.

### Obtaining a Token

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h",
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

### Using the Token

Include the token in the `Authorization` header:

```bash
GET /api/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Refresh

```bash
POST /api/auth/refresh
Authorization: Bearer <existing-token>
```

## 📡 Common API Patterns

### Request Format

All API requests should follow these conventions:

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>  (for multi-tenant operations)
```

**Query Parameters for Lists:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `sort` (string): Sort field (prefix with `-` for descending)
- `filter` (string): Filter expression

**Example:**
```bash
GET /api/users?page=1&limit=20&sort=-createdAt&filter=active:true
```

### Response Format

All API responses follow a standard format:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "metadata": {
    "timestamp": "2026-01-07T00:00:00Z",
    "requestId": "req-123"
  }
}
```

**List Response:**
```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "metadata": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  },
  "metadata": {
    "timestamp": "2026-01-07T00:00:00Z",
    "requestId": "req-123"
  }
}
```

## 🔢 Status Codes

### Success Codes
- **200 OK**: Successful GET, PUT, or PATCH request
- **201 Created**: Successful POST request that creates a resource
- **204 No Content**: Successful DELETE request

### Client Error Codes
- **400 Bad Request**: Invalid request format or parameters
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Valid authentication but insufficient permissions
- **404 Not Found**: Requested resource doesn't exist
- **409 Conflict**: Request conflicts with current state (e.g., duplicate)
- **422 Unprocessable Entity**: Validation errors
- **429 Too Many Requests**: Rate limit exceeded

### Server Error Codes
- **500 Internal Server Error**: Unexpected server error
- **502 Bad Gateway**: Upstream service error
- **503 Service Unavailable**: Service temporarily unavailable
- **504 Gateway Timeout**: Upstream service timeout

## 🚨 Error Codes

Standard error codes used across all services:

### Authentication Errors (AUTH_*)
- `AUTH_INVALID_CREDENTIALS`: Invalid email or password
- `AUTH_TOKEN_EXPIRED`: JWT token has expired
- `AUTH_TOKEN_INVALID`: JWT token is malformed or invalid
- `AUTH_UNAUTHORIZED`: No authentication token provided

### Authorization Errors (AUTHZ_*)
- `AUTHZ_INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `AUTHZ_FORBIDDEN`: Action not allowed for this user

### Validation Errors (VALIDATION_*)
- `VALIDATION_FAILED`: General validation failure
- `VALIDATION_REQUIRED_FIELD`: Required field missing
- `VALIDATION_INVALID_FORMAT`: Field format is invalid
- `VALIDATION_OUT_OF_RANGE`: Value outside allowed range

### Resource Errors (RESOURCE_*)
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `RESOURCE_ALREADY_EXISTS`: Resource with same identifier exists
- `RESOURCE_CONFLICT`: Operation conflicts with resource state

### Database Errors (DB_*)
- `DB_CONNECTION_ERROR`: Failed to connect to database
- `DB_QUERY_ERROR`: Database query failed
- `DB_CONSTRAINT_VIOLATION`: Database constraint violated

### Rate Limiting (RATE_LIMIT_*)
- `RATE_LIMIT_EXCEEDED`: Too many requests in time window

## 🔄 Versioning

APIs are versioned using URL path versioning:

```
/api/v1/users
/api/v2/users
```

**Current Version**: v1

**Version Support Policy**:
- Current version (v1): Fully supported
- Previous version (v0): Deprecated, 6-month sunset period
- Older versions: Not supported

## 📄 Pagination

List endpoints support cursor-based and offset-based pagination.

### Offset-Based Pagination (Default)

**Request:**
```bash
GET /api/users?page=2&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "metadata": {
    "total": 100,
    "page": 2,
    "limit": 20,
    "pages": 5
  }
}
```

### Cursor-Based Pagination

**Request:**
```bash
GET /api/users?cursor=eyJpZCI6IjEyMyJ9&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "metadata": {
    "nextCursor": "eyJpZCI6IjE0MyJ9",
    "hasMore": true,
    "limit": 20
  }
}
```

## 🔍 Filtering and Sorting

### Filtering

Use query parameters for filtering:

**Simple Filter:**
```bash
GET /api/users?status=active&role=admin
```

**Complex Filter (JSON):**
```bash
GET /api/users?filter={"status":"active","createdAt":{"$gte":"2026-01-01"}}
```

### Sorting

Use `sort` parameter with field name:

**Ascending:**
```bash
GET /api/users?sort=name
```

**Descending:**
```bash
GET /api/users?sort=-createdAt
```

**Multiple Fields:**
```bash
GET /api/users?sort=status,-createdAt
```

## 🔐 Security Best Practices

### Input Validation
- All inputs are validated before processing
- Strict type checking enforced
- SQL injection prevention
- XSS protection on text inputs

### Rate Limiting
- **Anonymous users**: 60 requests/minute
- **Authenticated users**: 300 requests/minute
- **Premium users**: 1000 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 275
X-RateLimit-Reset: 1704672000
```

### CORS
Cross-Origin Resource Sharing (CORS) is configured for:
- Development: `http://localhost:*`
- Staging: `https://*.staging.example.com`
- Production: `https://*.example.com`

## 🧪 Testing APIs

### Using cURL

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Authenticated request
curl -X GET http://localhost:3002/api/users \
  -H "Authorization: Bearer <token>"
```

### Using Postman

Import the OpenAPI specification files from each service's documentation folder into Postman.

### Using Swagger UI

Each service provides Swagger UI for interactive API testing:

- Auth Service: `http://localhost:3001/api-docs`
- User Service: `http://localhost:3002/api-docs`
- Settings Service: `http://localhost:3003/api-docs`

## 📊 Monitoring and Logging

### Request Tracing

All requests include a unique `X-Request-ID` header for tracing:

```
X-Request-ID: req-abc123def456
```

Use this ID to trace requests across services in logs.

### Health Checks

All services provide standard health check endpoints:

```bash
GET /health           # Basic health check
GET /health/ready     # Readiness check (includes dependencies)
GET /health/live      # Liveness check
```

## 🔧 Development Tools

### API Testing Collection

Postman collections are available in each service's `/docs` directory.

### Code Generation

OpenAPI specifications can be used to generate client SDKs:

```bash
# Generate TypeScript client
npm run generate:client

# Generate Python client
npm run generate:client:python
```

## 📚 Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [REST API Best Practices](https://restfulapi.net/)
- [JWT Authentication](https://jwt.io/introduction)

## 🤝 Contributing

When adding new APIs:

1. Follow the conventions documented here
2. Update OpenAPI specification
3. Add examples for all endpoints
4. Document error codes
5. Include integration tests

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for detailed guidelines.

---

**Last Updated**: 2026-01-07
