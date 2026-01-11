"""
FastAPI Middleware for Permission Checking

Provides dependency injection and decorators to protect routes with permission requirements.
"""

from typing import List, Optional, Callable, Any
from fastapi import HTTPException, status, Depends, Request
from functools import wraps

from .types import UserPermissionContext, PermissionScope, Role
from .checker import (
    has_permission,
    has_any_permission,
    has_all_permissions
)


class PermissionMiddlewareOptions:
    """Options for permission middleware."""
    
    def __init__(
        self,
        scope: PermissionScope = "tenant",
        error_message: Optional[str] = None,
        error_status: int = status.HTTP_403_FORBIDDEN,
        get_resource_owner_id: Optional[Callable[[Request], Optional[str]]] = None
    ):
        self.scope = scope
        self.error_message = error_message
        self.error_status = error_status
        self.get_resource_owner_id = get_resource_owner_id


async def get_current_user(request: Request) -> UserPermissionContext:
    """Dependency to get the current authenticated user from request state.
    
    This should be set by your authentication middleware.
    Expected to be in request.state.user as a dict with:
    - user_id: str
    - tenant_id: str
    - roles: List[str]
    - permissions: List[str]
    - resource_owner_id: Optional[str]
    
    Returns:
        UserPermissionContext for the current user
        
    Raises:
        HTTPException: If user is not authenticated
    """
    if not hasattr(request.state, "user") or not request.state.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User must be authenticated"
        )
    
    user_data = request.state.user
    return UserPermissionContext(
        user_id=user_data.get("user_id") or user_data.get("userId"),
        tenant_id=user_data.get("tenant_id") or user_data.get("tenantId"),
        roles=user_data.get("roles", []),
        permissions=user_data.get("permissions", []),
        resource_owner_id=user_data.get("resource_owner_id") or user_data.get("resourceOwnerId")
    )


async def get_all_roles(request: Request) -> Optional[List[Role]]:
    """Dependency to get all roles from request state.
    
    This can be set by your application if you want to support role-based checking.
    Expected to be in request.state.roles as a list of Role objects or dicts.
    
    Returns:
        Optional list of Role objects
    """
    if not hasattr(request.state, "roles") or not request.state.roles:
        return None
    
    roles = request.state.roles
    if not roles:
        return None
    
    # Convert dicts to Role objects if necessary
    if isinstance(roles[0], dict):
        return [Role(**role) for role in roles]
    
    return roles


def require_permission(
    permission: str,
    scope: PermissionScope = "tenant",
    error_message: Optional[str] = None,
    get_resource_owner_id: Optional[Callable[[Request], Optional[str]]] = None
) -> Callable:
    """Dependency to require a specific permission.
    
    Usage:
        @router.post("/users")
        async def create_user(
            user: User,
            _: None = Depends(require_permission("users.create"))
        ):
            ...
    
    Or use as a decorator with check_permission:
        @router.put("/users/{user_id}")
        @check_permission("users.update", scope="own")
        async def update_user(user_id: str, ...):
            ...
    
    Args:
        permission: The required permission
        scope: Permission scope
        error_message: Custom error message
        get_resource_owner_id: Function to extract resource owner ID from request
        
    Returns:
        Dependency function for FastAPI
    """
    async def permission_checker(
        request: Request,
        current_user: UserPermissionContext = Depends(get_current_user),
        all_roles: Optional[List[Role]] = Depends(get_all_roles)
    ) -> None:
        # Create context with resource owner if needed
        context = current_user.copy()
        if get_resource_owner_id:
            context.resource_owner_id = get_resource_owner_id(request)
        
        # Check permission
        result = has_permission(context, permission, scope, all_roles)
        
        if not result.granted:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "Forbidden",
                    "message": error_message or result.reason,
                    "required": permission
                }
            )
    
    return permission_checker


def require_any_permission(
    permissions: List[str],
    scope: PermissionScope = "tenant",
    error_message: Optional[str] = None,
    get_resource_owner_id: Optional[Callable[[Request], Optional[str]]] = None
) -> Callable:
    """Dependency to require any of the specified permissions.
    
    Usage:
        @router.get("/users")
        async def get_users(
            _: None = Depends(require_any_permission(["users.read", "users.list"]))
        ):
            ...
    
    Args:
        permissions: List of acceptable permissions
        scope: Permission scope
        error_message: Custom error message
        get_resource_owner_id: Function to extract resource owner ID from request
        
    Returns:
        Dependency function for FastAPI
    """
    async def permission_checker(
        request: Request,
        current_user: UserPermissionContext = Depends(get_current_user),
        all_roles: Optional[List[Role]] = Depends(get_all_roles)
    ) -> None:
        context = current_user.copy()
        if get_resource_owner_id:
            context.resource_owner_id = get_resource_owner_id(request)
        
        result = has_any_permission(context, permissions, scope, all_roles)
        
        if not result.granted:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "Forbidden",
                    "message": error_message or result.reason,
                    "required": permissions
                }
            )
    
    return permission_checker


