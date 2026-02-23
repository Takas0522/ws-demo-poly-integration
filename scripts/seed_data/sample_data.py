"""デモンストレーション用サンプルデータ定義"""
from datetime import datetime, timedelta
import uuid
from passlib.hash import bcrypt
import random


def generate_id():
    """UUID生成"""
    return str(uuid.uuid4())


def generate_timestamp(days_ago=0):
    """タイムスタンプ生成"""
    return (datetime.utcnow() - timedelta(days=days_ago)).isoformat() + "Z"


# サンプルテナント（10件）
SAMPLE_TENANTS = [
    {
        "id": f"tenant-sample-{i:03d}",
        "type": "tenant",
        "name": name,
        "domains": domains,
        "isPrivileged": False,
        "createdAt": generate_timestamp(days_ago=random.randint(30, 180)),
        "updatedAt": generate_timestamp(days_ago=random.randint(0, 30)),
        "partitionKey": f"tenant-sample-{i:03d}"
    }
    for i, (name, domains) in enumerate([
        ("株式会社サンプルコーポレーション", ["sample-corp.co.jp", "sample-corp.com"]),
        ("テックイノベーション株式会社", ["tech-innovation.jp"]),
        ("グローバルソリューションズ", ["global-solutions.com", "gs-japan.co.jp"]),
        ("デジタルマーケティングパートナーズ", ["dmp.co.jp"]),
        ("クラウドシステムズ株式会社", ["cloud-systems.jp", "cloudsys.com"]),
        ("エンタープライズソリューション", ["enterprise-sol.co.jp"]),
        ("スマートデータ株式会社", ["smart-data.jp"]),
        ("ビジネスアクセラレータ", ["biz-accel.com"]),
        ("フューチャーテクノロジーズ", ["future-tech.co.jp", "ft-japan.jp"]),
        ("インテグレーションワークス", ["integration-works.com"])
    ], start=1)
]

# テナントIDのマッピング
TENANT_IDS = [tenant["id"] for tenant in SAMPLE_TENANTS]

# サンプルユーザー（各テナントに3-5名、合計40名程度）
# ユーザー名のテンプレート
USER_TEMPLATES = [
    ("山田太郎", "taro.yamada"),
    ("佐藤花子", "hanako.sato"),
    ("鈴木一郎", "ichiro.suzuki"),
    ("田中美咲", "misaki.tanaka"),
    ("伊藤健太", "kenta.ito"),
    ("渡辺麻衣", "mai.watanabe"),
    ("高橋大輔", "daisuke.takahashi"),
    ("中村陽子", "yoko.nakamura"),
    ("小林真司", "shinji.kobayashi"),
    ("加藤愛", "ai.kato"),
]

SAMPLE_USERS = []
SAMPLE_TENANT_USERS = []
user_counter = 1

for tenant_idx, tenant_id in enumerate(TENANT_IDS):
    # 各テナントに3-5名のユーザーを追加
    num_users = random.randint(3, 5)

    for i in range(num_users):
        if user_counter > 40:  # 最大40名まで
            break

        name, username_base = USER_TEMPLATES[i % len(USER_TEMPLATES)]

        # テナント固有のドメインでメールアドレスを生成
        tenant = SAMPLE_TENANTS[tenant_idx]
        email_domain = tenant["domains"][0]

        user_id = f"user-sample-{user_counter:03d}"
        user_email = f"{username_base}{tenant_idx+1}@{email_domain}"

        # ユーザー作成
        user = {
            "id": user_id,
            "type": "user",
            "userId": user_email,
            "name": f"{name}（{tenant['name']}）",
            "passwordHash": bcrypt.hash("Password@123"),  # 共通パスワード
            "tenantId": tenant_id,
            "isActive": True,
            "createdAt": generate_timestamp(days_ago=random.randint(20, 150)),
            "updatedAt": generate_timestamp(days_ago=random.randint(0, 20)),
            "lastLoginAt": generate_timestamp(days_ago=random.randint(0, 10)),
            "partitionKey": user_id
        }
        SAMPLE_USERS.append(user)

        # テナント-ユーザー紐付け
        tenant_user = {
            "id": generate_id(),
            "type": "tenant_user",
            "tenantId": tenant_id,
            "userId": user_id,
            "addedAt": user["createdAt"],
            "addedBy": "admin-user-001",
            "partitionKey": tenant_id
        }
        SAMPLE_TENANT_USERS.append(tenant_user)

        user_counter += 1

