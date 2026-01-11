# CosmosDB スキーマドキュメント

## 概要

このドキュメントは、SaaS管理アプリケーションのCosmosDBデータベーススキーマの包括的なガイドを提供します。スキーマはマルチテナンシーを考慮して設計されており、すべてのコンテナでテナントIDをパーティションキーとして使用しています。

## データベース情報

- **データベース名**: `saas-management`（本番環境）、`saas-management-dev`（開発環境）
- **API**: SQL API（Core）
- **パーティション戦略**: `/tenantId`を使用したテナントベースのパーティショニング
- **整合性レベル**: セッション（ほとんどの操作のデフォルト）

## コンテナ

### 1. Tenants コンテナ

**目的**: テナント（顧客組織）情報とサブスクリプション詳細を保存

**パーティションキー**: `/tenantId`

**スループット**: 400 RU/s（手動）またはオートスケール（400-4000 RU/s）

#### スキーマ

| フィールド | 型 | 必須 | 説明 |
|-------|------|------|------|
| id | string | はい | 一意のテナント識別子（形式：`tenant-{uuid}`）|
| tenantId | string | はい | idと同じ、パーティションキーとして使用 |
| name | string | はい | テナント組織名 |
| status | string | はい | テナントステータス：`active`、`suspended`、`inactive` |
| subscription | object | はい | サブスクリプション詳細 |
| settings | object | いいえ | テナント固有の設定 |
| createdAt | string | はい | ISO 8601タイムスタンプ |
| updatedAt | string | はい | ISO 8601タイムスタンプ |

#### ドキュメント例

```json
{
  "id": "tenant-123",
  "tenantId": "tenant-123",
  "name": "Acme Corporation",
  "status": "active",
  "subscription": {
    "plan": "enterprise",
    "startDate": "2026-01-01T00:00:00Z",
    "endDate": "2027-01-01T00:00:00Z",
    "maxUsers": 100
  },
  "settings": {
    "timezone": "Asia/Tokyo",
    "locale": "ja-JP",
    "features": {
      "twoFactorAuth": true,
      "apiAccess": true
    }
  },
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-09T00:00:00Z"
}
```

### 2. Users コンテナ

**目的**: ユーザーアカウント、プロファイル、認証情報を保存

**パーティションキー**: `/tenantId`

**スループット**: 400 RU/s（手動）またはオートスケール（400-4000 RU/s）

#### スキーマ

| フィールド | 型 | 必須 | 説明 |
|-------|------|------|------|
| id | string | はい | 一意のユーザー識別子（形式：`user-{uuid}`）|
| tenantId | string | はい | テナント識別子（パーティションキー）|
| email | string | はい | ユーザーメールアドレス（テナント内で一意）|
| username | string | はい | ユーザー名（テナント内で一意）|
| passwordHash | string | はい | Bcryptでハッシュ化されたパスワード |
| status | string | はい | ユーザーステータス：`active`、`inactive`、`suspended`、`locked` |
| roles | string[] | はい | ロール名の配列 |
| permissions | string[] | はい | ドット記法の権限の配列 |
| profile | object | いいえ | ユーザープロファイル情報 |
| security | object | はい | セキュリティ関連フィールド |

#### 一般的なクエリ

```typescript
// ユーザーをIDで取得（ポイント読み取り - 最も効率的）
const user = await container.item("user-456", "tenant-123").read();

// テナントのユーザーを取得（単一パーティションクエリ）
SELECT * FROM c 
WHERE c.tenantId = 'tenant-123' 
AND c.status = 'active'
ORDER BY c.createdAt DESC

// テナント内のメールでユーザーを取得
SELECT * FROM c 
WHERE c.tenantId = 'tenant-123' 
AND c.email = 'user@example.com'
```

### 3. Permissions コンテナ

**目的**: きめ細かいアクセス制御のためのドット記法の権限定義を保存

**パーティションキー**: `/tenantId`

**スループット**: 400 RU/s（手動）またはオートスケール（400-4000 RU/s）

#### スキーマ

