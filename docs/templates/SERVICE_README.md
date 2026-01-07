# Service Name

Brief one-line description of what this service does.

## 📋 Overview

Detailed description of the service, its purpose, and its role in the overall application architecture.

## 🎯 Features

- Feature 1: Description
- Feature 2: Description
- Feature 3: Description

## 🏗️ Architecture

Explain the service architecture, key components, and how they interact.

### Key Components

- **Component 1**: Description and responsibility
- **Component 2**: Description and responsibility
- **Component 3**: Description and responsibility

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- [Any other requirements]

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd [service-directory]

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
COSMOSDB_ENDPOINT=https://localhost:8081
COSMOSDB_KEY=your-cosmosdb-key
COSMOSDB_DATABASE=your-database-name

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# Feature Flags
FEATURE_NEW_FEATURE=enabled

# Logging
LOG_LEVEL=info
```

### Running the Service

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm start

# Run tests
npm test

# Run linter
npm run lint
```

## 📡 API Endpoints

### Base URL
- **Development**: `http://localhost:3000`
- **Staging**: `https://staging.example.com`
- **Production**: `https://api.example.com`

### Authentication

All endpoints (except public ones) require JWT authentication:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### GET /api/resource

Get a list of resources.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `filter` (string, optional): Filter criteria

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "name": "Resource Name",
      "createdAt": "2026-01-07T00:00:00Z"
    }
  ],
  "metadata": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

**Status Codes:**
- `200 OK`: Success
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: Server error

#### POST /api/resource

Create a new resource.

**Request Body:**
```json
{
  "name": "Resource Name",
  "description": "Resource description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Resource Name",
    "description": "Resource description",
    "createdAt": "2026-01-07T00:00:00Z"
  }
}
```

**Status Codes:**
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: Server error

#### GET /api/resource/:id

Get a specific resource by ID.

**Path Parameters:**
- `id` (string, required): Resource ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Resource Name",
    "createdAt": "2026-01-07T00:00:00Z"
  }
}
```

**Status Codes:**
- `200 OK`: Success
- `404 Not Found`: Resource not found
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: Server error

#### PUT /api/resource/:id

Update a resource (full update).

**Path Parameters:**
- `id` (string, required): Resource ID

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Updated Name",
    "description": "Updated description",
    "updatedAt": "2026-01-07T00:00:00Z"
  }
}
```

**Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid input
- `404 Not Found`: Resource not found
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: Server error

#### DELETE /api/resource/:id

Delete a resource.

**Path Parameters:**
- `id` (string, required): Resource ID

**Response:**
```json
{
  "success": true,
  "message": "Resource deleted successfully"
}
```

**Status Codes:**
- `204 No Content`: Successfully deleted
- `404 Not Found`: Resource not found
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: Server error

### Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    }
  },
  "metadata": {
    "timestamp": "2026-01-07T00:00:00Z",
    "requestId": "unique-request-id"
  }
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.spec.ts

# Run in watch mode
npm test -- --watch
```

### Test Structure

```
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
└── fixtures/          # Test data and fixtures
```

### Writing Tests

Example test:

```typescript
import { describe, it, expect } from 'vitest';
import { ResourceService } from './resource.service';

describe('ResourceService', () => {
  describe('createResource', () => {
    it('should create a new resource', async () => {
      const service = new ResourceService();
      const data = { name: 'Test Resource' };
      
      const result = await service.createResource(data);
      
      expect(result).toBeDefined();
      expect(result.name).toBe(data.name);
    });
  });
});
```

## 🛠️ Development

### Project Structure

```
src/
├── controllers/       # Request handlers
├── services/         # Business logic
├── models/           # Data models
├── middleware/       # Express middleware
├── utils/            # Utility functions
├── types/            # TypeScript types
├── config/           # Configuration files
└── index.ts          # Application entry point
```

### Code Style

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type checking

Run linting and formatting:

```bash
npm run lint          # Check for linting errors
npm run lint:fix      # Auto-fix linting errors
npm run format        # Format code with Prettier
npm run type-check    # TypeScript type checking
```

### Development Workflow

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit following conventional commits
3. Run tests and linting: `npm test && npm run lint`
4. Push changes and create a Pull Request
5. Wait for CI checks and code review
6. Merge after approval

## 📚 Documentation

### API Documentation

OpenAPI/Swagger documentation is available at:
- Development: `http://localhost:3000/api-docs`
- Production: `https://api.example.com/api-docs`

### Code Documentation

We use JSDoc for inline documentation:

```typescript
/**
 * Creates a new resource with the provided data.
 * 
 * @param data - The resource data
 * @returns Promise resolving to the created resource
 * @throws {ValidationError} When data is invalid
 */
async function createResource(data: ResourceInput): Promise<Resource> {
  // Implementation
}
```

## 🚀 Deployment

### Building for Production

```bash
# Build the application
npm run build

# The build output will be in the 'dist' directory
```

### Environment-Specific Configuration

- **Development**: Uses `.env` file
- **Staging**: Uses environment variables in Azure App Service
- **Production**: Uses environment variables in Azure App Service

### Health Checks

The service provides health check endpoints:

- `GET /health` - Basic health check
- `GET /health/ready` - Readiness check (includes database connectivity)
- `GET /health/live` - Liveness check

## 📊 Monitoring & Logging

### Logging

This service uses structured logging with different log levels:

- `error`: Error conditions
- `warn`: Warning conditions
- `info`: Informational messages
- `debug`: Debug-level messages

Configure log level via `LOG_LEVEL` environment variable.

### Metrics

Key metrics exposed:
- Request rate
- Response time
- Error rate
- Database query performance

## 🔒 Security

### Authentication

This service uses JWT-based authentication. Tokens must be included in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Authorization

Permission-based access control using dot-notation:
- `resource.read` - Read access
- `resource.write` - Write access
- `resource.delete` - Delete access

### Security Best Practices

- All sensitive data encrypted at rest
- HTTPS required for all endpoints
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting enabled

## 🤝 Contributing

Please read [CONTRIBUTING.md](../CONTRIBUTING.md) in the root repository for contribution guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 📞 Support

For issues and questions:
- **GitHub Issues**: [Create an issue](https://github.com/Takas0522/ws-demo-poly-integration/issues)
- **Documentation**: See `/docs` directory in main repository

## 🗺️ Roadmap

See [DEVELOPMENT_PLAN.md](../DEVELOPMENT_PLAN.md) in the main repository for the overall project roadmap.

---

**Last Updated**: 2026-01-07
