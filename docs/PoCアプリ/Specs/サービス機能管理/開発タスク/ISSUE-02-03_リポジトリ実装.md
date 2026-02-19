# ISSUE-02-03: [バックエンド実装 3/5] リポジトリ実装 (`repositories/service_feature_repository.py`)

## 親Issue

[ISSUE-02: バックエンド実装](./ISSUE-02_バックエンド実装.md)

## 実施順序

**2番目**（ISSUE-02-01 完了後、ISSUE-02-02 と **並走可能**）

## 概要

CosmosDB への非同期 CRUD 操作を担うリポジトリクラスを実装する。  
既存の `service_repository.py` のパターンを踏襲し、async Azure Cosmos Client を使用する。

## 作成対象ファイル

新規作成: `src/service-setting-service/app/repositories/service_feature_repository.py`

## 実装メソッド一覧

| メソッド | 操作先コンテナ | 説明 |
|---|---|---|
| `get_features_by_service_id(service_id)` | `services` | 指定サービスの ServiceFeature 一覧取得 |
| `get_feature_by_id(feature_id, service_id)` | `services` | 1件の ServiceFeature 取得（feature_id と service_id の一致確認） |
| `get_tenant_features(tenant_id, service_id)` | `tenant_services` | テナント別機能設定一覧取得 |
| `upsert_tenant_feature(tsf)` | `tenant_services` | TenantServiceFeature の Upsert |

## クエリパターン

```python
# get_features_by_service_id
query = """
    SELECT * FROM c
    WHERE c.type = 'service_feature'
      AND c.service_id = @serviceId
"""

# get_tenant_features
query = """
    SELECT * FROM c
    WHERE c.tenant_id = @tenantId
      AND c.service_id = @serviceId
      AND c.type = 'tenant_service_feature'
"""
```

## upsert の id 命名規則

```python
tsf.id = f"{tenant_id}_{feature_id}"
tsf.partitionKey = tenant_id
```

## 完了条件

- [ ] `get_features_by_service_id()` が正しいコンテナ・クエリで実行される
- [ ] `get_feature_by_id()` が feature_id と service_id の両方を条件にする
- [ ] `upsert_tenant_feature()` の id が命名規則に従っている
- [ ] 全メソッドが async で実装されている
- [ ] 既存の `service_repository.py` の変更なし

## 依存

- ISSUE-02-01（`ServiceFeature`, `TenantServiceFeature` モデルをインポートするため）

## 参照仕様

- [03-データモデル設計.md](../03-データモデル設計.md) §5 クエリパターン
- [05-影響範囲分析.md](../05-影響範囲分析.md) §2.1
