# 003. CosmosDB スキーマ設計とテナントパーティショニング

**日付**: 2026-01-09  
**ステータス**: 承認  
**決定者**: 開発チーム、アーキテクチャチーム、データベース設計チーム

## コンテキスト

マルチテナントSaaS管理プラットフォームのデータストレージソリューションを設計しています。以下の要件があります：

- **マルチテナンシー**: 複数のテナント（顧客組織）間でデータを安全に分離
- **スケーラビリティ**: 数千のテナントと数百万のレコードをサポート
- **パフォーマンス**: 高速なクエリとトランザクション処理
- **コスト効率**: Azure CosmosDBのRU（Request Unit）使用量の最適化
- **監査とコンプライアンス**: すべてのデータ変更の追跡
- **データ保持**: 監査ログの自動クリーンアップ

主なデータエンティティ：
- **Tenants（テナント）**: 顧客組織
- **Users（ユーザー）**: システムユーザー
- **Permissions（権限）**: ドット記法ベースの権限定義
- **AuditLogs（監査ログ）**: すべてのデータ変更の記録

## 決定

**Azure CosmosDB（SQL API）をテナントIDベースのパーティショニング戦略で使用**します：

### パーティションキー戦略

すべてのコンテナで **`/tenantId`** をパーティションキーとして使用：

```javascript
{
  "id": "unique-document-id",
  "tenantId": "tenant-123",  // パーティションキー
  // その他のフィールド
}
```

### コンテナ設計

#### 1. **Tenants コンテナ**
テナント（顧客組織）情報を管理

```javascript
{
  "id": "tenant-123",
  "tenantId": "tenant-123",  // パーティションキー（自己参照）
  "name": "Acme Corporation",
  "status": "active",  // active, suspended, inactive
  "subscription": {
    "plan": "enterprise",  // free, basic, professional, enterprise
    "startDate": "2026-01-01T00:00:00Z",
    "endDate": "2027-01-01T00:00:00Z",
    "maxUsers": 100
  },
  "settings": {
    "timezone": "Asia/Tokyo",
    "locale": "ja-JP",
    "features": {
      "twoFactorAuth": true,
      "apiAccess": true,
      "advancedReporting": false
    }
  },
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-09T00:00:00Z",
  "createdBy": "system",
  "updatedBy": "admin-user-id"
}
```

#### 2. **Users コンテナ**
ユーザーアカウントとプロファイル情報を管理

```javascript
{
  "id": "user-456",
  "tenantId": "tenant-123",  // パーティションキー
  "email": "user@example.com",
  "username": "john.doe",
  "firstName": "John",
  "lastName": "Doe",
  "passwordHash": "hashed-password",
  "status": "active",  // active, inactive, suspended, locked
  "roles": ["admin", "user"],
  "permissions": [
    "users.create",
    "users.read",
    "users.update",
    "services.read"
  ],
  "profile": {
    "phoneNumber": "+81-90-1234-5678",
    "department": "Engineering",
    "jobTitle": "Senior Developer",
    "avatarUrl": "https://example.com/avatars/user-456.jpg"
  },
  "security": {
    "lastLoginAt": "2026-01-09T10:00:00Z",
    "lastPasswordChangeAt": "2026-01-01T00:00:00Z",
    "failedLoginAttempts": 0,
    "lockedUntil": null,
    "twoFactorEnabled": false,
    "twoFactorSecret": null
  },
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-09T00:00:00Z",
  "createdBy": "admin-user-id",
  "updatedBy": "admin-user-id"
}
```

#### 3. **Permissions コンテナ**
ドット記法ベースの権限定義を管理

```javascript
{
  "id": "permission-789",
  "tenantId": "tenant-123",  // パーティションキー
  "name": "users.create",
  "displayName": "ユーザー作成",
  "description": "新しいユーザーを作成する権限",
  "category": "users",  // users, services, settings, system
  "resource": "users",
  "action": "create",  // create, read, update, delete, execute
  "scope": "tenant",  // tenant, global, own
  "isActive": true,
  "requiredPlan": "basic",  // free, basic, professional, enterprise
  "metadata": {
    "uiSection": "User Management",
    "uiButton": "Create User",
    "requiresConfirmation": true
  },
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-09T00:00:00Z",
  "createdBy": "system",
  "updatedBy": "system"
}
```

#### 4. **AuditLogs コンテナ**
すべてのデータ変更とアクションの監査ログを管理

```javascript
{
  "id": "log-101112",
  "tenantId": "tenant-123",  // パーティションキー
  "timestamp": "2026-01-09T12:00:00Z",
  "userId": "user-456",
  "userName": "john.doe",
  "action": "user.update",  // [resource].[action]
  "resource": {
    "type": "User",
    "id": "user-789",
    "name": "jane.smith"
  },
  "details": {
    "changes": {
      "roles": {
        "before": ["user"],
        "after": ["user", "admin"]
      }
    },
    "reason": "Promoted to admin role"
  },
  "metadata": {
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "requestId": "req-123456",
    "sessionId": "session-789"
  },
  "status": "success",  // success, failure, warning
  "ttl": 7776000  // 90日後に自動削除（秒単位）
}
```

