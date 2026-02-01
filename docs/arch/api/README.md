# API設計

## ドキュメント情報
- バージョン: 1.0.0
- 最終更新日: 2026-02-01
- 関連: [システムアーキテクチャ概要](../overview.md)

## 1. API設計原則

### 1.1 RESTful設計
本システムのAPIは、REST (Representational State Transfer) アーキテクチャスタイルに準拠します。

**基本原則**:
- **リソース指向**: URLはリソースを表現（動詞ではなく名詞）
- **HTTPメソッドの適切な使用**: GET（取得）、POST（作成）、PUT（更新）、DELETE（削除）
- **ステートレス**: 各リクエストは独立し、必要な情報を全て含む
- **キャッシュ可能**: 適切なHTTPヘッダーでキャッシュ制御

### 1.2 API設計ガイドライン

#### 1.2.1 URL設計
```
https://{service}.example.com/api/v{version}/{resource}
```

**例**:
- `https://auth.example.com/api/v1/users`
- `https://tenant.example.com/api/v1/tenants/{tenantId}/users`

#### 1.2.2 HTTPメソッド
| メソッド | 用途 | 冪等性 | 安全性 |
|---------|------|--------|--------|
| GET | リソース取得 | ✅ | ✅ |
| POST | リソース作成 | ❌ | ❌ |
| PUT | リソース更新（全体） | ✅ | ❌ |
| PATCH | リソース更新（部分） | ❌ | ❌ |
| DELETE | リソース削除 | ✅ | ❌ |

#### 1.2.3 HTTPステータスコード
| コード | 意味 | 使用場面 |
|-------|------|---------|
| 200 OK | 成功 | GET, PUT, PATCH, DELETEの成功 |
| 201 Created | 作成成功 | POSTでリソース作成成功 |
| 204 No Content | 成功（レスポンスボディなし） | DELETEの成功 |
| 400 Bad Request | リクエスト不正 | バリデーションエラー |
| 401 Unauthorized | 認証失敗 | JWT未提供、無効 |
| 403 Forbidden | 認可失敗 | 権限不足 |
| 404 Not Found | リソース不在 | 指定リソースが存在しない |
| 409 Conflict | 競合 | 一意性制約違反 |
| 500 Internal Server Error | サーバーエラー | 予期しないエラー |

### 1.3 API バージョニング

#### 1.3.1 バージョニング方式
- **方式**: URLパスバージョニング（`/api/v1/...`、`/api/v2/...`）
- **理由**: 明示的で、キャッシュやルーティングが容易
- **サポート期間**: 旧バージョンは最低6ヶ月間サポート
- **非推奨期間**: 廃止予定バージョンは3ヶ月前に通知

#### 1.3.2 破壊的変更の定義
以下の変更は破壊的変更とみなし、メジャーバージョンアップが必要です：

**レスポンス変更**:
- レスポンスフィールドの削除
- レスポンスフィールド名の変更
- レスポンスフィールドの型変更
- レスポンスの構造変更（ネスト階層の変更）
- 配列から単一オブジェクトへの変更（またはその逆）

**リクエスト変更**:
- 必須リクエストパラメータの追加
- リクエストパラメータ名の変更
- リクエストパラメータの型変更
- リクエストパラメータの検証ルール厳格化

**動作変更**:
- HTTPステータスコードの変更
- エラーコード体系の変更
- デフォルト動作の変更
- 認証・認可要件の追加

**例: 破壊的変更**
```json
// v1: 破壊的変更前
{
  "userId": "user_550e8400",
  "name": "山田太郎"
}

// v2: 破壊的変更後
{
  "id": "user_550e8400",        // フィールド名変更: userId → id
  "firstName": "太郎",           // フィールド分割: name → firstName, lastName
  "lastName": "山田"
}
```

#### 1.3.3 非破壊的変更（マイナーバージョン）
以下の変更は既存クライアントに影響しないため、メジャーバージョンアップ不要です：

- 新規エンドポイントの追加
- オプショナルリクエストパラメータの追加
- レスポンスフィールドの追加
- 必須パラメータのオプショナル化
- エラーメッセージの改善（コードは変更なし）

**例: 非破壊的変更**
```json
// v1.0
{
  "id": "user_550e8400",
  "name": "山田太郎"
}

// v1.1: 新規フィールド追加（既存クライアントに影響なし）
{
  "id": "user_550e8400",
  "name": "山田太郎",
  "email": "yamada@example.com",  // 追加
  "avatar": "https://..."           // 追加
}
```