def require_all_permissions(
    permissions: List[str],
    scope: PermissionScope = "tenant",
    error_message: Optional[str] = None,
    get_resource_owner_id: Optional[Callable[[Request], Optional[str]]] = None
) -> Callable:
    """Dependency to require all of the specified permissions.
    
    Usage:
        @router.delete("/users/{user_id}")
        async def delete_user(
            user_id: str,
            _: None = Depends(require_all_permissions(["users.delete", "audit.create"]))
        ):
            ...
    
    Args:
        permissions: List of required permissions
        scope: Permission scope
        error_message: Custom error message
        get_resource_owner_id: Function to extract resource owner ID from request
        
    Returns:
        Dependency function for FastAPI
    """
    async def permission_checker(
        request: Request,
        current_user: UserPermissionContext = Depends(get_current_user),
        all_roles: Optional[List[Role]] = Depends(get_all_roles)
    ) -> None:
        context = current_user.copy()
        if get_resource_owner_id:
            context.resource_owner_id = get_resource_owner_id(request)
        
        result = has_all_permissions(context, permissions, scope, all_roles)
        
        if not result.granted:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "Forbidden",
                    "message": error_message or result.reason,
                    "required": permissions
                }
            )
    
    return permission_checker


def require_role(role_name: str) -> Callable:
    """Dependency to check if user has a specific role.
    
    Usage:
        @router.get("/admin")
        async def admin_dashboard(
            _: None = Depends(require_role("admin"))
        ):
            ...
    
    Args:
        role_name: The required role name
        
    Returns:
        Dependency function for FastAPI
    """
    async def role_checker(
        current_user: UserPermissionContext = Depends(get_current_user)
    ) -> None:
        if role_name not in current_user.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "Forbidden",
                    "message": f"User must have role: {role_name}",
                    "required": role_name
                }
            )
    
    return role_checker


def require_any_role(role_names: List[str]) -> Callable:
    """Dependency to check if user has any of the specified roles.
    
    Usage:
        @router.get("/dashboard")
        async def dashboard(
            _: None = Depends(require_any_role(["admin", "manager"]))
        ):
            ...
    
    Args:
        role_names: List of acceptable role names
        
    Returns:
        Dependency function for FastAPI
    """
    async def role_checker(
        current_user: UserPermissionContext = Depends(get_current_user)
    ) -> None:
        has_role = any(role in current_user.roles for role in role_names)
        if not has_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "Forbidden",
                    "message": f"User must have one of the roles: {', '.join(role_names)}",
                    "required": role_names
                }
            )
    
    return role_checker


def check_permission(
    permission: str,
    scope: PermissionScope = "tenant",
    error_message: Optional[str] = None,
    get_resource_owner_id: Optional[Callable[[Request], Optional[str]]] = None
):
    """Decorator to check permissions on route handlers.
    
    This is a convenience wrapper around require_permission for cleaner syntax.
    
    Usage:
        @router.post("/users")
        @check_permission("users.create")
        async def create_user(user: User):
            ...
        
        @router.put("/users/{user_id}")
        @check_permission("users.update", scope="own", 
                         get_resource_owner_id=lambda req: req.path_params.get("user_id"))
        async def update_user(user_id: str, user: User):
            ...
    
    Args:
        permission: The required permission
        scope: Permission scope
        error_message: Custom error message
        get_resource_owner_id: Function to extract resource owner ID from request
    
    Returns:
        Decorator function
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # The actual permission check is done via Depends in the route
            # This decorator just adds metadata and ensures the dependency is included
            return await func(*args, **kwargs)
        
        # Store permission metadata on the function
        wrapper.__permission__ = permission
        wrapper.__permission_scope__ = scope
        
        return wrapper
    
    return decorator


def admin_override(admin_roles: List[str] = None) -> Callable:
    """Decorator to allow admin roles to bypass permission checks.
    
    Usage:
        @router.delete("/critical-resource")
        @admin_override(["super_admin", "system_admin"])
        @check_permission("resources.delete")
        async def delete_critical_resource():
            ...
    
    Args:
        admin_roles: List of role names that can bypass checks (default: ["admin", "super_admin"])
    
    Returns:
        Decorator function
    """
    if admin_roles is None:
        admin_roles = ["admin", "super_admin"]
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Try to get current user from kwargs (injected by FastAPI)
            request = kwargs.get("request")
            if request and hasattr(request.state, "user"):
                user_roles = request.state.user.get("roles", [])
                if any(role in admin_roles for role in user_roles):
                    # Admin override - skip permission check
                    return await func(*args, **kwargs)
            
            # Otherwise, proceed with normal permission check
            return await func(*args, **kwargs)
        
        return wrapper
    
    return decorator
