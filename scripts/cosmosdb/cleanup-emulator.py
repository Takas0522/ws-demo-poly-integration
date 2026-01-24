#!/usr/bin/env python3
"""
CosmosDB Emulator Cleanup Script

このスクリプトは、CosmosDBエミュレータから不要なデータベースを削除して
リソースを解放します。

Usage:
    python cleanup-emulator.py [--keep saas-management-dev]
"""

import sys
import argparse
from azure.cosmos import CosmosClient

# CosmosDB Emulator設定
ENDPOINT = "http://localhost:8081"
KEY = "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw=="


def main():
    parser = argparse.ArgumentParser(description="CosmosDB Emulator Cleanup")
    parser.add_argument(
        "--keep",
        nargs="+",
        default=["saas-management-dev"],
        help="保持するデータベース名（スペース区切り）",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="実際には削除せず、削除対象を表示するのみ",
    )
    args = parser.parse_args()

    print("🔍 CosmosDBエミュレータに接続中...")
    client = CosmosClient(ENDPOINT, KEY, connection_verify=False)

    try:
        databases = list(client.list_databases())
        print(f"\n📊 既存のデータベース: {len(databases)}個")

        for db in databases:
            db_id = db["id"]
            print(f"  - {db_id}")

            if db_id not in args.keep:
                if args.dry_run:
                    print(f"    ⚠️  [DRY RUN] 削除対象: {db_id}")
                else:
                    try:
                        client.delete_database(db_id)
                        print(f"    ✅ 削除完了: {db_id}")
                    except Exception as e:
                        print(f"    ❌ 削除失敗: {db_id} - {e}")
            else:
                print(f"    ℹ️  保持: {db_id}")

        print("\n✅ クリーンアップ完了")

        # 残りのデータベースを表示
        remaining = list(client.list_databases())
        print(f"\n📊 残りのデータベース: {len(remaining)}個")
        for db in remaining:
            print(f"  - {db['id']}")

    except Exception as e:
        print(f"\n❌ エラー: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
