# テストプラン構築レポート: テナント管理サービス - コアAPI

**作成日**: 2026-02-01  
**タスクID**: タスク05  
**ステータス**: 完了

---

## 1. 完了サマリー

### 1.1 作成したテストファイル

| # | ファイルパス | 行数 | テストクラス数 | テストメソッド数(想定) |
|---|-------------|------|--------------|----------------------|
| 1 | `/workspace/src/tenant-management-service/tests/conftest.py` | 240 | - | - (フィクスチャ) |
| 2 | `/workspace/src/tenant-management-service/tests/test_models_tenant.py` | 421 | 3 | 15 |
| 3 | `/workspace/src/tenant-management-service/tests/test_repositories_tenant.py` | 403 | 3 | 20 |
| 4 | `/workspace/src/tenant-management-service/tests/test_services_tenant.py` | 522 | 6 | 26 |
| 5 | `/workspace/src/tenant-management-service/tests/test_api_tenants.py` | 482 | 6 | 23 |
| 6 | `/workspace/src/tenant-management-service/tests/test_utils_jwt.py` | 314 | 3 | 12 |
| 7 | `/workspace/src/tenant-management-service/tests/test_schemas_tenant.py` | 394 | 4 | 18 |

**合計**: 7ファイル、2,776行、25クラス、**114テストケース**

### 1.2 テスト設計書

| ファイル | 内容 |
|---------|------|
| `/workspace/docs/管理アプリ/Phase1-MVP開発/Specs/05-テナント管理サービス-コアAPI_テスト設計書.md` | ISTQB準拠のテスト設計書 |

---

## 2. レイヤー別テストケース数

| レイヤー | ファイル | テストケース数 | 主な観点 |
|---------|---------|---------------|---------|
| **Model層** | test_models_tenant.py | 15 | バリデーション、エイリアス、境界値 |
| **Schema層** | test_schemas_tenant.py | 18 | リクエスト/レスポンスバリデーション |
| **Repository層** | test_repositories_tenant.py | 20 | CRUD操作、検索、ページネーション |
| **Service層** | test_services_tenant.py | 26 | ビジネスロジック、特権テナント保護 |
| **API層** | test_api_tenants.py | 23 | エンドポイント、認可、エラーハンドリング |
| **Utility層** | test_utils_jwt.py | 12 | JWT検証、特権テナント判定 |
| **合計** | - | **114** | - |

---

## 3. テストカバレッジ目標

| レイヤー | 行カバレッジ目標 | 分岐カバレッジ目標 | 関数カバレッジ目標 |
|---------|----------------|------------------|------------------|
| Model層 | 100% | 95% | 100% |
| Schema層 | 100% | 95% | 100% |
| Repository層 | 80% | 75% | 90% |
| Service層 | 90% | 85% | 95% |
| API層 | 85% | 80% | 90% |
| Utility層 | 90% | 85% | 100% |
| **全体目標** | **≥ 75%** | **≥ 70%** | **≥ 80%** |

---

## 4. テストケース分類

### 4.1 カテゴリ別集計

| カテゴリ | テストケース数 | 割合 |
|---------|---------------|------|
| 正常系 | 52 | 45.6% |
| 異常系 | 44 | 38.6% |
| 境界値 | 18 | 15.8% |
| **合計** | **114** | **100%** |

### 4.2 優先度別集計

| 優先度 | テストケース数 | 割合 |
|-------|---------------|------|
| 高 | 72 | 63.2% |
| 中 | 38 | 33.3% |
| 低 | 4 | 3.5% |
| **合計** | **114** | **100%** |

---

## 5. テスト技法の適用

### 5.1 ISTQB準拠のテスト技法

| テスト技法 | 適用箇所 | 例 |
|-----------|---------|-----|
| **同値分割法** | 全レイヤー | 有効/無効なテナント名、プラン |
| **境界値分析** | Model/Schema層 | name(3, 100文字)、max_users(1, 10000) |
| **デシジョンテーブル** | Service層 | 特権テナント保護、ユーザー存在チェック |
| **状態遷移テスト** | API層 | テナントステータス(active, suspended, deleted) |
| **エラー推測** | 異常系全般 | SQLインジェクション、不正文字 |

