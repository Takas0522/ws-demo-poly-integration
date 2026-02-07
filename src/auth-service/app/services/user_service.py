"""ユーザーサービス"""
from typing import List, Optional
from datetime import datetime
import uuid
from ..models.user import User, UserRole
from ..repositories.user_repository import UserRepository
from ..repositories.role_repository import RoleRepository
from ..schemas.user import UserCreate, UserUpdate, UserResponse
from ..utils.password import hash_password


class UserService:
    """ユーザービジネスロジック"""

    def __init__(self):
        self.user_repo = UserRepository()
        self.role_repo = RoleRepository()

    async def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        """ユーザー取得（idまたはuserIdで検索）"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            # idで見つからない場合はuserIdで検索
            user = await self.user_repo.get_by_user_id(user_id)
        if not user:
            return None

        return UserResponse(
            id=user.id,
            user_id=user.user_id,
            name=user.name,
            tenant_id=user.tenant_id,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
            last_login_at=user.last_login_at
        )

    async def get_all_users(self, skip: int = 0, limit: int = 100) -> List[UserResponse]:
        """ユーザー一覧取得"""
        users = await self.user_repo.get_all(skip=skip, limit=limit)

        return [
            UserResponse(
                id=user.id,
                user_id=user.user_id,
                name=user.name,
                tenant_id=user.tenant_id,
                is_active=user.is_active,
                created_at=user.created_at,
                updated_at=user.updated_at,
                last_login_at=user.last_login_at
            )
            for user in users
        ]

    async def create_user(self, user_create: UserCreate) -> UserResponse:
        """ユーザー作成"""
        # パスワードハッシュ化
        password_hash = hash_password(user_create.password)

        # ユーザーモデル作成
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            type="user",
            userId=user_create.user_id,
            name=user_create.name,
            passwordHash=password_hash,
            tenantId=user_create.tenant_id,
            isActive=True,
            createdAt=datetime.utcnow(),
            partitionKey=user_id
        )

        # 保存
        created_user = await self.user_repo.create(user)

        return UserResponse(
            id=created_user.id,
            user_id=created_user.user_id,
            name=created_user.name,
            tenant_id=created_user.tenant_id,
            is_active=created_user.is_active,
            created_at=created_user.created_at,
            updated_at=created_user.updated_at,
            last_login_at=created_user.last_login_at
        )

    async def update_user(self, user_id: str, user_update: UserUpdate) -> Optional[UserResponse]:
        """ユーザー更新"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            user = await self.user_repo.get_by_user_id(user_id)
        if not user:
            return None

        # 更新
        if user_update.name is not None:
            user.name = user_update.name
        if user_update.is_active is not None:
            user.is_active = user_update.is_active

        user.updated_at = datetime.utcnow()

        updated_user = await self.user_repo.update(user)

        return UserResponse(
            id=updated_user.id,
            user_id=updated_user.user_id,
            name=updated_user.name,
            tenant_id=updated_user.tenant_id,
            is_active=updated_user.is_active,
            created_at=updated_user.created_at,
            updated_at=updated_user.updated_at,
            last_login_at=updated_user.last_login_at
        )

    async def delete_user(self, user_id: str) -> bool:
        """ユーザー削除"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            user = await self.user_repo.get_by_user_id(user_id)
        if not user:
            return False

        return await self.user_repo.delete(user.id, user.partition_key)

    async def assign_role_to_user(
        self,
        user_id: str,
        role_id: str,
        service_id: str,
        assigned_by: str
    ) -> bool:
        """ユーザーにロール割り当て"""
        # ユーザー存在確認
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            return False

        # ロール存在確認
        role = await self.role_repo.get_by_id(role_id)
        if not role:
            return False

        # ユーザーロール作成
        user_role = UserRole(
            id=str(uuid.uuid4()),
            type="user_role",
            userId=user_id,
            roleId=role_id,
            serviceId=service_id,
            assignedAt=datetime.utcnow(),
            assignedBy=assigned_by,
            partitionKey=user_id
        )

        await self.user_repo.assign_role(user_role)
        return True