#### 1.3.4 バージョン間の互換性保証

**後方互換性（Backward Compatibility）**:
新バージョンのAPIは旧クライアントから呼び出し可能

```python
# v2 APIで v1 クライアントをサポート
@router.get("/v2/users/{user_id}")
async def get_user_v2(user_id: str, include_details: bool = False):
    """
    v2: include_details パラメータを追加
    v1クライアントはこのパラメータを指定しないが、デフォルト値で動作
    """
    user = await user_service.get(user_id)
    
    if include_details:
        # v2の拡張情報を含める
        return UserDetailResponse(**user.dict())
    else:
        # v1互換のレスポンス
        return UserResponse(**user.dict())
```

**前方互換性（Forward Compatibility）**:
旧バージョンのAPIは新クライアントから呼び出し可能

```python
# v1 APIで v2 クライアントのリクエストを処理
@router.post("/v1/users")
async def create_user_v1(user_data: dict):
    """
    v2クライアントが新しいフィールドを送信しても無視して処理
    """
    # v1で認識できるフィールドのみ抽出
    v1_fields = {k: v for k, v in user_data.items() 
                 if k in ['username', 'email', 'displayName']}
    
    user = await user_service.create(UserCreateV1(**v1_fields))
    return user
```

#### 1.3.5 複数バージョンの同時サポート

**実装パターン1: バージョン別ルーター**
```python
# v1/routes.py
v1_router = APIRouter(prefix="/api/v1")

@v1_router.get("/users/{user_id}")
async def get_user_v1(user_id: str) -> UserResponseV1:
    user = await user_service.get(user_id)
    return UserResponseV1(**user.dict())

# v2/routes.py
v2_router = APIRouter(prefix="/api/v2")

@v2_router.get("/users/{user_id}")
async def get_user_v2(user_id: str, include_roles: bool = False) -> UserResponseV2:
    user = await user_service.get(user_id)
    
    if include_roles:
        roles = await role_service.get_user_roles(user_id)
        return UserResponseV2(**user.dict(), roles=roles)
    
    return UserResponseV2(**user.dict())

# main.py
app.include_router(v1_router)
app.include_router(v2_router)
```

**実装パターン2: 共通ロジック + バージョン別アダプター**
```python
# services/user_service.py（共通ロジック）
async def get_user(user_id: str) -> User:
    """バージョン非依存の共通ロジック"""
    return await user_repository.get(user_id)

# api/v1/adapters.py
def adapt_user_to_v1(user: User) -> UserResponseV1:
    """v1形式に変換"""
    return UserResponseV1(
        userId=user.id,  # v1はuserId
        name=user.display_name
    )

# api/v2/adapters.py
def adapt_user_to_v2(user: User) -> UserResponseV2:
    """v2形式に変換"""
    return UserResponseV2(
        id=user.id,  # v2はid
        displayName=user.display_name,
        email=user.email
    )
```

#### 1.3.6 バージョン廃止プロセス

**ステップ1: 廃止予定の通知（T-3ヶ月）**
```python
@router.get("/v1/users/{user_id}")
async def get_user_v1(user_id: str, response: Response):
    """v1 API（廃止予定: 2026-06-01）"""
    # 廃止予定をヘッダーで通知
    response.headers["X-API-Deprecation"] = "true"
    response.headers["X-API-Sunset"] = "2026-06-01"
    response.headers["X-API-Deprecation-Info"] = "https://docs.example.com/api/v1-deprecation"
    
    user = await user_service.get(user_id)
    return adapt_user_to_v1(user)
```

レスポンスヘッダー例:
```http
HTTP/1.1 200 OK
X-API-Deprecation: true
X-API-Sunset: 2026-06-01
X-API-Deprecation-Info: https://docs.example.com/api/v1-deprecation
Link: </api/v2/users/user_550e8400>; rel="successor-version"
```

**ステップ2: ドキュメント更新**
- API仕様書に廃止予定を明記
- 移行ガイドの作成
- リリースノートでの通知

**ステップ3: メトリクス収集**
```python
from prometheus_client import Counter

v1_usage_counter = Counter(
    'api_v1_usage',
    'V1 API usage count',
    ['endpoint', 'client']
)

@router.get("/v1/users/{user_id}")
async def get_user_v1(user_id: str, request: Request):
    # 使用状況を記録
    client = request.headers.get("User-Agent", "unknown")
    v1_usage_counter.labels(endpoint="/users", client=client).inc()
    
    # 実装
    ...
```