# サービスIDの定義（initial_data.pyから）
SERVICE_IDS = {
    "tenant_management": "service-001",
    "auth": "service-002",
    "service_settings": "service-003",
    "file_management": "service-004",
    "messaging": "service-005",
    "api_usage": "service-006",
    "backup": "service-007"
}

# ロールIDの定義（initial_data.pyから）
ROLE_IDS = {
    "tenant_management": {
        "global_admin": "role-001",
        "admin": "role-002",
        "viewer": "role-003"
    },
    "auth": {
        "global_admin": "role-004",
        "viewer": "role-005"
    },
    "service_settings": {
        "global_admin": "role-006",
        "viewer": "role-007"
    },
    "file_management": {
        "admin": "role-008",
        "user": "role-009"
    },
    "messaging": {
        "admin": "role-010",
        "user": "role-011"
    },
    "api_usage": {
        "admin": "role-012",
        "user": "role-013"
    },
    "backup": {
        "admin": "role-014",
        "viewer": "role-015"
    }
}

# サンプルユーザーロール割り当て
# 各ユーザーに1-3個のロールをランダムに割り当て
SAMPLE_USER_ROLES = []

# ロール割り当てパターン
role_patterns = [
    # パターン1: 管理者系（全体の20%）
    [
        ("tenant_management", "admin"),
        ("auth", "viewer"),
        ("service_settings", "viewer"),
    ],
    # パターン2: ファイル管理中心（全体の30%）
    [
        ("file_management", "admin"),
        ("messaging", "user"),
    ],
    # パターン3: 一般ユーザー（全体の30%）
    [
        ("file_management", "user"),
        ("messaging", "user"),
        ("api_usage", "user"),
    ],
    # パターン4: 閲覧者（全体の20%）
    [
        ("tenant_management", "viewer"),
        ("auth", "viewer"),
        ("service_settings", "viewer"),
        ("backup", "viewer"),
    ]
]

for idx, user in enumerate(SAMPLE_USERS):
    # パターン選択（重み付き）
    weights = [0.2, 0.3, 0.3, 0.2]
    pattern = random.choices(role_patterns, weights=weights)[0]

    for service_key, role_key in pattern:
        user_role = {
            "id": generate_id(),
            "type": "user_role",
            "userId": user["id"],
            "roleId": ROLE_IDS[service_key][role_key],
            "serviceId": SERVICE_IDS[service_key],
            "assignedAt": generate_timestamp(days_ago=random.randint(0, 100)),
            "assignedBy": "admin-user-001",
            "partitionKey": user["id"]
        }
        SAMPLE_USER_ROLES.append(user_role)

# サンプルテナント-サービス割り当て
# 各テナントに2-5個のサービスをランダムに割り当て
SAMPLE_TENANT_SERVICES = []

# サービス割り当てパターン
service_groups = [
    # 基本パッケージ
    ["file_management", "messaging"],
    # ビジネスパッケージ
    ["file_management", "messaging", "api_usage"],
    # エンタープライズパッケージ
    ["file_management", "messaging", "api_usage", "backup"],
    # フルパッケージ
    ["file_management", "messaging", "api_usage", "backup"],
]

for tenant_idx, tenant_id in enumerate(TENANT_IDS):
    # パッケージ選択
    selected_services = random.choice(service_groups)

    for service_key in selected_services:
        service_id = SERVICE_IDS[service_key]
        tenant_service = {
            "id": f"{tenant_id}_{service_id}",
            "tenant_id": tenant_id,
            "service_id": service_id,
            "tenantId": tenant_id,  # パーティションキー用
            "assigned_at": generate_timestamp(days_ago=random.randint(10, 150)),
            "assigned_by": "admin-user-001",
        }
        SAMPLE_TENANT_SERVICES.append(tenant_service)


# テストアカウント一覧
TEST_ACCOUNTS = [
    {
        "tenant": SAMPLE_TENANTS[0]["name"],
        "email": SAMPLE_USERS[0]["userId"] if SAMPLE_USERS else "N/A",
        "password": "Password@123",
        "roles": "管理者",
        "description": "テナント管理者権限を持つユーザー"
    },
    {
        "tenant": SAMPLE_TENANTS[1]["name"] if len(SAMPLE_TENANTS) > 1 else "N/A",
        "email": SAMPLE_USERS[3]["userId"] if len(SAMPLE_USERS) > 3 else "N/A",
        "password": "Password@123",
        "roles": "一般ユーザー",
        "description": "ファイル管理・メッセージング利用が可能"
    },
    {
        "tenant": SAMPLE_TENANTS[2]["name"] if len(SAMPLE_TENANTS) > 2 else "N/A",
        "email": SAMPLE_USERS[7]["userId"] if len(SAMPLE_USERS) > 7 else "N/A",
        "password": "Password@123",
        "roles": "閲覧者",
        "description": "情報の参照のみ可能"
    }
]

