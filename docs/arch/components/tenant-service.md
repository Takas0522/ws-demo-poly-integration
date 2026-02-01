# Tenant Management Service 設計

## 1. サービス概要

### 1.1 責務

Tenant Management Serviceは、テナントとテナントユーザーの管理を担当します：

- **テナント管理**: テナントのCRUD操作
- **テナントユーザー管理**: テナントに所属するユーザーの管理
- **特権テナント保護**: 特権テナントの削除・編集制限
- **利用サービス情報表示**: テナントが利用可能なサービス一覧表示
- **ユーザードメイン管理**: テナントごとの許可ドメイン設定

### 1.2 技術スタック

```yaml
言語: Python 3.11
フレームワーク: FastAPI 0.109
DB Client: azure-cosmos 4.5
キャッシュ: redis-py 5.0
バリデーション: Pydantic v2
非同期処理: asyncio
テスト: pytest, pytest-asyncio
```

### 1.3 アクセス制御

| 操作 | 全体管理者 | 管理者 | 閲覧者 |
|------|-----------|--------|--------|
| テナント一覧表示 | ✓ | ✓ | ✓ |
| テナント詳細表示 | ✓ | ✓ | ✓ |
| 通常テナント作成 | ✓ | ✓ | × |
| 通常テナント編集 | ✓ | ✓ | × |
| 通常テナント削除 | ✓ | ✓ | × |
| 特権テナント操作 | ✓ | × | × |

## 2. アーキテクチャ

### 2.1 レイヤー構成

```mermaid
graph TB
    subgraph "API Layer"
        TenantEndpoints[テナントエンドポイント<br/>/tenants/*]
        UserEndpoints[ユーザーエンドポイント<br/>/tenants/{id}/users/*]
        DomainEndpoints[ドメインエンドポイント<br/>/tenants/{id}/domains/*]
    end
    
    subgraph "Service Layer"
        TenantService[TenantService<br/>テナント管理ロジック]
        TenantUserService[TenantUserService<br/>ユーザー管理ロジック]
        DomainService[DomainService<br/>ドメイン管理ロジック]
    end
    
    subgraph "Repository Layer"
        TenantRepo[TenantRepository]
        TenantUserRepo[TenantUserRepository]
        DomainRepo[DomainRepository]
    end
    
    subgraph "External Services"
        AuthService[Auth Service<br/>JWT検証]
        ServiceSettingService[Service Setting Service<br/>利用サービス情報]
    end
    
    subgraph "Data Layer"
        CosmosDB[(Cosmos DB<br/>tenants container)]
        Cache[(Redis Cache)]
    end
    
    TenantEndpoints --> TenantService
    UserEndpoints --> TenantUserService
    DomainEndpoints --> DomainService
    
    TenantService --> TenantRepo
    TenantUserService --> TenantUserRepo
    DomainService --> DomainRepo
    
    TenantService -.->|JWT検証| AuthService
    TenantService -.->|サービス情報取得| ServiceSettingService
    
    TenantRepo --> CosmosDB
    TenantUserRepo --> CosmosDB
    DomainRepo --> CosmosDB
    
    TenantService --> Cache
```

### 2.2 ディレクトリ構造

```
tenant-management-service/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── tenants.py         # テナントCRUD
│   │   │   │   ├── tenant_users.py    # テナントユーザー管理
│   │   │   │   └── domains.py         # ドメイン管理
│   │   │   └── router.py              # APIルーター統合
│   │   └── deps.py                    # 依存性注入
│   ├── core/
│   │   ├── config.py                  # 設定管理
│   │   ├── security.py                # セキュリティ
│   │   ├── exceptions.py              # カスタム例外
│   │   └── constants.py               # 定数定義
│   ├── models/
│   │   ├── domain/
│   │   │   ├── tenant.py              # テナントドメインモデル
│   │   │   ├── tenant_user.py         # テナントユーザーモデル
│   │   │   └── domain.py              # ドメインモデル
│   │   └── schemas/
│   │       ├── tenant.py              # テナントスキーマ
│   │       ├── tenant_user.py         # テナントユーザースキーマ
│   │       └── domain.py              # ドメインスキーマ
│   ├── services/
│   │   ├── tenant_service.py          # テナント管理サービス
│   │   ├── tenant_user_service.py     # テナントユーザー管理サービス
│   │   └── domain_service.py          # ドメイン管理サービス
│   ├── repositories/
│   │   ├── tenant_repository.py       # テナントリポジトリ
│   │   ├── tenant_user_repository.py  # テナントユーザーリポジトリ
│   │   └── domain_repository.py       # ドメインリポジトリ
│   ├── middleware/
│   │   ├── auth_middleware.py         # 認証ミドルウェア
│   │   └── logging_middleware.py      # ロギングミドルウェア
│   └── main.py                        # アプリケーションエントリーポイント
├── tests/
├── Dockerfile
├── requirements.txt
└── README.md
```

