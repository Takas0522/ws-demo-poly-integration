"""
ヘルパー関数モジュール

汎用的なヘルパー関数を提供します。
"""

import re
import uuid
import bcrypt


def generate_id(prefix: str) -> str:
    """
    プレフィックス付きID生成
    
    Args:
        prefix: IDのプレフィックス（"user_", "tenant_"等）
    
    Returns:
        str: プレフィックス付きUUID
    
    Example:
        >>> generate_id("user_")
        "user_550e8400-e29b-41d4-a716-446655440000"
    
    Business Value:
        - IDの可読性向上（エンティティタイプが一目でわかる）
    """
    return f"{prefix}{uuid.uuid4()}"


def hash_password(password: str) -> str:
    """
    パスワードをbcryptでハッシュ化
    
    Args:
        password: ハッシュ化するパスワード
    
    Returns:
        str: ハッシュ化されたパスワード
    
    Security:
        - bcrypt使用（cost factor: 12）
        - レインボーテーブル攻撃に対する耐性
    
    Business Value:
        - セキュアなパスワード保存
        - ハッシュアルゴリズムの統一
    
    Example:
        >>> hashed = hash_password("MyP@ssw0rd123")
        >>> len(hashed)
        60
    """
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """
    パスワード検証
    
    Args:
        password: 検証するプレーンテキストパスワード
        hashed: ハッシュ化されたパスワード
    
    Returns:
        bool: パスワードが一致する場合True
    
    Example:
        >>> hashed = hash_password("MyP@ssw0rd123")
        >>> verify_password("MyP@ssw0rd123", hashed)
        True
        >>> verify_password("WrongPassword", hashed)
        False
    """
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def mask_sensitive_data(text: str) -> str:
    """
    ログ出力時の機密情報マスキング
    
    Masked Data:
        - password, token, api_key, secret, private_key, client_secret等のフィールド
        - クレジットカード番号
        - メールアドレス（一部）
        - ネストされたJSONにも対応
    
    Args:
        text: マスキング対象のテキスト
    
    Returns:
        str: マスキング済みテキスト
    
    Business Value:
        - ログ経由の機密情報漏洩を防止
        - OWASP A09（ログとモニタリング）への対応
    
    Example:
        >>> mask_sensitive_data('{"password": "secret123"}')
        '{"password": "***MASKED***"}'
        >>> mask_sensitive_data('{"user": {"password": "secret"}}')
        '{"user": {"password": "***MASKED***"}}'
    """
    if not text:
        return text
    
    # 機密情報フィールド名のリスト（SENSITIVE_FIELDSと同期）
    sensitive_fields = [
        "password", "token", "secret", "api_key", "apikey",
        "access_token", "refresh_token", "authorization",
        "private_key", "client_secret", "aws_secret_access_key",
        "connection_string", "database_password", "jdbc_url",
        "bearer", "credentials"
    ]
    
    # 各機密情報フィールドに対してマスキング（ネスト対応）
    for field in sensitive_fields:
        # JSONフィールドのマスキング（"field": "value" 形式）
        text = re.sub(
            rf'("{field}"\s*:\s*)"[^"]*"',
            r'\1"***MASKED***"',
            text,
            flags=re.IGNORECASE
        )
        # スネークケース形式にも対応（field_name）
        field_snake = field.replace("_", "_")
        if "_" in field or field != field.lower():
            text = re.sub(
                rf'("{field_snake}"\s*:\s*)"[^"]*"',
                r'\1"***MASKED***"',
                text,
                flags=re.IGNORECASE
            )
    
    # クレジットカード番号のマスキング
    text = re.sub(
        r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',
        '****-****-****-****',
        text
    )
    
    # メールアドレスの一部マスキング（最初の3文字のみ表示）
    text = re.sub(
        r'([a-zA-Z0-9._%+-]{1,3})[a-zA-Z0-9._%+-]*@',
        r'\1***@',
        text
    )
    
    return text
