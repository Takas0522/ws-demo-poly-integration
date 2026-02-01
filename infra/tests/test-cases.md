# インフラ基盤構築 テストケース一覧

## ドキュメント情報
- **バージョン**: 1.0.0
- **作成日**: 2026-02-01
- **更新日**: 2026-02-01
- **総テストケース数**: 34件
- **自動化テストケース数**: 31件（91%）

---

## 1. Linter・構文テスト（8ケース）

### カテゴリ: 静的解析

| ID | テストケース名 | 入力 | 期待結果 | 優先度 | 自動化 | テスト技法 |
|----|--------------|------|----------|-------|--------|----------|
| TC-L001 | main.bicep構文チェック | main.bicep | エラーなし、警告なし | 🔴 高 | ✅ | 同値分割 |
| TC-L002 | app-service.bicep構文チェック | modules/app-service.bicep | エラーなし、警告なし | 🔴 高 | ✅ | 同値分割 |
| TC-L003 | app-service-plan.bicep構文チェック | modules/app-service-plan.bicep | エラーなし、警告なし | 🔴 高 | ✅ | 同値分割 |
| TC-L004 | cosmos-db.bicep構文チェック | modules/cosmos-db.bicep | エラーなし、警告なし | 🔴 高 | ✅ | 同値分割 |
| TC-L005 | key-vault.bicep構文チェック | modules/key-vault.bicep | エラーなし、警告なし | 🔴 高 | ✅ | 同値分割 |
| TC-L006 | app-insights.bicep構文チェック | modules/app-insights.bicep | エラーなし、警告なし | 🔴 高 | ✅ | 同値分割 |
| TC-L007 | Bicep Linterルール準拠 | 全Bicepファイル | ベストプラクティス違反なし | 🟠 中 | ✅ | 同値分割 |
| TC-L008 | ARM Template生成確認 | main.bicep | JSONテンプレート生成成功 | 🔴 高 | ✅ | 同値分割 |

### 実装スクリプト
- `validation-tests.sh::test_bicep_syntax()`
- `validation-tests.sh::test_bicep_linter()`

---

## 2. パラメータ検証テスト（6ケース）

### カテゴリ: パラメータファイル検証

| ID | テストケース名 | 入力 | 期待結果 | 優先度 | 自動化 | テスト技法 |
|----|--------------|------|----------|-------|--------|----------|
| TC-P001 | dev環境パラメータ構文チェック | parameters/dev.bicepparam | 構文エラーなし | 🔴 高 | ✅ | 同値分割 |
| TC-P002 | staging環境パラメータ構文チェック | parameters/staging.bicepparam | 構文エラーなし | 🔴 高 | ✅ | 同値分割 |
| TC-P003 | production環境パラメータ構文チェック | parameters/production.bicepparam | 構文エラーなし | 🟠 中 | ✅ | 同値分割 |
| TC-P004 | 環境名の有効性確認 | environment: dev/staging/production | パラメータ検証成功 | 🔴 高 | ✅ | 同値分割 |
| TC-P005 | 環境名の無効値確認 | environment: test/prod/DEV/"" | パラメータ検証失敗 | 🟠 中 | ✅ | 同値分割（無効クラス） |
| TC-P006 | リージョン名の妥当性確認 | location: japaneast | パラメータ検証成功 | 🔴 高 | ✅ | 同値分割 |

### 実装スクリプト
- `validation-tests.sh::test_parameter_files()`
- `validation-tests.sh::test_parameter_validation()`

---

## 3. ARM Template検証テスト（4ケース）

### カテゴリ: デプロイ前検証

