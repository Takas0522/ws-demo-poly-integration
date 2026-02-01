# Mock Services 設計

## 1. 概要

本ドキュメントでは、システムで使用するモックビジネスサービスの設計を定義します。これらのサービスは、実際のビジネスロジックを持つサービスの代替として、システムの動作確認とテストに使用されます。

### 1.1 モックサービス一覧

1. **File Service** - ファイル管理サービス
2. **Messaging Service** - メッセージングサービス
3. **API Service** - API利用サービス
4. **Backup Service** - バックアップサービス

### 1.2 共通技術スタック

```yaml
言語: Python 3.11
フレームワーク: FastAPI 0.109
DB Client: azure-cosmos 4.5
バリデーション: Pydantic v2
テスト: pytest, pytest-asyncio
```

### 1.3 共通アーキテクチャパターン

すべてのモックサービスは以下の共通構造を持ちます：

```
service-name/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── resource.py      # リソース管理
│   │   │   │   └── roles.py         # ロール情報提供
│   │   │   └── router.py
│   │   └── deps.py
│   ├── core/
│   │   ├── config.py
│   │   └── exceptions.py
│   ├── models/
│   │   ├── domain/
│   │   └── schemas/
│   ├── services/
│   │   └── resource_service.py
│   ├── repositories/
│   │   └── resource_repository.py
│   ├── middleware/
│   │   └── auth_middleware.py
│   └── main.py
├── Dockerfile
├── requirements.txt
└── README.md
```

## 2. File Service（ファイル管理サービス）

### 2.1 責務

- ファイルのアップロード/ダウンロード
- ファイル一覧表示
- ファイル共有設定
- ファイルのメタデータ管理

### 2.2 ロール定義

| ロール名 | 権限 |
|---------|------|
| ファイル管理者 (file_admin) | すべての操作が可能 |
| ファイル編集者 (file_editor) | ファイルのアップロード、ダウンロード、更新 |
| ファイル閲覧者 (file_viewer) | ファイルのダウンロード、閲覧のみ |

### 2.3 データモデル

```python
# app/models/domain/file.py
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum

class FileStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"

class File(BaseModel):
    """ファイルドメインモデル"""
    id: str
    tenant_id: str
    name: str
    original_name: str
    size: int = Field(..., description="ファイルサイズ（バイト）")
    mime_type: str
    storage_path: str
    uploaded_by: str
    uploaded_at: datetime
    updated_at: datetime
    status: FileStatus = FileStatus.ACTIVE
    is_shared: bool = False
    shared_with: List[str] = []
    tags: List[str] = []
    
    # Cosmos DB用フィールド
    type: str = "file"
    partition_key: str  # tenant_id
```

### 2.4 API エンドポイント

```python
# app/api/v1/endpoints/files.py
from fastapi import APIRouter, Depends, UploadFile, File as FileParam
from app.models.schemas.file import FileResponse, FileListResponse
from app.services.file_service import FileService
from app.api.deps import get_current_user, require_role

router = APIRouter()

@router.get("", response_model=FileListResponse)
async def list_files(
    current_user: dict = Depends(require_role(["file_admin", "file_editor", "file_viewer"])),
    service: FileService = Depends()
):
    """ファイル一覧取得"""
    files = await service.list_files(current_user["tenant_id"])
    return FileListResponse(files=files, total=len(files))

@router.post("", response_model=FileResponse, status_code=201)
async def upload_file(
    file: UploadFile = FileParam(...),
    current_user: dict = Depends(require_role(["file_admin", "file_editor"])),
    service: FileService = Depends()
):
    """ファイルアップロード"""
    uploaded = await service.upload_file(
        tenant_id=current_user["tenant_id"],
        user_id=current_user["user_id"],
        file=file
    )
    return FileResponse(**uploaded.dict())

@router.get("/{file_id}", response_model=FileResponse)
async def get_file(
    file_id: str,
    current_user: dict = Depends(require_role(["file_admin", "file_editor", "file_viewer"])),
    service: FileService = Depends()
):
    """ファイル詳細取得"""
    file = await service.get_file(file_id)
    return FileResponse(**file.dict())

@router.delete("/{file_id}", status_code=204)
async def delete_file(
    file_id: str,
    current_user: dict = Depends(require_role(["file_admin"])),
    service: FileService = Depends()
):
    """ファイル削除"""
    await service.delete_file(file_id, current_user["user_id"])
```

### 2.5 ロール情報提供エンドポイント

