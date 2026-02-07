"""JWT トークン生成・検証"""
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Dict, Optional
from ..config import get_settings

settings = get_settings()


def create_jwt_token(payload: Dict) -> str:
    """JWT生成"""
    to_encode = payload.copy()
    expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow()
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm
    )
    return encoded_jwt


def verify_jwt_token(token: str) -> Optional[Dict]:
    """JWT検証"""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError:
        return None
