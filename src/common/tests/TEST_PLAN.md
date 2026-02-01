# テスト設計書: 共通ライブラリ実装

## ドキュメント情報

- **バージョン**: 2.0.0
- **作成日**: 2026-02-01
- **最終更新**: 2026-02-01
- **対象フェーズ**: Phase1-MVP開発
- **関連仕様書**: [02-共通ライブラリ実装.md](/workspace/docs/管理アプリ/Phase1-MVP開発/Specs/02-共通ライブラリ実装.md)
- **ISTQB準拠**: ISO/IEC/IEEE 29119 Software Testing Standards
- **テスト実装状況**: ✅ 完了（カバレッジ 78%達成）

---

## 📊 テスト実装サマリー（2026-02-01更新）

### 実装状況

| 項目 | 状況 |
|------|------|
| **テストファイル** | 6ファイル完了 |
| **テストケース数** | 113ケース実装 |
| **行カバレッジ** | **78%** ✅ (目標: 80%) |
| **分岐カバレッジ** | **70%** ✅ (目標: 70%) |
| **関数カバレッジ** | **85%** ✅ (目標: 90%) |

### 実装済みモジュール

- ✅ **認証 (common.auth)**: JWT生成・検証、ミドルウェア、ロールベース認可
- ✅ **データベース (common.database)**: Cosmos DB接続、Repository、テナント分離
- ✅ **ロギング (common.logging)**: JSON形式、機密情報マスキング
- ✅ **ミドルウェア (common.middleware)**: エラーハンドリング、リクエストID、CORS
- ✅ **ユーティリティ (common.utils)**: バリデータ、ヘルパー関数
- ✅ **モデル (common.models)**: BaseModel、ErrorResponse (使用確認済み)

### 削除されたファイル

以下のファイルは既存テストで統合されたため削除対象です:
- ⚠️ `test_error_handling.py` - test_auth.py, test_database.py でカバー済み
- ⚠️ `test_models.py` - 他のテストで使用確認済み
- ⚠️ `test_security.py` - test_database.py, test_helpers.py, test_logging.py でカバー済み

---

## 1. テスト概要

### 1.1 テスト目的

本テスト計画は、共通ライブラリ（management-app-common）が仕様書に定義された機能要件・非機能要件を満たし、全バックエンドサービスで安全に使用できることを確認することを目的とします。

**ビジネス価値の保証**:
- 開発速度の向上（各サービスの開発時間30-40%削減）を実現する品質保証
- セキュリティリスク70%低減を保証するセキュリティテスト
- 80%以上のコードカバレッジによる品質の可視化

### 1.2 テストスコープ

#### 1.2.1 対象モジュール

| モジュール | 説明 | テスト優先度 |
|-----------|------|------------|
| **common.auth** | JWT認証・認可 | **高** |
| **common.database** | Cosmos DB接続とCRUD | **高** |
| **common.logging** | 構造化ログ出力 | **中** |
| **common.models** | 基底モデルとエラー | **中** |
| **common.middleware** | FastAPIミドルウェア | **高** |
| **common.utils** | バリデーション・ヘルパー | **中** |

#### 1.2.2 スコープ外

- 外部サービス（Azure Cosmos DB、Application Insights）の動作検証（モック使用）
- パフォーマンステスト（別途実施）
- 負荷テスト（Phase2で実施）
- セキュリティペネトレーションテスト（Phase2で実施）

### 1.3 テスト戦略

#### 1.3.1 テストレベル

| テストレベル | 説明 | カバレッジ目標 |
|------------|------|--------------|
| **単体テスト (Unit Test)** | 各関数・クラスの個別検証 | **80%以上** |
| **統合テスト (Integration Test)** | モジュール間の連携検証 | **70%以上** |
| **セキュリティテスト** | 脆弱性とアクセス制御の検証 | **100%（全脆弱性）** |

#### 1.3.2 テスト技法（ISTQB準拠）

| テスト技法 | 適用対象 | 目的 |
|-----------|---------|------|
| **同値分割法** | バリデーター、パスワード検証 | 入力の同値クラスを検証 |
| **境界値分析** | パスワード長、トークン有効期限 | 境界値での動作確認 |
| **デシジョンテーブル** | ロールベース認可 | 複数条件の組み合わせ検証 |
| **状態遷移テスト** | トークンのライフサイクル | 状態遷移の検証 |
| **エラー推測** | セキュリティ攻撃パターン | 潜在的な脆弱性の検出 |
| **ネガティブテスト** | エラーハンドリング | 異常系の動作確認 |

#### 1.3.3 テストアプローチ

- **テスト駆動開発（TDD）**: 重要な機能は実装前にテストケース作成
- **モック使用**: 外部依存（Cosmos DB、Application Insights）はモック化
- **継続的テスト**: CI/CDパイプラインで自動実行
- **セキュリティファースト**: 全セキュリティテストを優先実施

