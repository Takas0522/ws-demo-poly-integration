# CosmosDBスクリプト

このディレクトリには、SaaS管理アプリケーションのCosmosDBデータベースを初期化および管理するためのスクリプトが含まれています。

## 📁 ファイル

### スクリプト
- **`init-database.ts`** - 適切な設定でデータベースとコンテナを作成
- **`seed-data.ts`** - 初期開発データをデータベースに投入（レガシー・ハードコード版）
- **`seed-data-json.ts`** - JSONベースの環境別シードデータローダー（推奨）
- **`cleanup-data.ts`** - データベースクリーンアップユーティリティ
- **`validation.ts`** - シードデータ検証ユーティリティ
- **`types.ts`** - すべてのデータベースモデルのTypeScript型定義

### データファイル
- **`data/seeds/`** - 環境別のJSONシードデータファイル
  - **`development/`** - 開発環境用データ（複数のテナントとユーザー）
  - **`staging/`** - ステージング環境用データ（最小限のデータセット）
  - **`testing/`** - テスト環境用データ（テストケース用）

### ドキュメント
- **`README.md`** - このファイル
- **`README.en.md`** - 英語版ドキュメント

## 🚀 クイックスタート

### 前提条件

1. ローカルで実行中のCosmosDBエミュレータ または Azure CosmosDBインスタンス
2. Node.js 18+とnpmがインストール済み
3. 必要なnpmパッケージ：

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

⚠️ **重要**: 上記のCosmosDBエミュレータキーは、ローカル開発専用のデフォルト公開キーです。本番環境では絶対に使用しないでください。

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
  - **AuditLogs** - 監査証跡（90日TTL付き）

### 開発データのシード

#### 🎯 推奨：JSONベースのシードデータ（環境別）

環境別のJSONファイルからシードデータをロードします（冪等性あり）：

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

JSONファイルを確認：`data/seeds/development/users.json`

**内部ユーザー（管理会社内、userType='internal'）:**
- **グローバル管理者** - `admin@company.com` / `InternalAdmin@123`
- **サポート（複数テナント所属）** - `support@company.com` / `Support@123`

**外部ユーザー（顧客組織、userType='external'）:**
- **開発テナント管理者** - `admin@example.com` / `Admin@123`
- **開発テナント一般ユーザー** - `user@example.com` / `User@123`  
- **デモテナント管理者** - `demo-admin@example.com` / `DemoAdmin@123`

**V2スキーマの新機能:**
- ✨ `system-internal` テナント: 管理会社用テナント（allowedDomainsでメールドメイン制限）
- ✨ サービスカタログ: 3つのサービス（ファイル管理、外部共有、AIエージェント）
- ✨ マルチテナント所属: 1ユーザーが複数テナントに所属可能（TenantUsersレコード）
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
- ✅ 重複チェック（テナントID、メールアドレス）

検証エラーがある場合、シードは失敗します。警告は表示されますが、シードは続行されます。

## 📊 データベーススキーマ

### V2スキーマ拡張（マルチテナント対応）

スキーマV2では、以下の機能が追加されています：

#### 新規コンテナ

1. **TenantUsersコンテナ** - ユーザーとテナントの多対多リレーション
   - パーティションキー: `/userId`
   - 用途: 1ユーザーが複数テナントに所属可能
   - 主要フィールド: `userId`, `tenantId`, `roles`, `permissions`, `status`, `joinedAt`

2. **Servicesコンテナ** - サービスカタログ管理
   - パーティションキー: `/tenantId` (常に `system-internal`)
   - 用途: ファイル管理、外部共有、AIエージェント等のサービス定義
   - 主要フィールド: `name`, `displayName`, `category`, `status`, `requiredPlan`, `features`, `pricing`

#### 既存コンテナの拡張フィールド

**Tenantsコンテナ:**
- `settings.allowedDomains` - 許可メールドメインの配列（例: `["@company.com"]`）
- `services` - テナントが利用可能なサービス一覧

**Usersコンテナ:**
- `userType` - `'internal'`（管理会社内）または `'external'`（顧客組織）
- `primaryTenantId` - プライマリテナントID（通常は `system-internal` または所属テナント）

### Tenantsコンテナ

テナント（顧客組織）情報を保存します。

**パーティションキー:** `/tenantId`

**スループット:** 400 RU/s（手動）またはオートスケール（400-4000 RU/s）

#### 主要フィールド
- `id` - 一意のテナント識別子
- `tenantId` - idと同じ（パーティションキー）
- `name` - 組織名
- `status` - テナントステータス（active, suspended, inactive）
- `subscription` - サブスクリプションプランと詳細
- `settings` - テナント固有の設定
- `settings.allowedDomains` - 【V2】許可メールドメイン配列
- `services` - 【V2】テナントが利用可能なサービス一覧

### Usersコンテナ

ユーザーアカウントと認証情報を保存します。

**パーティションキー:** `/tenantId`

**スループット:** 400 RU/s（手動）またはオートスケール（400-4000 RU/s）