**ステップ4: 段階的な廃止（T-1ヶ月）**
```python
# 特定クライアントへの警告レスポンス
MIGRATED_CLIENTS = {"client_abc", "client_xyz"}

@router.get("/v1/users/{user_id}")
async def get_user_v1(user_id: str, request: Request):
    client_id = request.headers.get("X-Client-Id")
    
    # 未移行クライアントに警告
    if client_id and client_id not in MIGRATED_CLIENTS:
        logger.warning(f"Unmigrated client using v1: {client_id}")
    
    # 実装
    ...
```

**ステップ5: 完全廃止（T日）**
```python
@router.get("/v1/users/{user_id}")
async def get_user_v1(user_id: str):
    """v1 API（廃止済み）"""
    raise HTTPException(
        status_code=410,  # Gone
        detail={
            "error": "API_VERSION_SUNSET",
            "message": "API v1 has been retired. Please use v2.",
            "sunset_date": "2026-06-01",
            "migration_guide": "https://docs.example.com/api/v1-to-v2-migration"
        }
    )
```

#### 1.3.7 クライアント移行の支援

**移行チェックリスト提供**:
```markdown
# API v1 → v2 移行チェックリスト

## 破壊的変更
- [ ] レスポンスフィールド `userId` を `id` に変更
- [ ] レスポンスフィールド `name` を `displayName` に変更
- [ ] エラーコード体系の変更確認

## 新機能
- [ ] `include_roles` パラメータの活用検討
- [ ] 新規エンドポイント `/users/batch` の活用検討

## テスト
- [ ] 全エンドポイントのv2での動作確認
- [ ] エラーハンドリングの確認
```

**マイグレーションツールの提供**:
```python
# v1レスポンスをv2形式に変換するヘルパー
def migrate_v1_response_to_v2(v1_response: dict) -> dict:
    """クライアント側でv1レスポンスをv2形式に変換"""
    return {
        "id": v1_response.get("userId"),
        "displayName": v1_response.get("name"),
        "email": v1_response.get("email"),
        # 新しいフィールドはNoneまたはデフォルト値
        "avatar": None,
        "roles": []
    }
```

## 2. 共通仕様

### 2.1 リクエストヘッダー

#### 2.1.1 認証ヘッダー
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 2.1.2 Content-Type
```http
Content-Type: application/json
```

#### 2.1.3 Accept
```http
Accept: application/json
```

### 2.2 レスポンス形式

#### 2.2.1 成功レスポンス（単一リソース）
```json
{
  "id": "user_550e8400",
  "username": "admin@example.com",
  "email": "admin@example.com",
  "displayName": "管理者太郎",
  "tenantId": "tenant_123",
  "isActive": true,
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-15T10:30:00Z"
}
```

#### 2.2.2 成功レスポンス（リスト）
```json
{
  "data": [
    {
      "id": "user_550e8400",
      "username": "admin@example.com",
      "displayName": "管理者太郎"
    },
    {
      "id": "user_660e8400",
      "username": "user@example.com",
      "displayName": "ユーザー花子"
    }
  ],
  "pagination": {
    "total": 125,
    "page": 1,
    "pageSize": 20,
    "totalPages": 7,
    "hasNext": true,
    "hasPrevious": false,
    "nextCursor": "eyJpZCI6InVzZXJfNjYwZTg0MDAifQ=="
  }
}
```

#### 2.2.3 エラーレスポンス
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid-email"
      }
    ],
    "timestamp": "2026-01-20T10:00:00Z",
    "requestId": "req_abc123xyz"
  }
}
```

### 2.3 ページネーション

#### 2.3.1 クエリパラメータ
```
GET /api/v1/users?page=1&pageSize=20
GET /api/v1/users?cursor=eyJpZCI6InVzZXJfNjYwZTg0MDAifQ==
```

#### 2.3.2 カーソルベースページネーション（推奨）
Cosmos DBの継続トークンを使用：

```python
@router.get("/users")
async def list_users(
    cursor: Optional[str] = None,
    page_size: int = 20
):
    result = await user_repository.list(
        continuation_token=cursor,
        max_items=page_size
    )
    
    return {
        "data": result.items,
        "pagination": {
            "nextCursor": result.continuation_token,
            "hasNext": result.has_more
        }
    }
