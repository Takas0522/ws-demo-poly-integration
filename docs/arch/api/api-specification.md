# API設計仕様書

## ドキュメント情報

- **バージョン**: 1.0.0
- **最終更新日**: 2024年
- **ステータス**: Draft

---

## 目次

1. [共通仕様](#1-共通仕様)
2. [認証認可サービス API](#2-認証認可サービス-api)
3. [テナント管理サービス API](#3-テナント管理サービス-api)
4. [利用サービス設定サービス API](#4-利用サービス設定サービス-api)
5. [BFF API (Next.js)](#5-bff-api-nextjs)
6. [モックサービス API](#6-モックサービス-api)

---

## 1. 共通仕様

### 1.1 ベースURL

| 環境 | URL |
|------|-----|
| **開発環境** | http://localhost:{PORT} |
| **本番環境** | https://{service-name}.azurewebsites.net |

**ポート番号**:
- Frontend (Next.js): 3000
- 認証認可サービス: 8001
- テナント管理サービス: 8002
- 利用サービス設定サービス: 8003

### 1.2 共通ヘッダー

#### リクエストヘッダー

```http
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}
X-Request-ID: {UUID}  # オプション：リクエスト追跡用
```

#### レスポンスヘッダー

```http
Content-Type: application/json
X-Request-ID: {UUID}
X-Response-Time: {MILLISECONDS}
```

### 1.3 認証

**認証方式**: JWT (JSON Web Token) Bearer認証

**JWT ペイロード構造**:
```json
{
  "user_id": "user-uuid",
  "tenant_id": "tenant-uuid",
  "roles": [
    {
      "service_id": "service-uuid",
      "service_name": "テナント管理サービス",
      "role_code": "admin",
      "role_name": "管理者"
    }
  ],
  "exp": 1704153600,
  "iat": 1704067200
}
```

**認証不要エンドポイント**:
- `POST /api/v1/auth/login`
- `GET /health` (全サービス)

### 1.4 エラーレスポンス

#### エラーレスポンス形式

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Additional error details"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "request-uuid"
  }
}
```

#### HTTPステータスコード

| コード | 説明 | 使用ケース |
|-------|------|-----------|
| 200 | OK | 正常なGET、PUT、DELETE |
| 201 | Created | 正常なPOST（リソース作成） |
| 204 | No Content | 正常なDELETE（レスポンスボディなし） |
| 400 | Bad Request | リクエスト不正 |
| 401 | Unauthorized | 認証エラー |
| 403 | Forbidden | 権限不足 |
| 404 | Not Found | リソース未検出 |
| 409 | Conflict | リソース競合 |
| 422 | Unprocessable Entity | バリデーションエラー |
| 500 | Internal Server Error | サーバーエラー |

#### エラーコード一覧

| コード | 説明 |
|-------|------|
| `UNAUTHORIZED` | 認証エラー |
| `FORBIDDEN` | 権限不足 |
| `NOT_FOUND` | リソース未検出 |
| `BAD_REQUEST` | リクエスト不正 |
| `VALIDATION_ERROR` | バリデーションエラー |
| `CONFLICT` | リソース競合 |
| `INTERNAL_ERROR` | サーバー内部エラー |
| `SERVICE_UNAVAILABLE` | サービス利用不可 |

### 1.5 ページネーション

```http
GET /api/v1/resource?page=1&per_page=20&sort=created_at&order=desc
```

**レスポンス**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### 1.6 バージョニング

- URLパスに `/v1/` を含める
- 後方互換性のない変更時に `/v2/` に移行

---

## 2. 認証認可サービス API

**ベースURL**: `http://localhost:8001/api/v1`

### 2.1 認証エンドポイント

#### 2.1.1 ログイン

```http
POST /auth/login
```

**リクエスト**:
```json
{
  "user_id": "admin@example.com",
  "password": "password123"
}
```

**レスポンス** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "user": {
    "id": "user-uuid",
    "user_id": "admin@example.com",
    "name": "管理者",
    "tenant_id": "tenant-uuid",
    "roles": [
      {
        "service_id": "service-uuid",
        "service_name": "テナント管理サービス",
        "role_code": "global_admin",
        "role_name": "全体管理者"
      }
    ]
  }
}
```

**エラー** (401):
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid user_id or password"
  }
}
```

**エラー** (403):
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Only privileged tenant users can login"
  }
}
```

#### 2.1.2 トークン検証

```http
POST /auth/verify
```

**リクエスト**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**レスポンス** (200):
```json
{
  "valid": true,
  "payload": {
    "user_id": "user-uuid",
    "tenant_id": "tenant-uuid",
    "roles": [...]
  }
}
```

**エラー** (401):
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

#### 2.1.3 現在のユーザー情報取得

```http
GET /auth/me
Authorization: Bearer {token}
```

**レスポンス** (200):
```json
{
  "id": "user-uuid",
  "user_id": "admin@example.com",
  "name": "管理者",
  "tenant_id": "tenant-uuid",
  "is_active": true,
  "created_at": "2024-01-15T10:00:00Z",
  "last_login_at": "2024-01-25T09:00:00Z",
  "roles": [...]
}
```

---

### 2.2 ユーザー管理エンドポイント

#### 2.2.1 ユーザー一覧取得

```http
GET /users?page=1&per_page=20&tenant_id={tenant_id}
Authorization: Bearer {token}
```

**必要ロール**: 閲覧者以上

**レスポンス** (200):
```json
{
  "data": [
    {
      "id": "user-uuid",
      "user_id": "user@example.com",
      "name": "山田太郎",
      "tenant_id": "tenant-uuid",
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 50,
    "total_pages": 3
  }
}
```

#### 2.2.2 ユーザー詳細取得

```http
GET /users/{user_id}
Authorization: Bearer {token}
```

**必要ロール**: 閲覧者以上

**レスポンス** (200):
```json
{
  "id": "user-uuid",
  "user_id": "user@example.com",
  "name": "山田太郎",
  "tenant_id": "tenant-uuid",
  "is_active": true,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-20T15:30:00Z",
  "last_login_at": "2024-01-25T09:00:00Z",
  "roles": [
    {
      "id": "role-uuid",
      "service_id": "service-uuid",
      "service_name": "テナント管理サービス",
      "role_code": "admin",
      "role_name": "管理者"
    }
  ]
}
```

#### 2.2.3 ユーザー作成

```http
POST /users
Authorization: Bearer {token}
```

**必要ロール**: 全体管理者

**リクエスト**:
```json
{
  "user_id": "newuser@example.com",
  "name": "新規ユーザー",
  "password": "initialPassword123",
  "tenant_id": "tenant-uuid"
}
```

**レスポンス** (201):
```json
{
  "id": "user-uuid",
  "user_id": "newuser@example.com",
  "name": "新規ユーザー",
  "tenant_id": "tenant-uuid",
  "is_active": true,
  "created_at": "2024-01-25T10:00:00Z"
}
```

**エラー** (409):
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "User ID already exists"
  }
}
```

#### 2.2.4 ユーザー更新

```http
PUT /users/{user_id}
Authorization: Bearer {token}
```

**必要ロール**: 全体管理者

**リクエスト**:
```json
{
  "name": "更新後の名前",
  "is_active": true
}
```

**レスポンス** (200):
```json
{
  "id": "user-uuid",
  "user_id": "user@example.com",
  "name": "更新後の名前",
  "tenant_id": "tenant-uuid",
  "is_active": true,
  "updated_at": "2024-01-25T11:00:00Z"
}
```

#### 2.2.5 ユーザー削除

```http
DELETE /users/{user_id}
Authorization: Bearer {token}
```

**必要ロール**: 全体管理者

**レスポンス** (204): No Content

---

### 2.3 ロール管理エンドポイント

#### 2.3.1 ロール一覧取得

```http
GET /roles?service_id={service_id}
Authorization: Bearer {token}
```

**必要ロール**: 閲覧者以上

**レスポンス** (200):
```json
{
  "data": [
    {
      "id": "role-uuid",
      "service_id": "service-uuid",
      "service_name": "テナント管理サービス",
      "role_code": "global_admin",
      "role_name": "全体管理者",
      "description": "特権テナントに対する操作が可能",
      "permissions": ["tenant:*"]
    }
  ]
}
```

#### 2.3.2 ユーザーロール取得

```http
GET /users/{user_id}/roles
Authorization: Bearer {token}
```

**必要ロール**: 閲覧者以上

**レスポンス** (200):
```json
{
  "user_id": "user-uuid",
  "roles": [
    {
      "id": "role-uuid",
      "service_id": "service-uuid",
      "service_name": "テナント管理サービス",
      "role_code": "admin",
      "role_name": "管理者",
      "assigned_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### 2.3.3 ユーザーロール割り当て

```http
POST /users/{user_id}/roles
Authorization: Bearer {token}
```

**必要ロール**: 全体管理者

**リクエスト**:
```json
{
  "role_id": "role-uuid"
}
```

**レスポンス** (201):
```json
{
  "user_id": "user-uuid",
  "role_id": "role-uuid",
  "assigned_at": "2024-01-25T10:00:00Z"
}
```

**エラー** (403):
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Cannot assign role from service not available to user's tenant"
  }
}
```

#### 2.3.4 ユーザーロール削除

```http
DELETE /users/{user_id}/roles/{role_id}
Authorization: Bearer {token}
```

**必要ロール**: 全体管理者

**レスポンス** (204): No Content

---

## 3. テナント管理サービス API

**ベースURL**: `http://localhost:8002/api/v1`

### 3.1 テナント管理エンドポイント

#### 3.1.1 テナント一覧取得

```http
GET /tenants?page=1&per_page=20
Authorization: Bearer {token}
```

**必要ロール**: 閲覧者以上

**レスポンス** (200):
```json
{
  "data": [
    {
      "id": "tenant-uuid",
      "name": "株式会社サンプル",
      "domains": ["example.com"],
      "is_privileged": false,
      "user_count": 25,
      "service_count": 4,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 15,
    "total_pages": 1
  }
}
```

#### 3.1.2 テナント詳細取得

```http
GET /tenants/{tenant_id}
Authorization: Bearer {token}
```

**必要ロール**: 閲覧者以上

**レスポンス** (200):
```json
{
  "id": "tenant-uuid",
  "name": "株式会社サンプル",
  "domains": ["example.com", "sample.co.jp"],
  "is_privileged": false,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-20T15:30:00Z",
  "users": [
    {
      "id": "user-uuid",
      "user_id": "user@example.com",
      "name": "山田太郎"
    }
  ],
  "services": [
    {
      "id": "service-uuid",
      "name": "ファイル管理サービス",
      "assigned_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### 3.1.3 テナント作成

```http
POST /tenants
Authorization: Bearer {token}
```

**必要ロール**: 管理者以上

**リクエスト**:
```json
{
  "name": "株式会社新規",
  "domains": ["newcompany.com"]
}
```

**レスポンス** (201):
```json
{
  "id": "tenant-uuid",
  "name": "株式会社新規",
  "domains": ["newcompany.com"],
  "is_privileged": false,
  "created_at": "2024-01-25T10:00:00Z"
}
```

**エラー** (409):
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Tenant name already exists"
  }
}
```

#### 3.1.4 テナント更新

```http
PUT /tenants/{tenant_id}
Authorization: Bearer {token}
```

**必要ロール**: 管理者以上

**リクエスト**:
```json
{
  "name": "株式会社更新後",
  "domains": ["updated.com"]
}
```

**レスポンス** (200):
```json
{
  "id": "tenant-uuid",
  "name": "株式会社更新後",
  "domains": ["updated.com"],
  "is_privileged": false,
  "updated_at": "2024-01-25T11:00:00Z"
}
```

**エラー** (403):
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Cannot edit privileged tenant"
  }
}
```

#### 3.1.5 テナント削除

```http
DELETE /tenants/{tenant_id}
Authorization: Bearer {token}
```

**必要ロール**: 管理者以上

**レスポンス** (204): No Content

**エラー** (403):
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Cannot delete privileged tenant"
  }
}
```

