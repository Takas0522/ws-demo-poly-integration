# インフラストラクチャ

このディレクトリには、管理アプリケーションのAzureインフラストラクチャを定義するBicepテンプレートが含まれています。

## ディレクトリ構成

```
infra/
├── main.bicep                     # エントリポイント
├── parameters/
│   ├── dev.bicepparam            # Dev環境パラメータ
│   ├── staging.bicepparam        # Staging環境パラメータ
│   └── production.bicepparam     # Production環境パラメータ
├── modules/
│   ├── app-service-plan.bicep    # App Service Planモジュール
│   ├── app-service.bicep         # App Serviceモジュール
│   ├── cosmos-db.bicep           # Cosmos DBモジュール
│   └── app-insights.bicep        # Application Insightsモジュール
├── scripts/
│   ├── deploy.sh                 # デプロイスクリプト
│   ├── destroy.sh                # リソース削除スクリプト
│   └── validate.sh               # テンプレート検証スクリプト
└── outputs/                       # デプロイ出力値（自動生成）
```

## 構築されるリソース

### App Services (8つ)
- **Frontend**: Next.jsアプリケーション (Node.js 20)
- **Auth Service**: 認証認可サービス (Python 3.11)
- **Tenant Management Service**: テナント管理サービス (Python 3.11)
- **Service Setting Service**: サービス設定サービス (Python 3.11)
- **File Service**: ファイルサービスモック (Python 3.11)
- **Messaging Service**: メッセージングサービスモック (Python 3.11)
- **API Service**: APIサービスモック (Python 3.11)
- **Backup Service**: バックアップサービスモック (Python 3.11)

### Cosmos DB
- **データベース**: management-app
- **コンテナ**: 7つ（auth, tenant, service-setting, file-service, messaging-service, api-service, backup-service）
- **パーティションキー**: すべて `/tenantId`
- **スケーリング**: 自動スケール（最小400RU/s〜最大4000RU/s）
- **バックアップ**: 継続的バックアップ（30日間）

### Application Insights
- すべてのApp Serviceの監視
- ログ分析
- パフォーマンスメトリクス

## 前提条件

1. **Azure CLI**: インストールと認証が必要
```bash
# Azure CLIのインストール確認
az --version

# Azureにログイン
az login

# サブスクリプションの確認
az account show
```

2. **Bicep CLI**: Azure CLIに含まれています
```bash
# Bicepバージョン確認
az bicep version
```

## 使用方法

### 1. テンプレートの検証

デプロイ前に、Bicepテンプレートの構文と設定を検証します。

```bash
# すべての環境を検証
./scripts/validate.sh

# 特定の環境のみ検証
./scripts/validate.sh staging
```

### 2. デプロイ

指定した環境にリソースをデプロイします。

```bash
# Staging環境にデプロイ
./scripts/deploy.sh staging

# Production環境にデプロイ
./scripts/deploy.sh production
```

デプロイスクリプトは以下を実行します：
1. Azureログイン状態の確認
2. What-If分析の実行（どのリソースが作成/変更されるか表示）
3. 確認プロンプト
4. デプロイの実行
5. 出力値の保存（`outputs/` ディレクトリ）

### 3. リソースの削除

環境全体のリソースを削除します。

```bash
# Staging環境のリソースを削除
./scripts/destroy.sh staging
```

⚠️ **警告**: この操作は取り消せません。すべてのデータが削除されます。

## デプロイ後の設定

デプロイが完了したら、以下の設定が必要です：

### 1. 出力値の確認

デプロイ完了後、`outputs/<environment>-outputs.json` に出力値が保存されます。

```bash
# 出力値を確認
cat outputs/staging-outputs.json
```

主な出力値：
- `resourceGroupName`: リソースグループ名
- `cosmosDbConnectionString`: Cosmos DB接続文字列
- `appInsightsInstrumentationKey`: Application Insightsキー
- `frontendUrl`: フロントエンドURL
- `authServiceUrl`: 認証サービスURL

### 2. App Serviceの環境変数設定

各App Serviceに環境変数を設定します：

```bash
# 認証サービスの環境変数設定例
az webapp config appsettings set \
  --name app-auth-staging \
  --resource-group rg-management-app-staging \
  --settings \
    JWT_SECRET_KEY="<strong-random-key>" \
    COSMOS_DB_CONNECTION_STRING="<from-outputs.json>" \
    SERVICE_SHARED_SECRET="<strong-random-key>" \
    ENVIRONMENT="staging" \
    LOG_LEVEL="INFO" \
    APPINSIGHTS_INSTRUMENTATIONKEY="<from-outputs.json>"
```

### 3. シークレットの生成

**重要**: デフォルトのシークレットは本番環境で必ず変更してください。

```bash
# 強力なシークレット生成
openssl rand -base64 48
```

## ローカル開発環境

開発環境では、Cosmos DB Emulatorを使用します。

### Cosmos DB Emulator

DevContainer内で自動的に起動します。

**接続文字列**:
```
AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==
```

**管理画面**: https://localhost:8081/_explorer/index.html

### 環境変数設定

各サービスディレクトリに `.env.example` テンプレートがあります：

```bash
cd src/auth-service
cp .env.example .env
# .envファイルを編集（必要に応じて）
```

## セキュリティ設定

本インフラストラクチャには、以下のセキュリティ対策が実装されています。

### 1. IP制限 (Cosmos DB)

Cosmos DBへのアクセスは、許可されたIPアドレス範囲からのみ可能です。

**設定方法**:
- パラメータファイル（`staging.bicepparam`, `production.bicepparam`）で `cosmosDbAllowedIpRanges` を設定
- Azure App Serviceからのアクセスは `networkAclBypass: 'AzureServices'` により自動的に許可されます
- ローカル開発環境のIPアドレスを追加してください