```

### 2.4 フィルタリングとソート

#### 2.4.1 フィルタリング
```
GET /api/v1/users?status=active&role=admin
GET /api/v1/files?createdAfter=2026-01-01&contentType=application/pdf
```

#### 2.4.2 ソート
```
GET /api/v1/users?sortBy=createdAt&order=desc
```

### 2.5 フィールド選択
不要なフィールドを除外してレスポンスサイズを削減：

```
GET /api/v1/users?fields=id,username,email
```

## 3. 認証認可サービスAPI

### 3.1 ベースURL
```
https://auth.example.com/api/v1
```

### 3.2 認証エンドポイント

#### 3.2.1 POST /auth/login
ユーザー認証とJWT発行

**リクエスト**:
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin@example.com",
  "password": "SecurePassword123!"
}
```

**レスポンス** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "user_550e8400",
    "username": "admin@example.com",
    "displayName": "管理者太郎",
    "tenantId": "tenant_123"
  }
}
```

**エラーレスポンス** (401 Unauthorized):
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password"
  }
}
```

#### 3.2.2 POST /auth/verify
JWT検証

**リクエスト**:
```http
POST /api/v1/auth/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**レスポンス** (200 OK):
```json
{
  "valid": true,
  "payload": {
    "userId": "user_550e8400",
    "tenantId": "tenant_123",
    "roles": [
      {
        "serviceId": "tenant-management",
        "roleName": "管理者"
      },
      {
        "serviceId": "auth-service",
        "roleName": "全体管理者"
      }
    ],
    "exp": 1706183400
  }
}
```

#### 3.2.3 POST /auth/logout
ログアウト（トークン無効化）

**リクエスト**:
```http
POST /api/v1/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**レスポンス** (204 No Content)

### 3.3 ユーザー管理エンドポイント

#### 3.3.1 GET /users
ユーザー一覧取得

