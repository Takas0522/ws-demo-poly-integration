# Azure Cosmos DB Emulator セットアップガイド

## 概要

このプロジェクトではAzure Cosmos DB Emulator (vnext-preview) をDevContainer環境で使用しています。
エミュレーターはDocker Composeで自動的に起動され、ローカル開発環境でCosmos DBをエミュレートします。

## アクセス情報

### エンドポイント

- **Cosmos DB エンドポイント（DevContainer内）**: `https://cosmosdb:8081`
- **Cosmos DB エンドポイント（ホスト側）**: `https://localhost:8081`
- **Data Explorer**: `http://localhost:1234`

### 認証情報

デフォルトのエミュレーターキー:

```
C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==
```

### 接続文字列

```
AccountEndpoint=https://localhost:8081;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==
```

## Python SDKでの接続

### インストール

```bash
pip install azure-cosmos
```

### 接続例

```python
from azure.cosmos import CosmosClient
import urllib3

# SSL警告を無効化（エミュレーター使用時のみ）
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 接続設定
endpoint = "https://localhost:8081"
key = "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="

# クライアント作成（SSL検証を無効化）
client = CosmosClient(
    endpoint,
    key,
    connection_verify=False  # エミュレーター使用時のみ
)

# データベース・コンテナー操作
database = client.create_database_if_not_exists(id="testdb")
container = database.create_container_if_not_exists(
    id="testcontainer",
    partition_key={"paths": ["/id"], "kind": "Hash"}
)
```

## Docker Composeでの起動

エミュレーターは以下の設定で自動起動されます：

```yaml
cosmosdb:
  image: mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview
  ports:
    - "0.0.0.0:8081:8081" # Cosmos DB エンドポイント
    - "0.0.0.0:1234:1234" # Data Explorer
  environment:
    - PROTOCOL=https
    - ENABLE_EXPLORER=true
```

## 手動起動（DevContainerの外）

DevContainerの外でエミュレーターを起動する場合：

```bash
docker run --detach \
  --publish 8081:8081 \
  --publish 1234:1234 \
  --name cosmosdb-emulator \
  mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview
```

## Data Explorerの使用

ブラウザで以下のURLにアクセス:

```
http://localhost:1234
```

Data Explorerでは以下の操作が可能です:

- データベースの作成・削除
- コンテナーの作成・削除
- ドキュメントのCRUD操作
- クエリの実行

## トラブルシューティング

### エミュレーターが起動しない

```bash
# コンテナーのログを確認
docker logs cosmosdb-emulator

# コンテナーを再起動
docker restart cosmosdb-emulator
```

### 接続できない

1. ポート8081が使用可能か確認:

```bash
netstat -an | grep 8081
```

2. ヘルスチェックを確認:

```bash
curl -k https://localhost:8081/
```

3. DevContainerを再ビルド:

```bash
# VSCodeコマンドパレット: "Dev Containers: Rebuild Container"
```

### SSL証明書エラー

Python SDKの場合は`connection_verify=False`オプションを使用。
.NET/Java SDKの場合は証明書のインストールが必要です。

## サポートされている機能

vnext-previewバージョンでサポートされている主な機能：

- ✅ CRUD操作（作成、読み取り、更新、削除）
- ✅ クエリ（基本的なSQLクエリ）
- ✅ Change Feed
- ✅ Batch/Bulk API
- ✅ パーティション分割
- ⚠️ カスタムインデックスポリシー（未実装）
- ❌ ストアドプロシージャ（計画なし）
- ❌ トリガー（計画なし）

詳細は公式ドキュメントを参照:
https://learn.microsoft.com/ja-jp/azure/cosmos-db/emulator-linux

## 環境変数

アプリケーションで使用する環境変数の例：

```bash
# DevContainer内での設定
COSMOS_DB_ENDPOINT=https://cosmosdb:8081
COSMOS_DB_KEY=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==
COSMOS_DB_DATABASE=your_database_name
COSMOS_DB_CONTAINER=your_container_name
COSMOS_DB_CONNECTION_VERIFY=false  # Emulator使用時のみ
```

## データベース初期セットアップ

DevContainer起動後、以下のコマンドでデータベースをセットアップします：

```bash
# 環境変数を設定
export COSMOS_DB_ENDPOINT="https://cosmosdb:8081"
export COSMOS_DB_KEY="C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
export COSMOS_DB_CONNECTION_VERIFY="false"

# データベースとコンテナを作成
python scripts/create_database.py

# 初期データを投入
python scripts/seed_database.py

# サンプルデータを投入（任意）
python scripts/seed_sample_data.py
```

## 本番環境への移行

本番では以下を変更：

1. エンドポイントをAzure Cosmos DBのURLに変更
2. キーをAzure Key Vaultなどから取得
3. `connection_verify=False`を削除（SSL検証を有効化）
4. 適切な一貫性レベルとパーティション戦略を設定
