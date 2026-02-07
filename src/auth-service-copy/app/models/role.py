"""ロールモデル"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List


class Role(BaseModel):
    """ロールモデル"""
    id: str
    type: str = "role"
    service_id: str = Field(..., alias="serviceId")
    service_name: str = Field(..., alias="serviceName")
    role_code: str = Field(..., alias="roleCode")
    role_name: str = Field(..., alias="roleName")
    description: str
    permissions: List[str]
    created_at: datetime = Field(..., alias="createdAt")
    partition_key: str = Field(..., alias="partitionKey")
    
    class Config:
        populate_by_name = True
