"""
Tests for permission checker
"""

import pytest
from permissions.types import UserPermissionContext, Role
from permissions.checker import (
    has_permission,
    has_any_permission,
    has_all_permissions,
    get_user_permissions,
    can_perform_action,
    create_permission_context,
)


@pytest.fixture
def user_context():
    """Create a basic user context for testing."""
    return UserPermissionContext(
        user_id="user-123",
        tenant_id="tenant-456",
        roles=["user"],
        permissions=["users.read", "profile.update"]
    )


@pytest.fixture
def admin_context():
    """Create an admin user context."""
    return UserPermissionContext(
        user_id="admin-123",
        tenant_id="tenant-456",
        roles=["admin"],
        permissions=["users.*", "services.*"]
    )


@pytest.fixture
def roles():
    """Create sample roles for testing."""
    return [
        Role(
            id="role-user",
            name="user",
            display_name="User",
            description="Basic user",
            permissions=["users.read", "profile.update"],
            is_active=True
        ),
        Role(
            id="role-admin",
            name="admin",
            display_name="Admin",
            description="Administrator",
            permissions=["users.*", "services.*"],
            inherits_from=["user"],
            is_active=True
        ),
    ]


class TestHasPermission:
    """Tests for has_permission function."""
    
    def test_has_direct_permission(self, user_context):
        """Test user has direct permission."""
        result = has_permission(user_context, "users.read")
        assert result.granted is True
        assert result.matched_permission == "users.read"
    
    def test_does_not_have_permission(self, user_context):
        """Test user does not have permission."""
        result = has_permission(user_context, "users.delete")
        assert result.granted is False
        assert "does not have permission" in result.reason
    
    def test_has_wildcard_permission(self, admin_context):
        """Test wildcard permission grants access."""
        result = has_permission(admin_context, "users.create")
        assert result.granted is True
        assert result.matched_permission == "users.*"
    
    def test_wildcard_matches_nested(self, admin_context):
        """Test wildcard matches nested permissions."""
        result = has_permission(admin_context, "services.update")
        assert result.granted is True
    
    def test_own_scope_with_matching_owner(self):
        """Test 'own' scope with matching resource owner."""
        context = UserPermissionContext(
            user_id="user-123",
            tenant_id="tenant-456",
            roles=[],
            permissions=["profile.update"],
            resource_owner_id="user-123"
        )
        result = has_permission(context, "profile.update", scope="own")
        assert result.granted is True
    
    def test_own_scope_with_different_owner(self):
        """Test 'own' scope with different resource owner."""
        context = UserPermissionContext(
            user_id="user-123",
            tenant_id="tenant-456",
            roles=[],
            permissions=["profile.update"],
            resource_owner_id="user-456"
        )
        result = has_permission(context, "profile.update", scope="own")
        assert result.granted is False
        assert "not the owner" in result.reason
    
    def test_own_scope_without_resource_owner(self, user_context):
        """Test 'own' scope without resource owner ID."""
        result = has_permission(user_context, "profile.update", scope="own")
        assert result.granted is False
        assert "owner information not provided" in result.reason
    
    def test_permission_with_roles(self, user_context, roles):
        """Test permission check with role aggregation."""
        user_context.roles = ["user"]
        result = has_permission(user_context, "users.read", all_roles=roles)
        assert result.granted is True


class TestHasAnyPermission:
    """Tests for has_any_permission function."""
    
    def test_has_one_of_multiple_permissions(self, user_context):
        """Test user has one of the required permissions."""
        result = has_any_permission(
            user_context,
            ["users.delete", "users.read", "users.update"]
        )
        assert result.granted is True
    
    def test_has_none_of_permissions(self, user_context):
        """Test user has none of the required permissions."""
        result = has_any_permission(
            user_context,
            ["users.delete", "users.create"]
        )
        assert result.granted is False
    
    def test_empty_permissions_list(self, user_context):
        """Test empty permissions list."""
        result = has_any_permission(user_context, [])
        assert result.granted is False
        assert "No permissions specified" in result.reason


class TestHasAllPermissions:
    """Tests for has_all_permissions function."""
    
    def test_has_all_required_permissions(self, user_context):
        """Test user has all required permissions."""
        result = has_all_permissions(
            user_context,
            ["users.read", "profile.update"]
        )
        assert result.granted is True
    
    def test_missing_one_permission(self, user_context):
        """Test user is missing one required permission."""
        result = has_all_permissions(
            user_context,
            ["users.read", "users.delete"]
        )
        assert result.granted is False
        assert "users.delete" in result.reason
    
    def test_empty_permissions_list(self, user_context):
        """Test empty permissions list grants access."""
        result = has_all_permissions(user_context, [])
        assert result.granted is True


class TestGetUserPermissions:
    """Tests for get_user_permissions function."""
    
    def test_get_direct_permissions(self, user_context):
        """Test getting direct permissions."""
        permissions = get_user_permissions(user_context)
        assert "users.read" in permissions
        assert "profile.update" in permissions
    
    def test_get_permissions_with_roles(self, user_context, roles):
        """Test getting permissions including role-based."""
        user_context.roles = ["user"]
        permissions = get_user_permissions(user_context, roles)
        assert "users.read" in permissions
        assert "profile.update" in permissions
    
    def test_permissions_are_sorted(self, user_context):
        """Test returned permissions are sorted."""
        permissions = get_user_permissions(user_context)
        assert permissions == sorted(permissions)


class TestCanPerformAction:
    """Tests for can_perform_action function."""
    
    def test_can_perform_action(self, user_context):
        """Test user can perform action."""
        result = can_perform_action(user_context, "users", "read")
        assert result.granted is True
    
    def test_cannot_perform_action(self, user_context):
        """Test user cannot perform action."""
        result = can_perform_action(user_context, "users", "delete")
        assert result.granted is False


class TestCreatePermissionContext:
    """Tests for create_permission_context function."""
    
    def test_create_context(self):
        """Test creating permission context."""
        context = create_permission_context(
            user_id="user-123",
            tenant_id="tenant-456",
            roles=["user"],
            permissions=["users.read"]
        )
        assert context.user_id == "user-123"
        assert context.tenant_id == "tenant-456"
        assert context.roles == ["user"]
        assert context.permissions == ["users.read"]
    
    def test_create_context_with_resource_owner(self):
        """Test creating context with resource owner."""
        context = create_permission_context(
            user_id="user-123",
            tenant_id="tenant-456",
            roles=[],
            permissions=[],
            resource_owner_id="user-123"
        )
        assert context.resource_owner_id == "user-123"
