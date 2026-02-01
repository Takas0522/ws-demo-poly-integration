# テスト設計書: テナント管理サービス - コアAPI

**バージョン**: 1.0.0  
**ドキュメントID**: TEST-TENANT-001  
**作成日**: 2026-02-01  
**ステータス**: Draft

---

## 1. テスト概要

### 1.1 テスト対象

- **モジュール**: テナント管理サービス - コアAPI
- **対象ファイル**:
  - `app/models/tenant.py` - Tenantモデル
  - `app/repositories/tenant_repository.py` - TenantRepository
  - `app/services/tenant_service.py` - TenantService  
  - `app/api/tenants.py` - テナント管理API
  - `app/schemas/tenant.py` - リクエスト/レスポンススキーマ
  - `app/utils/jwt.py` - JWT認証関連ユーティリティ

### 1.2 テスト目的

1. **機能網羅性**: すべての機能要件が正しく実装されていることを検証
2. **データ整合性**: テナント名の一意性、特権テナント保護が機能することを検証
3. **セキュリティ**: テナント分離、ロールベース認可が機能することを検証
4. **エラーハンドリング**: 異常系が適切に処理されることを検証
5. **境界値**: 入力値の境界条件で正しく動作することを検証

### 1.3 テストスコープ

#### 含まれるテスト
- ✅ 単体テスト（Repository、Service、API、Model層）
- ✅ 正常系テスト
- ✅ 異常系テスト
- ✅ 境界値テスト
- ✅ セキュリティテスト（テナント分離、特権テナント保護）

#### 除外されるテスト
- ⏭ E2Eテスト（タスク20で実施）
- ⏭ パフォーマンステスト（タスク20で実施）
- ⏭ 負荷テスト（タスク20で実施）

---

## 2. テスト環境

### 2.1 必要なツール

- **pytest**: テストフレームワーク
- **pytest-asyncio**: 非同期テストサポート
- **pytest-cov**: カバレッジ測定
- **unittest.mock**: モックライブラリ

### 2.2 テストデータ

#### 正常系データ
- テナント名: `"acme"`, `"example-corp"`, `"test-tenant"`
- 表示名: `"Acme Corporation"`, `"Example Corp"`
- プラン: `"free"`, `"standard"`, `"premium"`
- 最大ユーザー数: `1`, `100`, `5000`, `10000`

#### 異常系データ
- テナント名: `""`, `"ab"` (短すぎる), `"a"*101` (長すぎる), `"test tenant"` (スペース含む)
- 表示名: `""`, `"a"*201` (長すぎる)
- プラン: `"invalid"`, `"ultra"`
- 最大ユーザー数: `0`, `-1`, `10001`

#### 特権テナント
- テナントID: `"tenant_privileged"`
- `is_privileged`: `true`

---

## 3. テストケース一覧

### 3.1 Model層テスト (test_models_tenant.py)

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 |
|----|----------|--------------|------|----------|--------|
| TC-M001 | 正常系 | Tenantモデル作成_デフォルト値 | 必須フィールドのみ | デフォルト値が設定される | 高 |
| TC-M002 | 正常系 | Tenantモデル作成_全フィールド指定 | 全フィールド | すべて正しく設定 | 高 |
| TC-M003 | 正常系 | Tenantモデル_キャメルケースエイリアス | エイリアス使用 | 正しく変換 | 高 |
| TC-M004 | 正常系 | Tenantモデル_JSON変換 | model_dump(by_alias=True) | キャメルケース出力 | 中 |
| TC-M005 | 異常系 | 必須フィールド欠如_id | idなし | ValidationError | 高 |
| TC-M006 | 異常系 | 必須フィールド欠如_tenant_id | tenant_idなし | ValidationError | 高 |
| TC-M007 | 異常系 | 必須フィールド欠如_name | nameなし | ValidationError | 高 |
| TC-M008 | 正常系 | TenantCreateRequest_正常なデータ | 有効なデータ | 作成成功 | 高 |
| TC-M009 | 異常系 | TenantCreateRequest_不正なname形式 | スペース含む | ValidationError | 高 |
| TC-M010 | 異常系 | TenantCreateRequest_不正なplan | "ultra" | ValidationError | 中 |
| TC-M011 | 境界値 | TenantCreateRequest_name最小長 | 3文字 | 成功 | 中 |
| TC-M012 | 境界値 | TenantCreateRequest_name最大長 | 100文字 | 成功 | 中 |
| TC-M013 | 境界値 | TenantCreateRequest_max_users最小 | 1 | 成功 | 中 |
| TC-M014 | 境界値 | TenantCreateRequest_max_users最大 | 10000 | 成功 | 中 |
| TC-M015 | 正常系 | TenantUpdateRequest_部分更新 | display_nameのみ | 成功 | 高 |

