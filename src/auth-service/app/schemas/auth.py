"""認証関連スキーマ"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict


class LoginRequest(BaseModel):
    """ログインリクエスト"""
    user_id: str = Field(..., description="ユーザーID")
    password: str = Field(..., description="パスワード")


class TokenResponse(BaseModel):
    """トークンレスポンス"""
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: Dict


class TokenVerifyRequest(BaseModel):
    """トークン検証リクエスト"""
    token: str


class TokenVerifyResponse(BaseModel):
    """トークン検証レスポンス"""
    valid: bool
    payload: Optional[Dict] = None
