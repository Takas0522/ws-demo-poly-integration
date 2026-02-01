"""
ロギングモジュール

構造化ログ（JSON形式）の出力とApplication Insights統合機能を提供します。
"""

from common.logging.logger import setup_logging, get_logger
from common.logging.formatter import JSONFormatter

__all__ = [
    "setup_logging",
    "get_logger",
    "JSONFormatter",
]
