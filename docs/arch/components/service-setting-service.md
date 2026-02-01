# Service Setting Service 設計

## 1. サービス概要

### 1.1 責務

Service Setting Serviceは、テナントが利用できるサービスの設定を管理します：

- **サービス利用設定**: テナントに対するサービスの割り当て/解除
- **サービスカタログ管理**: 利用可能なサービス一覧の管理
- **ロール情報収集**: 各サービスのロール情報APIからロール定義を収集
- **サービス利用状況表示**: テナントごとのサービス利用状況一覧

### 1.2 技術スタック

```yaml
言語: Python 3.11
フレームワーク: FastAPI 0.109
DB Client: azure-cosmos 4.5
キャッシュ: redis-py 5.0
バリデーション: Pydantic v2
非同期処理: asyncio, aiohttp
テスト: pytest, pytest-asyncio
```

### 1.3 アクセス制御

| 操作 | 全体管理者 | 閲覧者 |
|------|-----------|--------|
| サービス一覧表示 | ✓ | ✓ |
| テナント利用サービス表示 | ✓ | ✓ |
| サービス割り当て | ✓ | × |
| サービス解除 | ✓ | × |
| ロール情報取得 | ✓ | ✓ |

## 2. アーキテクチャ

### 2.1 レイヤー構成

```mermaid
graph TB
    subgraph "API Layer"
        ServiceEndpoints[サービスエンドポイント<br/>/services/*]
        TenantServiceEndpoints[テナントサービスエンドポイント<br/>/tenants/{id}/services/*]
        RoleEndpoints[ロール情報エンドポイント<br/>/services/{id}/roles/*]
    end
    
    subgraph "Service Layer"
        ServiceCatalogService[ServiceCatalogService<br/>サービスカタログ管理]
        TenantServiceService[TenantServiceService<br/>テナントサービス管理]
        RoleDiscoveryService[RoleDiscoveryService<br/>ロール情報収集]
    end
    
    subgraph "Repository Layer"
        ServiceRepo[ServiceRepository]
        TenantServiceRepo[TenantServiceRepository]
        RoleInfoRepo[RoleInfoRepository]
    end
    
    subgraph "External Services"
        AuthService[Auth Service]
        BusinessServices[Business Services<br/>File, Messaging, API, Backup]
    end
    
    subgraph "Data Layer"
        CosmosDB[(Cosmos DB<br/>services container)]
        Cache[(Redis Cache)]
    end
    
    ServiceEndpoints --> ServiceCatalogService
    TenantServiceEndpoints --> TenantServiceService
    RoleEndpoints --> RoleDiscoveryService
    
    ServiceCatalogService --> ServiceRepo
    TenantServiceService --> TenantServiceRepo
    RoleDiscoveryService --> RoleInfoRepo
    
    RoleDiscoveryService -.->|ロール情報取得| BusinessServices
    TenantServiceService -.->|JWT検証| AuthService
    
    ServiceRepo --> CosmosDB
    TenantServiceRepo --> CosmosDB
    RoleInfoRepo --> CosmosDB
    
    RoleDiscoveryService --> Cache
```

### 2.2 ディレクトリ構造

```
service-setting-service/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── services.py              # サービスカタログ
│   │   │   │   ├── tenant_services.py       # テナントサービス設定
│   │   │   │   └── roles.py                 # ロール情報
│   │   │   └── router.py
│   │   └── deps.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── exceptions.py
│   │   └── constants.py
│   ├── models/
│   │   ├── domain/
│   │   │   ├── service.py               # サービスモデル
│   │   │   ├── tenant_service.py        # テナントサービスモデル
│   │   │   └── role_info.py             # ロール情報モデル
│   │   └── schemas/
│   │       ├── service.py
│   │       ├── tenant_service.py
│   │       └── role_info.py
│   ├── services/
│   │   ├── service_catalog_service.py   # サービスカタログ管理
│   │   ├── tenant_service_service.py    # テナントサービス管理
│   │   └── role_discovery_service.py    # ロール情報収集
│   ├── repositories/
│   │   ├── service_repository.py
│   │   ├── tenant_service_repository.py
│   │   └── role_info_repository.py
│   ├── middleware/
│   │   ├── auth_middleware.py
│   │   └── logging_middleware.py
│   └── main.py
├── tests/
├── Dockerfile
├── requirements.txt
└── README.md
```

