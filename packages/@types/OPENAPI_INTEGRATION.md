# OpenAPI Integration

This document describes how to integrate the shared types library with OpenAPI specifications for automated type generation.

## Current Status

The types library (v1.0.0) provides hand-crafted TypeScript definitions that serve as the foundation for all services. These types are designed to be compatible with OpenAPI schema generation.

## Future: Automated Type Generation

As services implement OpenAPI 3.0 specifications, we can automate type generation using tools like:

### Recommended Tools

1. **openapi-typescript**
   ```bash
   npm install -D openapi-typescript
   ```
   
   Generate types from OpenAPI spec:
   ```bash
   npx openapi-typescript ./docs/api/auth-service/openapi.yaml -o ./packages/@types/src/generated/auth-service.types.ts
   ```

2. **oazapfts**
   ```bash
   npm install -D oazapfts
   ```
   
   Generate types and API client:
   ```bash
   npx oazapfts ./docs/api/auth-service/openapi.yaml ./packages/@types/src/generated/auth-client.ts
   ```

3. **swagger-typescript-api**
   ```bash
   npm install -D swagger-typescript-api
   ```

## Integration Strategy

### Phase 1: Manual Types (Current)
- Hand-crafted types in `src/*.types.ts`
- Direct control over type definitions
- No external dependencies
- Used across all services immediately

### Phase 2: OpenAPI Specification
When each service creates OpenAPI specs:
1. Define OpenAPI 3.0 specification files in `docs/api/{service-name}/openapi.yaml`
2. Ensure specs match the types defined in this package
3. Use OpenAPI specs for API documentation and validation

### Phase 3: Automated Generation (Future)
When OpenAPI specs are stable:
1. Add type generation scripts to package.json:
   ```json
   {
     "scripts": {
       "generate:auth": "openapi-typescript ../../docs/api/auth-service/openapi.yaml -o src/generated/auth.types.ts",
       "generate:users": "openapi-typescript ../../docs/api/user-management-service/openapi.yaml -o src/generated/users.types.ts",
       "generate:settings": "openapi-typescript ../../docs/api/service-setting-service/openapi.yaml -o src/generated/settings.types.ts",
       "generate:all": "npm run generate:auth && npm run generate:users && npm run generate:settings"
     }
   }
   ```

2. Create `src/generated/` directory for auto-generated types
3. Re-export generated types from main index
4. Maintain manual types for cross-cutting concerns

### Phase 4: CI/CD Integration
Automate type generation in GitHub Actions:
```yaml
- name: Generate Types from OpenAPI
  run: |
    cd packages/@types
    npm run generate:all
    npm run build
```

## Type Generation Best Practices

### 1. Keep Manual Types for Core Concepts
- User, Tenant, Permission types should remain hand-crafted
- These are shared across multiple services
- Easier to maintain consistency

### 2. Generate Service-Specific Types
- Service-specific request/response types
- Service-specific DTOs
- Endpoint-specific types

### 3. Use Type Composition
Combine manual and generated types:
```typescript
// Manual core type
import { User } from '../user.types';

// Generated API type
import { components } from './generated/auth.types';

// Compose them
type UserResponse = components['schemas']['UserResponse'];
```

### 4. Version Alignment
Keep type versions aligned with API versions:
- Types v1.0.0 → API v1.0.0
- Breaking type changes → Major version bump
- New optional fields → Minor version bump

## Example: Type Generation Setup

### Directory Structure
```
packages/@types/
├── src/
│   ├── user.types.ts          # Manual core types
│   ├── tenant.types.ts        # Manual core types
│   ├── permission.types.ts    # Manual core types
│   ├── jwt.types.ts           # Manual core types
│   ├── api.types.ts           # Manual core types
│   ├── auth.types.ts          # Manual core types
│   ├── generated/             # Auto-generated (future)
│   │   ├── auth.types.ts
│   │   ├── users.types.ts
│   │   └── settings.types.ts
│   └── index.ts               # Exports all types
```

### Sample Generated Integration
```typescript
// src/generated/auth.types.ts (generated from OpenAPI)
export interface paths {
  '/api/auth/login': {
    post: {
      requestBody: {
        content: {
          'application/json': components['schemas']['LoginRequest']
        }
      }
      responses: {
        200: {
          content: {
            'application/json': components['schemas']['LoginResponse']
          }
        }
      }
    }
  }
}

// src/index.ts - Re-export
export * from './generated/auth.types';
```

## Validation

When implementing OpenAPI generation:

1. **Ensure Type Compatibility**
   - Generated types should match existing manual types
   - Run type-check after generation
   - Fix any conflicts

2. **Test Type Exports**
   ```typescript
   // test.ts
   import { User, LoginRequest, APIResponse } from '@saas-app/types';
   
   const user: User = { /* ... */ };
   const loginReq: LoginRequest = { /* ... */ };
   const response: APIResponse<User> = { /* ... */ };
   ```

3. **Document Breaking Changes**
   - Update CHANGELOG.md
   - Bump major version
   - Notify service maintainers

## Migration Path

For services to adopt OpenAPI-generated types:

1. **Start with Manual Types** (Current)
   - Import from `@saas-app/types`
   - Use in controllers, services, models

2. **Add OpenAPI Specs**
   - Document existing APIs
   - Ensure specs match current types
   - Validate with tools like Swagger UI

3. **Enable Type Generation**
   - Generate types from OpenAPI
   - Compare with manual types
   - Fix discrepancies

4. **Switch to Generated Types**
   - Update imports to use generated types
   - Deprecate manual duplicates
   - Keep core types manual

## Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [openapi-typescript](https://github.com/drwpow/openapi-typescript)
- [Swagger Codegen](https://github.com/swagger-api/swagger-codegen)
- [API Design Best Practices](https://swagger.io/resources/articles/best-practices-in-api-design/)

## Related Documentation

- [API Documentation](../../docs/api/)
- [Development Plan - Issue 013](../../DEVELOPMENT_PLAN.md)
- Main [README](./README.md)