## 3. データモデル

### 3.1 Tenantsコンテナ

```python
# app/models/domain/tenant.py
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum

class TenantStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DELETED = "deleted"

class Tenant(BaseModel):
    """テナントドメインモデル"""
    id: str = Field(..., description="テナントID (UUID)")
    name: str = Field(..., min_length=1, max_length=100)
    display_name: str
    description: Optional[str] = None
    is_privileged: bool = False
    status: TenantStatus = TenantStatus.ACTIVE
    user_count: int = 0
    max_users: Optional[int] = None
    allowed_domains: List[str] = []
    created_at: datetime
    updated_at: datetime
    created_by: str
    updated_by: str
    
    # Cosmos DB用フィールド
    type: str = "tenant"
    partition_key: str  # tenant_id (自身のID)

class TenantUser(BaseModel):
    """テナントユーザーモデル"""
    id: str
    tenant_id: str
    user_id: str = Field(..., description="Auth Serviceで管理されているユーザーID")
    user_name: str
    user_email: str
    added_at: datetime
    added_by: str
    
    # Cosmos DB用フィールド
    type: str = "tenant_user"
    partition_key: str  # tenant_id

class AllowedDomain(BaseModel):
    """許可ドメインモデル"""
    id: str
    tenant_id: str
    domain: str = Field(..., description="許可するドメイン (例: example.com)")
    added_at: datetime
    added_by: str
    
    # Cosmos DB用フィールド
    type: str = "allowed_domain"
    partition_key: str  # tenant_id
```

### 3.2 ドキュメント例

```json
{
  "id": "tenant-12345",
  "type": "tenant",
  "name": "example-corp",
  "display_name": "株式会社Example",
  "description": "サンプル企業のテナント",
  "is_privileged": false,
  "status": "active",
  "user_count": 25,
  "max_users": 100,
  "allowed_domains": ["example.com", "example.co.jp"],
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-02-01T10:00:00Z",
  "created_by": "user-admin",
  "updated_by": "user-admin",
  "partition_key": "tenant-12345"
}

{
  "id": "tenant-12345:user-67890",
  "type": "tenant_user",
  "tenant_id": "tenant-12345",
  "user_id": "user-67890",
  "user_name": "yamada",
  "user_email": "yamada@example.com",
  "added_at": "2026-01-15T10:00:00Z",
  "added_by": "user-admin",
  "partition_key": "tenant-12345"
}

{
  "id": "tenant-12345:domain-1",
  "type": "allowed_domain",
  "tenant_id": "tenant-12345",
  "domain": "example.com",
  "added_at": "2026-01-01T00:00:00Z",
  "added_by": "user-admin",
  "partition_key": "tenant-12345"
}
```

## 4. 主要機能実装

### 4.1 テナント管理サービス

