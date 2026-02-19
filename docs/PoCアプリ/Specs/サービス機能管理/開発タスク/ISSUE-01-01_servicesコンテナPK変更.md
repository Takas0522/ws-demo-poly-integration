# ISSUE-01-01: [データ基盤整備 1/4] `services` コンテナ パーティションキー変更

## 親Issue

[ISSUE-01: データ基盤整備](./ISSUE-01_データ基盤整備.md)

## 実施順序

**1番目（ISSUE-01 内の最初のタスク）**

## 概要

CosmosDB の `services` コンテナはパーティションキーが `/id` で作成されているが、`ServiceFeature` を同コンテナに格納するためには `/partitionKey` への変更が必要。  
Azure Cosmos DB ではパーティションキーの後変更はできないため、コンテナの削除・再作成が必要。

## 変更対象ファイル

| ファイル | 変更種別 | 変更内容 |
|---|---|---|
| `scripts/setup_database.sh` | 変更 | `services` コンテナ作成時のパーティションキーを `/id` → `/partitionKey` に変更 |
| `scripts/seed_data/initial_data.py` | 変更 | `SERVICES` リスト内の全 `Service` ドキュメントに `"partitionKey": "<id値>"` フィールドを追加 |

## 具体的な変更内容

### `setup_database.sh`

```bash
# 変更前
az cosmosdb sql container create \
  --partition-key-path "/id" \
  --name "services" ...

# 変更後
az cosmosdb sql container create \
  --partition-key-path "/partitionKey" \
  --name "services" ...
```

### `initial_data.py` — SERVICES 各ドキュメント

```python
# 変更前
{
    "id": "service-001",
    "name": "テナント管理サービス",
    ...
}
# 変更後
{
    "id": "service-001",
    "name": "テナント管理サービス",
    ...
    "partitionKey": "service-001"  # ← 追加
}
```

## 完了条件

- [ ] `setup_database.sh` の `services` コンテナ作成定義のパーティションキーが `/partitionKey` になっている
- [ ] `SERVICES` リストの全7件に `partitionKey` フィールドが追加されている
- [ ] DevContainer 再起動（または `setup_database.sh` 実行）後にエラーが発生しない

## 依存

- なし（本タスクが最初）

## 注意事項

> ⚠️ 開発環境では DevContainer 再起動で DB が自動初期化されるため、コンテナ削除・再作成は `setup_database.sh` の変更のみで対応できる。

## 参照仕様

- [03-データモデル設計.md](../03-データモデル設計.md) §2.2
