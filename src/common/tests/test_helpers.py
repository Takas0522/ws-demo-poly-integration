"""
ヘルパー関数のテスト
"""

import pytest
from common.utils.helpers import (
    generate_id,
    hash_password,
    verify_password,
    mask_sensitive_data
)


def test_generate_id():
    """プレフィックス付きIDが生成されること"""
    user_id = generate_id("user_")
    
    assert user_id.startswith("user_")
    assert len(user_id) > 6  # "user_" + UUID
    
    tenant_id = generate_id("tenant_")
    assert tenant_id.startswith("tenant_")


def test_generate_id_unique():
    """生成されるIDが一意であること"""
    id1 = generate_id("test_")
    id2 = generate_id("test_")
    
    assert id1 != id2


def test_hash_password():
    """パスワードがハッシュ化されること"""
    password = "MyP@ssw0rd123"
    hashed = hash_password(password)
    
    assert isinstance(hashed, str)
    assert len(hashed) == 60  # bcryptハッシュの長さ
    assert hashed != password  # 元のパスワードと異なる


def test_hash_password_different_hashes():
    """同じパスワードでも異なるハッシュが生成されること（ソルト）"""
    password = "MyP@ssw0rd123"
    hash1 = hash_password(password)
    hash2 = hash_password(password)
    
    assert hash1 != hash2  # ソルトにより毎回異なるハッシュ


def test_verify_password_correct():
    """正しいパスワードが検証されること"""
    password = "MyP@ssw0rd123"
    hashed = hash_password(password)
    
    assert verify_password(password, hashed) is True


def test_verify_password_incorrect():
    """誤ったパスワードが拒否されること"""
    password = "MyP@ssw0rd123"
    wrong_password = "WrongPassword"
    hashed = hash_password(password)
    
    assert verify_password(wrong_password, hashed) is False


def test_mask_sensitive_data_password():
    """パスワードがマスキングされること"""
    text = '{"username": "john", "password": "secret123"}'
    masked = mask_sensitive_data(text)
    
    assert "secret123" not in masked
    assert "***MASKED***" in masked
    assert "john" in masked  # ユーザー名は残る


def test_mask_sensitive_data_token():
    """トークンがマスキングされること"""
    text = '{"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"}'
    masked = mask_sensitive_data(text)
    
    assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in masked
    assert "***MASKED***" in masked


def test_mask_sensitive_data_api_key():
    """APIキーがマスキングされること"""
    text = '{"api_key": "sk_live_abc123xyz"}'
    masked = mask_sensitive_data(text)
    
    assert "sk_live_abc123xyz" not in masked
    assert "***MASKED***" in masked


def test_mask_sensitive_data_credit_card():
    """クレジットカード番号がマスキングされること"""
    text = "Card: 1234-5678-9012-3456"
    masked = mask_sensitive_data(text)
    
    assert "1234-5678-9012-3456" not in masked
    assert "****-****-****-****" in masked


def test_mask_sensitive_data_email():
    """メールアドレスが部分的にマスキングされること"""
    email = "john.doe@example.com"
    masked = mask_sensitive_data(email)
    
    # 最初の3文字のみ表示
    assert "@example.com" in masked
    assert "john.doe" not in masked
    assert "***" in masked


def test_mask_sensitive_data_empty():
    """空文字列が安全に処理されること"""
    assert mask_sensitive_data("") == ""
    assert mask_sensitive_data(None) is None


def test_mask_sensitive_data_authorization():
    """Authorizationヘッダーがマスキングされること"""
    text = '{"authorization": "Bearer token123"}'
    masked = mask_sensitive_data(text)
    assert "***MASKED***" in masked
    assert "Bearer token123" not in masked


def test_mask_sensitive_data_nested_json():
    """ネストされたJSONの機密情報がマスキングされること"""
    text = '{"user": {"password": "secret123", "name": "John"}}'
    masked = mask_sensitive_data(text)
    assert "***MASKED***" in masked
    assert "secret123" not in masked
    assert "John" in masked  # 非機密情報は残る


def test_mask_sensitive_data_extended_fields():
    """拡張された機密情報フィールドがマスキングされること"""
    # private_key
    text1 = '{"private_key": "-----BEGIN PRIVATE KEY-----"}'
    masked1 = mask_sensitive_data(text1)
    assert "***MASKED***" in masked1
    assert "BEGIN PRIVATE KEY" not in masked1
    
    # client_secret
    text2 = '{"client_secret": "abc123xyz"}'
    masked2 = mask_sensitive_data(text2)
    assert "***MASKED***" in masked2
    assert "abc123xyz" not in masked2
    
    # aws_secret_access_key
    text3 = '{"aws_secret_access_key": "wJalrXUtnFEMI/K7MDENG"}'
    masked3 = mask_sensitive_data(text3)
    assert "***MASKED***" in masked3
    assert "wJalrXUtnFEMI" not in masked3
    
    # connection_string
    text4 = '{"connection_string": "Server=myserver;Database=mydb;Password=pass123"}'
    masked4 = mask_sensitive_data(text4)
    assert "***MASKED***" in masked4
    
    # bearer
    text5 = '{"bearer": "token123"}'
    masked5 = mask_sensitive_data(text5)
    assert "***MASKED***" in masked5
    assert "token123" not in masked5


def test_mask_sensitive_data_multiple_fields():
    """複数の機密情報フィールドが同時にマスキングされること"""
    text = '{"password": "pass123", "api_key": "key456", "name": "John"}'
    masked = mask_sensitive_data(text)
    assert masked.count("***MASKED***") == 2
    assert "pass123" not in masked
    assert "key456" not in masked
    assert "John" in masked


def test_mask_sensitive_data_case_insensitive():
    """大文字小文字を区別せずマスキングされること"""
    text1 = '{"PASSWORD": "secret"}'
    masked1 = mask_sensitive_data(text1)
    assert "***MASKED***" in masked1
    
    text2 = '{"Password": "secret"}'
    masked2 = mask_sensitive_data(text2)
    assert "***MASKED***" in masked2

