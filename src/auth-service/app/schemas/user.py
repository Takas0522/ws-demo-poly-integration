"""ユーザー関連スキーマ"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    """ユーザー作成リクエスト"""
    user_id: str = Field(..., description="ユーザーID（メールアドレス形式）")
    name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=8)
    tenant_id: str = Field(..., description="所属テナントID")


class UserUpdate(BaseModel):
    """ユーザー更新リクエスト"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None


class UserPasswordUpdate(BaseModel):
    """パスワード更新リクエスト"""
    new_password: str = Field(..., min_length=8)


class UserResponse(BaseModel):
    """ユーザーレスポンス"""
    id: str
    user_id: str
    name: str
    tenant_id: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None


class UserListResponse(BaseModel):
    """ユーザー一覧レスポンス"""
    users: list[UserResponse]
    total: int
