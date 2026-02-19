# ISSUE-01-04: [データ基盤整備 4/4] `seed_database.py` 挿入処理追加

## 親Issue

[ISSUE-01: データ基盤整備](./ISSUE-01_データ基盤整備.md)

## 実施順序

**4番目**（ISSUE-01-02 および ISSUE-01-03 完了後）

## 概要

`scripts/seed_database.py` に、`ServiceFeature` および `TenantServiceFeature` のデータを CosmosDB へ挿入するロジックを追加する。  
既存の挿入処理パターンを踏襲し、`services` コンテナへの `service_feature` 投入と `tenant_services` コンテナへの `tenant_service_feature` 投入を行う。

## 変更対象ファイル

| ファイル | 変更種別 | 変更内容 |
|---|---|---|
| `scripts/seed_database.py` | 変更 | `SERVICE_FEATURES` および `SAMPLE_TENANT_SERVICE_FEATURES` の挿入処理を追加 |

## 変更内容イメージ

```python
# 追加: ServiceFeature 挿入
from seed_data.initial_data import SERVICE_FEATURES

for feature in SERVICE_FEATURES:
    container = db.get_container_client("services")
    container.upsert_item(feature)

# 追加: TenantServiceFeature 挿入
from seed_data.sample_data import SAMPLE_TENANT_SERVICE_FEATURES

for tsf in SAMPLE_TENANT_SERVICE_FEATURES:
    container = db.get_container_client("tenant_services")
    container.upsert_item(tsf)
```

> 既存の `Services`, `TenantService` 等の挿入処理は変更しない。

## 完了条件

- [ ] `seed_database.py` 実行後に CosmosDB `services` コンテナに `type: "service_feature"` ドキュメントが19件存在する
- [ ] `seed_database.py` 実行後に CosmosDB `tenant_services` コンテナに `type: "tenant_service_feature"` ドキュメントが存在する
- [ ] 既存データ（`Service`, `TenantService` 等）が正常に挿入される（既存処理への影響なし）

## 依存

- ISSUE-01-02（`SERVICE_FEATURES` インポート対象）
- ISSUE-01-03（`SAMPLE_TENANT_SERVICE_FEATURES` インポート対象）

## 参照仕様

- [05-影響範囲分析.md](../05-影響範囲分析.md) §4