### 3.2 Repository層テスト (test_repositories_tenant.py)

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 |
|----|----------|--------------|------|----------|--------|
| TC-R001 | 正常系 | create_正常なテナント作成 | 有効なTenant | 作成成功 | 高 |
| TC-R002 | 異常系 | create_CosmosDBエラー時の例外処理 | エラー発生 | 例外が伝播 | 高 |
| TC-R003 | 正常系 | get_存在するテナント取得 | 存在するID | テナント返却 | 高 |
| TC-R004 | 異常系 | get_存在しないテナント取得 | 不在のID | None返却 | 高 |
| TC-R005 | 異常系 | get_不正なパーティションキー | 誤ったキー | None返却 | 中 |
| TC-R006 | 正常系 | update_テナント情報更新 | 更新データ | 更新成功 | 高 |
| TC-R007 | 異常系 | update_存在しないテナント更新 | 不在のID | ValueError | 高 |
| TC-R008 | 正常系 | delete_テナント削除 | 存在するID | 削除成功 | 高 |
| TC-R009 | 異常系 | delete_存在しないテナント削除 | 不在のID | 例外発生 | 中 |
| TC-R010 | 正常系 | find_by_name_テナント名検索成功 | 存在する名前 | テナント返却 | 高 |
| TC-R011 | 正常系 | find_by_name_存在しない名前 | 不在の名前 | None返却 | 高 |
| TC-R012 | 正常系 | find_by_name_アクティブのみフィルタ | status=active | アクティブのみ | 高 |
| TC-R013 | 正常系 | find_by_name_クロスパーティションクエリ | enable_cross_partition=true | 全テナント検索 | 高 |
| TC-R014 | 正常系 | list_all_全テナント一覧取得 | - | 全テナント返却 | 高 |
| TC-R015 | 正常系 | list_all_ステータスフィルタ | status=active | アクティブのみ | 中 |
| TC-R016 | 正常系 | list_all_ページネーション | skip=10,limit=20 | 指定範囲返却 | 高 |
| TC-R017 | 正常系 | list_by_tenant_id_単一パーティション | tenant_id | 該当テナント返却 | 高 |
| TC-R018 | 正常系 | list_by_tenant_id_空のテナント | 存在しないID | 空配列 | 中 |
| TC-R019 | 境界値 | list_all_skip境界値 | skip=0,1,10000 | 正しい範囲 | 中 |
| TC-R020 | 境界値 | list_all_limit境界値 | limit=1,100 | 正しい件数 | 中 |

### 3.3 Service層テスト (test_services_tenant.py)

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 |
|----|----------|--------------|------|----------|--------|
| TC-S001 | 正常系 | create_tenant_正常作成 | 有効なデータ | テナント作成 | 高 |
| TC-S002 | 異常系 | create_tenant_重複名エラー | 既存の名前 | ValueError | 高 |
| TC-S003 | 異常系 | create_tenant_無効なname形式 | 不正な形式 | ValueError | 高 |
| TC-S004 | 異常系 | create_tenant_無効なdisplay_name | 長すぎる | ValueError | 中 |
| TC-S005 | 異常系 | create_tenant_無効なplan | "ultra" | ValueError | 中 |
| TC-S006 | 異常系 | create_tenant_無効なmax_users | 0 | ValueError | 中 |
| TC-S007 | 正常系 | get_tenant_存在するテナント | 有効なID | テナント返却 | 高 |
| TC-S008 | 正常系 | get_tenant_存在しないテナント | 不在のID | None返却 | 高 |
| TC-S009 | 正常系 | list_tenants_特権テナント | is_privileged=true | 全テナント返却 | 高 |
| TC-S010 | 正常系 | list_tenants_一般テナント | is_privileged=false | 自テナントのみ | 高 |
| TC-S011 | 正常系 | list_tenants_ページネーション | skip,limit指定 | 指定範囲返却 | 中 |
| TC-S012 | 正常系 | list_tenants_ステータスフィルタ | status=active | アクティブのみ | 中 |
| TC-S013 | 正常系 | update_tenant_正常更新 | 有効なデータ | 更新成功 | 高 |
| TC-S014 | 異常系 | update_tenant_特権テナント保護 | is_privileged=true | ValueError | 高 |
| TC-S015 | 異常系 | update_tenant_存在しないテナント | 不在のID | ValueError | 高 |
| TC-S016 | 異常系 | update_tenant_無効なdisplay_name | 長すぎる | ValueError | 中 |
| TC-S017 | 正常系 | delete_tenant_正常削除 | user_count=0 | 削除成功 | 高 |
| TC-S018 | 異常系 | delete_tenant_特権テナント保護 | is_privileged=true | ValueError | 高 |
| TC-S019 | 異常系 | delete_tenant_ユーザー存在チェック | user_count>0 | ValueError | 高 |
| TC-S020 | 異常系 | delete_tenant_存在しないテナント | 不在のID | ValueError | 高 |
| TC-S021 | 正常系 | increment_user_count_正常動作 | 有効なID | user_count+1 | 中 |
| TC-S022 | 正常系 | decrement_user_count_正常動作 | 有効なID | user_count-1 | 中 |
| TC-S023 | 正常系 | decrement_user_count_0より小さくならない | user_count=0 | 0のまま | 中 |
| TC-S024 | 境界値 | validate_tenant_name_最小長 | 3文字 | True | 中 |
| TC-S025 | 境界値 | validate_tenant_name_最大長 | 100文字 | True | 中 |
| TC-S026 | 境界値 | validate_max_users_境界値 | 1,10000 | True | 中 |

