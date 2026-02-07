# インフラストラクチャ

Azure Bicep を使用した複数サービス管理アプリケーション PoC の IaC (Infrastructure as Code) 定義です。

## アーキテクチャ

```
Internet → App Service (Next.js Frontend)
              ├── Container App: 認証認可サービス (FastAPI)
              ├── Container App: テナント管理サービス (FastAPI)
              └── Container App: 利用サービス設定サービス (FastAPI)
                      │
                      ▼
              Cosmos DB (3 databases: Serverless)
              └── Key Vault / App Insights / ACR
```

## ディレクトリ構成

```
infra/
├── main.bicep                        # メインテンプレート（エントリポイント）
├── modules/
│   ├── monitoring.bicep              # Log Analytics + Application Insights
│   ├── container-registry.bicep      # Azure Container Registry
│   ├── container-apps.bicep          # Container Apps Environment + 3 Services
│   ├── cosmos-db.bicep               # Cosmos DB (3 databases)
│   ├── app-service-plan.bicep        # App Service Plan
│   ├── app-service.bicep             # App Service (Frontend)
│   └── key-vault.bicep               # Key Vault (Secrets)
├── parameters/
│   ├── dev.bicepparam                # Dev環境パラメータ
│   ├── staging.bicepparam            # Staging環境パラメータ
│   └── production.bicepparam         # Production環境パラメータ
├── scripts/
│   ├── deploy.sh                     # デプロイスクリプト
│   ├── destroy.sh                    # リソース削除スクリプト
│   ├── validate.sh                   # テンプレート検証スクリプト
│   ├── validate-env.sh               # 環境変数検証スクリプト
│   └── generate-secrets.sh           # シークレット生成スクリプト
├── outputs/                          # デプロイ出力値（自動生成）
└── tests/                            # インフラテスト
```

## 構築されるリソース

| リソース種別         | リソース名                          | SKU/構成         | 用途                     |
| -------------------- | ----------------------------------- | ---------------- | ------------------------ |
| Resource Group       | rg-poly-integration-{env}           | -                | リソース管理             |
| Log Analytics        | log-poly-integration-{env}          | PerGB2018        | ログ集約                 |
| Application Insights | appi-poly-integration-{env}         | -                | 監視・メトリクス         |
| Container Registry   | acrpolyintegration{env}             | Basic            | コンテナイメージ管理     |
| Cosmos DB            | cosmos-poly-integration-{env}       | Serverless       | NoSQLデータベース        |
| Container Apps Env   | cae-poly-integration-{env}          | Consumption      | コンテナホスティング環境 |
| Container App        | ca-auth-{env}                       | 0.25 CPU / 0.5Gi | 認証認可サービス         |
| Container App        | ca-tenant-{env}                     | 0.25 CPU / 0.5Gi | テナント管理サービス     |
| Container App        | ca-service-setting-{env}            | 0.25 CPU / 0.5Gi | 利用サービス設定サービス |
| App Service Plan     | plan-poly-integration-{env}         | B1 (Linux)       | Frontend ホスティング    |
| App Service          | app-poly-integration-frontend-{env} | Node.js 20       | Next.js フロントエンド   |
| Key Vault            | kv-poly-integration-{env}           | Standard         | シークレット管理         |

### Cosmos DB データベース構成

| データベース       | コンテナ | パーティションキー | 用途                           |
| ------------------ | -------- | ------------------ | ------------------------------ |
| auth_management    | users    | /id                | ユーザー・ユーザーロール       |
| auth_management    | roles    | /serviceId         | ロール定義                     |
| tenant_management  | tenants  | /id                | テナント・テナントユーザー     |
| service_management | services | /id                | サービス定義・テナントサービス |

## 前提条件

```bash
# Azure CLI のインストール確認
az --version

# Bicep バージョン確認
az bicep version

# Azure にログイン
az login

# サブスクリプションの確認
az account show
```

## 使用方法

### 1. テンプレートの検証

```bash
# すべての環境を検証
./infra/scripts/validate.sh

# 特定の環境のみ検証
./infra/scripts/validate.sh dev
```