### 5.2 AAA (Arrange-Act-Assert) パターン

すべてのテストメソッドは以下の構造に従っています:

```python
def test_method_name(self):
    """Docstring with test case details"""
    # Arrange
    pass  # テストデータ、モックの準備
    
    # Act
    pass  # テスト対象メソッドの実行
    
    # Assert
    pass  # 期待結果の検証
```

---

## 6. モック設計

### 6.1 モック対象

| レイヤー | モック対象 | モック方法 |
|---------|-----------|-----------|
| Repository層 | Cosmos DB Container | `MagicMock` |
| Service層 | TenantRepository | `MagicMock` + `AsyncMock` |
| API層 | TenantService | `Depends` override |
| API層 | get_current_user | `Depends` override |

### 6.2 フィクスチャ一覧 (conftest.py)

| フィクスチャ名 | 説明 |
|--------------|------|
| `sample_tenant_data` | サンプルテナント作成データ |
| `sample_tenant` | 一般テナントモデル |
| `privileged_tenant` | 特権テナントモデル |
| `regular_tenant` | 一般テナントモデル(Acme) |
| `tenant_with_users` | ユーザーが存在するテナント |
| `privileged_token_data` | 特権テナントのTokenData |
| `regular_token_data` | 一般テナントのTokenData |
| `manager_token_data` | 管理者ロールのTokenData |
| `mock_cosmos_container` | Cosmos DB Containerモック |

### 6.3 境界値テストデータ

- `INVALID_TENANT_NAMES`: 6パターン
- `VALID_TENANT_NAMES`: 6パターン
- `INVALID_DISPLAY_NAMES`: 2パターン
- `VALID_DISPLAY_NAMES`: 4パターン
- `INVALID_PLANS`: 4パターン
- `VALID_PLANS`: 3パターン
- `INVALID_MAX_USERS`: 5パターン
- `VALID_MAX_USERS`: 4パターン

---

## 7. テストケース詳細

### 7.1 Model層 (test_models_tenant.py)

| テストケースID | テスト名 | カテゴリ | 優先度 |
|--------------|---------|---------|--------|
| TC-M001 | Tenantモデル作成_デフォルト値 | 正常系 | 高 |
| TC-M002 | Tenantモデル作成_全フィールド指定 | 正常系 | 高 |
| TC-M003 | Tenantモデル_キャメルケースエイリアス | 正常系 | 高 |
| TC-M004 | Tenantモデル_JSON変換 | 正常系 | 中 |
| TC-M005-007 | 必須フィールド欠如(id, tenant_id, name) | 異常系 | 高 |
| TC-M008-010 | TenantCreateのバリデーション | 正常系/異常系 | 高 |
| TC-M011-014 | 境界値テスト(name, max_users) | 境界値 | 中 |
| TC-M015 | TenantUpdateの部分更新 | 正常系 | 高 |

### 7.2 Repository層 (test_repositories_tenant.py)

| テストケースID | テスト名 | カテゴリ | 優先度 |
|--------------|---------|---------|--------|
| TC-R001-002 | create操作(正常/エラー処理) | 正常系/異常系 | 高 |
| TC-R003-005 | get操作(存在/不在/不正キー) | 正常系/異常系 | 高 |
| TC-R006-007 | update操作(正常/不在) | 正常系/異常系 | 高 |
| TC-R008-009 | delete操作(正常/不在) | 正常系/異常系 | 高/中 |
| TC-R010-013 | find_by_name検索 | 正常系 | 高 |
| TC-R014-016 | list_all一覧取得 | 正常系 | 高/中 |
| TC-R017-018 | list_by_tenant_id単一パーティション | 正常系 | 高/中 |
| TC-R019-020 | ページネーション境界値 | 境界値 | 中 |

### 7.3 Service層 (test_services_tenant.py)