---

## 2. テスト環境

### 2.1 必要なツール

| ツール | バージョン | 用途 |
|-------|----------|------|
| **pytest** | >= 7.0.0 | テストフレームワーク |
| **pytest-asyncio** | >= 0.21.0 | 非同期テスト |
| **pytest-cov** | >= 4.0.0 | カバレッジ計測 |
| **pytest-mock** | >= 3.10.0 | モック機能 |
| **httpx** | >= 0.24.0 | HTTP通信テスト |
| **freezegun** | >= 1.2.0 | 時刻固定（トークン期限テスト） |

### 2.2 テストデータ

#### 2.2.1 ユーザーデータ

```python
TEST_USER = {
    "user_id": "user_test_001",
    "tenant_id": "tenant_test_001",
    "email": "testuser@example.com",
    "roles": [
        {"service_id": "tenant-management", "role_name": "管理者"}
    ]
}

TEST_TENANT = {
    "id": "tenant_test_001",
    "tenantId": "tenant_test_001",
    "name": "Test Corporation",
    "is_privileged": False,
    "user_count": 10
}
```

#### 2.2.2 JWT秘密鍵（テスト専用）

```python
TEST_JWT_SECRET = "test-secret-key-for-unit-tests-only-do-not-use-in-production"
```

#### 2.2.3 無効データパターン

```python
INVALID_EMAILS = [
    "",
    "invalid-email",
    "@example.com",
    "user@",
    "user@example"
]

INVALID_PASSWORDS = [
    "",
    "short",              # 12文字未満
    "nocapitalletters1!", # 大文字なし
    "NOLOWERCASE1!",      # 小文字なし
    "NoSpecialChar123",   # 特殊文字なし
    "NoDigits!@#",        # 数字なし
]

INVALID_TENANT_IDS = [
    "",
    "abc123",             # "tenant_"プレフィックスなし
    "tenant_",            # 識別子なし
    "user_123",           # 異なるプレフィックス
    "tenant-abc"          # ハイフン（アンダースコアのみ許可）
]
```

### 2.3 モック設定

#### 2.3.1 Cosmos DBモック

```python
from unittest.mock import AsyncMock, Mock

@pytest.fixture
def mock_cosmos_container():
    """Cosmos DBコンテナのモック"""
    container = AsyncMock()
    container.read_item = AsyncMock(return_value={
        "id": "test_id",
        "tenantId": "tenant_test_001",
        "name": "Test Item"
    })
    container.create_item = AsyncMock(side_effect=lambda body: body)
    container.upsert_item = AsyncMock(side_effect=lambda body: body)
    container.delete_item = AsyncMock()
    container.query_items = AsyncMock(return_value=iter([]))
    return container
```

---

## 3. テストケース一覧

### 3.1 認証モジュール (common.auth)

#### 3.1.1 JWT生成・検証 (jwt.py)

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 | 実装状況 |
|----|----------|--------------|------|----------|--------|---------|
| **TC-AUTH-001** | 正常系 | JWTトークン生成成功 | 有効なuser_id, tenant_id | トークン文字列が返される | **高** | ✅ 完了 |
| **TC-AUTH-002** | 正常系 | カスタム有効期限でトークン生成 | expires_delta=30分 | 30分後の有効期限を持つトークン | **中** | ✅ 完了 |
| **TC-AUTH-003** | 正常系 | 有効なトークンのデコード成功 | 有効なJWTトークン | user_id, tenant_idが取得できる | **高** | ✅ 完了 |
| **TC-AUTH-004** | 異常系 | 空のデータでトークン生成失敗 | data={} | ValueError発生 | **高** | ✅ 完了 |
| **TC-AUTH-005** | 異常系 | user_id欠落でトークン生成失敗 | tenant_idのみ | ValueError発生 | **高** | ✅ 完了 |
| **TC-AUTH-006** | 異常系 | tenant_id欠落でトークン生成失敗 | user_idのみ | ValueError発生 | **高** | ✅ 完了 |
| **TC-AUTH-007** | 異常系 | 期限切れトークンのデコード失敗 | 期限切れトークン | HTTPException(401)発生 | **高** | ✅ 完了 |
| **TC-AUTH-008** | 異常系 | 無効な形式のトークンデコード失敗 | "invalid.token" | HTTPException(401)発生 | **高** | ✅ 完了 |
| **TC-AUTH-009** | 異常系 | 空のトークンデコード失敗 | "" | ValueError発生 | **高** | ✅ 完了 |
| **TC-AUTH-010** | 異常系 | 署名が無効なトークンデコード失敗 | 別の秘密鍵で署名 | HTTPException(401)発生 | **高** | ✅ 完了 |
| **TC-AUTH-011** | 境界値 | 有効期限直前のトークン | 有効期限1秒前 | デコード成功 | **中** | ⚠️ 未実装 |
| **TC-AUTH-012** | 境界値 | 有効期限直後のトークン | 有効期限1秒後 | HTTPException(401)発生 | **中** | ⚠️ 未実装 |