| ID | テストケース名 | 入力 | 期待結果 | 優先度 | 自動化 | テスト技法 |
|----|--------------|------|----------|-------|--------|----------|
| TC-A001 | dev環境ARM検証 | main.bicep + dev.bicepparam | デプロイ検証成功 | 🟠 中 | ✅ | 状態遷移 |
| TC-A002 | staging環境ARM検証 | main.bicep + staging.bicepparam | デプロイ検証成功 | 🔴 高 | ✅ | 状態遷移 |
| TC-A003 | What-If分析の実行 | main.bicep + staging.bicepparam | リソース変更予測が表示される | 🔴 高 | ✅ | 状態遷移 |
| TC-A004 | リソース依存関係の検証 | main.bicep | 依存関係が正しく解決される | 🟠 中 | ✅ | デシジョンテーブル |

### 実装スクリプト
- `deployment-tests.sh::test_arm_validation()`
- `deployment-tests.sh::test_whatif_analysis()`

---

## 4. セキュリティテスト（7ケース）

### カテゴリ: セキュリティ設定検証

| ID | テストケース名 | 入力 | 期待結果 | 優先度 | 自動化 | テスト技法 |
|----|--------------|------|----------|-------|--------|----------|
| TC-S001 | HTTPS強制設定の確認 | app-service.bicep | httpsOnly: true | 🔴 高 | ✅ | デシジョンテーブル |
| TC-S002 | TLSバージョン確認 | app-service.bicep | minTlsVersion: 1.2以上 | 🔴 高 | ✅ | 境界値分析 |
| TC-S003 | FTPS無効化確認 | app-service.bicep | ftpsState: Disabled | 🔴 高 | ✅ | デシジョンテーブル |
| TC-S004 | Key Vault RBAC有効化 | key-vault.bicep | enableRbacAuthorization: true | 🔴 高 | ✅ | デシジョンテーブル |
| TC-S005 | Key Vault Soft Delete有効化 | key-vault.bicep | enableSoftDelete: true | 🔴 高 | ✅ | デシジョンテーブル |
| TC-S006 | Cosmos DB継続バックアップ | cosmos-db.bicep | backupPolicy.type: Continuous | 🔴 高 | ✅ | デシジョンテーブル |
| TC-S007 | シークレット情報の出力禁止 | main.bicep | output にシークレットなし | 🟠 中 | ❌ | 手動確認 |

### 実装スクリプト
- `security-tests.sh::test_https_enforcement()`
- `security-tests.sh::test_tls_version()`
- `security-tests.sh::test_key_vault_security()`
- `security-tests.sh::test_cosmos_backup()`

---

## 5. リソース設定テスト（9ケース）

### カテゴリ: リソース構成の正確性

| ID | テストケース名 | 入力 | 期待結果 | 優先度 | 自動化 | テスト技法 |
|----|--------------|------|----------|-------|--------|----------|
| TC-R001 | App Service Plan SKU確認 | sku: B1 | sku.name: B1, tier: Basic | 🔴 高 | ✅ | 同値分割 |
| TC-R002 | App Service数の確認 | main.bicep | 8つのApp Serviceが定義 | 🔴 高 | ✅ | 同値分割 |
| TC-R003 | Cosmos DBコンテナ数確認 | cosmos-db.bicep | 7つのコンテナが定義 | 🔴 高 | ✅ | 同値分割 |
| TC-R004 | パーティションキーの確認 | cosmos-db.bicep | 全コンテナで /tenantId | 🔴 高 | ✅ | 同値分割 |
| TC-R005 | Cosmos DB自動スケール設定 | cosmos-db.bicep | maxThroughput: 4000 RU/s | 🟠 中 | ✅ | 境界値分析 |
| TC-R006 | Application Insights統合 | app-insights.bicep | Log Analyticsワークスペース統合 | 🟠 中 | ✅ | 同値分割 |
| TC-R007 | リソース名の一意性確認 | main.bicep | uniqueString()使用箇所の確認 | 🟠 中 | ✅ | 同値分割 |
| TC-R008 | タグの一貫性確認 | 全リソース | Environment, Project, ManagedByタグ | 🟢 低 | ✅ | 同値分割 |
| TC-R009 | Stagingスロット作成確認 | app-service.bicep | 全App Serviceでstagingスロット定義 | 🟠 中 | ✅ | 同値分割 |

