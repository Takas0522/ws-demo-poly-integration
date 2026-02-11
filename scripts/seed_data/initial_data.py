"""初期シードデータ定義"""
from datetime import datetime
import uuid
from passlib.hash import bcrypt


def generate_id():
    """UUID生成"""
    return str(uuid.uuid4())


# 特権テナント
PRIVILEGED_TENANT = {
    "id": "privileged-tenant-001",
    "type": "tenant",
    "name": "特権テナント",
    "domains": ["system.local"],
    "isPrivileged": True,
    "createdAt": datetime.utcnow().isoformat() + "Z",
    "partitionKey": "privileged-tenant-001"
}

# システム管理者ユーザー
ADMIN_USER = {
    "id": "admin-user-001",
    "type": "user",
    "userId": "admin@system.local",
    "name": "システム管理者",
    "passwordHash": bcrypt.hash("Admin@12345"),  # 初期パスワード
    "tenantId": "privileged-tenant-001",
    "isActive": True,
    "createdAt": datetime.utcnow().isoformat() + "Z",
    "partitionKey": "admin-user-001"
}

# テナント-ユーザー紐付け
TENANT_USER_RELATION = {
    "id": generate_id(),
    "type": "tenant_user",
    "tenantId": "privileged-tenant-001",
    "userId": "admin-user-001",
    "addedAt": datetime.utcnow().isoformat() + "Z",
    "addedBy": "system",
    "partitionKey": "privileged-tenant-001"
}

# サービス定義
SERVICES = [
    {
        "id": "service-001",
        "type": "service",
        "name": "テナント管理サービス",
        "description": "テナントとテナント所属ユーザーの管理",
        "apiUrl": "http://localhost:8002",
        "roleApiEndpoint": "/api/v1/roles",
        "isActive": True,
        "isMock": False,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-001"
    },
    {
        "id": "service-002",
        "type": "service",
        "name": "認証認可サービス",
        "description": "ユーザー認証とロール管理",
        "apiUrl": "http://localhost:8001",
        "roleApiEndpoint": "/api/v1/roles",
        "isActive": True,
        "isMock": False,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-002"
    },
    {
        "id": "service-003",
        "type": "service",
        "name": "利用サービス設定サービス",
        "description": "テナントへのサービス割り当て管理",
        "apiUrl": "http://localhost:8003",
        "roleApiEndpoint": "/api/v1/roles",
        "isActive": True,
        "isMock": False,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-003"
    },
    {
        "id": "service-004",
        "type": "service",
        "name": "ファイル管理サービス",
        "description": "ファイルのアップロード・管理機能",
        "apiUrl": "http://localhost:3000/api/mock/file-management",
        "roleApiEndpoint": "/roles",
        "isActive": True,
        "isMock": True,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-004"
    },
    {
        "id": "service-005",
        "type": "service",
        "name": "メッセージングサービス",
        "description": "メッセージ送信・管理機能",
        "apiUrl": "http://localhost:3000/api/mock/messaging",
        "roleApiEndpoint": "/roles",
        "isActive": True,
        "isMock": True,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-005"
    },
    {
        "id": "service-006",
        "type": "service",
        "name": "API利用サービス",
        "description": "API利用状況の管理",
        "apiUrl": "http://localhost:3000/api/mock/api-usage",
        "roleApiEndpoint": "/roles",
        "isActive": True,
        "isMock": True,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-006"
    },
    {
        "id": "service-007",
        "type": "service",
        "name": "バックアップサービス",
        "description": "バックアップ・リストア機能",
        "apiUrl": "http://localhost:3000/api/mock/backup",
        "roleApiEndpoint": "/roles",
        "isActive": True,
        "isMock": True,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-007"
    }
]