---

### 3.2 テナントユーザー管理エンドポイント

#### 3.2.1 テナント所属ユーザー取得

```http
GET /tenants/{tenant_id}/users
Authorization: Bearer {token}
```

**必要ロール**: 閲覧者以上

**レスポンス** (200):
```json
{
  "tenant_id": "tenant-uuid",
  "users": [
    {
      "id": "user-uuid",
      "user_id": "user@example.com",
      "name": "山田太郎",
      "added_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### 3.2.2 テナントにユーザー追加

```http
POST /tenants/{tenant_id}/users
Authorization: Bearer {token}
```

**必要ロール**: 管理者以上（特権テナントの場合は全体管理者のみ）

**リクエスト**:
```json
{
  "user_id": "user-uuid"
}
```

**レスポンス** (201):
```json
{
  "tenant_id": "tenant-uuid",
  "user_id": "user-uuid",
  "added_at": "2024-01-25T10:00:00Z"
}
```

**エラー** (403):
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Only global admin can modify privileged tenant users"
  }
}
```

#### 3.2.3 テナントからユーザー削除

```http
DELETE /tenants/{tenant_id}/users/{user_id}
Authorization: Bearer {token}
```

**必要ロール**: 管理者以上（特権テナントの場合は全体管理者のみ）

**レスポンス** (204): No Content

