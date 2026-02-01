"""
データベースモジュール

Cosmos DB接続とCRUD操作の基盤機能を提供します。
"""

from common.database.cosmos import CosmosDBClient
from common.database.repository import BaseRepository, SecurityError

__all__ = [
    "CosmosDBClient",
    "BaseRepository",
    "SecurityError",
]
