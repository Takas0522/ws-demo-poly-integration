# Mock Services

FastAPIベースのモックサービス群。4つのサービスの `/api/roles` エンドポイントを提供します。

## サービス一覧

1. **ファイル管理サービス** (`/file-management`)
2. **メッセージングサービス** (`/messaging`)
3. **API利用サービス** (`/api-usage`)
4. **バックアップサービス** (`/backup`)

## エンドポイント

### ファイル管理サービス
- `GET /file-management/api/roles` - ロール情報取得（管理者、編集者、閲覧者）

### メッセージングサービス
- `GET /messaging/api/roles` - ロール情報取得（管理者、送信者、閲覧者）

### API利用サービス
- `GET /api-usage/api/roles` - ロール情報取得（管理者、利用者、閲覧者）

### バックアップサービス
- `GET /backup/api/roles` - ロール情報取得（管理者、実行者、閲覧者）

## レスポンス形式

すべての `/api/roles` エンドポイントは以下の形式でレスポンスを返します：

```json
{
  "data": {
    "roles": [
      { "id": "admin", "name": "管理者" },
      { "id": "editor", "name": "編集者" },
      { "id": "viewer", "name": "閲覧者" }
    ]
  }
}
```

## ローカル開発

### インストール

```bash
cd src/mock-services
pip install -r requirements.txt
```

### 起動

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8004
```

### アクセス

- API: http://localhost:8004
- Swagger UI: http://localhost:8004/docs
- ReDoc: http://localhost:8004/redoc

## Docker

### ビルド

```bash
docker build -t mock-services .
```

### 実行

```bash
docker run -p 8004:8004 mock-services
```

## テスト

```bash
# ファイル管理サービス
curl http://localhost:8004/file-management/api/roles

# メッセージングサービス
curl http://localhost:8004/messaging/api/roles

# API利用サービス
curl http://localhost:8004/api-usage/api/roles

# バックアップサービス
curl http://localhost:8004/backup/api/roles
```