---

## 4. 利用サービス設定サービス API

**ベースURL**: `http://localhost:8003/api/v1`

### 4.1 サービス管理エンドポイント

#### 4.1.1 サービス一覧取得

```http
GET /services
Authorization: Bearer {token}
```

**必要ロール**: 閲覧者以上

**レスポンス** (200):
```json
{
  "data": [
    {
      "id": "service-uuid",
      "name": "ファイル管理サービス",
      "description": "ファイルのアップロード・管理機能を提供",
      "is_active": true,
      "is_mock": true
    }
  ]
}
```

#### 4.1.2 サービス詳細取得

```http
GET /services/{service_id}
Authorization: Bearer {token}
```

**必要ロール**: 閲覧者以上

**レスポンス** (200):
```json
{
  "id": "service-uuid",
  "name": "ファイル管理サービス",
  "description": "ファイルのアップロード・管理機能を提供",
  "api_url": "https://api.example.com/file-management",
  "is_active": true,
  "is_mock": true,
  "roles": [
    {
      "role_code": "admin",
      "role_name": "管理者"
    },
    {
      "role_code": "user",
      "role_name": "ユーザー"
    }
  ]
}
```

---

### 4.2 テナントサービス管理エンドポイント

#### 4.2.1 テナントのサービス取得

