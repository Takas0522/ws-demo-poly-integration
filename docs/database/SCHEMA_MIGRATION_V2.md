# CosmosDB スキーマ移行ガイド V2

## 概要

このドキュメントは、マルチテナント対応とサービス管理機能追加のためのCosmosDBスキーマ拡張（V1 → V2）を説明します。

## 変更サマリー

| 変更内容 | 影響範囲 | 互換性 |
|---------|---------|-------|
| TenantUsersコンテナ追加 | 新規 | - |
| Servicesコンテナ追加 | 新規 | - |
| Users.userType追加 | 既存データ | 後方互換（デフォルト値設定） |
| Users.primaryTenantId追加 | 既存データ | 後方互換（tenantIdをコピー） |
| Tenants.settings.allowedDomains追加 | 既存データ | 後方互換（空配列） |

## 新規コンテナ

### 1. TenantUsers コンテナ

**目的**: ユーザーとテナントの多対多リレーションを管理

**パーティションキー**: `/userId`

**スループット**: 400 RU/s（手動）またはオートスケール（400-4000 RU/s）

#### スキーマ

```typescript
interface TenantUser {
  id: string;                    // 形式: "tenantuser-{uuid}"
  userId: string;                 // パーティションキー
  tenantId: string;
  roles: string[];                // テナント固有のロール
  permissions: string[];          // テナント固有の権限（ドット記法）
  status: 'active' | 'inactive' | 'suspended';
  joinedAt: string;               // ISO 8601タイムスタンプ
  leftAt: string | null;          // 退出日時（退出時のみ）
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}
```

#### ドキュメント例

```json
{
  "id": "tenantuser-550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-123",
  "tenantId": "tenant-456",
  "roles": ["tenant-admin", "user"],
  "permissions": [
    "users.create",
    "users.read",
    "users.update",
    "services.read",
    "services.update"
  ],
  "status": "active",
  "joinedAt": "2026-01-12T00:00:00Z",
  "leftAt": null,
  "createdAt": "2026-01-12T00:00:00Z",
  "updatedAt": "2026-01-12T00:00:00Z",
  "createdBy": "admin-user-id",
  "updatedBy": "admin-user-id"
}
```

#### インデックス設定

```json
{
  "indexingMode": "consistent",
  "automatic": true,
  "includedPaths": [
    {
      "path": "/*"
    }
  ],
  "excludedPaths": [
    {
      "path": "/\"_etag\"/?"
    }
  ],
  "compositeIndexes": [
    [
      { "path": "/userId", "order": "ascending" },
      { "path": "/status", "order": "ascending" }
    ],
    [
      { "path": "/tenantId", "order": "ascending" },
      { "path": "/status", "order": "ascending" }
    ]
  ]
}
```

#### 一般的なクエリ

```sql
-- ユーザーの所属テナント一覧（単一パーティション - 高速）
SELECT * FROM c 
WHERE c.userId = 'user-123' 
AND c.status = 'active'
ORDER BY c.joinedAt DESC

-- テナントのユーザー一覧（クロスパーティション - Redisキャッシング推奨）
SELECT * FROM c 
WHERE c.tenantId = 'tenant-456' 
AND c.status = 'active'
ORDER BY c.joinedAt DESC

-- ユーザーが特定テナントに所属しているか確認
SELECT * FROM c 
WHERE c.userId = 'user-123' 
AND c.tenantId = 'tenant-456'
AND c.status = 'active'
```

### 2. Services コンテナ

**目的**: サービスカタログ（ファイル管理、外部共有、AIエージェント等）を管理

**パーティションキー**: `/tenantId`（全サービスは`system-internal`に所属）

**スループット**: 400 RU/s（手動）

#### スキーマ

```typescript
interface Service {
  id: string;                     // 形式: "service-{uuid}"
  tenantId: string;               // パーティションキー（常に "system-internal"）
  name: string;                   // "file-management", "external-sharing", "ai-agent"
  displayName: {
    ja: string;
    en: string;
  };
  description: {
    ja: string;
    en: string;
  };
  category: string;               // "storage", "collaboration", "ai", "analytics"
  icon: string;                   // アイコン名またはURL
  status: 'active' | 'inactive' | 'beta';
  requiredPlan: string[];         // ["free", "basic", "professional", "enterprise"]
  features: {
    key: string;
    displayName: { ja: string; en: string };
    description: { ja: string; en: string };
    enabled: boolean;
  }[];
  pricing: {
    plan: string;                 // "free", "basic", etc.
    price: number;
    currency: string;
    billingCycle: string;         // "monthly", "annual"
  }[];
  metadata: {
    version: string;
    releaseDate: string;
    deprecated: boolean;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}
```

