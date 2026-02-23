# 04 — バックエンドサービス層とAPIエンドポイント

## 概要

`ServiceFeatureService` を新規作成してビジネスロジック（サービス割り当て確認、マスター/テナント設定マージ、権限検証）を実装し、`api/v1/services.py` に 3 つの API エンドポイントを追加する。

## 背景・目的

仕様で定められた 3 つの API（サービス機能マスター一覧、テナント別機能設定一覧、機能有効/無効切替）を、既存の三層アーキテクチャ（router → service → repository）に準拠して実装する。

## 対象リポジトリ

- `src/service-setting-service/` — サービス層の新規作成、ルーターファイルの変更

## タスク詳細

### 実装内容

1. **`src/service-setting-service/app/services/service_feature_service.py` の新規作成**

   以下のメソッドを実装する:

   - `get_service_features(service_id: str) -> ServiceFeaturesListResponse`
     - リポジトリから ServiceFeature 一覧を取得
     - 0 件の場合は空リストを返す（サービスが存在しない場合は `HTTPException(404)` を送出するか、空リストを返すかは仕様書に従う — サービス存在確認を行い、存在しなければ 404）
   - `get_tenant_service_features(tenant_id: str, service_id: str, current_user: JWTPayload) -> TenantServiceFeaturesListResponse`
     - JWT の `tenant_id` クレームとパスパラメータの `tenant_id` の一致を検証（不一致時は `403 FORBIDDEN`）
     - テナントへのサービス割り当てを確認（未割り当てなら `403 SERVICE_NOT_ASSIGNED`）
     - ServiceFeature マスターと TenantServiceFeature のマージロジック実装
     - 03-データモデル設計.md セクション 5.3 のマージロジックに従う
   - `update_tenant_service_feature(tenant_id: str, service_id: str, feature_id: str, is_enabled: bool, current_user: JWTPayload) -> TenantServiceFeatureResponse`
     - ロール検証: `global_admin` または `admin` のみ許可（`403 FORBIDDEN`）
     - テナントへのサービス割り当て確認（`403 SERVICE_NOT_ASSIGNED`）
     - ServiceFeature の存在確認（`service_id` に紐づく `feature_id` が存在するか。なければ `404 NOT_FOUND`）
     - `TenantServiceFeature` ドキュメントを upsert（`id = "{tenant_id}_{feature_id}"`）
     - `updated_by` に JWT の `user_id` を記録
     - 更新後のデータを `TenantServiceFeatureResponse` として返却

2. **`src/service-setting-service/app/api/v1/services.py` の変更**

   既存エンドポイントの **後方** に以下 3 エンドポイントを追加する（既存エンドポイントは変更なし）:

   - `GET /services/{service_id}/features`
     - 認証: `Depends(get_current_user)`
     - `service_feature_service.get_service_features()` を呼び出し
   - `GET /tenants/{tenant_id}/services/{service_id}/features`
     - 認証: `Depends(get_current_user)`
     - `service_feature_service.get_tenant_service_features()` を呼び出し
   - `PUT /tenants/{tenant_id}/services/{service_id}/features/{feature_id}`
     - 認証: `Depends(get_current_user)`
     - `UpdateTenantServiceFeatureRequest` をリクエストボディとして受け取る
     - `service_feature_service.update_tenant_service_feature()` を呼び出し

3. **`services.py` へのインポート追加**
   - `ServiceFeatureService` のインスタンス作成（`service_feature_repository` を注入）
   - 新規スキーマのインポート追加

### 参照ドキュメント

- [04-API仕様.md](../04-API仕様.md) — セクション 2（全 API の詳細仕様、レスポンス形式、エラーレスポンス）
- [02-システム要件仕様.md](../02-システム要件仕様.md) — セクション 1.2（FR-03 テナント別機能設定管理）、セクション 1.3（FR-04 権限制御）
- [03-データモデル設計.md](../03-データモデル設計.md) — セクション 5.3（マージロジック）
- 既存コード: `src/service-setting-service/app/services/service_setting_service.py`、`src/service-setting-service/app/api/v1/services.py`

### 影響範囲

- `src/service-setting-service/app/services/service_feature_service.py` — 新規作成
- `src/service-setting-service/app/api/v1/services.py` — 3 エンドポイント追加（既存エンドポイントは変更なし）

## 完了条件（Success Criteria）

- [ ] `src/service-setting-service/app/services/service_feature_service.py` が存在し、3 つのビジネスロジックメソッドが実装されている
- [ ] `GET /api/v1/services/{service_id}/features` が正しいレスポンス構造で応答する
- [ ] `GET /api/v1/tenants/{tenant_id}/services/{service_id}/features` がマスターとテナント設定のマージ結果を返す
- [ ] `PUT /api/v1/tenants/{tenant_id}/services/{service_id}/features/{feature_id}` が正しくupsertし結果を返す
- [ ] サービス未割り当てテナントへのリクエストで 403 (`SERVICE_NOT_ASSIGNED`) が返る
- [ ] 存在しない `feature_id` への PUT で 404 が返る
- [ ] `admin` 未満のロールでの PUT で 403 (`FORBIDDEN`) が返る
- [ ] GET テナント別機能設定でJWTの `tenant_id` とパスパラメータの `tenant_id` の不一致時に 403 が返る
- [ ] 既存の 5 エンドポイント（`get_services`, `get_service`, `get_tenant_services`, `assign_service`, `unassign_service`）が引き続き正常に動作する
- [ ] ビルドエラーが発生しない

## 依存関係

- **前提タスク:** 02-バックエンドモデルとスキーマ定義、03-バックエンドリポジトリ実装
- **後続タスク:** 05-バックエンドテスト、06-BFFプロキシルート追加

## 備考

- エラーレスポンスは既存の `HTTPException` パターンに準拠する。`SERVICE_NOT_ASSIGNED` は新規エラーコードだが、`detail` フィールドへの文字列設定で実装する（API共通仕様のエラーレスポンス形式が既存コードでは簡略化されているため、既存パターンに合わせる）
- マージロジックの擬似コード:

```python
# ServiceFeature マスター取得
features = await repo.get_features_by_service_id(service_id)
# TenantServiceFeature 取得
tenant_settings = await repo.get_tenant_feature_settings(tenant_id, service_id)
tenant_map = {ts.feature_id: ts for ts in tenant_settings}

# マージ
for feature in features:
    ts = tenant_map.get(feature.id)
    yield TenantServiceFeatureResponse(
        is_enabled=ts.is_enabled if ts else feature.default_enabled,
        is_default=(ts is None),
        ...
    )
```
