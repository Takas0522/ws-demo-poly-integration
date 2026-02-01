# タスク: CI/CDパイプライン構築

## 概要
GitHub Actionsを使用したCI/CDパイプラインを構築します。自動テスト、ビルド、デプロイメントを実現し、継続的インテグレーション・デリバリーを可能にします。

## 対象コンポーネント
- GitHub Actions ワークフロー (`.github/workflows`)
- 全サービス

## 前提条件
- タスク01 (インフラ基盤構築) が完了
- タスク20 (サービス間連携テスト) が完了
- GitHubリポジトリが設定済み
- Azureサブスクリプションへのアクセス権限

## 実装内容

### 1. ワークフロー構成

```
.github/
└── workflows/
    ├── ci.yml                      # CI（リント、テスト）
    ├── deploy-infra.yml            # インフラデプロイ
    ├── deploy-backend.yml          # Backendサービスデプロイ
    ├── deploy-frontend.yml         # Frontendデプロイ
    ├── security-scan.yml           # セキュリティスキャン
    └── release.yml                 # リリース管理
```

### 2. CI ワークフロー実装

#### 2.1 .github/workflows/ci.yml
```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  lint-backend:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service:
          - auth-service
          - tenant-management-service
          - service-setting-service
          - file-service
          - messaging-service
          - api-service
          - backup-service
    
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install dependencies
        working-directory: ./src/${{ matrix.service }}
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
      
      - name: Lint with ruff
        working-directory: ./src/${{ matrix.service }}
        run: ruff check .
      
      - name: Type check with mypy
        working-directory: ./src/${{ matrix.service }}
        run: mypy app/
      
      - name: Test
        working-directory: ./src/${{ matrix.service }}
        run: pytest tests/ --cov=app --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./src/${{ matrix.service }}/coverage.xml
          flags: ${{ matrix.service }}

  lint-frontend:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: ./src/front/package-lock.json
      
      - name: Install dependencies
        working-directory: ./src/front
        run: npm ci
      
      - name: Lint
        working-directory: ./src/front
        run: npm run lint
      
      - name: Type check
        working-directory: ./src/front
        run: npm run type-check
      
      - name: Test
        working-directory: ./src/front
        run: npm run test
      
      - name: Build
        working-directory: ./src/front
        run: npm run build
  
  integration-test:
    runs-on: ubuntu-latest
    needs: [lint-backend, lint-frontend]
    
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true
      
      - name: Start services
        run: docker-compose -f docker-compose.test.yml up -d
      
      - name: Wait for services
        run: |
          sleep 30
          curl --retry 10 --retry-delay 5 http://localhost:8001/health
      
      - name: Run integration tests
        run: pytest tests/integration
      
      - name: Run E2E tests
        run: npx playwright test
      
      - name: Shutdown services
        if: always()
        run: docker-compose -f docker-compose.test.yml down
```

### 3. インフラデプロイワークフロー

#### 3.1 .github/workflows/deploy-infra.yml
```yaml
name: Deploy Infrastructure

on:
  push:
    branches: [main]
    paths:
      - 'infra/**'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        type: choice
        options:
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'staging' }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Validate Bicep
        run: |
          az bicep build --file ./infra/main.bicep
      
      - name: What-If Analysis
        run: |
          az deployment sub what-if \
            --subscription-id ${{ secrets.AZURE_SUBSCRIPTION_ID }} \
            --location japaneast \
            --template-file ./infra/main.bicep \
            --parameters ./infra/parameters/${{ github.event.inputs.environment || 'staging' }}.bicepparam
      
      - name: Deploy Bicep
        uses: azure/arm-deploy@v1
        with:
          subscriptionId: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          scope: subscription
          region: japaneast
          template: ./infra/main.bicep
          parameters: ./infra/parameters/${{ github.event.inputs.environment || 'staging' }}.bicepparam
          failOnStdErr: false
          deploymentName: 'infra-${{ github.run_number }}'
      
      - name: Get deployment outputs
        id: outputs
        run: |
          az deployment sub show \
            --name infra-${{ github.run_number }} \
            --query 'properties.outputs' \
            --output json > outputs.json
          cat outputs.json
      
      - name: Upload outputs
        uses: actions/upload-artifact@v3
        with:
          name: deployment-outputs
          path: outputs.json
```

