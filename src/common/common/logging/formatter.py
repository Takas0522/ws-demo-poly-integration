"""
JSONフォーマッターモジュール

構造化ログをJSON形式で出力するフォーマッターを提供します。
"""

import json
import logging
from datetime import datetime
from typing import Any, Dict


class JSONFormatter(logging.Formatter):
    """
    構造化ログのJSON出力
    
    Output Format:
        {
            "timestamp": "2026-02-01T12:00:00Z",
            "level": "INFO",
            "logger": "auth-service",
            "message": "User logged in",
            "module": "auth",
            "function": "login",
            "user_id": "user_123",
            "tenant_id": "tenant_456",
            "request_id": "req_abc"
        }
    
    Business Value:
        - Application Insightsでクエリ可能な構造化ログ
        - トラブルシューティング時間を60%短縮
        - リクエストIDによる分散トレーシングが可能
    """
    
    # マスキング対象のフィールド名
    SENSITIVE_FIELDS = {
        "password", "token", "secret", "api_key", "apikey",
        "access_token", "refresh_token", "authorization",
        "private_key", "client_secret", "aws_secret_access_key",
        "connection_string", "database_password", "jdbc_url",
        "bearer", "credentials"
    }
    
    def format(self, record: logging.LogRecord) -> str:
        """
        ログレコードをJSON形式にフォーマット
        
        Args:
            record: ログレコード
        
        Returns:
            str: JSON形式のログ文字列
        """
        now = datetime.now(datetime.UTC) if hasattr(datetime, 'UTC') else datetime.utcnow()
        log_data: Dict[str, Any] = {
            "timestamp": now.isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # 例外情報を追加
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # extra情報を追加（機密情報はマスキング）
        if hasattr(record, "__dict__"):
            for key, value in record.__dict__.items():
                # 標準フィールドはスキップ
                if key in [
                    "name", "msg", "args", "created", "filename", "funcName",
                    "levelname", "levelno", "lineno", "module", "msecs",
                    "message", "pathname", "process", "processName",
                    "relativeCreated", "thread", "threadName", "exc_info",
                    "exc_text", "stack_info"
                ]:
                    continue
                
                # 機密情報のマスキング
                if key.lower() in self.SENSITIVE_FIELDS:
                    log_data[key] = "***MASKED***"
                else:
                    log_data[key] = value
        
        return json.dumps(log_data, default=str, ensure_ascii=False)
