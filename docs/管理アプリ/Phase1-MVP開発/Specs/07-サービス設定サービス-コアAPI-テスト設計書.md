# テスト設計書: サービス設定サービス - コアAPI

## 1. テスト概要

### 1.1 テスト対象
サービス設定サービスのコアAPI（タスク07）

**対象モジュール**:
- Model層: Service、ServiceAssignment
- Schema層: Service関連スキーマ、ServiceAssignment関連スキーマ
- Repository層: ServiceRepository、ServiceAssignmentRepository
- Service層: ServiceService、ServiceAssignmentService
- API層: サービスカタログAPI、サービス割り当てAPI

### 1.2 テスト目的
- 仕様書に記載された全機能要件の動作確認
- ISTQBテスト技法に基づく網羅的なテストケース設計
- 正常系、異常系、境界値、エッジケースの包括的な検証
- 高品質なコード実装の保証（カバレッジ目標達成）

### 1.3 テストスコープ

**対象範囲**:
- Service、ServiceAssignmentのモデルバリデーション
- Pydanticスキーマバリデーション（特にconfig検証ロジック）
- Cosmos DBデータアクセス層（CRUD操作、クエリ）
- ビジネスロジック層（サービス割り当て、重複チェック、テナント存在確認等）
- APIエンドポイント（GET/POST/DELETE）
- エラーハンドリング（全エラーコード）
- 監査ログ記録

**対象外**:
- インフラストラクチャ（Cosmos DB、Application Insights）の動作確認
- 認証認可ミドルウェアの詳細（共通ライブラリのテスト範囲）
- フロントエンド統合テスト

## 2. テスト環境

### 2.1 必要なツール
- **テストフレームワーク**: pytest 7.0+
- **非同期テスト**: pytest-asyncio
- **カバレッジ測定**: pytest-cov
- **モックライブラリ**: unittest.mock, pytest-mock
- **HTTPクライアントテスト**: httpx（FastAPI TestClient）

### 2.2 テストデータ

#### Service テストデータ
```python
test_service_file = {
    "id": "file-service",
    "tenant_id": "_system",
    "type": "service",
    "name": "ファイル管理サービス",
    "description": "ファイルのアップロード・ダウンロード・管理",
    "version": "1.0.0",
    "base_url": "https://file-service.example.com",
    "is_active": True,
    "metadata": {"icon": "file-icon.png", "category": "storage"}
}

test_service_inactive = {
    "id": "inactive-service",
    "tenant_id": "_system",
    "type": "service",
    "name": "非アクティブサービス",
    "description": "テスト用非アクティブサービス",
    "version": "1.0.0",
    "is_active": False
}
```

#### ServiceAssignment テストデータ
```python
test_assignment = {
    "id": "assignment_tenant_acme_file-service",
    "tenant_id": "tenant_acme",
    "type": "service_assignment",
    "service_id": "file-service",
    "status": "active",
    "config": {"max_storage": "100GB"},
    "assigned_by": "user_admin_001"
}
```

### 2.3 モック対象

| モック対象 | 理由 | モックライブラリ |
|-----------|------|----------------|
| Cosmos DBコンテナ | 実際のDB不要 | unittest.mock.Mock |
| TenantClient (HTTPリクエスト) | テナント管理サービス依存排除 | unittest.mock.AsyncMock |
| Application Insights | ログ記録確認のみ | unittest.mock.Mock |
| JWT認証ミドルウェア | 認証レイヤーは共通ライブラリで検証済み | FastAPI dependency override |

## 3. テストケース一覧

### 3.1 Model層テスト

