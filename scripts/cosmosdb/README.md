# CosmosDB スクリプト

このディレクトリには、SaaS 管理アプリケーションの CosmosDB データベースを初期化および管理するためのスクリプトが含まれています。

## 📁 ファイル

### スクリプト

- **`init-database.ts`** - 適切な設定でデータベースとコンテナを作成
- **`seed-data.ts`** - 初期開発データをデータベースに投入（レガシー・ハードコード版）
- **`seed-data-json.ts`** - JSON ベースの環境別シードデータローダー（推奨）
- **`cleanup-data.ts`** - データベースクリーンアップユーティリティ
- **`validation.ts`** - シードデータ検証ユーティリティ
- **`types.ts`** - すべてのデータベースモデルの TypeScript 型定義

### データファイル

- **`data/seeds/`** - 環境別の JSON シードデータファイル
  - **`development/`** - 開発環境用データ（複数のテナントとユーザー）
  - **`staging/`** - ステージング環境用データ（最小限のデータセット）
  - **`testing/`** - テスト環境用データ（テストケース用）

### ドキュメント

- **`README.md`** - このファイル
- **`README.en.md`** - 英語版ドキュメント

## 🚀 クイックスタート

### 前提条件

1. ローカルで実行中の CosmosDB エミュレータ または Azure CosmosDB インスタンス
2. Node.js 18+と npm がインストール済み
3. 必要な npm パッケージ：

```bash
npm install @azure/cosmos bcryptjs uuid
npm install --save-dev @types/bcryptjs @types/uuid ts-node typescript
```

### 環境変数の設定

`.env`ファイルを作成するか、環境変数を設定します：

```bash
# ローカルCosmosDBエミュレータ用
export COSMOSDB_ENDPOINT=https://localhost:8081
export COSMOSDB_KEY="C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
export COSMOSDB_DATABASE=saas-management-dev

# Azure CosmosDB用（本番環境）
export COSMOSDB_ENDPOINT=https://your-account.documents.azure.com:443/
export COSMOSDB_KEY="your-production-key-here"
export COSMOSDB_DATABASE=saas-management
```

⚠️ **重要**: 上記の CosmosDB エミュレータキーは、ローカル開発専用のデフォルト公開キーです。本番環境では絶対に使用しないでください。

### データベースの初期化

初期化スクリプトを実行してデータベースとコンテナを作成します：

```bash
# ディレクトリに移動
cd scripts/cosmosdb

# npmスクリプトを使用（推奨）
npm run init

# または直接ts-nodeを使用
npx ts-node init-database.ts
```

これにより以下が作成されます：

- データベース: `saas-management-dev`
- コンテナ:
  - **Tenants** - テナント/組織情報
  - **Users** - ユーザーアカウントとプロファイル
  - **Permissions** - 権限定義
  - **AuditLogs** - 監査証跡（90 日 TTL 付き）

### 開発データのシード

#### 🎯 推奨：JSON ベースのシードデータ（環境別）

環境別の JSON ファイルからシードデータをロードします（冪等性あり）：

```bash
cd scripts/cosmosdb

# 開発環境データをシード
npm run seed:json:dev

# ステージング環境データをシード
npm run seed:json:staging

# テスト環境データをシード
npm run seed:json:testing

# または環境を自動検出（NODE_ENVから）
npm run seed:json
```

#### レガシー：ハードコードシードスクリプト

元のハードコードスクリプトも利用可能です：

```bash
npm run seed
# または
npx ts-node seed-data.ts
```

#### 初期化とシードを一度に実行

```bash
npm run init:seed
```

### シードデータの構造

各環境のシードデータは `data/seeds/{environment}/` に保存されます：

