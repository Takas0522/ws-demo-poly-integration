#!/usr/bin/env python3
"""
初期データを投入するスクリプト
"""
import sys
import os
from pathlib import Path

# .envファイルを自動読み込み
from dotenv import load_dotenv

# プロジェクトルート
project_root = Path(__file__).resolve().parent.parent

# .envファイルの読み込み
if not os.getenv("COSMOS_DB_ENDPOINT"):
    env_file = project_root / "src" / "auth-service" / ".env"
    if env_file.exists():
        load_dotenv(env_file)
        print(f"📝 環境変数を読み込みました: {env_file}")

# プロジェクトルートをパスに追加
sys.path.append(str(project_root / 'src'))

from shared.cosmos_client import CosmosDBClient
from seed_data.initial_data import (
    PRIVILEGED_TENANT,
    ADMIN_USER,
    TENANT_USER_RELATION,
    SERVICES,
    ROLES,
    ADMIN_USER_ROLES
)


def seed_tenant_data():
    """テナントデータ投入"""
    print("\n=== テナントデータ投入 ===")
    
    client = CosmosDBClient(database_name="tenant_management")
    client.create_database()
    container = client.get_container("tenants")
    
    # 特権テナント
    try:
        container.create_item(PRIVILEGED_TENANT)
        print(f"✓ 特権テナント作成: {PRIVILEGED_TENANT['name']}")
    except Exception as e:
        print(f"⚠ 特権テナントは既に存在: {e}")
    
    # テナント-ユーザー紐付け
    try:
        container.create_item(TENANT_USER_RELATION)
        print(f"✓ テナント-ユーザー紐付け作成")
    except Exception as e:
        print(f"⚠ 紐付けは既に存在: {e}")


def seed_user_data():
    """ユーザーデータ投入"""
    print("\n=== ユーザーデータ投入 ===")
    
    client = CosmosDBClient(database_name="auth_management")
    client.create_database()
    container = client.get_container("users")
    
    # 管理者ユーザー
    try:
        container.create_item(ADMIN_USER)
        print(f"✓ 管理者ユーザー作成: {ADMIN_USER['userId']}")
    except Exception as e:
        print(f"⚠ ユーザーは既に存在: {e}")
    
    # ユーザーロール
    for user_role in ADMIN_USER_ROLES:
        try:
            container.create_item(user_role)
            print(f"✓ ユーザーロール割り当て: {user_role['roleId']}")
        except Exception as e:
            print(f"⚠ ロール割り当ては既に存在")


def seed_role_data():
    """ロールデータ投入"""
    print("\n=== ロールデータ投入 ===")
    
    client = CosmosDBClient(database_name="auth_management")
    client.create_database()
    container = client.get_container("roles")
    
    for role in ROLES:
        try:
            container.create_item(role)
            print(f"✓ ロール作成: {role['serviceName']} - {role['roleName']}")
        except Exception as e:
            print(f"⚠ ロールは既に存在: {role['roleName']}")


def seed_service_data():
    """サービスデータ投入"""
    print("\n=== サービスデータ投入 ===")
    
    client = CosmosDBClient(database_name="service_management")
    client.create_database()
    container = client.get_container("services")
    
    for service in SERVICES:
        try:
            container.create_item(service)
            print(f"✓ サービス作成: {service['name']}")
        except Exception as e:
            print(f"⚠ サービスは既に存在: {service['name']}")


if __name__ == "__main__":
    print("=== シードデータ投入開始 ===\n")
    
    try:
        seed_tenant_data()
        seed_user_data()
        seed_role_data()
        seed_service_data()
        
        print("\n=== シードデータ投入完了 ===")
        print("\n初期ログイン情報:")
        print(f"  ユーザーID: {ADMIN_USER['userId']}")
        print(f"  パスワード: Admin@12345")
        
    except Exception as e:
        print(f"\n✗ エラー: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