#### 3.1.1 Service Model

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 |
|----|----------|--------------|------|----------|--------|
| MT_S001 | 正常系 | 有効なServiceモデルが作成できる | 全フィールド有効 | Serviceインスタンス作成成功 | 高 |
| MT_S002 | 正常系 | デフォルト値が正しく設定される | 最小限フィールドのみ | tenant_id="_system", type="service"等がデフォルト設定 | 中 |
| MT_S003 | 異常系 | service_idが空文字列でバリデーションエラー | id="" | ValidationError | 高 |
| MT_S004 | 異常系 | service_idが不正な形式でエラー | id="File_Service" (大文字含む) | ValidationError | 高 |
| MT_S005 | 境界値 | service_idが100文字でOK | id="a"*100 | 成功 | 中 |
| MT_S006 | 境界値 | service_idが101文字でエラー | id="a"*101 | ValidationError | 中 |
| MT_S007 | 正常系 | metadataにネストオブジェクトを含められる | metadata={"icon":"x.png","nested":{"key":"val"}} | 成功 | 中 |

#### 3.1.2 ServiceAssignment Model

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 |
|----|----------|--------------|------|----------|--------|
| MT_SA001 | 正常系 | 有効なServiceAssignmentモデルが作成できる | 全フィールド有効 | ServiceAssignmentインスタンス作成成功 | 高 |
| MT_SA002 | 正常系 | configがNoneでも作成できる | config=None | 成功 | 中 |
| MT_SA003 | 異常系 | tenant_idが不正な形式でエラー | tenant_id="acme" (prefixなし) | ValidationError | 高 |
| MT_SA004 | 異常系 | service_idが不正な形式でエラー | service_id="File_Service" (大文字含む) | ValidationError | 高 |
| MT_SA005 | 異常系 | statusが不正な値でエラー | status="deleted" | ValidationError | 中 |
| MT_SA006 | 境界値 | idが255文字でOK | id="a"*255 | 成功 | 中 |
| MT_SA007 | 境界値 | idが256文字でエラー | id="a"*256 | ValidationError | 中 |

### 3.2 Schema層テスト

#### 3.2.1 ServiceAssignmentCreate Schema (config検証)

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 |
|----|----------|--------------|------|----------|--------|
| ST_SAC001 | 正常系 | 有効なconfigでバリデーション成功 | config={"key":"val"} | 成功 | 高 |
| ST_SAC002 | 正常系 | configがNoneでバリデーション成功 | config=None | 成功 | 高 |
| ST_SAC003 | 境界値 | configが10KB以内でOK | config=large_dict (10240 bytes) | 成功 | 高 |
| ST_SAC004 | 境界値 | configが10KBを超えてエラー | config=large_dict (10241 bytes) | ValidationError | 高 |
| ST_SAC005 | 境界値 | ネストレベルが5階層でOK | config=nested_dict (depth=5) | 成功 | 高 |
| ST_SAC006 | 境界値 | ネストレベルが6階層でエラー | config=nested_dict (depth=6) | ValidationError | 高 |
| ST_SAC007 | 異常系 | 制御文字を含むとエラー | config={"key":"val\x00ue"} | ValidationError | 高 |
| ST_SAC008 | 異常系 | キーが非文字列でエラー | config={1:"value"} | ValidationError | 中 |
| ST_SAC009 | 正常系 | プリミティブ型（string/number/boolean/null）が許可される | config={"str":"a","num":1,"bool":true,"null":null} | 成功 | 中 |
| ST_SAC010 | 正常系 | 配列を含むconfigが許可される | config={"arr":[1,2,3]} | 成功 | 中 |

### 3.3 Repository層テスト