### 実装スクリプト
- `validation-tests.sh::test_resource_configuration()`

---

## 6. 境界値テスト（4ケース）

### カテゴリ: パラメータ境界値の検証

| ID | テストケース名 | 入力 | 期待結果 | 優先度 | 自動化 | テスト技法 |
|----|--------------|------|----------|-------|--------|----------|
| TC-B001 | リソース名最小長（境界値-） | name: "ab" (2文字) | 検証失敗 | 🟢 低 | ✅ | 境界値分析 |
| TC-B002 | リソース名最小長（境界値+） | name: "abc" (3文字) | 検証成功 | 🟠 中 | ✅ | 境界値分析 |
| TC-B003 | リソース名最大長（境界値+） | name: 24文字 | 検証成功 | 🟠 中 | ✅ | 境界値分析 |
| TC-B004 | リソース名最大長超過 | name: 25文字 | 検証失敗 | 🟢 低 | ✅ | 境界値分析 |

### 実装スクリプト
- `validation-tests.sh::test_boundary_values()`

---

## 7. スクリプト実行テスト（6ケース）

### カテゴリ: デプロイ・運用スクリプトの検証

| ID | テストケース名 | 入力 | 期待結果 | 優先度 | 自動化 | テスト技法 |
|----|--------------|------|----------|-------|--------|----------|
| TC-D001 | validate.shの構文チェック | scripts/validate.sh | ShellCheck警告なし | 🔴 高 | ✅ | 同値分割 |
| TC-D002 | deploy.shの構文チェック | scripts/deploy.sh | ShellCheck警告なし | 🔴 高 | ✅ | 同値分割 |
| TC-D003 | destroy.shの構文チェック | scripts/destroy.sh | ShellCheck警告なし | 🔴 高 | ✅ | 同値分割 |
| TC-D004 | validate.sh実行テスト（Dev） | ./validate.sh dev | 終了コード0、検証成功 | 🔴 高 | ✅ | 状態遷移 |
| TC-D005 | validate.sh実行テスト（Staging） | ./validate.sh staging | 終了コード0、検証成功 | 🔴 高 | ✅ | 状態遷移 |
| TC-D006 | deploy.shエラーハンドリング | 無効な環境名 | 適切なエラーメッセージと終了コード1 | 🟠 中 | ❌ | 同値分割（無効クラス） |

### 実装スクリプト
- `run-tests.sh::test_scripts()`

---

## 8. 統合テスト（3ケース）

### カテゴリ: エンドツーエンドの検証

| ID | テストケース名 | 入力 | 期待結果 | 優先度 | 自動化 | テスト技法 |
|----|--------------|------|----------|-------|--------|----------|
| TC-I001 | 全テストの統合実行 | ./run-tests.sh --all | 全テスト合格（90%以上） | 🔴 高 | ✅ | 統合テスト |
| TC-I002 | CI/CDパイプライン模擬実行 | 全テストスクリプトの連続実行 | 全て終了コード0 | 🟠 中 | ✅ | 統合テスト |
| TC-I003 | テストレポート生成 | ./run-tests.sh --report | JSONまたはMarkdown形式で結果出力 | 🟢 低 | ❌ | 統合テスト |

### 実装スクリプト
- `run-tests.sh::main()`

---

## 9. 受け入れ基準マッピング

### 仕様書の受け入れ基準とテストケースの対応

| 受け入れ基準 | 対応テストケース | ステータス |
|------------|---------------|----------|
| **Stagingデプロイ成功** | TC-A002, TC-D005 | ✅ 対応済み |
| **Cosmos DB データベース・コンテナ作成** | TC-R003, TC-R004 | ✅ 対応済み |
| **App Service 8つ起動** | TC-R002 | ✅ 対応済み |
| **Application Insights統合** | TC-R006 | ✅ 対応済み |
| **接続性確認** | TC-A004 | ✅ 対応済み |
| **コスト$100以下** | - | ⚠️ 手動確認 |
| **HTTPS強制** | TC-S001 | ✅ 対応済み |
| **継続バックアップ** | TC-S006 | ✅ 対応済み |
| **デプロイスクリプト実行** | TC-D004, TC-D005 | ✅ 対応済み |
| **検証スクリプト実行** | TC-D004, TC-D005 | ✅ 対応済み |