**リクエスト**:
```http
GET /api/v1/users?tenantId=tenant_123&page=1&pageSize=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**必要ロール**: auth-service: 閲覧者 以上

**レスポンス** (200 OK):
```json
{
  "data": [
    {
      "id": "user_550e8400",
      "username": "admin@example.com",
      "email": "admin@example.com",
      "displayName": "管理者太郎",
      "tenantId": "tenant_123",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "pageSize": 20,
    "hasNext": true
  }
}
```

#### 3.3.2 GET /users/{userId}
ユーザー詳細取得

**リクエスト**:
```http
GET /api/v1/users/user_550e8400
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**必要ロール**: auth-service: 閲覧者 以上

**レスポンス** (200 OK):
```json
{
  "id": "user_550e8400",
  "username": "admin@example.com",
  "email": "admin@example.com",
  "displayName": "管理者太郎",
  "tenantId": "tenant_123",
  "isActive": true,
  "roles": [
    {
      "serviceId": "tenant-management",
      "roleName": "管理者",
      "assignedAt": "2026-01-01T00:00:00Z"
    }
  ],
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-15T10:30:00Z"
}
```

#### 3.3.3 POST /users
ユーザー新規作成

**リクエスト**:
```http
POST /api/v1/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "username": "newuser@example.com",
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "displayName": "新規ユーザー",
  "tenantId": "tenant_123"
}
```

**必要ロール**: auth-service: 全体管理者

**レスポンス** (201 Created):
```json
{
  "id": "user_770e8400",
  "username": "newuser@example.com",
  "email": "newuser@example.com",
  "displayName": "新規ユーザー",
  "tenantId": "tenant_123",
  "isActive": true,
  "createdAt": "2026-01-20T10:00:00Z"
}
```

#### 3.3.4 PUT /users/{userId}
ユーザー更新

**リクエスト**:
```http
PUT /api/v1/users/user_770e8400
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "displayName": "更新されたユーザー名",
  "email": "updated@example.com"
}
```

**必要ロール**: auth-service: 全体管理者

**レスポンス** (200 OK): 更新後のユーザー情報

#### 3.3.5 DELETE /users/{userId}
ユーザー削除

**リクエスト**:
```http
DELETE /api/v1/users/user_770e8400
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**必要ロール**: auth-service: 全体管理者

**レスポンス** (204 No Content)

### 3.4 ロール管理エンドポイント

#### 3.4.1 GET /roles
利用可能なロール一覧取得

**リクエスト**:
```http
GET /api/v1/roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**レスポンス** (200 OK):
```json
{
  "data": [
    {
      "serviceId": "auth-service",
      "roleName": "全体管理者",
      "description": "ユーザー登録・削除、特権テナント操作"
    },
    {
      "serviceId": "auth-service",
      "roleName": "閲覧者",
      "description": "ユーザー情報の参照のみ"
    }
  ]
}
```

#### 3.4.2 POST /users/{userId}/roles
ユーザーへのロール割り当て

**リクエスト**:
```http
POST /api/v1/users/user_550e8400/roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "serviceId": "tenant-management",
  "roleName": "管理者"
}
```

**必要ロール**: auth-service: 全体管理者

**レスポンス** (201 Created):
```json
{
  "id": "role_abc123",
  "userId": "user_550e8400",
  "serviceId": "tenant-management",
  "roleName": "管理者",
  "assignedAt": "2026-01-20T10:00:00Z"
}
```

#### 3.4.3 DELETE /users/{userId}/roles/{roleId}
ユーザーからのロール削除

**リクエスト**:
```http
DELETE /api/v1/users/user_550e8400/roles/role_abc123
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**必要ロール**: auth-service: 全体管理者

**レスポンス** (204 No Content)

## 4. テナント管理サービスAPI

### 4.1 ベースURL
```
https://tenant.example.com/api/v1
```

### 4.2 テナント管理エンドポイント

#### 4.2.1 GET /tenants
テナント一覧取得

**リクエスト**:
```http
GET /api/v1/tenants?page=1&pageSize=20&status=active
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**必要ロール**: tenant-management: 閲覧者 以上

**レスポンス** (200 OK):
```json
{
  "data": [
    {
      "id": "tenant_123",
      "name": "株式会社サンプル",
      "displayName": "Sample Corp",
      "userCount": 25,
      "status": "active",
      "services": [
        {"id": "file-service", "name": "ファイル管理"},
        {"id": "messaging-service", "name": "メッセージング"}
      ],
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "pageSize": 20
  }
}
```

#### 4.2.2 GET /tenants/{tenantId}
テナント詳細取得

**リクエスト**:
```http
GET /api/v1/tenants/tenant_123
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**必要ロール**: tenant-management: 閲覧者 以上

**レスポンス** (200 OK):
```json
{
  "id": "tenant_123",
  "name": "株式会社サンプル",
  "displayName": "Sample Corp",
  "isPrivileged": false,
  "status": "active",
  "plan": "standard",
  "userCount": 25,
  "maxUsers": 100,
  "domains": [
    {
      "domain": "example.com",
      "verified": true
    }
  ],
  "services": [
    {
      "id": "file-service",
      "name": "ファイル管理",
      "assignedAt": "2026-01-10T00:00:00Z"
    }
  ],
  "metadata": {
    "industry": "IT",
    "country": "JP"
  },
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-20T15:00:00Z"
}
```

#### 4.2.3 POST /tenants
テナント新規作成

**リクエスト**:
```http
POST /api/v1/tenants
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "name": "新規テナント株式会社",
  "displayName": "New Tenant Corp",
  "plan": "standard",
  "maxUsers": 50,
  "metadata": {
    "industry": "Manufacturing",
    "country": "JP"
  }
}
```

**必要ロール**: tenant-management: 管理者

**レスポンス** (201 Created): 作成されたテナント情報

**エラーレスポンス** (409 Conflict):
```json
{
  "error": {
    "code": "TENANT_ALREADY_EXISTS",
    "message": "A tenant with this name already exists"
  }
}
```

#### 4.2.4 PUT /tenants/{tenantId}
テナント更新

**リクエスト**:
```http
PUT /api/v1/tenants/tenant_123
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "displayName": "Updated Corp",
  "maxUsers": 150
}
```

**必要ロール**: tenant-management: 管理者

**制約**: 特権テナント（`isPrivileged: true`）は更新不可

**レスポンス** (200 OK): 更新後のテナント情報

**エラーレスポンス** (403 Forbidden):
```json
{
  "error": {
    "code": "PRIVILEGED_TENANT_IMMUTABLE",
    "message": "Privileged tenant cannot be modified"
  }
}
```

#### 4.2.5 DELETE /tenants/{tenantId}
テナント削除

**リクエスト**:
```http
DELETE /api/v1/tenants/tenant_123
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**必要ロール**: tenant-management: 管理者

**制約**: 
- 特権テナントは削除不可
- 所属ユーザーがいる場合は削除不可

**レスポンス** (204 No Content)