#### ドキュメント例

```json
{
  "id": "service-file-management",
  "tenantId": "system-internal",
  "name": "file-management",
  "displayName": {
    "ja": "ファイル管理",
    "en": "File Management"
  },
  "description": {
    "ja": "安全なファイルストレージと管理機能を提供します",
    "en": "Provides secure file storage and management capabilities"
  },
  "category": "storage",
  "icon": "folder-icon",
  "status": "active",
  "requiredPlan": ["basic", "professional", "enterprise"],
  "features": [
    {
      "key": "upload",
      "displayName": { "ja": "ファイルアップロード", "en": "File Upload" },
      "description": { "ja": "ファイルをアップロードできます", "en": "Upload files" },
      "enabled": true
    },
    {
      "key": "versioning",
      "displayName": { "ja": "バージョン管理", "en": "Versioning" },
      "description": { "ja": "ファイルのバージョンを管理", "en": "Manage file versions" },
      "enabled": true
    }
  ],
  "pricing": [
    {
      "plan": "basic",
      "price": 1000,
      "currency": "JPY",
      "billingCycle": "monthly"
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "releaseDate": "2026-01-01T00:00:00Z",
    "deprecated": false
  },
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-12T00:00:00Z",
  "createdBy": "system",
  "updatedBy": "system"
}
```

#### サービスとテナントの紐付け

サービスとテナントの紐付けは**TenantServicesコンテナ**（将来実装）または**Tenantsコンテナ内に配列**として保存:

```typescript
// Tenants.services 配列として実装（シンプル）
interface Tenant {
  // ... 既存フィールド
  services: {
    serviceId: string;
    enabled: boolean;
    enabledAt: string;
    disabledAt: string | null;
  }[];
}
```

## 既存コンテナの拡張

### 1. Users コンテナ

#### 追加フィールド

```typescript
interface UserV2 extends UserV1 {
  userType: 'internal' | 'external';  // 新規フィールド
  primaryTenantId: string;             // 新規フィールド
}
```

| フィールド | 型 | 必須 | デフォルト値 | 説明 |
|-----------|-----|------|------------|------|
| userType | string | はい | 'internal' | 'internal'=管理会社内、'external'=管理会社外 |
| primaryTenantId | string | はい | tenantId | プライマリテナントID（通常はsystem-internal） |

#### 既存データへの影響

- **互換性**: 後方互換（マイグレーションで自動追加）
- **デフォルト動作**: 既存ユーザーは全て`userType: 'internal'`として扱う

#### ドキュメント例（既存 + 新規フィールド）

```json
{
  "id": "user-123",
  "tenantId": "system-internal",
  "email": "admin@company.com",
  "username": "admin",
  "passwordHash": "$2b$10$...",
  "status": "active",
  "roles": ["global-admin"],
  "permissions": ["system.*"],
  "userType": "internal",
  "primaryTenantId": "system-internal",
  "profile": { /* ... */ },
  "security": { /* ... */ },
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-12T00:00:00Z"
}
```

### 2. Tenants コンテナ

#### 追加フィールド

```typescript
interface TenantV2 extends TenantV1 {
  settings: {
    timezone: string;
    locale: string;
    features: { [key: string]: boolean };
    allowedDomains: string[];      // 新規フィールド
  };
  services: {                      // 新規フィールド
    serviceId: string;
    enabled: boolean;
    enabledAt: string;
    disabledAt: string | null;
  }[];
}
```

| フィールド | 型 | 必須 | デフォルト値 | 説明 |
|-----------|-----|------|------------|------|
| settings.allowedDomains | string[] | いいえ | [] | 許可メールドメイン（例: ["@company.com"]） |
| services | array | いいえ | [] | テナントが利用できるサービス一覧 |

#### ドキュメント例

```json
{
  "id": "system-internal",
  "tenantId": "system-internal",
  "name": "管理会社",
  "status": "active",
  "subscription": {
    "plan": "enterprise",
    "startDate": "2026-01-01T00:00:00Z",
    "endDate": "2099-12-31T23:59:59Z",
    "maxUsers": 9999
  },
  "settings": {
    "timezone": "Asia/Tokyo",
    "locale": "ja-JP",
    "features": {
      "twoFactorAuth": true,
      "apiAccess": true
    },
    "allowedDomains": [
      "@company.com",
      "@company.co.jp"
    ]
  },
  "services": [
    {
      "serviceId": "service-file-management",
      "enabled": true,
      "enabledAt": "2026-01-01T00:00:00Z",
      "disabledAt": null
    },
    {
      "serviceId": "service-external-sharing",
      "enabled": true,
      "enabledAt": "2026-01-01T00:00:00Z",
      "disabledAt": null
    }
  ],
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-12T00:00:00Z"
}
```