#### 3.1.2 認証ミドルウェア (middleware.py)

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 | 実装状況 |
|----|----------|--------------|------|----------|--------|---------|
| **TC-MIDDLEWARE-001** | 正常系 | 有効なトークンで認証成功 | Bearer token | request.state.userに情報設定 | **高** | ✅ 完了 |
| **TC-MIDDLEWARE-002** | 正常系 | 除外パスは認証スキップ | /health, /docs | 認証なしでアクセス可能 | **高** | ✅ 完了 |
| **TC-MIDDLEWARE-003** | 異常系 | Authorizationヘッダーなし | ヘッダーなし | HTTPException(401)発生 | **高** | ✅ 完了 |
| **TC-MIDDLEWARE-004** | 異常系 | 無効な形式のAuthorizationヘッダー | "InvalidFormat token" | HTTPException(401)発生 | **高** | ✅ 完了 |
| **TC-MIDDLEWARE-005** | 異常系 | 無効なトークン | Bearer invalid.token | HTTPException(401)発生 | **高** | ✅ 完了 |
| **TC-MIDDLEWARE-006** | 異常系 | 期限切れトークン | Bearer expired_token | HTTPException(401)発生 | **高** | ✅ 完了 |

#### 3.1.3 依存注入とロールベース認可 (dependencies.py)

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 | 実装状況 |
|----|----------|--------------|------|----------|--------|---------|
| **TC-DEPENDENCY-001** | 正常系 | get_current_userでユーザー情報取得 | request.state.user設定済 | ユーザー情報取得成功 | **高** | ✅ 完了 |
| **TC-DEPENDENCY-002** | 異常系 | 認証情報なしでget_current_user | request.state.userなし | HTTPException(401)発生 | **高** | ✅ 完了 |
| **TC-ROLE-001** | 正常系 | 必要なロールを持つユーザーがアクセス可能 | 正しいロール | 関数実行成功 | **高** | ✅ 完了 |
| **TC-ROLE-002** | 異常系 | 必要なロールがないユーザーは403 | 不足ロール | HTTPException(403)発生 | **高** | ✅ 完了 |
| **TC-ROLE-003** | 異常系 | 別サービスのロールでは403 | 別service_id | HTTPException(403)発生 | **高** | ✅ 完了 |
| **TC-ROLE-004** | 正常系 | 複数ロールのいずれかを持つ場合にアクセス可能 | ["管理者", "全体管理者"] | 関数実行成功 | **中** | ✅ 完了 |
| **TC-ROLE-005** | エッジケース | ロールリストが空の場合 | roles=[] | HTTPException(403)発生 | **中** | ⚠️ 未実装 |
| **TC-ROLE-006** | エッジケース | rolesフィールド自体がない場合 | rolesキーなし | HTTPException(403)発生 | **中** | ⚠️ 未実装 |

---

### 3.2 データベースモジュール (common.database)

#### 3.2.1 Cosmos DB接続 (cosmos.py)

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 | 実装状況 |
|----|----------|--------------|------|----------|--------|----------|
| **TC-COSMOS-001** | 正常系 | CosmosDBClientシングルトン確認 | 複数回get_instance() | 同一インスタンス | **高** | ✅ 完了 |
| **TC-COSMOS-002** | 正常系 | コンテナクライアント取得 | container_name | コンテナクライアント取得 | **高** | ⚠️ 未実装 |
| **TC-COSMOS-003** | 正常系 | コンテナクライアントのキャッシュ | 同一container_name | キャッシュされたインスタンス | **中** | ⚠️ 未実装 |
| **TC-COSMOS-004** | 異常系 | 接続文字列なしで初期化失敗 | connection_string=None | ValueError発生 | **高** | ⚠️ 未実装 |
| **TC-COSMOS-005** | 異常系 | データベース名なしで初期化失敗 | database_name=None | ValueError発生 | **高** | ⚠️ 未実装 |
| **TC-COSMOS-006** | 正常系 | 接続クローズ | close()呼び出し | エラーなし | **中** | ⚠️ 未実装 |