#### 3.3.1 ServiceRepository

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 |
|----|----------|--------------|------|----------|--------|
| RT_SR001 | 正常系 | get_service: サービスが取得できる | service_id="file-service" | Serviceインスタンス返却 | 高 |
| RT_SR002 | 正常系 | get_service: 存在しないサービスでNone | service_id="nonexistent" | None返却 | 高 |
| RT_SR003 | 正常系 | create_service: サービスが作成できる | 有効なService | 作成成功 | 高 |
| RT_SR004 | 異常系 | create_service: 重複IDで409エラー | 既存ID | CosmosHttpResponseError(409) | 高 |
| RT_SR005 | 正常系 | list_all: is_active=Trueでアクティブのみ取得 | is_active=True | アクティブサービスのみ | 高 |
| RT_SR006 | 正常系 | list_all: is_active=Noneで全サービス取得 | is_active=None | 全サービス | 中 |
| RT_SR007 | 正常系 | find_by_name: サービス名で検索できる | name="ファイル管理サービス" | Serviceインスタンス返却 | 中 |
| RT_SR008 | 正常系 | count_active_services: アクティブ数を取得 | - | int返却 | 中 |
| RT_SR009 | 正常系 | update_service: サービスを更新できる | service_id, update_data | 更新成功 | 中 |
| RT_SR010 | 正常系 | delete_service: サービスを削除できる | service_id | 削除成功 | 中 |

#### 3.3.2 ServiceAssignmentRepository

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 |
|----|----------|--------------|------|----------|--------|
| RT_SAR001 | 正常系 | get_assignment: 割り当てが取得できる | assignment_id, tenant_id | ServiceAssignmentインスタンス返却 | 高 |
| RT_SAR002 | 正常系 | get_assignment: 存在しない割り当てでNone | assignment_id="nonexistent" | None返却 | 高 |
| RT_SAR003 | 正常系 | create_assignment: 割り当てが作成できる | 有効なServiceAssignment | 作成成功 | 高 |
| RT_SAR004 | 異常系 | create_assignment: 重複IDで409エラー | 既存ID | CosmosHttpResponseError(409) | 高 |
| RT_SAR005 | 正常系 | list_by_tenant: テナントの割り当て一覧取得 | tenant_id | ServiceAssignment配列 | 高 |
| RT_SAR006 | 正常系 | list_by_tenant: statusフィルタが動作する | tenant_id, status="active" | activeのみ返却 | 中 |
| RT_SAR007 | 正常系 | find_by_tenant_and_service: 決定的IDで検索 | tenant_id, service_id | ServiceAssignment返却 | 高 |
| RT_SAR008 | 正常系 | count_by_tenant: テナントの割り当て数取得 | tenant_id | int返却 | 中 |
| RT_SAR009 | 正常系 | list_by_service: サービス利用テナント一覧 | service_id | ServiceAssignment配列（クロスパーティション） | 低 |
| RT_SAR010 | 正常系 | delete_assignment: 割り当てを削除できる | assignment_id, tenant_id | 削除成功 | 高 |

### 3.4 Service層テスト

#### 3.4.1 ServiceService

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 |
|----|----------|--------------|------|----------|--------|
| ST_SS001 | 正常系 | get_service: サービス詳細取得 | service_id="file-service" | Serviceインスタンス返却 | 高 |
| ST_SS002 | 正常系 | get_service: 存在しないサービスでNone | service_id="nonexistent" | None返却 | 高 |
| ST_SS003 | 正常系 | list_services: is_active=Trueでアクティブのみ | is_active=True | アクティブサービス配列 | 高 |
| ST_SS004 | 正常系 | list_services: is_active=Falseで非アクティブのみ | is_active=False | 非アクティブサービス配列 | 中 |
| ST_SS005 | 正常系 | create_service: サービス作成成功 | 有効なService | Serviceインスタンス返却 | 中 |
| ST_SS006 | 異常系 | create_service: 重複IDでValueError | 既存ID | ValueError | 中 |
| ST_SS007 | 正常系 | count_active_services: アクティブ数取得 | - | int返却 | 低 |