## マイグレーションスクリプト

### 実行順序

1. `TenantUsers`コンテナ作成
2. `Services`コンテナ作成
3. 既存`Users`ドキュメント更新
4. 既存`Tenants`ドキュメント更新
5. `system-internal`テナント作成
6. 既存ユーザーの`TenantUsers`レコード生成

### スクリプト例

```typescript
// scripts/cosmosdb/migrate-to-v2.ts
import { CosmosClient } from '@azure/cosmos';

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);

async function migrateToV2() {
  console.log('🚀 Starting migration to V2...');

  // 1. TenantUsersコンテナ作成
  await createTenantUsersContainer();

  // 2. Servicesコンテナ作成
  await createServicesContainer();

  // 3. system-internalテナント作成
  await createSystemInternalTenant();

  // 4. 既存Usersドキュメント更新
  await migrateUsersToV2();

  // 5. 既存Tenantsドキュメント更新
  await migrateTenantsToV2();

  // 6. TenantUsersレコード生成
  await generateTenantUsersFromExistingData();

  console.log('✅ Migration to V2 completed!');
}

async function createTenantUsersContainer() {
  console.log('Creating TenantUsers container...');
  
  await database.containers.createIfNotExists({
    id: 'TenantUsers',
    partitionKey: { paths: ['/userId'] },
    indexingPolicy: {
      indexingMode: 'consistent',
      automatic: true,
      includedPaths: [{ path: '/*' }],
      excludedPaths: [{ path: '/"_etag"/?' }],
      compositeIndexes: [
        [
          { path: '/userId', order: 'ascending' },
          { path: '/status', order: 'ascending' }
        ],
        [
          { path: '/tenantId', order: 'ascending' },
          { path: '/status', order: 'ascending' }
        ]
      ]
    }
  });
  
  console.log('✓ TenantUsers container created');
}

async function createServicesContainer() {
  console.log('Creating Services container...');
  
  await database.containers.createIfNotExists({
    id: 'Services',
    partitionKey: { paths: ['/tenantId'] }
  });
  
  console.log('✓ Services container created');
}

async function createSystemInternalTenant() {
  console.log('Creating system-internal tenant...');
  
  const container = database.container('Tenants');
  const tenant = {
    id: 'system-internal',
    tenantId: 'system-internal',
    name: '管理会社',
    status: 'active',
    subscription: {
      plan: 'enterprise',
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2099-12-31T23:59:59Z',
      maxUsers: 9999
    },
    settings: {
      timezone: 'Asia/Tokyo',
      locale: 'ja-JP',
      features: {
        twoFactorAuth: true,
        apiAccess: true
      },
      allowedDomains: ['@company.com']  // 要設定
    },
    services: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
    updatedBy: 'system'
  };
  
  await container.items.upsert(tenant);
  console.log('✓ system-internal tenant created');
}

async function migrateUsersToV2() {
  console.log('Migrating Users to V2...');
  
  const container = database.container('Users');
  const { resources: users } = await container.items
    .query('SELECT * FROM c')
    .fetchAll();
  
  let migratedCount = 0;
  
  for (const user of users) {
    // userTypeとprimaryTenantIdがない場合のみ追加
    if (!user.userType || !user.primaryTenantId) {
      user.userType = 'internal';  // デフォルト
      user.primaryTenantId = user.tenantId;  // 既存tenantIdをコピー
      user.updatedAt = new Date().toISOString();
      
      await container.items.upsert(user);
      migratedCount++;
    }
  }
  
  console.log(`✓ Migrated ${migratedCount} users to V2`);
}

async function migrateTenantsToV2() {
  console.log('Migrating Tenants to V2...');
  
  const container = database.container('Tenants');
  const { resources: tenants } = await container.items
    .query('SELECT * FROM c')
    .fetchAll();
  
  let migratedCount = 0;
  
  for (const tenant of tenants) {
    // allowedDomainsとservicesがない場合のみ追加
    if (!tenant.settings?.allowedDomains || !tenant.services) {
      if (!tenant.settings) tenant.settings = {};
      if (!tenant.settings.allowedDomains) tenant.settings.allowedDomains = [];
      if (!tenant.services) tenant.services = [];
      tenant.updatedAt = new Date().toISOString();
      
      await container.items.upsert(tenant);
      migratedCount++;
    }
  }
  
  console.log(`✓ Migrated ${migratedCount} tenants to V2`);
}

async function generateTenantUsersFromExistingData() {
  console.log('Generating TenantUsers from existing Users...');
  
  const usersContainer = database.container('Users');
  const tenantUsersContainer = database.container('TenantUsers');
  
  const { resources: users } = await usersContainer.items
    .query('SELECT * FROM c')
    .fetchAll();
  
  let createdCount = 0;
  
  for (const user of users) {
    // 既存のtenantIdに対してTenantUserレコードを作成
    const tenantUser = {
      id: `tenantuser-${uuidv4()}`,
      userId: user.id,
      tenantId: user.tenantId,
      roles: user.roles || [],
      permissions: user.permissions || [],
      status: user.status === 'active' ? 'active' : 'inactive',
      joinedAt: user.createdAt,
      leftAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'migration-script',
      updatedBy: 'migration-script'
    };
    
    await tenantUsersContainer.items.upsert(tenantUser);
    createdCount++;
  }
  
  console.log(`✓ Created ${createdCount} TenantUsers records`);
}

// 実行
migrateToV2().catch(console.error);
```

