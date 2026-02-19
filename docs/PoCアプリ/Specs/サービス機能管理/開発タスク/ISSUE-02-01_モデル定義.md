# ISSUE-02-01: [バックエンド実装 1/5] モデル定義 (`models/service_feature.py`)

## 親Issue

[ISSUE-02: バックエンド実装](./ISSUE-02_バックエンド実装.md)

## 実施順序

**1番目（ISSUE-02 内の最初のタスク）**

## 概要

`service-setting-service` に `ServiceFeature` および `TenantServiceFeature` の CosmosDB ドキュメントモデルを定義する。  
既存の `models/service.py` のパターンを踏襲して Pydantic モデルとして実装する。

## 作成対象ファイル

新規作成: `src/service-setting-service/app/models/service_feature.py`

## 実装内容

```python
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ServiceFeature(BaseModel):
    """ServiceFeature CosmosDB ドキュメントモデル"""
    id: str = Field(..., description="機能ID (feature-{service_id}-{連番})")
    type: str = Field(default="service_feature")
    service_id: str
    feature_key: str
    feature_name: str
    description: str = Field(default="")
    default_enabled: bool = Field(default=False)
    created_at: datetime
    updated_at: Optional[datetime] = None
    partitionKey: str  # = service_id

    class Config:
        populate_by_name = True


class TenantServiceFeature(BaseModel):
    """TenantServiceFeature CosmosDB ドキュメントモデル"""
    id: str = Field(..., description="{tenant_id}_{feature_id}")
    type: str = Field(default="tenant_service_feature")
    tenant_id: str
    service_id: str
    feature_id: str
    feature_key: str
    is_enabled: bool
    updated_at: datetime
    updated_by: str
    partitionKey: str  # = tenant_id

    class Config:
        populate_by_name = True
```

## 完了条件

- [ ] `ServiceFeature` クラスが定義されている
- [ ] `TenantServiceFeature` クラスが定義されている
- [ ] 全フィールドに型アノテーションが付与されている
- [ ] `partitionKey` フィールドが両モデルに存在する

## 依存

- なし（ISSUE-01 と並走可能）

## 参照仕様

- [03-データモデル設計.md](../03-データモデル設計.md) §4.1