#### 3.4.2 ServiceAssignmentService

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 |
|----|----------|--------------|------|----------|--------|
| ST_SAS001 | 正常系 | assign_service: サービス割り当て成功 | 有効なパラメータ | ServiceAssignment返却 | 高 |
| ST_SAS002 | 異常系 | assign_service: テナント不在でエラー | 存在しないtenant_id | ServiceSettingException(TENANT_002_NOT_FOUND) | 高 |
| ST_SAS003 | 異常系 | assign_service: サービス不在でエラー | 存在しないservice_id | ServiceSettingException(SERVICE_001_NOT_FOUND) | 高 |
| ST_SAS004 | 異常系 | assign_service: 非アクティブサービスでエラー | is_active=False | ServiceSettingException(SERVICE_002_INACTIVE) | 高 |
| ST_SAS005 | 異常系 | assign_service: 重複割り当てでエラー | 既存の割り当て | ServiceSettingException(ASSIGNMENT_002_DUPLICATE) | 高 |
| ST_SAS006 | 異常系 | assign_service: ID長制限超過でエラー | tenant_id(101文字) | ServiceSettingException(VALIDATION_002_ID_TOO_LONG) | 中 |
| ST_SAS007 | 異常系 | assign_service: テナントサービスタイムアウト | タイムアウト発生 | ServiceSettingException(TENANT_SERVICE_TIMEOUT) | 中 |
| ST_SAS008 | 正常系 | remove_service_assignment: 割り当て解除成功 | 有効なパラメータ | 削除成功（監査ログ記録） | 高 |
| ST_SAS009 | 異常系 | remove_service_assignment: 存在しない割り当てでエラー | 存在しないassignment | ServiceSettingException(ASSIGNMENT_001_NOT_FOUND) | 高 |
| ST_SAS010 | 正常系 | list_tenant_services: テナント利用サービス一覧取得 | tenant_id | (ServiceAssignment, Service)配列 | 高 |
| ST_SAS011 | 正常系 | list_tenant_services: Service取得失敗時も継続 | 一部Service取得失敗 | 取得成功したServiceのみ含む配列 | 高 |
| ST_SAS012 | 正常系 | list_tenant_services: Service取得タイムアウトでも継続 | タイムアウト発生 | タイムアウトしたServiceはNone、警告ログ記録 | 中 |

### 3.5 API層テスト

#### 3.5.1 サービスカタログAPI

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 |
|----|----------|--------------|------|----------|--------|
| AT_SC001 | 正常系 | GET /services: サービス一覧取得成功 | is_active=true | 200 OK, ServiceListResponse | 高 |
| AT_SC002 | 正常系 | GET /services: is_active=falseで非アクティブのみ | is_active=false | 200 OK, 非アクティブサービス配列 | 中 |
| AT_SC003 | 正常系 | GET /services/{service_id}: サービス詳細取得 | service_id="file-service" | 200 OK, ServiceResponse | 高 |
| AT_SC004 | 異常系 | GET /services/{service_id}: 存在しないサービスで404 | service_id="nonexistent" | 404 NOT FOUND, SERVICE_001_NOT_FOUND | 高 |
| AT_SC005 | 異常系 | GET /services: 認証なしで401エラー | JWT無し | 401 UNAUTHORIZED, AUTH_001_INVALID_TOKEN | 高 |

