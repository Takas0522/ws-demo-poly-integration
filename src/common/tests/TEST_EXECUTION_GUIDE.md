# テスト実行ガイド

## 概要

本ガイドでは、共通ライブラリのテストの実行方法を説明します。

## 前提条件

```bash
# テスト用依存パッケージのインストール
pip install -r requirements-dev.txt
```

## テスト実行コマンド

### 全テスト実行

```bash
# 基本実行
pytest tests/ -v

# カバレッジ付き実行
pytest tests/ -v --cov=common --cov-report=html --cov-report=term

# カバレッジ目標（80%）を満たさない場合は失敗
pytest tests/ --cov=common --cov-report=term --cov-fail-under=80
```

### 特定モジュールのテスト実行

```bash
# 認証モジュールのみ
pytest tests/test_auth.py -v

# データベースモジュールのみ
pytest tests/test_database.py -v

# セキュリティテストのみ
pytest tests/test_security.py -v

# エラーハンドリングテストのみ
pytest tests/test_error_handling.py -v

# バリデーターのみ
pytest tests/test_validators.py -v

# ヘルパー関数のみ
pytest tests/test_helpers.py -v

# ロギングのみ
pytest tests/test_logging.py -v

# ミドルウェアのみ
pytest tests/test_middleware.py -v

# モデルのみ
pytest tests/test_models.py -v
```

### テストキーワード検索

```bash
# セキュリティ関連のテストのみ
pytest tests/ -k "security" -v

# エラー関連のテストのみ
pytest tests/ -k "error" -v

# テナント分離関連のテストのみ
pytest tests/ -k "tenant" -v
```

### マーカーによるフィルタリング

```bash
# 非同期テストのみ
pytest tests/ -m "asyncio" -v

# スローテストをスキップ
pytest tests/ -m "not slow" -v
```

## カバレッジレポート

### HTMLレポート表示

```bash
# カバレッジレポート生成
pytest tests/ --cov=common --cov-report=html

# ブラウザで表示（Linux）
xdg-open htmlcov/index.html

# ブラウザで表示（macOS）
open htmlcov/index.html
```

### カバレッジ不足の特定

```bash
# カバレッジされていない行を表示
pytest tests/ --cov=common --cov-report=term-missing
```

## パフォーマンステスト

### 実行時間の計測

```bash
# 最も遅いテスト10件を表示
pytest tests/ --durations=10

# 全テストの実行時間を表示
pytest tests/ --durations=0
```

## CI/CD統合

### GitHub Actions

`.github/workflows/test.yml`:

```yaml
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
            --cov-fail-under=80 \
            --junitxml=test-results.xml
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml
```

## トラブルシューティング

### テストが失敗する場合

1. **環境変数の確認**
   ```bash
   export JWT_SECRET_KEY="test-secret-key-for-unit-tests-only"
   ```

2. **依存パッケージの確認**
   ```bash
   pip install -r requirements-dev.txt
   ```

3. **詳細なエラー情報を表示**
   ```bash
   pytest tests/ -v --tb=long
   ```

### カバレッジが低い場合

1. **カバレッジされていないファイルを確認**
   ```bash
   pytest tests/ --cov=common --cov-report=term-missing
   ```

2. **テストが不足している機能を特定**
   ```bash
   # HTMLレポートで赤色の行を確認
   pytest tests/ --cov=common --cov-report=html
   open htmlcov/index.html
   ```

## ベストプラクティス

### テスト実装時

- [ ] テストケースにdocstringを記述
- [ ] TC-XXX-XXX形式のテストIDをコメントに含める
- [ ] 正常系、異常系、境界値を網羅
- [ ] モックを適切に使用
- [ ] テストの独立性を保つ（テスト間で状態を共有しない）

### テスト実行時

- [ ] コミット前に全テスト実行
- [ ] カバレッジ80%以上を維持
- [ ] セキュリティテストは必ず実行
- [ ] CI/CDで自動実行される設定

## 参考資料

- [pytest Documentation](https://docs.pytest.org/)
- [pytest-cov Documentation](https://pytest-cov.readthedocs.io/)
- [pytest-asyncio Documentation](https://pytest-asyncio.readthedocs.io/)
- [テストプラン (TEST_PLAN.md)](./TEST_PLAN.md)
