# API設計

## 1. 概要

本ドキュメントは、マルチテナント管理アプリケーションのAPI設計を定義します。RESTful APIの原則に従い、統一されたインターフェースとエラーハンドリングを提供します。

### 1.1 設計原則

1. **RESTful**: リソース指向の設計
2. **一貫性**: すべてのサービスで統一されたAPI規約
3. **バージョニング**: URLパスでのバージョン管理 (`/api/v1/...`)
4. **セキュリティ**: すべてのエンドポイントでJWT認証必須
5. **可観測性**: リクエストID、トレーシング情報の伝播

### 1.2 API構成

```
https://api.example.com
├── /api/v1/auth          # Auth Service
├── /api/v1/tenants       # Tenant Management Service
├── /api/v1/users         # Auth Service (ユーザー管理)
├── /api/v1/services      # Service Setting Service
├── /api/v1/files         # File Service
├── /api/v1/messages      # Messaging Service
├── /api/v1/apis          # API Service
└── /api/v1/backups       # Backup Service
```

## 2. 共通仕様

### 2.1 HTTPメソッド

| メソッド | 用途 | 冪等性 |
|---------|------|--------|
| GET | リソース取得 | ✓ |
| POST | リソース作成 | × |
| PUT | リソース完全更新 | ✓ |
| PATCH | リソース部分更新 | × |
| DELETE | リソース削除 | ✓ |

### 2.2 HTTPステータスコード

| コード | 意味 | 使用例 |
|-------|------|--------|
| 200 | OK | 取得・更新成功 |
| 201 | Created | 作成成功 |
| 202 | Accepted | 非同期処理受付 |
| 204 | No Content | 削除成功 |
| 400 | Bad Request | バリデーションエラー |
| 401 | Unauthorized | 認証失敗 |
| 403 | Forbidden | 認可失敗 |
| 404 | Not Found | リソース未発見 |
| 409 | Conflict | 競合（重複など） |
| 422 | Unprocessable Entity | セマンティックエラー |
| 429 | Too Many Requests | レート制限超過 |
| 500 | Internal Server Error | サーバーエラー |
| 503 | Service Unavailable | サービス利用不可 |

### 2.3 リクエストヘッダー

```http
Authorization: Bearer {JWT}
Content-Type: application/json
Accept: application/json
X-Request-ID: {UUID}
X-Tenant-ID: {tenant_id}  # オプション：テナント指定
Accept-Language: ja-JP
```

### 2.4 レスポンスヘッダー

```http
Content-Type: application/json
X-Request-ID: {UUID}
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1738406400
```

### 2.5 認証

すべてのAPIエンドポイント（ヘルスチェック除く）はJWT認証が必要です：

```http
GET /api/v1/tenants
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**JWT構造:**
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-uuid",
    "tenant_id": "tenant-uuid",
    "roles": [
      {"service": "tenant", "role": "全体管理者"},
      {"service": "auth", "role": "閲覧者"}
    ],
    "exp": 1738435200,
    "iat": 1738406400,
    "iss": "auth-service",
    "aud": "api-services"
  }
}
```

## 3. Auth Service API

### 3.1 認証エンドポイント

#### POST /api/v1/auth/login

ユーザーログイン

**Request:**
```json
{
  "username": "admin001",
  "password": "P@ssw0rd123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 28800,
  "user": {
    "id": "user-uuid",
    "username": "admin001",
    "email": "admin@example.com",
    "full_name": "管理者太郎",
    "tenant_id": "privileged-tenant",
    "is_privileged_tenant": true
  },
  "roles": [
    {
      "service": "tenant",
      "role": "全体管理者"
    },
    {
      "service": "auth",
      "role": "全体管理者"
    }
  ]
}
```

**Error Response (401):**
```json
{
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "ユーザー名またはパスワードが正しくありません",
    "timestamp": "2026-02-01T10:00:00Z",
    "trace_id": "abc-def-ghi"
  }
}
```

#### POST /api/v1/auth/logout

ログアウト（トークン無効化）

**Request:**
```
Authorization: Bearer {token}
```

**Response (204):**
```
(No Content)
```

#### POST /api/v1/validate/token

JWT検証（サービス間通信用）