```python
# app/services/tenant_service.py
from typing import List, Optional
from datetime import datetime
from app.models.domain.tenant import Tenant, TenantStatus
from app.models.schemas.tenant import CreateTenantRequest, UpdateTenantRequest
from app.repositories.tenant_repository import TenantRepository
from app.core.exceptions import (
    TenantAlreadyExistsError,
    TenantNotFoundError,
    PrivilegedTenantProtectionError
)

class TenantService:
    PRIVILEGED_TENANT_ID = "privileged-tenant"
    
    def __init__(self, tenant_repo: TenantRepository):
        self.tenant_repo = tenant_repo
    
    async def create_tenant(
        self,
        request: CreateTenantRequest,
        current_user_id: str,
        current_user_roles: List[dict]
    ) -> Tenant:
        """テナント作成"""
        
        # 重複チェック
        existing = await self.tenant_repo.get_by_name(request.name)
        if existing:
            raise TenantAlreadyExistsError(
                f"テナント名 '{request.name}' は既に使用されています"
            )
        
        # テナントオブジェクト作成
        tenant_id = f"tenant-{uuid.uuid4()}"
        tenant = Tenant(
            id=tenant_id,
            name=request.name,
            display_name=request.display_name,
            description=request.description,
            is_privileged=False,  # 通常テナントは必ずFalse
            status=TenantStatus.ACTIVE,
            user_count=0,
            max_users=request.max_users,
            allowed_domains=request.allowed_domains or [],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            created_by=current_user_id,
            updated_by=current_user_id,
            type="tenant",
            partition_key=tenant_id
        )
        
        # DB保存
        created_tenant = await self.tenant_repo.create(tenant)
        
        return created_tenant
    
    async def list_tenants(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[TenantStatus] = None
    ) -> List[Tenant]:
        """テナント一覧取得"""
        return await self.tenant_repo.list(skip=skip, limit=limit, status=status)
    
    async def get_tenant(self, tenant_id: str) -> Tenant:
        """テナント取得"""
        tenant = await self.tenant_repo.get(tenant_id)
        if not tenant:
            raise TenantNotFoundError(f"テナントID '{tenant_id}' が見つかりません")
        return tenant
    
    async def update_tenant(
        self,
        tenant_id: str,
        request: UpdateTenantRequest,
        current_user_id: str,
        current_user_roles: List[dict]
    ) -> Tenant:
        """テナント更新"""
        
        # 特権テナント保護チェック
        if tenant_id == self.PRIVILEGED_TENANT_ID:
            # 全体管理者のみ特権テナントを編集可能
            if not self._has_global_admin_role(current_user_roles):
                raise PrivilegedTenantProtectionError(
                    "特権テナントは全体管理者のみ編集できます"
                )
        
        # テナント取得
        tenant = await self.get_tenant(tenant_id)
        
        # 更新フィールドの適用
        if request.display_name:
            tenant.display_name = request.display_name
        if request.description is not None:
            tenant.description = request.description
        if request.status:
            tenant.status = request.status
        if request.max_users is not None:
            tenant.max_users = request.max_users
        if request.allowed_domains is not None:
            tenant.allowed_domains = request.allowed_domains
        
        tenant.updated_at = datetime.utcnow()
        tenant.updated_by = current_user_id
        
        # DB更新
        updated_tenant = await self.tenant_repo.update(tenant)
        
        return updated_tenant
    
    async def delete_tenant(
        self,
        tenant_id: str,
        current_user_id: str,
        current_user_roles: List[dict]
    ) -> None:
        """テナント削除（論理削除）"""
        
        # 特権テナント保護チェック
        if tenant_id == self.PRIVILEGED_TENANT_ID:
            raise PrivilegedTenantProtectionError(
                "特権テナントは削除できません"
            )
        
        # テナント取得
        tenant = await self.get_tenant(tenant_id)
        
        # ステータスを削除に変更
        tenant.status = TenantStatus.DELETED
        tenant.updated_at = datetime.utcnow()
        tenant.updated_by = current_user_id
        
        await self.tenant_repo.update(tenant)
    
    def _has_global_admin_role(self, roles: List[dict]) -> bool:
        """全体管理者ロールを持つか確認"""
        return any(
            role.get("service") == "tenant" and role.get("role") == "全体管理者"
            for role in roles
        )
```

### 4.2 テナントユーザー管理サービス

