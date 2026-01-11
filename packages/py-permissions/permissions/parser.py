"""
Permission Parser

Parses and validates dot-notation permission strings.
Supports formats:
- module.action (e.g., "users.create")
- app.module.action (e.g., "app.users.create")
- wildcard permissions (e.g., "users.*", "app.users.*", "app.*")
"""

import re
from typing import List
from .types import ParsedPermission, PermissionValidationResult


PERMISSION_PATTERN = re.compile(r'^[a-z][a-z0-9-]*(\.[a-z0-9*-]+)+$')


def validate_permission_format(permission: str) -> PermissionValidationResult:
    """Validates a permission string format.
    
    Args:
        permission: Permission string to validate
        
    Returns:
        PermissionValidationResult with validation status
    """
    if not permission or not isinstance(permission, str):
        return PermissionValidationResult(
            valid=False,
            error="Permission must be a non-empty string"
        )
    
    # Check that it has at least 2 segments first
    segments = permission.split('.')
    if len(segments) < 2:
        return PermissionValidationResult(
            valid=False,
            error='Permission must have at least 2 segments (e.g., "module.action")'
        )
    
    # Check for consecutive dots
    if '..' in permission:
        return PermissionValidationResult(
            valid=False,
            error="Permission cannot contain consecutive dots"
        )
    
    # Check for invalid wildcard usage
    if '*' in permission:
        if not permission.endswith('*'):
            return PermissionValidationResult(
                valid=False,
                error="Wildcard (*) can only appear at the end of a permission"
            )
        if not permission.endswith('.*'):
            return PermissionValidationResult(
                valid=False,
                error='Wildcard must follow a dot (e.g., "users.*" not "users*")'
            )
    
    # Finally check against the pattern
    if not PERMISSION_PATTERN.match(permission):
        return PermissionValidationResult(
            valid=False,
            error='Permission must follow dot notation format (e.g., "users.create" or "app.users.create"). '
                  'Only lowercase letters, numbers, hyphens, dots, and wildcards are allowed.'
        )
    
    return PermissionValidationResult(valid=True)


def parse_permission(permission: str) -> ParsedPermission:
    """Parses a permission string into its components.
    
    Supports 2+ segment formats:
    - 2 segments: module.action (e.g., "users.create")
    - 3+ segments: app.module.action (e.g., "app.users.create", "my.app.users.create")
    
    For 3+ segments:
    - Last segment is the action
    - Second-to-last segment is the module
    - All preceding segments are joined as the app name
    
    Args:
        permission: Permission string to parse
        
    Returns:
        ParsedPermission object
        
    Raises:
        ValueError: If permission format is invalid
    """
    validation = validate_permission_format(permission)
    if not validation.valid:
        raise ValueError(f"Invalid permission format: {validation.error}")
    
    segments = permission.split('.')
    is_wildcard = permission.endswith('.*')
    
    if len(segments) == 2:
        # Format: module.action or module.*
        parsed = ParsedPermission(
            full=permission,
            module=segments[0],
            action=segments[1],
            is_wildcard=is_wildcard
        )
    else:
        # Format: app.module.action or app.module.* or app.*
        # For 3+ segments: first segment(s) are app, second-to-last is module, last is action
        action = segments[-1]
        module = segments[-2]
        app = '.'.join(segments[:-2]) if len(segments) > 2 else None
        
        parsed = ParsedPermission(
            full=permission,
            app=app if app else None,
            module=module,
            action=action,
            is_wildcard=is_wildcard
        )
    
    if is_wildcard:
        parsed.wildcard_prefix = permission[:-2]  # Remove '.*'
    
    return parsed


def matches_wildcard(permission: str, pattern: str) -> bool:
    """Checks if a permission matches a wildcard pattern.
    
    Args:
        permission: The specific permission to check (e.g., "users.create")
        pattern: The wildcard pattern (e.g., "users.*", "app.users.*", "app.*")
        
    Returns:
        True if the permission matches the pattern
    """
    if not pattern.endswith('.*'):
        return False
    
    prefix = pattern[:-2]  # Remove '.*'
    
    # Exact prefix match or starts with prefix followed by a dot
    return permission == prefix or permission.startswith(prefix + '.')


def is_more_specific(permission1: str, permission2: str) -> bool:
    """Checks if one permission is more specific than another.
    
    Used for permission hierarchy and inheritance.
    
    Args:
        permission1: First permission
        permission2: Second permission
        
    Returns:
        True if permission1 is more specific than permission2
    """
    p1 = parse_permission(permission1)
    p2 = parse_permission(permission2)
    
    # Wildcard permissions are less specific than concrete ones
    if p1.is_wildcard and not p2.is_wildcard:
        return False
    if not p1.is_wildcard and p2.is_wildcard:
        return True
    
    # More segments means more specific
    segments1 = permission1.split('.')
    segments2 = permission2.split('.')
    
    return len(segments1) > len(segments2)


def normalize_permission(permission: str) -> str:
    """Normalizes a permission string by converting to lowercase and trimming.
    
    Args:
        permission: Permission string to normalize
        
    Returns:
        Normalized permission string
    """
    return permission.lower().strip()


def expand_wildcard(wildcard_permission: str, available_actions: List[str]) -> List[str]:
    """Expands wildcard permissions into a list of concrete permissions.
    
    This is useful for UI display and permission auditing.
    
    Args:
        wildcard_permission: A wildcard permission (e.g., "users.*")
        available_actions: List of available actions (e.g., ["create", "read", "update", "delete"])
        
    Returns:
        Array of concrete permissions
    """
    if not wildcard_permission.endswith('.*'):
        return [wildcard_permission]
    
    prefix = wildcard_permission[:-2]  # Remove '.*'
    return [f"{prefix}.{action}" for action in available_actions]