## 3. データモデル

### 3.1 Servicesコンテナ

```python
# app/models/domain/service.py
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl
from enum import Enum

class ServiceCategory(str, Enum):
    CORE = "core"              # コアサービス（tenant, auth, service-setting）
    BUSINESS = "business"      # ビジネスサービス

class ServiceStatus(str, Enum):
    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    DEPRECATED = "deprecated"

class Service(BaseModel):
    """サービスドメインモデル"""
    id: str = Field(..., description="サービスID")
    name: str = Field(..., min_length=1, max_length=100)
    display_name: str
    description: Optional[str] = None
    category: ServiceCategory
    status: ServiceStatus = ServiceStatus.ACTIVE
    base_url: HttpUrl = Field(..., description="サービスのベースURL")
    roles_endpoint: str = Field(..., description="ロール情報取得エンドポイント")
    icon_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Cosmos DB用フィールド
    type: str = "service"
    partition_key: str  # サービスID


class TenantService(BaseModel):
    """テナントサービス割り当てモデル"""
    id: str
    tenant_id: str
    service_id: str
    service_name: str
    enabled: bool = True
    assigned_at: datetime
    assigned_by: str
    
    # Cosmos DB用フィールド
    type: str = "tenant_service"
    partition_key: str  # tenant_id


class ServiceRoleInfo(BaseModel):
    """サービスロール情報モデル"""
    id: str
    service_id: str
    service_name: str
    role_name: str
    role_display_name: str
    description: Optional[str] = None
    permissions: List[str] = []
    fetched_at: datetime
    
    # Cosmos DB用フィールド
    type: str = "service_role_info"
    partition_key: str  # service_id
```

### 3.2 ドキュメント例

```json
{
  "id": "file-service",
  "type": "service",
  "name": "file-service",
  "display_name": "ファイル管理サービス",
  "description": "ファイルのアップロード、ダウンロード、共有機能を提供",
  "category": "business",
  "status": "active",
  "base_url": "http://file-service:8101",
  "roles_endpoint": "/api/v1/roles",
  "icon_url": "https://cdn.example.com/icons/file.svg",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-02-01T10:00:00Z",
  "partition_key": "file-service"
}

{
  "id": "tenant-12345:file-service",
  "type": "tenant_service",
  "tenant_id": "tenant-12345",
  "service_id": "file-service",
  "service_name": "ファイル管理サービス",
  "enabled": true,
  "assigned_at": "2026-01-15T10:00:00Z",
  "assigned_by": "user-admin",
  "partition_key": "tenant-12345"
}

{
  "id": "file-service:admin",
  "type": "service_role_info",
  "service_id": "file-service",
  "service_name": "ファイル管理サービス",
  "role_name": "admin",
  "role_display_name": "ファイル管理者",
  "description": "ファイルの管理、削除、共有設定が可能",
  "permissions": ["read", "write", "delete", "share", "manage"],
  "fetched_at": "2026-02-01T10:00:00Z",
  "partition_key": "file-service"
}
```

## 4. 主要機能実装

### 4.1 テナントサービス管理サービス