**Request:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "user_id": "user-uuid",
  "tenant_id": "tenant-uuid",
  "roles": [
    {"service": "tenant", "role": "管理者"}
  ],
  "exp": 1738435200
}
```

### 3.2 ユーザー管理エンドポイント

#### GET /api/v1/users

ユーザー一覧取得

**Query Parameters:**
- `skip`: int (default: 0)
- `limit`: int (default: 100, max: 1000)
- `tenant_id`: string (optional)

**Response (200):**
```json
{
  "users": [
    {
      "id": "user-uuid",
      "username": "user001",
      "email": "user001@example.com",
      "full_name": "山田太郎",
      "tenant_id": "tenant-uuid",
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "total": 42,
  "skip": 0,
  "limit": 100
}
```

#### POST /api/v1/users

ユーザー作成

**Request:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "TempP@ss123",
  "full_name": "新規ユーザー",
  "tenant_id": "tenant-uuid",
  "is_privileged_tenant": false,
  "roles": [
    {
      "service": "tenant",
      "role": "閲覧者"
    }
  ]
}
```

**Response (201):**
```json
{
  "id": "user-new-uuid",
  "username": "newuser",
  "email": "newuser@example.com",
  "full_name": "新規ユーザー",
  "tenant_id": "tenant-uuid",
  "is_active": true,
  "created_at": "2026-02-01T10:00:00Z"
}
```

#### GET /api/v1/users/{user_id}

ユーザー詳細取得

**Response (200):**
```json
{
  "id": "user-uuid",
  "username": "user001",
  "email": "user001@example.com",
  "full_name": "山田太郎",
  "tenant_id": "tenant-uuid",
  "is_active": true,
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-02-01T10:00:00Z",
  "last_login": "2026-02-01T09:00:00Z",
  "roles": [
    {
      "service": "tenant",
      "role": "管理者",
      "assigned_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

#### PUT /api/v1/users/{user_id}

ユーザー更新

**Request:**
```json
{
  "email": "newemail@example.com",
  "full_name": "山田次郎",
  "is_active": true,
  "roles": [
    {
      "service": "tenant",
      "role": "全体管理者"
    }
  ]
}
```

**Response (200):**
```json
{
  "id": "user-uuid",
  "username": "user001",
  "email": "newemail@example.com",
  "full_name": "山田次郎",
  "tenant_id": "tenant-uuid",
  "is_active": true,
  "updated_at": "2026-02-01T10:30:00Z"
}
```

#### DELETE /api/v1/users/{user_id}

ユーザー削除

**Response (204):**
```
(No Content)
```

## 4. Tenant Management Service API

### 4.1 テナント管理エンドポイント

#### GET /api/v1/tenants

テナント一覧取得

**Query Parameters:**
- `skip`: int
- `limit`: int
- `status`: enum (active, suspended, deleted)

**Response (200):**
```json
{
  "tenants": [
    {
      "id": "tenant-uuid",
      "name": "example-corp",
      "display_name": "株式会社Example",
      "description": "サンプル企業",
      "is_privileged": false,
      "status": "active",
      "user_count": 25,
      "max_users": 100,
      "allowed_domains": ["example.com"],
      "created_at": "2026-01-01T00:00:00Z",
      "services": [
        {
          "service_id": "file-service",
          "service_name": "ファイル管理サービス",
          "enabled": true
        }
      ]
    }
  ],
  "total": 15,
  "skip": 0,
  "limit": 100
}
```

#### POST /api/v1/tenants

テナント作成

**Request:**
```json
{
  "name": "newcorp",
  "display_name": "株式会社NewCorp",
  "description": "新規顧客",
  "max_users": 50,
  "allowed_domains": ["newcorp.com", "newcorp.co.jp"]
}
```

**Response (201):**
```json
{
  "id": "tenant-new-uuid",
  "name": "newcorp",
  "display_name": "株式会社NewCorp",
  "description": "新規顧客",
  "is_privileged": false,
  "status": "active",
  "user_count": 0,
  "max_users": 50,
  "allowed_domains": ["newcorp.com", "newcorp.co.jp"],
  "created_at": "2026-02-01T10:00:00Z"
}
```

#### GET /api/v1/tenants/{tenant_id}

テナント詳細取得

#### PUT /api/v1/tenants/{tenant_id}

テナント更新

#### DELETE /api/v1/tenants/{tenant_id}

テナント削除（論理削除）

### 4.2 テナントユーザー管理エンドポイント

#### GET /api/v1/tenants/{tenant_id}/users

テナントユーザー一覧

**Response (200):**
```json
{
  "users": [
    {
      "user_id": "user-uuid",
      "user_name": "yamada",
      "user_email": "yamada@example.com",
      "added_at": "2026-01-15T10:00:00Z",
      "added_by": "admin-uuid"
    }
  ],
  "total": 25,
  "skip": 0,
  "limit": 100
}
```

#### POST /api/v1/tenants/{tenant_id}/users

テナントにユーザー追加

**Request:**
```json
{
  "user_id": "user-uuid"
}
```

**Response (201):**
```json
{
  "user_id": "user-uuid",
  "user_name": "yamada",
  "user_email": "yamada@example.com",
  "added_at": "2026-02-01T10:00:00Z"
}
```

#### DELETE /api/v1/tenants/{tenant_id}/users/{user_id}

テナントからユーザー削除

## 5. Service Setting Service API

### 5.1 サービスカタログエンドポイント

#### GET /api/v1/services

サービス一覧取得

**Query Parameters:**
- `category`: enum (core, business)
- `status`: enum (active, maintenance, deprecated)

**Response (200):**
```json
{
  "services": [
    {
      "id": "file-service",
      "name": "file-service",
      "display_name": "ファイル管理サービス",
      "description": "ファイルのアップロード、ダウンロード機能",
      "category": "business",
      "status": "active",
      "icon_url": "https://cdn.example.com/icons/file.svg"
    }
  ],
  "total": 7
}
```

#### GET /api/v1/services/{service_id}

サービス詳細取得

#### POST /api/v1/services

サービス登録（全体管理者のみ）

### 5.2 テナントサービス設定エンドポイント

#### GET /api/v1/tenants/{tenant_id}/services

テナント利用サービス一覧

**Response (200):**
```json
{
  "tenant_services": [
    {
      "service_id": "file-service",
      "service_name": "ファイル管理サービス",
      "enabled": true,
      "assigned_at": "2026-01-15T10:00:00Z"
    }
  ],
  "total": 4
}
```

#### POST /api/v1/tenants/{tenant_id}/services

サービス割り当て

**Request:**
```json
{
  "service_id": "messaging-service"
}
```

**Response (201):**
```json
{
  "service_id": "messaging-service",
  "service_name": "メッセージングサービス",
  "enabled": true,
  "assigned_at": "2026-02-01T10:00:00Z"
}
```

#### DELETE /api/v1/tenants/{tenant_id}/services/{service_id}

サービス解除

### 5.3 ロール情報エンドポイント

#### GET /api/v1/services/{service_id}/roles

サービスのロール情報取得

**Query Parameters:**
- `use_cache`: boolean (default: true)

**Response (200):**
```json
{
  "roles": [
    {
      "role_name": "file_admin",
      "role_display_name": "ファイル管理者",
      "description": "すべてのファイル操作が可能",
      "permissions": ["read", "write", "delete", "share", "manage"]
    },
    {
      "role_name": "file_editor",
      "role_display_name": "ファイル編集者",
      "description": "ファイルのアップロード、更新、ダウンロードが可能",
      "permissions": ["read", "write", "download"]
    }
  ]
}
```

#### GET /api/v1/tenants/{tenant_id}/roles

テナントが利用可能なサービスのロール情報取得

**Response (200):**
```json
{
  "file-service": [
    {
      "role_name": "file_admin",
      "role_display_name": "ファイル管理者",
      "permissions": ["read", "write", "delete"]
    }
  ],
  "messaging-service": [
    {
      "role_name": "messaging_user",
      "role_display_name": "メッセージング利用者",
      "permissions": ["read", "write"]
    }
  ]
}
```

## 6. ビジネスサービス API（例：File Service）

### 6.1 ファイル管理エンドポイント

#### GET /api/v1/files

ファイル一覧取得

#### POST /api/v1/files

ファイルアップロード（multipart/form-data）

**Request:**
```http
POST /api/v1/files
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary
Authorization: Bearer {token}

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

{binary data}
------WebKitFormBoundary--
```

**Response (201):**
```json
{
  "id": "file-uuid",
  "name": "document.pdf",
  "size": 1048576,
  "mime_type": "application/pdf",
  "uploaded_at": "2026-02-01T10:00:00Z"
}
```

#### GET /api/v1/files/{file_id}

ファイル詳細取得

#### GET /api/v1/files/{file_id}/download

ファイルダウンロード

**Response (200):**
```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="document.pdf"
Content-Length: 1048576

{binary data}
```

#### DELETE /api/v1/files/{file_id}

ファイル削除

## 7. エラーレスポンス

### 7.1 統一エラーフォーマット

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "人間が読めるエラーメッセージ",
    "details": {
      "field": "username",
      "reason": "既に使用されています"
    },
    "timestamp": "2026-02-01T10:00:00Z",
    "trace_id": "abc-def-ghi",
    "path": "/api/v1/users"
  }
}
```

### 7.2 エラーコード一覧

| コード | HTTPステータス | 説明 |
|-------|--------------|------|
| AUTHENTICATION_FAILED | 401 | 認証失敗 |
| TOKEN_EXPIRED | 401 | トークン期限切れ |
| INVALID_TOKEN | 401 | 不正なトークン |
| FORBIDDEN | 403 | アクセス権限なし |
| RESOURCE_NOT_FOUND | 404 | リソースなし |
| TENANT_NOT_FOUND | 404 | テナントなし |
| USER_NOT_FOUND | 404 | ユーザーなし |
| DUPLICATE_RESOURCE | 409 | リソース重複 |
| VALIDATION_ERROR | 400 | 入力検証エラー |
| RATE_LIMIT_EXCEEDED | 429 | レート制限超過 |
| INTERNAL_SERVER_ERROR | 500 | 内部サーバーエラー |
| SERVICE_UNAVAILABLE | 503 | サービス利用不可 |

### 7.3 バリデーションエラーの詳細

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データに誤りがあります",
    "details": {
      "fields": [
        {
          "field": "email",
          "message": "有効なメールアドレスを入力してください"
        },
        {
          "field": "password",
          "message": "パスワードは8文字以上である必要があります"
        }
      ]
    },
    "timestamp": "2026-02-01T10:00:00Z",
    "trace_id": "abc-def-ghi"
  }
}
```

## 8. ページネーション

### 8.1 オフセットベース

**Request:**
```http
GET /api/v1/tenants?skip=20&limit=10
```

**Response:**
```json
{
  "tenants": [...],
  "total": 150,
  "skip": 20,
  "limit": 10,
  "has_more": true
}
```

### 8.2 カーソルベース（Cosmos DB）

**Request:**
```http
GET /api/v1/files?limit=50&continuation_token=abc123
```

**Response:**
```json
{
  "files": [...],
  "continuation_token": "xyz789",
  "has_more": true
}
```

## 9. レート制限

### 9.1 制限値

| ユーザー種別 | 制限 |
|------------|------|
| 認証済み | 1000 req/hour |
| 特権テナント | 5000 req/hour |

### 9.2 レスポンスヘッダー

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1738410000
Retry-After: 3600
```

