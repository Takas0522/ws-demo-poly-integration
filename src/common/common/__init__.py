"""
共通ライブラリパッケージ

全バックエンドサービスで共通利用する基盤機能を提供します。
"""

__version__ = "1.0.0"

from common.auth.jwt import create_access_token, decode_access_token
from common.auth.dependencies import get_current_user, require_role
from common.database.cosmos import CosmosDBClient
from common.database.repository import BaseRepository
from common.logging import setup_logging, get_logger
from common.models.base import BaseModel
from common.models.errors import ErrorResponse, ErrorDetail

__all__ = [
    "create_access_token",
    "decode_access_token",
    "get_current_user",
    "require_role",
    "CosmosDBClient",
    "BaseRepository",
    "setup_logging",
    "get_logger",
    "BaseModel",
    "ErrorResponse",
    "ErrorDetail",
]
