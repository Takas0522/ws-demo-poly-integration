# Auth Service Integration Guide

This guide explains how to integrate the py-permissions package into the FastAPI auth-service.

## Overview

The auth-service needs to be updated to include permission checking capabilities. This involves:

1. Installing the py-permissions package
2. Updating JWT tokens to include permissions
3. Adding permission middleware
4. Protecting routes with permission requirements

## Installation

### Option 1: Install as a Local Package

If the auth-service is in the same repository:

```bash
cd src/auth-service
pip install -e ../../packages/py-permissions
```

### Option 2: Copy Package Directly

Copy the `permissions` module to the auth-service:

```bash
cp -r packages/py-permissions/permissions src/auth-service/app/
```

## Step 1: Update Dependencies

Add to `src/auth-service/requirements.txt`:

```
# ... existing dependencies ...

# Permission system
pydantic>=2.5.0
pydantic-settings>=2.1.0

# Optional: For Redis caching
redis>=5.0.0
```

## Step 2: Update JWT Token Generation

Modify `src/auth-service/app/services/auth.py` to include permissions in JWT:

```python
from app.core.security import create_access_token

async def login(email: str, password: str, tenant_id: str) -> dict:
    # ... existing authentication logic ...
    
    # Fetch user roles and permissions from database
    user_roles = await cosmosdb_service.get_user_roles(user["id"])
    user_permissions = await cosmosdb_service.get_user_permissions(user["id"])
    
    # Create token with permissions
    token_data = {
        "sub": user["id"],
        "userId": user["id"],
        "tenantId": tenant_id,
        "email": user["email"],
        "roles": user_roles,
        "permissions": user_permissions,  # Add permissions
    }
    
    access_token = create_access_token(token_data)
    
    # ... rest of login logic ...
```

## Step 3: Update Authentication Middleware

Modify `src/auth-service/app/middleware/auth.py` to set up permission context:

```python
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from app.core.security import verify_token

security = HTTPBearer()

async def get_current_user(
    request: Request,
    credentials: HTTPAuthCredentials = Depends(security)
) -> dict:
    """Extract and verify user from JWT token."""
    try:
        token = credentials.credentials
        payload = verify_token(token)
        
        # Set user context for permission checks
        user_context = {
            "user_id": payload.get("userId"),
            "tenant_id": payload.get("tenantId"),
            "email": payload.get("email"),
            "roles": payload.get("roles", []),
            "permissions": payload.get("permissions", []),
        }
        
        # Store in request state for permission middleware
        request.state.user = user_context
        
        return user_context
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
```

## Step 4: Add Permission-Protected Routes

Create new routes with permission protection:

### Example: Protect User Management Endpoints

```python
from fastapi import APIRouter, Depends
from permissions import require_permission, require_any_permission, require_role

router = APIRouter(prefix="/api/users", tags=["users"])

@router.post("")
async def create_user(
    user_data: UserCreate,
    current_user: dict = Depends(get_current_user),
    _: None = Depends(require_permission("users.create"))
):
    """Create a new user. Requires 'users.create' permission."""
    # Implementation
    return {"message": "User created"}

@router.get("")
async def list_users(
    current_user: dict = Depends(get_current_user),
    _: None = Depends(require_any_permission(["users.read", "users.list"]))
):
    """List users. Requires 'users.read' or 'users.list' permission."""
    # Implementation
    return {"users": []}

@router.put("/{user_id}")
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user),
    _: None = Depends(require_permission(
        "users.update",
        scope="own",
        get_resource_owner_id=lambda req: req.path_params.get("user_id")
    ))
):
    """Update a user. Users can only update their own data (scope='own')."""
    # Implementation
    return {"message": "User updated"}

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    _: None = Depends(require_role("admin"))
):
    """Delete a user. Requires 'admin' role."""
    # Implementation
    return {"message": "User deleted"}
```

## Step 5: Add Permission Management Endpoints

Add routes for managing permissions and roles:

```python
from fastapi import APIRouter, Depends
from permissions import Role, require_permission

router = APIRouter(prefix="/api/permissions", tags=["permissions"])

@router.get("/check")
async def check_permission(
    permission: str,
    current_user: dict = Depends(get_current_user)
):
    """Check if current user has a specific permission."""
    from permissions import has_permission, create_permission_context
    
    context = create_permission_context(
        user_id=current_user["user_id"],
        tenant_id=current_user["tenant_id"],
        roles=current_user["roles"],
        permissions=current_user["permissions"]
    )
    
    result = has_permission(context, permission)
    return {
        "permission": permission,
        "granted": result.granted,
        "reason": result.reason
    }

@router.get("/me")
async def get_my_permissions(
    current_user: dict = Depends(get_current_user)
):
    """Get all permissions for the current user."""
    from permissions import get_user_permissions, create_permission_context
    
    context = create_permission_context(
        user_id=current_user["user_id"],
        tenant_id=current_user["tenant_id"],
        roles=current_user["roles"],
        permissions=current_user["permissions"]
    )
    
    permissions = get_user_permissions(context)
    return {
        "user_id": current_user["user_id"],
        "roles": current_user["roles"],
        "permissions": permissions
    }

@router.post("/roles")
async def create_role(
    role: Role,
    current_user: dict = Depends(get_current_user),
    _: None = Depends(require_permission("roles.create"))
):
    """Create a new role. Requires 'roles.create' permission."""
    # Save role to database
    # await cosmosdb_service.create_role(role)
    return {"message": "Role created", "role": role}
```

