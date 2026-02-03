"""JWT トークン検証（認証サービスと共通）"""
from jose import jwt, JWTError
from typing import Dict, Optional
import os

# JWT設定（環境変数から取得）
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-key")
JWT_ALGORITHM = "HS256"


def verify_jwt_token(token: str) -> Optional[Dict]:
    """JWT検証"""
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None
