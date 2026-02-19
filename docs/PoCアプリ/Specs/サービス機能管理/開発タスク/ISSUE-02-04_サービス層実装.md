# ISSUE-02-04: [バックエンド実装 4/5] サービス層実装 (`services/service_feature_service.py`)

## 親Issue

[ISSUE-02: バックエンド実装](./ISSUE-02_バックエンド実装.md)

## 実施順序

**3番目**（ISSUE-02-02 および ISSUE-02-03 完了後）

## 概要

ビジネスロジックを担うサービス層を実装する。  
以下の3メソッドを持ち、認可制御・サービス割り当て確認・マスターとテナント設定のマージを行う。

## 作成対象ファイル

新規作成: `src/service-setting-service/app/services/service_feature_service.py`

## 実装メソッド

### `get_service_features(service_id: str) -> ServiceFeaturesResponse`

1. `service_repository.get_service(service_id)` でサービス存在確認（なければ `404 NOT_FOUND`）
2. `service_feature_repository.get_features_by_service_id(service_id)` で機能一覧取得
3. `ServiceFeaturesResponse` に変換して返す

### `get_tenant_service_features(tenant_id: str, service_id: str, jwt_tenant_id: str) -> TenantServiceFeaturesResponse`

1. **JWT テナント確認**: `jwt_tenant_id != tenant_id` なら `403 FORBIDDEN`（テナント間分離）
2. `service_feature_repository.get_tenant_service()` でサービス割り当て確認（なければ `403 SERVICE_NOT_ASSIGNED`）
3. `get_features_by_service_id()` でマスター取得
4. `get_tenant_features()` でテナント設定取得
5. マスター全件に対してテナント設定をマージ（テナント設定が存在する機能は `is_default=False`、未設定は `is_default=True` で `default_enabled` を使用）
6. `TenantServiceFeaturesResponse` に変換して返す

### `update_tenant_service_feature(tenant_id, service_id, feature_id, is_enabled, user_id) -> TenantServiceFeatureResponse`

1. サービス割り当て確認（なければ `403 SERVICE_NOT_ASSIGNED`）
2. `get_feature_by_id(feature_id, service_id)` で機能存在確認（なければ `404 NOT_FOUND`）
3. `TenantServiceFeature` ドキュメントを構築し `upsert_tenant_feature()` で保存
4. `TenantServiceFeatureResponse` に変換して返す

## マージロジック（疑似コード）

```python
tsf_map = {tsf.feature_id: tsf for tsf in tenant_features}
result = []
for feature in master_features:
    if feature.id in tsf_map:
        tsf = tsf_map[feature.id]
        result.append(TenantServiceFeatureResponse(
            is_enabled=tsf.is_enabled, is_default=False, ...
        ))
    else:
        result.append(TenantServiceFeatureResponse(
            is_enabled=feature.default_enabled, is_default=True, ...
        ))
```

## 完了条件

- [ ] 3メソッドが実装されている
- [ ] JWT `tenant_id` の検証が `get_tenant_service_features` に含まれている
- [ ] サービス未割り当て時に `403 SERVICE_NOT_ASSIGNED` が返る
- [ ] テナント設定未登録の機能にデフォルト値が返る（`is_default=True`）
- [ ] `updated_by` に呼び出し元 `user_id` が記録される

## 依存

- ISSUE-02-02（スキーマクラスをインポート）
- ISSUE-02-03（リポジトリをインポート）

## 参照仕様

- [02-システム要件仕様.md](../02-システム要件仕様.md) §1.2〜1.3
- [04-API仕様.md](../04-API仕様.md) §2.3 シーケンス図
