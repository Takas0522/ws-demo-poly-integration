# 認証認可フロー設計

## 1. 概要

本ドキュメントは、マルチテナント管理アプリケーションの認証（Authentication）と認可（Authorization）のフローを定義します。

### 1.1 設計方針

- **JWT（JSON Web Token）**: ステートレスな認証トークン
- **RBAC（Role-Based Access Control）**: ロールベースのアクセス制御
- **マルチサービス対応**: 異なるサービスごとに異なるロール
- **RS256署名**: 公開鍵暗号による署名検証
- **短命トークン**: 8時間の有効期限

## 2. 認証フロー

### 2.1 ログインシーケンス

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Browser as ブラウザ
    participant Frontend as Frontend
    participant AuthSvc as Auth Service
    participant DB as Cosmos DB
    participant Cache as Redis

    User->>Browser: ログイン画面でID/Password入力
    Browser->>Frontend: POST /api/auth/login
    Frontend->>AuthSvc: POST /api/v1/auth/login<br/>{username, password}
    
    AuthSvc->>DB: ユーザー情報取得<br/>SELECT * WHERE username=?
    DB-->>AuthSvc: User document
    
    AuthSvc->>AuthSvc: パスワード検証<br/>verify_password(input, hashed)
    
    alt パスワード不一致
        AuthSvc-->>Frontend: 401 Unauthorized
        Frontend-->>Browser: エラー表示
    end
    
    AuthSvc->>AuthSvc: is_active チェック
    AuthSvc->>AuthSvc: is_privileged_tenant チェック
    
    alt 特権テナントではない
        AuthSvc-->>Frontend: 403 Forbidden
        Frontend-->>Browser: エラー表示
    end
    
    AuthSvc->>Cache: ロール情報取得<br/>GET roles:{user_id}
    
    alt キャッシュミス
        AuthSvc->>DB: ロール情報取得<br/>SELECT * WHERE user_id=?
        DB-->>AuthSvc: UserRole documents
        AuthSvc->>Cache: キャッシュ保存<br/>SETEX roles:{user_id} 3600
    end
    
    Cache-->>AuthSvc: Roles
    
    AuthSvc->>AuthSvc: JWT生成<br/>RS256署名
    
    Note over AuthSvc: Payload:<br/>- sub: user_id<br/>- tenant_id<br/>- roles: [...]<br/>- exp: 8h later
    
    AuthSvc->>DB: last_login更新
    
    AuthSvc-->>Frontend: 200 OK<br/>{access_token, user, roles}
    Frontend->>Browser: セッション保存
    Frontend-->>Browser: ダッシュボードへリダイレクト
    Browser->>User: ログイン完了
```

### 2.2 JWT構造

#### ヘッダー
```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "auth-service-2026-key-1"
}
```

#### ペイロード
```json
{
  "sub": "user-12345abc",
  "tenant_id": "privileged-tenant",
  "username": "admin001",
  "email": "admin@example.com",
  "roles": [
    {
      "service": "tenant",
      "role": "全体管理者"
    },
    {
      "service": "auth",
      "role": "全体管理者"
    },
    {
      "service": "file",
      "role": "file_admin"
    }
  ],
  "iat": 1738406400,
  "exp": 1738435200,
  "iss": "auth-service",
  "aud": "api-services"
}
```

#### 署名
```
RSASHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  privateKey
)
```

### 2.3 JWT鍵管理

```mermaid
graph LR
    KV[Azure Key Vault]
    AuthSvc[Auth Service]
    Services[Other Services]
    
    KV -->|Private Key<br/>起動時取得| AuthSvc
    KV -->|Public Key<br/>起動時取得| Services
    
    AuthSvc -->|JWT生成<br/>RS256署名| JWT[JWT Token]
    JWT -->|検証要求| Services
    Services -->|Public Keyで検証| Verified[検証成功]
```

**Key Vault構成:**
```yaml
Secrets:
  - Name: auth-jwt-private-key
    Value: |
      -----BEGIN PRIVATE KEY-----
      MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
      -----END PRIVATE KEY-----
    ContentType: application/pkcs8
    
  - Name: auth-jwt-public-key
    Value: |
      -----BEGIN PUBLIC KEY-----
      MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvNC4...
      -----END PUBLIC KEY-----
    ContentType: application/x-pem-file

