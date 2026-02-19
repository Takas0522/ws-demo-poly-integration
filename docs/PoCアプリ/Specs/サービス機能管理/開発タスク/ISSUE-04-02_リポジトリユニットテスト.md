# ISSUE-04-02: [テスト実装 2/5] リポジトリユニットテスト (`test_service_feature_repository.py`)

## 親Issue

[ISSUE-04: テスト実装・検証](./ISSUE-04_テスト実装・検証.md)

## 実施順序

**1番目**（ISSUE-02-03 完了後。ISSUE-04-01 と **並走可能**）

## 概要

`service_feature_repository.py` の CosmosDB クエリロジックをユニットテストする。  
非同期 CosmosDB クライアントをモック化し、クエリの正確性と upsert の ID 命名規則を検証する。

## 作成対象ファイル

新規作成: `src/service-setting-service/tests/test_service_feature_repository.py`

## テストケース一覧

| テスト ID | メソッド | 検証内容 |
|---|---|---|
| TC-U-09 | `get_features_by_service_id` | `services` コンテナに `type='service_feature' AND service_id=@serviceId` のクエリが発行される |
| TC-U-10 | `upsert_tenant_feature` | `id` が `"{tenant_id}_{feature_id}"` 形式で設定される |

## テスト実装方針

```python
@pytest.mark.asyncio
async def test_get_features_by_service_id_queries_correct_container():
    mock_client = AsyncMock()
    mock_container = AsyncMock()
    mock_client.get_container_client.return_value = mock_container
    mock_container.query_items.return_value = AsyncMock(__aiter__=...)

    repo = ServiceFeatureRepository(client=mock_client)
    await repo.get_features_by_service_id("service-004")

    call_args = mock_container.query_items.call_args
    assert "type = 'service_feature'" in call_args[0][0]
    assert "@serviceId" in call_args[0][0]

@pytest.mark.asyncio
async def test_upsert_tenant_feature_uses_compound_id():
    mock_client = AsyncMock()
    mock_container = AsyncMock()
    mock_client.get_container_client.return_value = mock_container

    tsf = TenantServiceFeature(
        tenant_id="tenant-001",
        feature_id="feature-service-004-02",
        ...
    )
    repo = ServiceFeatureRepository(client=mock_client)
    await repo.upsert_tenant_feature(tsf)

    upserted = mock_container.upsert_item.call_args[0][0]
    assert upserted["id"] == "tenant-001_feature-service-004-02"
```

## 完了条件

- [ ] TC-U-09, TC-U-10 が実装されている
- [ ] `pytest` 実行時に全件 PASS する
- [ ] 実際の CosmosDB 接続は行わない

## 依存

- ISSUE-02-03（テスト対象の `service_feature_repository.py` が存在すること）

## 参照仕様

- [06-検証計画.md](../06-検証計画.md) §3.2