```python
# app/services/tenant_user_service.py
from typing import List
from datetime import datetime
import httpx
from app.models.domain.tenant import TenantUser
from app.models.schemas.tenant_user import AddUserToTenantRequest
from app.repositories.tenant_user_repository import TenantUserRepository
from app.repositories.tenant_repository import TenantRepository
from app.core.config import settings
from app.core.exceptions import (
    UserNotFoundError,
    UserAlreadyInTenantError,
    TenantUserLimitExceededError
)

class TenantUserService:
    def __init__(
        self,
        tenant_user_repo: TenantUserRepository,
        tenant_repo: TenantRepository
    ):
        self.tenant_user_repo = tenant_user_repo
        self.tenant_repo = tenant_repo
    
    async def add_user_to_tenant(
        self,
        tenant_id: str,
        request: AddUserToTenantRequest,
        current_user_id: str,
        auth_token: str
    ) -> TenantUser:
        """テナントにユーザーを追加"""
        
        # テナント存在確認
        tenant = await self.tenant_repo.get(tenant_id)
        if not tenant:
            raise TenantNotFoundError(f"テナントID '{tenant_id}' が見つかりません")
        
        # ユーザー上限チェック
        if tenant.max_users and tenant.user_count >= tenant.max_users:
            raise TenantUserLimitExceededError(
                f"テナントのユーザー上限 ({tenant.max_users}) に達しています"
            )
        
        # Auth Serviceからユーザー情報取得
        user_info = await self._get_user_from_auth_service(
            request.user_id,
            auth_token
        )
        
        if not user_info:
            raise UserNotFoundError(f"ユーザーID '{request.user_id}' が見つかりません")
        
        # 重複チェック
        existing = await self.tenant_user_repo.get_by_user_id(
            tenant_id,
            request.user_id
        )
        if existing:
            raise UserAlreadyInTenantError(
                f"ユーザーは既にこのテナントに所属しています"
            )
        
        # テナントユーザーオブジェクト作成
        tenant_user = TenantUser(
            id=f"{tenant_id}:{request.user_id}",
            tenant_id=tenant_id,
            user_id=request.user_id,
            user_name=user_info["username"],
            user_email=user_info["email"],
            added_at=datetime.utcnow(),
            added_by=current_user_id,
            type="tenant_user",
            partition_key=tenant_id
        )
        
        # DB保存
        created = await self.tenant_user_repo.create(tenant_user)
        
        # テナントのユーザー数更新
        tenant.user_count += 1
        await self.tenant_repo.update(tenant)
        
        return created
    
    async def list_tenant_users(
        self,
        tenant_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[TenantUser]:
        """テナントユーザー一覧取得"""
        return await self.tenant_user_repo.list(
            tenant_id=tenant_id,
            skip=skip,
            limit=limit
        )
    
    async def remove_user_from_tenant(
        self,
        tenant_id: str,
        user_id: str,
        current_user_id: str,
        current_user_roles: List[dict]
    ) -> None:
        """テナントからユーザーを削除"""
        
        # 特権テナントの場合は全体管理者のみ削除可能
        if tenant_id == "privileged-tenant":
            if not self._has_global_admin_role(current_user_roles):
                raise PrivilegedTenantProtectionError(
                    "特権テナントのユーザーは全体管理者のみ削除できます"
                )
        
        # テナントユーザー削除
        await self.tenant_user_repo.delete(tenant_id, user_id)
        
        # テナントのユーザー数更新
        tenant = await self.tenant_repo.get(tenant_id)
        if tenant:
            tenant.user_count = max(0, tenant.user_count - 1)
            await self.tenant_repo.update(tenant)
    
    async def _get_user_from_auth_service(
        self,
        user_id: str,
        auth_token: str
    ) -> dict:
        """Auth Serviceからユーザー情報取得"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.AUTH_SERVICE_URL}/api/v1/users/{user_id}",
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                return None
            else:
                raise Exception(f"Auth Service error: {response.status_code}")
    
    def _has_global_admin_role(self, roles: List[dict]) -> bool:
        """全体管理者ロールを持つか確認"""
        return any(
            role.get("service") == "tenant" and role.get("role") == "全体管理者"
            for role in roles
        )
```

## 5. API仕様

### 5.1 テナントエンドポイント

