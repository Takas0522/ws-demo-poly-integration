#!/usr/bin/env python3
"""
Mock Services - Role Endpoints Test Script
各サービスのロールエンドポイントをテストします
"""
import requests
import sys
from typing import Dict, Any

BASE_URL = "http://localhost:8004"

def test_endpoint(service: str, path: str) -> tuple[bool, Dict[Any, Any]]:
    """
    指定されたエンドポイントをテスト
    
    Args:
        service: サービス名
        path: エンドポイントパス
        
    Returns:
        (成功フラグ, レスポンスデータ)
    """
    try:
        url = f"{BASE_URL}{path}/api/roles"
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        # レスポンス構造を検証
        if "data" not in data or "roles" not in data["data"]:
            print(f"  ❌ Invalid response structure")
            return False, data
            
        roles = data["data"]["roles"]
        if not isinstance(roles, list) or len(roles) == 0:
            print(f"  ❌ No roles found")
            return False, data
            
        return True, data
        
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Request failed: {e}")
        return False, {}
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False, {}

def main():
    """メイン処理"""
    services = [
        ("File Management", "/file-management"),
        ("Messaging", "/messaging"),
        ("API Usage", "/api-usage"),
        ("Backup", "/backup"),
    ]
    
    print("=" * 70)
    print("Mock Services - Role Endpoints Test")
    print("=" * 70)
    print()
    
    # ヘルスチェック
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Mock Services is running")
        else:
            print("❌ Mock Services health check failed")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Cannot connect to Mock Services: {e}")
        print(f"   Please ensure the service is running on {BASE_URL}")
        sys.exit(1)
    
    print()
    
    # 各サービスをテスト
    success_count = 0
    total_count = len(services)
    
    for service_name, path in services:
        print(f"Testing {service_name}...")
        success, data = test_endpoint(service_name, path)
        
        if success:
            roles = data["data"]["roles"]
            print(f"  ✅ Success - Found {len(roles)} roles:")
            for role in roles:
                print(f"     - {role['id']}: {role['name']}")
            success_count += 1
        
        print()
    
    # 結果サマリー
    print("=" * 70)
    print(f"Results: {success_count}/{total_count} services passed")
    print("=" * 70)
    
    if success_count == total_count:
        print("✅ All role endpoints are working correctly!")
        sys.exit(0)
    else:
        print(f"❌ {total_count - success_count} service(s) failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
