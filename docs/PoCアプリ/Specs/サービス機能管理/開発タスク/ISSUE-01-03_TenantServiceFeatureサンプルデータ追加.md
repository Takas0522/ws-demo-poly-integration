# ISSUE-01-03: [データ基盤整備 3/4] `TenantServiceFeature` サンプルデータ追加 (sample_data.py)

## 親Issue

[ISSUE-01: データ基盤整備](./ISSUE-01_データ基盤整備.md)

## 実施順序

**3番目**（ISSUE-01-02 完了後）

## 概要

`scripts/seed_data/sample_data.py` に、各サンプルテナントの割り当てサービスの機能設定（`SAMPLE_TENANT_SERVICE_FEATURES`）を追加する。  
テナント設定が存在しない場合はデフォルト値が使われるため、全機能×全テナントを網羅する必要はなく、カスタム設定が必要な代表的なパターンをサンプルとして投入する。

## 変更対象ファイル

| ファイル | 変更種別 | 変更内容 |
|---|---|---|
| `scripts/seed_data/sample_data.py` | 変更 | `SAMPLE_TENANT_SERVICE_FEATURES` リスト追加 |

## データ設計方針

- 各サンプルテナント × 割り当て済みサービス × 一部機能のカスタム設定を定義
- `is_enabled` がデフォルトと異なる設定を中心に投入（デフォルト通りはレコード不要）
- 推定件数：約60件（10テナント × 各2サービス × 約3機能）

## ドキュメント形状

```python
SAMPLE_TENANT_SERVICE_FEATURES = [
    {
        "id": "tenant-sample-001_feature-service-004-02",
        "type": "tenant_service_feature",
        "tenant_id": "tenant-sample-001",
        "service_id": "service-004",
        "feature_id": "feature-service-004-02",
        "feature_key": "file_sharing",
        "is_enabled": True,   # デフォルト False → True にカスタム設定
        "updated_at": "2026-02-01T10:30:00Z",
        "updated_by": "admin-user-001",
        "partitionKey": "tenant-sample-001"
    },
    # ...
]
```

## 完了条件

- [ ] `SAMPLE_TENANT_SERVICE_FEATURES` リストが `sample_data.py` に追加されている
- [ ] 各ドキュメントに `id`（`{tenant_id}_{feature_id}` 命名）が設定されている
- [ ] `type: "tenant_service_feature"` が設定されている
- [ ] `partitionKey` が `tenant_id` と同値である

## 依存

- ISSUE-01-02（`SERVICE_FEATURES` の feature_id が確定していること）

## 参照仕様

- [03-データモデル設計.md](../03-データモデル設計.md) §1.2
- [02-システム要件仕様.md](../02-システム要件仕様.md) §4.3
