# API ドキュメント

このディレクトリには、SaaS 管理者 Web アプリケーションのすべてのサービスに関する API ドキュメントが含まれています。

## 📋 概要

このアプリケーションの各サービスは、OpenAPI 3.0 仕様を使用して文書化された RESTful API を公開しています。このディレクトリは以下を提供します：

- 統一された API ドキュメント標準
- サービス固有の API リファレンス
- 認証と認可のガイド
- 共通の API パターンと規約
- インタラクティブな API Explorer
- 自動型生成パイプライン

## 🚀 クイックスタート

### 1. API Explorer で確認

ブラウザで [api-explorer.html](./api-explorer.html) を開いて、すべての API をインタラクティブに探索できます。

### 2. OpenAPI 仕様を確認

各サービスの `openapi.yaml` ファイルで完全な API 仕様を確認：

- [Authentication Service](./auth-service/openapi.yaml)
- [User Management Service](./user-management-service/openapi.yaml)
- [Service Settings Service](./service-setting-service/openapi.yaml)

### 3. 型を生成

OpenAPI 仕様から TypeScript 型を自動生成：

```bash
cd packages/@types
npm run generate
```

詳細は [型生成パイプライン](./TYPE_GENERATION_PIPELINE.md) を参照。

## 🏗️ サービス

### 認証サービス

- **パス**: [auth-service/](./auth-service/)
- **技術スタック**: Python, FastAPI
- **ベース URL**: `http://localhost:3001/api`
- **目的**: JWT 認証、トークン管理、権限検証
- **Swagger UI**: `http://localhost:3001/docs`

### ユーザー管理サービス

- **パス**: [user-management-service/](./user-management-service/)
- **OpenAPI 仕様**: [openapi.yaml](./user-management-service/openapi.yaml)
- **技術スタック**: Python, FastAPI, CosmosDB
- **ベース URL**: `http://localhost:3002/api`
- **目的**: ユーザー CRUD 操作とプロファイル管理
- **Swagger UI**: `http://localhost:3002/docs`

### サービス設定サービス

- **パス**: [service-setting-service/](./service-setting-service/)
- **OpenAPI 仕様**: [openapi.yaml](./service-setting-service/openapi.yaml)
- **技術スタック**: Python, FastAPI, CosmosDB
- **ベース URL**: `http://localhost:3003/api`
- **目的**: サービス構成と機能フラグ管理
- **Swagger UI**: `http://localhost:3003/docs`

## 📚 ドキュメント

### ガイド

- **[API Explorer](./api-explorer.html)** - インタラクティブな API ドキュメント
- **[API Versioning Strategy](./API_VERSIONING_STRATEGY.md)** - バージョニング戦略
- **[Swagger UI Integration](./SWAGGER_UI_INTEGRATION.md)** - Swagger UI 統合ガイド
- **[Type Generation Pipeline](./TYPE_GENERATION_PIPELINE.md)** - 型生成パイプライン

### サービス別ドキュメント

- [認証サービス API](./auth-service/README.md)
- [ユーザー管理サービス API](./user-management-service/README.md)
- [サービス設定サービス API](./service-setting-service/README.md)

## 🔐 認証

すべての API（公開エンドポイントを除く）は JWT 認証が必要です。

### トークンの取得

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**レスポンス：**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h",
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "田中太郎"
    }
  }
}
```

### トークンの使用

`Authorization`ヘッダーにトークンを含めます：

```bash
GET /api/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### トークンのリフレッシュ