### 実行方法

```bash
cd scripts/cosmosdb
npm install @azure/cosmos uuid
export COSMOSDB_ENDPOINT="https://localhost:8081"
export COSMOSDB_KEY="your-key"
export COSMOSDB_DATABASE="saas-management-dev"
ts-node migrate-to-v2.ts
```

## ロールバック手順

マイグレーション失敗時のロールバック:

```typescript
async function rollbackToV1() {
  console.log('Rolling back to V1...');

  // 1. TenantUsersコンテナ削除
  await database.container('TenantUsers').delete();

  // 2. Servicesコンテナ削除
  await database.container('Services').delete();

  // 3. system-internalテナント削除
  const tenantsContainer = database.container('Tenants');
  await tenantsContainer.item('system-internal', 'system-internal').delete();

  // 4. Users/Tenantsから新規フィールドを削除（オプション）
  // 注: CosmosDBはスキーマレスなので、フィールドを残しても影響なし

  console.log('✅ Rollback completed');
}
```

## パフォーマンス考慮事項

### クエリパターン最適化

| クエリパターン | 効率 | 推奨アプローチ |
|--------------|------|--------------|
| ユーザーの所属テナント取得 | ⭐⭐⭐ 高速 | 単一パーティションクエリ（userId） |
| テナントのユーザー一覧 | ⭐⭐ 中速 | クロスパーティション + Redisキャッシュ |
| サービス一覧取得 | ⭐⭐⭐ 高速 | 単一パーティション（system-internal） |
| テナントのサービス取得 | ⭐⭐⭐ 高速 | Tenant.services配列から取得 |

### RU消費見積もり

| 操作 | RU消費 | 頻度 | 対策 |
|-----|--------|------|------|
| TenantUser作成 | 5-10 RU | 低 | - |
| ユーザーの所属テナント取得 | 3-5 RU | 高 | Redisキャッシュ（5分） |
| テナントのユーザー一覧 | 10-50 RU | 中 | Redisキャッシュ（5分） |
| サービス一覧取得 | 5-10 RU | 中 | Redisキャッシュ（10分） |

## バリデーションルール

### TenantUsers

```typescript
const validateTenantUser = (tu: TenantUser) => {
  // 必須チェック
  if (!tu.userId || !tu.tenantId) throw new Error('userId and tenantId are required');
  
  // ステータスチェック
  if (!['active', 'inactive', 'suspended'].includes(tu.status)) {
    throw new Error('Invalid status');
  }
  
  // ロール/権限チェック
  if (!Array.isArray(tu.roles) || !Array.isArray(tu.permissions)) {
    throw new Error('roles and permissions must be arrays');
  }
};
```

### Services

```typescript
const validateService = (service: Service) => {
  // tenantIdは常にsystem-internal
  if (service.tenantId !== 'system-internal') {
    throw new Error('Service tenantId must be system-internal');
  }
  
  // ステータスチェック
  if (!['active', 'inactive', 'beta'].includes(service.status)) {
    throw new Error('Invalid status');
  }
};
```

## テストデータ

マイグレーション後のテストデータ例は[scripts/cosmosdb/data/seeds/development/](../../scripts/cosmosdb/data/seeds/development/)を参照してください。

## 関連ドキュメント

- [マルチテナント実装ガイド](../MULTI_TENANT_IMPLEMENTATION.md)
- [CosmosDB スキーマ V1](./SCHEMA.md)
- [開発計画](../../DEVELOPMENT_PLAN.md)

## Issue参照

- **#021**: Schema Extension Implementation
- **#022**: Seed Data Reconstruction
