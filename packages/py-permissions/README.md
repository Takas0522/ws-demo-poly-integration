# Python Permission System with RBAC

A comprehensive dot-notation permission system with role-based access control (RBAC) for FastAPI applications.

## Features

- ✅ **Dot-notation permissions**: Intuitive format like `users.create`, `app.users.*`
- ✅ **Role-based access control (RBAC)**: Define roles with permissions and inheritance
- ✅ **Permission scopes**: Support for tenant, global, and own scopes
- ✅ **Wildcard permissions**: Admin roles simplified with `users.*` patterns
- ✅ **FastAPI integration**: Built-in middleware and decorators
- ✅ **Permission caching**: In-memory and Redis support for performance
- ✅ **Admin override**: Bypass permission checks for specific roles
- ✅ **Type-safe**: Full Pydantic model support with validation
- ✅ **Well-tested**: Comprehensive test coverage

## Installation

```bash
pip install -r requirements.txt
```

For Redis caching support:
```bash
pip install redis
```

## Quick Start

### 1. Basic Permission Check

```python
from permissions import has_permission, create_permission_context

# Create user context
context = create_permission_context(
    user_id="user-123",
    tenant_id="tenant-456",
    roles=["user"],
    permissions=["users.read", "profile.update"]
)

# Check permission
result = has_permission(context, "users.read")
if result.granted:
    print("Access granted!")
else:
    print(f"Access denied: {result.reason}")
```

### 2. Advanced Permission Checker with Global Priority

```python
from permissions import PermissionChecker, User
import redis

# Define user with global and tenant permissions
user = User(
    id="user-123",
    permissions=[
        {"name": "users.*", "scope": "global"},  # Global admin
        {"name": "tenants.read", "scope": "global"}
    ]
)

# Optional: Setup Redis for caching
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# Function to fetch TenantUser from database
async def get_tenant_user_from_db(user_id: str, tenant_id: str):
    # Your database query here
    return {
        "user_id": user_id,
        "tenant_id": tenant_id,
        "permissions": ["posts.create", "posts.update"],
        "roles": ["editor"]
    }

# Create permission checker
checker = PermissionChecker(
    user=user,
    tenant_id="tenant-456",
    redis_client=redis_client,
    get_tenant_user_from_db=get_tenant_user_from_db
)

# Check permission (priority: global > tenant > deny)
has_access = await checker.has_permission("users.create")
print(f"Access granted: {has_access}")  # True (via global permission)

# Invalidate cache when permissions change
from permissions import invalidate_permission_cache
await invalidate_permission_cache(redis_client, "user-123", "tenant-456")
```

### 3. FastAPI Route Protection

```python
from fastapi import FastAPI, Depends
from permissions import require_permission, check_permission

app = FastAPI()

# Using dependency injection
@app.post("/users")
async def create_user(
    user: User,
    _: None = Depends(require_permission("users.create"))
):
    return {"message": "User created"}

# Using decorator
@app.put("/users/{user_id}")
@check_permission("users.update", scope="own")
async def update_user(user_id: str, user: User):
    return {"message": "User updated"}
```

### 4. Multiple Permission Checks

```python
from permissions import require_any_permission, require_all_permissions

# Require any of the specified permissions
@app.get("/dashboard")
async def dashboard(
    _: None = Depends(require_any_permission(["dashboard.view", "admin.*"]))
):
    return {"message": "Dashboard"}

# Require all specified permissions
@app.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    _: None = Depends(require_all_permissions(["users.delete", "audit.create"]))
):
    return {"message": "User deleted"}
```

### 5. Role-Based Protection

```python
from permissions import require_role, require_any_role

# Require specific role
@app.get("/admin")
async def admin_panel(
    _: None = Depends(require_role("admin"))
):
    return {"message": "Admin panel"}

# Require any of the specified roles
@app.get("/management")
async def management(
    _: None = Depends(require_any_role(["admin", "manager"]))
):
    return {"message": "Management area"}
```

### 5. Admin Override

```python
from permissions import admin_override, check_permission

@app.delete("/critical-resource")
@admin_override(["super_admin", "system_admin"])
@check_permission("resources.delete")
async def delete_critical_resource():
    # Super admins and system admins can bypass permission check
    return {"message": "Resource deleted"}
```

## Permission Format

### Basic Format

Permissions use dot notation with 2-3 segments:

```
module.action              (e.g., users.create)
app.module.action         (e.g., app.users.create)
```

### Wildcard Permissions

Wildcards simplify admin roles:

```
users.*                   - All user operations
app.users.*              - All app user operations  
app.*                    - All operations in app
```

### Common Patterns