```python
# app/api/v1/endpoints/roles.py
from fastapi import APIRouter

router = APIRouter()

@router.get("")
async def get_roles():
    """ロール情報提供"""
    return {
        "roles": [
            {
                "name": "file_admin",
                "display_name": "ファイル管理者",
                "description": "すべてのファイル操作が可能",
                "permissions": ["read", "write", "delete", "share", "manage"]
            },
            {
                "name": "file_editor",
                "display_name": "ファイル編集者",
                "description": "ファイルのアップロード、更新、ダウンロードが可能",
                "permissions": ["read", "write", "download"]
            },
            {
                "name": "file_viewer",
                "display_name": "ファイル閲覧者",
                "description": "ファイルの閲覧とダウンロードのみ可能",
                "permissions": ["read", "download"]
            }
        ]
    }
```

## 3. Messaging Service（メッセージングサービス）

### 3.1 責務

- メッセージの送受信
- チャットルーム管理
- 通知管理
- メッセージ履歴参照

### 3.2 ロール定義

| ロール名 | 権限 |
|---------|------|
| メッセージング管理者 (messaging_admin) | すべての操作が可能 |
| メッセージング利用者 (messaging_user) | メッセージ送受信、ルーム参加 |
| メッセージング閲覧者 (messaging_viewer) | メッセージ閲覧のみ |

### 3.3 データモデル

```python
# app/models/domain/message.py
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum

class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    SYSTEM = "system"

class Message(BaseModel):
    """メッセージドメインモデル"""
    id: str
    tenant_id: str
    room_id: str
    sender_id: str
    sender_name: str
    message_type: MessageType = MessageType.TEXT
    content: str
    attachments: List[str] = []
    sent_at: datetime
    is_read: bool = False
    read_by: List[str] = []
    
    # Cosmos DB用フィールド
    type: str = "message"
    partition_key: str  # tenant_id

class ChatRoom(BaseModel):
    """チャットルームモデル"""
    id: str
    tenant_id: str
    name: str
    description: Optional[str] = None
    members: List[str] = []
    created_by: str
    created_at: datetime
    updated_at: datetime
    
    # Cosmos DB用フィールド
    type: str = "chat_room"
    partition_key: str  # tenant_id
```

### 3.4 API エンドポイント

```python
# app/api/v1/endpoints/messages.py
from fastapi import APIRouter, Depends
from app.models.schemas.message import MessageResponse, MessageListResponse, SendMessageRequest
from app.services.message_service import MessageService
from app.api.deps import get_current_user, require_role

router = APIRouter()

@router.get("/rooms/{room_id}/messages", response_model=MessageListResponse)
async def list_messages(
    room_id: str,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(require_role(["messaging_admin", "messaging_user", "messaging_viewer"])),
    service: MessageService = Depends()
):
    """メッセージ一覧取得"""
    messages = await service.list_messages(
        room_id=room_id,
        tenant_id=current_user["tenant_id"],
        skip=skip,
        limit=limit
    )
    return MessageListResponse(messages=messages, total=len(messages))

@router.post("/rooms/{room_id}/messages", response_model=MessageResponse, status_code=201)
async def send_message(
    room_id: str,
    request: SendMessageRequest,
    current_user: dict = Depends(require_role(["messaging_admin", "messaging_user"])),
    service: MessageService = Depends()
):
    """メッセージ送信"""
    message = await service.send_message(
        room_id=room_id,
        tenant_id=current_user["tenant_id"],
        sender_id=current_user["user_id"],
        content=request.content,
        message_type=request.message_type
    )
    return MessageResponse(**message.dict())
```

### 3.5 ロール情報提供エンドポイント

```python
# app/api/v1/endpoints/roles.py
from fastapi import APIRouter

router = APIRouter()

@router.get("")
async def get_roles():
    """ロール情報提供"""
    return {
        "roles": [
            {
                "name": "messaging_admin",
                "display_name": "メッセージング管理者",
                "description": "チャットルーム管理とすべてのメッセージ操作が可能",
                "permissions": ["read", "write", "delete", "manage_rooms", "manage_members"]
            },
            {
                "name": "messaging_user",
                "display_name": "メッセージング利用者",
                "description": "メッセージの送受信とルーム参加が可能",
                "permissions": ["read", "write", "join_rooms"]
            },
            {
                "name": "messaging_viewer",
                "display_name": "メッセージング閲覧者",
                "description": "メッセージの閲覧のみ可能",
                "permissions": ["read"]
            }
        ]
    }
```

## 4. API Service（API利用サービス）

### 4.1 責務

- 外部API連携の管理
- APIキー管理
- API呼び出し履歴
- レート制限管理

### 4.2 ロール定義

| ロール名 | 権限 |
|---------|------|
| API管理者 (api_admin) | すべての操作が可能 |
| API利用者 (api_user) | API呼び出し、履歴参照 |
| API閲覧者 (api_viewer) | 履歴参照のみ |

### 4.3 データモデル

