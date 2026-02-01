#!/bin/bash

# デプロイスクリプト

set -e

# 色付きログ用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 使用方法を表示
usage() {
    echo "Usage: $0 <environment>"
    echo "  environment: dev, staging, production"
    exit 1
}

# 引数チェック
if [ $# -ne 1 ]; then
    usage
fi

ENVIRONMENT=$1
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
INFRA_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
BICEP_FILE="$INFRA_DIR/main.bicep"
PARAM_FILE="$INFRA_DIR/parameters/${ENVIRONMENT}.bicepparam"

# 環境の検証
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    usage
fi

# ファイル存在チェック
if [ ! -f "$BICEP_FILE" ]; then
    log_error "Bicep file not found: $BICEP_FILE"
    exit 1
fi

if [ ! -f "$PARAM_FILE" ]; then
    log_error "Parameter file not found: $PARAM_FILE"
    exit 1
fi

log_info "Starting deployment for environment: $ENVIRONMENT"
log_info "Bicep file: $BICEP_FILE"
log_info "Parameter file: $PARAM_FILE"

# Azure CLIのインストール確認
if ! command -v az &> /dev/null; then
    log_error "Azure CLI is not installed. Please install it first."
    exit 1
fi

# Azure ログイン確認
log_info "Checking Azure login status..."
if ! az account show &> /dev/null; then
    log_warn "Not logged in to Azure. Please login."
    az login
fi

# サブスクリプション確認
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
log_info "Using subscription: $SUBSCRIPTION_NAME ($SUBSCRIPTION_ID)"

# 確認プロンプト
if [ "$ENVIRONMENT" == "production" ]; then
    log_warn "You are about to deploy to PRODUCTION environment!"
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        log_info "Deployment cancelled."
        exit 0
    fi
fi

# What-If実行
log_info "Running What-If analysis..."
az deployment sub what-if \
    --location japaneast \
    --template-file "$BICEP_FILE" \
    --parameters "$PARAM_FILE" \
    --name "deployment-whatif-$(date +%Y%m%d-%H%M%S)"

# What-If結果の確認
read -p "Do you want to proceed with deployment? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    log_info "Deployment cancelled."
    exit 0
fi

# デプロイ実行
DEPLOYMENT_NAME="deployment-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"
log_info "Starting deployment: $DEPLOYMENT_NAME"

az deployment sub create \
    --location japaneast \
    --template-file "$BICEP_FILE" \
    --parameters "$PARAM_FILE" \
    --name "$DEPLOYMENT_NAME" \
    --verbose

# デプロイ結果の確認
if [ $? -eq 0 ]; then
    log_info "Deployment completed successfully!"
    
    # 基本情報のみ取得（シークレットは含まない）
    log_info "Retrieving deployment outputs..."
    
    RESOURCE_GROUP=$(az deployment sub show --name "$DEPLOYMENT_NAME" --query 'properties.outputs.resourceGroupName.value' -o tsv)
    FRONTEND_URL=$(az deployment sub show --name "$DEPLOYMENT_NAME" --query 'properties.outputs.frontendUrl.value' -o tsv)
    AUTH_URL=$(az deployment sub show --name "$DEPLOYMENT_NAME" --query 'properties.outputs.authServiceUrl.value' -o tsv)
    KEY_VAULT_NAME=$(az deployment sub show --name "$DEPLOYMENT_NAME" --query 'properties.outputs.keyVaultName.value' -o tsv)
    KEY_VAULT_URI=$(az deployment sub show --name "$DEPLOYMENT_NAME" --query 'properties.outputs.keyVaultUri.value' -o tsv)
    
    # デプロイサマリーを表示
    echo ""
    log_info "=== Deployment Summary ==="
    echo "Resource Group: $RESOURCE_GROUP"
    echo "Frontend URL: https://$FRONTEND_URL"
    echo "Auth Service URL: https://$AUTH_URL"
    echo "Key Vault Name: $KEY_VAULT_NAME"
    echo "Key Vault URI: $KEY_VAULT_URI"
    echo ""
    
    log_info "🔒 Security Notice 🔒"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "シークレット情報はセキュリティのため、Key Vaultに保存されています。"
    echo ""
    echo "App Serviceの環境変数を設定するには、以下のコマンドを使用してください："
    echo ""
    echo "# Cosmos DB接続文字列の設定例（Auth Service）"
    echo "az webapp config appsettings set \\"
    echo "  --name app-auth-${environment} \\"
    echo "  --resource-group $RESOURCE_GROUP \\"
    echo "  --settings COSMOS_DB_CONNECTION_STRING=\"@Microsoft.KeyVault(VaultName=$KEY_VAULT_NAME;SecretName=cosmos-db-connection-string)\""
    echo ""
    echo "# Application Insights キーの設定例"
    echo "az webapp config appsettings set \\"
    echo "  --name app-auth-${environment} \\"
    echo "  --resource-group $RESOURCE_GROUP \\"
    echo "  --settings APPINSIGHTS_INSTRUMENTATIONKEY=\"@Microsoft.KeyVault(VaultName=$KEY_VAULT_NAME;SecretName=app-insights-instrumentation-key)\""
    echo ""
    echo "# JWT Secret Keyの設定例"
    echo "az webapp config appsettings set \\"
    echo "  --name app-auth-${environment} \\"
    echo "  --resource-group $RESOURCE_GROUP \\"
    echo "  --settings JWT_SECRET_KEY=\"@Microsoft.KeyVault(VaultName=$KEY_VAULT_NAME;SecretName=jwt-secret-key)\""
    echo ""
    echo "利用可能なシークレット名："
    echo "  - cosmos-db-connection-string"
    echo "  - app-insights-instrumentation-key"
    echo "  - jwt-secret-key"
    echo "  - service-shared-secret"
    echo ""
    echo "シークレットの値を直接確認する場合（管理者のみ）："
    echo "az keyvault secret show --vault-name $KEY_VAULT_NAME --name cosmos-db-connection-string --query value -o tsv"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
else
    log_error "Deployment failed!"
    exit 1
fi

log_info "Deployment process completed."
