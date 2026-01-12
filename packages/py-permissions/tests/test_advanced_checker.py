"""
Tests for advanced permission checker with global priority logic and Redis caching
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import json

from permissions.types import User, TenantUser
from permissions.advanced_checker import PermissionChecker, invalidate_permission_cache


@pytest.fixture
def user_with_global_perms():
    """Create a user with global permissions."""
    return User(
        id="user-123",
        permissions=[
            {"name": "users.*", "scope": "global"},
            {"name": "tenants.read", "scope": "global"}
        ]
    )


@pytest.fixture
def user_with_tenant_perms():
    """Create a user with only tenant permissions."""
    return User(
        id="user-456",
        permissions=[
            {"name": "users.read", "scope": "tenant"}
        ]
    )


@pytest.fixture
def user_with_mixed_perms():
    """Create a user with both global and tenant permissions."""
    return User(
        id="user-789",
        permissions=[
            {"name": "users.create", "scope": "global"},
            {"name": "posts.read", "scope": "tenant"}
        ]
    )


@pytest.fixture
def mock_redis():
    """Create a mock Redis client."""
    mock = Mock()
    mock.get = Mock(return_value=None)
    mock.setex = Mock()
    mock.delete = Mock()
    mock.keys = Mock(return_value=[])
    return mock


@pytest.fixture
def tenant_user_data():
    """Create sample tenant user data."""
    return {
        "user_id": "user-456",
        "tenant_id": "tenant-abc",
        "permissions": ["users.read", "users.update", "posts.*"],
        "roles": ["editor"]
    }


class TestPermissionCheckerGlobalPriority:
    """Tests for global permission priority logic."""
    
    @pytest.mark.asyncio
    async def test_global_wildcard_permission_granted(self, user_with_global_perms):
        """Test that global wildcard permission grants access."""
        checker = PermissionChecker(user_with_global_perms, "tenant-abc")
        
        assert await checker.has_permission("users.create") is True
        assert await checker.has_permission("users.delete") is True
        assert await checker.has_permission("users.update") is True
    
    @pytest.mark.asyncio
    async def test_global_specific_permission_granted(self, user_with_global_perms):
        """Test that specific global permission grants access."""
        checker = PermissionChecker(user_with_global_perms, "tenant-abc")
        
        assert await checker.has_permission("tenants.read") is True
    
    @pytest.mark.asyncio
    async def test_global_permission_denied(self, user_with_global_perms):
        """Test that missing global permission denies access."""
        checker = PermissionChecker(user_with_global_perms, "tenant-abc")
        
        assert await checker.has_permission("services.create") is False
    
    @pytest.mark.asyncio
    async def test_global_all_wildcard(self):
        """Test that global '*' permission grants all access."""
        user = User(
            id="admin-123",
            permissions=[{"name": "*", "scope": "global"}]
        )
        checker = PermissionChecker(user, "tenant-abc")
        
        assert await checker.has_permission("users.create") is True
        assert await checker.has_permission("anything.delete") is True
        assert await checker.has_permission("service.admin.execute") is True


class TestPermissionCheckerTenantPermissions:
    """Tests for tenant-specific permission checking."""
    
    @pytest.mark.asyncio
    async def test_tenant_permission_with_db_lookup(self, user_with_tenant_perms, tenant_user_data):
        """Test tenant permission check with database lookup."""
        async def mock_get_tenant_user(user_id, tenant_id):
            return tenant_user_data
        
        checker = PermissionChecker(
            user_with_tenant_perms,
            "tenant-abc",
            get_tenant_user_from_db=mock_get_tenant_user
        )
        
        assert await checker.has_permission("users.read") is True
        assert await checker.has_permission("users.update") is True
    
    @pytest.mark.asyncio
    async def test_tenant_wildcard_permission(self, user_with_tenant_perms, tenant_user_data):
        """Test tenant wildcard permission."""
        async def mock_get_tenant_user(user_id, tenant_id):
            return tenant_user_data
        
        checker = PermissionChecker(
            user_with_tenant_perms,
            "tenant-abc",
            get_tenant_user_from_db=mock_get_tenant_user
        )
        
        assert await checker.has_permission("posts.create") is True
        assert await checker.has_permission("posts.delete") is True
        assert await checker.has_permission("posts.update") is True
    
    @pytest.mark.asyncio
    async def test_tenant_permission_denied(self, user_with_tenant_perms, tenant_user_data):
        """Test that missing tenant permission denies access."""
        async def mock_get_tenant_user(user_id, tenant_id):
            return tenant_user_data
        
        checker = PermissionChecker(
            user_with_tenant_perms,
            "tenant-abc",
            get_tenant_user_from_db=mock_get_tenant_user
        )
        
        assert await checker.has_permission("services.create") is False
    
    @pytest.mark.asyncio
    async def test_no_tenant_user_found(self, user_with_tenant_perms):
        """Test when tenant user is not found in database."""
        async def mock_get_tenant_user(user_id, tenant_id):
            return None
        
        checker = PermissionChecker(
            user_with_tenant_perms,
            "tenant-abc",
            get_tenant_user_from_db=mock_get_tenant_user
        )
        
        assert await checker.has_permission("users.read") is False


class TestPermissionCheckerPriorityLogic:
    """Tests for permission priority: global > tenant > deny."""
    
    @pytest.mark.asyncio
    async def test_global_permission_overrides_tenant(self, user_with_mixed_perms):
        """Test that global permission takes priority over tenant."""
        async def mock_get_tenant_user(user_id, tenant_id):
            return {
                "user_id": "user-789",
                "tenant_id": "tenant-abc",
                "permissions": ["users.delete"],  # Different from global
                "roles": []
            }
        
        checker = PermissionChecker(
            user_with_mixed_perms,
            "tenant-abc",
            get_tenant_user_from_db=mock_get_tenant_user
        )
        
        # Global permission should be checked first
        assert await checker.has_permission("users.create") is True
    
    @pytest.mark.asyncio
    async def test_tenant_permission_when_no_global(self, user_with_mixed_perms):
        """Test that tenant permission is checked when no global match."""
        async def mock_get_tenant_user(user_id, tenant_id):
            return {
                "user_id": "user-789",
                "tenant_id": "tenant-abc",
                "permissions": ["reports.read"],
                "roles": []
            }
        
        checker = PermissionChecker(
            user_with_mixed_perms,
            "tenant-abc",
            get_tenant_user_from_db=mock_get_tenant_user
        )
        
        # Should fall through to tenant permissions
        assert await checker.has_permission("reports.read") is True
    
    @pytest.mark.asyncio
    async def test_deny_when_no_permissions_match(self, user_with_mixed_perms):
        """Test default deny when neither global nor tenant match."""
        async def mock_get_tenant_user(user_id, tenant_id):
            return {
                "user_id": "user-789",
                "tenant_id": "tenant-abc",
                "permissions": ["reports.read"],
                "roles": []
            }
        
        checker = PermissionChecker(
            user_with_mixed_perms,
            "tenant-abc",
            get_tenant_user_from_db=mock_get_tenant_user
        )
        
        # Should be denied
        assert await checker.has_permission("services.admin") is False


class TestPermissionCheckerRedisCache:
    """Tests for Redis caching functionality."""
    
    @pytest.mark.asyncio
    async def test_cache_hit(self, user_with_tenant_perms, mock_redis, tenant_user_data):
        """Test that cached data is used when available."""
        # Set up Redis to return cached data
        mock_redis.get = Mock(return_value=json.dumps(tenant_user_data))
        
        checker = PermissionChecker(
            user_with_tenant_perms,
            "tenant-abc",
            redis_client=mock_redis
        )
        
        assert await checker.has_permission("users.read") is True
        
        # Verify Redis was called
        mock_redis.get.assert_called_once_with("tenant_user:user-456:tenant-abc")
    
    @pytest.mark.asyncio
    async def test_cache_miss_then_store(self, user_with_tenant_perms, mock_redis, tenant_user_data):
        """Test that data is fetched from DB and cached on miss."""
        async def mock_get_tenant_user(user_id, tenant_id):
            return tenant_user_data
        
        # Redis returns None (cache miss)
        mock_redis.get = Mock(return_value=None)
        
        checker = PermissionChecker(
            user_with_tenant_perms,
            "tenant-abc",
            redis_client=mock_redis,
            get_tenant_user_from_db=mock_get_tenant_user
        )
        
        assert await checker.has_permission("users.read") is True
        
        # Verify data was cached with 5-minute TTL
        mock_redis.setex.assert_called_once()
        args = mock_redis.setex.call_args[0]
        assert args[0] == "tenant_user:user-456:tenant-abc"
        assert args[1] == 300  # 5 minutes
        assert json.loads(args[2]) == tenant_user_data
    
    @pytest.mark.asyncio
    async def test_cache_failure_fallback_to_db(self, user_with_tenant_perms, tenant_user_data):
        """Test fallback to DB when Redis fails."""
        async def mock_get_tenant_user(user_id, tenant_id):
            return tenant_user_data
        
        # Redis that raises exception
        mock_redis = Mock()
        mock_redis.get = Mock(side_effect=Exception("Redis connection failed"))
        
        checker = PermissionChecker(
            user_with_tenant_perms,
            "tenant-abc",
            redis_client=mock_redis,
            get_tenant_user_from_db=mock_get_tenant_user
        )
        
        # Should still work via DB fallback
        assert await checker.has_permission("users.read") is True
    
    @pytest.mark.asyncio
    async def test_no_redis_uses_db(self, user_with_tenant_perms, tenant_user_data):
        """Test that DB is used when Redis is not configured."""
        async def mock_get_tenant_user(user_id, tenant_id):
            return tenant_user_data
        
        checker = PermissionChecker(
            user_with_tenant_perms,
            "tenant-abc",
            redis_client=None,
            get_tenant_user_from_db=mock_get_tenant_user
        )
        
        assert await checker.has_permission("users.read") is True


class TestWildcardMatching:
    """Tests for wildcard permission matching logic."""
    
    @pytest.mark.asyncio
    async def test_global_wildcard_matches_everything(self):
        """Test that '*' matches any permission."""
        user = User(
            id="admin-123",
            permissions=[{"name": "*", "scope": "global"}]
        )
        checker = PermissionChecker(user, "tenant-abc")
        
        assert await checker.has_permission("a.b") is True
        assert await checker.has_permission("x.y.z") is True
        assert await checker.has_permission("anything") is True
    
    @pytest.mark.asyncio
    async def test_prefix_wildcard_matches_correctly(self):
        """Test that 'users.*' matches 'users.x' but not 'services.x'."""
        user = User(
            id="user-123",
            permissions=[{"name": "users.*", "scope": "global"}]
        )
        checker = PermissionChecker(user, "tenant-abc")
        
        assert await checker.has_permission("users.create") is True
        assert await checker.has_permission("users.delete") is True
        assert await checker.has_permission("services.create") is False
    
    @pytest.mark.asyncio
    async def test_exact_match_required_when_no_wildcard(self):
        """Test that exact match is required for non-wildcard permissions."""
        user = User(
            id="user-123",
            permissions=[{"name": "users.read", "scope": "global"}]
        )
        checker = PermissionChecker(user, "tenant-abc")
        
        assert await checker.has_permission("users.read") is True
        assert await checker.has_permission("users.create") is False
        assert await checker.has_permission("users") is False


class TestCacheInvalidation:
    """Tests for cache invalidation functionality."""
    
    @pytest.mark.asyncio
    async def test_invalidate_tenant_user_cache(self, mock_redis):
        """Test invalidating tenant user cache."""
        await invalidate_permission_cache(mock_redis, "user-123", "tenant-abc")
        
        # Should delete tenant_user cache key
        mock_redis.delete.assert_called()
        calls = [call[0] for call in mock_redis.delete.call_args_list]
        assert any("tenant_user:user-123:tenant-abc" in str(call) for call in calls)
    
    @pytest.mark.asyncio
    async def test_invalidate_permission_check_caches(self, mock_redis):
        """Test invalidating permission check caches."""
        # Simulate existing permission check cache keys
        mock_redis.keys = Mock(return_value=[
            b"permissions:user-123:tenant-abc:users.read",
            b"permissions:user-123:tenant-abc:users.create"
        ])
        
        await invalidate_permission_cache(mock_redis, "user-123", "tenant-abc")
        
        # Should search for and delete permission check keys
        mock_redis.keys.assert_called_with("permissions:user-123:tenant-abc:*")
    
    @pytest.mark.asyncio
    async def test_invalidation_without_redis(self):
        """Test that invalidation without Redis doesn't fail."""
        # Should not raise exception
        await invalidate_permission_cache(None, "user-123", "tenant-abc")
    
    @pytest.mark.asyncio
    async def test_invalidation_redis_failure(self, mock_redis):
        """Test that Redis failures during invalidation are handled gracefully."""
        mock_redis.delete = Mock(side_effect=Exception("Redis error"))
        
        # Should not raise exception
        await invalidate_permission_cache(mock_redis, "user-123", "tenant-abc")