### 4. バックエンドデプロイワークフロー

#### 4.1 .github/workflows/deploy-backend.yml
```yaml
name: Deploy Backend Services

on:
  push:
    branches: [main]
    paths:
      - 'src/auth-service/**'
      - 'src/tenant-management-service/**'
      - 'src/service-setting-service/**'
      - 'src/*-service/**'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment'
        required: true
        type: choice
        options:
          - staging
          - production
      service:
        description: 'Service to deploy'
        required: true
        type: choice
        options:
          - auth-service
          - tenant-management-service
          - service-setting-service
          - file-service
          - messaging-service
          - api-service
          - backup-service
          - all

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'staging' }}
    strategy:
      matrix:
        service: ${{ github.event.inputs.service == 'all' && fromJson('["auth-service", "tenant-management-service", "service-setting-service", "file-service", "messaging-service", "api-service", "backup-service"]') || fromJson(format('["{0}"]', github.event.inputs.service)) }}
    
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Build application
        working-directory: ./src/${{ matrix.service }}
        run: |
          pip install -r requirements.txt --target .python_packages/lib/site-packages
          zip -r deploy.zip . -x "*.git*" -x "*__pycache__*" -x "tests/*"
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy to staging slot
        uses: azure/webapps-deploy@v2
        with:
          app-name: app-${{ matrix.service }}-${{ github.event.inputs.environment || 'staging' }}
          slot-name: staging
          package: ./src/${{ matrix.service }}/deploy.zip
      
      - name: Health check on staging slot
        run: |
          for i in {1..10}; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
              https://app-${{ matrix.service }}-${{ github.event.inputs.environment || 'staging' }}-staging.azurewebsites.net/health)
            if [ $STATUS -eq 200 ]; then
              echo "Health check passed"
              exit 0
            fi
            echo "Waiting for service to be ready... (attempt $i)"
            sleep 10
          done
          echo "Health check failed"
          exit 1
      
      - name: Swap slots
        run: |
          az webapp deployment slot swap \
            --name app-${{ matrix.service }}-${{ github.event.inputs.environment || 'staging' }} \
            --resource-group rg-management-app-${{ github.event.inputs.environment || 'staging' }} \
            --slot staging \
            --target-slot production
      
      - name: Final health check
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            https://app-${{ matrix.service }}-${{ github.event.inputs.environment || 'staging' }}.azurewebsites..net/health)
          if [ $STATUS -ne 200 ]; then
            echo "Production health check failed, rolling back..."
            az webapp deployment slot swap \
              --name app-${{ matrix.service }}-${{ github.event.inputs.environment || 'staging' }} \
              --resource-group rg-management-app-${{ github.event.inputs.environment || 'staging' }} \
              --slot production \
              --target-slot staging
            exit 1
          fi
          echo "Deployment successful"
      
      - name: Configure App Settings
        run: |
          az webapp config appsettings set \
            --name app-${{ matrix.service }}-${{ github.event.inputs.environment || 'staging' }} \
            --resource-group rg-management-app-${{ github.event.inputs.environment || 'staging' }} \
            --settings \
              JWT_SECRET_KEY="${{ secrets.JWT_SECRET_KEY }}" \
              COSMOS_DB_CONNECTION_STRING="${{ secrets.COSMOS_DB_CONNECTION_STRING }}" \
              SERVICE_SHARED_SECRET="${{ secrets.SERVICE_SHARED_SECRET }}" \
              APPINSIGHTS_INSTRUMENTATIONKEY="${{ secrets.APPINSIGHTS_INSTRUMENTATIONKEY }}" \
              ENVIRONMENT="${{ github.event.inputs.environment || 'staging' }}"
```

### 5. フロントエンドデプロイワークフロー