```python
# app/api/v1/endpoints/tenants.py
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.models.schemas.tenant import (
    TenantResponse,
    CreateTenantRequest,
    UpdateTenantRequest,
    TenantListResponse
)
from app.models.domain.tenant import TenantStatus
from app.services.tenant_service import TenantService
from app.api.deps import (
    get_tenant_service,
    get_current_user,
    require_role
)

router = APIRouter()

@router.get("", response_model=TenantListResponse)
async def list_tenants(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[TenantStatus] = None,
    current_user: dict = Depends(get_current_user),
    tenant_service: TenantService = Depends(get_tenant_service)
):
    """
    テナント一覧取得
    
    すべてのロールがアクセス可能
    
    - **skip**: スキップ数（ページネーション用）
    - **limit**: 取得件数上限
    - **status**: フィルタリング用ステータス
    """
    tenants = await tenant_service.list_tenants(
        skip=skip,
        limit=limit,
        status=status
    )
    
    return TenantListResponse(
        tenants=tenants,
        total=len(tenants),
        skip=skip,
        limit=limit
    )

@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: str,
    current_user: dict = Depends(get_current_user),
    tenant_service: TenantService = Depends(get_tenant_service)
):
    """
    テナント詳細取得
    
    すべてのロールがアクセス可能
    """
    tenant = await tenant_service.get_tenant(tenant_id)
    return TenantResponse(**tenant.dict())

@router.post("", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    request: CreateTenantRequest,
    current_user: dict = Depends(require_role(["全体管理者", "管理者"])),
    tenant_service: TenantService = Depends(get_tenant_service)
):
    """
    テナント作成
    
    全体管理者、管理者のみアクセス可能
    
    - **name**: テナント識別名（一意）
    - **display_name**: 表示名
    - **description**: 説明（オプション）
    - **max_users**: 最大ユーザー数（オプション）
    - **allowed_domains**: 許可ドメインリスト
    """
    tenant = await tenant_service.create_tenant(
        request=request,
        current_user_id=current_user["user_id"],
        current_user_roles=current_user["roles"]
    )
    
    return TenantResponse(**tenant.dict())

@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: str,
    request: UpdateTenantRequest,
    current_user: dict = Depends(require_role(["全体管理者", "管理者"])),
    tenant_service: TenantService = Depends(get_tenant_service)
):
    """
    テナント更新
    
    全体管理者、管理者のみアクセス可能
    特権テナントは全体管理者のみ更新可能
    """
    tenant = await tenant_service.update_tenant(
        tenant_id=tenant_id,
        request=request,
        current_user_id=current_user["user_id"],
        current_user_roles=current_user["roles"]
    )
    
    return TenantResponse(**tenant.dict())

@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(
    tenant_id: str,
    current_user: dict = Depends(require_role(["全体管理者", "管理者"])),
    tenant_service: TenantService = Depends(get_tenant_service)
):
    """
    テナント削除（論理削除）
    
    全体管理者、管理者のみアクセス可能
    特権テナントは削除不可
    """
    await tenant_service.delete_tenant(
        tenant_id=tenant_id,
        current_user_id=current_user["user_id"],
        current_user_roles=current_user["roles"]
    )
    
    return None
```

### 5.2 テナントユーザーエンドポイント