```
data/seeds/
├── development/
│   ├── tenants.json       # 開発テナント（system-internal, dev-tenant, demo-tenant）
│   ├── users.json         # 開発ユーザー（管理者、マネージャー、ユーザー）
│   ├── permissions.json   # 全権限定義
│   ├── services.json      # サービスカタログ（V2: ファイル管理、外部共有、AIエージェント）
│   └── tenant-users.json  # マルチテナントユーザー関係（V2）
├── staging/
│   ├── tenants.json       # ステージングテナント（最小限）
│   ├── users.json         # ステージング管理者のみ
│   └── permissions.json   # 全権限定義
└── testing/
    ├── tenants.json       # テストテナント（複数）
    ├── users.json         # テストユーザー
    └── permissions.json   # テスト用基本権限
```

**開発環境のデフォルト認証情報:**

JSON ファイルを確認：`data/seeds/development/users.json`

**内部ユーザー（管理会社内、userType='internal'）:**

- **グローバル管理者** - `admin@company.com` / `InternalAdmin@123`
- **サポート（複数テナント所属）** - `support@company.com` / `Support@123`

**外部ユーザー（顧客組織、userType='external'）:**

- **開発テナント管理者** - `admin@example.com` / `Admin@123`
- **開発テナント一般ユーザー** - `user@example.com` / `User@123`
- **デモテナント管理者** - `demo-admin@example.com` / `DemoAdmin@123`

**V2 スキーマの新機能:**

- ✨ `system-internal` テナント: 管理会社用テナント（allowedDomains でメールドメイン制限）
- ✨ サービスカタログ: 3 つのサービス（ファイル管理、外部共有、AI エージェント）
- ✨ マルチテナント所属: 1 ユーザーが複数テナントに所属可能（TenantUsers レコード）
- ✨ userType/primaryTenantId: 内部/外部ユーザーを区別

⚠️ **重要:** 本番環境またはステージング環境にデプロイする前に、これらのパスワードを変更してください！

### データのクリーンアップ

データベースからデータを削除するクリーンアップユーティリティ：

```bash
cd scripts/cosmosdb

# データベース統計を表示
npm run cleanup:stats

# すべてのテナントをリスト表示
npm run cleanup:list

# 特定のテナントのデータを削除
npm run cleanup -- --tenant dev-tenant

# 特定のコンテナをクリーンアップ
npm run cleanup -- --container Users

# すべてのデータを削除（確認プロンプトあり）
npm run cleanup -- --all

# すべてのデータを削除（確認スキップ - 注意！）
npm run cleanup -- --all --confirm
```

⚠️ **警告:** クリーンアップ操作は破壊的で元に戻せません！

### シードデータの検証

シードデータは自動的に検証されます：

- ✅ スキーマ検証（型、必須フィールド）
- ✅ データ形式検証（メール、権限名、日付）
- ✅ 関係整合性チェック（テナント参照、権限参照）
- ✅ 重複チェック（テナント ID、メールアドレス）

検証エラーがある場合、シードは失敗します。警告は表示されますが、シードは続行されます。

## 📊 データベーススキーマ

### V2 スキーマ拡張（マルチテナント対応）

スキーマ V2 では、以下の機能が追加されています：

#### 新規コンテナ

1. **TenantUsers コンテナ** - ユーザーとテナントの多対多リレーション

   - パーティションキー: `/userId`
   - 用途: 1 ユーザーが複数テナントに所属可能
   - 主要フィールド: `userId`, `tenantId`, `roles`, `permissions`, `status`, `joinedAt`

2. **Services コンテナ** - サービスカタログ管理
   - パーティションキー: `/tenantId` (常に `system-internal`)
   - 用途: ファイル管理、外部共有、AI エージェント等のサービス定義
   - 主要フィールド: `name`, `displayName`, `category`, `status`, `requiredPlan`, `features`, `pricing`

#### 既存コンテナの拡張フィールド

**Tenants コンテナ:**

- `settings.allowedDomains` - 許可メールドメインの配列（例: `["@company.com"]`）
- `services` - テナントが利用可能なサービス一覧

**Users コンテナ:**