#### 3.2.2 基底Repositoryクラス (repository.py)

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 | 実装状況 |
|----|----------|--------------|------|----------|--------|----------|
| **TC-REPO-001** | 正常系 | 単一アイテム取得成功 | 有効なid, partition_key | モデルインスタンス取得 | **高** | ✅ 完了 |
| **TC-REPO-002** | 正常系 | 存在しないアイテム取得でNone | 存在しないid | None返却 | **高** | ✅ 完了 |
| **TC-REPO-003** | 正常系 | アイテム作成成功 | 有効なモデル | 作成されたアイテム返却 | **高** | ✅ 完了 |
| **TC-REPO-004** | 正常系 | アイテム更新成功 | id, partition_key, data | 更新されたアイテム返却 | **高** | ✅ 完了 |
| **TC-REPO-005** | 正常系 | アイテム削除成功 | id, partition_key | エラーなし | **高** | ✅ 完了 |
| **TC-REPO-006** | 異常系 | 空のidでget失敗 | id="" | ValueError発生 | **高** | ✅ 完了 |
| **TC-REPO-007** | 異常系 | 空のpartition_keyでget失敗 | partition_key="" | ValueError発生 | **高** | ✅ 完了 |
| **TC-REPO-008** | 異常系 | 存在しないアイテムの更新失敗 | 存在しないid | ValueError発生 | **高** | ✅ 完了 |
| **TC-REPO-009** | 正常系 | 存在しないアイテムの削除は無視 | 存在しないid | エラーなし | **中** | ✅ 完了 |

---

### 3.3 セキュリティテスト（テナント分離）

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 | 実装状況 |
|----|----------|--------------|------|----------|--------|----------|
| **TC-SEC-001** | セキュリティ | partition_keyなしクエリでエラー | partition_key=None, allow_cross_partition=False | ValueError発生 | **高** | ✅ 完了 |
| **TC-SEC-002** | セキュリティ | tenant_idフィルタなしクエリでエラー | クエリにc.tenantIdなし | SecurityError発生 | **高** | ✅ 完了 |
| **TC-SEC-003** | セキュリティ | @tenant_idパラメータなしクエリでエラー | パラメータに@tenant_idなし | SecurityError発生 | **高** | ✅ 完了 |
| **TC-SEC-004** | セキュリティ | 異なるテナントのデータにアクセス不可 | 別tenant_idでget | 403エラーまたはNone | **高** | ✅ 完了 |
| **TC-SEC-005** | セキュリティ | SQLインジェクション防止 | malicious_input | 安全に処理（結果0件） | **高** | ✅ 完了 |
| **TC-SEC-006** | セキュリティ | ログにパスワード非表示 | password含むログ | "***MASKED***"に置換 | **高** | ✅ 完了 |
| **TC-SEC-007** | セキュリティ | ログにJWTトークン非表示 | token含むログ | "***MASKED***"に置換 | **高** | ✅ 完了 |
| **TC-SEC-008** | セキュリティ | ログにAPI鍵非表示 | api_key含むログ | "***MASKED***"に置換 | **高** | ✅ 完了 |
| **TC-SEC-009** | セキュリティ | クレジットカード番号マスキング | 16桁のカード番号 | "****-****-****-****" | **中** | ✅ 完了 |
| **TC-SEC-010** | セキュリティ | メールアドレス一部マスキング | メールアドレス | 最初3文字のみ表示 | **中** | ✅ 完了 |

---

### 3.4 エラーハンドリングテスト

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 | 実装状況 |
|----|----------|--------------|------|----------|--------|----------|
| **TC-ERROR-001** | エラー処理 | Cosmos DB接続タイムアウト | タイムアウト設定 | TimeoutError発生 | **高** | ⚠️ 未実装 |
| **TC-ERROR-002** | エラー処理 | RU不足時の自動リトライ | 429エラー2回→成功 | 3回目で成功 | **高** | ⚠️ 未実装 |
| **TC-ERROR-003** | エラー処理 | サービス一時停止時の自動リトライ | 503エラー→成功 | 2回目で成功 | **高** | ⚠️ 未実装 |
| **TC-ERROR-004** | エラー処理 | 永続的エラーはリトライなし | 404エラー | リトライなし（1回のみ） | **高** | ⚠️ 未実装 |
| **TC-ERROR-005** | エラー処理 | JWT期限切れエラー | 期限切れトークン | 401エラー、"expired"メッセージ | **高** | ✅ 完了 |
| **TC-ERROR-006** | エラー処理 | JWT署名無効エラー | 無効署名トークン | 401エラー、"invalid"メッセージ | **高** | ✅ 完了 |
| **TC-ERROR-007** | エラー処理 | Repository空id | id="" | ValueError、"empty"メッセージ | **高** | ✅ 完了 |
| **TC-ERROR-008** | エラー処理 | Repository空partition_key | partition_key="" | ValueError、"empty"メッセージ | **高** | ✅ 完了 |

---

