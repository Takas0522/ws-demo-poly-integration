# インフラ基盤構築 テストスイート

このディレクトリには、Bicepテンプレートで構築されるAzureインフラ基盤の品質を保証するためのテストスクリプトが含まれています。

## 📋 概要

| 項目 | 内容 |
|-----|------|
| **テスト総数** | 34ケース |
| **自動化率** | 91%（31/34ケース） |
| **対象** | Bicepテンプレート、パラメータファイル、デプロイスクリプト |
| **準拠規格** | ISTQB Foundation Level |

## 🎯 テストカテゴリ

```
tests/
├── run-tests.sh          # メイン実行スクリプト
├── validation-tests.sh   # 構文・Linter・パラメータ検証
├── deployment-tests.sh   # ARM検証・What-If分析
├── security-tests.sh     # セキュリティ設定検証
├── test-plan.md          # テスト設計書
├── test-cases.md         # テストケース一覧（34ケース）
└── README.md            # このファイル
```

## 🚀 クイックスタート

### 前提条件

```bash
# Azure CLIがインストールされていることを確認
az --version
# 必要バージョン: 2.50.0 以上

# Bicep CLIがインストールされていることを確認
az bicep version
# 必要バージョン: 0.20.0 以上

# Azureにログイン
az login
```

### 基本的な実行方法

```bash
# 1. テストディレクトリに移動
cd /workspace/infra/tests

# 2. スクリプトに実行権限を付与
chmod +x *.sh

# 3. 全テストを実行
./run-tests.sh --all
```

## 📝 使用方法

### 1. クイックテスト（開発時）

高優先度のテストのみ実行（所要時間: 2-3分）

```bash
./run-tests.sh --quick
```

**実行内容:**
- Bicep構文チェック
- パラメータ構文チェック
- 基本的なセキュリティチェック

### 2. カテゴリ別テスト

#### 検証テスト（構文・Linter）

```bash
./validation-tests.sh
```

**対応テストケース:** TC-L001~L008, TC-P001~P006, TC-R001~R009, TC-B001~B004

**実行内容:**
- Bicep構文チェック
- Bicep Linter実行
- パラメータファイル検証
- リソース設定確認
- 境界値テスト

#### デプロイメントテスト（ARM検証）

```bash
./deployment-tests.sh
```

**対応テストケース:** TC-A001~A004

**実行内容:**
- ARM Template検証
- What-If分析
- リソース依存関係確認

#### セキュリティテスト

```bash
./security-tests.sh
```

**対応テストケース:** TC-S001~S007

**実行内容:**
- HTTPS強制確認
- TLSバージョン確認
- Key Vaultセキュリティ設定
- Cosmos DBバックアップ設定
- シークレット出力確認

### 3. 環境指定テスト

特定の環境のみテストする場合：

```bash
# Staging環境のみ
./run-tests.sh --environment staging

# Dev環境のみ
./validation-tests.sh --environment dev
```

### 4. CI/CDモード

```bash
./run-tests.sh --ci
```

**特徴:**
- 全自動テストのみ実行（手動テストはスキップ）
- JSON/JUnit形式のレポート生成
- CI/CDパイプラインに最適化

## 📊 テスト結果の見方

### 成功時の出力例

```
=====================================
テスト実行結果サマリー
=====================================
日時: 2026-02-01 12:34:56
環境: staging

[✓] Linter・構文テスト: 8/8 合格
[✓] パラメータ検証: 6/6 合格
[✓] ARM検証: 4/4 合格
[✓] セキュリティテスト: 7/7 合格
[✓] スクリプト実行: 6/6 合格

総合結果: 31/31 合格 (100%)
判定: ✅ PASS
実行時間: 5分32秒
=====================================
```

### 失敗時の出力例

```
[✗] TC-S001: FAIL - HTTPS強制設定が無効
    ファイル: modules/app-service.bicep
    期待値: httpsOnly: true
    実際値: httpsOnly: false
```

## 🔍 テストケース詳細

詳細なテストケースは以下のドキュメントを参照：

- [test-cases.md](./test-cases.md) - 全34テストケースの詳細
- [test-plan.md](./test-plan.md) - テスト戦略と設計

### テストケース一覧（抜粋）

| カテゴリ | テスト数 | 自動化 |
|---------|---------|-------|
| Linter・構文 | 8 | ✅ 8/8 |
| パラメータ検証 | 6 | ✅ 6/6 |
| ARM Template検証 | 4 | ✅ 4/4 |
| セキュリティ | 7 | ✅ 6/7 |
| リソース設定 | 9 | ✅ 9/9 |

## 🛠️ トラブルシューティング

### Azure CLIログインエラー