### 2. デプロイ

```bash
# Dev環境にデプロイ
./infra/scripts/deploy.sh dev

# Staging環境にデプロイ（シークレットはコマンドラインで指定）
az deployment sub create \
  --location japaneast \
  --template-file infra/main.bicep \
  --parameters infra/parameters/staging.bicepparam \
  --parameters jwtSecretKey='<強力なランダム文字列>' \
               serviceSharedSecret='<強力なランダム文字列>'
```

### 3. Docker イメージのビルドとプッシュ

```bash
# ACR にログイン
az acr login --name acrpolyintegrationdev

# 各サービスのイメージをビルド
docker build -t acrpolyintegrationdev.azurecr.io/auth-service:latest ./src/auth-service
docker build -t acrpolyintegrationdev.azurecr.io/tenant-service:latest ./src/tenant-management-service
docker build -t acrpolyintegrationdev.azurecr.io/service-setting:latest ./src/service-setting-service

# プッシュ
docker push acrpolyintegrationdev.azurecr.io/auth-service:latest
docker push acrpolyintegrationdev.azurecr.io/tenant-service:latest
docker push acrpolyintegrationdev.azurecr.io/service-setting:latest
```

### 4. リソースの削除

```bash
# 環境全体を削除
./infra/scripts/destroy.sh dev
```

⚠️ **警告**: この操作は取り消せません。すべてのデータが削除されます。

## シークレット管理

### シークレット生成

```bash
bash infra/scripts/generate-secrets.sh
```

### Key Vault のシークレット一覧

| シークレット名                   | 用途                             |
| -------------------------------- | -------------------------------- |
| cosmos-db-connection-string      | Cosmos DB 接続文字列             |
| app-insights-instrumentation-key | Application Insights キー        |
| jwt-secret-key                   | JWT 署名用秘密鍵                 |
| service-shared-secret            | サービス間通信の共有シークレット |

## セキュリティ設定

- **HTTPS強制**: すべての App Service / Container Apps で有効
- **TLS 1.2以上**: 最小 TLS バージョン設定
- **Managed Identity**: App Service → Key Vault アクセスに使用
- **Key Vault RBAC**: ロールベースのアクセス制御
- **Cosmos DB IP制限**: `cosmosDbAllowedIpRanges` パラメータで設定
- **CORS設定**: Container Apps は Frontend URL のみ許可
- **Container Apps シークレット**: 環境変数は secretRef 経由でアクセス

## コスト見積もり（月額）

| リソース                       | Dev環境            | Staging/Production |
| ------------------------------ | ------------------ | ------------------ |
| App Service (B1)               | $13                | $13                |
| Container Apps (0.25 vCPU × 3) | ~$0 (ゼロスケール) | ~$30               |
| Cosmos DB (Serverless)         | ~$5                | ~$20               |
| Container Registry (Basic)     | $5                 | $5                 |
| Application Insights           | ~$0                | ~$5                |
| Key Vault                      | ~$1                | ~$1                |
| **合計**                       | **~$24**           | **~$74**           |

## トラブルシューティング

### Bicep ビルドエラー

```bash
az bicep build --file infra/main.bicep
```

### リソース名の重複

Cosmos DB / ACR はグローバルに一意名が必要です。`resourcePrefix` を変更してください。

### Container Apps のイメージ取得失敗

初回デプロイ後に ACR にイメージをプッシュし、Container App を更新してください：

```bash
az containerapp update --name ca-auth-dev \
  --resource-group rg-poly-integration-dev \
  --image acrpolyintegrationdev.azurecr.io/auth-service:latest
```

## 参照ドキュメント

- [デプロイメント設計](../docs/arch/deployment.md)
- [アーキテクチャ概要](../docs/arch/overview.md)
- [データ設計](../docs/arch/data/data-model.md)
- [タスク02: インフラ構築](../docs/PoCアプリ/初期構築/02-インフラ構築.md)
- [Azure Bicep ドキュメント](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)
