"""ユーザーモデル"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class User(BaseModel):
    """ユーザーモデル"""
    id: str
    type: str = "user"
    user_id: str = Field(..., alias="userId")
    name: str
    password_hash: str = Field(..., alias="passwordHash")
    tenant_id: str = Field(..., alias="tenantId")
    is_active: bool = Field(True, alias="isActive")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")
    last_login_at: Optional[datetime] = Field(None, alias="lastLoginAt")
    partition_key: str = Field(..., alias="partitionKey")
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "user-uuid",
                "userId": "user@example.com",
                "name": "山田太郎",
                "tenantId": "tenant-uuid"
            }
        }


class UserRole(BaseModel):
    """ユーザーロール紐付けモデル"""
    id: str
    type: str = "user_role"
    user_id: str = Field(..., alias="userId")
    role_id: str = Field(..., alias="roleId")
    service_id: str = Field(..., alias="serviceId")
    assigned_at: datetime = Field(..., alias="assignedAt")
    assigned_by: str = Field(..., alias="assignedBy")
    partition_key: str = Field(..., alias="partitionKey")
    
    class Config:
        populate_by_name = True