```bash
POST /api/auth/refresh
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📡 共通 API パターン

### リクエスト形式

すべての API リクエストは以下の規約に従う必要があります：

**ヘッダー：**

```
Content-Type: application/json
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>  (マルチテナント操作用)
```

**リスト用のクエリパラメータ：**

- `page` (number): ページ番号（デフォルト: 1）
- `limit` (number): ページあたりのアイテム数（デフォルト: 20、最大: 100）
- `sort` (string): ソートフィールド（降順は`-`プレフィックス）
- `filter` (string): フィルター式

**例：**

```bash
GET /api/users?page=1&limit=20&sort=-createdAt&filter=active:true
```

### レスポンス形式

すべての API レスポンスは標準形式に従います：

**成功レスポンス：**

```json
{
  "success": true,
  "data": {
    // レスポンスデータ
  },
  "metadata": {
    "timestamp": "2026-01-07T00:00:00Z",
    "requestId": "req-123"
  }
}
```

**リストレスポンス：**

```json
{
  "success": true,
  "data": [
    // アイテムの配列
  ],
  "metadata": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

**エラーレスポンス：**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "人間が読めるエラーメッセージ",
    "details": {
      "field": "追加のコンテキスト"
    }
  },
  "metadata": {
    "timestamp": "2026-01-07T00:00:00Z",
    "requestId": "req-123"
  }
}
```

## 🔢 ステータスコード

### 成功コード

- **200 OK**: 成功した GET、PUT、または PATCH リクエスト
- **201 Created**: リソースを作成する成功した POST リクエスト
- **204 No Content**: 成功した DELETE リクエスト

### クライアントエラーコード

- **400 Bad Request**: 無効なリクエスト形式またはパラメータ
- **401 Unauthorized**: 認証トークンがないか無効
- **403 Forbidden**: 有効な認証だが権限不足
- **404 Not Found**: リクエストされたリソースが存在しない
- **409 Conflict**: リクエストが現在の状態と競合（例：重複）
- **422 Unprocessable Entity**: 検証エラー
- **429 Too Many Requests**: レート制限を超過

### サーバーエラーコード

- **500 Internal Server Error**: 予期しないサーバーエラー
- **502 Bad Gateway**: アップストリームサービスエラー
- **503 Service Unavailable**: サービスが一時的に利用不可
- **504 Gateway Timeout**: アップストリームサービスタイムアウト

## 🚨 エラーコード

すべてのサービスで使用される標準エラーコード：

### 認証エラー (AUTH\_\*)

- `AUTH_INVALID_CREDENTIALS`: 無効なメールまたはパスワード
- `AUTH_TOKEN_EXPIRED`: JWT トークンの有効期限切れ
- `AUTH_TOKEN_INVALID`: JWT トークンが不正または無効
- `AUTH_UNAUTHORIZED`: 認証トークンが提供されていない

### 認可エラー (AUTHZ\_\*)

- `AUTHZ_INSUFFICIENT_PERMISSIONS`: ユーザーに必要な権限がない
- `AUTHZ_FORBIDDEN`: このユーザーにはアクションが許可されていない

### 検証エラー (VALIDATION\_\*)

- `VALIDATION_FAILED`: 一般的な検証失敗
- `VALIDATION_REQUIRED_FIELD`: 必須フィールドが欠落
- `VALIDATION_INVALID_FORMAT`: フィールドの形式が無効
- `VALIDATION_OUT_OF_RANGE`: 許可された範囲外の値

### リソースエラー (RESOURCE\_\*)

- `RESOURCE_NOT_FOUND`: リクエストされたリソースが存在しない
- `RESOURCE_ALREADY_EXISTS`: 同じ識別子のリソースが存在
- `RESOURCE_CONFLICT`: 操作がリソースの状態と競合

### データベースエラー (DB\_\*)

- `DB_CONNECTION_ERROR`: データベースへの接続に失敗
- `DB_QUERY_ERROR`: データベースクエリが失敗
- `DB_CONSTRAINT_VIOLATION`: データベース制約に違反

### レート制限 (RATE*LIMIT*\*)

- `RATE_LIMIT_EXCEEDED`: 時間枠内のリクエストが多すぎる

## 🔄 バージョニング

API は URL パスバージョニングを使用してバージョン管理されます：

```
/api/v1/users
/api/v2/users
```

**現在のバージョン**: v1

**バージョンサポートポリシー**:

- 現在のバージョン（v1）：完全にサポート
- 前のバージョン（v0）：非推奨、6 か月のサンセット期間
- 古いバージョン：サポートされていない

## 📄 ページネーション

リストエンドポイントは、カーソルベースとオフセットベースのページネーションをサポートします。

### オフセットベースのページネーション（デフォルト）

**リクエスト：**

```bash
GET /api/users?page=2&limit=20
```

**レスポンス：**

```json
{
  "success": true,
  "data": [...],
  "metadata": {
    "total": 100,
    "page": 2,
    "limit": 20,
    "pages": 5
  }
}
```

### カーソルベースのページネーション

**リクエスト：**

```bash
GET /api/users?cursor=eyJpZCI6IjEyMyJ9&limit=20
```

**レスポンス：**

```json
{
  "success": true,
  "data": [...],
  "metadata": {
    "nextCursor": "eyJpZCI6IjE0MyJ9",
    "hasMore": true,
    "limit": 20
  }
}
```

## 🔍 フィルタリングとソート

### フィルタリング

クエリパラメータを使用してフィルタリング：

**シンプルフィルター：**

```bash
GET /api/users?status=active&role=admin
```

**複雑なフィルター（JSON）：**

```bash
GET /api/users?filter={"status":"active","createdAt":{"$gte":"2026-01-01"}}
```

### ソート

フィールド名を指定して`sort`パラメータを使用：

**昇順：**

```bash
GET /api/users?sort=name
```

**降順：**

```bash
GET /api/users?sort=-createdAt
```

**複数フィールド：**

```bash
GET /api/users?sort=status,-createdAt
```

## 🔐 セキュリティベストプラクティス

### 入力検証

- 処理前にすべての入力を検証
- 厳格な型チェックを適用
- SQL インジェクション防止
- テキスト入力の XSS 保護

### レート制限

- **匿名ユーザー**: 60 リクエスト/分
- **認証済みユーザー**: 300 リクエスト/分
- **プレミアムユーザー**: 1000 リクエスト/分

レート制限ヘッダー：

```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 275
X-RateLimit-Reset: 1704672000
```

### CORS

Cross-Origin Resource Sharing（CORS）は以下のために設定されています：

- 開発環境：`http://localhost:*`
- ステージング環境：`https://*.staging.example.com`
- 本番環境：`https://*.example.com`