# ロール定義
ROLES = [
    # テナント管理サービスのロール
    {
        "id": "role-001",
        "type": "role",
        "serviceId": "service-001",
        "serviceName": "テナント管理サービス",
        "roleCode": "global_admin",
        "roleName": "全体管理者",
        "description": "特権テナントに対する操作が可能",
        "permissions": ["tenant:*"],
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-001"
    },
    {
        "id": "role-002",
        "type": "role",
        "serviceId": "service-001",
        "serviceName": "テナント管理サービス",
        "roleCode": "admin",
        "roleName": "管理者",
        "description": "通常テナントの追加・削除・編集が可能",
        "permissions": ["tenant:create", "tenant:update", "tenant:delete", "tenant:read"],
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-001"
    },
    {
        "id": "role-003",
        "type": "role",
        "serviceId": "service-001",
        "serviceName": "テナント管理サービス",
        "roleCode": "viewer",
        "roleName": "閲覧者",
        "description": "テナント情報の参照が可能",
        "permissions": ["tenant:read"],
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-001"
    },
    # 認証認可サービスのロール
    {
        "id": "role-004",
        "type": "role",
        "serviceId": "service-002",
        "serviceName": "認証認可サービス",
        "roleCode": "global_admin",
        "roleName": "全体管理者",
        "description": "ユーザーの登録・削除が可能",
        "permissions": ["user:*"],
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-002"
    },
    {
        "id": "role-005",
        "type": "role",
        "serviceId": "service-002",
        "serviceName": "認証認可サービス",
        "roleCode": "viewer",
        "roleName": "閲覧者",
        "description": "ユーザー情報の参照が可能",
        "permissions": ["user:read"],
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-002"
    },
    # 利用サービス設定サービスのロール
    {
        "id": "role-006",
        "type": "role",
        "serviceId": "service-003",
        "serviceName": "利用サービス設定サービス",
        "roleCode": "global_admin",
        "roleName": "全体管理者",
        "description": "サービス割り当てが可能",
        "permissions": ["service:*"],
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-003"
    },
    {
        "id": "role-007",
        "type": "role",
        "serviceId": "service-003",
        "serviceName": "利用サービス設定サービス",
        "roleCode": "viewer",
        "roleName": "閲覧者",
        "description": "情報の参照が可能",
        "permissions": ["service:read"],
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-003"
    },
    # モックサービスのロール（ファイル管理）
    {
        "id": "role-008",
        "type": "role",
        "serviceId": "service-004",
        "serviceName": "ファイル管理サービス",
        "roleCode": "admin",
        "roleName": "管理者",
        "description": "ファイルのアップロード・削除が可能",
        "permissions": ["file:upload", "file:delete", "file:read"],
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-004"
    },
    {
        "id": "role-009",
        "type": "role",
        "serviceId": "service-004",
        "serviceName": "ファイル管理サービス",
        "roleCode": "user",
        "roleName": "ユーザー",
        "description": "ファイルの閲覧・ダウンロードが可能",
        "permissions": ["file:read", "file:download"],
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-004"
    },
    # メッセージングサービスのロール
    {
        "id": "role-010",
        "type": "role",
        "serviceId": "service-005",
        "serviceName": "メッセージングサービス",
        "roleCode": "admin",
        "roleName": "管理者",
        "description": "メッセージの送信・削除が可能",
        "permissions": ["message:send", "message:delete", "message:read"],
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-005"
    },
    {
        "id": "role-011",
        "type": "role",
        "serviceId": "service-005",
        "serviceName": "メッセージングサービス",
        "roleCode": "user",
        "roleName": "ユーザー",
        "description": "メッセージの閲覧が可能",
        "permissions": ["message:read"],
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-005"
    },
    # API利用サービスのロール
    {
        "id": "role-012",
        "type": "role",
        "serviceId": "service-006",
        "serviceName": "API利用サービス",
        "roleCode": "admin",
        "roleName": "管理者",
        "description": "API設定の変更が可能",
        "permissions": ["api:config", "api:use", "api:read"],
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-006"
    },
    {
        "id": "role-013",
        "type": "role",
        "serviceId": "service-006",
        "serviceName": "API利用サービス",
        "roleCode": "user",
        "roleName": "ユーザー",
        "description": "API利用のみ可能",
        "permissions": ["api:use", "api:read"],
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-006"
    },
    # バックアップサービスのロール
    {
        "id": "role-014",
        "type": "role",
        "serviceId": "service-007",
        "serviceName": "バックアップサービス",
        "roleCode": "admin",
        "roleName": "管理者",
        "description": "バックアップの実行・復元が可能",
        "permissions": ["backup:execute", "backup:restore", "backup:read"],
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-007"
    },
    {
        "id": "role-015",
        "type": "role",
        "serviceId": "service-007",
        "serviceName": "バックアップサービス",
        "roleCode": "viewer",
        "roleName": "閲覧者",
        "description": "バックアップ状況の参照が可能",
        "permissions": ["backup:read"],
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "partitionKey": "service-007"
    }
]

# 管理者ユーザーのロール割り当て
ADMIN_USER_ROLES = [
    {
        "id": generate_id(),
        "type": "user_role",
        "userId": "admin-user-001",
        "roleId": "role-001",  # テナント管理 - 全体管理者
        "serviceId": "service-001",
        "assignedAt": datetime.utcnow().isoformat() + "Z",
        "assignedBy": "system",
        "partitionKey": "admin-user-001"
    },
    {
        "id": generate_id(),
        "type": "user_role",
        "userId": "admin-user-001",
        "roleId": "role-004",  # 認証認可 - 全体管理者
        "serviceId": "service-002",
        "assignedAt": datetime.utcnow().isoformat() + "Z",
        "assignedBy": "system",
        "partitionKey": "admin-user-001"
    },
    {
        "id": generate_id(),
        "type": "user_role",
        "userId": "admin-user-001",
        "roleId": "role-006",  # サービス設定 - 全体管理者
        "serviceId": "service-003",
        "assignedAt": datetime.utcnow().isoformat() + "Z",
        "assignedBy": "system",
        "partitionKey": "admin-user-001"
    }
]
