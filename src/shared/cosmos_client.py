"""Cosmos DB接続クライアント"""
from azure.cosmos import CosmosClient, PartitionKey
from azure.cosmos.exceptions import CosmosResourceExistsError
from typing import Optional
import os


class CosmosDBClient:
    """Cosmos DB 接続クライアント"""
    
    def __init__(
        self,
        endpoint: Optional[str] = None,
        key: Optional[str] = None,
        database_name: Optional[str] = None
    ):
        self.endpoint = endpoint or os.getenv("COSMOS_DB_ENDPOINT")
        self.key = key or os.getenv("COSMOS_DB_KEY")
        self.database_name = database_name or os.getenv("COSMOS_DB_DATABASE")
        
        # SSL検証を開発環境では無効化（Emulator用）
        connection_verify = os.getenv("COSMOS_DB_CONNECTION_VERIFY", "true").lower() == "true"
        
        self.client = CosmosClient(
            self.endpoint,
            self.key,
            connection_verify=connection_verify
        )
        self.database = None
        
    def create_database(self):
        """データベース作成"""
        try:
            self.database = self.client.create_database(self.database_name)
            print(f"✓ Database '{self.database_name}' created")
        except CosmosResourceExistsError:
            self.database = self.client.get_database_client(self.database_name)
            print(f"✓ Database '{self.database_name}' already exists")
    
    def create_container(
        self,
        container_name: str,
        partition_key_path: str
    ):
        """コンテナ作成"""
        try:
            container = self.database.create_container(
                id=container_name,
                partition_key=PartitionKey(path=partition_key_path)
            )
            print(f"✓ Container '{container_name}' created")
            return container
        except CosmosResourceExistsError:
            print(f"✓ Container '{container_name}' already exists")
            return self.database.get_container_client(container_name)
    
    def get_container(self, container_name: str):
        """コンテナ取得"""
        return self.database.get_container_client(container_name)