---

## 10. テスト実行マトリクス

### 環境別テスト実行計画

| テストカテゴリ | Development | Staging | Production | CI/CD |
|--------------|------------|---------|------------|-------|
| Linter・構文 | ✅ | ✅ | - | ✅ |
| パラメータ検証 | ✅ | ✅ | ✅ | ✅ |
| ARM検証 | ⚠️ | ✅ | - | ✅ |
| セキュリティ | ✅ | ✅ | - | ✅ |
| リソース設定 | ✅ | ✅ | - | ✅ |
| 境界値 | ✅ | ⚠️ | - | ✅ |
| スクリプト実行 | ✅ | ✅ | - | ✅ |
| 統合テスト | ✅ | ✅ | - | ✅ |

凡例:
- ✅ 実行する
- ⚠️ オプション（時間がある場合）
- ➖ Phase1では対象外

---

## 11. デシジョンテーブル詳細

### DT-01: 環境別セキュリティ設定の組み合わせ

| テストID | Env | HTTPS | TLS≥1.2 | Key Vault | Backup | 期待結果 | 対応TC |
|---------|-----|-------|---------|-----------|--------|---------|--------|
| DT-01-1 | dev | ✅ | ✅ | ✅ | ✅ | ✅ Pass | TC-S001~S006 |
| DT-01-2 | staging | ✅ | ✅ | ✅ | ✅ | ✅ Pass | TC-S001~S006 |
| DT-01-3 | production | ✅ | ✅ | ✅ | ✅ | ✅ Pass | (Phase2) |
| DT-01-4 | dev | ❌ | - | - | - | ❌ Fail | TC-S001 |
| DT-01-5 | staging | ✅ | ❌ (TLS 1.0) | - | - | ❌ Fail | TC-S002 |
| DT-01-6 | staging | ✅ | ✅ | ❌ | - | ❌ Fail | TC-S004, S005 |
| DT-01-7 | staging | ✅ | ✅ | ✅ | ❌ | ❌ Fail | TC-S006 |

### DT-02: リソース作成の組み合わせ

| テストID | App Service | Cosmos DB | Key Vault | App Insights | 期待結果 |
|---------|------------|-----------|-----------|-------------|---------|
| DT-02-1 | ✅ (8個) | ✅ (7コンテナ) | ✅ | ✅ | ✅ Pass |
| DT-02-2 | ✅ (7個) | ✅ (7コンテナ) | ✅ | ✅ | ❌ Fail |
| DT-02-3 | ✅ (8個) | ✅ (6コンテナ) | ✅ | ✅ | ❌ Fail |
| DT-02-4 | ✅ (8個) | ✅ (7コンテナ) | ❌ | ✅ | ❌ Fail |

---

## 12. テストデータ

### TD-01: 有効な環境名（同値クラス）

```bash
# 有効な同値クラス
VALID_ENVIRONMENTS=("dev" "staging" "production")

# 無効な同値クラス
INVALID_ENVIRONMENTS=("test" "prod" "DEV" "Staging" "" "dev-1")
```

### TD-02: 有効なリージョン名

```bash
# 有効なリージョン
VALID_REGIONS=("japaneast" "eastus" "westus2")

# 無効なリージョン
INVALID_REGIONS=("tokyo" "japan" "" "JAPANEAST")
```

### TD-03: SKU境界値データ

