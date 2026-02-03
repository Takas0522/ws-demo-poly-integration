#!/usr/bin/env python3
"""
Cosmos DB Emulator接続テストスクリプト
エミュレーターが正しく起動し、接続できることを確認します。
"""

import sys
import urllib3
from azure.cosmos import CosmosClient, exceptions

# SSL警告を無効化（エミュレーター使用時のみ）
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# エミュレーターのデフォルト設定
ENDPOINT = "https://localhost:8081"
KEY = "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="


def test_connection():
    """Cosmos DBエミュレーターへの接続をテスト"""
    print("=" * 60)
    print("Cosmos DB Emulator 接続テスト")
    print("=" * 60)
    print()

    # ステップ1: クライアント作成
    print("1. Cosmos DBクライアントを作成中...")
    try:
        client = CosmosClient(ENDPOINT, KEY, connection_verify=False)
        print("   ✓ クライアント作成成功")
    except Exception as e:
        print(f"   ✗ クライアント作成失敗: {e}")
        return False

    # ステップ2: データベース操作
    print("\n2. テストデータベースを作成中...")
    database_name = "test_connection_db"
    try:
        database = client.create_database_if_not_exists(id=database_name)
        print(f"   ✓ データベース '{database_name}' 作成成功")
    except Exception as e:
        print(f"   ✗ データベース作成失敗: {e}")
        return False

    # ステップ3: コンテナー操作
    print("\n3. テストコンテナーを作成中...")
    container_name = "test_container"
    try:
        container = database.create_container_if_not_exists(
            id=container_name,
            partition_key={"paths": ["/id"], "kind": "Hash"},
            offer_throughput=400,
        )
        print(f"   ✓ コンテナー '{container_name}' 作成成功")
    except Exception as e:
        print(f"   ✗ コンテナー作成失敗: {e}")
        return False

    # ステップ4: ドキュメント作成
    print("\n4. テストドキュメントを作成中...")
    test_item = {"id": "test_001", "name": "Test Item", "description": "Connection test"}
    try:
        created_item = container.create_item(body=test_item)
        print(f"   ✓ ドキュメント作成成功: {created_item['id']}")
    except Exception as e:
        print(f"   ✗ ドキュメント作成失敗: {e}")
        return False

    # ステップ5: ドキュメント読み取り
    print("\n5. テストドキュメントを読み取り中...")
    try:
        read_item = container.read_item(item="test_001", partition_key="test_001")
        print(f"   ✓ ドキュメント読み取り成功: {read_item['name']}")
    except exceptions.CosmosResourceNotFoundError:
        print("   ✗ ドキュメントが見つかりません")
        return False
    except Exception as e:
        print(f"   ✗ ドキュメント読み取り失敗: {e}")
        return False

    # ステップ6: クエリ実行
    print("\n6. クエリを実行中...")
    try:
        query = "SELECT * FROM c WHERE c.id = 'test_001'"
        items = list(container.query_items(query=query, enable_cross_partition_query=True))
        if items:
            print(f"   ✓ クエリ実行成功: {len(items)}件のドキュメントを取得")
        else:
            print("   ⚠ クエリは成功しましたが、結果が0件です")
    except Exception as e:
        print(f"   ✗ クエリ実行失敗: {e}")
        return False

    # ステップ7: クリーンアップ
    print("\n7. テストデータをクリーンアップ中...")
    try:
        container.delete_item(item="test_001", partition_key="test_001")
        print("   ✓ テストドキュメント削除成功")
    except Exception as e:
        print(f"   ⚠ クリーンアップ警告: {e}")

    try:
        database.delete_container(container_name)
        print("   ✓ テストコンテナー削除成功")
    except Exception as e:
        print(f"   ⚠ クリーンアップ警告: {e}")

    try:
        client.delete_database(database_name)
        print("   ✓ テストデータベース削除成功")
    except Exception as e:
        print(f"   ⚠ クリーンアップ警告: {e}")

    print("\n" + "=" * 60)
    print("✓ すべてのテストが正常に完了しました！")
    print("=" * 60)
    return True


def print_connection_info():
    """接続情報を表示"""
    print("\n接続情報:")
    print(f"  エンドポイント: {ENDPOINT}")
    print(f"  Data Explorer: http://localhost:1234")
    print()


if __name__ == "__main__":
    try:
        success = test_connection()
        print_connection_info()

        if success:
            sys.exit(0)
        else:
            print("\n❌ テストが失敗しました")
            print("トラブルシューティング:")
            print("  1. Cosmos DBエミュレーターが起動しているか確認")
            print("     docker ps | grep cosmosdb")
            print("  2. ポート8081が使用可能か確認")
            print("     curl -k https://localhost:8081/")
            print("  3. コンテナーログを確認")
            print("     docker logs cosmosdb-emulator")
            sys.exit(1)

    except KeyboardInterrupt:
        print("\n\n中断されました")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ 予期しないエラーが発生しました: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
