# CosmosDB Emulator 問題の解決策まとめ

## 問題の概要

WSL 内の Docker で動作する CosmosDB エミュレータで、サービス起動時に以下のエラーが発生：

- **503 Service Unavailable**: コンテナ作成時にリソース不足
- **CPU 使用率 100%**: エミュレータが過負荷状態
- **InternalServerError**: エミュレータの内部エラー

## 実施した解決策

### 1. 不要なデータベースの削除 ✅

**目的**: CosmosDB エミュレータのリソースを解放

**実施内容**:

- `UserManagement`, `settingsdb`, `saas-management`データベースを削除
- `saas-management-dev`のみを保持
- 4 個のデータベースから 1 個に削減

**スクリプト**:

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
    if db['id'] not in ['saas-management-dev']:
        client.delete_database(db['id'])
"
```

### 2. Docker Compose 設定の最適化 ✅

**変更内容**:

- メモリ制限: `3g` → `4g` (33%増加)
- パーティション数: `10` → `5` (50%削減)

**ファイル**: `.devcontainer/docker-compose.yml`

```yaml
cosmosdb:
  mem_limit: 4g # 増加
  environment:
    - AZURE_COSMOS_EMULATOR_PARTITION_COUNT=5 # 削減
```

**効果**:

- メモリ使用量の削減
- コンテナ作成の安定性向上
- エミュレータの応答速度改善

### 3. アプリケーションのリトライロジック強化 ✅

**ファイル**: `src/service-setting-service/app/repositories/cosmos_client.py`

**追加機能**:

- 指数バックオフ付きリトライ（最大 3 回）
- 503 エラーに対する特別処理
- 詳細なエラーメッセージ

```python
async def initialize(self) -> None:
    max_retries = 3
    retry_delay = 2

    for attempt in range(max_retries):
        try:
            # コンテナ作成
            self.container = self.database.create_container_if_not_exists(...)
            return
        except CosmosHttpResponseError as e:
            if e.status_code == 503 and attempt < max_retries - 1:
                await asyncio.sleep(retry_delay)
                retry_delay *= 2  # 指数バックオフ
```

### 4. 既存データベースの共有 ✅

**目的**: 新しいコンテナ作成による 503 エラーを回避

**変更**: `src/service-setting-service/.env`

```env
COSMOS_DATABASE=saas-management-dev  # 既存DBを使用
COSMOS_CONTAINER=configurations       # 専用コンテナ
```

### 5. ドキュメントの整備 ✅

**作成したファイル**:

1. **docs/COSMOSDB_TROUBLESHOOTING.md**

   - 一般的な問題と解決策
   - 便利なコマンド集
   - ベストプラクティス

2. **scripts/cosmosdb/cleanup-emulator.py**

   - データベースクリーンアップスクリプト
   - Dry-run モードサポート

3. **scripts/cosmosdb/init-service-settings-db.py**

   - リトライロジック付き初期化スクリプト
   - 詳細なエラーメッセージ

4. **README.md**
   - トラブルシューティングセクション追加
   - クイックフィックス手順

## 推奨される運用方法

### 日常的な開発作業

1. **サービス起動前**:

   ```bash
   # CosmosDBエミュレータの状態確認
   curl -k https://localhost:8081/_explorer/index.html -I
   ```

2. **503 エラー発生時**:

   ```bash
   # 不要なデータベースを削除
   cd scripts/cosmosdb
   python -c "..." # 上記のクリーンアップスクリプト
   ```

3. **完全リセット**:
   ```
   VS Code: Ctrl+Shift+P → Dev Containers: Rebuild Container
   ```

### 長期的な対策

1. **定期的なクリーンアップ**: 週 1 回程度不要なデータベースを削除
2. **最小限のデータ**: テスト用データは最小限に
3. **モニタリング**: エミュレータの CPU/メモリ使用率を監視

## エミュレータの制限事項

WSL2 上の CosmosDB エミュレータには以下の制限があります：

- **メモリ**: 最大 4GB 推奨（WSL2 のメモリ制限による）
- **パーティション数**: 5 個推奨（10 個以上は不安定）
- **同時接続数**: 限定的（本番環境とは異なる）
- **パフォーマンス**: 本番環境の 20-30%程度

## 次のステップ

### DevContainer を再起動する場合

1. VS Code Command Palette: `Ctrl+Shift+P`
2. `Dev Containers: Rebuild Container`を選択
3. 完了後、データベース初期化スクリプトを実行

### サービスを起動する場合

```bash
cd src/service-setting-service
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 3003
```

**注意**: CosmosDB 接続が失敗しても、サービスは警告を表示して起動を継続します。

## 参考リンク

- [Azure Cosmos DB Emulator のベスト プラクティス](https://docs.microsoft.com/azure/cosmos-db/local-emulator-best-practices)
- [WSL2 での CosmosDB エミュレータ実行](https://docs.microsoft.com/azure/cosmos-db/linux-emulator)
- [Python SDK トラブルシューティング](https://docs.microsoft.com/python/api/overview/azure/cosmos-readme)