| フィールド | 型 | 必須 | 説明 |
|-------|------|------|------|
| id | string | はい | 一意の権限識別子 |
| tenantId | string | はい | テナント識別子（パーティションキー）|
| name | string | はい | ドット記法の権限名（例：`users.create`）|
| displayName | string | はい | 人間が読める表示名 |
| category | string | はい | 権限カテゴリ：`users`、`services`、`settings`、`system` |
| action | string | はい | アクションタイプ：`create`、`read`、`update`、`delete`、`execute` |
| scope | string | はい | 権限スコープ：`tenant`、`global`、`own` |

### 4. AuditLogs コンテナ

**目的**: すべてのデータ変更とユーザーアクションの監査証跡を保存

**パーティションキー**: `/tenantId`

**TTL**: 有効（デフォルトTTL 7,776,000秒 = 90日）

**スループット**: 400 RU/s（手動）またはオートスケール（400-4000 RU/s）

#### スキーマ

| フィールド | 型 | 必須 | 説明 |
|-------|------|------|------|
| id | string | はい | 一意のログ識別子 |
| tenantId | string | はい | テナント識別子（パーティションキー）|
| timestamp | string | はい | アクションのISO 8601タイムスタンプ |
| userId | string | はい | アクションを実行したユーザー |
| action | string | はい | 実行されたアクション（形式：`{resource}.{action}`）|
| resource | object | はい | リソース情報 |
| status | string | はい | アクションステータス：`success`、`failure`、`warning` |
| ttl | number | いいえ | 有効期限（秒単位、-1は無期限）|

## データアクセスパターン

### パターン1: ポイント読み取り（最も効率的）

IDとパーティションキーの両方がわかる場合に使用：

```typescript
const { resource } = await container.item(id, tenantId).read();
// コスト: 1 RU
```

### パターン2: 単一パーティションクエリ（効率的）

単一テナントパーティション内でクエリ：

```typescript
const querySpec = {
  query: "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status = @status",
  parameters: [
    { name: "@tenantId", value: "tenant-123" },
    { name: "@status", value: "active" }
  ]
};
const { resources } = await container.items.query(querySpec).fetchAll();
// コスト: 結果サイズに応じて2-10 RU
```

### パターン3: ページネーション

大きな結果セットを効率的に取得：

```typescript
const queryIterator = container.items.query(querySpec, {
  maxItemCount: 20
});

while (queryIterator.hasMoreResults()) {
  const { resources } = await queryIterator.fetchNext();
  // ページを処理
}
```

## パフォーマンス最適化

### ベストプラクティス

1. **常にtenantIdを含める** - すべてのクエリにパーティションキーを含める
2. **ポイント読み取りを使用** - クエリよりも`item(id, partitionKey).read()`を優先
3. **ページネーションを実装** - すべての結果を一度に取得しない
4. **RU消費を監視** - 本番環境でリクエストユニットの使用状況を追跡
5. **インデックスを最適化** - クエリ対象のフィールドのみにインデックスを付ける

### 避けるべきアンチパターン

❌ ユーザーフローでパーティションキーなしのクエリ
❌ 特定のフィールドのみが必要な場合に`SELECT *`を使用
❌ 大量の結果セットでページネーションなし
❌ すべてのフィールドにインデックスを付ける（過剰インデックス）
❌ 頻繁なクロスパーティションクエリ

## セキュリティ考慮事項

### データ分離

- テナントIDパーティショニングにより物理的なデータ分離を保証
- アプリケーション層で常にtenantIdを検証
- クライアント提供のテナントIDを信頼しない
- 認証からテナントコンテキストを挿入するミドルウェアを使用

### 機密データ

- パスワードハッシュ: ソルトラウンド10以上のbcryptを使用
- 二要素認証シークレット: 保存前に暗号化
- 監査ログ: パスワードやシークレットをログに記録しない
- 個人データ: PIIフィールドの暗号化を検討

## 参考資料

- [Azure CosmosDB ドキュメント](https://docs.microsoft.com/azure/cosmos-db/)
- [パーティショニングのベストプラクティス](https://docs.microsoft.com/azure/cosmos-db/partitioning-overview)
- [SQLクエリリファレンス](https://docs.microsoft.com/azure/cosmos-db/sql-query-getting-started)
- [ADR 003: CosmosDBスキーマとテナントパーティショニング](../adr/003-cosmosdb-schema-tenant-partitioning.md)

**最終更新**: 2026-01-09
