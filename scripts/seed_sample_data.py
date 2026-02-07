#!/usr/bin/env python3
"""
デモンストレーション用サンプルデータを投入するスクリプト

このスクリプトは既存の初期データ（特権テナント、管理者）を保持したまま、
追加のサンプルデータを投入します。

実行方法:
    python scripts/seed_sample_data.py

必要な環境変数:
    COSMOS_DB_ENDPOINT: CosmosDBのエンドポイント
    COSMOS_DB_KEY: CosmosDBのアクセスキー
"""
from seed_data.sample_data import (
    SAMPLE_TENANTS,
    SAMPLE_USERS,
    SAMPLE_TENANT_USERS,
    SAMPLE_USER_ROLES,
    SAMPLE_TENANT_SERVICES,
    TEST_ACCOUNTS
)
from shared.cosmos_client import CosmosDBClient
import sys
import os
from typing import List, Dict, Any
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


class SampleDataSeeder:
    """サンプルデータ投入クラス"""

    def __init__(self):
        self.stats = {
            "tenants": {"created": 0, "skipped": 0},
            "users": {"created": 0, "skipped": 0},
            "tenant_users": {"created": 0, "skipped": 0},
            "user_roles": {"created": 0, "skipped": 0},
            "tenant_services": {"created": 0, "skipped": 0},
        }

    def seed_tenant_data(self):
        """テナントデータ投入"""
        print("\n" + "=" * 60)
        print("テナントデータ投入")
        print("=" * 60)

        client = CosmosDBClient(database_name="tenant_management")
        container = client.get_container("tenants")

        # サンプルテナント
        for tenant in SAMPLE_TENANTS:
            try:
                container.create_item(tenant)
                print(f"✓ テナント作成: {tenant['name']}")
                self.stats["tenants"]["created"] += 1
            except Exception as e:
                if "Conflict" in str(e):
                    print(f"⊘ スキップ: {tenant['name']} (既に存在)")
                    self.stats["tenants"]["skipped"] += 1
                else:
                    print(f"✗ エラー: {tenant['name']} - {e}")

        # テナント-ユーザー紐付け
        print("\nテナント-ユーザー紐付け:")
        for tenant_user in SAMPLE_TENANT_USERS:
            try:
                container.create_item(tenant_user)
                print(
                    f"✓ 紐付け作成: Tenant={tenant_user['tenantId'][:12]}..., User={tenant_user['userId'][:12]}...")
                self.stats["tenant_users"]["created"] += 1
            except Exception as e:
                if "Conflict" in str(e):
                    self.stats["tenant_users"]["skipped"] += 1
                else:
                    print(f"✗ エラー: {e}")

    def seed_user_data(self):
        """ユーザーデータ投入"""
        print("\n" + "=" * 60)
        print("ユーザーデータ投入")
        print("=" * 60)

        client = CosmosDBClient(database_name="auth_management")
        container = client.get_container("users")

        # サンプルユーザー
        for user in SAMPLE_USERS:
            try:
                container.create_item(user)
                print(f"✓ ユーザー作成: {user['userId']} ({user['name']})")
                self.stats["users"]["created"] += 1
            except Exception as e:
                if "Conflict" in str(e):
                    print(f"⊘ スキップ: {user['userId']} (既に存在)")
                    self.stats["users"]["skipped"] += 1
                else:
                    print(f"✗ エラー: {user['userId']} - {e}")

        # ユーザーロール割り当て
        print("\nユーザーロール割り当て:")
        role_count = 0
        for user_role in SAMPLE_USER_ROLES:
            try:
                container.create_item(user_role)
                role_count += 1
                if role_count % 10 == 0:
                    print(f"✓ {role_count}件のロール割り当て完了")
                self.stats["user_roles"]["created"] += 1
            except Exception as e:
                if "Conflict" in str(e):
                    self.stats["user_roles"]["skipped"] += 1
                else:
                    print(f"✗ エラー: {e}")

        print(f"✓ 合計 {role_count}件のロール割り当て完了")

    def seed_tenant_service_data(self):
        """テナント-サービス紐付けデータ投入"""
        print("\n" + "=" * 60)
        print("テナント-サービス紐付けデータ投入")
        print("=" * 60)

        client = CosmosDBClient(database_name="service_management")
        container = client.get_container("tenant_services")

        service_count = 0
        for tenant_service in SAMPLE_TENANT_SERVICES:
            try:
                container.create_item(tenant_service)
                service_count += 1
                if service_count % 5 == 0:
                    print(f"✓ {service_count}件のサービス割り当て完了")
                self.stats["tenant_services"]["created"] += 1
            except Exception as e:
                if "Conflict" in str(e):
                    self.stats["tenant_services"]["skipped"] += 1
                else:
                    print(f"✗ エラー: {e}")

        print(f"✓ 合計 {service_count}件のサービス割り当て完了")

    def print_summary(self):
        """投入結果のサマリーを表示"""
        print("\n" + "=" * 60)
        print("サンプルデータ投入完了")
        print("=" * 60)

        print("\n投入結果:")
        for category, counts in self.stats.items():
            print(
                f"  {category:20s}: {counts['created']} 件作成, {counts['skipped']} 件スキップ")

        print("\n" + "=" * 60)
        print("テストアカウント一覧")
        print("=" * 60)

        for idx, account in enumerate(TEST_ACCOUNTS, start=1):
            print(f"\n【アカウント {idx}】")
            print(f"  テナント: {account['tenant']}")
            print(f"  メール  : {account['email']}")
            print(f"  パスワード: {account['password']}")
            print(f"  ロール  : {account['roles']}")
            print(f"  説明    : {account['description']}")

        print("\n" + "=" * 60)
        print("特権テナント（初期データ）")
        print("=" * 60)
        print(f"\n  メール  : admin@system.local")
        print(f"  パスワード: Admin@12345")
        print(f"  説明    : システム管理者（全権限）")

        print("\n" + "=" * 60)


def main():
    """メイン処理"""
    print("=" * 60)
    print("サンプルデータ投入スクリプト")
    print("=" * 60)
    print("\nこのスクリプトはデモンストレーション用のサンプルデータを投入します。")
    print("既存の初期データ（特権テナント、管理者）は保持されます。")

    # 環境変数チェック
    required_env_vars = ["COSMOS_DB_ENDPOINT", "COSMOS_DB_KEY"]
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]

    if missing_vars:
        print(f"\n✗ エラー: 以下の環境変数が設定されていません:")
        for var in missing_vars:
            print(f"  - {var}")
        sys.exit(1)

    try:
        seeder = SampleDataSeeder()

        # データ投入
        seeder.seed_tenant_data()
        seeder.seed_user_data()
        seeder.seed_tenant_service_data()

        # サマリー表示
        seeder.print_summary()

        print("\n✓ すべてのサンプルデータ投入が完了しました！")

    except Exception as e:
        print(f"\n✗ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