```json
{
  "App Service Plan": {
    "valid": ["B1", "B2", "B3", "S1", "S2", "S3", "P1V2"],
    "invalid": ["A1", "F1", "Z9", ""]
  },
  "Cosmos DB RU": {
    "min": 400,
    "max": 1000000,
    "boundary_minus": [399],
    "boundary_plus": [400, 401],
    "boundary_max": [999999, 1000000],
    "invalid": [-1, 0, 1000001]
  }
}
```

---

## 13. テストケース詳細（代表例）

### TC-L001: main.bicep構文チェック（詳細版）

**目的**: メインBicepテンプレートの構文エラーがないことを確認

**前提条件**:
- Azure CLI インストール済み（2.50.0+）
- Bicep CLI インストール済み（0.20.0+）

**テスト手順**:
```bash
cd /workspace/infra
az bicep build --file main.bicep --stdout
```

**期待結果**:
- 終了コード: 0
- エラーメッセージなし
- 有効なARMテンプレートJSON出力

**失敗時の対応**:
1. エラーメッセージを確認
2. 該当行のBicep構文を修正
3. 再度テスト実行

---

### TC-S001: HTTPS強制設定の確認（詳細版）

**目的**: すべてのApp ServiceでHTTPSが強制されていることを確認

**前提条件**:
- app-service.bicep が存在

**テスト手順**:
```bash
# Bicepファイルから httpsOnly 設定を抽出
grep -n "httpsOnly" infra/modules/app-service.bicep

# 期待値: httpsOnly: true が存在
```

**期待結果**:
```bicep
httpsOnly: true
```

**判定基準**:
- ✅ Pass: `httpsOnly: true` が設定されている
- ❌ Fail: `httpsOnly: false` または設定なし

---

### TC-A003: What-If分析の実行（詳細版）

**目的**: デプロイ前にリソース変更を予測できることを確認

**前提条件**:
- Azure CLIでログイン済み
- Staging環境のパラメータファイルが存在

**テスト手順**:
```bash
cd /workspace/infra
az deployment sub what-if \
  --location japaneast \
  --template-file main.bicep \
  --parameters parameters/staging.bicepparam \
  --name "test-whatif-$(date +%Y%m%d)"
```

**期待結果**:
- 終了コード: 0
- リソースの変更予測が表示される
- エラーなし

**出力例**:
```
Resource changes: 15 to create, 0 to modify, 0 to delete.
  + Microsoft.Web/sites/app-frontend-staging
  + Microsoft.Web/sites/app-auth-staging
  ...
```

---

## 14. カバレッジ目標

### ISTQB準拠のカバレッジ指標

| カバレッジ種類 | 目標 | 現状 | ステータス |
|--------------|------|------|----------|
| **テストケースカバレッジ** | 100% | 100% (34/34) | ✅ 達成 |
| **受け入れ基準カバレッジ** | 100% | 90% (9/10) | ⚠️ コスト確認のみ手動 |
| **コードカバレッジ（Bicep）** | 90% | - | 🔲 実装後測定 |
| **自動化カバレッジ** | 85% | 91% (31/34) | ✅ 達成 |

---

## 15. 完了条件チェックリスト

- [x] 最低20件のテストケース作成（実際: 34件）
- [x] 優先度設定（高/中/低）
- [x] 自動化/手動の区別
- [x] テスト技法の明示（ISTQB準拠）
- [x] 受け入れ基準とのマッピング
- [x] 境界値テストケースの設計
- [x] デシジョンテーブルの作成
- [x] テストデータの定義

---

## 16. 次のステップ

1. ✅ テストケース設計完了 ← 現在
2. 🔲 テストスクリプト実装（スケルトン→実装）
3. 🔲 ローカル環境でのテスト実行
4. 🔲 テスト結果のレビュー
5. 🔲 CI/CDパイプラインへの統合

---

## 変更履歴

| バージョン | 日付 | 変更内容 | 変更者 |
|----------|------|---------|--------|
| 1.0.0 | 2026-02-01 | 初版作成（34テストケース） | - |
