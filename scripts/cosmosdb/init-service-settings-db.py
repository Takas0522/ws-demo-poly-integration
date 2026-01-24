#!/usr/bin/env python3
"""
Service Settings Service - CosmosDB Initialization Script

このスクリプトは、service-setting-service用のCosmosDBデータベースと
コンテナを作成します。

Usage:
    python init-service-settings-db.py
"""

import sys
import time
from azure.cosmos import CosmosClient, PartitionKey
from azure.cosmos.exceptions import CosmosHttpResponseError

# CosmosDB Emulator設定
ENDPOINT = "http://localhost:8081"
KEY = "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
DATABASE_NAME = "settingsdb"
CONTAINER_NAME = "configurations"


def initialize_database_with_retry(max_retries=5, initial_delay=2):
    """
    リトライロジック付きでデータベースとコンテナを初期化
    """
    print("🔍 CosmosDBエミュレータに接続中...")
    client = CosmosClient(ENDPOINT, KEY, connection_verify=False)

    # データベースの作成
    print(f"\n📦 データベース '{DATABASE_NAME}' を作成中...")
    try:
        database = client.create_database_if_not_exists(id=DATABASE_NAME)
        print(f"✅ データベース作成完了: {DATABASE_NAME}")
    except Exception as e:
        print(f"❌ データベース作成失敗: {e}")
        sys.exit(1)

    # コンテナの作成（リトライロジック付き）
    print(f"\n📦 コンテナ '{CONTAINER_NAME}' を作成中...")

    delay = initial_delay
    for attempt in range(1, max_retries + 1):
        try:
            # エミュレータを安定させるために少し待機
            if attempt > 1:
                print(f"⏳ {delay}秒待機してリトライします...")
                time.sleep(delay)

            container = database.create_container_if_not_exists(
                id=CONTAINER_NAME,
                partition_key=PartitionKey(path="/tenant_id"),
                offer_throughput=400  # 最小スループット
            )

            print(f"✅ コンテナ作成完了: {CONTAINER_NAME}")
            print(f"   パーティションキー: /tenant_id")
            print(f"   スループット: 400 RU/s")
            return True

        except CosmosHttpResponseError as e:
            if e.status_code == 503:  # Service Unavailable
                if attempt < max_retries:
                    print(f"⚠️  サービス一時的に利用不可 (試行 {attempt}/{max_retries})")
                    delay *= 2  # 指数バックオフ
                else:
                    print(f"\n❌ {max_retries}回試行後も失敗しました")
                    print(f"   エラー: {e}")
                    print("\n💡 解決策:")
                    print("   1. CosmosDBエミュレータを再起動してください")
                    print("   2. 不要なデータベースを削除してリソースを解放してください")
                    print(
                        "      python scripts/cosmosdb/cleanup-emulator.py --keep saas-management-dev")
                    return False
            else:
                print(f"❌ コンテナ作成失敗: {e}")
                return False
        except Exception as e:
            print(f"❌ 予期しないエラー: {e}")
            return False

    return False


def verify_setup():
    """
    セットアップを検証
    """
    print("\n🔍 セットアップを検証中...")
    client = CosmosClient(ENDPOINT, KEY, connection_verify=False)

    try:
        database = client.get_database_client(DATABASE_NAME)
        container = database.get_container_client(CONTAINER_NAME)

        # コンテナの存在を確認
        container.read()

        print("✅ 検証成功: データベースとコンテナが正常に作成されました")
        return True
    except Exception as e:
        print(f"❌ 検証失敗: {e}")
        return False


def main():
    print("=" * 60)
    print("Service Settings Service - CosmosDB初期化")
    print("=" * 60)

    success = initialize_database_with_retry()

    if success:
        if verify_setup():
            print("\n" + "=" * 60)
            print("✅ 初期化が完全に完了しました！")
            print("=" * 60)
            print(f"\nデータベース名: {DATABASE_NAME}")
            print(f"コンテナ名: {CONTAINER_NAME}")
            print(f"パーティションキー: /tenant_id")
            print("\nservice-setting-serviceを起動できます:")
            print("  cd src/service-setting-service")
            print("  uvicorn app.main:app --reload --host 0.0.0.0 --port 3003")
            sys.exit(0)
        else:
            sys.exit(1)
    else:
        print("\n" + "=" * 60)
        print("❌ 初期化に失敗しました")
        print("=" * 60)
        sys.exit(1)


if __name__ == "__main__":
    main()