### 3.4 API層テスト (test_api_tenants.py)

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 |
|----|----------|--------------|------|----------|--------|
| TC-A001 | 正常系 | list_tenants_特権テナントで全取得 | 特権JWT | 全テナント返却 | 高 |
| TC-A002 | 正常系 | list_tenants_一般テナントで自取得 | 一般JWT | 自テナントのみ | 高 |
| TC-A003 | 正常系 | list_tenants_ステータスフィルタ | status=active | アクティブのみ | 中 |
| TC-A004 | 正常系 | list_tenants_ページネーション | skip,limit指定 | 指定範囲返却 | 中 |
| TC-A005 | 異常系 | list_tenants_認証なし | JWTなし | 401エラー | 高 |
| TC-A006 | 正常系 | get_tenant_正常取得 | 有効なID+JWT | テナント返却 | 高 |
| TC-A007 | 異常系 | get_tenant_テナント分離違反 | 他テナントID | 403エラー | 高 |
| TC-A008 | 異常系 | get_tenant_存在しないテナント | 不在のID | 404エラー | 高 |
| TC-A009 | 正常系 | get_tenant_特権テナントは他取得可 | 特権JWT+他ID | 成功 | 高 |
| TC-A010 | 正常系 | create_tenant_正常作成 | 有効なデータ+JWT | 201 Created | 高 |
| TC-A011 | 異常系 | create_tenant_重複名エラー | 既存名 | 409 Conflict | 高 |
| TC-A012 | 異常系 | create_tenant_バリデーションエラー | 不正データ | 422 Unprocessable | 高 |
| TC-A013 | 異常系 | create_tenant_認証なし | JWTなし | 401エラー | 高 |
| TC-A014 | 正常系 | update_tenant_正常更新 | 有効なデータ+JWT | 200 OK | 高 |
| TC-A015 | 異常系 | update_tenant_特権テナント保護 | is_privileged=true | 403エラー | 高 |
| TC-A016 | 異常系 | update_tenant_存在しないテナント | 不在のID | 404エラー | 高 |
| TC-A017 | 異常系 | update_tenant_バリデーションエラー | 不正データ | 422 Unprocessable | 中 |
| TC-A018 | 正常系 | delete_tenant_正常削除 | user_count=0 | 204 No Content | 高 |
| TC-A019 | 異常系 | delete_tenant_特権テナント保護 | is_privileged=true | 403エラー | 高 |
| TC-A020 | 異常系 | delete_tenant_ユーザー存在エラー | user_count>0 | 400エラー | 高 |
| TC-A021 | 異常系 | delete_tenant_存在しないテナント | 不在のID | 404エラー | 高 |
| TC-A022 | 境界値 | list_tenants_limit最大値 | limit=100 | 100件まで返却 | 中 |
| TC-A023 | 境界値 | list_tenants_limit超過 | limit=101 | バリデーションエラー | 低 |

### 3.5 Utility層テスト (test_utils_jwt.py)

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 |
|----|----------|--------------|------|----------|--------|
| TC-U001 | 正常系 | verify_token_有効なトークン | 有効なJWT | TokenData返却 | 高 |
| TC-U002 | 異常系 | verify_token_期限切れトークン | 期限切れJWT | 401エラー | 高 |
| TC-U003 | 異常系 | verify_token_不正な署名 | 不正署名JWT | 401エラー | 高 |
| TC-U004 | 異常系 | verify_token_不正な形式 | 不正形式 | 401エラー | 高 |
| TC-U005 | 異常系 | verify_token_空トークン | 空文字列 | 401エラー | 中 |
| TC-U006 | 異常系 | verify_token_必須フィールド欠如 | user_idなし | 401エラー | 高 |
| TC-U007 | 正常系 | is_privileged_tenant_特権判定 | "tenant_privileged" | True | 高 |
| TC-U008 | 正常系 | is_privileged_tenant_一般判定 | "tenant-acme" | False | 高 |
| TC-U009 | 境界値 | is_privileged_tenant_空文字列 | "" | False | 低 |