## Step 6: Enable Permission Caching (Optional)

Add caching for better performance:

```python
# In app/main.py or app/core/config.py

from permissions import InMemoryCache, set_default_cache

# Initialize cache on startup
@app.on_event("startup")
async def startup_event():
    # Set up in-memory cache with 5-minute TTL
    cache = InMemoryCache()
    set_default_cache(cache, ttl=300)
    
    # Or use Redis cache if available
    # import redis
    # from permissions import RedisCache
    # redis_client = redis.Redis(host='localhost', port=6379, db=0)
    # cache = RedisCache(redis_client)
    # set_default_cache(cache, ttl=300)
```

## Step 7: Database Schema Updates

### Add Permissions to User Documents

Update CosmosDB schema to store user permissions:

```json
{
  "id": "user-123",
  "tenantId": "tenant-456",
  "email": "user@example.com",
  "roles": ["user", "manager"],
  "permissions": [
    "users.read",
    "users.create",
    "profile.update"
  ],
  "type": "user"
}
```

### Create Role Documents

Store roles in CosmosDB:

```json
{
  "id": "role-admin",
  "tenantId": "tenant-456",
  "name": "admin",
  "displayName": "Administrator",
  "description": "Full system administrator",
  "permissions": [
    "users.*",
    "services.*",
    "settings.*"
  ],
  "inheritsFrom": ["manager"],
  "isActive": true,
  "type": "role"
}
```

## Step 8: Testing

### Unit Tests

Add tests for permission-protected endpoints:

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_user_with_permission():
    """Test creating user with proper permissions."""
    token = create_test_token(permissions=["users.create"])
    response = client.post(
        "/api/users",
        headers={"Authorization": f"Bearer {token}"},
        json={"email": "test@example.com", "name": "Test User"}
    )
    assert response.status_code == 200

def test_create_user_without_permission():
    """Test creating user without permissions."""
    token = create_test_token(permissions=["users.read"])
    response = client.post(
        "/api/users",
        headers={"Authorization": f"Bearer {token}"},
        json={"email": "test@example.com", "name": "Test User"}
    )
    assert response.status_code == 403
    assert "Forbidden" in response.json()["error"]
```

## Step 9: Update API Documentation

The FastAPI Swagger UI will automatically include permission requirements. Add descriptions:

```python
@router.post(
    "",
    summary="Create a new user",
    description="Creates a new user account. Requires 'users.create' permission.",
    responses={
        200: {"description": "User created successfully"},
        403: {"description": "Insufficient permissions"},
        401: {"description": "Not authenticated"}
    }
)
async def create_user(...):
    pass
```

## Admin Override Example

Implement admin override for critical operations:

```python
from permissions import admin_override, check_permission

@router.delete("/system/reset")
@admin_override(["super_admin"])
@check_permission("system.reset")
async def reset_system(
    current_user: dict = Depends(get_current_user)
):
    """Reset system. Super admins can bypass permission check."""
    # Only super_admin role can execute this
    return {"message": "System reset"}
```

## Deployment Considerations

1. **Environment Variables**: Add permission-related config to `.env`:
   ```
   PERMISSION_CACHE_TTL=300
   PERMISSION_CACHE_TYPE=memory  # or redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

2. **Performance**: Enable caching in production for better performance

3. **Monitoring**: Log permission denials for security monitoring

4. **Database Indexes**: Add indexes on permissions and roles fields in CosmosDB

## Migration Checklist

- [ ] Install py-permissions package
- [ ] Update JWT token generation to include permissions
- [ ] Update authentication middleware
- [ ] Add permission checks to existing routes
- [ ] Create permission management endpoints
- [ ] Update database schema for permissions and roles
- [ ] Add permission caching
- [ ] Write tests for permission-protected routes
- [ ] Update API documentation
- [ ] Deploy and monitor

## Troubleshooting

### Common Issues

**Issue**: Permission checks always fail
- **Solution**: Verify JWT token includes permissions array
- **Solution**: Check `request.state.user` is set correctly

**Issue**: Role inheritance not working
- **Solution**: Ensure roles are loaded and passed to `has_permission()`

**Issue**: Cache not working
- **Solution**: Verify cache is initialized and set as default

**Issue**: "User must be authenticated" error
- **Solution**: Check authentication middleware is running before permission checks

## Next Steps

1. Implement permission management UI in the frontend
2. Add bulk permission assignment
3. Create permission groups for easier management
4. Implement permission analytics and reporting
5. Add time-based permissions (temporary grants)

## Resources

- [Permission System README](../../README.md)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Models](https://docs.pydantic.dev/)