### 9.3 レート制限超過時

**Response (429):**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "レート制限を超過しました。しばらくしてから再試行してください",
    "details": {
      "limit": 1000,
      "reset_at": "2026-02-01T11:00:00Z"
    },
    "timestamp": "2026-02-01T10:30:00Z"
  }
}
```

## 10. API バージョニング

### 10.1 バージョニング戦略

- **URLパス**: `/api/v1/`, `/api/v2/`
- **後方互換性**: 新バージョンでも旧バージョンを維持（最低2バージョン）
- **非推奨化**: `Deprecated` ヘッダーで通知

**非推奨API:**
```http
GET /api/v1/old-endpoint
Deprecated: true
Sunset: 2027-01-01T00:00:00Z
Link: </api/v2/new-endpoint>; rel="alternate"
```

## 11. OpenAPI仕様

各サービスはOpenAPI 3.0仕様書を提供：

```http
GET /api/v1/openapi.json
```

**例:**
```json
{
  "openapi": "3.0.3",
  "info": {
    "title": "Tenant Management Service API",
    "version": "1.0.0",
    "description": "テナント管理サービスのAPI"
  },
  "servers": [
    {
      "url": "https://api.example.com/api/v1",
      "description": "Production"
    }
  ],
  "paths": {
    "/tenants": {
      "get": {
        "summary": "テナント一覧取得",
        "tags": ["tenants"],
        "security": [{"bearerAuth": []}],
        "responses": {
          "200": {
            "description": "成功"
          }
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  }
}
```

## 12. 関連ドキュメント

- [認証フロー](../security/authentication-flow.md)
- [データモデル](../data/data-model.md)
- [コンポーネント設計](../components/README.md)
