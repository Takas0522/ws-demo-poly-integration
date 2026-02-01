# タスク: 認証認可サービス - コアAPI

## 概要
ユーザー認証とJWT管理を行う認証認可サービスのコア機能を実装します。ログイン、JWT発行・検証、ユーザーCRUD操作を提供します。

## 対象コンポーネント
- 認証認可サービス (`/src/auth-service`)

## 前提条件
- タスク01 (インフラ基盤構築) が完了
- タスク02 (共通ライブラリ実装) が完了
- Cosmos DB の auth コンテナが利用可能

## 実装内容

### 1. プロジェクト構造作成

```
src/auth-service/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPIアプリ
│   ├── config.py                  # 設定
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py                # 認証API
│   │   └── users.py               # ユーザー管理API
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                # Userモデル
│   │   └── token.py               # Tokenモデル
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py        # 認証ビジネスロジック
│   │   └── user_service.py        # ユーザー管理ロジック
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── user_repository.py     # ユーザーデータアクセス
│   └── schemas/
│       ├── __init__.py
│       ├── auth.py                # 認証リクエスト/レスポンス
│       └── user.py                # ユーザーリクエスト/レスポンス
├── tests/
│   ├── test_api_auth.py
│   ├── test_api_users.py
│   ├── test_service_auth.py
│   └── test_repository_user.py
├── .env.example
├── requirements.txt
├── requirements-dev.txt
└── README.md
```

### 2. データモデル実装

#### 2.1 User モデル (`app/models/user.py`)
```python
class User(BaseModel):
    id: str = Field(default_factory=lambda: f"user_{uuid.uuid4()}")
    tenant_id: str
    type: str = "user"
    username: str
    email: EmailStr
    password_hash: str
    display_name: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

#### 2.2 Token モデル (`app/models/token.py`)
```python
class TokenData(BaseModel):
    user_id: str
    tenant_id: str
    username: str
    roles: List[Dict[str, str]] = []
    
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: UserResponse
```

### 3. スキーマ実装

#### 3.1 認証スキーマ (`app/schemas/auth.py`)
```python
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: dict

class TokenPayload(BaseModel):
    sub: str  # user_id
    username: str
    tenant_id: str
    roles: List[dict]
    exp: int
    iat: int
    jti: str
```

#### 3.2 ユーザースキーマ (`app/schemas/user.py`)
```python
class UserCreateRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    display_name: str
    tenant_id: str

class UserUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    display_name: str
    tenant_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
```

### 4. Repository実装

#### 4.1 UserRepository (`app/repositories/user_repository.py`)
```python
class UserRepository(BaseRepository[User]):
    async def find_by_username(
        self,
        tenant_id: str,
        username: str
    ) -> Optional[User]
    
    async def find_by_email(
        self,
        tenant_id: str,
        email: str
    ) -> Optional[User]
    
    async def list_by_tenant(
        self,
        tenant_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]
```

### 5. Service層実装

#### 5.1 AuthService (`app/services/auth_service.py`)
```python
class AuthService:
    async def authenticate(
        self,
        username: str,
        password: str
    ) -> Optional[User]:
        """ユーザー認証"""
        # 1. ユーザー検索（全テナント対象）
        # 2. パスワード検証 (bcrypt)
        # 3. is_active チェック
        # 4. 成功時はUser返却、失敗時はNone
    
    async def create_token(self, user: User) -> TokenData:
        """JWT生成"""
        # 1. ロール情報取得（後続タスクで実装）
        # 2. JWTペイロード作成
        # 3. 共通ライブラリでJWT生成
    
    async def verify_token(self, token: str) -> TokenData:
        """JWT検証"""
        # 共通ライブラリで検証・デコード
