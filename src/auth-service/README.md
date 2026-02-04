# 認証認可サービス (Auth Service)

## 概要

本サービスは、ユーザーの認証（Authentication）と認可（Authorization）を管理するマイクロサービスです。  
ID/パスワード認証、JWT発行・検証、ロール管理機能を提供します。

## 技術スタック

- **フレームワーク**: FastAPI
- **言語**: Python 3.11+
- **データベース**: Azure Cosmos DB (NoSQL API)
- **認証**: JWT (JSON Web Token)
- **パスワードハッシュ**: bcrypt
- **バリデーション**: Pydantic

## ディレクトリ構造

```
src/auth-service/
├── app/
│   ├── main.py              # FastAPIアプリケーションエントリーポイント
│   ├── api/                 # APIエンドポイント
│   │   └── v1/
│   │       ├── auth.py      # 認証エンドポイント
│   │       ├── users.py     # ユーザー管理エンドポイント
│   │       └── roles.py     # ロール管理エンドポイント
│   ├── models/              # データモデル（Pydantic）
│   │   ├── user.py
│   │   ├── role.py
│   │   └── token.py
│   ├── repositories/        # データアクセス層
│   │   ├── user_repository.py
│   │   └── role_repository.py
│   ├── services/            # ビジネスロジック層
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   └── role_service.py
│   ├── core/                # コア機能
│   │   ├── config.py        # 設定管理
│   │   ├── database.py      # DB接続管理
│   │   ├── security.py      # JWT・パスワード処理
│   │   └── dependencies.py  # 依存性注入
│   └── utils/               # ユーティリティ
│       ├── logger.py
│       └── exceptions.py
├── tests/                   # テストコード
│   ├── unit/
│   └── integration/
├── .env                     # 環境変数
├── requirements.txt         # Python依存関係
├── Dockerfile              # Dockerイメージ定義
└── README.md               # このファイル
```

## セットアップ

### 1. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 2. 環境変数の設定

`.env` ファイルを作成：

```bash
# Cosmos DB
COSMOS_ENDPOINT=https://localhost:8081
COSMOS_KEY=your-cosmos-key
COSMOS_DATABASE_NAME=auth_management

# JWT
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# Application
APP_NAME=Auth Service
APP_VERSION=1.0.0
LOG_LEVEL=INFO

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

### 3. データベースの初期化

```bash
python -m app.scripts.init_db
```

### 4. サービスの起動

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

API ドキュメント: http://localhost:8001/docs

## 開発

### 新しいエンドポイントの追加

1. **モデル定義** (`app/models/`)
```python
# app/models/user.py
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
```

2. **リポジトリ実装** (`app/repositories/`)
```python
# app/repositories/user_repository.py
class UserRepository:
    async def create(self, user: UserCreate) -> User:
        # Cosmos DB への書き込み
        pass
```

3. **サービス実装** (`app/services/`)
```python
# app/services/user_service.py
class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo
    
    async def create_user(self, user: UserCreate) -> User:
        # ビジネスロジック
        hashed_password = hash_password(user.password)
        return await self.user_repo.create(user)
```

4. **エンドポイント実装** (`app/api/v1/`)
```python
# app/api/v1/users.py
from fastapi import APIRouter, Depends

router = APIRouter()

@router.post("/users", response_model=User)
async def create_user(
    user: UserCreate,
    service: UserService = Depends(get_user_service)
):
    return await service.create_user(user)
```

### 認証の追加

JWT認証が必要なエンドポイント：

```python
from app.core.dependencies import get_current_user

@router.get("/users/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    return current_user
```

### ロールベースアクセス制御

```python
from app.core.dependencies import require_role

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(require_role("全体管理者"))
):
    # 全体管理者のみアクセス可能
    pass
```

## テスト

### ユニットテスト

```bash
pytest tests/unit/
```

### 統合テスト

```bash
pytest tests/integration/
```

### カバレッジ

```bash
pytest --cov=app tests/
```

### リンター

```bash
# Flake8
flake8 app/

# Black (フォーマット)
black app/

# isort (import整理)
isort app/
```

## API エンドポイント

### 認証

#### ログイン
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

**レスポンス**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "user-uuid",
    "username": "admin",
    "roles": [...]
  }
}
```

#### トークン検証
```http
POST /api/v1/auth/verify
Authorization: Bearer {token}
```

### ユーザー管理

#### ユーザー一覧取得
```http
GET /api/v1/users?page=1&limit=20
Authorization: Bearer {token}
```

#### ユーザー作成
```http
POST /api/v1/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123"
}
```

#### ユーザー更新
```http
PUT /api/v1/users/{user_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "updated@example.com"
}
```

#### ユーザー削除
```http
DELETE /api/v1/users/{user_id}
Authorization: Bearer {token}
```

### ロール管理

#### ロール一覧取得
```http
GET /api/v1/roles
Authorization: Bearer {token}
```

#### ユーザーロール割り当て
```http
POST /api/v1/user-roles
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": "user-uuid",
  "service_id": "service-uuid",
  "role_code": "admin"
}
```

詳細は [API設計仕様書](../../docs/arch/api/api-specification.md#2-認証認可サービス-api) を参照してください。

## データモデル

### User

```json
{
  "id": "user-uuid",
  "type": "user",
  "username": "admin",
  "email": "admin@example.com",
  "password_hash": "$2b$12$...",
  "tenant_id": "tenant-uuid",
  "is_active": true,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-20T15:30:00Z"
}
```

### Role

```json
{
  "id": "role-uuid",
  "type": "role",
  "service_id": "service-uuid",
  "service_name": "テナント管理サービス",
  "role_code": "admin",
  "role_name": "管理者",
  "description": "テナント管理機能の管理者権限",
  "created_at": "2024-01-15T10:00:00Z"
}
```

詳細は [データ設計](../../docs/arch/data/data-model.md) を参照してください。

## セキュリティ

### パスワードハッシュ

- **アルゴリズム**: bcrypt
- **ソルトラウンド**: 12

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ハッシュ化
hashed = pwd_context.hash("password123")

# 検証
is_valid = pwd_context.verify("password123", hashed)
```

### JWT トークン

- **アルゴリズム**: HS256
- **有効期限**: 24時間（設定可能）
- **ペイロード**: user_id, tenant_id, roles

```python
import jwt
from datetime import datetime, timedelta

# トークン生成
payload = {
    "user_id": "user-uuid",
    "tenant_id": "tenant-uuid",
    "roles": [...],
    "exp": datetime.utcnow() + timedelta(minutes=1440)
}
token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

# トークン検証
payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
```

## トラブルシューティング

### Q: Cosmos DB に接続できない

```bash
# 接続文字列を確認
echo $COSMOS_ENDPOINT
echo $COSMOS_KEY

# Cosmos DB Emulator が起動しているか確認
docker ps | grep cosmos
```

### Q: JWT トークンが無効

- JWT_SECRET_KEY が正しいか確認
- トークンの有効期限が切れていないか確認
- アルゴリズムが一致しているか確認（HS256）

### Q: パスワードハッシュが一致しない

- bcrypt のバージョンを確認
- ソルトラウンドが一致しているか確認

## 関連ドキュメント

- [コンポーネント設計 - 認証認可サービス](../../docs/arch/components/README.md#2-認証認可サービス)
- [API設計仕様書](../../docs/arch/api/api-specification.md#2-認証認可サービス-api)
- [データ設計](../../docs/arch/data/data-model.md#22-認証認可データモデル)
- [アーキテクチャ概要](../../docs/arch/overview.md)

## ライセンス

MIT License
