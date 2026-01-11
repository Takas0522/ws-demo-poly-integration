"""
Role-Based Access Control (RBAC) System

Provides role management, permission aggregation, and role inheritance.
"""

from typing import List, Set, Dict, Optional
from .types import Role
from .parser import normalize_permission


def aggregate_role_permissions(
    role: Role,
    all_roles: List[Role],
    visited: Optional[Set[str]] = None
) -> List[str]:
    """Aggregates all permissions from a role and its inherited roles.
    
    Handles circular dependencies and deduplication.
    
    Args:
        role: The role to aggregate permissions for
        all_roles: List of all available roles
        visited: Set of already visited role IDs (for circular detection)
        
    Returns:
        List of all permissions including inherited ones
    """
    if visited is None:
        visited = set()
    
    # Prevent infinite loops from circular inheritance
    if role.id in visited:
        return []
    visited.add(role.id)
    
    # Start with direct permissions
    permissions = set(normalize_permission(p) for p in role.permissions)
    
    # Add permissions from inherited roles
    if role.inherits_from:
        for parent_role_id in role.inherits_from:
            parent_role = next(
                (r for r in all_roles if r.id == parent_role_id or r.name == parent_role_id),
                None
            )
            if parent_role and parent_role.is_active:
                parent_permissions = aggregate_role_permissions(parent_role, all_roles, visited.copy())
                permissions.update(parent_permissions)
    
    return list(permissions)


def aggregate_permissions_from_roles(
    role_names: List[str],
    all_roles: List[Role]
) -> List[str]:
    """Aggregates permissions from multiple roles.
    
    Args:
        role_names: List of role names or IDs
        all_roles: List of all available roles
        
    Returns:
        List of all permissions from all roles
    """
    all_permissions = set()
    
    for role_name in role_names:
        role = next(
            (r for r in all_roles if r.name == role_name or r.id == role_name),
            None
        )
        if role and role.is_active:
            role_permissions = aggregate_role_permissions(role, all_roles)
            all_permissions.update(role_permissions)
    
    return list(all_permissions)


class ValidationResult:
    """Result of role inheritance validation."""
    
    def __init__(self, valid: bool, error: Optional[str] = None, circular_path: Optional[List[str]] = None):
        self.valid = valid
        self.error = error
        self.circular_path = circular_path


def validate_role_inheritance(
    role: Role,
    all_roles: List[Role],
    visited: Optional[Set[str]] = None,
    path: Optional[List[str]] = None
) -> ValidationResult:
    """Validates role inheritance to detect circular dependencies.
    
    Args:
        role: The role to validate
        all_roles: List of all available roles
        visited: Set of already visited role IDs
        path: Current path of role names
        
    Returns:
        ValidationResult with validation status
    """
    if visited is None:
        visited = set()
    if path is None:
        path = []
    
    if role.id in visited:
        return ValidationResult(
            valid=False,
            error="Circular role inheritance detected",
            circular_path=path + [role.name]
        )
    
    visited.add(role.id)
    path.append(role.name)
    
    if role.inherits_from:
        for parent_role_id in role.inherits_from:
            parent_role = next(
                (r for r in all_roles if r.id == parent_role_id or r.name == parent_role_id),
                None
            )
            
            if not parent_role:
                return ValidationResult(
                    valid=False,
                    error=f"Parent role '{parent_role_id}' not found"
                )
            
            validation = validate_role_inheritance(
                parent_role,
                all_roles,
                visited.copy(),
                path.copy()
            )
            
            if not validation.valid:
                return validation
    
    return ValidationResult(valid=True)


def get_child_roles(
    role_name: str,
    all_roles: List[Role],
    visited: Optional[Set[str]] = None
) -> List[Role]:
    """Gets all roles that inherit from a given role (directly or indirectly).
    
    Args:
        role_name: Name of the parent role
        all_roles: List of all available roles
        visited: Set of already visited role names
        
    Returns:
        List of child roles
    """
    if visited is None:
        visited = set()
    
    # Prevent infinite loops
    if role_name in visited:
        return []
    visited.add(role_name)
    
    children = []
    
    for role in all_roles:
        if role.inherits_from and role_name in role.inherits_from:
            children.append(role)
            # Recursively get children of this role
            children.extend(get_child_roles(role.name, all_roles, visited.copy()))
    
    # Remove duplicates by role ID
    seen = set()
    unique_children = []
    for role in children:
        if role.id not in seen:
            seen.add(role.id)
            unique_children.append(role)
    
    return unique_children


def get_parent_roles(
    role_name: str,
    all_roles: List[Role],
    visited: Optional[Set[str]] = None
) -> List[Role]:
    """Gets all parent roles of a given role (directly or indirectly).
    
    Args:
        role_name: Name of the child role
        all_roles: List of all available roles
        visited: Set of already visited role names
        
    Returns:
        List of parent roles
    """
    if visited is None:
        visited = set()
    
    # Prevent infinite loops
    if role_name in visited:
        return []
    visited.add(role_name)
    
    role = next(
        (r for r in all_roles if r.name == role_name or r.id == role_name),
        None
    )
    
    if not role or not role.inherits_from:
        return []
    
    parents = []
    for parent_role_id in role.inherits_from:
        parent_role = next(
            (r for r in all_roles if r.id == parent_role_id or r.name == parent_role_id),
            None
        )
        if parent_role:
            parents.append(parent_role)
            # Recursively get parents of this parent role
            parents.extend(get_parent_roles(parent_role.name, all_roles, visited.copy()))
    
    # Remove duplicates by role ID
    seen = set()
    unique_parents = []
    for role in parents:
        if role.id not in seen:
            seen.add(role.id)
            unique_parents.append(role)
    
    return unique_parents


class RoleNode:
    """Node in a role hierarchy tree for visualization."""
    
    def __init__(self, role: Role, children: List['RoleNode'], depth: int):
        self.role = role
        self.children = children
        self.depth = depth


def build_role_hierarchy(all_roles: List[Role]) -> List[RoleNode]:
    """Creates a role hierarchy tree for visualization.
    
    Args:
        all_roles: List of all available roles
        
    Returns:
        List of root RoleNode objects
    """
    # Find root roles (roles with no parents)
    root_roles = [
        role for role in all_roles
        if not role.inherits_from or len(role.inherits_from) == 0
    ]
    
    def build_node(role: Role, depth: int) -> RoleNode:
        children_roles = [
            r for r in all_roles
            if r.inherits_from and role.name in r.inherits_from
        ]
        children = [build_node(child, depth + 1) for child in children_roles]
        
        return RoleNode(role=role, children=children, depth=depth)
    
    return [build_node(role, 0) for role in root_roles]


def role_has_permission(
    role_name: str,
    permission: str,
    all_roles: List[Role]
) -> bool:
    """Checks if a role has a specific permission (including inherited permissions).
    
    Args:
        role_name: Name or ID of the role
        permission: Permission to check
        all_roles: List of all available roles
        
    Returns:
        True if the role has the permission
    """
    role = next(
        (r for r in all_roles if r.name == role_name or r.id == role_name),
        None
    )
    
    if not role or not role.is_active:
        return False
    
    all_permissions = aggregate_role_permissions(role, all_roles)
    return normalize_permission(permission) in all_permissions


def get_effective_permissions(
    role_names: List[str],
    all_roles: List[Role]
) -> List[str]:
    """Gets the effective permissions for a set of roles.
    
    This is the final set of permissions a user with these roles would have.
    
    Args:
        role_names: List of role names or IDs
        all_roles: List of all available roles
        
    Returns:
        List of effective permissions
    """
    return aggregate_permissions_from_roles(role_names, all_roles)
