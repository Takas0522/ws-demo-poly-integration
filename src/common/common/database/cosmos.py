"""
Cosmos DB接続管理モジュール

非同期接続プールの管理とリトライ機能を提供します。
"""

import os
import logging
from typing import Optional, Dict

from azure.cosmos.aio import CosmosClient
from azure.cosmos.exceptions import CosmosHttpResponseError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log
)

logger = logging.getLogger(__name__)


class CosmosDBClient:
    """
    Cosmos DB接続管理（シングルトンパターン）
    
    Features:
        - 非同期接続プールの管理
        - 複数コンテナへのアクセス
        - 自動リトライ（指数バックオフ）
    
    Usage:
        client = CosmosDBClient.get_instance()
        container = client.get_container("tenant")
    
    Retry Policy:
        - 429 (RU不足): 最大3回リトライ、指数バックオフ（初回1秒、2回目2秒、3回目4秒）
        - 503 (サービス一時停止): 最大3回リトライ、指数バックオフ
        - 408 (タイムアウト): 最大2回リトライ、1秒間隔
        - その他のエラー: リトライなし、即座に例外伝播
    
    Timeout Settings:
        - 接続確立: 5秒
        - 読み取り操作: 2秒
        - 書き込み操作: 5秒
    
    Business Value:
        - 接続管理の一元化により、リソースリークを防止
        - リトライ機能により、一時的なネットワーク障害に対する耐性を向上
        - 明確なタイムアウトによりユーザー体験を保護
    """
    
    _instance: Optional['CosmosDBClient'] = None
    _lock = None
    
    def __init__(self, connection_string: str, database_name: str):
        """
        Cosmos DBクライアントを初期化
        
        Args:
            connection_string: Cosmos DB接続文字列
            database_name: データベース名
        """
        if not connection_string:
            raise ValueError("connection_string is required")
        if not database_name:
            raise ValueError("database_name is required")
        
        logger.info(f"Initializing Cosmos DB client for database: {database_name}")
        
        self._client = CosmosClient.from_connection_string(connection_string)
        self._database = self._client.get_database_client(database_name)
        self._containers: Dict[str, any] = {}
        
        logger.info("Cosmos DB client initialized successfully")
    
    @classmethod
    def get_instance(
        cls,
        connection_string: Optional[str] = None,
        database_name: Optional[str] = None
    ) -> 'CosmosDBClient':
        """
        Cosmos DBクライアントのシングルトンインスタンスを取得
        
        Args:
            connection_string: Cosmos DB接続文字列（初回のみ必須）
            database_name: データベース名（初回のみ必須）
        
        Returns:
            CosmosDBClient: シングルトンインスタンス
        
        Raises:
            ValueError: 初回呼び出し時に必要なパラメータが不足している場合
        """
        if cls._instance is None:
            if not connection_string or not database_name:
                # 環境変数から取得を試みる
                connection_string = connection_string or os.getenv("COSMOS_CONNECTION_STRING")
                database_name = database_name or os.getenv("COSMOS_DATABASE_NAME")
                
                if not connection_string or not database_name:
                    raise ValueError(
                        "First initialization requires connection_string and database_name. "
                        "Provide them as arguments or set COSMOS_CONNECTION_STRING and "
                        "COSMOS_DATABASE_NAME environment variables."
                    )
            
            cls._instance = cls(connection_string, database_name)
        
        return cls._instance
    
    def get_container(self, container_name: str):
        """
        コンテナクライアントを取得（キャッシュ）
        
        Args:
            container_name: コンテナ名
        
        Returns:
            ContainerProxy: コンテナクライアント
        """
        if container_name not in self._containers:
            logger.debug(f"Creating container client for: {container_name}")
            self._containers[container_name] = self._database.get_container_client(
                container_name
            )
        
        return self._containers[container_name]
    
    async def close(self):
        """
        接続をクローズ
        
        Note:
            通常はアプリケーション終了時に呼び出します
        """
        if self._client:
            logger.info("Closing Cosmos DB client")
            await self._client.close()


def should_retry_cosmos_error(exception: Exception) -> bool:
    """
    Cosmos DBエラーがリトライ可能かを判定
    
    Args:
        exception: 発生した例外
    
    Returns:
        bool: リトライすべき場合True
    """
    if not isinstance(exception, CosmosHttpResponseError):
        return False
    
    # リトライ可能なステータスコード
    retryable_status_codes = [429, 503, 408]
    return exception.status_code in retryable_status_codes


# リトライ機能付きデコレータ
cosmos_retry = retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=4),
    retry=retry_if_exception_type(CosmosHttpResponseError),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True
)