```bash
# ログイン状態を確認
az account show

# 再ログイン
az login

# サブスクリプション切り替え
az account set --subscription "Your Subscription Name"
```

### Bicepバージョンエラー

```bash
# Bicepを最新版にアップグレード
az bicep upgrade

# バージョン確認
az bicep version
```

### パラメータファイルエラー

```
Error: Missing required parameter 'jwtSecretKey'
```

**対応:**
- staging環境: デプロイ時にシークレットをコマンドライン引数で指定
- dev環境: デフォルト値が設定済み

```bash
# Staging環境テスト時
az deployment sub validate \
  --location japaneast \
  --template-file ../main.bicep \
  --parameters ../parameters/staging.bicepparam \
  --parameters jwtSecretKey='<your-secret>' \
               serviceSharedSecret='<your-secret>'
```

## 📈 合格基準

### テストレベル別合格基準

| テストレベル | 合格基準 |
|------------|---------|
| **必須テスト（高優先度）** | 100% |
| **推奨テスト（中優先度）** | 90%以上 |
| **オプションテスト（低優先度）** | 80%以上 |

### カテゴリ別合格基準

| カテゴリ | 必須合格率 |
|---------|----------|
| 構文・Linter | 100% |
| パラメータ検証 | 100% |
| セキュリティ | 100% |
| ARM検証 | 90% |
| スクリプト実行 | 90% |

## 🔄 CI/CD統合（Phase2以降）

### GitHub Actions例

```yaml
name: Infrastructure Tests

on:
  pull_request:
    paths:
      - 'infra/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Run Infrastructure Tests
        run: |
          cd infra/tests
          chmod +x *.sh
          ./run-tests.sh --ci
      
      - name: Upload Test Results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: infra/tests/test-results.json
```

## 📚 参考資料

### 内部ドキュメント

- [インフラ基盤構築仕様書](../../../docs/管理アプリ/Phase1-MVP開発/Specs/01-インフラ基盤構築.md)
- [開発タスク](../../../docs/管理アプリ/Phase1-MVP開発/01-インフラ基盤構築.md)

### 外部リソース

- [ISTQB Foundation Level](https://www.istqb.org/)
- [Azure Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [Azure Well-Architected Framework](https://docs.microsoft.com/azure/architecture/framework/)

## 🚧 実装状況

| ファイル | ステータス | 説明 |
|---------|----------|------|
| test-plan.md | ✅ 完了 | テスト設計書 |
| test-cases.md | ✅ 完了 | 全34テストケース定義 |
| run-tests.sh | 🔲 スケルトン | メイン実行スクリプト |
| validation-tests.sh | 🔲 スケルトン | 検証テスト |
| deployment-tests.sh | 🔲 スケルトン | デプロイメントテスト |
| security-tests.sh | 🔲 スケルトン | セキュリティテスト |

> **Note:** スケルトンフェーズ = 関数定義のみ実装済み、内部ロジックは次のフェーズで実装

## 🎯 次のステップ

1. ✅ **テストプラン策定** ← 完了
2. 🔲 **テストスクリプト実装**: スケルトンから実装コードを追加
3. 🔲 **ローカル実行**: 開発環境でテスト実行
4. 🔲 **CI/CD統合**: GitHub ActionsまたはAzure Pipelinesに統合
5. 🔲 **継続的改善**: テスト結果を元にカバレッジ向上

## ❓ FAQ

### Q1: テスト実行に Azure 環境が必要ですか？

**A:** カテゴリによって異なります。
- **不要**: 構文チェック、Linter、パラメータ検証
- **必要（ログインのみ）**: ARM検証、What-If分析
- **必要（実環境）**: デプロイ後検証（Phase2以降）

### Q2: テスト実行でコストは発生しますか？

**A:** 基本的に発生しません。
- What-If分析は実際にデプロイしないため、コスト不要
- ARM検証もコスト不要
- 実際のデプロイテストはPhase2以降（CI/CD構築後）

### Q3: テストが失敗した場合はどうすればいいですか？

**A:** 以下の手順で対応してください：
1. エラーメッセージを確認
2. 該当するテストケース（TC-XXX）を [test-cases.md](./test-cases.md) で確認
3. Bicepファイルまたはパラメータファイルを修正
4. 再度テスト実行

### Q4: 手動テストはどのように実行しますか？

**A:** 手動テストは3ケースのみ：
- TC-S007: シークレット出力確認（コードレビューで実施）
- TC-D006: deploy.shエラーハンドリング（手動実行して確認）
- TC-I003: テストレポート生成（目視確認）

## 📞 サポート

テストに関する質問や問題は、開発チームにお問い合わせください。

---

**作成日**: 2026-02-01  
**バージョン**: 1.0.0  
**ステータス**: Phase1 - テストプラン完了、実装待ち