### 4.3 テナントユーザー管理エンドポイント

#### 4.3.1 GET /tenants/{tenantId}/users
テナント所属ユーザー一覧

**リクエスト**:
```http
GET /api/v1/tenants/tenant_123/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**必要ロール**: tenant-management: 閲覧者 以上

**レスポンス** (200 OK):
```json
{
  "data": [
    {
      "userId": "user_550e8400",
      "username": "admin@example.com",
      "displayName": "管理者太郎",
      "assignedAt": "2026-01-05T10:00:00Z"
    }
  ]
}
```

#### 4.3.2 POST /tenants/{tenantId}/users
テナントへのユーザー追加

**リクエスト**:
```http
POST /api/v1/tenants/tenant_123/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "userId": "user_660e8400"
}
```

**必要ロール**: 
- 通常テナント: tenant-management: 管理者
- 特権テナント: tenant-management: 全体管理者

**レスポンス** (201 Created)

#### 4.3.3 DELETE /tenants/{tenantId}/users/{userId}
テナントからのユーザー削除

**リクエスト**:
```http
DELETE /api/v1/tenants/tenant_123/users/user_660e8400
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**必要ロール**: 
- 通常テナント: tenant-management: 管理者
- 特権テナント: tenant-management: 全体管理者

**レスポンス** (204 No Content)

### 4.4 ドメイン管理エンドポイント

#### 4.4.1 GET /tenants/{tenantId}/domains
テナントドメイン一覧

**リクエスト**:
```http
GET /api/v1/tenants/tenant_123/domains
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**レスポンス** (200 OK):
```json
{
  "data": [
    {
      "id": "domain_example_com",
      "domain": "example.com",
      "verified": true,
      "verifiedAt": "2026-01-02T12:00:00Z",
      "createdAt": "2026-01-01T10:00:00Z"
    }
  ]
}
```

#### 4.4.2 POST /tenants/{tenantId}/domains
ドメイン追加

**リクエスト**:
```http
POST /api/v1/tenants/tenant_123/domains
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "domain": "newdomain.com"
}
```

**レスポンス** (201 Created):
```json
{
  "id": "domain_newdomain_com",
  "domain": "newdomain.com",
  "verified": false,
  "verificationToken": "txt-verification-abc123xyz",
  "verificationInstructions": "Add TXT record to DNS: _verification.newdomain.com with value: txt-verification-abc123xyz",
  "createdAt": "2026-01-20T10:00:00Z"
}
```

#### 4.4.3 POST /tenants/{tenantId}/domains/{domainId}/verify
ドメイン検証実行

**リクエスト**:
```http
POST /api/v1/tenants/tenant_123/domains/domain_newdomain_com/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**レスポンス** (200 OK):
```json
{
  "verified": true,
  "verifiedAt": "2026-01-20T11:00:00Z"
}
```

## 5. サービス設定サービスAPI

### 5.1 ベースURL
```
https://service-setting.example.com/api/v1
```

### 5.2 サービスカタログエンドポイント

#### 5.2.1 GET /services
全サービス一覧

**リクエスト**:
```http
GET /api/v1/services
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**必要ロール**: service-setting: 閲覧者 以上

**レスポンス** (200 OK):
```json
{
  "data": [
    {
      "id": "file-service",
      "name": "ファイル管理サービス",
      "description": "ファイルのアップロード・ダウンロード・管理",
      "version": "1.0.0",
      "isActive": true,
      "metadata": {
        "icon": "file-icon.png",
        "category": "storage"
      }
    },
    {
      "id": "messaging-service",
      "name": "メッセージングサービス",
      "description": "メッセージ送受信、チャネル管理",
      "version": "1.0.0",
      "isActive": true,
      "metadata": {
        "icon": "message-icon.png",
        "category": "communication"
      }
    }
  ]
}
```

#### 5.2.2 GET /services/{serviceId}/roles
サービスのロール情報取得

**リクエスト**:
```http
GET /api/v1/services/file-service/roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**レスポンス** (200 OK):
```json
{
  "serviceId": "file-service",
  "roles": [
    {
      "name": "管理者",
      "description": "全機能へのアクセス",
      "permissions": ["files:create", "files:read", "files:update", "files:delete"]
    },
    {
      "name": "編集者",
      "description": "ファイルの作成・編集",
      "permissions": ["files:create", "files:read", "files:update"]
    },
    {
      "name": "閲覧者",
      "description": "ファイルの参照のみ",
      "permissions": ["files:read"]
    }
  ]
}
```