| テストケースID | テスト名 | カテゴリ | 優先度 |
|--------------|---------|---------|--------|
| TC-S001-006 | テナント作成(正常/異常) | 正常系/異常系 | 高/中 |
| TC-S007-008 | テナント取得(存在/不在) | 正常系 | 高 |
| TC-S009-012 | テナント一覧(特権/一般) | 正常系 | 高/中 |
| TC-S013-016 | テナント更新(正常/保護/異常) | 正常系/異常系 | 高/中 |
| TC-S017-020 | テナント削除(正常/保護/異常) | 正常系/異常系 | 高 |
| TC-S021-023 | ユーザー数管理 | 正常系 | 中 |
| TC-S024-026 | バリデーション境界値 | 境界値 | 中 |

### 7.4 API層 (test_api_tenants.py)

| テストケースID | テスト名 | カテゴリ | 優先度 |
|--------------|---------|---------|--------|
| TC-A001-005 | テナント一覧取得 | 正常系/異常系 | 高/中 |
| TC-A006-009 | テナント詳細取得 | 正常系/異常系 | 高 |
| TC-A010-013 | テナント作成 | 正常系/異常系 | 高 |
| TC-A014-017 | テナント更新 | 正常系/異常系 | 高/中 |
| TC-A018-021 | テナント削除 | 正常系/異常系 | 高 |
| TC-A022-023 | ページネーション境界値 | 境界値 | 中/低 |

### 7.5 Utility層 (test_utils_jwt.py)

| テストケースID | テスト名 | カテゴリ | 優先度 |
|--------------|---------|---------|--------|
| TC-U001-006 | JWT検証(有効/期限切れ/不正) | 正常系/異常系 | 高 |
| TC-U007-009 | 特権テナント判定 | 正常系/境界値 | 高/低 |

### 7.6 Schema層 (test_schemas_tenant.py)

| テストケースID | テスト名 | カテゴリ | 優先度 |
|--------------|---------|---------|--------|
| TC-Schema-001-003 | レスポンススキーマ | 正常系 | 中 |
| TC-Schema-004-012 | TenantCreateRequest | 正常系/異常系 | 高 |
| TC-Schema-013-018 | TenantUpdateRequest | 正常系/異常系 | 高 |

---

## 8. pytest実行コマンド

### 8.1 テスト収集確認

```bash
cd /workspace/src/tenant-management-service
pytest --collect-only
```

**想定出力**:
```
collected 114 items

<Module tests/test_models_tenant.py>
  <Class TestTenantModel>
    <Function test_tenant_モデル作成_デフォルト値>
    ...
  </Class>
</Module>
...
```

### 8.2 テスト実行

```bash
# 全テスト実行
pytest

# カバレッジ測定
pytest --cov=app --cov-report=html --cov-report=term-missing

# 特定レイヤーのみ実行
pytest tests/test_models_tenant.py -v
pytest tests/test_repositories_tenant.py -v
pytest tests/test_services_tenant.py -v
pytest tests/test_api_tenants.py -v
pytest tests/test_utils_jwt.py -v
pytest tests/test_schemas_tenant.py -v

# 詳細出力
pytest -vv --tb=short
```

### 8.3 カバレッジ閾値チェック

```bash
pytest --cov=app --cov-fail-under=75
```

---

## 9. 次のステップ: テスト実装フェーズ

### 9.1 実装推奨順序

1. **フィクスチャの実装** (conftest.py)
   - モックヘルパー関数の実装
   - サンプルデータの完全な定義

2. **Model層テストの実装** (test_models_tenant.py)
   - 基礎的なデータ構造の検証
   - 最も依存関係が少ない

3. **Utility層テストの実装** (test_utils_jwt.py)
   - JWT検証ロジックの検証
   - 他のテストで使用される

4. **Repository層テストの実装** (test_repositories_tenant.py)
   - データアクセス層の検証
   - Service層の基盤

5. **Service層テストの実装** (test_services_tenant.py)
   - ビジネスロジックの検証
   - 最も重要な部分