### TTL（Time To Live）設定

**AuditLogs コンテナのみTTLを有効化**：
- デフォルトTTL: 7,776,000秒（90日）
- 重要な監査ログは `ttl: -1` で永続化可能
- 自動的に期限切れドキュメントを削除してストレージコストを削減

### インデックス戦略

#### Tenants コンテナ
```json
{
  "indexingMode": "consistent",
  "automatic": true,
  "includedPaths": [
    {"path": "/tenantId/?"},
    {"path": "/status/?"},
    {"path": "/subscription/plan/?"},
    {"path": "/createdAt/?"}
  ],
  "excludedPaths": [
    {"path": "/settings/*"},
    {"path": "/_etag/?"}
  ]
}
```

#### Users コンテナ
```json
{
  "indexingMode": "consistent",
  "automatic": true,
  "includedPaths": [
    {"path": "/tenantId/?"},
    {"path": "/email/?"},
    {"path": "/username/?"},
    {"path": "/status/?"},
    {"path": "/roles/*"},
    {"path": "/permissions/*"},
    {"path": "/createdAt/?"},
    {"path": "/updatedAt/?"}
  ],
  "excludedPaths": [
    {"path": "/passwordHash/?"},
    {"path": "/profile/*"},
    {"path": "/security/twoFactorSecret/?"},
    {"path": "/_etag/?"}
  ],
  "compositeIndexes": [
    [
      {"path": "/tenantId", "order": "ascending"},
      {"path": "/email", "order": "ascending"}
    ],
    [
      {"path": "/tenantId", "order": "ascending"},
      {"path": "/status", "order": "ascending"}
    ]
  ]
}
```

#### Permissions コンテナ
```json
{
  "indexingMode": "consistent",
  "automatic": true,
  "includedPaths": [
    {"path": "/tenantId/?"},
    {"path": "/name/?"},
    {"path": "/category/?"},
    {"path": "/resource/?"},
    {"path": "/action/?"},
    {"path": "/isActive/?"}
  ],
  "excludedPaths": [
    {"path": "/metadata/*"},
    {"path": "/_etag/?"}
  ]
}
```

#### AuditLogs コンテナ
```json
{
  "indexingMode": "consistent",
  "automatic": true,
  "includedPaths": [
    {"path": "/tenantId/?"},
    {"path": "/timestamp/?"},
    {"path": "/userId/?"},
    {"path": "/action/?"},
    {"path": "/resource/type/?"},
    {"path": "/status/?"}
  ],
  "excludedPaths": [
    {"path": "/details/*"},
    {"path": "/metadata/*"},
    {"path": "/_etag/?"}
  ],
  "compositeIndexes": [
    [
      {"path": "/tenantId", "order": "ascending"},
      {"path": "/timestamp", "order": "descending"}
    ],
    [
      {"path": "/tenantId", "order": "ascending"},
      {"path": "/userId", "order": "ascending"},
      {"path": "/timestamp", "order": "descending"}
    ]
  ]
}
```

### データアクセスパターン

#### パターン1: テナント内クエリ（最適化）
```typescript
// 単一パーティション内のクエリ - 最も効率的
const users = await container.items
  .query({
    query: "SELECT * FROM c WHERE c.tenantId = @tenantId AND c.status = @status",
    parameters: [
      { name: "@tenantId", value: "tenant-123" },
      { name: "@status", value: "active" }
    ]
  })
  .fetchAll();
```

#### パターン2: クロスパーティションクエリ（慎重に使用）
```typescript
// 複数パーティションにまたがるクエリ - RUコストが高い
// 管理者用ダッシュボードや分析にのみ使用
const allActiveUsers = await container.items
  .query({
    query: "SELECT * FROM c WHERE c.status = @status",
    parameters: [
      { name: "@status", value: "active" }
    ]
  })
  .fetchAll();
```

#### パターン3: ポイント読み取り（最速）
```typescript
// ID とパーティションキーでの直接読み取り - 最も効率的
const { resource: user } = await container.item("user-456", "tenant-123").read();
```

#### パターン4: ページネーション
```typescript
// 大量データの効率的な取得
const queryIterator = container.items
  .query({
    query: "SELECT * FROM c WHERE c.tenantId = @tenantId ORDER BY c.createdAt DESC",
    parameters: [{ name: "@tenantId", value: "tenant-123" }]
  }, {
    maxItemCount: 20
  });

while (queryIterator.hasMoreResults()) {
  const { resources: page } = await queryIterator.fetchNext();
  // ページを処理
}
```

## 結果

### ポジティブな結果

- **効率的なデータ分離**: テナントIDパーティショニングにより、テナントデータが物理的に分離
- **スケーラビリティ**: パーティションが自動的にスケール、テナント数の増加に対応
- **パフォーマンス**: 単一パーティション内のクエリは高速で低RU
- **コスト最適化**: インデックス戦略により不要なインデックスを削減、RU使用量を最小化
- **自動クリーンアップ**: TTLにより監査ログを自動削除、ストレージコストを削減
- **セキュリティ**: パーティションレベルでのデータ分離により、誤ってテナント間でデータが混在するリスクを低減
- **監査対応**: 包括的な監査ログで規制要件に対応