Rotation Policy:
  ExpiryTime: 365 days
  NotifyBefore: 30 days
```

## 3. 認可フロー

### 3.1 リクエスト認可シーケンス

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Gateway as API Gateway
    participant Service as マイクロサービス
    participant AuthSvc as Auth Service
    participant Cache as Redis
    
    Client->>Gateway: GET /api/v1/tenants<br/>Authorization: Bearer {JWT}
    
    Gateway->>Gateway: JWT検証<br/>（Public Key）
    
    alt JWT署名不正
        Gateway-->>Client: 401 Unauthorized
    end
    
    alt JWT期限切れ
        Gateway-->>Client: 401 Unauthorized
    end
    
    Gateway->>Service: リクエスト転送<br/>+ JWT
    
    Service->>Service: JWTからロール抽出
    
    Service->>Service: エンドポイント要求ロールチェック<br/>required: ["全体管理者", "管理者"]
    
    alt ロール不一致
        Service-->>Gateway: 403 Forbidden
        Gateway-->>Client: 403 Forbidden
    end
    
    Service->>Service: ビジネスロジック実行
    Service-->>Gateway: 200 OK + Data
    Gateway-->>Client: 200 OK + Data
```

### 3.2 ロール階層

```mermaid
graph TD
    Global[全体管理者]
    Admin[管理者]
    Viewer[閲覧者]
    
    Global -->|すべての権限を含む| Admin
    Admin -->|すべての権限を含む| Viewer
    
    style Global fill:#ff6b6b
    style Admin fill:#ffd93d
    style Viewer fill:#6bcf7f
```

### 3.3 サービス別ロールマトリックス

#### Tenant Management Service

| 操作 | 全体管理者 | 管理者 | 閲覧者 |
|------|----------|--------|--------|
| テナント一覧表示 | ✓ | ✓ | ✓ |
| テナント作成 | ✓ | ✓ | × |
| 通常テナント編集 | ✓ | ✓ | × |
| 通常テナント削除 | ✓ | ✓ | × |
| 特権テナント操作 | ✓ | × | × |
| ユーザー追加 | ✓ | ✓ | × |
| ユーザー削除 | ✓ | × | × |

#### Auth Service

| 操作 | 全体管理者 | 閲覧者 |
|------|----------|--------|
| ユーザー一覧表示 | ✓ | ✓ |
| ユーザー作成 | ✓ | × |
| ユーザー編集 | ✓ | × |
| ユーザー削除 | ✓ | × |
| ロール割り当て | ✓ | × |

#### Service Setting Service

| 操作 | 全体管理者 | 閲覧者 |
|------|----------|--------|
| サービス一覧表示 | ✓ | ✓ |
| サービス割り当て | ✓ | × |
| サービス解除 | ✓ | × |
| ロール情報参照 | ✓ | ✓ |

#### Business Services (例: File Service)

| 操作 | file_admin | file_editor | file_viewer |
|------|-----------|-------------|-------------|
| ファイル一覧 | ✓ | ✓ | ✓ |
| ファイルアップロード | ✓ | ✓ | × |
| ファイルダウンロード | ✓ | ✓ | ✓ |
| ファイル削除 | ✓ | × | × |
| 共有設定 | ✓ | × | × |

### 3.4 認可チェック実装

#### FastAPI依存性注入パターン

```python
# app/api/deps.py
from typing import List
from fastapi import Depends, HTTPException, status, Header
import httpx
from app.core.config import settings

async def get_current_user(authorization: str = Header(...)) -> dict:
    """JWTから現在のユーザー情報を取得"""
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    
    token = authorization.split(" ")[1]
    
    # Auth ServiceでJWT検証（または自サービスでPublic Keyで検証）
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.AUTH_SERVICE_URL}/api/v1/validate/token",
            json={"token": token},
            timeout=2.0
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        payload = response.json()
        return {
            "user_id": payload["user_id"],
            "tenant_id": payload["tenant_id"],
            "roles": payload["roles"]
        }

def require_role(
    service_name: str,
    allowed_roles: List[str]
):
    """ロールベース認可デコレータ"""
    
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_roles = current_user.get("roles", [])
        
        # 指定サービスのロールをチェック
        has_permission = any(
            role.get("service") == service_name and 
            role.get("role") in allowed_roles
            for role in user_roles
        )
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required roles for {service_name}: {', '.join(allowed_roles)}"
            )
        
        return current_user
    
    return role_checker

# 使用例
@router.post("/tenants", response_model=TenantResponse)
async def create_tenant(
    request: CreateTenantRequest,
    current_user: dict = Depends(
        require_role("tenant", ["全体管理者", "管理者"])
    )
):
    # テナント作成処理
    pass
```