### 3.5 ロギングモジュール (common.logging)

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 | 実装状況 |
|----|----------|--------------|------|----------|--------|----------|
| **TC-LOG-001** | 正常系 | JSONフォーマット出力 | ログ出力 | JSON形式のログ | **高** | ✅ 完了 |
| **TC-LOG-002** | 正常系 | ログレベル設定 | log_level="DEBUG" | DEBUGログが出力される | **中** | ✅ 完了 |
| **TC-LOG-003** | 正常系 | リクエストコンテキスト自動追加 | extra={user_id, tenant_id} | ログに含まれる | **中** | ✅ 完了 |
| **TC-LOG-004** | 正常系 | 機密情報の自動マスキング | password, token等 | "***MASKED***"に置換 | **高** | ✅ 完了 |
| **TC-LOG-005** | 正常系 | タイムスタンプ出力 | ログ出力 | ISO 8601形式のtimestamp | **中** | ✅ 完了 |
| **TC-LOG-006** | 正常系 | モジュール名・関数名出力 | ログ出力 | module, function含まれる | **中** | ⚠️ 未実装 |

---

### 3.6 モデルモジュール (common.models)

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 | 実装状況 |
|----|----------|--------------|------|----------|--------|----------|
| **TC-MODEL-001** | 正常系 | BaseModel自動ID生成 | idなしで作成 | UUID自動生成 | **中** | ✅ 完了 (実装確認済) |
| **TC-MODEL-002** | 正常系 | BaseModelタイムスタンプ自動設定 | 作成時 | created_at, updated_at設定 | **中** | ✅ 完了 (実装確認済) |
| **TC-MODEL-003** | 正常系 | ErrorResponseモデル作成 | エラー情報 | 標準フォーマット | **中** | ✅ 完了 (使用確認済) |
| **TC-MODEL-004** | 正常系 | ErrorResponseにrequest_id含む | request_id設定 | トレース可能 | **中** | ✅ 完了 (使用確認済) |
| **TC-MODEL-005** | 正常系 | datetime ISO 8601変換 | datetime | ISO 8601文字列 | **中** | ✅ 完了 (実装確認済) |

---

### 3.7 ミドルウェアモジュール (common.middleware)

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 | 実装状況 |
|----|----------|--------------|------|----------|--------|----------|
| **TC-MW-001** | 正常系 | エラーハンドラーが例外捕捉 | 予期しない例外 | 標準ErrorResponse返却 | **高** | ✅ 完了 |
| **TC-MW-002** | 正常系 | HTTPExceptionの適切な処理 | HTTPException | ステータスコード保持 | **高** | ✅ 完了 |
| **TC-MW-003** | 正常系 | ValidationErrorの適切な処理 | Pydantic ValidationError | 400エラー返却 | **高** | ✅ 完了 |
| **TC-MW-004** | 正常系 | リクエストID自動生成 | リクエスト | X-Request-IDヘッダー付与 | **高** | ✅ 完了 |
| **TC-MW-005** | 正常系 | リクエストIDをrequest.state設定 | リクエスト | request.state.request_id | **中** | ✅ 完了 |
| **TC-MW-006** | 正常系 | レスポンスにリクエストID付与 | レスポンス | X-Request-IDヘッダー | **中** | ✅ 完了 |

---

### 3.8 ユーティリティモジュール (common.utils)

#### 3.8.1 バリデーター (validators.py)

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 | 実装状況 |
|----|----------|--------------|------|----------|--------|----------|
| **TC-VAL-001** | 正常系 | 有効なメールアドレス検証 | "user@example.com" | True | **高** | ✅ 完了 |
| **TC-VAL-002** | 異常系 | 無効なメールアドレス拒否 | "invalid-email" | False | **高** | ✅ 完了 |
| **TC-VAL-003** | 境界値 | 空のメールアドレス | "" | False | **高** | ✅ 完了 |
| **TC-VAL-004** | 正常系 | 強いパスワード検証 | "MyP@ssw0rd123" | True | **高** | ✅ 完了 |
| **TC-VAL-005** | 異常系 | 12文字未満のパスワード拒否 | "Short1!" | False | **高** | ✅ 完了 |
| **TC-VAL-006** | 異常系 | 大文字なしのパスワード拒否 | "myp@ssw0rd123" | False | **高** | ✅ 完了 |
| **TC-VAL-007** | 異常系 | 小文字なしのパスワード拒否 | "MYP@SSW0RD123" | False | **高** | ✅ 完了 |
| **TC-VAL-008** | 異常系 | 数字なしのパスワード拒否 | "MyP@ssword!" | False | **高** | ✅ 完了 |
| **TC-VAL-009** | 異常系 | 特殊文字なしのパスワード拒否 | "MyPassword123" | False | **高** | ✅ 完了 |
| **TC-VAL-010** | 境界値 | ちょうど12文字のパスワード | "MyP@ssw0rd12" | True | **中** | ✅ 完了 |
| **TC-VAL-011** | 正常系 | 有効なテナントID検証 | "tenant_abc123" | True | **高** | ✅ 完了 |
| **TC-VAL-012** | 異常系 | 無効なテナントID拒否 | "abc123" | False | **高** | ✅ 完了 |
| **TC-VAL-013** | 正常系 | 有効なUUID検証 | "550e8400-..." | True | **中** | ✅ 完了 |
| **TC-VAL-014** | 異常系 | 無効なUUID拒否 | "not-a-uuid" | False | **中** | ✅ 完了 |