```http
GET /tenants/{tenant_id}/services
Authorization: Bearer {token}
```

**必要ロール**: 閲覧者以上

**レスポンス** (200):
```json
{
  "tenant_id": "tenant-uuid",
  "services": [
    {
      "id": "service-uuid",
      "name": "ファイル管理サービス",
      "assigned_at": "2024-01-15T10:00:00Z",
      "assigned_by": "admin-user-uuid"
    }
  ]
}
```

#### 4.2.2 テナントにサービス割り当て

```http
POST /tenants/{tenant_id}/services
Authorization: Bearer {token}
```

**必要ロール**: 全体管理者

**リクエスト**:
```json
{
  "service_id": "service-uuid"
}
```

**レスポンス** (201):
```json
{
  "tenant_id": "tenant-uuid",
  "service_id": "service-uuid",
  "assigned_at": "2024-01-25T10:00:00Z"
}
```

**エラー** (409):
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Service already assigned to tenant"
  }
}
```

#### 4.2.3 テナントからサービス解除

```http
DELETE /tenants/{tenant_id}/services/{service_id}
Authorization: Bearer {token}
```

**必要ロール**: 全体管理者

**レスポンス** (204): No Content

---

## 5. BFF API (Next.js)

**ベースURL**: `http://localhost:3000/api`

BFFはバックエンドサービスのプロキシとして機能し、データを集約して返却します。

### 5.1 認証関連

#### 5.1.1 ログイン

```http
POST /api/auth/login
```

**リクエスト**:
```json
{
  "user_id": "admin@example.com",
  "password": "password123"
}
```

**レスポンス** (200):
- Cookie に JWT を設定
- レスポンスボディは認証サービスと同様

**処理フロー**:
1. 認証サービスの `/auth/login` を呼び出し
2. JWT を Cookie に設定（httpOnly, secure）
3. ユーザー情報を返却

#### 5.1.2 ログアウト

```http
POST /api/auth/logout
```

**レスポンス** (200):
```json
{
  "message": "Logged out successfully"
}
```

**処理**: Cookie をクリア

#### 5.1.3 現在のユーザー情報

```http
GET /api/auth/me
```