```python
# app/models/domain/api_integration.py
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl

class APIIntegration(BaseModel):
    """API統合モデル"""
    id: str
    tenant_id: str
    name: str
    description: Optional[str] = None
    endpoint: HttpUrl
    api_key: str  # 暗号化して保存
    enabled: bool = True
    created_by: str
    created_at: datetime
    updated_at: datetime
    
    # Cosmos DB用フィールド
    type: str = "api_integration"
    partition_key: str  # tenant_id

class APICallLog(BaseModel):
    """API呼び出しログモデル"""
    id: str
    tenant_id: str
    integration_id: str
    integration_name: str
    method: str
    endpoint: str
    status_code: int
    response_time_ms: int
    called_by: str
    called_at: datetime
    
    # Cosmos DB用フィールド
    type: str = "api_call_log"
    partition_key: str  # tenant_id
```

### 4.4 ロール情報提供エンドポイント

```python
# app/api/v1/endpoints/roles.py
from fastapi import APIRouter

router = APIRouter()

@router.get("")
async def get_roles():
    """ロール情報提供"""
    return {
        "roles": [
            {
                "name": "api_admin",
                "display_name": "API管理者",
                "description": "API統合の作成、削除、設定変更が可能",
                "permissions": ["read", "write", "delete", "manage_keys", "view_logs"]
            },
            {
                "name": "api_user",
                "display_name": "API利用者",
                "description": "API呼び出しと履歴参照が可能",
                "permissions": ["read", "execute", "view_logs"]
            },
            {
                "name": "api_viewer",
                "display_name": "API閲覧者",
                "description": "APIの設定と履歴の参照のみ可能",
                "permissions": ["read", "view_logs"]
            }
        ]
    }
```

## 5. Backup Service（バックアップサービス）

### 5.1 責務

- データバックアップの作成
- バックアップ履歴管理
- データ復元
- バックアップスケジュール管理

### 5.2 ロール定義

| ロール名 | 権限 |
|---------|------|
| バックアップ管理者 (backup_admin) | すべての操作が可能 |
| バックアップ操作者 (backup_operator) | バックアップ作成、復元実行 |
| バックアップ閲覧者 (backup_viewer) | バックアップ履歴参照のみ |

### 5.3 データモデル

```python
# app/models/domain/backup.py
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum

class BackupStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class BackupType(str, Enum):
    FULL = "full"
    INCREMENTAL = "incremental"
    DIFFERENTIAL = "differential"

class Backup(BaseModel):
    """バックアップモデル"""
    id: str
    tenant_id: str
    name: str
    backup_type: BackupType
    status: BackupStatus
    size_bytes: Optional[int] = None
    storage_path: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    created_by: str
    error_message: Optional[str] = None
    
    # Cosmos DB用フィールド
    type: str = "backup"
    partition_key: str  # tenant_id

class BackupSchedule(BaseModel):
    """バックアップスケジュールモデル"""
    id: str
    tenant_id: str
    name: str
    backup_type: BackupType
    cron_expression: str = Field(..., description="Cron形式のスケジュール")
    enabled: bool = True
    retention_days: int = 30
    created_by: str
    created_at: datetime
    updated_at: datetime
    
    # Cosmos DB用フィールド
    type: str = "backup_schedule"
    partition_key: str  # tenant_id
```

### 5.4 API エンドポイント

```python
# app/api/v1/endpoints/backups.py
from fastapi import APIRouter, Depends
from app.models.schemas.backup import BackupResponse, BackupListResponse, CreateBackupRequest
from app.services.backup_service import BackupService
from app.api.deps import get_current_user, require_role

router = APIRouter()

@router.get("", response_model=BackupListResponse)
async def list_backups(
    current_user: dict = Depends(require_role(["backup_admin", "backup_operator", "backup_viewer"])),
    service: BackupService = Depends()
):
    """バックアップ一覧取得"""
    backups = await service.list_backups(current_user["tenant_id"])
    return BackupListResponse(backups=backups, total=len(backups))

@router.post("", response_model=BackupResponse, status_code=202)
async def create_backup(
    request: CreateBackupRequest,
    current_user: dict = Depends(require_role(["backup_admin", "backup_operator"])),
    service: BackupService = Depends()
):
    """バックアップ作成（非同期実行）"""
    backup = await service.create_backup(
        tenant_id=current_user["tenant_id"],
        user_id=current_user["user_id"],
        backup_type=request.backup_type,
        name=request.name
    )
    return BackupResponse(**backup.dict())

@router.post("/{backup_id}/restore", status_code=202)
async def restore_backup(
    backup_id: str,
    current_user: dict = Depends(require_role(["backup_admin", "backup_operator"])),
    service: BackupService = Depends()
):
    """バックアップから復元（非同期実行）"""
    await service.restore_backup(
        backup_id=backup_id,
        tenant_id=current_user["tenant_id"],
        user_id=current_user["user_id"]
    )
    return {"message": "復元を開始しました"}
```

### 5.5 ロール情報提供エンドポイント