### 5.3 サービス割り当てエンドポイント

#### 5.3.1 GET /tenants/{tenantId}/services
テナントの利用サービス一覧

**リクエスト**:
```http
GET /api/v1/tenants/tenant_123/services
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**必要ロール**: service-setting: 閲覧者 以上

**レスポンス** (200 OK):
```json
{
  "data": [
    {
      "serviceId": "file-service",
      "serviceName": "ファイル管理サービス",
      "status": "active",
      "config": {
        "maxStorage": "100GB",
        "maxFileSize": "10MB"
      },
      "assignedAt": "2026-01-10T09:00:00Z",
      "activatedAt": "2026-01-10T09:05:00Z"
    }
  ]
}
```

#### 5.3.2 POST /tenants/{tenantId}/services
テナントへのサービス割り当て

**リクエスト**:
```http
POST /api/v1/tenants/tenant_123/services
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "serviceId": "messaging-service",
  "config": {
    "maxChannels": 50,
    "maxMembersPerChannel": 100
  }
}
```

**必要ロール**: service-setting: 全体管理者

**レスポンス** (201 Created):
```json
{
  "assignmentId": "assignment_abc123",
  "serviceId": "messaging-service",
  "status": "active",
  "assignedAt": "2026-01-20T10:00:00Z"
}
```

#### 5.3.3 DELETE /tenants/{tenantId}/services/{serviceId}
テナントからのサービス削除

**リクエスト**:
```http
DELETE /api/v1/tenants/tenant_123/services/messaging-service
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**必要ロール**: service-setting: 全体管理者

**レスポンス** (204 No Content)

### 5.4 ロール統合エンドポイント

#### 5.4.1 GET /tenants/{tenantId}/available-roles
テナントが利用可能な全サービスのロール

**リクエスト**:
```http
GET /api/v1/tenants/tenant_123/available-roles
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**レスポンス** (200 OK):
```json
{
  "tenantId": "tenant_123",
  "roles": {
    "file-service": [
      {"name": "管理者", "description": "全機能へのアクセス"},
      {"name": "編集者", "description": "ファイルの作成・編集"},
      {"name": "閲覧者", "description": "ファイルの参照のみ"}
    ],
    "messaging-service": [
      {"name": "管理者", "description": "チャネル管理、メンバー管理"},
      {"name": "メンバー", "description": "メッセージ送受信"},
      {"name": "閲覧者", "description": "メッセージ閲覧のみ"}
    ]
  }
}
```

## 6. 管理対象サービスAPI（共通パターン）

### 6.1 ロール情報提供エンドポイント（全サービス必須）

#### 6.1.1 GET /roles
サービスのロール一覧

**リクエスト**:
```http
GET /api/v1/roles
```

**認証**: 不要（サービス間通信用）またはサービス共有鍵

**レスポンス** (200 OK):
```json
{
  "serviceId": "file-service",
  "roles": [
    {
      "name": "管理者",
      "description": "全機能へのアクセス"
    },
    {
      "name": "編集者",
      "description": "データの作成・編集"
    },
    {
      "name": "閲覧者",
      "description": "データの参照のみ"
    }
  ]
}
```

### 6.2 ヘルスチェックエンドポイント（全サービス必須）

#### 6.2.1 GET /health
サービスのヘルスチェック

**リクエスト**:
```http
GET /api/v1/health
```

**レスポンス** (200 OK):
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-01-20T10:00:00Z",
  "checks": {
    "database": "healthy",
    "storage": "healthy"
  }
}
```

## 7. BFF (Frontend) API

### 7.1 概要
Next.js API Routesを使用したBFF層。フロントエンド専用のAPIを提供し、複数のバックエンドサービスを集約します。

### 7.2 ベースURL
```
https://app.example.com/api
```

### 7.3 認証エンドポイント

#### 7.3.1 POST /api/auth/login
ログイン（バックエンドの認証サービスを呼び出し）

**リクエスト**:
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin@example.com",
  "password": "SecurePassword123!"
}
```

**レスポンス** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": "user_550e8400",
    "username": "admin@example.com",
    "displayName": "管理者太郎"
  }
}
```

**処理**:
1. バックエンド認証サービスへログインリクエスト
2. JWTを受け取る
3. JWTをHTTPOnly Cookieに保存
4. ユーザー情報をレスポンス

#### 7.3.2 POST /api/auth/logout
ログアウト

