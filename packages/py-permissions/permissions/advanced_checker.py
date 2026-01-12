"""
Advanced Permission Checker with Global Priority Logic and Redis Caching

This module implements a priority-based permission checking system:
1. Global permissions (scope='global') take priority
2. Tenant-specific permissions (TenantUsers.permissions)
3. Default deny
"""

from typing import Optional, Dict, Any, Callable, Awaitable
import json

from .types import User


class PermissionChecker:
    """Permission checker with global priority logic and Redis caching."""

    def __init__(
        self,
        user: User,
        tenant_id: str,
        redis_client: Optional[Any] = None,
        get_tenant_user_from_db: Optional[
            Callable[[str, str], Awaitable[Optional[Dict[str, Any]]]]
        ] = None,
    ):
        """Initialize permission checker.

        Args:
            user: User object with permissions containing scope
            tenant_id: Tenant ID for permission checking
            redis_client: Optional Redis client for caching
            get_tenant_user_from_db: Optional async function to fetch TenantUser from database
        """
        self.user = user
        self.tenant_id = tenant_id
        self.redis = redis_client
        self._get_tenant_user_from_db_func = get_tenant_user_from_db

    async def has_permission(self, permission: str) -> bool:
        """Check if user has permission with priority logic.

        Priority:
        1. Global permissions (scope='global')
        2. Tenant-specific permissions (TenantUsers.permissions)
        3. Default deny

        Args:
            permission: Permission to check (e.g., 'users.create')

        Returns:
            True if user has permission, False otherwise
        """
        # 1. Check global permissions first
        if await self._has_global_permission(permission):
            return True

        # 2. Check tenant-specific permissions
        if await self._has_tenant_permission(permission):
            return True

        return False

    async def _has_global_permission(self, permission: str) -> bool:
        """Check if user has global permission.

        Checks Users.permissions with scope='global'.

        Args:
            permission: Permission to check

        Returns:
            True if user has global permission
        """
        for perm in self.user.permissions:
            # Skip malformed permissions
            if not isinstance(perm, dict) or "name" not in perm:
                continue
            if perm.get("scope") == "global" and self._match_permission(perm["name"], permission):
                return True
        return False

    async def _has_tenant_permission(self, permission: str) -> bool:
        """Check if user has tenant-specific permission.

        Checks TenantUsers.permissions with Redis caching.

        Args:
            permission: Permission to check

        Returns:
            True if user has tenant permission
        """
        tenant_user = await self._get_tenant_user_cached()
        if not tenant_user:
            return False

        for perm in tenant_user.get("permissions", []):
            if self._match_permission(perm, permission):
                return True
        return False

    async def _get_tenant_user_cached(self) -> Optional[Dict[str, Any]]:
        """Get TenantUser from Redis cache or database.

        Cache TTL: 5 minutes (300 seconds)

        Returns:
            TenantUser data as dict or None
        """
        if not self.redis:
            return await self._get_tenant_user_from_db()

        cache_key = f"tenant_user:{self.user.id}:{self.tenant_id}"

        try:
            cached = self.redis.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            # If Redis fails, fall back to DB
            pass

        tenant_user = await self._get_tenant_user_from_db()
        if tenant_user:
            try:
                self.redis.setex(cache_key, 300, json.dumps(tenant_user))
            except Exception:
                # If Redis write fails, continue without caching
                pass

        return tenant_user

    async def _get_tenant_user_from_db(self) -> Optional[Dict[str, Any]]:
        """Get TenantUser from database.

        This is a placeholder that should be overridden or provided via constructor.

        Returns:
            TenantUser data as dict or None
        """
        if self._get_tenant_user_from_db_func:
            return await self._get_tenant_user_from_db_func(self.user.id, self.tenant_id)
        return None

    def _match_permission(self, pattern: str, permission: str) -> bool:
        """Match permission with wildcard support.

        Supports:
        - Exact match: 'users.create' matches 'users.create'
        - Global wildcard: '*' matches any permission
        - Prefix wildcard: 'users.*' matches 'users.create', 'users.delete', etc.

        Args:
            pattern: Permission pattern (may contain wildcards)
            permission: Permission to check

        Returns:
            True if pattern matches permission
        """
        # Global wildcard
        if pattern == "*":
            return True

        # Prefix wildcard (e.g., 'users.*')
        if pattern.endswith(".*"):
            prefix = pattern[:-2]
            return permission.startswith(prefix + ".")

        # Exact match
        return pattern == permission


async def invalidate_permission_cache(redis_client: Any, user_id: str, tenant_id: str) -> None:
    """Invalidate permission cache for a user in a tenant.

    Should be called when:
    - TenantUsers permissions are updated
    - User.permissions are updated

    Args:
        redis_client: Redis client instance
        user_id: User ID
        tenant_id: Tenant ID
    """
    if not redis_client:
        return

    try:
        # Delete tenant_user cache
        cache_key = f"tenant_user:{user_id}:{tenant_id}"
        redis_client.delete(cache_key)

        # Delete permission check caches (pattern match)
        pattern = f"permissions:{user_id}:{tenant_id}:*"
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
    except Exception:
        # Silently fail if Redis operations fail
        pass