```python
# app/api/v1/endpoints/roles.py
from fastapi import APIRouter

router = APIRouter()

@router.get("")
async def get_roles():
    """ロール情報提供"""
    return {
        "roles": [
            {
                "name": "backup_admin",
                "display_name": "バックアップ管理者",
                "description": "バックアップの作成、削除、復元、スケジュール管理が可能",
                "permissions": ["read", "write", "delete", "restore", "manage_schedules"]
            },
            {
                "name": "backup_operator",
                "display_name": "バックアップ操作者",
                "description": "バックアップの作成と復元が可能",
                "permissions": ["read", "write", "restore"]
            },
            {
                "name": "backup_viewer",
                "display_name": "バックアップ閲覧者",
                "description": "バックアップ履歴の参照のみ可能",
                "permissions": ["read"]
            }
        ]
    }
```

## 6. 共通実装パターン

### 6.1 認証ミドルウェア

すべてのモックサービスは共通の認証ミドルウェアを使用します：

```python
# app/middleware/auth_middleware.py
from fastapi import Request, HTTPException, status
import httpx
from app.core.config import settings

async def verify_jwt(request: Request, call_next):
    """JWT検証ミドルウェア"""
    
    # ヘルスチェックエンドポイントはスキップ
    if request.url.path in ["/health", "/ready"]:
        return await call_next(request)
    
    # Authorization ヘッダー取得
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    
    token = auth_header.split(" ")[1]
    
    # Auth Serviceでトークン検証
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
        
        # ユーザー情報をリクエストに追加
        request.state.user = response.json()
    
    response = await call_next(request)
    return response
```

### 6.2 ヘルスチェックエンドポイント

```python
# app/api/v1/endpoints/health.py
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health_check():
    """ヘルスチェック"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/ready")
async def readiness_check():
    """レディネスチェック"""
    # DB接続チェックなどを実装
    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat()
    }
```

### 6.3 ロールベース認可ヘルパー

```python
# app/api/deps.py
from typing import List
from fastapi import Depends, HTTPException, status, Request

def get_current_user(request: Request) -> dict:
    """現在のユーザー情報取得"""
    if not hasattr(request.state, "user"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated"
        )
    return request.state.user

def require_role(allowed_roles: List[str]):
    """ロールベース認可"""
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_roles = current_user.get("roles", [])
        
        # サービス固有のロールをチェック
        service_name = "file"  # 各サービスで適切に設定
        
        has_permission = any(
            role.get("service") == service_name and role.get("role") in allowed_roles
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

## 7. デプロイメント設定

### 7.1 Dockerfile（共通）

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 依存関係インストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコピー
COPY app/ ./app/

# ポート公開
EXPOSE 8000

# アプリケーション起動
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 7.2 環境変数（共通）

```bash
# .env
SERVICE_NAME=file-service
SERVICE_PORT=8101

# Auth Service
AUTH_SERVICE_URL=http://auth-service:8002

# Cosmos DB
COSMOS_ENDPOINT=https://xxx.documents.azure.com:443/
COSMOS_KEY=xxx
COSMOS_DATABASE=file_db
COSMOS_CONTAINER=files

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=xxx

# Azure Monitor
APPINSIGHTS_CONNECTION_STRING=xxx
```

## 8. テスト

### 8.1 共通テストパターン

```python
# tests/integration/test_service.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_list_resources_with_auth(admin_token):
    """認証付きリソース一覧取得テスト"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/resources",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    assert response.status_code == 200
    data = response.json()
    assert "resources" in data

@pytest.mark.asyncio
async def test_unauthorized_access():
    """未認証アクセステスト"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/v1/resources")
    
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_role_based_access(viewer_token):
    """ロールベース認可テスト"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/resources",
            json={"name": "test"},
            headers={"Authorization": f"Bearer {viewer_token}"}
        )
    
    assert response.status_code == 403  # 閲覧者は作成不可
```

## 9. 監視・ロギング

### 9.1 共通ロギング設定

```python
# app/core/logging_config.py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "service": "file-service",  # 各サービスで設定
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
        }
        
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)

def setup_logging():
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    
    logger = logging.getLogger()
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
```

## 10. まとめ

各モックサービスは：

1. **統一されたアーキテクチャ**: 同じ構造とパターンで実装
2. **ロール情報提供**: Service Setting Serviceがロール情報を収集できる
3. **JWT認証**: Auth Serviceと連携した認証・認可
4. **テナント分離**: マルチテナント対応のデータ管理
5. **オブザーバビリティ**: 統一されたログとメトリクス

これにより、実際のビジネスサービスへの置き換えが容易になります。

## 11. 関連ドキュメント

- [Service Setting Service](./service-setting-service.md)
- [Auth Service](./auth-service.md)
- [API設計](../api/api-design.md)
- [データモデル](../data/data-model.md)
