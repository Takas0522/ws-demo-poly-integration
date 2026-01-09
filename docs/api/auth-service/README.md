# 認証サービスAPI

JWTベースの認証とトークン管理のためのREST API。

## ベースURL

- **開発環境**: `http://localhost:3001/api`
- **ステージング環境**: `https://auth-staging.example.com/api`
- **本番環境**: `https://auth.example.com/api`

## 概要

認証サービスは以下を処理します：
- ユーザーログインとログアウト
- JWTトークンの生成と検証
- トークンリフレッシュメカニズム
- パスワードリセットフロー
- セッション管理

## エンドポイント

### POST /auth/login

ユーザーを認証してJWTトークンを返します。

**リクエスト：**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**レスポンス（200 OK）：**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh-token-string",
    "expiresIn": "24h",
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "田中太郎",
      "tenantId": "tenant-456",
      "permissions": ["user.read", "user.write"]
    }
  }
}
```

**エラーレスポンス：**
- `401 Unauthorized`: 無効な認証情報
- `400 Bad Request`: 必須フィールドが欠落

---

### POST /auth/refresh

既存のJWTトークンをリフレッシュします。

**リクエストヘッダー：**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**リクエスト：**
```json
{
  "refreshToken": "refresh-token-string"
}
```

**レスポンス（200 OK）：**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

---

### POST /auth/logout

現在のJWTトークンを無効化します。

**リクエストヘッダー：**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**レスポンス（204 No Content）**

---

### POST /auth/forgot-password

パスワードリセットフローを開始します。

**リクエスト：**
```json
{
  "email": "user@example.com"
}
```

**レスポンス（200 OK）：**
```json
{
  "success": true,
  "message": "パスワードリセットメールを送信しました"
}
```

---

### POST /auth/reset-password

リセットトークンを使用してパスワードをリセットします。

**リクエスト：**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePassword123"
}
```

**レスポンス（200 OK）：**
```json
{
  "success": true,
  "message": "パスワードリセットが成功しました"
}
```

---

### POST /auth/verify-token

JWTトークンが有効かどうかを検証します。

**リクエストヘッダー：**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**レスポンス（200 OK）：**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": "user-123",
      "email": "user@example.com"
    }
  }
}
```

---

## トークン構造

JWTトークンには以下のクレームが含まれます：

```json
{
  "sub": "user-123",           // ユーザーID
  "email": "user@example.com",
  "tenantId": "tenant-456",
  "permissions": ["user.read", "user.write"],
  "iat": 1704672000,           // 発行時刻
  "exp": 1704758400            // 有効期限
}
```

## エラーコード

| コード | 説明 |
|------|-------------|
| `AUTH_INVALID_CREDENTIALS` | メールまたはパスワードが正しくありません |
| `AUTH_TOKEN_EXPIRED` | JWTトークンの有効期限が切れています |
| `AUTH_TOKEN_INVALID` | JWTトークンが不正または無効です |
| `AUTH_REFRESH_TOKEN_INVALID` | リフレッシュトークンが無効または期限切れです |
| `AUTH_USER_NOT_FOUND` | ユーザーアカウントが存在しません |
| `AUTH_PASSWORD_RESET_INVALID` | パスワードリセットトークンが無効または期限切れです |

## OpenAPI仕様

完全なOpenAPI 3.0仕様については[openapi.yaml](./openapi.yaml)を参照してください。

---

**最終更新**: 2026-01-07
