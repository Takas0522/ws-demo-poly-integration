# CosmosDB 初期化スクリプトの修正と DevContainer 統合

## 修正概要

CosmosDB の初期化スクリプト(`scripts/cosmosdb/init-database.ts`)で発生していた型エラーとインデックスポリシーのエラーを修正し、DevContainer ビルド時に自動的に動作するように統合しました。

## 主な変更内容

### 1. CosmosDB 初期化スクリプトの修正 (`scripts/cosmosdb/init-database.ts`)

#### TypeScript 型エラーの修正

- **問題**: `@azure/cosmos` v4 の API で`kind: 'Hash'`と`throughput`プロパティが`ContainerDefinition`に存在しない
- **解決策**:
  - 新しい`ContainerConfig`インターフェースを作成
  - `throughput`を`offerThroughput`オプションとして`createIfNotExists()`に渡すように変更
  - `kind: 'Hash'`を削除（デフォルトで Hash パーティション）

#### インデックスポリシーエラーの修正

- **問題**: CosmosDB で必須のルートパス`"/"`がインデックスポリシーに含まれていない
- **解決策**: 各コンテナのインデックスポリシーの`includedPaths`に`{ path: '/*' }`を追加

### 2. DevContainer 統合

#### 新規ファイル: `.devcontainer/setup-env.sh`

- DevContainer 起動時に`.env`ファイルを自動生成
- `.env.development`から`.env`をコピー（存在しない場合のみ）
- フォールバックとして`.env.template`も使用可能

#### 更新ファイル: `.devcontainer/init-cosmosdb.sh`

- エラーハンドリングを改善
- データベース初期化とシードの実行結果を明確に表示

#### 更新ファイル: `.devcontainer/devcontainer.json`

- `postCreateCommand`に`setup-env.sh`を追加
- 環境セットアップ → バージョン確認 → DB 初期化の順で実行

#### 更新ファイル: `.devcontainer/docker-compose.yml`

- 環境変数名を統一: `COSMOS_DB_*` → `COSMOSDB_*`
- `COSMOSDB_DATABASE`を追加

#### 更新ファイル: `.devcontainer/README.md`

- 自動化された初期化プロセスを文書化
- トラブルシューティングセクションを拡充
- 環境変数の説明を更新

## DevContainer ビルド時の動作フロー

```
1. DevContainerビルド開始
   ↓
2. CosmosDBエミュレータ起動 (docker-compose.yml)
   ↓
3. setup-env.sh実行
   - .envファイルを.env.developmentから作成
   ↓
4. バージョン確認 (npm, python, az)
   ↓
5. init-cosmosdb.sh実行
   - CosmosDBエミュレータの起動待機 (最大5分)
   - npm依存関係インストール
   - データベースとコンテナ作成
   - 初期データのシード
   ↓
6. 開発環境準備完了
```

## 作成される CosmosDB リソース

### データベース

- **名前**: `saas-management-dev`

### コンテナ (4 つ)

1. **Tenants** - テナント情報
   - パーティションキー: `/tenantId`
   - スループット: 400 RU/s
2. **Users** - ユーザー情報
   - パーティションキー: `/tenantId`
   - スループット: 400 RU/s
   - 複合インデックス: tenantId+email, tenantId+status
3. **Permissions** - 権限情報
   - パーティションキー: `/tenantId`
   - スループット: 400 RU/s
4. **AuditLogs** - 監査ログ
   - パーティションキー: `/tenantId`
   - スループット: 400 RU/s
   - TTL: 90 日 (7,776,000 秒)
   - 複合インデックス: tenantId+timestamp, tenantId+userId+timestamp

## 初期データ

### デフォルトユーザー（開発用）

- **管理者**: `admin@example.com` / `Admin@123`
- **一般ユーザー**: `user@example.com` / `User@123`

⚠️ **重要**: 本番環境ではこれらのパスワードを必ず変更してください！

## 手動での初期化方法

DevContainer の自動初期化が失敗した場合、以下のコマンドで手動実行できます：

```bash
# 環境変数を設定
export COSMOSDB_ENDPOINT=https://localhost:8081
export COSMOSDB_KEY="C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw=="
export COSMOSDB_DATABASE=saas-management-dev

# スクリプトディレクトリに移動
cd /workspaces/ws-demo-poly-integration/scripts/cosmosdb

# 依存関係をインストール
npm install

# データベース初期化
npm run init

# データシード（オプション）
npm run seed
```

## 環境変数

必須の環境変数（`.env`ファイルまたは`export`で設定）：

```bash
COSMOSDB_ENDPOINT=https://localhost:8081
COSMOSDB_KEY=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw==
COSMOSDB_DATABASE=saas-management-dev
```

## トラブルシューティング

### TypeScript コンパイルエラー

- `node_modules`を削除して再インストール: `rm -rf node_modules && npm install`
- TypeScript バージョンを確認: `npx tsc --version`

### CosmosDB エミュレータに接続できない

- エミュレータの起動を確認: `curl -k https://localhost:8081/_explorer/emulator.pem`
- ヘルスチェックを実行: `.devcontainer/test-cosmosdb.sh`
- 環境変数を確認: `echo $COSMOSDB_ENDPOINT`

### データベース初期化が失敗する

- 既存のデータベースを削除してから再実行
- CosmosDB エミュレータを再起動: `docker restart <cosmosdb-container-id>`

## 参考資料

- [Azure Cosmos DB Node.js SDK v4](https://learn.microsoft.com/azure/cosmos-db/nosql/sdk-nodejs)
- [CosmosDB Emulator](https://learn.microsoft.com/azure/cosmos-db/local-emulator)
- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