```python
# CRUD operations
users.create              - Create users
users.read               - Read user data
users.update             - Update users
users.delete             - Delete users
users.list               - List all users

# Admin permissions
users.*                  - All user operations
services.*               - All service operations
admin.*                  - All admin operations

# Special permissions
api-keys.create          - Create API keys
api-keys.revoke          - Revoke API keys
reports.generate         - Generate reports
audit-logs.read          - View audit logs
```

## Permission Scopes

Three permission scopes are supported:

### 1. Tenant Scope (Default)

Permission applies within user's tenant:

```python
@app.get("/users")
async def get_users(
    _: None = Depends(require_permission("users.read", scope="tenant"))
):
    # User can only read users in their tenant
    pass
```

### 2. Global Scope

Permission applies across all tenants (system admins):

```python
@app.get("/all-users")
async def get_all_users(
    _: None = Depends(require_permission("users.read", scope="global"))
):
    # User can read users across all tenants
    pass
```

### 3. Own Scope

Permission applies only to user's own resources:

```python
@app.put("/profile")
async def update_profile(
    request: Request,
    _: None = Depends(require_permission(
        "profile.update",
        scope="own",
        get_resource_owner_id=lambda req: req.state.user["user_id"]
    ))
):
    # User can only update their own profile
    pass
```

## Role-Based Access Control (RBAC)

### Define Roles

```python
from permissions import Role

roles = [
    Role(
        id="role-user",
        name="user",
        display_name="User",
        description="Basic user",
        permissions=["users.read", "profile.update"],
        is_active=True
    ),
    Role(
        id="role-manager",
        name="manager",
        display_name="Manager",
        description="Manager role",
        permissions=["users.create", "users.update", "reports.read"],
        inherits_from=["user"],  # Inherits from user role
        is_active=True
    ),
    Role(
        id="role-admin",
        name="admin",
        display_name="Administrator",
        description="Administrator role",
        permissions=["users.*", "services.*"],
        inherits_from=["manager"],  # Inherits from manager role
        is_active=True
    ),
]
```

### Role Inheritance

Roles can inherit permissions from parent roles:

```
admin (users.*, services.*)
  └─ manager (users.create, users.update, reports.read)
      └─ user (users.read, profile.update)
```

Admin role has all permissions from manager and user roles, plus its own.

### Use Roles in Permission Checks

```python
from permissions import has_permission, get_effective_permissions

# Check permission with roles
result = has_permission(context, "users.create", all_roles=roles)

# Get all effective permissions for a user
permissions = get_effective_permissions(["admin"], roles)
print(permissions)  # All permissions from admin, manager, and user roles
```

## Permission Caching

### In-Memory Cache (Default)

```python
from permissions import InMemoryCache, CachedPermissionChecker

cache = InMemoryCache()
cached_checker = CachedPermissionChecker(cache, ttl=300)

# Cache user permissions
cached_checker.cache_user_permissions(
    user_id="user-123",
    tenant_id="tenant-456",
    permissions=["users.read", "profile.update"]
)

# Get cached permissions
permissions = cached_checker.get_cached_user_permissions(
    user_id="user-123",
    tenant_id="tenant-456"
)
```

### Redis Cache (Optional)

```python
import redis
from permissions import RedisCache, CachedPermissionChecker, set_default_cache

# Initialize Redis client
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# Create Redis cache
cache = RedisCache(redis_client, key_prefix="perm:")

# Set as default cache
set_default_cache(cache, ttl=300)

# Now all permission checks will use Redis caching
```

### Redis Configuration for PermissionChecker

The advanced `PermissionChecker` includes built-in Redis caching for TenantUser data:

```python
import redis
from permissions import PermissionChecker, User
import os

# Setup Redis client from environment variables
redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    password=os.getenv('REDIS_PASSWORD', None),
    db=0,
    decode_responses=False
)

# PermissionChecker automatically caches TenantUser data for 5 minutes
checker = PermissionChecker(
    user=user,
    tenant_id="tenant-456",
    redis_client=redis_client,
    get_tenant_user_from_db=get_tenant_user_from_db
)

# Cache is automatically used and maintained
has_access = await checker.has_permission("users.create")
```

**Environment Variables for Redis:**
- `REDIS_HOST`: Redis server hostname (default: localhost)
- `REDIS_PORT`: Redis server port (default: 6379)
- `REDIS_PASSWORD`: Redis password (optional)

**Note:** Redis is optional. If not provided, the checker will fetch data directly from the database without caching.

### Cache Invalidation

```python
from permissions import invalidate_permission_cache

# Invalidate user cache when permissions change
await invalidate_permission_cache(redis_client, "user-123", "tenant-456")

# For CachedPermissionChecker
cached_checker.invalidate_user_cache("user-123", "tenant-456")

# Invalidate role cache when role permissions change
cached_checker.invalidate_role_cache("admin", "tenant-456")

# Clear all cache (use sparingly)
cached_checker.invalidate_all()
```

