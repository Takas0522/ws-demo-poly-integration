# サービス設定サービスAPI

サービス構成と機能フラグ管理のためのREST API。

## ベースURL

- **開発環境**: `http://localhost:3003/api`
- **ステージング環境**: `https://settings-staging.example.com/api`
- **本番環境**: `https://settings.example.com/api`

## 概要

サービス設定サービスは以下を処理します：
- サービス構成管理
- 機能フラグ制御
- テナントごとのアプリケーション設定
- 環境固有の構成
- ランタイム構成更新

## 主要エンドポイント

### 設定管理

- `GET /settings` - 設定リストの取得
- `POST /settings` - 新規設定の作成
- `GET /settings/{settingId}` - 特定設定の取得
- `PUT /settings/{settingId}` - 設定の更新
- `DELETE /settings/{settingId}` - 設定の削除
- `GET /settings/key/{key}` - キーで設定を取得

### 機能フラグ

- `GET /feature-flags` - 機能フラグリストの取得
- `POST /feature-flags` - 新規機能フラグの作成
- `GET /feature-flags/{flagKey}` - 特定機能フラグの取得
- `PUT /feature-flags/{flagKey}` - 機能フラグの更新
- `DELETE /feature-flags/{flagKey}` - 機能フラグの削除
- `POST /feature-flags/{flagKey}/toggle` - 機能フラグのトグル

### 構成管理

- `GET /configurations` - 構成リストの取得
- `POST /configurations` - 新規構成の作成

## 認証

すべてのAPIエンドポイント（ヘルスチェックを除く）はJWT認証が必要です。

```bash
Authorization: Bearer <jwt-token>
```

## リクエスト例

### 設定の作成

```bash
POST /api/settings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "key": "max_users_per_tenant",
  "value": 100,
  "category": "limits",
  "scope": "tenant",
  "tenantId": "tenant-123",
  "description": "テナントごとの最大ユーザー数"
}
```

### 機能フラグの作成

```bash
POST /api/feature-flags
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "key": "new_dashboard",
  "name": "新しいダッシュボード",
  "description": "新しいダッシュボードUIを有効化",
  "enabled": false,
  "rolloutPercentage": 0
}
```

### 機能フラグのトグル

```bash
POST /api/feature-flags/new_dashboard/toggle
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "enabled": true,
  "tenantId": "tenant-123"
}
```

### キーで設定を取得

```bash
GET /api/settings/key/max_api_calls_per_minute?tenantId=tenant-123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## レスポンス形式

### 設定レスポンス

```json
{
  "success": true,
  "data": {
    "id": "setting-123",
    "key": "max_users_per_tenant",
    "value": 100,
    "category": "limits",
    "scope": "tenant",
    "tenantId": "tenant-123",
    "description": "テナントごとの最大ユーザー数",
    "isEncrypted": false,
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-11T15:00:00Z"
  }
}
```

### 機能フラグレスポンス

```json
{
  "success": true,
  "data": {
    "key": "new_dashboard",
    "enabled": true,
    "name": "新しいダッシュボード",
    "description": "新しいダッシュボードUIを有効化",
    "rolloutPercentage": 50,
    "tenantOverrides": {
      "tenant-123": true,
      "tenant-456": false
    },
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-11T15:00:00Z"
  }
}
```

## 設定スコープ

設定は3つのスコープレベルで管理されます：

### グローバルスコープ

```json
{
  "key": "api_version",
  "value": "v1",
  "scope": "global"
}
```

### テナントスコープ

```json
{
  "key": "max_users",
  "value": 100,
  "scope": "tenant",
  "tenantId": "tenant-123"
}
```

### ユーザースコープ

```json
{
  "key": "theme",
  "value": "dark",
  "scope": "user",
  "userId": "user-123"
}
```

## 機能フラグのロールアウト

機能フラグは段階的なロールアウトをサポートします：

### パーセンテージベースのロールアウト

```json
{
  "key": "experimental_feature",
  "enabled": true,
  "rolloutPercentage": 25
}
```

25%のユーザーに対して有効化されます。

### テナント固有のオーバーライド

```json
{
  "key": "beta_feature",
  "enabled": false,
  "rolloutPercentage": 0,
  "tenantOverrides": {
    "tenant-beta-1": true,
    "tenant-beta-2": true
  }
}
```

特定のテナントに対して個別に制御できます。

## フィルタリング

### 設定のフィルタリング

```bash
# カテゴリでフィルタ
GET /api/settings?category=feature_flags

# テナントでフィルタ
GET /api/settings?tenantId=tenant-123

# スコープでフィルタ
GET /api/settings?scope=global
```

### 機能フラグのフィルタリング

```bash
# 有効な機能フラグのみ
GET /api/feature-flags?enabled=true

# テナント固有の機能フラグ
GET /api/feature-flags?tenantId=tenant-123
```

## エラーコード

| コード | 説明 |
|------|-------------|
| `RESOURCE_NOT_FOUND` | 指定された設定が存在しません |
| `RESOURCE_ALREADY_EXISTS` | 同じキーの設定が既に存在します |
| `VALIDATION_FAILED` | リクエストの検証に失敗しました |
| `AUTHZ_INSUFFICIENT_PERMISSIONS` | 操作に必要な権限がありません |

## OpenAPI仕様

完全なOpenAPI 3.0仕様については[openapi.yaml](./openapi.yaml)を参照してください。

## Swagger UI

開発環境でインタラクティブなAPIドキュメントを表示：

```
http://localhost:3003/api-docs
```

---

**最終更新**: 2026-01-11
