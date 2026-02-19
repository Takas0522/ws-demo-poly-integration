# ISSUE-04-03: [テスト実装 3/5] 統合テスト実装 (`test_api_service_features.py`)

## 親Issue

[ISSUE-04: テスト実装・検証](./ISSUE-04_テスト実装・検証.md)

## 実施順序

**2番目**（ISSUE-02-05 および ISSUE-01 完了後）

## 概要

FastAPI `TestClient` を使用して、3エンドポイントのエンドツーエンドな API テストを実装する。  
実際の CosmosDB エミュレーターに接続し、認可・エラーケースを含むシナリオを検証する。

## 作成対象ファイル

新規作成: `src/service-setting-service/tests/test_api_service_features.py`

## テストケース一覧

| テスト ID | エンドポイント | シナリオ | 期待値 |
|---|---|---|---|
| TC-I-01 | GET `.../features`（マスター） | 正常系 | 200, 機能一覧が返る |
| TC-I-02 | GET `.../features`（マスター） | 存在しない service_id | 404 |
| TC-I-03 | GET `.../features`（マスター） | JWT なし | 401 |
| TC-I-04 | GET `tenants/.../features` | 正常系（デフォルトマージ確認） | 200, `is_default: true` を含む |
| TC-I-05 | GET `tenants/.../features` | サービス未割り当て | 403 SERVICE_NOT_ASSIGNED |
| TC-I-06 | GET `tenants/.../features` | 別テナントの JWT | 403 FORBIDDEN |
| TC-I-07 | PUT `.../features/{feature_id}` | 正常系（admin ロール） | 200, `is_enabled` が更新される |
| TC-I-08 | PUT `.../features/{feature_id}` | 存在しない feature_id | 404 |
| TC-I-09 | PUT `.../features/{feature_id}` | viewer ロール | 403 FORBIDDEN |
| TC-I-10 | PUT → GET シーケンス | PUT 後に GET すると変更が反映される | 200, 変更後の値が返る |

## 実装方針

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_service_features_returns_list():
    token = create_test_jwt(role="admin", tenant_id="tenant-sample-001")
    response = client.get(
        "/api/v1/services/service-004/features",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["service_id"] == "service-004"
    assert len(data["features"]) == 3
```

## 完了条件

- [ ] TC-I-01〜TC-I-10 が全件実装されている
- [ ] CosmosDB エミュレーターへの接続を使用した実際の CRUD 検証
- [ ] `pytest` 実行時に全件 PASS する

## 依存

- ISSUE-02-05（API エンドポイントが実装済みであること）
- ISSUE-01（CosmosDB の DB・シードデータが存在すること）

## 参照仕様

- [06-検証計画.md](../06-検証計画.md) §4
- [02-システム要件仕様.md](../02-システム要件仕様.md) §2 受け入れ基準 AC-01〜AC-08