#### ミドルウェアパターン

```python
# app/middleware/auth_middleware.py
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, HTTPException
from jose import jwt, JWTError
from app.core.config import settings

class JWTAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # ヘルスチェックやpublicエンドポイントはスキップ
        if request.url.path in ["/health", "/ready", "/api/v1/roles"]:
            return await call_next(request)
        
        # Authorization ヘッダー取得
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Missing or invalid authorization header"
            )
        
        token = auth_header.split(" ")[1]
        
        try:
            # Public KeyでJWT検証
            payload = jwt.decode(
                token,
                settings.JWT_PUBLIC_KEY,
                algorithms=["RS256"],
                audience="api-services",
                issuer="auth-service"
            )
            
            # リクエストステートにユーザー情報を追加
            request.state.user = {
                "user_id": payload["sub"],
                "tenant_id": payload["tenant_id"],
                "roles": payload["roles"]
            }
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=401,
                detail="Token has expired"
            )
        except JWTError as e:
            raise HTTPException(
                status_code=401,
                detail=f"Invalid token: {str(e)}"
            )
        
        response = await call_next(request)
        return response
```

## 4. トークン管理

### 4.1 トークンリフレッシュ（未実装）

将来的な拡張として、リフレッシュトークンの実装を検討：

```mermaid
sequenceDiagram
    participant Client
    participant AuthSvc
    participant DB
    
    Client->>AuthSvc: POST /auth/refresh<br/>{refresh_token}
    AuthSvc->>DB: refresh_tokenの検証
    
    alt トークン有効
        AuthSvc->>AuthSvc: 新しいaccess_token生成
        AuthSvc-->>Client: {access_token, refresh_token}
    else トークン無効
        AuthSvc-->>Client: 401 Unauthorized
    end
```

### 4.2 トークン無効化（ログアウト）

```mermaid
sequenceDiagram
    participant Client
    participant AuthSvc
    participant Redis
    
    Client->>AuthSvc: POST /auth/logout<br/>Authorization: Bearer {JWT}
    AuthSvc->>AuthSvc: JWTから有効期限取得
    AuthSvc->>Redis: ブラックリストに追加<br/>SETEX blacklist:{token} {ttl} 1
    AuthSvc-->>Client: 204 No Content
    
    Note over Redis: TTL = JWT有効期限まで
```

### 4.3 JWT検証時のブラックリストチェック

```python
async def validate_token(token: str) -> dict:
    """JWT検証（ブラックリストチェック含む）"""
    
    # ブラックリストチェック
    is_blacklisted = await redis.exists(f"blacklist:{token}")
    if is_blacklisted:
        raise InvalidTokenError("Token has been revoked")
    
    # JWT検証
    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"]
        )
        return payload
    except JWTError as e:
        raise InvalidTokenError(str(e))
```

## 5. セキュリティ考慮事項

### 5.1 脆弱性対策

| 脅威 | 対策 |
|------|------|
| **JWT改ざん** | RS256署名による検証 |
| **トークン盗聴** | HTTPS必須、Secure Cookie |
| **トークン再利用攻撃** | 短命トークン（8時間） |
| **CSRFAttack** | SameSite Cookie属性 |
| **XSS** | HTTPOnly Cookie、CSP |
| **Brute Force** | レート制限、アカウントロック |
| **パスワードクラック** | bcrypt、強力なパスワードポリシー |

### 5.2 パスワードポリシー

