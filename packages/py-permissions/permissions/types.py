"""
Type definitions for the permission system

This module provides Pydantic models and type definitions for the dot-notation
permission system with RBAC support.
"""

from typing import Optional, List, Literal, Dict, Any
from pydantic import BaseModel, Field


PermissionScope = Literal["tenant", "global", "own"]
PermissionAction = Literal["create", "read", "update", "delete", "execute", "list"]


class ParsedPermission(BaseModel):
    """A parsed permission object from dot notation.

    Format: app.module.action or module.action

    Examples:
        - "users.create" -> module="users", action="create"
        - "app.users.create" -> app="app", module="users", action="create"
    """

    full: str = Field(..., description="Full permission string (e.g., 'app.users.create')")
    app: Optional[str] = Field(
        None, description="Application/service name (optional first segment)"
    )
    module: str = Field(..., description="Module/resource name")
    action: str = Field(..., description="Action to perform")
    is_wildcard: bool = Field(..., description="Whether this is a wildcard permission")
    wildcard_prefix: Optional[str] = Field(
        None, description="The wildcard level (e.g., 'app.*', 'app.users.*')"
    )


class Role(BaseModel):
    """Role definition with permissions and inheritance support."""

    id: str = Field(..., description="Unique role identifier")
    name: str = Field(..., description="Role name (e.g., 'admin', 'user', 'manager')")
    display_name: str = Field(..., description="Human-readable display name")
    description: str = Field(..., description="Role description")
    permissions: List[str] = Field(
        default_factory=list, description="Permissions granted to this role"
    )
    inherits_from: Optional[List[str]] = Field(
        None, description="Parent roles to inherit permissions from"
    )
    is_active: bool = Field(True, description="Whether this role is active")
    tenant_id: Optional[str] = Field(None, description="Tenant ID for tenant-specific roles")


class UserPermissionContext(BaseModel):
    """User context for permission checking."""

    user_id: str = Field(..., description="User ID")
    tenant_id: str = Field(..., description="Tenant ID")
    roles: List[str] = Field(default_factory=list, description="User roles")
    permissions: List[str] = Field(default_factory=list, description="Direct user permissions")
    resource_owner_id: Optional[str] = Field(
        None, description="Resource owner ID (for 'own' scope checks)"
    )


class PermissionCheckResult(BaseModel):
    """Permission check result."""

    granted: bool = Field(..., description="Whether the permission check passed")
    reason: Optional[str] = Field(None, description="Reason for the result")
    matched_permission: Optional[str] = Field(
        None, description="Matching permission that granted access"
    )


class PermissionValidationResult(BaseModel):
    """Permission validation result."""

    valid: bool = Field(..., description="Whether the permission format is valid")
    error: Optional[str] = Field(None, description="Error message if invalid")


class ScopedPermission(BaseModel):
    """Permission with scope information."""

    name: str = Field(..., description="Permission name (e.g., 'users.create')")
    scope: PermissionScope = Field(default="tenant", description="Permission scope")


class User(BaseModel):
    """User model with scoped permissions."""

    id: str = Field(..., description="User ID")
    permissions: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="User permissions with scope (e.g., [{'name': 'users.*', 'scope': 'global'}])",
    )


class TenantUser(BaseModel):
    """TenantUser model representing user-tenant relationship."""

    user_id: str = Field(..., description="User ID")
    tenant_id: str = Field(..., description="Tenant ID")
    permissions: List[str] = Field(default_factory=list, description="Tenant-specific permissions")
    roles: List[str] = Field(default_factory=list, description="Tenant-specific roles")