```

#### 5.2 UserService (`app/services/user_service.py`)
```python
class UserService:
    async def create_user(
        self,
        data: UserCreateRequest,
        created_by: str
    ) -> User:
        """ユーザー作成"""
        # 1. バリデーション（パスワード強度、一意性）
        # 2. パスワードハッシュ化
        # 3. Userオブジェクト作成
        # 4. Repository経由で保存
        # 5. 監査ログ記録
    
    async def get_user(
        self,
        user_id: str,
        tenant_id: str
    ) -> User:
        """ユーザー取得"""
    
    async def update_user(
        self,
        user_id: str,
        tenant_id: str,
        data: UserUpdateRequest,
        updated_by: str
    ) -> User:
        """ユーザー更新"""
        # 監査ログ記録
    
    async def delete_user(
        self,
        user_id: str,
        tenant_id: str,
        deleted_by: str
    ) -> None:
        """ユーザー削除"""
        # 監査ログ記録
    
    async def list_users(
        self,
        tenant_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """ユーザー一覧（テナント内）"""
```

### 6. API実装

#### 6.1 認証API (`app/api/auth.py`)
```python
@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    """
    ログイン
    - ユーザー認証
    - JWT発行
    """

@router.post("/verify", response_model=TokenPayload)
async def verify_token(authorization: str = Header(...)):
    """
    JWT検証
    - 他サービスからの検証リクエスト用
    """

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    ログアウト
    - トークン無効化（Phase 2でRedis使用）
    """

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    現在のユーザー情報取得
    """
```

#### 6.2 ユーザー管理API (`app/api/users.py`)
```python
@router.get("/", response_model=List[UserResponse])
@require_role("auth-service", "閲覧者")
async def list_users(
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    """
    ユーザー一覧取得
    - 閲覧者ロール以上が必要
    - 特権テナント以外は自テナントのみ
    """

@router.get("/{user_id}", response_model=UserResponse)
@require_role("auth-service", "閲覧者")
async def get_user(
    user_id: str,
    tenant_id: str,
    current_user: User = Depends(get_current_user)
):
    """ユーザー詳細取得"""

@router.post("/", response_model=UserResponse, status_code=201)
@require_role("auth-service", "全体管理者")
async def create_user(
    user_data: UserCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    ユーザー新規作成
    - 全体管理者ロール必須
    """

@router.put("/{user_id}", response_model=UserResponse)
@require_role("auth-service", "全体管理者")
async def update_user(
    user_id: str,
    tenant_id: str,
    user_data: UserUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """ユーザー更新"""

@router.delete("/{user_id}", status_code=204)
@require_role("auth-service", "全体管理者")
async def delete_user(
    user_id: str,
    tenant_id: str,
    current_user: User = Depends(get_current_user)
):
    """ユーザー削除"""
```

### 7. FastAPIアプリ設定 (`app/main.py`)
```python
app = FastAPI(
    title="Authentication Service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Middleware設定
app.add_middleware(JWTAuthenticationMiddleware)
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(RequestIDMiddleware)
setup_cors(app, allowed_origins=config.ALLOWED_ORIGINS)

# Router登録
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])

# ヘルスチェック
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "auth-service"}
```

### 8. テスト実装

#### 8.1 API テスト
- ログイン成功/失敗
- JWT検証
- ユーザーCRUD
- 権限チェック

#### 8.2 Service テスト
- 認証ロジック
- パスワードハッシュ化
- バリデーション

#### 8.3 Repository テスト
- CRUD操作
- クエリ

**カバレッジ目標**: 75%以上

### 9. 環境設定

#### 9.1 .env.example
```
# Cosmos DB
COSMOS_DB_CONNECTION_STRING=xxx

# JWT
JWT_SECRET_KEY=your-super-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60

# Application Insights
APPINSIGHTS_INSTRUMENTATIONKEY=xxx

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com

# Environment
ENVIRONMENT=development
LOG_LEVEL=INFO
```

## 完了条件

- [ ] プロジェクト構造が作成される
- [ ] 全てのモデル・スキーマが実装される
- [ ] UserRepositoryが動作する
- [ ] AuthService, UserServiceが実装される
- [ ] 認証APIが実装される:
  - [ ] POST /api/v1/auth/login
  - [ ] POST /api/v1/auth/verify
  - [ ] POST /api/v1/auth/logout
  - [ ] GET /api/v1/auth/me
- [ ] ユーザー管理APIが実装される:
  - [ ] GET /api/v1/users
  - [ ] GET /api/v1/users/{user_id}
  - [ ] POST /api/v1/users
  - [ ] PUT /api/v1/users/{user_id}
  - [ ] DELETE /api/v1/users/{user_id}
- [ ] 全APIでロールベース認可が動作する
- [ ] テストカバレッジが75%以上
- [ ] ローカルで起動・動作確認できる
- [ ] OpenAPI仕様書が生成される (/docs)
- [ ] README.mdが作成される

## 依存タスク
- 01. インフラ基盤構築
- 02. 共通ライブラリ実装

## 後続タスク
- 04. 認証認可サービス - ロール管理
- 05. テナント管理サービス - コアAPI
- 14. Frontend - BFF基盤

## 技術的考慮事項

### セキュリティ
- パスワードは必ずbcryptでハッシュ化 (cost factor 12)
- JWTは環境変数の秘密鍵で署名
- 平文パスワードはログに出力しない
- レート制限の実装 (ログイン: 5回/分)

### パフォーマンス
- ユーザー検索はパーティションキー指定
- インデックスを活用したクエリ
- 非同期処理の徹底

### テナント分離
- 特権テナント以外は自テナントのデータのみアクセス
- 全クエリでtenantIdフィルタリング

## 参照ドキュメント
- [コンポーネント設計 - 認証認可サービス](../../arch/components/README.md#3-認証認可サービス)
- [API設計 - 認証認可サービスAPI](../../arch/api/README.md#3-認証認可サービスapi)
- [データモデル設計 - 認証認可サービス](../../arch/data/README.md#2-認証認可サービス-auth-コンテナ)
- [セキュリティ設計 - 認証](../../arch/security/README.md#2-認証-authentication)

## 見積もり工数
- 作業時間: 3日
- テスト: 1日
- レビュー: 0.5日
- **合計**: 4.5日

## 備考
- ロール管理機能は次のタスク (04) で実装
- Phase 1ではパスワードリセット機能は未実装
- トークンブラックリスト管理はPhase 2で実装
