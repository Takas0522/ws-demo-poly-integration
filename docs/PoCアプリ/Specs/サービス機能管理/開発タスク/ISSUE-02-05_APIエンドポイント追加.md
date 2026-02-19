# ISSUE-02-05: [バックエンド実装 5/5] API エンドポイント追加 (`api/v1/services.py`)

## 親Issue

[ISSUE-02: バックエンド実装](./ISSUE-02_バックエンド実装.md)

## 実施順序

**4番目（ISSUE-02 の最終タスク）**（ISSUE-02-04 完了後）

## 概要

既存の `src/service-setting-service/app/api/v1/services.py` に3エンドポイントを追加する。  
既存エンドポイントの変更は行わない（追加のみ）。

## 変更対象ファイル

| ファイル | 変更種別 | 変更内容 |
|---|---|---|
| `src/service-setting-service/app/api/v1/services.py` | 変更（追加のみ） | 3エンドポイント追加 |

## 追加エンドポイント

### `GET /api/v1/services/{service_id}/features`

```python
@router.get("/services/{service_id}/features", response_model=ServiceFeaturesResponse)
async def get_service_features(
    service_id: str,
    current_user: dict = Depends(get_current_user),  # JWT必須
    service: ServiceFeatureService = Depends(get_service_feature_service),
):
    return await service.get_service_features(service_id)
```

### `GET /api/v1/tenants/{tenant_id}/services/{service_id}/features`

```python
@router.get(
    "/tenants/{tenant_id}/services/{service_id}/features",
    response_model=TenantServiceFeaturesResponse
)
async def get_tenant_service_features(
    tenant_id: str,
    service_id: str,
    current_user: dict = Depends(get_current_user),
    service: ServiceFeatureService = Depends(get_service_feature_service),
):
    jwt_tenant_id = current_user.get("tenant_id")
    return await service.get_tenant_service_features(tenant_id, service_id, jwt_tenant_id)
```

### `PUT /api/v1/tenants/{tenant_id}/services/{service_id}/features/{feature_id}`

```python
@router.put(
    "/tenants/{tenant_id}/services/{service_id}/features/{feature_id}",
    response_model=TenantServiceFeatureResponse
)
async def update_tenant_service_feature(
    tenant_id: str,
    service_id: str,
    feature_id: str,
    body: UpdateTenantServiceFeatureRequest,
    current_user: dict = Depends(require_role(["global_admin", "admin"])),
    service: ServiceFeatureService = Depends(get_service_feature_service),
):
    user_id = current_user.get("user_id")
    return await service.update_tenant_service_feature(
        tenant_id, service_id, feature_id, body.is_enabled, user_id
    )
```

## 認可マトリクス

| エンドポイント | 必要ロール | 追加条件 |
|---|---|---|
| GET `.../features`（サービスマスター） | 認証済みユーザー | JWT 有効 |
| GET `tenants/.../features`（テナント設定） | 認証済みユーザー | JWT `tenant_id` = パスパラメータ `tenant_id` |
| PUT `tenants/.../features/{feature_id}` | `global_admin` or `admin` | — |

## 完了条件

- [ ] 3エンドポイントが Swagger UI に表示される
- [ ] 既存エンドポイント（`get_services`, `get_service`, `get_tenant_services` 等）が変更されていない
- [ ] `GET` に JWT 認証が設定されている
- [ ] `PUT` に `global_admin` または `admin` ロールチェックが設定されている
- [ ] エラーレスポンス（401, 403, 404）が適切に返される

## 依存

- ISSUE-02-04（`ServiceFeatureService` が完成していること）

## 参照仕様

- [04-API仕様.md](../04-API仕様.md) §2
- [02-システム要件仕様.md](../02-システム要件仕様.md) §1.3 FR-04