```python
# app/services/tenant_service_service.py
from typing import List
from datetime import datetime
import uuid
from app.models.domain.service import TenantService
from app.models.schemas.tenant_service import AssignServiceRequest
from app.repositories.tenant_service_repository import TenantServiceRepository
from app.repositories.service_repository import ServiceRepository
from app.core.exceptions import (
    ServiceNotFoundError,
    ServiceAlreadyAssignedError,
    ServiceNotAssignedError
)

class TenantServiceService:
    def __init__(
        self,
        tenant_service_repo: TenantServiceRepository,
        service_repo: ServiceRepository
    ):
        self.tenant_service_repo = tenant_service_repo
        self.service_repo = service_repo
    
    async def assign_service_to_tenant(
        self,
        tenant_id: str,
        request: AssignServiceRequest,
        current_user_id: str
    ) -> TenantService:
        """テナントにサービスを割り当て"""
        
        # サービス存在確認
        service = await self.service_repo.get(request.service_id)
        if not service:
            raise ServiceNotFoundError(
                f"サービスID '{request.service_id}' が見つかりません"
            )
        
        # コアサービスは割り当て不可
        if service.category == "core":
            raise ValueError("コアサービスは手動で割り当てできません")
        
        # 重複チェック
        existing = await self.tenant_service_repo.get_by_service_id(
            tenant_id,
            request.service_id
        )
        if existing:
            raise ServiceAlreadyAssignedError(
                f"サービスは既にこのテナントに割り当てられています"
            )
        
        # テナントサービスオブジェクト作成
        tenant_service = TenantService(
            id=f"{tenant_id}:{request.service_id}",
            tenant_id=tenant_id,
            service_id=request.service_id,
            service_name=service.display_name,
            enabled=True,
            assigned_at=datetime.utcnow(),
            assigned_by=current_user_id,
            type="tenant_service",
            partition_key=tenant_id
        )
        
        # DB保存
        created = await self.tenant_service_repo.create(tenant_service)
        
        return created
    
    async def list_tenant_services(
        self,
        tenant_id: str
    ) -> List[TenantService]:
        """テナントの利用サービス一覧取得"""
        return await self.tenant_service_repo.list(tenant_id=tenant_id)
    
    async def unassign_service_from_tenant(
        self,
        tenant_id: str,
        service_id: str,
        current_user_id: str
    ) -> None:
        """テナントからサービスを解除"""
        
        # 存在確認
        tenant_service = await self.tenant_service_repo.get_by_service_id(
            tenant_id,
            service_id
        )
        if not tenant_service:
            raise ServiceNotAssignedError(
                f"サービスはこのテナントに割り当てられていません"
            )
        
        # 削除
        await self.tenant_service_repo.delete(tenant_id, service_id)
    
    async def toggle_service(
        self,
        tenant_id: str,
        service_id: str,
        enabled: bool
    ) -> TenantService:
        """サービスの有効/無効切り替え"""
        
        tenant_service = await self.tenant_service_repo.get_by_service_id(
            tenant_id,
            service_id
        )
        if not tenant_service:
            raise ServiceNotAssignedError(
                f"サービスはこのテナントに割り当てられていません"
            )
        
        tenant_service.enabled = enabled
        
        updated = await self.tenant_service_repo.update(tenant_service)
        return updated
```

### 4.2 ロール情報収集サービス

