# ISSUE-04-01: [テスト実装 1/5] サービス層ユニットテスト (`test_service_feature_service.py`)

## 親Issue

[ISSUE-04: テスト実装・検証](./ISSUE-04_テスト実装・検証.md)

## 実施順序

**1番目**（ISSUE-02-04 完了後。ISSUE-04-02 と **並走可能**）

## 概要

`service_feature_service.py` のビジネスロジックを pytest + `unittest.mock` を使ってユニットテストする。  
CosmosDB クライアントはモック化し、ビジネスロジック単体を検証する。

## 作成対象ファイル

新規作成: `src/service-setting-service/tests/test_service_feature_service.py`

## テストケース一覧

| テスト ID | メソッド | シナリオ | 期待結果 |
|---|---|---|---|
| TC-U-01 | `get_service_features` | 正常系（3件返却） | `ServiceFeaturesResponse` が3件で返る |
| TC-U-02 | `get_service_features` | 存在しない service_id | `HTTPException(404, NOT_FOUND)` |
| TC-U-03 | `get_tenant_service_features` | テナント設定あり（カスタム設定） | 設定済み機能は `is_default=False`, `is_enabled` がカスタム値 |
| TC-U-04 | `get_tenant_service_features` | テナント設定なし（全デフォルト） | 全機能 `is_default=True`, `is_enabled=default_enabled` |
| TC-U-05 | `get_tenant_service_features` | サービス未割り当て | `HTTPException(403, SERVICE_NOT_ASSIGNED)` |
| TC-U-06 | `update_tenant_service_feature` | 正常系（新規 upsert） | CosmosDB に新規ドキュメント生成、返却値正常 |
| TC-U-07 | `update_tenant_service_feature` | 正常系（既存 upsert） | 既存ドキュメントが上書きされ `is_enabled` が変更 |
| TC-U-08 | `update_tenant_service_feature` | 存在しない feature_id | `HTTPException(404, NOT_FOUND)` |

## テスト実装方針

```python
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

@pytest.mark.asyncio
async def test_get_service_features_returns_list():
    mock_repo = AsyncMock()
    mock_repo.get_features_by_service_id.return_value = [
        # 3件の ServiceFeature モックデータ
        ...
    ]
    service = ServiceFeatureService(repo=mock_repo, service_repo=AsyncMock())
    result = await service.get_service_features("service-004")
    assert len(result.features) == 3
```

## 完了条件

- [ ] TC-U-01〜TC-U-08 が全件実装されている
- [ ] `pytest` 実行時に全件 PASS する
- [ ] CosmosDB への実際の接続は行わない（モック使用）

## 依存

- ISSUE-02-04（テスト対象の `service_feature_service.py` が存在すること）

## 参照仕様

- [06-検証計画.md](../06-検証計画.md) §3.1