## 🧪 API のテスト

### cURL を使用

```bash
# ログイン
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# 認証済みリクエスト
curl -X GET http://localhost:3002/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Postman を使用

各サービスのドキュメントフォルダから Postman に OpenAPI 仕様ファイルをインポートします。

### Swagger UI を使用

各サービスは対話的な API テストのための Swagger UI を提供します：

- 認証サービス：`http://localhost:3001/api-docs`
- ユーザーサービス：`http://localhost:3002/api-docs`
- 設定サービス：`http://localhost:3003/api-docs`

## 📊 監視とロギング

### リクエストトレース

すべてのリクエストには、トレース用の一意の`X-Request-ID`ヘッダーが含まれます：

```
X-Request-ID: req-abc123def456
```

この ID を使用して、ログ内でサービス間のリクエストをトレースします。

### ヘルスチェック

すべてのサービスは標準のヘルスチェックエンドポイントを提供します：

```bash
GET /health           # 基本的なヘルスチェック
GET /health/ready     # レディネスチェック（依存関係を含む）
GET /health/live      # ライブネスチェック
```

## 🔧 開発ツール

### API テストコレクション

Postman コレクションは各サービスの`/docs`ディレクトリで利用可能です。

### コード生成

OpenAPI 仕様を使用してクライアント SDK を生成できます：

```bash
# TypeScriptクライアントを生成
npm run generate:client

# Pythonクライアントを生成
npm run generate:client:python
```

## 📚 追加リソース

- [OpenAPI Specification](https://swagger.io/specification/)
- [REST API Best Practices](https://restfulapi.net/)
- [JWT Authentication](https://jwt.io/introduction)

## 🤝 コントリビューション

新しい API を追加する場合：

1. ここで文書化された規約に従う
2. OpenAPI 仕様を更新
3. すべてのエンドポイントの例を追加
4. エラーコードをドキュメント化
5. 統合テストを含める

詳細なガイドラインについては[CONTRIBUTING.md](../../CONTRIBUTING.md)を参照してください。

---

**最終更新**: 2026-01-07
