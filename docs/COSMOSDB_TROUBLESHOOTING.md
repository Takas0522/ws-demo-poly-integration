# CosmosDB Emulator トラブルシューティングガイド

このドキュメントは、DevContainer 内の CosmosDB エミュレータに関する一般的な問題と解決策を説明します。

## 一般的な問題

### 1. 503 Service Unavailable / コンテナ作成失敗

**症状:**

- `uvicorn`でサービスを起動すると 503 エラーが発生
- コンテナ作成時に「Service Unavailable」エラー
- システムログに`"cpu":100.000`と表示される

**原因:**
CosmosDB エミュレータがメモリまたは CPU リソースの制限に達しています。これは以下の理由で発生する可能性があります:

- 複数のデータベース/コンテナが作成されている
- パーティション数が多すぎる
- エミュレータのメモリ制限が低すぎる

**解決策:**

#### オプション 1: 不要なデータベースを削除（推奨）

```bash
cd scripts/cosmosdb
python -c "
from azure.cosmos import CosmosClient
import warnings
warnings.filterwarnings('ignore')

client = CosmosClient(
    'https://localhost:8081',
    'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==',
    connection_verify=False
)

# 不要なデータベースを削除（saas-management-devは保持）
for db in client.list_databases():
    if db['id'] not in ['saas-management-dev']:
        print(f'削除: {db[\"id\"]}')
        client.delete_database(db['id'])
"
```

#### オプション 2: DevContainer を再起動

```bash
# VS Codeコマンドパレット (Ctrl+Shift+P)
# > Dev Containers: Rebuild Container
```

これにより、CosmosDB エミュレータが新しい状態でリセットされます。

#### オプション 3: 既存のデータベースを共有

複数のサービスで同じデータベースを使用し、コンテナ名で区別します:

```bash
# service-setting-service/.env
COSMOS_DATABASE=saas-management-dev  # 既存のデータベースを使用
COSMOS_CONTAINER=configurations      # 専用コンテナ
```

### 2. データベース接続エラー

**症状:**

- `Connection failed`エラー
- `Unauthorized`エラー

**解決策:**

1. CosmosDB エミュレータが起動しているか確認:

```bash
curl -k https://localhost:8081/_explorer/emulator.pem -I
```

2. 正しいキーを使用しているか確認:

```bash
# .envファイルのCOSMOS_KEYが正しいことを確認
echo $COSMOS_KEY
```

### 3. SSL 証明書エラー

**症状:**

- `SSL: CERTIFICATE_VERIFY_FAILED`エラー

**解決策:**

Python コードで`connection_verify=False`を使用:

```python
client = CosmosClient(endpoint, key, connection_verify=False)
```

または、環境変数を設定:

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

## ベストプラクティス

### リソース管理

1. **定期的なクリーンアップ**: 開発中は定期的に不要なデータベースを削除
2. **最小限のパーティション**: 開発環境では`PARTITION_COUNT=5`で十分
3. **適切なメモリ割り当て**: `mem_limit: 4g`を推奨

### 開発ワークフロー

1. **サービス起動前に**: CosmosDB エミュレータの状態を確認
2. **エラー発生時**: まずクリーンアップを試す
3. **パフォーマンス低下時**: DevContainer を再起動

## 便利なコマンド

### 現在のデータベースとコンテナを確認

```bash
cd scripts/cosmosdb
python -c "
from azure.cosmos import CosmosClient
import warnings
warnings.filterwarnings('ignore')

client = CosmosClient(
    'https://localhost:8081',
    'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==',
    connection_verify=False
)

for db in client.list_databases():
    print(f'Database: {db[\"id\"]}')
    database = client.get_database_client(db['id'])
    for container in database.list_containers():
        print(f'  - Container: {container[\"id\"]}')
"
```

### エミュレータの状態を確認

```bash
curl -k https://localhost:8081/_explorer/index.html -I
```

### コンテナのパーティションキーを確認

```bash
cd scripts/cosmosdb
python -c "
from azure.cosmos import CosmosClient
import warnings
warnings.filterwarnings('ignore')

client = CosmosClient(
    'https://localhost:8081',
    'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==',
    connection_verify=False
)

db = client.get_database_client('saas-management-dev')
container = db.get_container_client('Users')
props = container.read()
print(f'Partition Key: {props[\"partitionKey\"]}')
"
```

## 参考リンク

- [Azure Cosmos DB Emulator Documentation](https://docs.microsoft.com/azure/cosmos-db/local-emulator)
- [Troubleshooting Guide](https://docs.microsoft.com/azure/cosmos-db/troubleshoot-local-emulator)
- [Python SDK Documentation](https://docs.microsoft.com/python/api/azure-cosmos/)
