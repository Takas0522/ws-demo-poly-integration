# 共通ライブラリ (management-app-common)

全バックエンドサービスで共通利用する基盤機能を提供するPythonパッケージです。

## 概要

本ライブラリは、以下の基盤機能を提供し、各マイクロサービスの開発効率と品質を向上させます：

- **認証**: JWTベースの認証・認可
- **データベース**: Cosmos DB接続とCRUD操作
- **ロギング**: 構造化ログ（JSON形式）
- **モデル**: 基底モデルとエラーレスポンス
- **ミドルウェア**: エラーハンドリング、リクエストID、CORS
- **ユーティリティ**: バリデーション、ヘルパー関数

## ビジネス価値

- **開発速度の向上**: 各サービスの開発時間を30-40%削減
- **品質の均一化**: コードレビュー時間を50%削減、セキュリティリスクを70%低減
- **保守性の向上**: バグ修正時間を60%削減
- **学習コストの削減**: オンボーディング期間を2週間短縮
- **テストカバレッジ向上**: 80%以上のカバレッジを保証

## インストール

```bash
# 開発環境
pip install -e .

# 本番環境
pip install management-app-common
```

## 使用例

### 1. FastAPIアプリケーションの初期化

```python
from fastapi import FastAPI
from common.middleware.error_handler import ErrorHandlerMiddleware
from common.middleware.request_id import RequestIDMiddleware
from common.auth.middleware import JWTAuthenticationMiddleware
from common.logging import setup_logging
from common.database.cosmos import CosmosDBClient
import os

# アプリケーション初期化
app = FastAPI(title="Tenant Management Service")

# ミドルウェア追加
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(JWTAuthenticationMiddleware)

# ロガー設定
logger = setup_logging("tenant-management-service", log_level="INFO")

# Cosmos DB初期化
cosmos_client = CosmosDBClient.get_instance(
    connection_string=os.getenv("COSMOS_CONNECTION_STRING"),
    database_name="management-app"
)
```

### 2. 認証とロールベース認可

```python
from fastapi import APIRouter, Depends
from common.auth.dependencies import get_current_user, require_role

router = APIRouter()

@router.get("/tenants")
@require_role("tenant-management", ["閲覧者", "管理者"])
async def list_tenants(current_user: dict = Depends(get_current_user)):
    """テナント一覧取得（閲覧者または管理者のみ）"""
    logger.info(f"User {current_user['user_id']} requested tenant list")
    # テナント一覧取得処理
    return {"tenants": []}
```

### 3. データベース操作

```python
from common.database.repository import BaseRepository
from common.models.base import BaseModel
from pydantic import Field

# モデル定義
class Tenant(BaseModel):
    tenant_id: str
    name: str
    is_privileged: bool = False
    user_count: int = 0

# リポジトリ実装
class TenantRepository(BaseRepository[Tenant]):
    def __init__(self, container):
        super().__init__(container, Tenant)
    
    async def find_by_name(self, tenant_id: str, name: str):
        query = "SELECT * FROM c WHERE c.tenantId = @tenant_id AND c.name = @name"
        parameters = [
            {"name": "@tenant_id", "value": tenant_id},
            {"name": "@name", "value": name}
        ]
        results = await self.query(query, parameters, partition_key=tenant_id)
        return results[0] if results else None

# 使用例
cosmos_client = CosmosDBClient.get_instance()
tenant_container = cosmos_client.get_container("tenants")
tenant_repo = TenantRepository(tenant_container)

# CRUD操作
tenant = await tenant_repo.get("tenant_123", partition_key="tenant_123")
new_tenant = await tenant_repo.create(Tenant(
    tenant_id="tenant_456",
    name="Example Corp",
    user_count=10
))
```

### 4. ロギング

```python
from common.logging import get_logger

logger = get_logger(__name__)

# 構造化ログの出力
logger.info("User login successful", extra={
    "user_id": "user_123",
    "tenant_id": "tenant_456",
    "ip_address": "192.168.1.1"
})

# 機密情報は自動マスキング
logger.info("User data", extra={
    "username": "john@example.com",
    "password": "secret123"  # 自動的に "***MASKED***" に変換
})
```

### 5. バリデーション

