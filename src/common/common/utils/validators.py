"""
バリデーターモジュール

汎用的なバリデーション関数を提供します。
"""

import re
from typing import Optional


def validate_email(email: str) -> bool:
    """
    メールアドレスのバリデーション
    
    Args:
        email: 検証するメールアドレス
    
    Returns:
        bool: 有効な場合True
    
    Example:
        >>> validate_email("user@example.com")
        True
        >>> validate_email("invalid-email")
        False
    """
    if not email:
        return False
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password_strength(password: str) -> bool:
    """
    パスワード強度のバリデーション
    
    Requirements:
        - 最小12文字
        - 大文字、小文字、数字、特殊文字を各1文字以上含む
    
    Args:
        password: 検証するパスワード
    
    Returns:
        bool: 要件を満たす場合True
    
    Business Value:
        - セキュリティポリシーの統一
        - 弱いパスワードによるアカウント侵害を防止
    
    Example:
        >>> validate_password_strength("MyP@ssw0rd123")
        True
        >>> validate_password_strength("weak")
        False
    """
    if not password:
        return False
    
    # 最小12文字
    if len(password) < 12:
        return False
    
    # 大文字を含む
    if not any(c.isupper() for c in password):
        return False
    
    # 小文字を含む
    if not any(c.islower() for c in password):
        return False
    
    # 数字を含む
    if not any(c.isdigit() for c in password):
        return False
    
    # 特殊文字を含む
    special_chars = set("!@#$%^&*()_+-=[]{}|;:,.<>?")
    if not any(c in special_chars for c in password):
        return False
    
    return True


def validate_tenant_id_format(tenant_id: str) -> bool:
    """
    テナントID形式のバリデーション
    
    Format:
        "tenant_" + 識別子（英数字とアンダースコア）
    
    Args:
        tenant_id: 検証するテナントID
    
    Returns:
        bool: 有効な場合True
    
    Example:
        >>> validate_tenant_id_format("tenant_abc123")
        True
        >>> validate_tenant_id_format("invalid")
        False
    """
    if not tenant_id:
        return False
    
    pattern = r'^tenant_[a-zA-Z0-9_]+$'
    return bool(re.match(pattern, tenant_id))


def validate_uuid(value: str) -> bool:
    """
    UUID形式のバリデーション
    
    Args:
        value: 検証するUUID文字列
    
    Returns:
        bool: 有効なUUID形式の場合True
    
    Example:
        >>> validate_uuid("550e8400-e29b-41d4-a716-446655440000")
        True
        >>> validate_uuid("not-a-uuid")
        False
    """
    if not value:
        return False
    
    pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    return bool(re.match(pattern, value, re.IGNORECASE))
