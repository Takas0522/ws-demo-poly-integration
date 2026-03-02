#!/usr/bin/env python3
"""
Azure AD認証を使用してデプロイ済みCosmosDBに初期データを投入するスクリプト

Usage:
    python scripts/seed_database_azure.py --endpoint https://cosmos-xxx.documents.azure.com:443/
    python scripts/seed_database_azure.py --endpoint https://cosmos-xxx.documents.azure.com:443/ --include-sample
"""
import argparse
import sys
from pathlib import Path

# プロジェクトルート
project_root = Path(__file__).resolve().parent.parent
sys.path.append(str(project_root / "scripts"))

from azure.cosmos import CosmosClient, PartitionKey
from azure.cosmos.exceptions import CosmosResourceExistsError
from azure.identity import DefaultAzureCredential

from seed_data.initial_data import (
    ADMIN_USER,
    ADMIN_USER_ROLES,
    PRIVILEGED_TENANT,
    ROLES,
    SERVICES,
    TENANT_USER_RELATION,
)


def get_client(endpoint: str) -> CosmosClient:
    """Azure AD認証でCosmosClientを生成"""
    credential = DefaultAzureCredential()
    return CosmosClient(endpoint, credential=credential)


def upsert_item(container, item, label: str):
    """アイテムをupsert（存在すれば更新、なければ作成）"""
    try:
        container.upsert_item(item)
        print(f"  ✓ {label}")
    except Exception as e:
        print(f"  ✗ {label}: {e}")


def seed_tenant_data(client: CosmosClient):
    """テナントデータ投入"""
    print("\n=== テナントデータ投入 ===")
    db = client.get_database_client("tenant_management")
    container = db.get_container_client("tenants")

    upsert_item(container, PRIVILEGED_TENANT, f"特権テナント: {PRIVILEGED_TENANT['name']}")
    upsert_item(container, TENANT_USER_RELATION, "テナント-ユーザー紐付け")


def seed_user_data(client: CosmosClient):
    """ユーザーデータ投入"""
    print("\n=== ユーザーデータ投入 ===")
    db = client.get_database_client("auth_management")
    container = db.get_container_client("users")

    upsert_item(container, ADMIN_USER, f"管理者ユーザー: {ADMIN_USER['userId']}")
    for user_role in ADMIN_USER_ROLES:
        upsert_item(container, user_role, f"ユーザーロール割り当て: {user_role['roleId']}")


def seed_role_data(client: CosmosClient):
    """ロールデータ投入"""
    print("\n=== ロールデータ投入 ===")
    db = client.get_database_client("auth_management")
    container = db.get_container_client("roles")

    for role in ROLES:
        upsert_item(container, role, f"ロール: {role['serviceName']} - {role['roleName']}")


def seed_service_data(client: CosmosClient):
    """サービスデータ投入"""
    print("\n=== サービスデータ投入 ===")
    db = client.get_database_client("service_management")
    container = db.get_container_client("services")

    for service in SERVICES:
        upsert_item(container, service, f"サービス: {service['name']}")


def seed_sample_data(client: CosmosClient):
    """サンプルデータ投入"""
    print("\n=== サンプルデータ投入 ===")
    try:
        from seed_data.sample_data import SAMPLE_TENANTS, SAMPLE_USERS

        db_tenant = client.get_database_client("tenant_management")
        container_tenants = db_tenant.get_container_client("tenants")
        for tenant in SAMPLE_TENANTS:
            upsert_item(container_tenants, tenant, f"サンプルテナント: {tenant['name']}")

        db_auth = client.get_database_client("auth_management")
        container_users = db_auth.get_container_client("users")
        for user in SAMPLE_USERS:
            upsert_item(container_users, user, f"サンプルユーザー: {user['userId']}")

        print(f"\n  サンプルテナント: {len(SAMPLE_TENANTS)}件, サンプルユーザー: {len(SAMPLE_USERS)}件")
    except ImportError:
        print("  ⚠ サンプルデータモジュールが見つかりません。スキップします。")


def main():
    parser = argparse.ArgumentParser(description="Azure CosmosDBにシードデータを投入")
    parser.add_argument(
        "--endpoint",
        required=True,
        help="CosmosDB エンドポイントURL (例: https://cosmos-xxx.documents.azure.com:443/)",
    )
    parser.add_argument(
        "--include-sample",
        action="store_true",
        help="サンプルデータも投入する",
    )
    args = parser.parse_args()

    print("=== Azure CosmosDB シードデータ投入開始 ===")
    print(f"  エンドポイント: {args.endpoint}")
    print(f"  認証方式: Azure AD (DefaultAzureCredential)")

    try:
        client = get_client(args.endpoint)

        seed_tenant_data(client)
        seed_user_data(client)
        seed_role_data(client)
        seed_service_data(client)

        if args.include_sample:
            seed_sample_data(client)

        print("\n=== シードデータ投入完了 ===")
        print("\n初期ログイン情報:")
        print(f"  ユーザーID: {ADMIN_USER['userId']}")
        print(f"  パスワード: Admin@12345")

    except Exception as e:
        print(f"\n✗ エラー: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