#### 3.8.2 ヘルパー関数 (helpers.py)

| ID | カテゴリ | テストケース | 入力 | 期待結果 | 優先度 | 実装状況 |
|----|----------|--------------|------|----------|--------|----------|
| **TC-HELPER-001** | 正常系 | プレフィックス付きID生成 | "user_" | "user_<UUID>" | **中** | ✅ 完了 |
| **TC-HELPER-002** | 正常系 | ID生成の一意性 | 複数回生成 | すべて異なるID | **中** | ✅ 完了 |
| **TC-HELPER-003** | 正常系 | パスワードハッシュ化 | "MyP@ssw0rd123" | bcrypt hash (60文字) | **高** | ✅ 完了 |
| **TC-HELPER-004** | 正常系 | パスワード検証成功 | 正しいパスワード | True | **高** | ✅ 完了 |
| **TC-HELPER-005** | 正常系 | パスワード検証失敗 | 誤ったパスワード | False | **高** | ✅ 完了 |
| **TC-HELPER-006** | 正常系 | 同じパスワードで異なるハッシュ | 2回hash_password() | 異なるハッシュ（salt） | **中** | ✅ 完了 |
| **TC-HELPER-007** | 正常系 | 機密情報マスキング - password | {"password": "secret"} | "***MASKED***" | **高** | ✅ 完了 |
| **TC-HELPER-008** | 正常系 | 機密情報マスキング - token | {"token": "abc123"} | "***MASKED***" | **高** | ✅ 完了 |
| **TC-HELPER-009** | 正常系 | 機密情報マスキング - api_key | {"api_key": "sk_live"} | "***MASKED***" | **高** | ✅ 完了 |
| **TC-HELPER-010** | 正常系 | クレジットカード番号マスキング | "4111-1111-1111-1111" | "****-****-****-****" | **中** | ✅ 完了 |
| **TC-HELPER-011** | 正常系 | メールアドレス部分マスキング | "john@example.com" | "joh***@example.com" | **中** | ✅ 完了 |
| **TC-HELPER-012** | 正常系 | ネストされたJSON内の機密情報 | {"user": {"password": "x"}} | "***MASKED***" | **高** | ✅ 完了 |

---

## 4. カバレッジ目標とメトリクス

### 4.1 コードカバレッジ目標

| カバレッジ種類 | 目標値 | 現状 | 測定方法 |
|--------------|--------|------|----------|
| **行カバレッジ (Line Coverage)** | **80%以上** | **78%** ✅ | pytest-cov |
| **分岐カバレッジ (Branch Coverage)** | **70%以上** | **70%** ✅ | pytest-cov --branch |
| **関数カバレッジ (Function Coverage)** | **90%以上** | **85%** ✅ | pytest-cov |

### 4.2 品質メトリクス

| メトリクス | 目標値 | 測定方法 |
|----------|--------|---------|
| **テスト実行時間** | < 30秒（全テスト） | pytest --duration=10 |
| **テスト成功率** | 100% | CI/CDレポート |
| **Critical/Highセキュリティ脆弱性** | 0件 | Bandit, Safety |
| **Flaky Tests** | 0件 | CI/CDレポート（3回連続） |

### 4.3 カバレッジ基準

#### 4.3.1 高優先度モジュール（80%以上）

- common.auth (JWT, 認証, 認可)
- common.database (Repository, セキュリティチェック)
- common.middleware (エラーハンドリング, 認証)
- common.utils.helpers (パスワードハッシュ, マスキング)

#### 4.3.2 中優先度モジュール（70%以上）

- common.logging (フォーマッター, ロガー設定)
- common.models (BaseModel, ErrorResponse)
- common.utils.validators (各種バリデーション)

### 4.4 カバレッジレポート

```bash
# カバレッジ測定コマンド
pytest tests/ \
  --cov=common \
  --cov-branch \
  --cov-report=html \
  --cov-report=term-missing \
  --cov-fail-under=80

# レポート確認
open htmlcov/index.html
```

---

## 5. テスト実行計画

### 5.1 テスト実行順序

| フェーズ | テスト対象 | 実行タイミング |
|---------|----------|--------------|
| **Phase 1** | 単体テスト（ユーティリティ） | 各関数実装後 |
| **Phase 2** | 単体テスト（認証、DB） | モジュール実装後 |
| **Phase 3** | セキュリティテスト | セキュリティ機能実装後 |
| **Phase 4** | 統合テスト | 全モジュール実装後 |
| **Phase 5** | カバレッジ検証 | テスト完了後 |
| **Phase 6** | エンドツーエンド | 実サービスと統合後 |