#### 5.1 .github/workflows/deploy-frontend.yml
```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'src/front/**'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment'
        required: true
        type: choice
        options:
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'staging' }}
    
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: ./src/front/package-lock.json
      
      - name: Install dependencies
        working-directory: ./src/front
        run: npm ci
      
      - name: Build
        working-directory: ./src/front
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
          AUTH_SERVICE_URL: ${{ secrets.AUTH_SERVICE_URL }}
          TENANT_SERVICE_URL: ${{ secrets.TENANT_SERVICE_URL }}
        run: npm run build
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: app-frontend-${{ github.event.inputs.environment || 'staging' }}
          package: ./src/front
```

### 6. セキュリティスキャンワークフロー

#### 6.1 .github/workflows/security-scan.yml
```yaml
name: Security Scan

on:
  schedule:
    - cron: '0 0 * * 0'  # 毎週日曜日
  workflow_dispatch:

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
  
  secret-scan:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
```

### 7. GitHub Secrets設定

#### 7.1 必要なSecrets
```bash
# Azure認証
AZURE_CREDENTIALS              # サービスプリンシパル
AZURE_SUBSCRIPTION_ID          # サブスクリプションID

# アプリケーション
JWT_SECRET_KEY                 # JWT署名キー
SERVICE_SHARED_SECRET          # サービス間通信秘密鍵
COSMOS_DB_CONNECTION_STRING    # Cosmos DB接続文字列
APPINSIGHTS_INSTRUMENTATIONKEY # Application Insights

# サービスURL (Staging)
AUTH_SERVICE_URL               # 認証サービスURL
TENANT_SERVICE_URL             # テナント管理サービスURL
SERVICE_SETTING_URL            # サービス設定URL
API_URL                        # Frontend用公開API URL

# サービスURL (Production)
PROD_AUTH_SERVICE_URL
PROD_TENANT_SERVICE_URL
PROD_SERVICE_SETTING_URL
PROD_API_URL
```

#### 7.2 Secrets設定スクリプト
```bash
#!/bin/bash
# scripts/setup-github-secrets.sh

gh secret set AZURE_CREDENTIALS --body "$(cat azure-credentials.json)"
gh secret set AZURE_SUBSCRIPTION_ID --body "xxx"
gh secret set JWT_SECRET_KEY --body "$(openssl rand -base64 32)"
gh secret set SERVICE_SHARED_SECRET --body "$(openssl rand -base64 32)"
# ...
```

### 8. ブランチ保護ルール設定

```
main ブランチ:
- Require pull request reviews (1 approval)
- Require status checks to pass:
  - lint-backend
  - lint-frontend
  - integration-test
- Require branches to be up to date
- Include administrators
```

## 完了条件

- [ ] CIワークフローが実装される
- [ ] インフラデプロイワークフローが実装される
- [ ] バックエンドデプロイワークフローが実装される
- [ ] フロントエンドデプロイワークフローが実装される
- [ ] セキュリティスキャンワークフローが実装される
- [ ] 全てのGitHub Secretsが設定される
- [ ] ブランチ保護ルールが設定される
- [ ] PRでCIが自動実行される
- [ ] mainブランチへのマージでデプロイが実行される
- [ ] デプロイに失敗した場合の自動ロールバックが動作する
- [ ] README.mdが作成される

## 依存タスク
- 01. インフラ基盤構築
- 20. サービス間連携テスト

## 後続タスク
- 22. デプロイメント設定
- 23. モニタリング・ロギング設定

## 技術的考慮事項

### セキュリティ
- Secretsの適切な管理
- サービスプリンシパルの最小権限
- デプロイ履歴の監査

### 信頼性
- デプロイ前の自動テスト
- ヘルスチェック
- 自動ロールバック

### 効率性
- キャッシュの活用
- 並列実行
- 変更検知による部分デプロイ

## 参照ドキュメント
- [デプロイメント設計 - CI/CDパイプライン](../../arch/deployment/README.md#3-cicdパイプライン)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Azure CLI Documentation](https://docs.microsoft.com/cli/azure/)

## 見積もり工数
- ワークフロー実装: 2日
- Secrets設定: 0.5日
- テスト・調整: 1日
- **合計**: 3.5日

## 備考
- Phase 1ではStagingへの自動デプロイのみ
- Productionは手動承認後にデプロイ
- Phase 2でカナリアデプロイなどの高度な戦略を導入