```python
from common.utils.validators import (
    validate_email,
    validate_password_strength,
    validate_tenant_id_format
)

# メールアドレス検証
if not validate_email("user@example.com"):
    raise ValueError("Invalid email format")

# パスワード強度検証（最小12文字、大文字・小文字・数字・特殊文字必須）
if not validate_password_strength("MyP@ssw0rd123"):
    raise ValueError("Password does not meet requirements")

# テナントID形式検証
if not validate_tenant_id_format("tenant_abc123"):
    raise ValueError("Invalid tenant ID format")
```

### 6. ヘルパー関数

```python
from common.utils.helpers import (
    generate_id,
    hash_password,
    verify_password,
    mask_sensitive_data
)

# ID生成
user_id = generate_id("user_")  # "user_550e8400-e29b-41d4-a716-446655440000"

# パスワードハッシュ化
hashed = hash_password("MyP@ssw0rd123")

# パスワード検証
is_valid = verify_password("MyP@ssw0rd123", hashed)

# 機密情報マスキング
log_text = mask_sensitive_data('{"password": "secret123", "email": "john@example.com"}')
# => '{"password": "***MASKED***", "email": "joh***@example.com"}'
```

## モジュール構成

```
common/
├── auth/              # 認証モジュール
│   ├── jwt.py         # JWT生成・検証
│   ├── middleware.py  # 認証Middleware
│   └── dependencies.py # 依存注入ヘルパー
├── database/          # データベースモジュール
│   ├── cosmos.py      # Cosmos DB接続管理
│   └── repository.py  # 基底Repositoryクラス
├── logging/           # ロギングモジュール
│   ├── formatter.py   # JSONフォーマッター
│   └── logger.py      # ロガー設定
├── models/            # モデルモジュール
│   ├── base.py        # 基底BaseModel
│   └── errors.py      # 標準エラーレスポンス
├── middleware/        # ミドルウェアモジュール
│   ├── cors.py        # CORS設定
│   ├── error_handler.py # エラーハンドリング
│   └── request_id.py  # リクエストID生成
└── utils/             # ユーティリティモジュール
    ├── validators.py  # バリデーター
    └── helpers.py     # ヘルパー関数
```

## パフォーマンス要件

| 項目 | 要件 |
|-----|------|
| JWT生成・検証 | 1ms以内 |
| Cosmos DB接続確立 | 初回100ms以内、2回目以降10ms以内 |
| Base Repository CRUD | 単一パーティションクエリ: 50ms以内 |
| ログ出力 | 5ms以内（同期処理） |

## セキュリティ要件

- **JWT秘密鍵**: 環境変数で管理（Phase2でAzure Key Vault移行）
- **パスワードハッシュ**: bcrypt, cost factor 12
- **ログ内機密情報**: 自動マスキング
- **テナント横断アクセス防止**: BaseRepository層で自動検証
- **SQLインジェクション防止**: パラメータ化クエリ必須

## テスト

```bash
# 全テスト実行
pytest tests/ --cov=common --cov-report=html

# 特定モジュールのみ
pytest tests/test_auth.py -v

# カバレッジ確認
open htmlcov/index.html
```

## 環境変数

### 必須環境変数

```bash
# Cosmos DB接続
COSMOS_CONNECTION_STRING=AccountEndpoint=https://...
COSMOS_DATABASE_NAME=management-app

# JWT設定（JWT_SECRET_KEYは必須！）
JWT_SECRET_KEY=your-secure-secret-key-64-bytes-or-longer
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=60
```

**重要: JWT秘密鍵の生成**

- `JWT_SECRET_KEY`は**必須**の環境変数です
- デフォルト値は削除されており、未設定の場合は起動時にエラーが発生します
- 安全な秘密鍵を生成するには、以下のコマンドを使用してください：

```bash
# 64バイトのランダムな秘密鍵を生成
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### オプション環境変数

```bash
LOG_LEVEL=INFO
```

## 依存パッケージ

- FastAPI 0.100+
- Pydantic v2
- python-jose (JWT)
- passlib (bcrypt)
- Azure Cosmos DB SDK (async)
- httpx (async HTTP client)
- tenacity (リトライ機能)

## ライセンス

MIT License

## 関連ドキュメント

- [機能仕様書](../../docs/管理アプリ/Phase1-MVP開発/Specs/02-共通ライブラリ実装.md)
- [アーキテクチャ設計](../../docs/arch/components/README.md#8-共通ライブラリ)
- [セキュリティ設計](../../docs/arch/security/README.md)
