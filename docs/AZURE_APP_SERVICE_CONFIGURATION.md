# Azure App Service設定ガイド

このガイドは、ステージングおよび本番デプロイのためにAzure App Serviceで環境変数を設定する手順を提供します。

## 📋 目次

- [概要](#概要)
- [前提条件](#前提条件)
- [設定方法](#設定方法)
- [Azure Key Vaultのセットアップ](#azure-key-vaultのセットアップ)
- [アプリケーション設定の構成](#アプリケーション設定の構成)
- [サービス固有の設定](#サービス固有の設定)
- [ベストプラクティス](#ベストプラクティス)
- [監視とトラブルシューティング](#監視とトラブルシューティング)

## 🎯 概要

Azure App Serviceは環境変数を設定するための複数の方法を提供します：
1. **アプリケーション設定**: Azureポータルまたはcli経由で設定されるキー値ペア
2. **Azure Key Vault参照**: 機密値の安全な保存
3. **接続文字列**: データベース接続用の特別な設定
4. **ARMテンプレート**: 繰り返し可能なデプロイのためのInfrastructure as Code

## 🔧 前提条件

Azure App Serviceを設定する前に、以下を確認してください：

- 適切な権限を持つAzureサブスクリプション
- Azure CLIがインストールされている（`az --version`で確認）
- アプリケーション用のリソースグループが作成されている
- App Service Planが作成されている
- 各サービス用のApp Serviceインスタンスが作成されている

### Azure CLIのインストール

```bash
# macOS（Homebrew）
brew install azure-cli

# Windows（MSI経由）
# ダウンロード: https://aka.ms/installazurecliwindows

# Linux（スクリプト経由）
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### Azureへのログイン

```bash
az login
az account set --subscription <サブスクリプションID>
```

## 🔐 Azure Key Vaultのセットアップ

Azure Key Vaultはシークレット、キー、証明書の安全な保管を提供します。

### 1. Key Vaultの作成

```bash
# 変数を設定
RESOURCE_GROUP="saas-management-rg"
KEYVAULT_NAME="saas-mgmt-kv-prod"  # グローバルに一意である必要があります
LOCATION="eastus"

# Key Vaultを作成
az keyvault create \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --enable-rbac-authorization false
```

### 2. Key Vaultにシークレットを保存

```bash
# 強力なJWT秘密鍵を生成
JWT_SECRET=$(openssl rand -base64 64)

# JWT秘密鍵を保存
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name jwt-secret \
  --value "$JWT_SECRET"

# CosmosDBキーを保存（CosmosDBアカウントから取得）
COSMOSDB_KEY=$(az cosmosdb keys list \
  --name <cosmosdbアカウント名> \
  --resource-group $RESOURCE_GROUP \
  --query primaryMasterKey -o tsv)

az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name cosmosdb-key \
  --value "$COSMOSDB_KEY"
```

### 3. App ServiceにKey Vaultへのアクセス権を付与

```bash
# App Serviceのマネージドアイデンティティを有効化
APP_NAME="saas-auth-service-prod"

az webapp identity assign \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# プリンシパルIDを取得
PRINCIPAL_ID=$(az webapp identity show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query principalId -o tsv)

# Key Vaultへのアクセス権を付与
az keyvault set-policy \
  --name $KEYVAULT_NAME \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list
```

## ⚙️ アプリケーション設定の構成

### 方法1: Azureポータル

1. **App Serviceに移動**:
   - [Azureポータル](https://portal.azure.com)に移動
   - App Serviceを選択

2. **構成を開く**:
   - 左メニューで**構成**を選択
   - **アプリケーション設定**タブをクリック

3. **新しい設定を追加**:
   - **+ 新しいアプリケーション設定**をクリック
   - **名前**と**値**を入力
   - **OK**をクリック

4. **Key Vaultシークレットを参照**:
   - 機密値の場合、Key Vault参照を使用：
   ```
   @Microsoft.KeyVault(SecretUri=https://your-keyvault.vault.azure.net/secrets/jwt-secret/)
   ```

5. **変更を保存**:
   - 上部の**保存**をクリック
   - App Serviceが自動的に再起動されます

### 方法2: Azure CLI

```bash
# 共通変数を設定
APP_NAME="saas-auth-service-prod"
RESOURCE_GROUP="saas-management-rg"

# 複数のアプリケーション設定を設定
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV="production" \
    COSMOSDB_ENDPOINT="https://your-cosmosdb.documents.azure.com:443/" \
    COSMOSDB_DATABASE="saas-management-prod" \
    JWT_EXPIRES_IN="8h" \
    JWT_REFRESH_EXPIRES_IN="7d" \
    LOG_LEVEL="warn" \
    LOG_FORMAT="json" \
    ENABLE_API_DOCS="false" \
    ENABLE_DETAILED_ERRORS="false"
```

### 方法3: Key Vault参照を使用したAzure CLI

```bash
# Key Vault URIを取得
KEYVAULT_URI=$(az keyvault show \
  --name $KEYVAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.vaultUri -o tsv)

# Key Vault参照で設定を設定
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    JWT_SECRET="@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/jwt-secret/)" \
    COSMOSDB_KEY="@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/cosmosdb-key/)"
```

### 方法4: ARMテンプレート

繰り返し可能なデプロイのためのARMテンプレートを作成：

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "appServiceName": {
      "type": "string"
    },
    "keyVaultName": {
      "type": "string"
    }
  },
  "resources": [
    {
      "type": "Microsoft.Web/sites/config",
      "apiVersion": "2021-02-01",
      "name": "[concat(parameters('appServiceName'), '/appsettings')]",
      "properties": {
        "NODE_ENV": "production",
        "COSMOSDB_ENDPOINT": "[parameters('cosmosDbEndpoint')]",
        "COSMOSDB_KEY": "[concat('@Microsoft.KeyVault(SecretUri=https://', parameters('keyVaultName'), '.vault.azure.net/secrets/cosmosdb-key/)')]",
        "JWT_SECRET": "[concat('@Microsoft.KeyVault(SecretUri=https://', parameters('keyVaultName'), '.vault.azure.net/secrets/jwt-secret/)')]",
        "JWT_EXPIRES_IN": "8h",
        "LOG_LEVEL": "warn",
        "ENABLE_API_DOCS": "false"
      }
    }
  ]
}
```

## 🚀 サービス固有の設定

### フロントエンドアプリケーション

```bash
APP_NAME="saas-frontend-prod"

az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV="production" \
    VITE_AUTH_SERVICE_URL="https://saas-auth-service-prod.azurewebsites.net" \
    VITE_USER_MANAGEMENT_URL="https://saas-user-mgmt-prod.azurewebsites.net" \
    VITE_SERVICE_SETTINGS_URL="https://saas-service-settings-prod.azurewebsites.net" \
    VITE_FEATURE_USER_CREATE="enabled" \
    VITE_FEATURE_USER_EDIT="enabled" \
    VITE_FEATURE_USER_DELETE="enabled"
```

### 認証サービス

```bash
APP_NAME="saas-auth-service-prod"
KEYVAULT_URI="https://saas-mgmt-kv-prod.vault.azure.net/"

az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV="production" \
    COSMOSDB_ENDPOINT="https://your-cosmosdb.documents.azure.com:443/" \
    COSMOSDB_KEY="@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/cosmosdb-key/)" \
    COSMOSDB_DATABASE="saas-management-prod" \
    JWT_SECRET="@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/jwt-secret/)" \
    JWT_EXPIRES_IN="8h" \
    JWT_REFRESH_EXPIRES_IN="7d" \
    CORS_ORIGINS="https://saas-frontend-prod.azurewebsites.net" \
    LOG_LEVEL="warn" \
    FEATURE_PASSWORD_RESET="enabled" \
    FEATURE_TWO_FACTOR_AUTH="enabled"
```

### ユーザー管理サービス

```bash
APP_NAME="saas-user-mgmt-prod"

az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV="production" \
    COSMOSDB_ENDPOINT="https://your-cosmosdb.documents.azure.com:443/" \
    COSMOSDB_KEY="@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/cosmosdb-key/)" \
    COSMOSDB_DATABASE="saas-management-prod" \
    AUTH_SERVICE_URL="https://saas-auth-service-prod.azurewebsites.net" \
    JWT_SECRET="@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/jwt-secret/)" \
    CORS_ORIGINS="https://saas-frontend-prod.azurewebsites.net" \
    FEATURE_USER_CREATE="enabled" \
    FEATURE_USER_EDIT="enabled" \
    FEATURE_USER_DELETE="enabled" \
    FEATURE_USER_ROLE_ASSIGN="enabled"
```

### サービス設定サービス

```bash
APP_NAME="saas-service-settings-prod"

az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV="production" \
    COSMOSDB_ENDPOINT="https://your-cosmosdb.documents.azure.com:443/" \
    COSMOSDB_KEY="@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/cosmosdb-key/)" \
    COSMOSDB_DATABASE="saas-management-prod" \
    AUTH_SERVICE_URL="https://saas-auth-service-prod.azurewebsites.net" \
    JWT_SECRET="@Microsoft.KeyVault(SecretUri=${KEYVAULT_URI}secrets/jwt-secret/)" \
    FEATURE_SERVICE_CREATE="enabled" \
    FEATURE_SERVICE_EDIT="enabled" \
    FEATURE_SERVICE_DELETE="enabled"
```

## 📊 機能フラグの設定

ステージング環境と本番環境で機能フラグを異なる設定にします：

### ステージング（すべての機能をテスト）

```bash
az webapp config appsettings set \
  --name saas-auth-service-staging \
  --resource-group $RESOURCE_GROUP \
  --settings \
    FEATURE_USER_CREATE="enabled" \
    FEATURE_USER_EDIT="enabled" \
    FEATURE_USER_DELETE="enabled" \
    FEATURE_USER_ROLE_ASSIGN="enabled" \
    FEATURE_SERVICE_CREATE="enabled" \
    FEATURE_SERVICE_EDIT="enabled" \
    FEATURE_SERVICE_DELETE="enabled" \
    FEATURE_PASSWORD_RESET="enabled" \
    FEATURE_EMAIL_VERIFICATION="enabled" \
    FEATURE_TWO_FACTOR_AUTH="enabled" \
    FEATURE_ANALYTICS="enabled" \
    FEATURE_AUDIT_LOGGING="enabled" \
    FEATURE_RATE_LIMITING="enabled"
```

### 本番（保守的なアプローチ）

```bash
az webapp config appsettings set \
  --name saas-auth-service-prod \
  --resource-group $RESOURCE_GROUP \
  --settings \
    FEATURE_USER_CREATE="enabled" \
    FEATURE_USER_EDIT="enabled" \
    FEATURE_USER_DELETE="enabled" \
    FEATURE_PASSWORD_RESET="enabled" \
    FEATURE_TWO_FACTOR_AUTH="enabled" \
    FEATURE_ANALYTICS="enabled" \
    FEATURE_AUDIT_LOGGING="enabled" \
    FEATURE_RATE_LIMITING="enabled"
```

## 🔍 ベストプラクティス

### 1. デプロイスロットの使用

安全なデプロイのためにスロットごとに設定を構成：

```bash
# ステージングスロットを作成
az webapp deployment slot create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot staging

# ステージング固有の設定を構成
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot staging \
  --settings NODE_ENV="staging"

# 設定を「スロット設定」としてマーク（スワップしない）
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --slot-settings NODE_ENV COSMOSDB_DATABASE
```

### 2. 環境固有のKey Vault

各環境で個別のKey Vaultを使用：

- 開発用: `saas-mgmt-kv-dev`
- ステージング用: `saas-mgmt-kv-staging`
- 本番用: `saas-mgmt-kv-prod`

### 3. 命名規則

一貫した命名に従う：
- App Service: `{サービス名}-{環境}` （例: `saas-auth-service-prod`）
- Key Vault: `{アプリ名}-kv-{環境}` （例: `saas-mgmt-kv-prod`）
- シークレット: `{目的}-{リソース}` （例: `jwt-secret`、`cosmosdb-key`）

### 4. アクセス制御

Azure RBACとマネージドアイデンティティを使用：

```bash
# ロールベースアクセスを割り当て
az role assignment create \
  --assignee <ユーザーまたはグループID> \
  --role "Key Vault Secrets User" \
  --scope "/subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<kv-name>"
```

### 5. シークレットローテーション

定期的なシークレットローテーションを実装：

```bash
# 新しいシークレットを生成
NEW_JWT_SECRET=$(openssl rand -base64 64)

# 新しいバージョンとして保存（自動バージョニング）
az keyvault secret set \
  --vault-name $KEYVAULT_NAME \
  --name jwt-secret \
  --value "$NEW_JWT_SECRET"

# App Serviceは自動的に最新バージョンを使用
# テスト後、ローテーション期間後に古いバージョンを無効化
```

## 📈 監視とトラブルシューティング

### Application Insightsを有効化

```bash
# Application Insightsを作成
az monitor app-insights component create \
  --app saas-auth-service-prod-insights \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP

# インストルメンテーションキーを取得
APPINSIGHTS_KEY=$(az monitor app-insights component show \
  --app saas-auth-service-prod-insights \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey -o tsv)

# App Serviceで構成
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="$APPINSIGHTS_KEY"
```

### アプリケーションログの表示

```bash
# ログをリアルタイムでストリーム
az webapp log tail \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# ログをダウンロード
az webapp log download \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --log-file app-logs.zip
```

### 設定の検証

```bash
# すべてのアプリケーション設定を一覧表示
az webapp config appsettings list \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# 特定の設定をテスト
az webapp config appsettings list \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "[?name=='NODE_ENV'].value" -o tsv
```

### よくある問題

**問題**: Key Vault参照が解決されない

**解決策**:
```bash
# マネージドアイデンティティが有効であることを確認
az webapp identity show --name $APP_NAME --resource-group $RESOURCE_GROUP

# Key Vaultアクセスポリシーを確認
az keyvault show --name $KEYVAULT_NAME --resource-group $RESOURCE_GROUP

# シークレットURI形式を確認
# 正しい形式: @Microsoft.KeyVault(SecretUri=https://kv.vault.azure.net/secrets/name/)
# 末尾のスラッシュに注意
```

**問題**: 設定変更後にApp Serviceが再起動しない

**解決策**:
```bash
# 手動で再起動
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP
```

## 🔄 CI/CD統合

GitHub Actionsで環境変数を設定：

```yaml
# .github/workflows/deploy-production.yml
- name: Azure App Service設定を設定
  uses: azure/appservice-settings@v1
  with:
    app-name: ${{ secrets.AZURE_APP_NAME }}
    app-settings-json: |
      [
        {
          "name": "NODE_ENV",
          "value": "production",
          "slotSetting": false
        },
        {
          "name": "JWT_SECRET",
          "value": "@Microsoft.KeyVault(SecretUri=${{ secrets.KV_JWT_SECRET_URI }})",
          "slotSetting": false
        }
      ]
```

## 📚 追加リソース

- [Azure App Service設定](https://docs.microsoft.com/azure/app-service/configure-common)
- [Key Vault参照](https://docs.microsoft.com/azure/app-service/app-service-key-vault-references)
- [マネージドアイデンティティ](https://docs.microsoft.com/azure/app-service/overview-managed-identity)
- [Application Insights](https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview)

---

**最終更新**: 2026-01-09