#### 主要フィールド
- `id` - 一意のユーザー識別子
- `tenantId` - テナント識別子（パーティションキー）
- `email` - ユーザーメールアドレス
- `username` - ユーザー名
- `passwordHash` - Bcryptでハッシュ化されたパスワード
- `status` - ユーザーステータス（active, inactive, suspended, locked）
- `roles` - ロール名の配列
- `permissions` - ドット記法の権限の配列
- `profile` - ユーザープロファイル情報
- `security` - セキュリティ関連フィールド
- `userType` - 【V2】`'internal'` または `'external'`
- `primaryTenantId` - 【V2】プライマリテナントID

### Permissionsコンテナ

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

### AuditLogsコンテナ

すべてのデータ変更の監査証跡を保存します。

**パーティションキー:** `/tenantId`

**TTL:** 7,776,000秒（90日）

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
import { CosmosClient } from '@azure/cosmos';

const client = new CosmosClient({ endpoint, key });
const container = client.database(databaseId).container('Users');

// 最も効率的なクエリ - IDとパーティションキーの両方が必要
const { resource: user } = await container
  .item('user-123', 'tenant-456')
  .read();
```

### 単一パーティションクエリ（効率的）

```typescript
// 単一テナントパーティション内でのクエリ
const querySpec = {
  query: 'SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status = @status',
  parameters: [
    { name: '@tenantId', value: 'tenant-123' },
    { name: '@status', value: 'active' }
  ]
};

const { resources: users } = await container.items
  .query(querySpec)
  .fetchAll();
```

### ページネーション

```typescript
// 大量の結果セットを効率的にページネーション
const queryIterator = container.items.query(querySpec, {
  maxItemCount: 20
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

2. JSONファイルを作成：
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

シードデータファイルはGitで管理されており、環境ごとの履歴を追跡できます：

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

### RU使用量の監視

```typescript
// クエリで消費されたリクエストユニットを追跡
const { resources, requestCharge } = await container.items
  .query(querySpec)
  .fetchAll();

console.log(`クエリで消費したRU: ${requestCharge}`);
```

## 🔐 セキュリティのベストプラクティス

1. **シークレットをコミットしない** - CosmosDBキーをバージョン管理に含めない
2. **環境変数を使用** - 認証情報は環境変数またはAzure Key Vaultに保存
3. **定期的にキーをローテーション** - CosmosDBキーを定期的に再生成
4. **テナントコンテキストを検証** - 認証トークンからtenantIdを常に検証
5. **パスワードをハッシュ化** - bcryptを最低10ソルトラウンドで使用
6. **機密データを暗号化** - 保存前に二要素認証シークレットとPIIを暗号化
7. **監査ログを有効化** - すべてのデータアクセスと変更をログ記録

## 📈 パフォーマンス最適化

### ベストプラクティス

1. ✅ **常にtenantIdを含める** - すべてのクエリにパーティションキーを含める
2. ✅ **ポイント読み取りを使用** - IDとpartitionKeyの両方がわかる場合は`item(id, partitionKey).read()`を優先
3. ✅ **ページネーションを実装** - 大量の結果セットを一度に取得しない
4. ✅ **RU消費を監視** - 本番環境でリクエストユニットの使用状況を追跡
5. ✅ **クエリ対象のフィールドのみにインデックスを付ける**
6. ✅ **一時データにTTLを使用** - 監査ログとセッションにTTLを有効化
7. ❌ **ユーザーフローでクロスパーティションクエリを避ける** - 管理/分析のみに使用

### クエリコスト比較

| クエリタイプ | 推定RUコスト | ユースケース |
|------------|-------------|-------------|
| ポイント読み取り | 1 RU | IDで単一アイテムを取得 |
| 単一パーティションクエリ | 2-10 RU | 1つのテナント内でクエリ |
| クロスパーティションクエリ | 10-100+ RU | 管理/分析のみ |
| フルスキャン | 100-1000+ RU | 本番環境では避ける |

## 🔗 参考資料

- [スキーマドキュメント](../../docs/database/SCHEMA.md)
- [スキーマ移行ガイドV2](../../docs/database/SCHEMA_MIGRATION_V2.md)
- [マルチテナント実装ガイド](../../docs/MULTI_TENANT_IMPLEMENTATION.md)
- [ADR 003: CosmosDBスキーマ設計](../../docs/adr/003-cosmosdb-schema-tenant-partitioning.md)
- [Azure CosmosDB ドキュメント](https://docs.microsoft.com/azure/cosmos-db/)
- [パーティショニングのベストプラクティス](https://docs.microsoft.com/azure/cosmos-db/partitioning-overview)

## 📝 変更履歴

### 2026-01-12
- **V2スキーマ対応**: サービスカタログ、マルチテナント所属、allowedDomains設定を追加
- `services.json` 追加: ファイル管理、外部共有、AIエージェントの3サービス
- `tenant-users.json` 追加: マルチテナントユーザー関係のサンプルデータ
- `system-internal` テナント追加: 管理会社用テナント
- ユーザーに `userType` と `primaryTenantId` フィールドを追加
- テナントに `allowedDomains` と `services` フィールドを追加
- seed-data.ts に V2 対応の seeding 関数を追加

### 2026-01-09
- 初期データベーススキーマ設計
- 初期化とシードスクリプトの作成
- TypeScript型定義の定義
- スキーマとアクセスパターンの文書化

---

**最終更新:** 2026-01-09