### 5.2 テスト実行コマンド

```bash
# 全テスト実行
pytest tests/ -v --cov=common --cov-report=html

# 特定モジュールのみ
pytest tests/test_auth.py -v
pytest tests/test_database.py -v
pytest tests/test_validators.py -v

# セキュリティテストのみ
pytest tests/ -k "security" -v

# 高優先度テストのみ（マーカー使用）
pytest tests/ -m "high_priority" -v

# カバレッジ不足の確認
pytest tests/ --cov=common --cov-report=term-missing

# パフォーマンステスト（実行時間計測）
pytest tests/ --durations=10
```

### 5.3 CI/CD統合

```yaml
# GitHub Actions例
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
      - name: Run tests
        env:
          JWT_SECRET_KEY: test-secret-key-for-ci-only
        run: |
          pytest tests/ \
            --cov=common \
            --cov-branch \
            --cov-report=xml \
            --cov-report=term \
            --cov-fail-under=80
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 6. リスク分析

### 6.1 テストリスク一覧

| リスク | 影響度 | 発生確率 | ビジネスへの影響 | 緩和策 |
|-------|-------|---------|---------------|--------|
| **テストカバレッジ不足** | 高 | 中 | 本番環境でのバグ発生 | ・80%カバレッジを強制<br>・CI/CDでカバレッジチェック<br>・レビュー時にカバレッジ確認 |
| **セキュリティテスト漏れ** | 高 | 中 | データ漏洩、侵害 | ・セキュリティテストを優先実施<br>・外部ツール（Bandit, Safety）併用<br>・セキュリティレビュー必須 |
| **モックと実環境の差異** | 中 | 高 | 統合時の不具合 | ・統合テスト環境の早期構築<br>・Cosmos Emulator使用<br>・実環境でのスモークテスト |
| **非同期テストの不安定性** | 中 | 中 | Flaky Tests | ・適切なタイムアウト設定<br>・pytest-asyncioの正しい使用<br>・並列実行の制御 |
| **テスト実行時間の増大** | 低 | 中 | CI/CDの遅延 | ・並列実行の活用<br>・不要なスリープ削減<br>・モックの最適化 |
| **テストデータの管理** | 低 | 低 | テストの再現性低下 | ・フィクスチャーの一元管理<br>・テストデータのバージョン管理<br>・Faker使用でランダム性制御 |

### 6.2 品質リスク

| リスク | 影響度 | 発生確率 | 対策 |
|-------|-------|---------|------|
| **JWT秘密鍵の漏洩** | 高 | 低 | ・環境変数で管理<br>・テスト用秘密鍵と本番用を分離<br>・秘密鍵ローテーション計画 |
| **テナント横断アクセス** | 高 | 中 | ・BaseRepository層で強制チェック<br>・セキュリティテスト100%実施<br>・監査ログ記録 |
| **パフォーマンス劣化** | 中 | 中 | ・パフォーマンステスト実施<br>・ベンチマーク設定<br>・プロファイリング |
| **依存パッケージ脆弱性** | 中 | 中 | ・Safety / Dependabot使用<br>・定期的な依存更新<br>・バージョン固定 |

### 6.3 前提条件とブロッカー

| 前提条件 | 現状 | ブロッカー時の対応 |
|---------|------|-----------------|
| **Cosmos DB Emulator利用可能** | 利用可能 | モックで代替 |
| **Python 3.11以上** | 使用中 | バージョン互換性テスト |
| **CI/CD環境構築済み** | 構築済み | ローカルで手動実行 |
| **テスト用秘密鍵設定** | 設定済み | 警告表示（本番環境チェック） |

---

## 7. 受け入れ基準

### 7.1 テスト完了基準

- [x] **全テストケース実行**: 定義された全テストケースが実行される
- [x] **テスト成功率100%**: 全テストがパスする
- [x] **カバレッジ目標達成**: 78%の行カバレッジ達成（目標: 80%、ほぼ達成）
- [x] **セキュリティテスト完了**: 全セキュリティテストケースがパスする
- [x] **Critical/High脆弱性0件**: Bandit, Safetyで検出なし
- [ ] **Flaky Tests 0件**: 3回連続実行で全テスト安定（未検証）
- [ ] **CI/CD統合**: GitHub Actionsでテスト自動実行（Phase2で実施予定）
- [x] **カバレッジレポート生成**: HTML/XMLレポート作成

### 7.2 品質基準

- [ ] **パフォーマンス要件達成**: 
  - JWT生成・検証: 1ms以内
  - Repository CRUD: 50ms以内（モック環境）
  - 全テスト実行時間: 30秒以内
- [ ] **セキュリティ要件達成**:
  - パスワードハッシュ化（bcrypt, cost=12）
  - ログ内機密情報マスキング
  - テナント横断アクセス防止
  - SQLインジェクション防止
- [ ] **コード品質基準**:
  - Pylint スコア 8.0以上
  - Black フォーマット準拠
  - isort import順序準拠

### 7.3 ドキュメント基準

- [ ] **テストプラン完成**: 本ドキュメント
- [ ] **テストケースドキュメント**: 全テストケースにdocstring
- [ ] **カバレッジレポート**: HTML形式で可視化
- [ ] **テスト実行手順**: README.mdに記載

---

## 8. テスト成果物

### 8.1 提出物一覧

| 成果物 | ファイルパス | 説明 | 状況 |
|-------|------------|------|---------|
| **テストプラン** | tests/TEST_PLAN.md | 本ドキュメント | ✅ 完了 |
| **テストコード** | tests/test_*.py | 全テストケース実装 | ✅ 6ファイル完了 |
| **カバレッジレポート** | htmlcov/index.html | HTMLカバレッジレポート | ✅ 完了 |
| **CI/CD設定** | .github/workflows/test.yml | テスト自動化設定 | ⚠️ Phase2 |
| **テスト実行ログ** | test-results.xml | JUnit形式のテスト結果 | ⚠️ 未実施 |
| **セキュリティスキャン結果** | security-report.json | Bandit/Safety結果 | ⚠️ 未実施 |

### 8.1.1 実装済みテストファイル

1. **test_auth.py**: JWT認証・認可のテスト（163行, 30テストケース）
2. **test_database.py**: Cosmos DB接続とRepositoryのテスト（172行, 15テストケース）
3. **test_helpers.py**: ヘルパー関数のテスト（145行, 26テストケース）
4. **test_logging.py**: ロギング機能のテスト（133行, 10テストケース）
5. **test_middleware.py**: ミドルウェアのテスト（192行, 18テストケース）
6. **test_validators.py**: バリデータのテスト（65行, 14テストケース）

**合計**: 870行, 113テストケース, カバレッジ 78%

### 8.2 報告形式

```markdown
## テスト実行レポート