6. **API層テストの実装** (test_api_tenants.py)
   - エンドポイントの統合検証
   - すべてのレイヤーを統合

7. **Schema層テストの実装** (test_schemas_tenant.py)
   - リクエスト/レスポンスの検証

### 9.2 実装時の注意点

1. **非同期処理のモック**
   - `AsyncMock`を使用
   - 非同期イテレータの適切な実装

2. **日時の扱い**
   - `datetime.utcnow()`のモック化
   - または範囲チェック

3. **JWT生成**
   - 固定の秘密鍵を使用
   - テスト用の有効期限設定

4. **エラーメッセージの検証**
   - 部分一致でチェック(`"not found" in str(exc_info.value.detail)`)

5. **パラメータ化テスト**
   - `@pytest.mark.parametrize`を活用
   - DRY原則

---

## 10. トレーサビリティマトリックス

### 10.1 要件とテストケースの対応

| 要件ID | 要件名 | テストケース | レイヤー |
|-------|--------|-------------|---------|
| BR-TENANT-001 | 特権テナント保護 | TC-S014, TC-S018, TC-A015, TC-A019 | Service/API |
| BR-TENANT-002 | テナント名の一意性 | TC-S002, TC-A011 | Service/API |
| BR-TENANT-003 | デフォルトステータス | TC-M001, TC-S001 | Model/Service |
| BR-TENANT-007 | テナント分離 | TC-A007 | API |
| US-TENANT-001 | テナント一覧参照 | TC-A001, TC-A002 | API |
| US-TENANT-002 | テナント詳細参照 | TC-A006 | API |
| US-TENANT-003 | テナント作成 | TC-A010 | API |
| US-TENANT-004 | テナント更新 | TC-A014 | API |
| US-TENANT-005 | テナント削除 | TC-A018 | API |
| US-TENANT-006 | 特権テナント保護 | TC-S014, TC-S018 | Service |

---

## 11. リスクと緩和策

| リスク | 影響度 | 発生確率 | 緩和策 |
|-------|--------|---------|--------|
| モック実装の複雑さ | 中 | 中 | auth-serviceの実装パターンを参考 |
| 非同期テストの難しさ | 中 | 中 | pytest-asyncioの適切な使用 |
| カバレッジ目標未達 | 高 | 低 | 段階的な実装とレビュー |
| テストデータの不足 | 低 | 低 | conftest.pyに十分なフィクスチャを定義済み |

---

## 12. 完了基準チェックリスト

- [x] すべてのテストファイルが作成されている
- [x] 各テストケースにDocstringが記載されている
- [x] AAA(Arrange-Act-Assert)パターンが適用されている
- [x] 非同期関数に`@pytest.mark.asyncio`が付与されている
- [x] メソッド内部実装は空（pass）である
- [x] テスト設計書が作成されている
- [x] フィクスチャが定義されている
- [x] 境界値テストデータが定義されている
- [x] トレーサビリティが確保されている

---

## 13. 参考実装

- `/workspace/src/auth-service/tests/` - 認証サービスのテスト実装パターン
- `/workspace/src/auth-service/tests/conftest.py` - フィクスチャの実装例
- `/workspace/src/auth-service/tests/test_repository_user.py` - Repositoryテストの実装例
- `/workspace/src/auth-service/tests/test_service_auth.py` - Serviceテストの実装例

---

## 14. まとめ

### 14.1 成果物

1. **テストコードの枠組み**: 7ファイル、2,776行、114テストケース
2. **テスト設計書**: ISTQB準拠の包括的なドキュメント
3. **フィクスチャ**: 再利用可能なテストデータとモック

### 14.2 カバレッジ目標

- **全体目標**: 行カバレッジ75%以上
- **レイヤー別**: Model(100%), Service(90%), API(85%), Repository(80%)

### 14.3 次のアクション

1. テスト実装フェーズへ移行
2. 各テストメソッド内の`pass`を実装コードに置き換え
3. pytest実行とカバレッジ測定
4. 不足しているテストケースの追加

---

**レポート終了**
