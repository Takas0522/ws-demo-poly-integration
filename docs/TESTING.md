# テスト実行ガイド

このドキュメントでは、統合テストとE2Eテストの実行方法について説明します。

## 目次

1. [前提条件](#前提条件)
2. [全テストの実行](#全テストの実行)
3. [個別テストの実行](#個別テストの実行)
4. [テストレポート](#テストレポート)
5. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

### バックエンドテスト

- Python 3.11+
- 各サービスの依存パッケージがインストール済み
- Cosmos DBエミュレータまたはAzure Cosmos DBへのアクセス（オプション）

```bash
# 各サービスディレクトリで実行
cd src/auth-service
pip install -r requirements.txt

cd src/tenant-management-service
pip install -r requirements.txt

cd src/service-setting-service
pip install -r requirements.txt
```

### フロントエンドテスト

- Node.js 18+
- npm
- Playwright依存関係

```bash
cd src/front
npm install
npx playwright install
```

---

## 全テストの実行

プロジェクトルートから以下のコマンドで全テストを実行できます：

```bash
./scripts/run-tests.sh
```

このスクリプトは以下を順次実行します：

1. 認証認可サービスの統合テスト
2. テナント管理サービスの統合テスト
3. 利用サービス設定サービスの統合テスト
4. フロントエンドE2Eテスト

---

## 個別テストの実行

### バックエンド統合テストのみ

```bash
./scripts/run-backend-tests.sh
```

または個別サービスごとに：

```bash
# 認証認可サービス
cd src/auth-service
pytest tests/integration -v

# テナント管理サービス
cd src/tenant-management-service
pytest tests/integration -v

# 利用サービス設定サービス
cd src/service-setting-service
pytest tests/integration -v
```

### フロントエンドE2Eテストのみ

```bash
./scripts/run-e2e-tests.sh
```

または：

```bash
cd src/front
npm run test:e2e
```

### E2Eテストの各種オプション

```bash
# ブラウザを表示して実行
npm run test:e2e:headed

# デバッグモードで実行
npm run test:e2e:debug

# UIモードで実行（対話的）
npm run test:e2e:ui

# テストレポートを表示
npm run test:e2e:report
```

### 特定のテストファイルのみ実行

```bash
# バックエンド
pytest tests/integration/test_auth_api.py -v

# フロントエンド
npx playwright test tests/e2e/login.spec.ts
```

### 特定のテストケースのみ実行

```bash
# バックエンド
pytest tests/integration/test_auth_api.py::TestAuthenticationAPI::test_login_success -v

# フロントエンド
npx playwright test tests/e2e/login.spec.ts:3  # 3行目のテスト
```

---

## テストレポート

テスト実行後、レポートは以下の場所に保存されます：

### バックエンド統合テスト

- **JUnit XML**: `test-results/*.xml`
- **ログ**: `test-results/*.log`

### フロントエンドE2Eテスト

- **HTMLレポート**: `src/front/test-results/html/`
- **JSON結果**: `src/front/test-results/results.json`
- **スクリーンショット**: `src/front/test-results/` (失敗時のみ)
- **ビデオ**: `src/front/test-results/` (失敗時のみ)

レポートの表示：

```bash
# E2EテストのHTMLレポート
cd src/front
npm run test:e2e:report
```

---

## テスト環境設定

### 環境変数

#### バックエンドテスト

```bash
# .env または環境変数として設定
export COSMOS_ENDPOINT="https://your-cosmos-account.documents.azure.com:443/"
export COSMOS_KEY="your-cosmos-key"
export JWT_SECRET="test-secret-key"
export TEST_ADMIN_TOKEN="your-test-admin-token"
```

#### フロントエンドテスト

```bash
# 環境変数として設定
export BASE_URL="http://localhost:3000"
```

---

## テスト構成

### バックエンド統合テスト

```
src/{service-name}/
├── tests/
│   └── integration/
│       ├── conftest.py          # pytest設定とフィクスチャ
│       ├── test_auth_api.py     # 認証APIテスト
│       ├── test_user_api.py     # ユーザー管理APIテスト
│       └── test_role_api.py     # ロール管理APIテスト
└── pytest.ini                   # pytest設定ファイル
```

### フロントエンドE2Eテスト

```
src/front/
├── tests/
│   └── e2e/
│       ├── fixtures/
│       │   └── auth.fixture.ts  # 認証フィクスチャ
│       ├── utils/
│       │   └── test-helpers.ts  # テストヘルパー関数
│       ├── login.spec.ts        # ログインフローテスト
│       ├── tenant-management.spec.ts  # テナント管理テスト
│       └── user-management.spec.ts    # ユーザー管理テスト
└── playwright.config.ts         # Playwright設定
```

---

## トラブルシューティング

### バックエンドテスト

#### Cosmos DB接続エラー

```
Error: Unable to connect to Cosmos DB
```

**解決策**:
- Cosmos DBエミュレータが起動しているか確認
- または、環境変数 `COSMOS_ENDPOINT` と `COSMOS_KEY` が正しく設定されているか確認

#### 認証エラー

```
Error: Invalid token
```

**解決策**:
- テストユーザー（admin@example.com）がデータベースに存在するか確認
- JWTシークレットキーが正しく設定されているか確認

### フロントエンドテスト

#### ブラウザが起動しない

```
Error: browserType.launch: Executable doesn't exist
```

**解決策**:
```bash
npx playwright install
```

#### タイムアウトエラー

```
Error: Timeout 30000ms exceeded
```

**解決策**:
- バックエンドサービスが起動しているか確認
- `playwright.config.ts` のタイムアウト設定を増やす

#### 要素が見つからない

```
Error: locator.click: Target closed
```

**解決策**:
- セレクタが正しいか確認
- ページの読み込みを待つ `waitForLoadState()` を追加
- デバッグモードで実行して確認: `npm run test:e2e:debug`

---

## CI/CD統合

### GitHub Actions

```yaml
name: Run Tests

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
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Run all tests
        run: ./scripts/run-tests.sh
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

---

## ベストプラクティス

1. **テストを並列実行しない**: データベースの状態に依存するため、順次実行を推奨
2. **適切なクリーンアップ**: テスト後はテストデータを削除
3. **モックの活用**: 外部サービスへの依存を最小限に
4. **明確な命名**: テストケース名は何をテストしているか明確に
5. **独立性**: 各テストは他のテストに依存しないように設計

---

## 参考資料

- [Playwright ドキュメント](https://playwright.dev/)
- [pytest ドキュメント](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