- `userType` - `'internal'`（管理会社内）または `'external'`（顧客組織）
- `primaryTenantId` - プライマリテナント ID（通常は `system-internal` または所属テナント）

### Tenants コンテナ

テナント（顧客組織）情報を保存します。

**パーティションキー:** `/tenantId`

**スループット:** 400 RU/s（手動）またはオートスケール（400-4000 RU/s）

#### 主要フィールド

- `id` - 一意のテナント識別子
- `tenantId` - id と同じ（パーティションキー）
- `name` - 組織名
- `status` - テナントステータス（active, suspended, inactive）
- `subscription` - サブスクリプションプランと詳細
- `settings` - テナント固有の設定
- `settings.allowedDomains` - 【V2】許可メールドメイン配列
- `services` - 【V2】テナントが利用可能なサービス一覧

### Users コンテナ

ユーザーアカウントと認証情報を保存します。

**パーティションキー:** `/tenantId`

**スループット:** 400 RU/s（手動）またはオートスケール（400-4000 RU/s）

#### 主要フィールド

- `id` - 一意のユーザー識別子
- `tenantId` - テナント識別子（パーティションキー）
- `email` - ユーザーメールアドレス
- `username` - ユーザー名
- `passwordHash` - Bcrypt でハッシュ化されたパスワード
- `status` - ユーザーステータス（active, inactive, suspended, locked）
- `roles` - ロール名の配列
- `permissions` - ドット記法の権限の配列
- `profile` - ユーザープロファイル情報
- `security` - セキュリティ関連フィールド
- `userType` - 【V2】`'internal'` または `'external'`
- `primaryTenantId` - 【V2】プライマリテナント ID

### Permissions コンテナ

ドット記法の権限定義を保存します。

**パーティションキー:** `/tenantId`

**スループット:** 400 RU/s（手動）またはオートスケール（400-4000 RU/s）

#### 主要フィールド

- `id` - 一意の権限識別子
- `tenantId` - テナント識別子（パーティションキー）
- `name` - ドット記法の権限名（例：`users.create`）
- `category` - 権限カテゴリ（users, services, settings, system）
- `action` - アクションタイプ（create, read, update, delete, execute）
- `scope` - 権限スコープ（tenant, global, own）

### AuditLogs コンテナ

すべてのデータ変更の監査証跡を保存します。

**パーティションキー:** `/tenantId`

**TTL:** 7,776,000 秒（90 日）

**スループット:** 400 RU/s（手動）またはオートスケール（400-4000 RU/s）

#### 主要フィールド

- `id` - 一意のログ識別子
- `tenantId` - テナント識別子（パーティションキー）
- `timestamp` - アクションのタイムスタンプ
- `userId` - アクションを実行したユーザー
- `action` - 実行されたアクション（形式：`{resource}.{action}`）
- `resource` - リソース情報
- `status` - アクションステータス（success, failure, warning）
- `ttl` - 有効期限（秒単位）

## 🔍 データのクエリ

### ポイント読み取り（最も効率的 - 1 RU）

```typescript
import { CosmosClient } from "@azure/cosmos";

const client = new CosmosClient({ endpoint, key });
const container = client.database(databaseId).container("Users");

// 最も効率的なクエリ - IDとパーティションキーの両方が必要
const { resource: user } = await container
  .item("user-123", "tenant-456")
  .read();
```

### 単一パーティションクエリ（効率的）

```typescript
// 単一テナントパーティション内でのクエリ
const querySpec = {
  query: "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status = @status",
  parameters: [
    { name: "@tenantId", value: "tenant-123" },
    { name: "@status", value: "active" },
  ],
};

const { resources: users } = await container.items.query(querySpec).fetchAll();
```

### ページネーション

```typescript
// 大量の結果セットを効率的にページネーション
const queryIterator = container.items.query(querySpec, {
  maxItemCount: 20,
});

while (queryIterator.hasMoreResults()) {
  const { resources: page } = await queryIterator.fetchNext();
  // ページを処理
}
```