### ネガティブな結果

- **クロスパーティションクエリのコスト**: テナント横断のクエリはRUコストが高い
- **パーティション再設計の困難**: パーティションキーは後から変更できない
- **ホットパーティション**: 大規模テナントはホットパーティションになる可能性
- **複雑性**: すべてのクエリでテナントIDを指定する必要がある
- **ストレージオーバーヘッド**: すべてのドキュメントにtenantIdを保存

### 中立的な結果

- 開発者はすべてのクエリでテナントコンテキストを意識する必要がある
- TTL設定の管理とモニタリングが必要

## 検討した代替案

### 代替案1: データベースごとのテナント分離

**説明**: 各テナントに専用のデータベースを作成。

**長所**:
- 完全なデータ分離
- テナント固有の構成が可能
- バックアップと復元が簡単

**短所**:
- 運用オーバーヘッドが大きい
- コストが高い（各DBに最小RU予約が必要）
- クロステナント分析が困難
- 数千のテナントには拡張不可

**却下理由**: 小規模な大企業向けテナントには適しているが、多数の中小テナントを持つSaaSには非効率。

### 代替案2: ドキュメントタイプベースのパーティショニング

**説明**: `documentType`（例：User、Tenant）をパーティションキーとして使用。

**長所**:
- ドキュメントタイプごとの集計が効率的
- クロステナントクエリが高速

**短所**:
- テナント分離が弱い
- セキュリティリスク（テナント間でデータが混在）
- マルチテナントアプリには不適切
- 単一ドキュメントタイプの大量データでホットパーティション

**却下理由**: マルチテナントアーキテクチャの主要要件であるテナント分離を満たさない。

### 代替案3: 合成キー（tenantId + documentType）

**説明**: `/tenantId-documentType` のような合成パーティションキーを使用。

**長所**:
- テナントとタイプの両方で分散
- より細かいパーティショニング

**短所**:
- クエリの複雑性が増加
- クロスドキュメントタイプクエリが困難
- アプリケーションロジックが複雑化

**却下理由**: 現在のテナント規模では過剰な最適化。将来的に検討可能。

## 実装ノート

### データベース初期化スクリプト

データベース初期化スクリプトは `/scripts/cosmosdb/` に配置：

1. **init-database.ts**: データベースとコンテナを作成
2. **seed-data.ts**: 開発用シードデータを投入
3. **migration-template.ts**: スキーマ変更用テンプレート

### 命名規則

- **データベース名**: `saas-management` (production), `saas-management-dev` (development)
- **コンテナ名**: PascalCase（例：Users、AuditLogs）
- **フィールド名**: camelCase（例：tenantId、createdAt）
- **ID形式**: `{type}-{uuid}` 形式（例：user-123、tenant-456）

### ベストプラクティス

1. **常にtenantIdを含める**: すべてのクエリとドキュメントにtenantIdを含める
2. **ポイント読み取りを使用**: 可能な限り `container.item(id, partitionKey).read()` を使用
3. **ページネーションを実装**: 大量データには必ずページネーションを使用
4. **インデックスを監視**: クエリメトリクスを監視し、必要に応じてインデックスを調整
5. **TTLを活用**: 一時的なデータにはTTLを設定
6. **クロスパーティションクエリを制限**: 管理者機能や分析にのみ使用

### 移行戦略

- スキーマ変更は新しいフィールドの追加で対応（後方互換性を維持）
- 破壊的変更にはバージョニングフィールド（`schemaVersion`）を使用
- 大規模な変更には段階的移行スクリプトを作成

## 検証

以下の方法でこの設計を検証します：

### パフォーマンステスト
- テナントあたり1000ユーザーで読み取り/書き込み性能を測定
- ページネーションクエリのRU消費を監視
- ホットパーティションを検出

### スケーラビリティテスト
- 100テナント、各1000ユーザーでテスト
- クロスパーティションクエリの性能評価
- ストレージとRUコストを分析

### セキュリティ監査
- テナント分離が正しく機能することを検証
- 誤ったクエリでテナント間のデータ漏洩がないことを確認

### 成功メトリクス
- 単一パーティションクエリ: < 10 RU
- ポイント読み取り: 1 RU
- 99パーセンタイルレイテンシ: < 10ms
- ホットパーティションなし

### レビュータイムライン
実装後3か月でレビューを実施

## 参考資料

- [Azure CosmosDB Partitioning Best Practices](https://docs.microsoft.com/azure/cosmos-db/partitioning-overview)
- [CosmosDB Indexing Policies](https://docs.microsoft.com/azure/cosmos-db/index-policy)
- [Time to Live (TTL) in Azure Cosmos DB](https://docs.microsoft.com/azure/cosmos-db/time-to-live)
- [Request Units in Azure Cosmos DB](https://docs.microsoft.com/azure/cosmos-db/request-units)
- [Multi-tenant Applications with Azure Cosmos DB](https://docs.microsoft.com/azure/cosmos-db/multi-tenant-applications)

---

**最終更新**: 2026-01-09