```python
# app/services/role_discovery_service.py
from typing import List, Dict, Any
from datetime import datetime
import httpx
import asyncio
from app.models.domain.service import Service, ServiceRoleInfo
from app.repositories.service_repository import ServiceRepository
from app.repositories.role_info_repository import RoleInfoRepository
from app.core.config import settings
from app.core.exceptions import RoleFetchError

class RoleDiscoveryService:
    def __init__(
        self,
        service_repo: ServiceRepository,
        role_info_repo: RoleInfoRepository,
        redis_client
    ):
        self.service_repo = service_repo
        self.role_info_repo = role_info_repo
        self.redis = redis_client
    
    async def fetch_all_service_roles(self) -> Dict[str, List[ServiceRoleInfo]]:
        """すべてのサービスからロール情報を取得"""
        
        # すべてのアクティブサービス取得
        services = await self.service_repo.list(status="active")
        
        # 並列でロール情報取得
        tasks = [
            self._fetch_service_roles(service)
            for service in services
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 結果を整理
        all_roles = {}
        for service, result in zip(services, results):
            if isinstance(result, Exception):
                print(f"Failed to fetch roles for {service.name}: {result}")
                continue
            
            all_roles[service.id] = result
        
        return all_roles
    
    async def _fetch_service_roles(
        self,
        service: Service
    ) -> List[ServiceRoleInfo]:
        """特定サービスのロール情報取得"""
        
        # キャッシュ確認
        cache_key = f"roles:{service.id}"
        cached = await self.redis.get(cache_key)
        
        if cached:
            import json
            roles_data = json.loads(cached)
            return [ServiceRoleInfo(**role) for role in roles_data]
        
        try:
            # サービスのロールエンドポイントを呼び出し
            url = f"{service.base_url}{service.roles_endpoint}"
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                
                roles_data = response.json()
                
                # ServiceRoleInfoオブジェクトに変換
                role_infos = []
                for role in roles_data.get("roles", []):
                    role_info = ServiceRoleInfo(
                        id=f"{service.id}:{role['name']}",
                        service_id=service.id,
                        service_name=service.display_name,
                        role_name=role["name"],
                        role_display_name=role.get("display_name", role["name"]),
                        description=role.get("description"),
                        permissions=role.get("permissions", []),
                        fetched_at=datetime.utcnow(),
                        type="service_role_info",
                        partition_key=service.id
                    )
                    role_infos.append(role_info)
                
                # DBに保存
                await self.role_info_repo.upsert_roles(service.id, role_infos)
                
                # キャッシュに保存（1時間）
                import json
                roles_json = [r.dict() for r in role_infos]
                await self.redis.setex(
                    cache_key,
                    3600,
                    json.dumps(roles_json, default=str)
                )
                
                return role_infos
                
        except httpx.HTTPError as e:
            raise RoleFetchError(
                f"Failed to fetch roles from {service.name}: {str(e)}"
            )
    
    async def get_service_roles(
        self,
        service_id: str,
        use_cache: bool = True
    ) -> List[ServiceRoleInfo]:
        """特定サービスのロール情報取得"""
        
        if use_cache:
            # キャッシュ優先
            cache_key = f"roles:{service_id}"
            cached = await self.redis.get(cache_key)
            
            if cached:
                import json
                roles_data = json.loads(cached)
                return [ServiceRoleInfo(**role) for role in roles_data]
        
        # DBから取得
        roles = await self.role_info_repo.list_by_service(service_id)
        
        if not roles:
            # DBにもない場合はサービスから取得
            service = await self.service_repo.get(service_id)
            if service:
                roles = await self._fetch_service_roles(service)
        
        return roles
    
    async def get_roles_for_tenant_services(
        self,
        tenant_id: str
    ) -> Dict[str, List[ServiceRoleInfo]]:
        """テナントが利用可能なサービスのロール情報を取得"""
        
        from app.repositories.tenant_service_repository import TenantServiceRepository
        
        # テナントが利用しているサービス一覧取得
        tenant_service_repo = TenantServiceRepository(...)  # 依存注入から取得
        tenant_services = await tenant_service_repo.list(tenant_id=tenant_id)
        
        # 各サービスのロール情報取得
        roles_dict = {}
        for ts in tenant_services:
            if ts.enabled:
                roles = await self.get_service_roles(ts.service_id)
                roles_dict[ts.service_id] = roles
        
        return roles_dict
```

### 4.3 サービスカタログ管理サービス

