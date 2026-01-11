"""
Permission Caching Mechanism

Provides in-memory and Redis-based caching for permission checks to improve performance.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import json
import hashlib

from .types import UserPermissionContext, PermissionCheckResult, Role


class PermissionCache:
    """Base class for permission caching."""
    
    def get(self, key: str) -> Optional[Any]:
        """Get a cached value."""
        raise NotImplementedError
    
    def set(self, key: str, value: Any, ttl: int = 300) -> None:
        """Set a cached value with TTL in seconds."""
        raise NotImplementedError
    
    def delete(self, key: str) -> None:
        """Delete a cached value."""
        raise NotImplementedError
    
    def clear(self) -> None:
        """Clear all cached values."""
        raise NotImplementedError


class InMemoryCache(PermissionCache):
    """In-memory permission cache with TTL support."""
    
    def __init__(self):
        self._cache: Dict[str, tuple[Any, datetime]] = {}
    
    def get(self, key: str) -> Optional[Any]:
        """Get a cached value if not expired."""
        if key in self._cache:
            value, expires_at = self._cache[key]
            if datetime.utcnow() < expires_at:
                return value
            else:
                # Expired, remove it
                del self._cache[key]
        return None
    
    def set(self, key: str, value: Any, ttl: int = 300) -> None:
        """Set a cached value with TTL in seconds."""
        expires_at = datetime.utcnow() + timedelta(seconds=ttl)
        self._cache[key] = (value, expires_at)
    
    def delete(self, key: str) -> None:
        """Delete a cached value."""
        if key in self._cache:
            del self._cache[key]
    
    def clear(self) -> None:
        """Clear all cached values."""
        self._cache.clear()
    
    def cleanup_expired(self) -> None:
        """Remove expired entries from cache."""
        now = datetime.utcnow()
        expired_keys = [
            key for key, (_, expires_at) in self._cache.items()
            if now >= expires_at
        ]
        for key in expired_keys:
            del self._cache[key]


class RedisCache(PermissionCache):
    """Redis-based permission cache.
    
    This is a future consideration as mentioned in the requirements.
    Requires redis-py package to be installed.
    """
    
    def __init__(self, redis_client: Any, key_prefix: str = "perm:"):
        """Initialize Redis cache.
        
        Args:
            redis_client: Redis client instance (redis.Redis or aioredis)
            key_prefix: Prefix for all cache keys
        """
        self.redis = redis_client
        self.key_prefix = key_prefix
    
    def _make_key(self, key: str) -> str:
        """Add prefix to key."""
        return f"{self.key_prefix}{key}"
    
    def get(self, key: str) -> Optional[Any]:
        """Get a cached value from Redis."""
        try:
            value = self.redis.get(self._make_key(key))
            if value:
                return json.loads(value)
        except Exception:
            pass
        return None
    
    def set(self, key: str, value: Any, ttl: int = 300) -> None:
        """Set a cached value in Redis with TTL."""
        try:
            self.redis.setex(
                self._make_key(key),
                ttl,
                json.dumps(value)
            )
        except Exception:
            pass
    
    def delete(self, key: str) -> None:
        """Delete a cached value from Redis."""
        try:
            self.redis.delete(self._make_key(key))
        except Exception:
            pass
    
    def clear(self) -> None:
        """Clear all cached values with the prefix."""
        try:
            keys = self.redis.keys(f"{self.key_prefix}*")
            if keys:
                self.redis.delete(*keys)
        except Exception:
            pass


def _make_cache_key(*parts: str) -> str:
    """Create a cache key from parts."""
    combined = ":".join(str(p) for p in parts)
    # Use hash for long keys
    if len(combined) > 100:
        return hashlib.sha256(combined.encode()).hexdigest()
    return combined


class CachedPermissionChecker:
    """Permission checker with caching support."""
    
    def __init__(self, cache: PermissionCache, ttl: int = 300):
        """Initialize cached permission checker.
        
        Args:
            cache: Cache implementation to use
            ttl: Time-to-live for cached results in seconds (default: 5 minutes)
        """
        self.cache = cache
        self.ttl = ttl
    
    def cache_user_permissions(
        self,
        user_id: str,
        tenant_id: str,
        permissions: List[str]
    ) -> None:
        """Cache user permissions.
        
        Args:
            user_id: User ID
            tenant_id: Tenant ID
            permissions: List of user permissions
        """
        key = _make_cache_key("user_perms", tenant_id, user_id)
        self.cache.set(key, permissions, self.ttl)
    
    def get_cached_user_permissions(
        self,
        user_id: str,
        tenant_id: str
    ) -> Optional[List[str]]:
        """Get cached user permissions.
        
        Args:
            user_id: User ID
            tenant_id: Tenant ID
            
        Returns:
            Cached permissions or None if not cached
        """
        key = _make_cache_key("user_perms", tenant_id, user_id)
        return self.cache.get(key)
    
    def cache_role_permissions(
        self,
        role_name: str,
        tenant_id: str,
        permissions: List[str]
    ) -> None:
        """Cache role permissions.
        
        Args:
            role_name: Role name
            tenant_id: Tenant ID
            permissions: List of role permissions
        """
        key = _make_cache_key("role_perms", tenant_id, role_name)
        self.cache.set(key, permissions, self.ttl)
    
    def get_cached_role_permissions(
        self,
        role_name: str,
        tenant_id: str
    ) -> Optional[List[str]]:
        """Get cached role permissions.
        
        Args:
            role_name: Role name
            tenant_id: Tenant ID
            
        Returns:
            Cached permissions or None if not cached
        """
        key = _make_cache_key("role_perms", tenant_id, role_name)
        return self.cache.get(key)
    
    def cache_permission_check(
        self,
        user_id: str,
        tenant_id: str,
        permission: str,
        scope: str,
        result: bool
    ) -> None:
        """Cache a permission check result.
        
        Args:
            user_id: User ID
            tenant_id: Tenant ID
            permission: Permission that was checked
            scope: Permission scope
            result: Check result (granted or not)
        """
        key = _make_cache_key("perm_check", tenant_id, user_id, permission, scope)
        self.cache.set(key, result, self.ttl)
    
    def get_cached_permission_check(
        self,
        user_id: str,
        tenant_id: str,
        permission: str,
        scope: str
    ) -> Optional[bool]:
        """Get cached permission check result.
        
        Args:
            user_id: User ID
            tenant_id: Tenant ID
            permission: Permission to check
            scope: Permission scope
            
        Returns:
            Cached result or None if not cached
        """
        key = _make_cache_key("perm_check", tenant_id, user_id, permission, scope)
        return self.cache.get(key)
    
    def invalidate_user_cache(self, user_id: str, tenant_id: str) -> None:
        """Invalidate all cache entries for a user.
        
        Should be called when user permissions or roles change.
        
        Args:
            user_id: User ID
            tenant_id: Tenant ID
        """
        # Delete user permissions cache
        key = _make_cache_key("user_perms", tenant_id, user_id)
        self.cache.delete(key)
        
        # Note: Individual permission checks are harder to invalidate
        # In production, you might want to add a user version number
        # to the cache key that increments on permission changes
    
    def invalidate_role_cache(self, role_name: str, tenant_id: str) -> None:
        """Invalidate all cache entries for a role.
        
        Should be called when role permissions change.
        
        Args:
            role_name: Role name
            tenant_id: Tenant ID
        """
        key = _make_cache_key("role_perms", tenant_id, role_name)
        self.cache.delete(key)
    
    def invalidate_all(self) -> None:
        """Clear all cached permission data.
        
        Should be called sparingly, only when necessary.
        """
        self.cache.clear()


# Global default cache instance (in-memory)
_default_cache = InMemoryCache()
_default_cached_checker = CachedPermissionChecker(_default_cache)


def get_default_cache() -> PermissionCache:
    """Get the default cache instance."""
    return _default_cache


def get_default_cached_checker() -> CachedPermissionChecker:
    """Get the default cached checker instance."""
    return _default_cached_checker


def set_default_cache(cache: PermissionCache, ttl: int = 300) -> None:
    """Set the default cache instance.
    
    Args:
        cache: Cache implementation to use as default
        ttl: Time-to-live for cached results in seconds
    """
    global _default_cache, _default_cached_checker
    _default_cache = cache
    _default_cached_checker = CachedPermissionChecker(cache, ttl)