## 🛠️ メンテナンススクリプト

### カスタムシードデータの作成

独自のシードデータセットを作成するには：

1. 新しい環境ディレクトリを作成：

```bash
mkdir -p scripts/cosmosdb/data/seeds/my-environment
```

2. JSON ファイルを作成：

```bash
# テナント、ユーザー、権限用のJSONファイルを作成
touch scripts/cosmosdb/data/seeds/my-environment/{tenants,users,permissions}.json
```

3. 既存のファイルを参考にデータを入力

4. カスタム環境でシード：

```bash
cd scripts/cosmosdb
npx ts-node seed-data-json.ts my-environment
```

### シードデータのバージョン管理

シードデータファイルは Git で管理されており、環境ごとの履歴を追跡できます：

```bash
# 新しいシードデータセットを追加
git add scripts/cosmosdb/data/seeds/
git commit -m "Add new seed data for feature X"

# ブランチ間でシードデータを切り替え
git checkout feature-branch
npm run seed:json:dev
```

### データのバックアップ

```bash
# すべてのデータをJSONファイルにエクスポート
az cosmosdb sql container export \
  --resource-group myResourceGroup \
  --account-name myCosmosAccount \
  --database-name saas-management \
  --name Users \
  --output-format json
```

### RU 使用量の監視

```typescript
// クエリで消費されたリクエストユニットを追跡
const { resources, requestCharge } = await container.items
  .query(querySpec)
  .fetchAll();

console.log(`クエリで消費したRU: ${requestCharge}`);
```

## 🔐 セキュリティのベストプラクティス

1. **シークレットをコミットしない** - CosmosDB キーをバージョン管理に含めない
2. **環境変数を使用** - 認証情報は環境変数または Azure Key Vault に保存
3. **定期的にキーをローテーション** - CosmosDB キーを定期的に再生成
4. **テナントコンテキストを検証** - 認証トークンから tenantId を常に検証
5. **パスワードをハッシュ化** - bcrypt を最低 10 ソルトラウンドで使用
6. **機密データを暗号化** - 保存前に二要素認証シークレットと PII を暗号化
7. **監査ログを有効化** - すべてのデータアクセスと変更をログ記録

## 📈 パフォーマンス最適化

### ベストプラクティス

1. ✅ **常に tenantId を含める** - すべてのクエリにパーティションキーを含める
2. ✅ **ポイント読み取りを使用** - ID と partitionKey の両方がわかる場合は`item(id, partitionKey).read()`を優先
3. ✅ **ページネーションを実装** - 大量の結果セットを一度に取得しない
4. ✅ **RU 消費を監視** - 本番環境でリクエストユニットの使用状況を追跡
5. ✅ **クエリ対象のフィールドのみにインデックスを付ける**
6. ✅ **一時データに TTL を使用** - 監査ログとセッションに TTL を有効化
7. ❌ **ユーザーフローでクロスパーティションクエリを避ける** - 管理/分析のみに使用

### クエリコスト比較

| クエリタイプ               | 推定 RU コスト | ユースケース             |
| -------------------------- | -------------- | ------------------------ |
| ポイント読み取り           | 1 RU           | ID で単一アイテムを取得  |
| 単一パーティションクエリ   | 2-10 RU        | 1 つのテナント内でクエリ |
| クロスパーティションクエリ | 10-100+ RU     | 管理/分析のみ            |
| フルスキャン               | 100-1000+ RU   | 本番環境では避ける       |

## 🔗 参考資料

