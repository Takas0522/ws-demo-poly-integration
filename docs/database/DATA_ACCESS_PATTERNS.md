# CosmosDB データアクセスパターン

このドキュメントでは、SaaS管理アプリケーションのCosmosDB実装における推奨データアクセスパターンについて説明します。

## 概要

アプリケーションはテナントベースのパーティショニング（`/tenantId`）を使用したAzure CosmosDBを使用します。この設計により以下が可能になります：
- テナントごとの効率的なデータ分離
- テナント境界内での最適なクエリパフォーマンス
- テナントが増加しても自動的にスケーラビリティ

## 主要な原則

1. **常にtenantIdを含める** - すべてのクエリにパーティションキーを含める必要があります
2. **ポイント読み取りを優先** - 可能な限り`item(id, partitionKey).read()`を使用
3. **結果をページネーション** - すべての結果を一度に取得しない
4. **RU消費を監視** - リクエストユニットの使用状況を追跡し最適化
5. **クロスパーティションクエリを避ける** - 管理/分析のみに使用

## パターンカテゴリ

### 1. ポイント読み取りパターン（最も効率的）

**ユースケース**: IDとパーティションキーの両方がわかっている場合に単一ドキュメントを取得

**RUコスト**: 1 RU

**例**:
```typescript
import { CosmosClient } from '@azure/cosmos';

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);
const container = database.container('Users');

// 最も効率的 - IDとパーティションキーの両方が必要
const { resource: user } = await container
  .item('user-123', 'tenant-456')
  .read();

console.log(`ユーザー: ${user.email}`);
```

**使用するタイミング**:
- 認証トークンからIDでユーザーを取得
- テナント設定をロード
- 特定の権限または監査ログを取得

---

### 2. 単一パーティションクエリパターン（効率的）

**ユースケース**: 単一テナントパーティション内でドキュメントをクエリ

**RUコスト**: 2-10 RU（結果サイズとインデックスに依存）

**例**:
```typescript
// テナントのすべてのアクティブユーザーを取得
const querySpec = {
  query: `
    SELECT * FROM c 
    WHERE c.tenantId = @tenantId 
    AND c.status = @status
    ORDER BY c.createdAt DESC
  `,
  parameters: [
    { name: '@tenantId', value: 'tenant-456' },
    { name: '@status', value: 'active' }
  ]
};

const { resources: users } = await container.items
  .query(querySpec)
  .fetchAll();
```

**使用するタイミング**:
- テナント内のユーザーリスト
- テナントの権限を検索
- テナントの最近の監査ログ

**最適化のヒント**:
- 必要なフィールドのみを選択: `SELECT c.id, c.email FROM c`
- WHERE句でインデックス付きフィールドを使用
- 必要な場合のみORDER BYを追加

---

### 3. ページネーションパターン（大規模データセットに必須）

**ユースケース**: 管理可能なチャンクで大規模な結果セットを取得

**RUコスト**: ページごとに可変（通常ページあたり2-5 RU）

**例**:
```typescript
// ページネーションされたユーザーリスト
const querySpec = {
  query: `
    SELECT * FROM c 
    WHERE c.tenantId = @tenantId 
    ORDER BY c.createdAt DESC
  `,
  parameters: [
    { name: '@tenantId', value: 'tenant-456' }
  ]
};

const queryIterator = container.items.query(querySpec, {
  maxItemCount: 20 // ページサイズ
});

const allPages = [];
while (queryIterator.hasMoreResults()) {
  const { resources: page, continuationToken } = await queryIterator.fetchNext();
  allPages.push(page);
  
  // 次のページリクエストのためにcontinuationTokenを保存
  if (!queryIterator.hasMoreResults()) {
    console.log('すべてのページを取得しました');
  }
}
```

**使用するタイミング**:
- 多数のレコードを持つユーザーリスト
- 監査ログ履歴
- 50件以上のアイテムを返す可能性のあるクエリ

---

### 4. フィルタと検索パターン

**ユースケース**: 複数の条件でテナントデータ内を検索

**RUコスト**: 3-15 RU（インデックスと結果サイズに依存）

**例**:
```typescript
// 複数の条件でユーザーを検索
const querySpec = {
  query: `
    SELECT * FROM c 
    WHERE c.tenantId = @tenantId 
    AND c.status = @status
    AND (
      CONTAINS(LOWER(c.firstName), LOWER(@searchTerm))
      OR CONTAINS(LOWER(c.lastName), LOWER(@searchTerm))
      OR CONTAINS(LOWER(c.email), LOWER(@searchTerm))
    )
    ORDER BY c.lastName, c.firstName
  `,
  parameters: [
    { name: '@tenantId', value: 'tenant-456' },
    { name: '@status', value: 'active' },
    { name: '@searchTerm', value: 'john' }
  ]
};

const { resources: matchedUsers } = await container.items
  .query(querySpec)
  .fetchAll();
```

---

### 5. 配列クエリパターン

**ユースケース**: 配列メンバーシップに基づいてドキュメントをクエリ

**RUコスト**: 3-10 RU

**例**:
```typescript
// 特定の権限を持つユーザーを検索
const querySpec = {
  query: `
    SELECT * FROM c 
    WHERE c.tenantId = @tenantId 
    AND ARRAY_CONTAINS(c.permissions, @permission)
  `,
  parameters: [
    { name: '@tenantId', value: 'tenant-456' },
    { name: '@permission', value: 'users.create' }
  ]
};

const { resources: usersWithPermission } = await container.items
  .query(querySpec)
  .fetchAll();
```