```bicep
// 例: staging.bicepparam
param cosmosDbAllowedIpRanges = [
  '203.0.113.0/24'  // オフィスのIP範囲
  '198.51.100.0/24' // VPNのIP範囲
]
```

**注意**: 
- 開発環境（`dev.bicepparam`）では空配列が設定されており、ローカル開発を容易にしています
- 本番環境では必ずIP制限を設定してください

### 2. シークレット管理

JWT秘密鍵やサービス間共有シークレットなどの機密情報は、Azure Key Vaultで管理されます。

**安全な運用方法**:
1. **パラメータファイルにシークレットを記載しない**: `staging.bicepparam` と `production.bicepparam` にはシークレット値を含めません
2. **デプロイ時に指定**: コマンドラインで secure パラメータとして渡します

```bash
# デプロイ時にシークレットを指定
az deployment sub create \
  --location japaneast \
  --template-file infra/main.bicep \
  --parameters infra/parameters/staging.bicepparam \
  --parameters jwtSecretKey='<強力なランダム文字列>' \
               serviceSharedSecret='<強力なランダム文字列>'
```

3. **シークレット生成**: 強力なランダム文字列を生成するスクリプトを使用します

```bash
# シークレット生成スクリプト
bash infra/scripts/generate-secrets.sh
```

**開発環境の例外**:
- `dev.bicepparam` にはデフォルトのシークレットが含まれています（ローカル開発用）
- これらのシークレットは本番環境では絶対に使用しないでください

### 3. CORS設定

各バックエンドサービスは、Frontendアプリケーションからのクロスオリジンリクエストのみを許可します。

**実装**:
- すべてのApp Service（Auth, Tenant Management, Service Setting, Mock Services）でCORS設定が有効
- 許可されるオリジン: Frontend App ServiceのURL（`https://app-frontend-<environment>.azurewebsites.net`）
- `supportCredentials: true`: 認証情報付きリクエストに対応

```bicep
// 例: Auth Service
cors: {
  allowedOrigins: [
    'https://${frontendApp.outputs.defaultHostName}'
  ]
  supportCredentials: true
}
```

**注意**:
- ワイルドカード（`*`）は使用していません
- Frontend自体はブラウザから直接アクセスされるため、CORS設定は不要です

### 4. HTTPS/TLS設定

すべてのApp Serviceで以下のセキュリティ設定が有効です：

- **HTTPS強制**: `httpsOnly: true`
- **最小TLSバージョン**: `minTlsVersion: '1.2'`
- **FTP無効化**: `ftpsState: 'Disabled'`

### 5. マネージドID

各App ServiceはSystem-Assigned Managed Identityを使用してKey Vaultにアクセスします。

**利点**:
- パスワードや接続文字列の管理が不要
- 自動的にローテーションされる認証情報
- Azure ADによる認証

### 6. ネットワークセキュリティのベストプラクティス

**実装済み**:
- ✅ Cosmos DB IP制限
- ✅ CORS設定（Frontend URLのみ許可）
- ✅ HTTPS強制
- ✅ TLS 1.2以上
- ✅ Key Vaultによるシークレット管理
- ✅ Managed Identity

**今後の改善**（本番運用に向けて）:
- Virtual Network統合の検討
- Private Endpointの使用
- Azure Front Doorによるグローバル配信とWAF
- DDoS Protection

## コスト見積もり

### Staging/Production環境（月額）

| リソース | SKU | 月額（USD） |
|---------|-----|------------|
| App Service Plan | B1 (Linux) | $13 |
| App Services × 8 | - | $0 (Plan共有) |
| Cosmos DB | 400-4000 RU/s | $24 |
| Application Insights | Basic | $5 |
| Key Vault | Standard | $1 |
| **合計** | | **$43** |

- 実際のコストは使用状況により変動します
- Cosmos DBは自動スケールで未使用時は最小RUに縮小
- 複数App ServiceがPlan共有でコスト削減

## トラブルシューティング

### デプロイが失敗する

1. **Azure CLI認証確認**:
```bash
az account show
```

2. **Bicep検証実行**:
```bash
./scripts/validate.sh staging
```

3. **エラーログ確認**:
```bash
az deployment sub show --name <deployment-name>
```

### リソース名の競合

Cosmos DBアカウント名は全世界で一意である必要があります。エラーが出た場合は、`main.bicep` で名前を変更してください：

```bicep
name: 'cosmos-management-app-${environment}-${uniqueString(rg.id)}'
```

### 権限エラー

デプロイには以下のAzure権限が必要です：
- サブスクリプションレベルでのリソースグループ作成権限
- リソースグループ内でのリソース作成権限

## CI/CD統合

GitHub Actionsでのデプロイ例：

```yaml
- name: Deploy Infrastructure
  uses: azure/arm-deploy@v1
  with:
    subscriptionId: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
    scope: subscription
    template: ./infra/main.bicep
    parameters: ./infra/parameters/staging.bicepparam
    failOnStdErr: false
```

## 参照ドキュメント

- [Azure Bicep ドキュメント](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [Azure App Service ドキュメント](https://docs.microsoft.com/azure/app-service/)
- [Cosmos DB ドキュメント](https://docs.microsoft.com/azure/cosmos-db/)
- [デプロイメント設計](../docs/arch/deployment/README.md)

## サポート

問題が発生した場合は、以下を確認してください：
1. `./scripts/validate.sh` の実行結果
2. Azure Portal でのリソース状態
3. `outputs/` ディレクトリの出力値
4. デプロイメント履歴とログ