---

## 4. モック設計

### 4.1 モック対象

#### Repository層テスト
- **`container`** (Cosmos DB Container): `MagicMock`でモック
  - `create_item()`
  - `read_item()`
  - `upsert_item()`
  - `delete_item()`
  - `query_items()`

#### Service層テスト
- **`TenantRepository`**: `MagicMock`でモック
  - すべてのメソッド: `AsyncMock`

#### API層テスト
- **`TenantService`**: `Depends`でモック
- **`get_current_user`**: 認証情報を返すモック

### 4.2 モックデータ

#### テナントデータ
```python
SAMPLE_TENANT = {
    "id": "tenant_test",
    "tenantId": "tenant_test",
    "type": "tenant",
    "name": "test",
    "displayName": "Test Tenant",
    "isPrivileged": False,
    "status": "active",
    "plan": "standard",
    "userCount": 0,
    "maxUsers": 100,
    "metadata": {},
    "createdAt": "2026-02-01T10:00:00Z",
    "updatedAt": "2026-02-01T10:00:00Z",
    "createdBy": "user_admin_001",
    "updatedBy": "user_admin_001",
}

PRIVILEGED_TENANT = {
    "id": "tenant_privileged",
    "tenantId": "tenant_privileged",
    "type": "tenant",
    "name": "privileged",
    "displayName": "管理会社",
    "isPrivileged": True,
    "status": "active",
    "plan": "privileged",
    "userCount": 5,
    "maxUsers": 50,
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
}
```

#### JWTトークンデータ
```python
PRIVILEGED_TOKEN_DATA = TokenData(
    user_id="user_admin_001",
    tenant_id="tenant_privileged",
    username="admin",
    roles=["tenant-management:全体管理者"],
)

REGULAR_TOKEN_DATA = TokenData(
    user_id="user_regular_001",
    tenant_id="tenant-acme",
    username="john.doe",
    roles=["tenant-management:閲覧者"],
)
```

---

## 5. カバレッジ目標

### 5.1 レイヤー別カバレッジ

| レイヤー | 行カバレッジ | 分岐カバレッジ | 関数カバレッジ |
|---------|-------------|---------------|---------------|
| Model層 | 100% | 95% | 100% |
| Repository層 | 80% | 75% | 90% |
| Service層 | 90% | 85% | 95% |
| API層 | 85% | 80% | 90% |
| Utility層 | 90% | 85% | 100% |
| **全体目標** | **≥ 75%** | **≥ 70%** | **≥ 80%** |

### 5.2 測定コマンド

```bash
# カバレッジ測定
pytest --cov=app --cov-report=html --cov-report=term-missing

# カバレッジ閾値チェック
pytest --cov=app --cov-fail-under=75
```

---

## 6. テスト実行計画

### 6.1 実行順序

1. **Model層テスト**: 基礎的なデータ構造の検証
2. **Utility層テスト**: JWT検証などの補助機能
3. **Repository層テスト**: データアクセス層の検証
4. **Service層テスト**: ビジネスロジックの検証
5. **API層テスト**: エンドポイントの統合検証

### 6.2 実行コマンド

```bash
# 全テスト実行
pytest

# レイヤー別実行
pytest tests/test_models_tenant.py
pytest tests/test_utils_jwt.py
pytest tests/test_repositories_tenant.py
pytest tests/test_services_tenant.py
pytest tests/test_api_tenants.py

# 詳細出力
pytest -v

# 失敗時の詳細
pytest -vv --tb=short
```

---

## 7. リスクと緩和策

| リスク | 影響度 | 緩和策 |
|-------|--------|--------|
| Cosmos DBモックの不完全性 | 中 | 非同期イテレータの適切なモック実装 |
| JWT検証の環境依存 | 中 | 固定の秘密鍵を使用 |
| タイムスタンプのテスト困難性 | 低 | フリーズタイムまたは範囲チェック |
| テナント分離のテスト不足 | 高 | 多様なシナリオでの検証 |

---

## 8. 成功基準

- ✅ 全テストケースがpass
- ✅ 行カバレッジ 75%以上
- ✅ 分岐カバレッジ 70%以上
- ✅ 異常系テストが全機能でカバーされている
- ✅ 境界値テストが実装されている
- ✅ モックが適切に実装されている

---

**ドキュメント終了**