#### 3.5.2 サービス割り当てAPI

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 |
|----|----------|--------------|------|----------|--------|
| AT_SA001 | 正常系 | GET /tenants/{tenant_id}/services: 利用サービス一覧 | tenant_id | 200 OK, TenantServiceListResponse | 高 |
| AT_SA002 | 正常系 | GET /tenants/{tenant_id}/services?status=active: statusフィルタ | status="active" | 200 OK, activeのみ | 中 |
| AT_SA003 | 異常系 | GET /tenants/{tenant_id}/services?status=invalid: 無効なstatus | status="invalid" | 400 BAD REQUEST, VALIDATION_001_INVALID_INPUT | 中 |
| AT_SA004 | 正常系 | POST /tenants/{tenant_id}/services: サービス割り当て成功 | 有効なリクエストボディ | 201 CREATED, ServiceAssignmentResponse | 高 |
| AT_SA005 | 異常系 | POST /tenants/{tenant_id}/services: バリデーションエラー | 不正なservice_id | 400 BAD REQUEST, VALIDATION_001_INVALID_INPUT | 高 |
| AT_SA006 | 異常系 | POST /tenants/{tenant_id}/services: テナント不在で404 | 存在しないtenant_id | 404 NOT FOUND, TENANT_002_NOT_FOUND | 高 |
| AT_SA007 | 異常系 | POST /tenants/{tenant_id}/services: サービス不在で404 | 存在しないservice_id | 404 NOT FOUND, SERVICE_001_NOT_FOUND | 高 |
| AT_SA008 | 異常系 | POST /tenants/{tenant_id}/services: 重複割り当てで409 | 既存割り当て | 409 CONFLICT, ASSIGNMENT_002_DUPLICATE | 高 |
| AT_SA009 | 異常系 | POST /tenants/{tenant_id}/services: 非アクティブで422 | is_active=False | 422 UNPROCESSABLE ENTITY, SERVICE_002_INACTIVE | 高 |
| AT_SA010 | 正常系 | DELETE /tenants/{tenant_id}/services/{service_id}: 削除成功 | 有効なパラメータ | 204 NO CONTENT | 高 |
| AT_SA011 | 異常系 | DELETE /tenants/{tenant_id}/services/{service_id}: 存在しない割り当てで404 | 存在しないassignment | 404 NOT FOUND, ASSIGNMENT_001_NOT_FOUND | 高 |
| AT_SA012 | 異常系 | POST /tenants/{tenant_id}/services: 認証なしで401 | JWT無し | 401 UNAUTHORIZED, AUTH_001_INVALID_TOKEN | 高 |

## 4. モック設計

### 4.1 Cosmos DBコンテナモック

```python
@pytest.fixture
def mock_cosmos_container():
    """Cosmos DBコンテナモック"""
    container = Mock()
    
    # in-memoryストレージ（テスト用データベース）
    storage = {}
    
    async def mock_read_item(item_id, partition_key):
        key = f"{partition_key}:{item_id}"
        if key in storage:
            return storage[key]
        raise CosmosResourceNotFoundError(status_code=404)
    
    async def mock_create_item(body):
        key = f"{body['tenantId']}:{body['id']}"
        if key in storage:
            raise CosmosHttpResponseError(status_code=409, message="Conflict")
        storage[key] = body
        return body
    
    async def mock_upsert_item(body):
        key = f"{body['tenantId']}:{body['id']}"
        storage[key] = body
        return body
    
    async def mock_delete_item(item_id, partition_key):
        key = f"{partition_key}:{item_id}"
        if key in storage:
            del storage[key]
    
    def mock_query_items(query, parameters, partition_key=None, enable_cross_partition_query=False):
        # クエリ文字列とパラメータに基づいてストレージからフィルタリング
        async def async_generator():
            for key, item in storage.items():
                # 簡易的なフィルタリングロジック
                yield item
        return async_generator()
    
    container.read_item = mock_read_item
    container.create_item = mock_create_item
    container.upsert_item = mock_upsert_item
    container.delete_item = mock_delete_item
    container.query_items = mock_query_items
    
    return container
```

### 4.2 TenantClientモック

```python
@pytest.fixture
def mock_tenant_client():
    """TenantClientモック"""
    client = AsyncMock(spec=TenantClient)
    
    # デフォルトでテナント存在確認は成功
    client.verify_tenant_exists.return_value = True
    
    return client
```

### 4.3 依存注入オーバーライド（FastAPI TestClient）

```python
@pytest.fixture
def test_client(mock_cosmos_container, mock_tenant_client):
    """FastAPI TestClient with dependency overrides"""
    from app.main import app
    from app.dependencies import get_cosmos_container
    
    app.dependency_overrides[get_cosmos_container] = lambda: mock_cosmos_container
    
    client = TestClient(app)
    yield client
    
    # クリーンアップ
    app.dependency_overrides = {}
```

## 5. カバレッジ目標

