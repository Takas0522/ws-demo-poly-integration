"""
Python Permission System with RBAC

A comprehensive dot-notation permission system with role-based access control (RBAC)
for FastAPI applications.

This package provides:
- Dot-notation permission format (e.g., "users.create", "app.users.*")
- Role-based access control with inheritance
- Permission scopes (tenant, global, own)
- FastAPI middleware and decorators
- Permission caching (in-memory and Redis support)
- Admin override functionality

Example usage:
    from permissions import require_permission, check_permission, Role
    from fastapi import FastAPI, Depends
    
    app = FastAPI()
    
    # Using dependency injection
    @app.post("/users")
    async def create_user(
        user: User,
        _: None = Depends(require_permission("users.create"))
    ):
        ...
    
    # Using decorator
    @app.put("/users/{user_id}")
    @check_permission("users.update", scope="own")
    async def update_user(user_id: str, user: User):
        ...
"""

from .types import (
    PermissionScope,
    PermissionAction,
    ParsedPermission,
    Role,
    UserPermissionContext,
    PermissionCheckResult,
    PermissionValidationResult,
    ScopedPermission,
    User,
    TenantUser,
)

from .parser import (
    validate_permission_format,
    parse_permission,
    matches_wildcard,
    is_more_specific,
    normalize_permission,
    expand_wildcard,
)

from .rbac import (
    aggregate_role_permissions,
    aggregate_permissions_from_roles,
    validate_role_inheritance,
    get_child_roles,
    get_parent_roles,
    build_role_hierarchy,
    role_has_permission,
    get_effective_permissions,
    RoleNode,
    ValidationResult,
)

from .checker import (
    has_permission,
    has_any_permission,
    has_all_permissions,
    get_user_permissions,
    can_perform_action,
    create_permission_context,
)

from .middleware import (
    PermissionMiddlewareOptions,
    get_current_user,
    get_all_roles,
    require_permission,
    require_any_permission,
    require_all_permissions,
    require_role,
    require_any_role,
    check_permission,
    admin_override,
)

from .cache import (
    PermissionCache,
    InMemoryCache,
    RedisCache,
    CachedPermissionChecker,
    get_default_cache,
    get_default_cached_checker,
    set_default_cache,
)

from .advanced_checker import (
    PermissionChecker,
    invalidate_permission_cache,
)

__version__ = "1.0.0"

__all__ = [
    # Types
    "PermissionScope",
    "PermissionAction",
    "ParsedPermission",
    "Role",
    "UserPermissionContext",
    "PermissionCheckResult",
    "PermissionValidationResult",
    "ScopedPermission",
    "User",
    "TenantUser",
    
    # Parser
    "validate_permission_format",
    "parse_permission",
    "matches_wildcard",
    "is_more_specific",
    "normalize_permission",
    "expand_wildcard",
    
    # RBAC
    "aggregate_role_permissions",
    "aggregate_permissions_from_roles",
    "validate_role_inheritance",
    "get_child_roles",
    "get_parent_roles",
    "build_role_hierarchy",
    "role_has_permission",
    "get_effective_permissions",
    "RoleNode",
    "ValidationResult",
    
    # Checker
    "has_permission",
    "has_any_permission",
    "has_all_permissions",
    "get_user_permissions",
    "can_perform_action",
    "create_permission_context",
    
    # Advanced Checker
    "PermissionChecker",
    "invalidate_permission_cache",
    
    # Middleware
    "PermissionMiddlewareOptions",
    "get_current_user",
    "get_all_roles",
    "require_permission",
    "require_any_permission",
    "require_all_permissions",
    "require_role",
    "require_any_role",
    "check_permission",
    "admin_override",
    
    # Cache
    "PermissionCache",
    "InMemoryCache",
    "RedisCache",
    "CachedPermissionChecker",
    "get_default_cache",
    "get_default_cached_checker",
    "set_default_cache",
]