```python
# app/services/service_catalog_service.py
from typing import List, Optional
from datetime import datetime
import uuid
from app.models.domain.service import Service, ServiceCategory, ServiceStatus
from app.models.schemas.service import CreateServiceRequest, UpdateServiceRequest
from app.repositories.service_repository import ServiceRepository
from app.core.exceptions import ServiceAlreadyExistsError, ServiceNotFoundError

class ServiceCatalogService:
    def __init__(self, service_repo: ServiceRepository):
        self.service_repo = service_repo
    
    async def register_service(
        self,
        request: CreateServiceRequest
    ) -> Service:
        """新規サービス登録"""
        
        # 重複チェック
        existing = await self.service_repo.get_by_name(request.name)
        if existing:
            raise ServiceAlreadyExistsError(
                f"サービス名 '{request.name}' は既に登録されています"
            )
        
        # サービスオブジェクト作成
        service = Service(
            id=request.name,  # サービス名をIDとして使用
            name=request.name,
            display_name=request.display_name,
            description=request.description,
            category=request.category,
            status=ServiceStatus.ACTIVE,
            base_url=request.base_url,
            roles_endpoint=request.roles_endpoint,
            icon_url=request.icon_url,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            type="service",
            partition_key=request.name
        )
        
        # DB保存
        created = await self.service_repo.create(service)
        
        return created
    
    async def list_services(
        self,
        category: Optional[ServiceCategory] = None,
        status: Optional[ServiceStatus] = None
    ) -> List[Service]:
        """サービス一覧取得"""
        return await self.service_repo.list(category=category, status=status)
    
    async def get_service(self, service_id: str) -> Service:
        """サービス取得"""
        service = await self.service_repo.get(service_id)
        if not service:
            raise ServiceNotFoundError(
                f"サービスID '{service_id}' が見つかりません"
            )
        return service
    
    async def update_service(
        self,
        service_id: str,
        request: UpdateServiceRequest
    ) -> Service:
        """サービス更新"""
        
        service = await self.get_service(service_id)
        
        # 更新フィールドの適用
        if request.display_name:
            service.display_name = request.display_name
        if request.description is not None:
            service.description = request.description
        if request.status:
            service.status = request.status
        if request.base_url:
            service.base_url = request.base_url
        if request.roles_endpoint:
            service.roles_endpoint = request.roles_endpoint
        if request.icon_url is not None:
            service.icon_url = request.icon_url
        
        service.updated_at = datetime.utcnow()
        
        # DB更新
        updated = await self.service_repo.update(service)
        
        return updated
```

## 5. API仕様

### 5.1 サービスカタログエンドポイント

```python
# app/api/v1/endpoints/services.py
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.models.schemas.service import (
    ServiceResponse,
    CreateServiceRequest,
    UpdateServiceRequest,
    ServiceListResponse
)
from app.models.domain.service import ServiceCategory, ServiceStatus
from app.services.service_catalog_service import ServiceCatalogService
from app.api.deps import get_service_catalog_service, get_current_user, require_role

router = APIRouter()

@router.get("", response_model=ServiceListResponse)
async def list_services(
    category: Optional[ServiceCategory] = None,
    status: Optional[ServiceStatus] = None,
    current_user: dict = Depends(get_current_user),
    service: ServiceCatalogService = Depends(get_service_catalog_service)
):
    """
    サービス一覧取得
    
    すべてのロールがアクセス可能
    
    - **category**: フィルタリング用カテゴリ（core/business）
    - **status**: フィルタリング用ステータス
    """
    services = await service.list_services(category=category, status=status)
    
    return ServiceListResponse(
        services=services,
        total=len(services)
    )

@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: str,
    current_user: dict = Depends(get_current_user),
    service: ServiceCatalogService = Depends(get_service_catalog_service)
):
    """サービス詳細取得"""
    svc = await service.get_service(service_id)
    return ServiceResponse(**svc.dict())

@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def register_service(
    request: CreateServiceRequest,
    current_user: dict = Depends(require_role(["全体管理者"])),
    service: ServiceCatalogService = Depends(get_service_catalog_service)
):
    """
    新規サービス登録
    
    全体管理者のみアクセス可能
    """
    svc = await service.register_service(request)
    return ServiceResponse(**svc.dict())

@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: str,
    request: UpdateServiceRequest,
    current_user: dict = Depends(require_role(["全体管理者"])),
    service: ServiceCatalogService = Depends(get_service_catalog_service)
):
    """サービス更新"""
    svc = await service.update_service(service_id, request)
    return ServiceResponse(**svc.dict())
```

