"""
Example: Advanced Permission Checker with Global Priority Logic and Redis Caching

This example demonstrates:
1. Global permission priority over tenant permissions
2. Redis caching for TenantUser data
3. Wildcard permission matching
4. Cache invalidation
"""

import asyncio
from typing import Optional, Dict, Any

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    print("Note: Redis not installed. Install with: pip install redis")

from permissions import (
    PermissionChecker,
    User,
    invalidate_permission_cache
)


# Mock database functions (replace with your actual database queries)
async def get_tenant_user_from_db(user_id: str, tenant_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch TenantUser from database.
    In production, this would query your actual database.
    """
    # Mock data - replace with actual database query
    tenant_users = {
        ("user-123", "tenant-abc"): {
            "user_id": "user-123",
            "tenant_id": "tenant-abc",
            "permissions": ["posts.create", "posts.update", "comments.read"],
            "roles": ["editor"]
        },
        ("user-456", "tenant-xyz"): {
            "user_id": "user-456",
            "tenant_id": "tenant-xyz",
            "permissions": ["posts.read"],
            "roles": ["viewer"]
        }
    }
    
    return tenant_users.get((user_id, tenant_id))


async def main():
    print("=" * 80)
    print("Advanced Permission Checker Demo")
    print("=" * 80)
    
    # Setup Redis client (optional - can be None for development)
    redis_client = None
    if REDIS_AVAILABLE:
        try:
            redis_client = redis.Redis(
                host='localhost',
                port=6379,
                db=0,
                decode_responses=False
            )
            # Test connection
            redis_client.ping()
            print("✓ Redis connected\n")
        except Exception as e:
            print(f"⚠ Redis not available: {e}")
            print("⚠ Continuing without caching\n")
            redis_client = None
    else:
        print("⚠ Redis module not installed")
        print("⚠ Continuing without caching\n")
    
    # Example 1: System administrator with global permissions
    print("\nExample 1: System Administrator with Global Permissions")
    print("-" * 80)
    
    admin_user = User(
        id="admin-001",
        permissions=[
            {"name": "users.*", "scope": "global"},      # All user operations
            {"name": "tenants.*", "scope": "global"},    # All tenant operations
            {"name": "services.read", "scope": "global"} # Read services
        ]
    )
    
    admin_checker = PermissionChecker(
        user=admin_user,
        tenant_id="tenant-abc",
        redis_client=redis_client,
        get_tenant_user_from_db=get_tenant_user_from_db
    )
    
    # Test various permissions
    test_permissions = [
        "users.create",
        "users.delete",
        "tenants.update",
        "services.read",
        "services.delete"  # Should fail - only has services.read
    ]
    
    for permission in test_permissions:
        has_access = await admin_checker.has_permission(permission)
        status = "✓ GRANTED" if has_access else "✗ DENIED"
        print(f"{status}: {permission}")
    
    # Example 2: Regular user with tenant permissions
    print("\nExample 2: Regular User with Tenant Permissions")
    print("-" * 80)
    
    regular_user = User(
        id="user-123",
        permissions=[]  # No global permissions
    )
    
    user_checker = PermissionChecker(
        user=regular_user,
        tenant_id="tenant-abc",
        redis_client=redis_client,
        get_tenant_user_from_db=get_tenant_user_from_db
    )
    
    test_permissions = [
        "posts.create",   # From tenant permissions
        "posts.update",   # From tenant permissions
        "comments.read",  # From tenant permissions
        "posts.delete",   # Not granted
        "users.create"    # Not granted
    ]
    
    for permission in test_permissions:
        has_access = await user_checker.has_permission(permission)
        status = "✓ GRANTED" if has_access else "✗ DENIED"
        print(f"{status}: {permission}")
    
    # Example 3: Mixed permissions (global + tenant)
    print("\nExample 3: User with Both Global and Tenant Permissions")
    print("-" * 80)
    
    mixed_user = User(
        id="user-123",
        permissions=[
            {"name": "users.read", "scope": "global"},  # Global read access
        ]
    )
    
    mixed_checker = PermissionChecker(
        user=mixed_user,
        tenant_id="tenant-abc",
        redis_client=redis_client,
        get_tenant_user_from_db=get_tenant_user_from_db
    )
    
    test_permissions = [
        "users.read",     # Global permission (priority)
        "posts.create",   # Tenant permission
        "users.delete"    # Not granted
    ]
    
    for permission in test_permissions:
        has_access = await mixed_checker.has_permission(permission)
        status = "✓ GRANTED" if has_access else "✗ DENIED"
        print(f"{status}: {permission}")
    
    # Example 4: Wildcard permissions
    print("\nExample 4: Wildcard Permission Matching")
    print("-" * 80)
    
    wildcard_user = User(
        id="superadmin",
        permissions=[
            {"name": "*", "scope": "global"},  # All permissions
        ]
    )
    
    wildcard_checker = PermissionChecker(
        user=wildcard_user,
        tenant_id="tenant-abc",
        redis_client=redis_client
    )
    
    test_permissions = [
        "users.create",
        "tenants.delete",
        "anything.you.want",
        "super.admin.power"
    ]
    
    for permission in test_permissions:
        has_access = await wildcard_checker.has_permission(permission)
        status = "✓ GRANTED" if has_access else "✗ DENIED"
        print(f"{status}: {permission}")
    
    # Example 5: Cache invalidation
    print("\nExample 5: Cache Invalidation")
    print("-" * 80)
    
    if redis_client:
        # First check (will fetch from DB and cache)
        print("First check (cache miss, fetch from DB):")
        has_access = await user_checker.has_permission("posts.create")
        print(f"  posts.create: {has_access}")
        
        # Second check (will use cache)
        print("\nSecond check (cache hit):")
        has_access = await user_checker.has_permission("posts.create")
        print(f"  posts.create: {has_access}")
        
        # Invalidate cache
        print("\nInvalidating cache...")
        await invalidate_permission_cache(redis_client, "user-123", "tenant-abc")
        print("  Cache invalidated")
        
        # Third check (will fetch from DB again)
        print("\nThird check (cache miss after invalidation):")
        has_access = await user_checker.has_permission("posts.create")
        print(f"  posts.create: {has_access}")
    else:
        print("Redis not available - skipping cache demonstration")
    
    print("\n" + "=" * 80)
    print("Demo completed!")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