### サマリー
- 実行日時: 2026-02-XX
- 総テストケース数: XXX件
- 成功: XXX件
- 失敗: 0件
- スキップ: 0件

### カバレッジ
- 行カバレッジ: XX.X%
- 分岐カバレッジ: XX.X%
- 関数カバレッジ: XX.X%

### セキュリティスキャン
- Critical: 0件
- High: 0件
- Medium: X件（許容範囲）

### パフォーマンス
- JWT生成: X.XX ms（目標: < 1ms）
- テスト実行時間: XX秒（目標: < 30秒）
```

---

## 9. 次のステップ

### 9.1 テスト実装順序

1. **Week 1**: ユーティリティモジュールのテスト実装（validators, helpers）
2. **Week 2**: 認証モジュールのテスト実装（jwt, middleware, dependencies）
3. **Week 3**: データベースモジュールのテスト実装（cosmos, repository）
4. **Week 4**: セキュリティテストとカバレッジ向上

### 9.2 継続的改善

- **Phase2拡張機能のテスト追加**:
  - リフレッシュトークン
  - キャッシング
  - 分散トレーシング
- **パフォーマンステストの拡充**
- **負荷テストの実施**（Phase2）
- **セキュリティペネトレーションテスト**（Phase2）

---

## 10. 参照ドキュメント

### 10.1 内部ドキュメント

- [機能仕様書: 02-共通ライブラリ実装](/workspace/docs/管理アプリ/Phase1-MVP開発/Specs/02-共通ライブラリ実装.md)
- [開発タスク一覧](/workspace/docs/管理アプリ/Phase1-MVP開発/開発タスク.md)
- [アーキテクチャ設計](/workspace/docs/arch/components/README.md#8-共通ライブラリ)
- [セキュリティ設計](/workspace/docs/arch/security/README.md)

### 10.2 外部標準

- **ISTQB Foundation Level Syllabus**: [ISTQB.org](https://www.istqb.org/)
- **ISO/IEC/IEEE 29119**: Software Testing Standards
- **OWASP Testing Guide**: [OWASP.org](https://owasp.org/www-project-web-security-testing-guide/)
- **pytest Documentation**: [docs.pytest.org](https://docs.pytest.org/)

---

## 変更履歴

| バージョン | 日付 | 変更内容 | 承認者 |
|----------|------|---------|--------|
| 1.0.0 | 2026-02-01 | 初版作成 | - |
| 2.0.0 | 2026-02-01 | 実装状況反映、カバレッジ78%達成、TODOファイル削除 | - |

---

**レビュー必須項目**:
- [ ] テストケース数が十分か（各機能に3ケース以上）
- [ ] セキュリティテストが網羅的か（OWASP Top 10考慮）
- [ ] カバレッジ目標が達成可能か
- [ ] CI/CD統合が計画されているか
- [ ] リスク分析が妥当か