```yaml
最小長: 8文字
必須要素:
  - 大文字（A-Z）
  - 小文字（a-z）
  - 数字（0-9）
  - 特殊文字（!@#$%^&*）
禁止パターン:
  - 辞書単語
  - ユーザー名を含む
  - 過去3回のパスワード
有効期限: 90日
```

### 5.3 アカウントロック

```python
# 疑似コード
async def authenticate(username: str, password: str):
    # ログイン失敗回数チェック
    failed_count = await redis.get(f"login_failed:{username}")
    
    if failed_count and int(failed_count) >= 5:
        # 30分間ロック
        lock_until = await redis.ttl(f"login_failed:{username}")
        raise AccountLockedError(f"アカウントがロックされています。{lock_until}秒後に再試行してください")
    
    # 認証処理
    user = await user_repo.get_by_username(username)
    if not user or not verify_password(password, user.hashed_password):
        # 失敗回数をインクリメント
        await redis.incr(f"login_failed:{username}")
        await redis.expire(f"login_failed:{username}", 1800)  # 30分
        
        raise AuthenticationError("ユーザー名またはパスワードが正しくありません")
    
    # 認証成功 - 失敗カウンターをクリア
    await redis.delete(f"login_failed:{username}")
    
    return user
```

## 6. 監査ログ

### 6.1 認証イベントログ

すべての認証・認可イベントを記録：

```json
{
  "id": "log-uuid",
  "type": "auth_event",
  "event": "login_success",
  "user_id": "user-uuid",
  "username": "admin001",
  "tenant_id": "privileged-tenant",
  "ip_address": "203.0.113.42",
  "user_agent": "Mozilla/5.0...",
  "timestamp": "2026-02-01T10:00:00Z",
  "metadata": {
    "session_id": "session-uuid",
    "location": "Tokyo, Japan"
  }
}
```

### 6.2 認可失敗ログ

```json
{
  "id": "log-uuid",
  "type": "authz_event",
  "event": "access_denied",
  "user_id": "user-uuid",
  "tenant_id": "tenant-uuid",
  "resource": "/api/v1/tenants",
  "method": "POST",
  "required_roles": ["全体管理者", "管理者"],
  "user_roles": ["閲覧者"],
  "timestamp": "2026-02-01T10:00:00Z",
  "ip_address": "203.0.113.42"
}
```

## 7. コンプライアンス

### 7.1 GDPR対応

- **データ最小化**: JWTに必要最小限の情報のみ含める
- **Right to be Forgotten**: ユーザー削除時にトークンを無効化
- **監査証跡**: すべてのアクセスを記録

### 7.2 SOC 2対応

- **アクセス制御**: RBACによる厳格な権限管理
- **ログ保持**: 監査ログを90日間保持
- **暗号化**: 保存時・転送時の暗号化

## 8. テスト戦略

### 8.1 認証テスト

```python
# tests/integration/test_auth.py
import pytest

@pytest.mark.asyncio
async def test_login_success():
    """正常ログインテスト"""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "testuser", "password": "TestPass123!"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

@pytest.mark.asyncio
async def test_login_invalid_credentials():
    """不正な認証情報でのログインテスト"""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "testuser", "password": "wrongpass"}
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_account_lockout():
    """アカウントロックテスト"""
    for _ in range(5):
        await client.post(
            "/api/v1/auth/login",
            json={"username": "testuser", "password": "wrongpass"}
        )
    
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": "testuser", "password": "TestPass123!"}
    )
    assert response.status_code == 423  # Locked
```

### 8.2 認可テスト

```python
@pytest.mark.asyncio
async def test_role_based_access():
    """ロールベースアクセス制御テスト"""
    # 閲覧者トークンで作成試行
    response = await client.post(
        "/api/v1/tenants",
        json={"name": "test", "display_name": "Test"},
        headers={"Authorization": f"Bearer {viewer_token}"}
    )
    assert response.status_code == 403
    
    # 管理者トークンで作成成功
    response = await client.post(
        "/api/v1/tenants",
        json={"name": "test", "display_name": "Test"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201
```

## 9. 関連ドキュメント

- [セキュリティ考慮事項](./security-considerations.md)
- [API設計](../api/api-design.md)
- [Auth Service設計](../components/auth-service.md)
