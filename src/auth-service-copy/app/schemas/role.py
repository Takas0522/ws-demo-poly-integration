"""ロール関連スキーマ"""
from pydantic import BaseModel, Field
from typing import List
from datetime import datetime


class RoleResponse(BaseModel):
    """ロールレスポンス"""
    id: str
    service_id: str
    service_name: str
    role_code: str
    role_name: str
    description: str
    permissions: List[str]


class RoleListResponse(BaseModel):
    """ロール一覧レスポンス"""
    roles: List[RoleResponse]
    total: int


class UserRoleAssignRequest(BaseModel):
    """ユーザーロール割り当てリクエスト"""
    user_id: str = Field(..., description="ユーザーID")
    role_id: str = Field(..., description="ロールID")
    service_id: str = Field(..., description="サービスID")


class UserRoleResponse(BaseModel):
    """ユーザーロールレスポンス"""
    id: str
    user_id: str
    role_id: str
    service_id: str
    assigned_at: datetime
    assigned_by: str
