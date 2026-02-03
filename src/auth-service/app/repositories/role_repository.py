"""ロールリポジトリ"""
from azure.cosmos import CosmosClient
from typing import List, Optional
from ..models.role import Role
from ..config import get_settings

settings = get_settings()


class RoleRepository:
    """ロールデータアクセス"""
    
    def __init__(self):
        self.client = CosmosClient(
            settings.cosmos_db_endpoint,
            settings.cosmos_db_key,
            connection_verify=settings.cosmos_db_connection_verify
        )
        self.database = self.client.get_database_client(settings.cosmos_db_database)
        self.container = self.database.get_container_client("roles")
    
    async def get_by_id(self, role_id: str) -> Optional[Role]:
        """IDでロール取得"""
        query = "SELECT * FROM c WHERE c.type = 'role' AND c.id = @id"
        parameters = [{"name": "@id", "value": role_id}]
        
        items = list(self.container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=True
        ))
        
        if items:
            return Role(**items[0])
        return None
    
    async def get_all(self) -> List[Role]:
        """全ロール取得"""
        query = "SELECT * FROM c WHERE c.type = 'role'"
        
        items = list(self.container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))
        
        return [Role(**item) for item in items]
    
    async def get_by_service_id(self, service_id: str) -> List[Role]:
        """サービスIDでロール取得"""
        query = "SELECT * FROM c WHERE c.type = 'role' AND c.serviceId = @serviceId"
        parameters = [{"name": "@serviceId", "value": service_id}]
        
        items = list(self.container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=True
        ))
        
        return [Role(**item) for item in items]
