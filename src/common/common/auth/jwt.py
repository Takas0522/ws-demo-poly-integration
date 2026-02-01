"""
JWT処理モジュール

JWTトークンの生成・検証機能を提供します。
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

import jwt
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# 環境変数から設定を取得（JWT_SECRET_KEYは必須）
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError(
        "JWT_SECRET_KEY environment variable must be set. "
        "Generate a secure key with: python -c 'import secrets; print(secrets.token_urlsafe(64))'"
    )
if SECRET_KEY == "development-secret-key-change-in-production":
    raise ValueError("JWT_SECRET_KEY must be changed from default value")

ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
DEFAULT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", "60"))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWTアクセストークンを生成
    
    Args:
        data: トークンに含めるデータ（user_id, tenant_id, roles等）
              - 必須フィールド: user_id, tenant_id
        expires_delta: 有効期限（デフォルト: 60分）
    
    Returns:
        str: 署名済みJWTトークン
    
    Raises:
        ValueError: dataが空、または必須フィールド(user_id, tenant_id)が欠落している場合
        jwt.JWTError: JWT署名に失敗した場合
        
    Business Value:
        - セキュアな認証トークン発行により、不正アクセスを防止
        - 有効期限管理により、トークン漏洩時の影響を最小化
    """
    if not data:
        raise ValueError("Token data cannot be empty")
    
    if "user_id" not in data or "tenant_id" not in data:
        raise ValueError("Token must include user_id and tenant_id")
    
    to_encode = data.copy()
    
    # 有効期限の設定
    now = datetime.now(datetime.UTC) if hasattr(datetime, 'UTC') else datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=DEFAULT_EXPIRATION_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": now
    })
    
    try:
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        logger.debug(
            f"JWT token created for user_id={data.get('user_id')}, "
            f"tenant_id={data.get('tenant_id')}, expires_at={expire.isoformat()}"
        )
        return encoded_jwt
    except Exception as e:
        logger.error(f"JWT encoding failed: {e}", exc_info=True)
        raise jwt.JWTError(f"Failed to create JWT token: {e}")


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    JWTトークンを検証してデコード
    
    Args:
        token: 検証するJWTトークン
    
    Returns:
        dict: デコード済みペイロード（user_id, tenant_id, roles等）
    
    Raises:
        HTTPException(401): トークンが無効、期限切れ、または署名検証失敗の場合
        ValueError: tokenが空文字列またはNoneの場合
        
    Business Value:
        - トークン検証の一元化により、セキュリティホールを防止
        - 統一されたエラーレスポンスによりクライアント実装が容易
    """
    if not token:
        raise ValueError("Token cannot be empty")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.debug(
            f"JWT token validated for user_id={payload.get('user_id')}, "
            f"tenant_id={payload.get('tenant_id')}"
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token has expired")
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        logger.warning(f"JWT validation failed: {e}")
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )
    except Exception as e:
        logger.error(f"Unexpected JWT error: {e}", exc_info=True)
        raise HTTPException(
            status_code=401,
            detail="Authentication failed"
        )