| レイヤー | 行カバレッジ目標 | 分岐カバレッジ目標 | 重要度 |
|---------|----------------|------------------|--------|
| Model層 | 90%以上 | 80%以上 | 高 |
| Schema層 | 95%以上 | 90%以上 | 高（バリデーション重要） |
| Repository層 | 85%以上 | 75%以上 | 高 |
| Service層 | 90%以上 | 85%以上 | 高（ビジネスロジック） |
| API層 | 85%以上 | 80%以上 | 高 |
| **全体目標** | **80%以上** | **70%以上** | - |

## 6. テスト実装ガイドライン

### 6.1 テストファイル構成

```
tests/
├── conftest.py                          # 共通フィクスチャ
├── test_models/
│   ├── __init__.py
│   ├── test_service.py                  # Service Model テスト
│   └── test_service_assignment.py       # ServiceAssignment Model テスト
├── test_schemas/
│   ├── __init__.py
│   ├── test_service_schema.py           # Service Schema テスト
│   └── test_service_assignment_schema.py # ServiceAssignment Schema テスト
├── test_repositories/
│   ├── __init__.py
│   ├── test_service_repository.py       # ServiceRepository テスト
│   └── test_service_assignment_repository.py # ServiceAssignmentRepository テスト
├── test_services/
│   ├── __init__.py
│   ├── test_service_service.py          # ServiceService テスト
│   └── test_service_assignment_service.py # ServiceAssignmentService テスト
└── test_api/
    ├── __init__.py
    ├── test_services_api.py             # サービスカタログAPI テスト
    └── test_service_assignments_api.py  # サービス割り当てAPI テスト
```

### 6.2 テストメソッド命名規則

```python
class Test正常系:
    """正常系テスト"""
    
    def test_should_{期待する振る舞い}(self):
        """テストの説明"""
        pass

class Test異常系:
    """異常系テスト"""
    
    def test_should_{期待する振る舞い}_when_{異常条件}(self):
        """テストの説明"""
        pass

class Test境界値:
    """境界値テスト"""
    
    def test_should_{期待する振る舞い}_with_{境界条件}(self):
        """テストの説明"""
        pass
```

### 6.3 アサーション記述

- **明確なアサーション**: `assert actual == expected, "Expected X but got Y"`
- **複数フィールド検証**: 個別にアサート（デバッグ容易性）
- **例外検証**: `pytest.raises(ExceptionType, match="error message pattern")`

### 6.4 テストデータ管理

- フィクスチャで共通テストデータ定義
- テストごとに独立したデータを使用（相互干渉防止）
- ファクトリーパターンでテストデータ生成（柔軟性向上）

## 7. 実行方法

### 7.1 全テスト実行
```bash
pytest tests/ -v
```

### 7.2 カバレッジ付き実行
```bash
pytest tests/ --cov=app --cov-report=html --cov-report=term
```

### 7.3 特定レイヤーのみ実行
```bash
# Repository層のみ
pytest tests/test_repositories/ -v

# Service層のみ
pytest tests/test_services/ -v

# API層のみ
pytest tests/test_api/ -v
```

### 7.4 マーカーによるフィルタ実行
```bash
# 正常系のみ
pytest -m "normal" -v

# 異常系のみ
pytest -m "error" -v

# 高優先度のみ
pytest -m "priority_high" -v
```

## 8. 完了条件

- [ ] 全テストケース（合計120件以上）が実装されている
- [ ] 全テストが実行され、PASSしている
- [ ] 行カバレッジ80%以上達成
- [ ] 分岐カバレッジ70%以上達成
- [ ] 正常系、異常系、境界値のテストが含まれている
- [ ] モックが適切に設計・実装されている
- [ ] テストが独立して実行可能（順序依存なし）
- [ ] テストドキュメント（本設計書）が最新状態

---

**作成日**: 2026-02-01  
**バージョン**: 1.0.0  
**作成者**: Development Team