```python
# app/api/v1/endpoints/tenant_users.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.models.schemas.tenant_user import (
    TenantUserResponse,
    AddUserToTenantRequest,
    TenantUserListResponse
)
from app.services.tenant_user_service import TenantUserService
from app.api.deps import (
    get_tenant_user_service,
    get_current_user,
    get_auth_token,
    require_role
)

router = APIRouter()

@router.get("/{tenant_id}/users", response_model=TenantUserListResponse)
async def list_tenant_users(
    tenant_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: dict = Depends(get_current_user),
    service: TenantUserService = Depends(get_tenant_user_service)
):
    """
    テナントユーザー一覧取得
    
    すべてのロールがアクセス可能
    """
    users = await service.list_tenant_users(
        tenant_id=tenant_id,
        skip=skip,
        limit=limit
    )
    
    return TenantUserListResponse(
        users=users,
        total=len(users),
        skip=skip,
        limit=limit
    )

@router.post("/{tenant_id}/users", response_model=TenantUserResponse, status_code=status.HTTP_201_CREATED)
async def add_user_to_tenant(
    tenant_id: str,
    request: AddUserToTenantRequest,
    current_user: dict = Depends(require_role(["全体管理者", "管理者"])),
    auth_token: str = Depends(get_auth_token),
    service: TenantUserService = Depends(get_tenant_user_service)
):
    """
    テナントにユーザーを追加
    
    全体管理者、管理者のみアクセス可能
    特権テナントは全体管理者のみ追加可能
    """
    user = await service.add_user_to_tenant(
        tenant_id=tenant_id,
        request=request,
        current_user_id=current_user["user_id"],
        auth_token=auth_token
    )
    
    return TenantUserResponse(**user.dict())

@router.delete("/{tenant_id}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user_from_tenant(
    tenant_id: str,
    user_id: str,
    current_user: dict = Depends(require_role(["全体管理者"])),
    service: TenantUserService = Depends(get_tenant_user_service)
):
    """
    テナントからユーザーを削除
    
    全体管理者のみアクセス可能
    """
    await service.remove_user_from_tenant(
        tenant_id=tenant_id,
        user_id=user_id,
        current_user_id=current_user["user_id"],
        current_user_roles=current_user["roles"]
    )
    
    return None
```

## 6. 認可チェック実装

### 6.1 依存性注入でのロールチェック

```python
# app/api/deps.py
from typing import List
from fastapi import Depends, HTTPException, status, Header
from app.services.tenant_service import TenantService
from app.core.config import settings
import httpx

async def get_auth_token(authorization: str = Header(...)) -> str:
    """Authorization ヘッダーからトークン取得"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    return authorization.split(" ")[1]

async def get_current_user(token: str = Depends(get_auth_token)) -> dict:
    """JWT検証とユーザー情報取得"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.AUTH_SERVICE_URL}/api/v1/validate/token",
            json={"token": token}
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        return response.json()

def require_role(allowed_roles: List[str]):
    """ロールベース認可デコレータ"""
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_roles = current_user.get("roles", [])
        
        # テナントサービスのロールをチェック
        has_permission = any(
            role.get("service") == "tenant" and role.get("role") in allowed_roles
            for role in user_roles
        )
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required roles: {', '.join(allowed_roles)}"
            )
        
        return current_user
    
    return role_checker
```

## 7. テスト

### 7.1 テナント管理テスト

```python
# tests/integration/test_tenants.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_create_tenant_success(admin_token):
    """テナント作成成功テスト"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/tenants",
            json={
                "name": "test-tenant",
                "display_name": "テストテナント",
                "description": "テスト用",
                "max_users": 50,
                "allowed_domains": ["test.com"]
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "test-tenant"
    assert data["is_privileged"] == False

@pytest.mark.asyncio
async def test_delete_privileged_tenant_forbidden(admin_token):
    """特権テナント削除禁止テスト"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.delete(
            "/api/v1/tenants/privileged-tenant",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    assert response.status_code == 403
```

## 8. パフォーマンス最適化

### 8.1 テナント一覧のキャッシング

```python
# app/services/tenant_service.py (追加実装)
import json
from datetime import timedelta

class TenantService:
    # ... 既存コード ...
    
    async def list_tenants_cached(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[TenantStatus] = None
    ) -> List[Tenant]:
        """テナント一覧取得（キャッシュ付き）"""
        
        cache_key = f"tenants:list:{skip}:{limit}:{status}"
        
        # キャッシュ確認
        cached = await self.cache.get(cache_key)
        if cached:
            tenants_data = json.loads(cached)
            return [Tenant(**t) for t in tenants_data]
        
        # DB取得
        tenants = await self.tenant_repo.list(skip=skip, limit=limit, status=status)
        
        # キャッシュ保存（5分）
        tenants_data = [t.dict() for t in tenants]
        await self.cache.setex(
            cache_key,
            300,  # 5分
            json.dumps(tenants_data, default=str)
        )
        
        return tenants
```

## 9. 関連ドキュメント

- [API設計](../api/api-design.md)
- [データモデル](../data/data-model.md)
- [認証フロー](../security/authentication-flow.md)
