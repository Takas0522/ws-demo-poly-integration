"""
ロガー設定モジュール

アプリケーション全体のロガー設定とロガー取得機能を提供します。
"""

import logging
import os
from typing import Optional

from common.logging.formatter import JSONFormatter


def setup_logging(
    app_name: str,
    log_level: str = "INFO"
) -> logging.Logger:
    """
    アプリケーション全体のロガー設定
    
    Args:
        app_name: アプリケーション名
        log_level: ログレベル（DEBUG/INFO/WARNING/ERROR/CRITICAL）
    
    Returns:
        logging.Logger: 設定済みロガー
    
    Business Value:
        - 全サービスで統一されたログ形式により、運用効率が向上
        - 環境変数でログレベル制御可能（本番ではINFO、開発ではDEBUG）
    """
    # 環境変数からログレベルを取得（オーバーライド可能）
    log_level = os.getenv("LOG_LEVEL", log_level).upper()
    
    # ログレベルの検証
    numeric_level = getattr(logging, log_level, None)
    if not isinstance(numeric_level, int):
        print(f"Invalid log level: {log_level}. Using INFO.")
        numeric_level = logging.INFO
    
    # ルートロガーの設定
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)
    
    # 既存のハンドラーをクリア
    root_logger.handlers.clear()
    
    # コンソールハンドラーの追加
    console_handler = logging.StreamHandler()
    console_handler.setLevel(numeric_level)
    
    # JSONフォーマッターの設定
    json_formatter = JSONFormatter()
    console_handler.setFormatter(json_formatter)
    
    root_logger.addHandler(console_handler)
    
    # アプリケーション固有のロガー作成
    app_logger = logging.getLogger(app_name)
    app_logger.setLevel(numeric_level)
    
    app_logger.info(
        f"Logging initialized for {app_name}",
        extra={"log_level": log_level}
    )
    
    return app_logger


def get_logger(name: str) -> logging.Logger:
    """
    モジュール別ロガー取得
    
    Usage:
        logger = get_logger(__name__)
        logger.info("Processing request", extra={"user_id": user.id})
    
    Args:
        name: ロガー名（通常は__name__を使用）
    
    Returns:
        logging.Logger: ロガーインスタンス
    
    Business Value:
        - モジュール単位でログを絞り込み可能
    """
    return logging.getLogger(name)
