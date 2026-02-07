"""テナントAPIのデバッグスクリプト"""
import asyncio
from app.services.tenant_service import TenantService
from dotenv import load_dotenv
import sys
import os

# 環境変数ファイルをロード
os.chdir('/workspace/src/tenant-management-service')
sys.path.insert(0, '/workspace/src/tenant-management-service')

load_dotenv()


async def test_get_tenants():
    """テナント一覧取得をテスト"""
    print("=" * 50)
    print("Testing tenant service...")
    print("=" * 50)

    try:
        tenant_service = TenantService()
        print("✓ TenantService initialized")

        tenants = await tenant_service.get_all_tenants(skip=0, limit=100)
        print(f"✓ Found {len(tenants)} tenants")

        for tenant in tenants:
            print(f"  - {tenant.id}: {tenant.name}")

    except Exception as e:
        print(f"✗ Error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_get_tenants())