**When to invalidate cache:**
- When TenantUsers permissions are updated
- When User.permissions are updated
- When roles are modified

## Permission Priority Logic

The `PermissionChecker` implements a priority-based permission system:

### Priority Order

1. **Global Permissions** (highest priority)
   - Defined in `Users.permissions` with `scope='global'`
   - Apply across all tenants
   - Typically used for system administrators

2. **Tenant-Specific Permissions**
   - Defined in `TenantUsers.permissions`
   - Apply only within the specific tenant
   - Typical use case for regular users

3. **Default Deny** (lowest priority)
   - If no permissions match, access is denied

### Example: Permission Priority

```python
from permissions import PermissionChecker, User

# User with both global and tenant permissions
user = User(
    id="user-123",
    permissions=[
        {"name": "users.create", "scope": "global"},  # Global permission
        {"name": "posts.read", "scope": "tenant"}     # Tenant-scoped (not used by checker)
    ]
)

async def get_tenant_user(user_id, tenant_id):
    return {
        "permissions": ["users.delete", "posts.update"]  # Tenant permissions
    }

checker = PermissionChecker(user, "tenant-456", get_tenant_user_from_db=get_tenant_user)

# Priority demonstration
await checker.has_permission("users.create")  # True (global permission)
await checker.has_permission("posts.update")  # True (tenant permission)
await checker.has_permission("users.delete")  # True (tenant permission)
await checker.has_permission("admin.delete")  # False (no match)
```

### Global vs Tenant Permissions

**Global Permissions:**
```python
user.permissions = [
    {"name": "users.*", "scope": "global"},      # All user operations globally
    {"name": "tenants.read", "scope": "global"}  # Read tenants globally
]
```

**Tenant Permissions:**
```python
tenant_user = {
    "permissions": ["posts.create", "posts.update", "comments.*"]
}
```

**Use Cases:**
- **Global**: System administrators, super users, cross-tenant operations
- **Tenant**: Regular users, tenant-specific operations, isolated access

## FastAPI Integration

### Setting Up User Context

Your authentication middleware should set the user context in `request.state.user`:

```python
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Extract user from JWT token
        token = request.headers.get("Authorization")
        user_data = verify_token(token)  # Your JWT verification
        
        # Set user context for permission checks
        request.state.user = {
            "user_id": user_data["userId"],
            "tenant_id": user_data["tenantId"],
            "roles": user_data["roles"],
            "permissions": user_data["permissions"]
        }
        
        response = await call_next(request)
        return response

app.add_middleware(AuthMiddleware)
```

### Optional: Setting Roles Context

If you want to support role-based checking with inheritance:

```python
class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # ... set user context ...
        
        # Optionally load roles for role-based checking
        request.state.roles = load_roles_from_db()  # Your DB query
        
        response = await call_next(request)
        return response
```

## Testing

### Run Tests

```bash
# Install dev dependencies
pip install pytest pytest-asyncio pytest-cov

# Run tests
pytest

# Run with coverage
pytest --cov=permissions --cov-report=term-missing
```

### Example Test

```python
import pytest
from permissions import has_permission, create_permission_context

def test_user_has_permission():
    context = create_permission_context(
        user_id="user-123",
        tenant_id="tenant-456",
        roles=["user"],
        permissions=["users.read"]
    )
    
    result = has_permission(context, "users.read")
    assert result.granted is True
```

## Security Best Practices

### ✅ Do's

- Use specific permissions for regular users
- Grant wildcard permissions only to admin roles
- Always validate permissions at API boundaries
- Cache aggregated role permissions
- Log all permission denials for audit
- Use middleware for route protection
- Test permission logic thoroughly

### ❌ Don'ts

- Don't skip permission checks in business logic
- Don't trust client-provided permissions
- Don't grant `*.*` wildcard to any role
- Don't implement custom permission formats
- Don't bypass middleware for "internal" routes
- Don't store permissions in frontend code

## Error Handling

Permission denials return HTTP 403 with details:

```json
{
  "error": "Forbidden",
  "message": "User does not have permission: users.delete",
  "required": "users.delete"
}
```

## API Reference

See individual module documentation:

- `types.py` - Type definitions and Pydantic models
- `parser.py` - Permission parsing and validation
- `rbac.py` - Role-based access control logic
- `checker.py` - Permission checking functions
- `middleware.py` - FastAPI middleware and decorators
- `cache.py` - Caching mechanisms

## Examples

See the `examples/` directory for complete integration examples:

- Basic FastAPI application
- Multi-tenant application
- Role hierarchy example
- Caching example

## License

MIT

## Support

For issues, questions, or contributions, please visit:
https://github.com/Takas0522/ws-demo-poly-integration