class TestEdgeCases:
    """Tests for edge cases and error handling."""
    
    @pytest.mark.asyncio
    async def test_empty_user_permissions(self):
        """Test user with no permissions."""
        user = User(id="user-123", permissions=[])
        
        async def mock_get_tenant_user(user_id, tenant_id):
            return {"user_id": user_id, "tenant_id": tenant_id, "permissions": [], "roles": []}
        
        checker = PermissionChecker(
            user,
            "tenant-abc",
            get_tenant_user_from_db=mock_get_tenant_user
        )
        
        assert await checker.has_permission("users.read") is False
    
    @pytest.mark.asyncio
    async def test_malformed_permission_in_user_data(self):
        """Test handling of malformed permission data."""
        user = User(
            id="user-123",
            permissions=[
                {"name": "users.read"},  # Missing scope
                {"scope": "global"}  # Missing name
            ]
        )
        checker = PermissionChecker(user, "tenant-abc")
        
        # Should not crash, just return False
        assert await checker.has_permission("users.read") is False
    
    @pytest.mark.asyncio
    async def test_permission_check_with_dots_in_name(self):
        """Test permission names with multiple dots."""
        user = User(
            id="user-123",
            permissions=[{"name": "app.users.*", "scope": "global"}]
        )
        checker = PermissionChecker(user, "tenant-abc")
        
        assert await checker.has_permission("app.users.create") is True
        assert await checker.has_permission("app.users.delete") is True
        assert await checker.has_permission("app.services.create") is False
