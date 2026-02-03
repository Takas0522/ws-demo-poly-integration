# Cosmos DB Emulator クイックスタートガイド

## 🚀 セットアップ手順

### 1. DevContainerの再ビルド

変更を適用するため、DevContainerを再ビルドします：

1. **VS Code コマンドパレット**を開く:
   - Windows/Linux: `Ctrl + Shift + P`
   - macOS: `Cmd + Shift + P`

2. **"Dev Containers: Rebuild Container"** を選択

3. ビルドが完了するまで待つ（5-10分程度）

### 2. エミュレーターの起動確認

DevContainer起動後、コンテナを確認：

```bash
docker ps | grep cosmos
```

期待される出力:
```
CONTAINER ID   IMAGE                                                           ...   PORTS
xxxxxxxxx      mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview   0.0.0.0:1234->1234/tcp, 0.0.0.0:8081->8081/tcp
```

### 3. 接続テストの実行

```bash
python scripts/test_cosmos_connection.py
```

成功すると以下のような出力が表示されます：
```
============================================================
Cosmos DB Emulator 接続テスト
============================================================

1. Cosmos DBクライアントを作成中...
   ✓ クライアント作成成功

2. テストデータベースを作成中...
   ✓ データベース 'test_connection_db' 作成成功

3. テストコンテナーを作成中...
   ✓ コンテナー 'test_container' 作成成功

4. テストドキュメントを作成中...
   ✓ ドキュメント作成成功: test_001

5. テストドキュメントを読み取り中...
   ✓ ドキュメント読み取り成功: Test Item

6. クエリを実行中...
   ✓ クエリ実行成功: 1件のドキュメントを取得

7. テストデータをクリーンアップ中...
   ✓ テストドキュメント削除成功
   ✓ テストコンテナー削除成功
   ✓ テストデータベース削除成功

============================================================
✓ すべてのテストが正常に完了しました！
============================================================
```

### 4. Data Explorerへのアクセス

ブラウザで以下のURLを開く：
```
http://localhost:1234
```

Data Explorerでは GUI を使って以下の操作が可能：
- データベース/コンテナーの作成・削除
- ドキュメントの CRUD 操作
- SQL クエリの実行
- メトリクスの確認

## 📝 接続情報

### Python SDK での接続

```python
from azure.cosmos import CosmosClient
import urllib3

# SSL警告を無効化（エミュレーター使用時のみ）
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# クライアント作成
endpoint = "https://localhost:8081"
key = "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="

client = CosmosClient(endpoint, key, connection_verify=False)

# データベース・コンテナー操作
database = client.create_database_if_not_exists(id="mydb")
container = database.create_container_if_not_exists(
    id="mycontainer",
    partition_key={"paths": ["/id"], "kind": "Hash"}
)
```

### 環境変数での設定

`.env` ファイルに追加：
```bash
COSMOS_ENDPOINT=https://localhost:8081
COSMOS_KEY=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==
COSMOS_DATABASE=your_database_name
```

## 🔧 トラブルシューティング

### エラー: `connection refused`

**原因**: エミュレーターが起動していない

**解決策**:
```bash
# コンテナの状態確認
docker ps -a | grep cosmos

# 起動していない場合は起動
docker-compose up -d cosmosdb

# ログ確認
docker logs cosmosdb-emulator
```

### エラー: `SSL: CERTIFICATE_VERIFY_FAILED`

**原因**: SSL証明書検証が有効になっている

**解決策**:
Python SDKで接続時に `connection_verify=False` を指定:
```python
client = CosmosClient(endpoint, key, connection_verify=False)
```

### ポート8081が既に使用されている

**原因**: 別のプロセスがポートを使用中

**解決策**:
```bash
# ポートを使用しているプロセスを確認
lsof -i :8081  # Linux/macOS
netstat -ano | findstr :8081  # Windows

# 競合するプロセスを停止するか、docker-compose.yml でポートを変更
```

### エミュレーターが起動後すぐに停止する

**原因**: メモリ不足またはDocker設定の問題

**解決策**:
1. Docker Desktopのリソース設定を確認（最低4GB RAM推奨）
2. コンテナログを確認:
   ```bash
   docker logs cosmosdb-emulator
   ```
3. コンテナを削除して再作成:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

## 📚 関連リソース

- **詳細ドキュメント**: [docs/cosmos-db-emulator.md](./cosmos-db-emulator.md)
- **公式ドキュメント**: https://learn.microsoft.com/ja-jp/azure/cosmos-db/emulator-linux
- **Azure Cosmos DB Python SDK**: https://learn.microsoft.com/ja-jp/azure/cosmos-db/sql/sql-api-sdk-python

## ✅ チェックリスト

セットアップが完了したか確認：

- [ ] DevContainerを再ビルドした
- [ ] `docker ps` でエミュレーターコンテナが起動している
- [ ] `python scripts/test_cosmos_connection.py` が成功した
- [ ] http://localhost:1234 でData Explorerにアクセスできた
- [ ] Python SDKで接続できることを確認した

すべてにチェックが入れば、Cosmos DBエミュレーターの準備完了です！🎉
