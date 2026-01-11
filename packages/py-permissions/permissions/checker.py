"""
Permission Checker

Core logic for checking if a user has required permissions.
"""

from typing import List, Optional
from .types import (
    UserPermissionContext,
    PermissionCheckResult,
    PermissionScope,
    Role
)
from .parser import normalize_permission, matches_wildcard
from .rbac import aggregate_permissions_from_roles


def has_permission(
    context: UserPermissionContext,
    required_permission: str,
    scope: PermissionScope = "tenant",
    all_roles: Optional[List[Role]] = None
) -> PermissionCheckResult:
    """Checks if a user has a specific permission.
    
    Args:
        context: User permission context
        required_permission: The permission to check
        scope: Permission scope (tenant, global, or own)
        all_roles: Optional list of all roles for role-based checking
        
    Returns:
        PermissionCheckResult with grant status and details
    """
    normalized = normalize_permission(required_permission)
    
    # Handle 'own' scope - user must be the resource owner
    if scope == "own":
        if not context.resource_owner_id:
            return PermissionCheckResult(
                granted=False,
                reason='Resource owner information not provided for "own" scope check'
            )
        if context.user_id != context.resource_owner_id:
            return PermissionCheckResult(
                granted=False,
                reason="User is not the owner of this resource"
            )
    
    # Aggregate all permissions from roles and direct permissions
    all_permissions = [normalize_permission(p) for p in context.permissions]
    
    if all_roles and context.roles:
        role_permissions = aggregate_permissions_from_roles(context.roles, all_roles)
        all_permissions.extend(normalize_permission(p) for p in role_permissions)
    
    # Remove duplicates
    all_permissions = list(set(all_permissions))
    
    # Check for exact match
    if normalized in all_permissions:
        return PermissionCheckResult(
            granted=True,
            matched_permission=normalized
        )
    
    # Check for wildcard matches
    for user_permission in all_permissions:
        if user_permission.endswith('.*') and matches_wildcard(normalized, user_permission):
            return PermissionCheckResult(
                granted=True,
                matched_permission=user_permission
            )
    
    return PermissionCheckResult(
        granted=False,
        reason=f"User does not have permission: {required_permission}"
    )


def has_any_permission(
    context: UserPermissionContext,
    required_permissions: List[str],
    scope: PermissionScope = "tenant",
    all_roles: Optional[List[Role]] = None
) -> PermissionCheckResult:
    """Checks if a user has any of the specified permissions.
    
    Args:
        context: User permission context
        required_permissions: List of permissions to check
        scope: Permission scope
        all_roles: Optional list of all roles
        
    Returns:
        PermissionCheckResult with grant status
    """
    if not required_permissions:
        return PermissionCheckResult(
            granted=False,
            reason="No permissions specified"
        )
    
    for permission in required_permissions:
        result = has_permission(context, permission, scope, all_roles)
        if result.granted:
            return result
    
    return PermissionCheckResult(
        granted=False,
        reason=f"User does not have any of the required permissions: {', '.join(required_permissions)}"
    )


def has_all_permissions(
    context: UserPermissionContext,
    required_permissions: List[str],
    scope: PermissionScope = "tenant",
    all_roles: Optional[List[Role]] = None
) -> PermissionCheckResult:
    """Checks if a user has all of the specified permissions.
    
    Args:
        context: User permission context
        required_permissions: List of permissions to check
        scope: Permission scope
        all_roles: Optional list of all roles
        
    Returns:
        PermissionCheckResult with grant status
    """
    if not required_permissions:
        return PermissionCheckResult(
            granted=True,
            reason="No permissions required"
        )
    
    missing_permissions = []
    
    for permission in required_permissions:
        result = has_permission(context, permission, scope, all_roles)
        if not result.granted:
            missing_permissions.append(permission)
    
    if missing_permissions:
        return PermissionCheckResult(
            granted=False,
            reason=f"User is missing permissions: {', '.join(missing_permissions)}"
        )
    
    return PermissionCheckResult(
        granted=True,
        matched_permission=', '.join(required_permissions)
    )


def get_user_permissions(
    context: UserPermissionContext,
    all_roles: Optional[List[Role]] = None
) -> List[str]:
    """Gets all permissions for a user (including role-based permissions).
    
    Args:
        context: User permission context
        all_roles: Optional list of all roles
        
    Returns:
        List of all user permissions
    """
    all_permissions = [normalize_permission(p) for p in context.permissions]
    
    if all_roles and context.roles:
        role_permissions = aggregate_permissions_from_roles(context.roles, all_roles)
        all_permissions.extend(normalize_permission(p) for p in role_permissions)
    
    # Remove duplicates and sort
    return sorted(set(all_permissions))


def can_perform_action(
    context: UserPermissionContext,
    resource: str,
    action: str,
    scope: PermissionScope = "tenant",
    all_roles: Optional[List[Role]] = None
) -> PermissionCheckResult:
    """Checks if a user can perform an action on a resource.
    
    Combines permission checking with scope validation.
    
    Args:
        context: User permission context
        resource: Resource name
        action: Action to perform
        scope: Permission scope
        all_roles: Optional list of all roles
        
    Returns:
        PermissionCheckResult with grant status
    """
    permission = f"{resource}.{action}"
    return has_permission(context, permission, scope, all_roles)


def create_permission_context(
    user_id: str,
    tenant_id: str,
    roles: List[str],
    permissions: List[str],
    resource_owner_id: Optional[str] = None
) -> UserPermissionContext:
    """Creates a permission context from user data.
    
    Utility function to construct UserPermissionContext.
    
    Args:
        user_id: User ID
        tenant_id: Tenant ID
        roles: List of user roles
        permissions: List of user permissions
        resource_owner_id: Optional resource owner ID
        
    Returns:
        UserPermissionContext object
    """
    return UserPermissionContext(
        user_id=user_id,
        tenant_id=tenant_id,
        roles=roles,
        permissions=permissions,
        resource_owner_id=resource_owner_id
    )