### 5.2 テナントサービス設定エンドポイント

```python
# app/api/v1/endpoints/tenant_services.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas.tenant_service import (
    TenantServiceResponse,
    AssignServiceRequest,
    TenantServiceListResponse
)
from app.services.tenant_service_service import TenantServiceService
from app.api.deps import (
    get_tenant_service_service,
    get_current_user,
    require_role
)

router = APIRouter()

@router.get("/{tenant_id}/services", response_model=TenantServiceListResponse)
async def list_tenant_services(
    tenant_id: str,
    current_user: dict = Depends(get_current_user),
    service: TenantServiceService = Depends(get_tenant_service_service)
):
    """
    テナントの利用サービス一覧取得
    
    すべてのロールがアクセス可能
    """
    tenant_services = await service.list_tenant_services(tenant_id)
    
    return TenantServiceListResponse(
        tenant_services=tenant_services,
        total=len(tenant_services)
    )

@router.post("/{tenant_id}/services", response_model=TenantServiceResponse, status_code=status.HTTP_201_CREATED)
async def assign_service_to_tenant(
    tenant_id: str,
    request: AssignServiceRequest,
    current_user: dict = Depends(require_role(["全体管理者"])),
    service: TenantServiceService = Depends(get_tenant_service_service)
):
    """
    テナントにサービスを割り当て
    
    全体管理者のみアクセス可能
    """
    tenant_service = await service.assign_service_to_tenant(
        tenant_id=tenant_id,
        request=request,
        current_user_id=current_user["user_id"]
    )
    
    return TenantServiceResponse(**tenant_service.dict())

@router.delete("/{tenant_id}/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unassign_service_from_tenant(
    tenant_id: str,
    service_id: str,
    current_user: dict = Depends(require_role(["全体管理者"])),
    service: TenantServiceService = Depends(get_tenant_service_service)
):
    """
    テナントからサービスを解除
    
    全体管理者のみアクセス可能
    """
    await service.unassign_service_from_tenant(
        tenant_id=tenant_id,
        service_id=service_id,
        current_user_id=current_user["user_id"]
    )
    
    return None
```

### 5.3 ロール情報エンドポイント

```python
# app/api/v1/endpoints/roles.py
from typing import Dict, List
from fastapi import APIRouter, Depends, Query
from app.models.schemas.role_info import ServiceRoleInfoResponse
from app.services.role_discovery_service import RoleDiscoveryService
from app.api.deps import get_role_discovery_service, get_current_user

router = APIRouter()

@router.get("/{service_id}/roles", response_model=List[ServiceRoleInfoResponse])
async def get_service_roles(
    service_id: str,
    use_cache: bool = Query(True),
    current_user: dict = Depends(get_current_user),
    service: RoleDiscoveryService = Depends(get_role_discovery_service)
):
    """
    特定サービスのロール情報取得
    
    - **service_id**: サービスID
    - **use_cache**: キャッシュを使用するか（デフォルト: true）
    """
    roles = await service.get_service_roles(service_id, use_cache=use_cache)
    
    return [ServiceRoleInfoResponse(**role.dict()) for role in roles]

@router.get("/tenants/{tenant_id}/roles", response_model=Dict[str, List[ServiceRoleInfoResponse]])
async def get_tenant_service_roles(
    tenant_id: str,
    current_user: dict = Depends(get_current_user),
    service: RoleDiscoveryService = Depends(get_role_discovery_service)
):
    """
    テナントが利用可能なサービスのロール情報取得
    
    認証認可サービスでユーザーにロールを割り当てる際に使用
    """
    roles_dict = await service.get_roles_for_tenant_services(tenant_id)
    
    # レスポンス形式に変換
    result = {}
    for service_id, roles in roles_dict.items():
        result[service_id] = [
            ServiceRoleInfoResponse(**role.dict()) for role in roles
        ]
    
    return result

@router.post("/roles/refresh", status_code=status.HTTP_202_ACCEPTED)
async def refresh_all_roles(
    current_user: dict = Depends(require_role(["全体管理者"])),
    service: RoleDiscoveryService = Depends(get_role_discovery_service)
):
    """
    すべてのサービスから最新のロール情報を取得
    
    全体管理者のみアクセス可能
    バックグラウンドでロール情報を更新
    """
    # 非同期タスクとして実行（実装略）
    import asyncio
    asyncio.create_task(service.fetch_all_service_roles())
    
    return {"message": "ロール情報の更新を開始しました"}
```