**レスポンス**: 認証サービスと同様

---

### 5.2 テナント管理

エンドポイントは基本的にバックエンドサービスと同じですが、BFFでデータを集約します。

#### 5.2.1 テナント詳細取得（データ集約版）

```http
GET /api/tenants/{tenant_id}
```

**レスポンス** (200):
```json
{
  "id": "tenant-uuid",
  "name": "株式会社サンプル",
  "domains": ["example.com"],
  "is_privileged": false,
  "created_at": "2024-01-15T10:00:00Z",
  "users": [
    {
      "id": "user-uuid",
      "user_id": "user@example.com",
      "name": "山田太郎",
      "roles": [
        {
          "service_name": "テナント管理サービス",
          "role_name": "管理者"
        }
      ]
    }
  ],
  "services": [
    {
      "id": "service-uuid",
      "name": "ファイル管理サービス",
      "assigned_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**処理フロー**:
1. テナント管理サービスでテナント情報取得
2. 認証サービスでユーザー詳細とロール取得
3. サービス設定サービスでサービス一覧取得
4. データを集約してレスポンス

---

## 6. モックサービス API

BFF内に実装されたモックサービスのAPIです。

### 6.1 ファイル管理サービス

#### 6.1.1 ファイル一覧取得

```http
GET /api/mock/file-management/files
Authorization: Bearer {token}
```

**レスポンス** (200):
```json
{
  "files": [
    {
      "id": "file-1",
      "name": "document.pdf",
      "size": 1024000,
      "mime_type": "application/pdf",
      "uploaded_at": "2024-01-15T10:30:00Z",
      "uploaded_by": "user-1",
      "uploaded_by_name": "山田太郎"
    }
  ]
}
```

---

### 6.2 メッセージングサービス

#### 6.2.1 メッセージ一覧取得

```http
GET /api/mock/messaging/messages
Authorization: Bearer {token}
```

**レスポンス** (200):
```json
{
  "messages": [
    {
      "id": "msg-1",
      "subject": "System Update",
      "body": "The system will be updated tonight.",
      "sent_at": "2024-01-15T10:00:00Z",
      "sent_by": "admin-1",
      "sent_by_name": "システム管理者",
      "read": false
    }
  ]
}
```

---

### 6.3 API利用サービス

#### 6.3.1 API利用状況取得

```http
GET /api/mock/api-usage/status
Authorization: Bearer {token}
```

**レスポンス** (200):
```json
{
  "tenant_id": "tenant-uuid",
  "total_requests": 15000,
  "remaining_quota": 35000,
  "quota_limit": 50000,
  "reset_date": "2024-02-01T00:00:00Z",
  "current_period": {
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-02-01T00:00:00Z"
  }
}
```

---

### 6.4 バックアップサービス

#### 6.4.1 バックアップ一覧取得

```http
GET /api/mock/backup/backups
Authorization: Bearer {token}
```

**レスポンス** (200):
```json
{
  "backups": [
    {
      "id": "backup-1",
      "created_at": "2024-01-15T02:00:00Z",
      "size": 5120000,
      "status": "completed",
      "retention_until": "2024-02-15T02:00:00Z"
    }
  ]
}
```

#### 6.4.2 バックアップ実行

```http
POST /api/mock/backup/execute
Authorization: Bearer {token}
```

**必要ロール**: 管理者

**レスポンス** (201):
```json
{
  "id": "backup-2",
  "status": "in_progress",
  "started_at": "2024-01-25T10:00:00Z"
}
```

---

## 7. ヘルスチェック

すべてのサービスで共通のヘルスチェックエンドポイントを提供します。

```http
GET /health
```

**レスポンス** (200):
```json
{
  "status": "healthy",
  "service": "auth-service",
  "version": "1.0.0",
  "timestamp": "2024-01-25T10:00:00Z",
  "dependencies": {
    "database": "healthy"
  }
}
```

---

## 8. レート制限

PoCのため未実装ですが、本番環境では以下を推奨：

- **認証エンドポイント**: 5リクエスト/分/IP
- **一般エンドポイント**: 100リクエスト/分/ユーザー

---

## 9. Webhooks（将来拡張）

PoCでは未実装。

---

## 変更履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|-------|
| 1.0.0 | 2024 | 初版作成 | Architecture Agent |
