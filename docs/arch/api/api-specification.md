# API 共通仕様書

## ドキュメント情報

- **バージョン**: 2.0.0
- **最終更新日**: 2024年
- **ステータス**: Draft

---

## 目次

1. [共通仕様](#1-共通仕様)
2. [サービス別API仕様](#2-サービス別api仕様)
3. [ヘルスチェック](#3-ヘルスチェック)

---

## 1. 共通仕様

### 1.1 ベースURL

| 環境         | URL                                      |
| ------------ | ---------------------------------------- |
| **開発環境** | http://localhost:{PORT}                  |
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

| コード | 説明                  | 使用ケース                           |
| ------ | --------------------- | ------------------------------------ |
| 200    | OK                    | 正常なGET、PUT、DELETE               |
| 201    | Created               | 正常なPOST（リソース作成）           |
| 204    | No Content            | 正常なDELETE（レスポンスボディなし） |
| 400    | Bad Request           | リクエスト不正                       |
| 401    | Unauthorized          | 認証エラー                           |
| 403    | Forbidden             | 権限不足                             |
| 404    | Not Found             | リソース未検出                       |
| 409    | Conflict              | リソース競合                         |
| 422    | Unprocessable Entity  | バリデーションエラー                 |
| 500    | Internal Server Error | サーバーエラー                       |

#### エラーコード一覧

| コード                | 説明                 |
| --------------------- | -------------------- |
| `UNAUTHORIZED`        | 認証エラー           |
| `FORBIDDEN`           | 権限不足             |
| `NOT_FOUND`           | リソース未検出       |
| `BAD_REQUEST`         | リクエスト不正       |
| `VALIDATION_ERROR`    | バリデーションエラー |
| `CONFLICT`            | リソース競合         |
| `INTERNAL_ERROR`      | サーバー内部エラー   |
| `SERVICE_UNAVAILABLE` | サービス利用不可     |

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

## 2. サービス別API仕様

各サービスのAPI詳細仕様は、各サービスリポジトリの `docs/api-specification.md` を参照してください。

| サービス                     | API仕様書                                                                                                                   |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **認証認可サービス**         | [src/auth-service/docs/api-specification.md](../../../src/auth-service/docs/api-specification.md)                           |
| **テナント管理サービス**     | [src/tenant-management-service/docs/api-specification.md](../../../src/tenant-management-service/docs/api-specification.md) |
| **利用サービス設定サービス** | [src/service-setting-service/docs/api-specification.md](../../../src/service-setting-service/docs/api-specification.md)     |
| **Frontend (BFF)**           | [src/front/docs/api-specification.md](../../../src/front/docs/api-specification.md)                                         |

---

## 3. ヘルスチェック

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

## 4. レート制限

PoCのため未実装ですが、本番環境では以下を推奨：

- **認証エンドポイント**: 5リクエスト/分/IP
- **一般エンドポイント**: 100リクエスト/分/ユーザー

---

## 変更履歴

| バージョン | 日付 | 変更内容                                                          | 作成者             |
| ---------- | ---- | ----------------------------------------------------------------- | ------------------ |
| 2.0.0      | 2024 | サービス別API仕様を各サービスリポジトリに分離。共通仕様のみ保持。 | Architecture Agent |
| 1.0.0      | 2024 | 初版作成                                                          | Architecture Agent |
