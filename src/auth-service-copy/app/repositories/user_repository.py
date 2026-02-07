"""ユーザーリポジトリ"""
from azure.cosmos import CosmosClient
from typing import Optional, List
from ..models.user import User, UserRole
from ..config import get_settings
import uuid
from datetime import datetime

settings = get_settings()


class UserRepository:
    """ユーザーデータアクセス"""

    def __init__(self):
        self.client = CosmosClient(
            settings.cosmos_db_endpoint,
            settings.cosmos_db_key,
            connection_verify=settings.cosmos_db_connection_verify,
            connection_mode="Gateway",  # エミュレーター使用時はGatewayモード
            enable_endpoint_discovery=False  # 自動エンドポイント検出を無効化
        )
        self.database = self.client.get_database_client(
            settings.cosmos_db_database)
        self.container = self.database.get_container_client("users")

    async def get_by_user_id(self, user_id: str) -> Optional[User]:
        """ユーザーIDでユーザー取得"""
        query = "SELECT * FROM c WHERE c.type = 'user' AND c.userId = @userId"
        parameters = [{"name": "@userId", "value": user_id}]

        items = list(self.container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=True
        ))

        if items:
            return User(**items[0])
        return None

    async def get_by_id(self, user_id: str) -> Optional[User]:
        """IDでユーザー取得"""
        query = "SELECT * FROM c WHERE c.type = 'user' AND c.id = @id"
        parameters = [{"name": "@id", "value": user_id}]

        items = list(self.container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=True
        ))

        if items:
            return User(**items[0])
        return None

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[User]:
        """全ユーザー取得"""
        query = "SELECT * FROM c WHERE c.type = 'user' OFFSET @skip LIMIT @limit"
        parameters = [
            {"name": "@skip", "value": skip},
            {"name": "@limit", "value": limit}
        ]

        items = list(self.container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=True
        ))

        return [User(**item) for item in items]

    async def create(self, user: User) -> User:
        """ユーザー作成"""
        user_dict = user.model_dump(by_alias=True, mode='json')
        self.container.create_item(user_dict)
        return user

    async def update(self, user: User) -> User:
        """ユーザー更新"""
        user_dict = user.model_dump(by_alias=True, mode='json')
        self.container.upsert_item(user_dict)
        return user

    async def delete(self, user_id: str, partition_key: str) -> bool:
        """ユーザー削除"""
        try:
            self.container.delete_item(user_id, partition_key=partition_key)
            return True
        except Exception:
            return False

    async def get_user_roles(self, user_id: str) -> List[UserRole]:
        """ユーザーのロール一覧取得"""
        query = "SELECT * FROM c WHERE c.type = 'user_role' AND c.userId = @userId"
        parameters = [{"name": "@userId", "value": user_id}]

        items = list(self.container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=True
        ))

        return [UserRole(**item) for item in items]

    async def assign_role(self, user_role: UserRole) -> UserRole:
        """ロール割り当て"""
        user_role_dict = user_role.model_dump(by_alias=True, mode='json')
        self.container.create_item(user_role_dict)
        return user_role

    async def remove_role(self, role_id: str, partition_key: str) -> bool:
        """ロール削除"""
        try:
            self.container.delete_item(role_id, partition_key=partition_key)
            return True
        except Exception:
            return False