**リクエスト**:
```http
POST /api/auth/logout
```

**レスポンス** (200 OK):
```json
{
  "success": true
}
```

### 7.4 集約エンドポイント

#### 7.4.1 GET /api/dashboard
ダッシュボード用データ集約

**リクエスト**:
```http
GET /api/dashboard
Cookie: auth_token=...
```

**レスポンス** (200 OK):
```json
{
  "user": {
    "id": "user_550e8400",
    "displayName": "管理者太郎",
    "tenantId": "tenant_123"
  },
  "tenant": {
    "id": "tenant_123",
    "name": "株式会社サンプル",
    "userCount": 25
  },
  "services": [
    {
      "id": "file-service",
      "name": "ファイル管理",
      "status": "active"
    }
  ],
  "stats": {
    "totalUsers": 25,
    "activeServices": 3,
    "storageUsed": "85GB"
  }
}
```

**処理**:
1. Cookieから JWTを取得
2. 認証サービスでJWT検証
3. 複数のバックエンドサービスへ並列リクエスト
   - テナント管理サービス: テナント情報
   - サービス設定サービス: 利用サービス一覧
   - 各サービス: 利用統計
4. データを集約してレスポンス

## 8. エラーコード一覧

### 8.1 認証関連
| コード | HTTPステータス | 説明 |
|-------|--------------|------|
| INVALID_CREDENTIALS | 401 | ユーザー名またはパスワードが不正 |
| TOKEN_EXPIRED | 401 | JWTの有効期限切れ |
| TOKEN_INVALID | 401 | JWT が不正 |
| INSUFFICIENT_PERMISSIONS | 403 | 権限不足 |

### 8.2 リソース関連
| コード | HTTPステータス | 説明 |
|-------|--------------|------|
| RESOURCE_NOT_FOUND | 404 | 指定されたリソースが存在しない |
| RESOURCE_ALREADY_EXISTS | 409 | リソースが既に存在 |
| RESOURCE_CONFLICT | 409 | リソースの状態が競合 |

### 8.3 バリデーション関連
| コード | HTTPステータス | 説明 |
|-------|--------------|------|
| VALIDATION_ERROR | 400 | 入力バリデーションエラー |
| INVALID_FORMAT | 400 | フォーマットが不正 |
| MISSING_REQUIRED_FIELD | 400 | 必須フィールドが不足 |

### 8.4 ビジネスロジック関連
| コード | HTTPステータス | 説明 |
|-------|--------------|------|
| PRIVILEGED_TENANT_IMMUTABLE | 403 | 特権テナントは変更不可 |
| TENANT_HAS_ACTIVE_USERS | 409 | テナントにアクティブユーザーが存在 |
| SERVICE_NOT_AVAILABLE | 503 | サービスが利用不可 |

## 9. セキュリティ考慮事項

### 9.1 レート制限
APIへの過度なアクセスを防ぐため、レート制限を実装：

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706183400
Retry-After: 60

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later."
  }
}
```

### 9.2 CORSヘッダー
```http
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

### 9.3 セキュリティヘッダー
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

## 10. API ドキュメント生成

### 10.1 OpenAPI (Swagger) 仕様
各サービスはOpenAPI 3.0仕様を提供し、自動的にドキュメントを生成：

```yaml
openapi: 3.0.0
info:
  title: Authentication Service API
  version: 1.0.0
  description: User authentication and authorization
servers:
  - url: https://auth.example.com/api/v1
paths:
  /auth/login:
    post:
      summary: User login
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: Successful authentication
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TokenResponse'
```

### 10.2 インタラクティブドキュメント
FastAPIの自動生成機能を使用：
- Swagger UI: `https://auth.example.com/docs`
- ReDoc: `https://auth.example.com/redoc`

## 11. 参照
- [システムアーキテクチャ概要](../overview.md)
- [コンポーネント設計](../components/README.md)
- [データモデル設計](../data/README.md)
- [セキュリティ設計](../security/README.md)

## 12. 変更履歴

| バージョン | 日付 | 変更内容 | 関連仕様 |
|----------|------|---------|----------|
| 1.0.0 | 2026-02-01 | 初版作成 | - |
| 1.1.0 | 2026-02-01 | APIバージョニング戦略の詳細化（破壊的変更の定義、複数バージョン同時サポート、廃止プロセス）（アーキテクチャレビュー対応） | [アーキテクチャレビュー001](../review/architecture-review-001.md) |
