# ISSUE-02-02: [バックエンド実装 2/5] スキーマ定義 (`schemas/service_feature.py`)

## 親Issue

[ISSUE-02: バックエンド実装](./ISSUE-02_バックエンド実装.md)

## 実施順序

**2番目**（ISSUE-02-01 完了後）

## 概要

API のリクエスト/レスポンス形状を定義する Pydantic スキーマを実装する。  
CosmosDB ドキュメントモデル（models）とは分離し、APIの入出力として適切なフィールドのみを持つ。

## 作成対象ファイル

新規作成: `src/service-setting-service/app/schemas/service_feature.py`

## 実装内容

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ServiceFeatureResponse(BaseModel):
    """サービス機能マスター APIレスポンス"""
    id: str
    service_id: str
    feature_key: str
    feature_name: str
    description: str
    default_enabled: bool
    created_at: datetime


class ServiceFeaturesResponse(BaseModel):
    """GET /services/{service_id}/features レスポンス"""
    service_id: str
    features: list[ServiceFeatureResponse]


class TenantServiceFeatureResponse(BaseModel):
    """テナント別機能設定 APIレスポンス"""
    feature_id: str
    service_id: str
    feature_key: str
    feature_name: str
    description: str
    is_enabled: bool
    is_default: bool   # True=デフォルト値, False=テナント設定値
    updated_at: Optional[datetime]
    updated_by: Optional[str]


class TenantServiceFeaturesResponse(BaseModel):
    """GET /tenants/{tid}/services/{sid}/features レスポンス"""
    tenant_id: str
    service_id: str
    features: list[TenantServiceFeatureResponse]


class UpdateTenantServiceFeatureRequest(BaseModel):
    """PUT リクエストボディ"""
    is_enabled: bool
```

## 完了条件

- [ ] `ServiceFeatureResponse`, `ServiceFeaturesResponse` が定義されている
- [ ] `TenantServiceFeatureResponse`, `TenantServiceFeaturesResponse` が定義されている
- [ ] `UpdateTenantServiceFeatureRequest` が定義されている
- [ ] `is_default` フィールドが `TenantServiceFeatureResponse` に含まれている

## 依存

- ISSUE-02-01（`ServiceFeature` / `TenantServiceFeature` モデルを参照するため）

## 参照仕様

- [04-API仕様.md](../04-API仕様.md) §2 レスポンス定義
- [03-データモデル設計.md](../03-データモデル設計.md) §4.2
