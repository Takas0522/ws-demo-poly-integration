"""
ロギングモジュールのテスト
"""

import json
import logging
import pytest
from io import StringIO

from common.logging.formatter import JSONFormatter
from common.logging.logger import setup_logging, get_logger
from common.utils.helpers import mask_sensitive_data


def test_json_formatter_output():
    """JSONフォーマッターがJSON形式で出力すること"""
    # ロガー設定
    logger = logging.getLogger("test_logger")
    logger.setLevel(logging.INFO)
    
    # StringIOハンドラーを追加
    stream = StringIO()
    handler = logging.StreamHandler(stream)
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)
    
    # ログ出力
    logger.info("Test message", extra={"user_id": "user_123"})
    
    # 出力を取得
    output = stream.getvalue()
    
    # JSON形式であることを確認
    log_data = json.loads(output)
    assert log_data["level"] == "INFO"
    assert log_data["message"] == "Test message"
    assert log_data["user_id"] == "user_123"
    assert "timestamp" in log_data
    
    # クリーンアップ
    logger.removeHandler(handler)


def test_logger_context_injection():
    """リクエストコンテキストがログに自動追加されること"""
    logger = logging.getLogger("test_context_logger")
    logger.setLevel(logging.INFO)
    
    stream = StringIO()
    handler = logging.StreamHandler(stream)
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)
    
    # コンテキスト情報付きログ
    logger.info(
        "Context test",
        extra={
            "user_id": "user_123",
            "tenant_id": "tenant_456",
            "request_id": "req_abc"
        }
    )
    
    output = stream.getvalue()
    log_data = json.loads(output)
    
    assert log_data["user_id"] == "user_123"
    assert log_data["tenant_id"] == "tenant_456"
    assert log_data["request_id"] == "req_abc"
    
    logger.removeHandler(handler)


def test_setup_logging():
    """setup_loggingでロガーが正しく初期化されること"""
    logger = setup_logging("test_app", log_level="DEBUG")
    
    assert logger.name == "test_app"
    assert logger.level == logging.DEBUG


def test_get_logger():
    """get_loggerでロガーが取得できること"""
    logger = get_logger("test_module")
    
    assert logger.name == "test_module"
    assert isinstance(logger, logging.Logger)


def test_mask_sensitive_data():
    """機密情報がマスキングされること"""
    # パスワードのマスキング
    text_with_password = '{"username": "john", "password": "secret123"}'
    masked = mask_sensitive_data(text_with_password)
    assert "secret123" not in masked
    assert "***MASKED***" in masked
    
    # トークンのマスキング
    text_with_token = '{"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"}'
    masked = mask_sensitive_data(text_with_token)
    assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in masked
    assert "***MASKED***" in masked
    
    # メールアドレスの部分マスキング
    email = "john.doe@example.com"
    masked = mask_sensitive_data(email)
    assert "joh***@example.com" in masked or "john***@example.com" in masked
    
    # クレジットカード番号のマスキング
    cc = "1234-5678-9012-3456"
    masked = mask_sensitive_data(cc)
    assert "****-****-****-****" in masked


def test_json_formatter_mask_extended_fields():
    """拡張された機密情報フィールドがマスキングされること"""
    formatter = JSONFormatter()
    
    # private_key
    record1 = logging.LogRecord(
        name="test", level=logging.INFO, pathname="", lineno=0,
        msg="Test", args=(), exc_info=None
    )
    record1.private_key = "-----BEGIN PRIVATE KEY-----"
    output1 = formatter.format(record1)
    parsed1 = json.loads(output1)
    assert parsed1["private_key"] == "***MASKED***"
    
    # client_secret
    record2 = logging.LogRecord(
        name="test", level=logging.INFO, pathname="", lineno=0,
        msg="Test", args=(), exc_info=None
    )
    record2.client_secret = "abc123"
    output2 = formatter.format(record2)
    parsed2 = json.loads(output2)
    assert parsed2["client_secret"] == "***MASKED***"
    
    # connection_string
    record3 = logging.LogRecord(
        name="test", level=logging.INFO, pathname="", lineno=0,
        msg="Test", args=(), exc_info=None
    )
    record3.connection_string = "Server=myserver;Database=mydb"
    output3 = formatter.format(record3)
    parsed3 = json.loads(output3)
    assert parsed3["connection_string"] == "***MASKED***"


def test_json_formatter_multiple_masked_fields():
    """複数の機密情報フィールドが同時にマスキングされること"""
    formatter = JSONFormatter()
    
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="Processing request",
        args=(),
        exc_info=None
    )
    record.password = "pass123"
    record.api_key = "key456"
    record.user_id = "user_789"  # 非機密情報
    
    output = formatter.format(record)
    parsed = json.loads(output)
    
    assert parsed["password"] == "***MASKED***"
    assert parsed["api_key"] == "***MASKED***"
    assert parsed["user_id"] == "user_789"  # 非機密情報は残る

