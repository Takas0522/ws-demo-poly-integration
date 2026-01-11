# CosmosDBスクリプト

このディレクトリには、SaaS管理アプリケーションのCosmosDBデータベースを初期化および管理するためのスクリプトが含まれています。

## 📁 ファイル

- **`init-database.ts`** - 適切な設定でデータベースとコンテナを作成
- **`seed-data.ts`** - 初期開発データをデータベースに投入
- **`types.ts`** - すべてのデータベースモデルのTypeScript型定義
- **`README.md`** - このファイル

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
# ts-nodeを使用
npx ts-node scripts/cosmosdb/init-database.ts

# または最初にコンパイル
tsc scripts/cosmosdb/init-database.ts
node scripts/cosmosdb/init-database.js
```

これにより以下が作成されます：
- データベース: `saas-management-dev`
- コンテナ:
  - **Tenants** - テナント/組織情報
  - **Users** - ユーザーアカウントとプロファイル
  - **Permissions** - 権限定義
  - **AuditLogs** - 監査証跡（90日TTL付き）

### 開発データのシード

シードスクリプトを実行して初期データを投入します：

```bash
npx ts-node scripts/cosmosdb/seed-data.ts
```

これにより以下が作成されます：
- 1つのデフォルトテナント（`dev-tenant`）
- 2人のユーザー（管理者と一般ユーザー）
- 13の権限定義
- 2つのサンプル監査ログエントリ

**デフォルト認証情報:**
- **管理者ユーザー**
  - Email: `admin@example.com`
  - Password: `Admin@123`
  - ロール: admin, user
  
- **一般ユーザー**
  - Email: `user@example.com`
  - Password: `User@123`
  - ロール: user

⚠️ **重要:** 本番環境またはステージング環境にデプロイする前に、これらのパスワードを変更してください！

## 📊 データベーススキーマ

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
- [ADR 003: CosmosDBスキーマ設計](../../docs/adr/003-cosmosdb-schema-tenant-partitioning.md)
- [Azure CosmosDB ドキュメント](https://docs.microsoft.com/azure/cosmos-db/)
- [パーティショニングのベストプラクティス](https://docs.microsoft.com/azure/cosmos-db/partitioning-overview)

## 📝 変更履歴

### 2026-01-09
- 初期データベーススキーマ設計
- 初期化とシードスクリプトの作成
- TypeScript型定義の定義
- スキーマとアクセスパターンの文書化

---

**最終更新:** 2026-01-09
