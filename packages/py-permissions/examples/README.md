# Permission System Examples

This directory contains example applications demonstrating how to use the permission system.

## Quick Example

Here's a minimal FastAPI application showing the key concepts:

```python
from fastapi import FastAPI, Depends
from permissions import require_permission, require_role, get_current_user

app = FastAPI()

# 1. Protect route with a single permission
@app.post("/users")
async def create_user(
    user: dict,
    current_user: dict = Depends(get_current_user),
    _: None = Depends(require_permission("users.create"))
):
    return {"message": "User created"}

# 2. Protect route with role requirement
@app.get("/admin")
async def admin_panel(
    current_user: dict = Depends(get_current_user),
    _: None = Depends(require_role("admin"))
):
    return {"message": "Admin panel"}

# 3. Check permissions programmatically
@app.get("/check")
async def check_perm(
    permission: str,
    current_user: dict = Depends(get_current_user)
):
    from permissions import has_permission, create_permission_context
    
    context = create_permission_context(
        user_id=current_user["user_id"],
        tenant_id=current_user["tenant_id"],
        roles=current_user["roles"],
        permissions=current_user["permissions"]
    )
    
    result = has_permission(context, permission)
    return {"granted": result.granted}
```

## Setting Up Authentication

Your authentication middleware should set `request.state.user`:

```python
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Extract and verify JWT token
        token = request.headers.get("Authorization")
        user_data = verify_jwt_token(token)  # Your JWT verification
        
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

## Example Scenarios

### 1. Basic CRUD Operations

```python
from fastapi import APIRouter, Depends
from permissions import require_permission, require_any_permission

router = APIRouter(prefix="/users")

@router.post("")
async def create(
    _: None = Depends(require_permission("users.create"))
):
    return {"message": "Created"}

@router.get("")
async def list_all(
    _: None = Depends(require_any_permission(["users.read", "users.list"]))
):
    return {"users": []}

@router.put("/{id}")
async def update(
    id: str,
    _: None = Depends(require_permission("users.update"))
):
    return {"message": "Updated"}

@router.delete("/{id}")
async def delete(
    id: str,
    _: None = Depends(require_permission("users.delete"))
):
    return {"message": "Deleted"}
```

### 2. Own Scope - Users Can Only Edit Their Own Data

```python
@router.put("/profile")
async def update_profile(
    request: Request,
    profile: dict,
    _: None = Depends(require_permission(
        "profile.update",
        scope="own",
        get_resource_owner_id=lambda req: req.state.user["user_id"]
    ))
):
    return {"message": "Profile updated"}
```

### 3. Multiple Permission Requirements

```python
from permissions import require_all_permissions

@router.delete("/critical/{id}")
async def delete_critical(
    id: str,
    _: None = Depends(require_all_permissions([
        "critical.delete",
        "audit.create"
    ]))
):
    # Requires BOTH permissions
    return {"message": "Deleted with audit"}
```

### 4. Role-Based Access

```python
from permissions import require_role, require_any_role

@router.get("/admin-only")
async def admin_endpoint(
    _: None = Depends(require_role("admin"))
):
    return {"message": "Admin only"}

@router.get("/managers")
async def manager_endpoint(
    _: None = Depends(require_any_role(["admin", "manager"]))
):
    return {"message": "For admins and managers"}
```

### 5. Admin Override

```python
from permissions import admin_override, check_permission

@router.delete("/system/reset")
@admin_override(["super_admin"])
@check_permission("system.reset")
async def reset_system(request: Request):
    # super_admin can bypass the permission check
    return {"message": "System reset"}
```

### 6. Programmatic Permission Checks

```python
from permissions import has_permission, create_permission_context

async def my_business_logic(user_id: str, action: str):
    # Get user data from database
    user = await db.get_user(user_id)
    
    # Create permission context
    context = create_permission_context(
        user_id=user["id"],
        tenant_id=user["tenantId"],
        roles=user["roles"],
        permissions=user["permissions"]
    )
    
    # Check permission
    result = has_permission(context, f"resource.{action}")
    
    if not result.granted:
        raise HTTPException(status_code=403, detail=result.reason)
    
    # Proceed with the action
    await perform_action(action)
```

### 7. With Role Inheritance

```python
from permissions import Role, get_effective_permissions

# Define roles
roles = [
    Role(
        id="role-user",
        name="user",
        display_name="User",
        permissions=["users.read", "profile.update"],
        is_active=True
    ),
    Role(
        id="role-admin",
        name="admin",
        display_name="Admin",
        permissions=["users.*", "services.*"],
        inherits_from=["user"],  # Inherits permissions from user role
        is_active=True
    ),
]

# Get all permissions for a user with admin role
permissions = get_effective_permissions(["admin"], roles)
# Returns: ["users.read", "profile.update", "users.*", "services.*"]
```

## Test Users for Development

```python
TEST_USERS = {
    "user@example.com": {
        "id": "user-123",
        "tenant_id": "tenant-456",
        "roles": ["user"],
        "permissions": ["users.read", "profile.update"]
    },
    "admin@example.com": {
        "id": "admin-789",
        "tenant_id": "tenant-456",
        "roles": ["admin"],
        "permissions": ["users.*", "services.*"]
    }
}
```

## Common Permission Patterns

```python
# CRUD operations
"users.create"
"users.read"
"users.update"
"users.delete"
"users.list"

# Admin operations (wildcards)
"users.*"          # All user operations
"services.*"       # All service operations
"admin.*"          # All admin operations

# Specific operations
"api-keys.create"
"api-keys.revoke"
"reports.generate"
"reports.export"
"audit-logs.read"
"settings.update"

# Application-scoped
"app.users.create"
"app.services.read"
"app.*"            # All operations in app
```

## Testing

```python
import pytest
from fastapi.testclient import TestClient

def test_create_user_with_permission():
    """Test creating user with proper permissions."""
    token = create_test_token(permissions=["users.create"])
    
    response = client.post(
        "/users",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Test User"}
    )
    
    assert response.status_code == 200

def test_create_user_without_permission():
    """Test creating user without permissions fails."""
    token = create_test_token(permissions=["users.read"])
    
    response = client.post(
        "/users",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Test User"}
    )
    
    assert response.status_code == 403
    assert "Forbidden" in response.json()["error"]
```

## Running Examples

To run a full example application:

1. Install dependencies:
   ```bash
   pip install fastapi uvicorn python-jose[cryptography]
   ```

2. Create your FastAPI app following the patterns above

3. Run the server:
   ```bash
   uvicorn your_app:app --reload
   ```

4. Visit `http://localhost:8000/docs` for interactive API documentation

## Integration with Auth Service

For complete integration with the auth-service, see:
- [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md) - Complete integration guide
- [README.md](../README.md) - Full documentation and API reference
