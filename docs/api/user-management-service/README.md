# ユーザー管理サービスAPI

ユーザーCRUD操作とプロファイル管理のためのREST API。

## ベースURL

- **開発環境**: `http://localhost:3002/api`
- **ステージング環境**: `https://users-staging.example.com/api`
- **本番環境**: `https://users.example.com/api`

## 概要

ユーザー管理サービスは以下を処理します：
- ユーザーの作成、取得、更新、削除
- ユーザープロファイル管理
- ロール割り当てと権限管理
- ユーザーステータス管理
- マルチテナントユーザーデータ分離

## 主要エンドポイント

### ユーザー管理

- `GET /users` - ユーザーリストの取得（ページネーション、フィルタリング対応）
- `POST /users` - 新規ユーザーの作成
- `GET /users/{userId}` - 特定ユーザーの取得
- `PUT /users/{userId}` - ユーザー情報の更新
- `DELETE /users/{userId}` - ユーザーの削除（ソフトデリート）

### プロファイル管理

- `GET /users/{userId}/profile` - ユーザープロファイルの取得
- `PATCH /users/{userId}/profile` - プロファイル情報の更新

### ロール管理

- `GET /users/{userId}/roles` - ユーザーロールの取得
- `PUT /users/{userId}/roles` - ユーザーロールの更新

### 一括操作

- `POST /users/bulk` - 複数ユーザーの一括作成

## 認証

すべてのAPIエンドポイント（ヘルスチェックを除く）はJWT認証が必要です。

```bash
Authorization: Bearer <jwt-token>
```

## リクエスト例

### ユーザーリストの取得

```bash
GET /api/users?page=1&limit=20&status=active&sort=-createdAt
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 新規ユーザーの作成

```bash
POST /api/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "email": "newuser@example.com",
  "displayName": "新規ユーザー",
  "password": "SecurePassword123",
  "tenantId": "tenant-123",
  "roles": ["user"]
}
```

### ユーザー情報の更新

```bash
PUT /api/users/user-123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "displayName": "更新された名前",
  "status": "active"
}
```

## レスポンス形式

### 成功レスポンス

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "displayName": "田中太郎",
    "status": "active",
    "tenantId": "tenant-456",
    "roles": ["admin", "user"],
    "permissions": ["users.read", "users.write"],
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-11T15:00:00Z"
  }
}
```

### ページネーションレスポンス

```json
{
  "success": true,
  "data": [
    { /* ユーザーオブジェクト */ }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### エラーレスポンス

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User not found",
    "details": {}
  },
  "metadata": {
    "timestamp": "2026-01-11T15:00:00Z",
    "requestId": "req-abc123def456"
  }
}
```

## エラーコード

| コード | 説明 |
|------|-------------|
| `RESOURCE_NOT_FOUND` | 指定されたユーザーが存在しません |
| `RESOURCE_ALREADY_EXISTS` | 同じメールアドレスのユーザーが既に存在します |
| `VALIDATION_FAILED` | リクエストの検証に失敗しました |
| `AUTHZ_INSUFFICIENT_PERMISSIONS` | 操作に必要な権限がありません |

## フィルタリングとソート

### フィルタリング

クエリパラメータを使用：

```bash
# ステータスでフィルタ
GET /api/users?status=active

# ロールでフィルタ
GET /api/users?role=admin

# 検索（名前またはメール）
GET /api/users?search=田中

# 複合フィルタ
GET /api/users?status=active&role=admin&search=田中
```

### ソート

```bash
# 作成日時で降順ソート
GET /api/users?sort=-createdAt

# 名前で昇順ソート
GET /api/users?sort=displayName

# 複数フィールドでソート
GET /api/users?sort=status,-createdAt
```

## ページネーション

```bash
# ページ2、1ページあたり50件
GET /api/users?page=2&limit=50

# デフォルト：page=1, limit=20
# 最大：limit=100
```

## OpenAPI仕様

完全なOpenAPI 3.0仕様については[openapi.yaml](./openapi.yaml)を参照してください。

## Swagger UI

開発環境でインタラクティブなAPIドキュメントを表示：

```
http://localhost:3002/api-docs
```

---

**最終更新**: 2026-01-11