- [スキーマドキュメント](../../docs/database/SCHEMA.md)
- [スキーマ移行ガイド V2](../../docs/database/SCHEMA_MIGRATION_V2.md)
- [マルチテナント実装ガイド](../../docs/MULTI_TENANT_IMPLEMENTATION.md)
- [ADR 003: CosmosDB スキーマ設計](../../docs/adr/003-cosmosdb-schema-tenant-partitioning.md)
- [Azure CosmosDB ドキュメント](https://docs.microsoft.com/azure/cosmos-db/)
- [パーティショニングのベストプラクティス](https://docs.microsoft.com/azure/cosmos-db/partitioning-overview)

## � トラブルシューティング

### CosmosDB エミュレータで 503 エラーが発生する

**症状**: `init-database.ts`実行時に「Sorry, we are currently experiencing high demand」エラー

**原因**: CosmosDB エミュレータがリソース不足になっている

**解決策**:

1. **エミュレータを再起動**:

   ```bash
   docker-compose restart cosmosdb
   # 起動を待つ（30秒程度）
   sleep 30
   ```

2. **V2 コンテナを別途作成**:

   ```bash
   # 基本的なコンテナを作成
   npx ts-node init-database.ts

   # 少し待機してからV2コンテナを作成
   sleep 5
   npx ts-node init-v2-containers.ts
   ```

3. **リトライ**:
   ```bash
   # スクリプトは自動的にリトライするため、単に再実行
   npx ts-node init-database.ts
   ```

### 接続エラー（401 Unauthorized）

**症状**: 「The input authorization token can't serve the request」

**解決策**:

1. 環境変数が正しく設定されているか確認
2. CosmosDB キーが正しいか確認
3. エミュレータの場合、標準キーを使用:
   ```bash
   export COSMOSDB_KEY="C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
   ```

### コンテナが見つからない（404 Not Found）

**症状**: シード実行時に「Resource Not Found」

**原因**: `init-database.ts`が完了していない

**解決策**:

```bash
# データベース初期化を再実行
npx ts-node init-database.ts

# V2コンテナが必要な場合
npx ts-node init-v2-containers.ts
```

### DevContainer 起動時の postCreateCommand エラー

**症状**: DevContainer ビルド時に CosmosDB 初期化が失敗

**解決策**:

1. **一部のコンテナが作成されている場合**: 問題ありません。手動で残りを作成できます
2. **完全に失敗している場合**:

   ```bash
   # DevContainer内で手動実行
   cd /workspaces/ws-demo-poly-integration/scripts/cosmosdb

   # 環境変数を設定
   export COSMOSDB_ENDPOINT=https://localhost:8081
   export COSMOSDB_KEY="C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
   export COSMOSDB_DATABASE=saas-management-dev
   export NODE_TLS_REJECT_UNAUTHORIZED=0

   # 依存関係をインストール
   npm install

   # 初期化を実行
   npx ts-node init-database.ts
   npx ts-node init-v2-containers.ts
   npx ts-node seed-data.ts
   ```

### データベースのリセット

開発中にデータベースを完全にリセットしたい場合:

```bash
# 既存のデータベースを削除
# 注意: すべてのデータが失われます！
az cosmosdb sql database delete \
  --account-name your-account \
  --name saas-management-dev \
  --yes

# または CosmosDB Data Explorer で手動削除

# 再初期化
npx ts-node init-database.ts
npx ts-node seed-data.ts
```

## �📝 変更履歴

### 2026-01-12

- **V2 スキーマ対応**: サービスカタログ、マルチテナント所属、allowedDomains 設定を追加
- `services.json` 追加: ファイル管理、外部共有、AI エージェントの 3 サービス
- `tenant-users.json` 追加: マルチテナントユーザー関係のサンプルデータ
- `system-internal` テナント追加: 管理会社用テナント
- ユーザーに `userType` と `primaryTenantId` フィールドを追加
- テナントに `allowedDomains` と `services` フィールドを追加
- seed-data.ts に V2 対応の seeding 関数を追加

### 2026-01-09

- 初期データベーススキーマ設計
- 初期化とシードスクリプトの作成
- TypeScript 型定義の定義
- スキーマとアクセスパターンの文書化

---

**最終更新:** 2026-01-09