---

### 6. 条件付き更新パターン

**ユースケース**: 楽観的同時実行制御での更新

**RUコスト**: 2-5 RU（読み取り + 書き込み）

**例**:
```typescript
// etagでアイテムを読み取り
const { resource: user, headers } = await container
  .item('user-123', 'tenant-456')
  .read();

// アイテムを変更
user.status = 'suspended';
user.updatedAt = new Date().toISOString();

// 同時実行チェックで更新
try {
  await container.item(user.id, user.tenantId).replace(user, {
    accessCondition: { 
      type: 'IfMatch', 
      condition: headers.etag 
    }
  });
} catch (error) {
  if (error.code === 412) {
    console.error('同時実行の競合 - アイテムが変更されました');
  }
}
```

---

### 7. クロスパーティションクエリパターン（慎重に使用）

**ユースケース**: すべてのテナントにわたる管理/分析クエリ

**RUコスト**: 高い（データサイズに応じて10-1000+ RU）

**例**:
```typescript
// 管理ダッシュボード: すべてのテナントでユーザーをカウント
const querySpec = {
  query: `
    SELECT c.tenantId, COUNT(1) as userCount
    FROM c 
    WHERE c.status = @status
    GROUP BY c.tenantId
  `,
  parameters: [
    { name: '@status', value: 'active' }
  ]
};

// 警告: これはクロスパーティションクエリです！
const { resources: tenantStats } = await container.items
  .query(querySpec)
  .fetchAll();
```

**使用するタイミング**（のみ）:
- 管理ダッシュボード
- システム分析
- データエクスポート/移行
- スケジュールされたバックグラウンドジョブ

---

## パフォーマンス比較

> **注意**: 以下のメトリクスは、デフォルトのインデックスポリシーによる典型的なワークロードに基づくベースライン推定値です。実際のパフォーマンスは以下により大きく異なる可能性があります：
> - ドキュメントのサイズと複雑性
> - インデックス構成とインデックス付きパスの数
> - ネットワークレイテンシと地理的分散
> - CosmosDBの整合性レベル設定
> - 同時クエリ負荷とスロットリング
> 
> 本番環境に近いデータで常にテストし、環境内の実際のRU消費を監視してください。

| パターン | RUコスト | レイテンシ | ユースケース |
|---------|---------|----------|-------------|
| ポイント読み取り | 1 RU | ~5ms | IDで取得 |
| 単一パーティションクエリ | 2-10 RU | ~10-20ms | テナント内でリスト |
| ページネーション | 2-5 RU/ページ | ~10-15ms | 大規模結果セット |
| フィルタと検索 | 3-15 RU | ~15-30ms | テナント内で検索 |
| 配列クエリ | 3-10 RU | ~15-25ms | 権限/ロールで検索 |
| 条件付き更新 | 2-5 RU | ~10-15ms | 安全な更新 |
| クロスパーティションクエリ | 10-1000+ RU | ~50-500ms | 管理/分析のみ |

## 避けるべきアンチパターン

❌ **避けるべき**: ユーザーフローでパーティションキーなしのクエリ
```typescript
// 悪い例: ユーザーメールのクロスパーティションクエリ
SELECT * FROM c WHERE c.email = 'user@example.com'
```

✅ **推奨**: テナントコンテキストを含める
```typescript
// 良い例: 単一パーティションクエリ
SELECT * FROM c WHERE c.tenantId = @tenantId AND c.email = @email
```

---

❌ **避けるべき**: 不要な`SELECT *`の使用
```typescript
// 悪い例: メールのみが必要な場合にすべてのフィールドを取得
SELECT * FROM c WHERE c.tenantId = @tenantId
```

✅ **推奨**: 特定のフィールドのみを選択
```typescript
// 良い例: 特定のフィールドを選択
SELECT c.id, c.email, c.firstName, c.lastName FROM c WHERE c.tenantId = @tenantId
```

## 監視と最適化

### 追跡すべき主要メトリクス

```typescript
// RU消費を追跡
const { resources, requestCharge, headers } = await container.items
  .query(querySpec)
  .fetchAll();

console.log(`クエリRU: ${requestCharge}`);

// 遅いクエリをログ記録
if (requestCharge > 50) {
  logger.warn('高RUクエリを検出', {
    query: querySpec.query,
    rus: requestCharge,
    tenantId: tenantId
  });
}
```

### クエリ最適化チェックリスト

- [ ] すべてのクエリにパーティションキー（tenantId）を含める
- [ ] 可能な限りポイント読み取りを使用
- [ ] 10件以上の結果にはページネーションを実装
- [ ] 必要なフィールドのみを選択
- [ ] WHERE句で使用するフィールドにインデックスを付ける
- [ ] ユーザーフローでクロスパーティションクエリを避ける
- [ ] RU消費を監視しログ記録
- [ ] 頻繁にアクセスするデータをキャッシュ
- [ ] 本番環境に近いデータ量でテスト

## 参考資料

- [スキーマドキュメント](./SCHEMA.md)
- [ADR 003: CosmosDBスキーマ設計](../adr/003-cosmosdb-schema-tenant-partitioning.md)
- [Azure CosmosDBクエリのベストプラクティス](https://docs.microsoft.com/azure/cosmos-db/sql-query-getting-started)
- [Azure Cosmos DBでのパーティショニング](https://docs.microsoft.com/azure/cosmos-db/partitioning-overview)

---

**最終更新**: 2026-01-09