# テナント別サービス機能サンプルデータ
# 各テナントの割り当て済みサービスに対して、一部の機能でデフォルト値を上書きする設定
SAMPLE_TENANT_SERVICE_FEATURES = [
    # tenant-sample-001 のカスタム設定
    {
        "id": "tenant-sample-001_feature-service-004-02",
        "type": "tenant_service_feature",
        "tenant_id": "tenant-sample-001",
        "tenantId": "tenant-sample-001",
        "service_id": "service-004",
        "feature_id": "feature-service-004-02",
        "feature_key": "file_sharing",
        "is_enabled": True,
        "updated_at": "2026-01-15T09:00:00Z",
        "updated_by": "admin-user-001",
        "partitionKey": "tenant-sample-001",
    },
    {
        "id": "tenant-sample-001_feature-service-005-02",
        "type": "tenant_service_feature",
        "tenant_id": "tenant-sample-001",
        "tenantId": "tenant-sample-001",
        "service_id": "service-005",
        "feature_id": "feature-service-005-02",
        "feature_key": "sms_notification",
        "is_enabled": True,
        "updated_at": "2026-01-20T14:30:00Z",
        "updated_by": "admin-user-001",
        "partitionKey": "tenant-sample-001",
    },
    {
        "id": "tenant-sample-001_feature-service-005-03",
        "type": "tenant_service_feature",
        "tenant_id": "tenant-sample-001",
        "tenantId": "tenant-sample-001",
        "service_id": "service-005",
        "feature_id": "feature-service-005-03",
        "feature_key": "push_notification",
        "is_enabled": True,
        "updated_at": "2026-01-20T14:30:00Z",
        "updated_by": "admin-user-001",
        "partitionKey": "tenant-sample-001",
    },
    # tenant-sample-002 のカスタム設定
    {
        "id": "tenant-sample-002_feature-service-004-01",
        "type": "tenant_service_feature",
        "tenant_id": "tenant-sample-002",
        "tenantId": "tenant-sample-002",
        "service_id": "service-004",
        "feature_id": "feature-service-004-01",
        "feature_key": "version_control",
        "is_enabled": False,
        "updated_at": "2026-02-01T10:00:00Z",
        "updated_by": "admin-user-001",
        "partitionKey": "tenant-sample-002",
    },
    {
        "id": "tenant-sample-002_feature-service-006-03",
        "type": "tenant_service_feature",
        "tenant_id": "tenant-sample-002",
        "tenantId": "tenant-sample-002",
        "service_id": "service-006",
        "feature_id": "feature-service-006-03",
        "feature_key": "api_audit_log",
        "is_enabled": True,
        "updated_at": "2026-02-05T11:00:00Z",
        "updated_by": "admin-user-001",
        "partitionKey": "tenant-sample-002",
    },
    # tenant-sample-003 のカスタム設定
    {
        "id": "tenant-sample-003_feature-service-004-02",
        "type": "tenant_service_feature",
        "tenant_id": "tenant-sample-003",
        "tenantId": "tenant-sample-003",
        "service_id": "service-004",
        "feature_id": "feature-service-004-02",
        "feature_key": "file_sharing",
        "is_enabled": True,
        "updated_at": "2026-01-25T16:00:00Z",
        "updated_by": "admin-user-001",
        "partitionKey": "tenant-sample-003",
    },
    {
        "id": "tenant-sample-003_feature-service-007-02",
        "type": "tenant_service_feature",
        "tenant_id": "tenant-sample-003",
        "tenantId": "tenant-sample-003",
        "service_id": "service-007",
        "feature_id": "feature-service-007-02",
        "feature_key": "cross_region_backup",
        "is_enabled": True,
        "updated_at": "2026-02-10T08:00:00Z",
        "updated_by": "admin-user-001",
        "partitionKey": "tenant-sample-003",
    },
    {
        "id": "tenant-sample-003_feature-service-007-03",
        "type": "tenant_service_feature",
        "tenant_id": "tenant-sample-003",
        "tenantId": "tenant-sample-003",
        "service_id": "service-007",
        "feature_id": "feature-service-007-03",
        "feature_key": "auto_schedule",
        "is_enabled": False,
        "updated_at": "2026-02-10T08:00:00Z",
        "updated_by": "admin-user-001",
        "partitionKey": "tenant-sample-003",
    },
]