## 6. 初期データセットアップ

### 6.1 デフォルトサービス登録

```python
# app/core/init_data.py
from app.models.domain.service import Service, ServiceCategory, ServiceStatus
from datetime import datetime

DEFAULT_SERVICES = [
    {
        "id": "tenant-service",
        "name": "tenant-service",
        "display_name": "テナント管理サービス",
        "description": "テナントとユーザーの管理",
        "category": ServiceCategory.CORE,
        "base_url": "http://tenant-service:8001",
        "roles_endpoint": "/api/v1/roles",
    },
    {
        "id": "auth-service",
        "name": "auth-service",
        "display_name": "認証認可サービス",
        "description": "認証とロール管理",
        "category": ServiceCategory.CORE,
        "base_url": "http://auth-service:8002",
        "roles_endpoint": "/api/v1/roles",
    },
    {
        "id": "service-setting-service",
        "name": "service-setting-service",
        "display_name": "サービス設定サービス",
        "description": "サービス利用設定",
        "category": ServiceCategory.CORE,
        "base_url": "http://service-setting-service:8003",
        "roles_endpoint": "/api/v1/roles",
    },
    {
        "id": "file-service",
        "name": "file-service",
        "display_name": "ファイル管理サービス",
        "description": "ファイルのアップロード、ダウンロード、共有",
        "category": ServiceCategory.BUSINESS,
        "base_url": "http://file-service:8101",
        "roles_endpoint": "/api/v1/roles",
        "icon_url": "https://cdn.example.com/icons/file.svg",
    },
    {
        "id": "messaging-service",
        "name": "messaging-service",
        "display_name": "メッセージングサービス",
        "description": "チャット、通知機能",
        "category": ServiceCategory.BUSINESS,
        "base_url": "http://messaging-service:8102",
        "roles_endpoint": "/api/v1/roles",
        "icon_url": "https://cdn.example.com/icons/message.svg",
    },
    {
        "id": "api-service",
        "name": "api-service",
        "display_name": "API利用サービス",
        "description": "外部APIの統合管理",
        "category": ServiceCategory.BUSINESS,
        "base_url": "http://api-service:8103",
        "roles_endpoint": "/api/v1/roles",
        "icon_url": "https://cdn.example.com/icons/api.svg",
    },
    {
        "id": "backup-service",
        "name": "backup-service",
        "display_name": "バックアップサービス",
        "description": "データバックアップと復元",
        "category": ServiceCategory.BUSINESS,
        "base_url": "http://backup-service:8104",
        "roles_endpoint": "/api/v1/roles",
        "icon_url": "https://cdn.example.com/icons/backup.svg",
    },
]

async def init_default_services(service_repo):
    """デフォルトサービスを登録"""
    for svc_data in DEFAULT_SERVICES:
        existing = await service_repo.get(svc_data["id"])
        if not existing:
            service = Service(
                **svc_data,
                status=ServiceStatus.ACTIVE,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                type="service",
                partition_key=svc_data["id"]
            )
            await service_repo.create(service)
```

## 7. テスト

### 7.1 ロール情報取得テスト

```python
# tests/integration/test_role_discovery.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_get_service_roles(admin_token):
    """サービスロール情報取得テスト"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/services/file-service/roles",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "role_name" in data[0]
```

## 8. 関連ドキュメント

- [API設計](../api/api-design.md)
- [データモデル](../data/data-model.md)
- [認証フロー](../security/authentication-flow.md)
