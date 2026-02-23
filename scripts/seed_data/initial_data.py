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

# サービス機能マスターデータ
SERVICE_FEATURES = [
    # service-001: テナント管理サービス
    {
        "id": "feature-service-001-01", "type": "service_feature",
        "service_id": "service-001", "feature_key": "audit_log",
        "feature_name": "監査ログ", "description": "テナント操作の監査ログを記録・保存する機能",
        "default_enabled": True, "partitionKey": "service-001",
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "id": "feature-service-001-02", "type": "service_feature",
        "service_id": "service-001", "feature_key": "auto_backup",
        "feature_name": "自動バックアップ", "description": "テナントデータを定期的に自動バックアップする機能",
        "default_enabled": False, "partitionKey": "service-001",
        "created_at": "2026-01-01T00:00:00Z",
    },
    # service-002: 認証認可サービス
    {
        "id": "feature-service-002-01", "type": "service_feature",
        "service_id": "service-002", "feature_key": "mfa",
        "feature_name": "多要素認証 (MFA)", "description": "ログイン時にMFAを要求する機能",
        "default_enabled": False, "partitionKey": "service-002",
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "id": "feature-service-002-02", "type": "service_feature",
        "service_id": "service-002", "feature_key": "password_policy",
        "feature_name": "強化パスワードポリシー", "description": "パスワードの複雑さ要件を強化する機能",
        "default_enabled": True, "partitionKey": "service-002",
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "id": "feature-service-002-03", "type": "service_feature",
        "service_id": "service-002", "feature_key": "session_audit",
        "feature_name": "セッション監査", "description": "ユーザーセッションの監査ログを記録する機能",
        "default_enabled": False, "partitionKey": "service-002",
        "created_at": "2026-01-01T00:00:00Z",
    },
    # service-003: 利用サービス設定サービス
    {
        "id": "feature-service-003-01", "type": "service_feature",
        "service_id": "service-003", "feature_key": "service_report",
        "feature_name": "サービス利用レポート", "description": "テナントのサービス利用状況レポートを生成する機能",
        "default_enabled": True, "partitionKey": "service-003",
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "id": "feature-service-003-02", "type": "service_feature",
        "service_id": "service-003", "feature_key": "auto_provisioning",
        "feature_name": "自動プロビジョニング", "description": "新規テナントに対してサービスを自動的にプロビジョニングする機能",
        "default_enabled": False, "partitionKey": "service-003",
        "created_at": "2026-01-01T00:00:00Z",
    },
    # service-004: ファイル管理サービス
    {
        "id": "feature-service-004-01", "type": "service_feature",
        "service_id": "service-004", "feature_key": "version_control",
        "feature_name": "バージョン管理", "description": "ファイルのバージョン履歴を管理する機能",
        "default_enabled": True, "partitionKey": "service-004",
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "id": "feature-service-004-02", "type": "service_feature",
        "service_id": "service-004", "feature_key": "file_sharing",
        "feature_name": "ファイル外部共有", "description": "組織外へのファイル共有リンクを生成・管理する機能",
        "default_enabled": False, "partitionKey": "service-004",
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "id": "feature-service-004-03", "type": "service_feature",
        "service_id": "service-004", "feature_key": "auto_backup",
        "feature_name": "自動バックアップ", "description": "ファイルデータを定期的に自動バックアップする機能",
        "default_enabled": True, "partitionKey": "service-004",
        "created_at": "2026-01-01T00:00:00Z",
    },
    # service-005: メッセージングサービス
    {
        "id": "feature-service-005-01", "type": "service_feature",
        "service_id": "service-005", "feature_key": "email_notification",
        "feature_name": "メール通知", "description": "メールによる通知を送信する機能",
        "default_enabled": True, "partitionKey": "service-005",
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "id": "feature-service-005-02", "type": "service_feature",
        "service_id": "service-005", "feature_key": "sms_notification",
        "feature_name": "SMS通知", "description": "SMSによる通知を送信する機能",
        "default_enabled": False, "partitionKey": "service-005",
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "id": "feature-service-005-03", "type": "service_feature",
        "service_id": "service-005", "feature_key": "push_notification",
        "feature_name": "プッシュ通知", "description": "プッシュ通知を送信する機能",
        "default_enabled": False, "partitionKey": "service-005",
        "created_at": "2026-01-01T00:00:00Z",
    },
    # service-006: API利用サービス
    {
        "id": "feature-service-006-01", "type": "service_feature",
        "service_id": "service-006", "feature_key": "usage_analytics",
        "feature_name": "利用分析エクスポート", "description": "API利用状況の分析データをエクスポートする機能",
        "default_enabled": True, "partitionKey": "service-006",
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "id": "feature-service-006-02", "type": "service_feature",
        "service_id": "service-006", "feature_key": "rate_limiting",
        "feature_name": "レートリミット設定", "description": "APIのレートリミットをカスタム設定する機能",
        "default_enabled": True, "partitionKey": "service-006",
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "id": "feature-service-006-03", "type": "service_feature",
        "service_id": "service-006", "feature_key": "api_audit_log",
        "feature_name": "API監査ログ", "description": "API呼び出しの監査ログを記録する機能",
        "default_enabled": False, "partitionKey": "service-006",
        "created_at": "2026-01-01T00:00:00Z",
    },
    # service-007: バックアップサービス
    {
        "id": "feature-service-007-01", "type": "service_feature",
        "service_id": "service-007", "feature_key": "incremental_backup",
        "feature_name": "増分バックアップ", "description": "変更されたデータのみをバックアップする機能",
        "default_enabled": True, "partitionKey": "service-007",
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "id": "feature-service-007-02", "type": "service_feature",
        "service_id": "service-007", "feature_key": "cross_region_backup",
        "feature_name": "クロスリージョンバックアップ", "description": "別リージョンへのバックアップレプリケーション機能",
        "default_enabled": False, "partitionKey": "service-007",
        "created_at": "2026-01-01T00:00:00Z",
    },
    {
        "id": "feature-service-007-03", "type": "service_feature",
        "service_id": "service-007", "feature_key": "auto_schedule",
        "feature_name": "自動スケジュール", "description": "バックアップの自動スケジュールを設定する機能",
        "default_enabled": True, "partitionKey": "service-007",
        "created_at": "2026-01-01T00:00:00Z",
    },
]
