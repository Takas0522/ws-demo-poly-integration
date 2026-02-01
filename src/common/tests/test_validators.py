"""
バリデーターのテスト
"""

import pytest
from common.utils.validators import (
    validate_email,
    validate_password_strength,
    validate_tenant_id_format,
    validate_uuid
)


def test_validate_email_valid():
    """有効なメールアドレスが検証されること"""
    assert validate_email("user@example.com") is True
    assert validate_email("test.user+tag@example.co.jp") is True
    assert validate_email("user123@test-domain.com") is True


def test_validate_email_invalid():
    """無効なメールアドレスが拒否されること"""
    assert validate_email("") is False
    assert validate_email("invalid-email") is False
    assert validate_email("@example.com") is False
    assert validate_email("user@") is False
    assert validate_email("user@example") is False


def test_validate_password_strength_valid():
    """強いパスワードが検証されること"""
    assert validate_password_strength("MyP@ssw0rd123") is True
    assert validate_password_strength("Str0ng!Pass#2024") is True


def test_validate_password_strength_too_short():
    """12文字未満のパスワードが拒否されること"""
    assert validate_password_strength("Short1!") is False


def test_validate_password_strength_no_uppercase():
    """大文字を含まないパスワードが拒否されること"""
    assert validate_password_strength("myp@ssw0rd123") is False


def test_validate_password_strength_no_lowercase():
    """小文字を含まないパスワードが拒否されること"""
    assert validate_password_strength("MYP@SSW0RD123") is False


def test_validate_password_strength_no_digit():
    """数字を含まないパスワードが拒否されること"""
    assert validate_password_strength("MyP@ssword!") is False


def test_validate_password_strength_no_special():
    """特殊文字を含まないパスワードが拒否されること"""
    assert validate_password_strength("MyPassword123") is False


def test_validate_tenant_id_format_valid():
    """有効なテナントID形式が検証されること"""
    assert validate_tenant_id_format("tenant_abc123") is True
    assert validate_tenant_id_format("tenant_test_company") is True
    assert validate_tenant_id_format("tenant_123") is True


def test_validate_tenant_id_format_invalid():
    """無効なテナントID形式が拒否されること"""
    assert validate_tenant_id_format("") is False
    assert validate_tenant_id_format("abc123") is False
    assert validate_tenant_id_format("tenant_") is False
    assert validate_tenant_id_format("user_123") is False
    assert validate_tenant_id_format("tenant-abc") is False  # ハイフンは不可


def test_validate_uuid_valid():
    """有効なUUID形式が検証されること"""
    assert validate_uuid("550e8400-e29b-41d4-a716-446655440000") is True
    assert validate_uuid("6ba7b810-9dad-11d1-80b4-00c04fd430c8") is True


def test_validate_uuid_invalid():
    """無効なUUID形式が拒否されること"""
    assert validate_uuid("") is False
    assert validate_uuid("not-a-uuid") is False
    assert validate_uuid("550e8400-e29b-41d4-a716") is False  # 短い
    assert validate_uuid("550e8400-e29b-41d4-a716-446655440000-extra") is False  # 長い
    assert validate_uuid("550e8400e29b41d4a716446655440000") is False  # ハイフンなし
