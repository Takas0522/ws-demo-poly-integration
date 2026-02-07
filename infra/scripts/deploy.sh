#!/bin/bash

# =============================================================================
# デプロイスクリプト - 複数サービス管理アプリケーション PoC
# =============================================================================
#
# アーキテクチャ:
#   - Frontend: Azure App Service (Next.js)
#   - Backend: Azure Container Apps (Python FastAPI × 3)
#   - Database: Azure Cosmos DB (Serverless, 3 databases)
#   - Registry: Azure Container Registry
#   - Monitoring: Application Insights + Log Analytics
#   - Secrets: Azure Key Vault
# =============================================================================

set -e

# 色付きログ用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_section() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# 使用方法を表示
usage() {
    echo "Usage: $0 <environment> [--skip-confirmation]"
    echo "  environment: dev, staging, production"
    echo "  --skip-confirmation: 確認プロンプトをスキップ"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 staging"
    echo "  $0 production"
    exit 1
}

# 引数チェック
if [ $# -lt 1 ]; then
    usage
fi

ENVIRONMENT=$1
SKIP_CONFIRMATION=${2:-""}
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
INFRA_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
BICEP_FILE="$INFRA_DIR/main.bicep"
PARAM_FILE="$INFRA_DIR/parameters/${ENVIRONMENT}.bicepparam"
OUTPUT_DIR="$INFRA_DIR/outputs"

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

log_section "デプロイ開始: $ENVIRONMENT 環境"
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
if [ "$ENVIRONMENT" == "production" ] && [ "$SKIP_CONFIRMATION" != "--skip-confirmation" ]; then
    log_warn "⚠️  You are about to deploy to PRODUCTION environment!"
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        log_info "Deployment cancelled."
        exit 0
    fi
fi

# What-If実行
log_section "What-If 分析"
log_info "Running What-If analysis..."
az deployment sub what-if \
    --location japaneast \
    --template-file "$BICEP_FILE" \
    --parameters "$PARAM_FILE" \
    --name "deployment-whatif-$(date +%Y%m%d-%H%M%S)"

# What-If結果の確認
if [ "$SKIP_CONFIRMATION" != "--skip-confirmation" ]; then
    read -p "Do you want to proceed with deployment? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        log_info "Deployment cancelled."
        exit 0
    fi
fi

# デプロイ実行
DEPLOYMENT_NAME="deployment-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"
log_section "デプロイ実行: $DEPLOYMENT_NAME"

az deployment sub create \
    --location japaneast \
    --template-file "$BICEP_FILE" \
    --parameters "$PARAM_FILE" \
    --name "$DEPLOYMENT_NAME" \
    --verbose

# デプロイ結果の確認
if [ $? -eq 0 ]; then
    log_info "Deployment completed successfully!"

    # 出力ディレクトリ作成
    mkdir -p "$OUTPUT_DIR"

    # 出力値取得
    log_section "デプロイ結果"

    RESOURCE_GROUP=$(az deployment sub show --name "$DEPLOYMENT_NAME" --query 'properties.outputs.resourceGroupName.value' -o tsv 2>/dev/null || echo "N/A")
    FRONTEND_URL=$(az deployment sub show --name "$DEPLOYMENT_NAME" --query 'properties.outputs.frontendUrl.value' -o tsv 2>/dev/null || echo "N/A")
    AUTH_URL=$(az deployment sub show --name "$DEPLOYMENT_NAME" --query 'properties.outputs.authServiceUrl.value' -o tsv 2>/dev/null || echo "N/A")
    TENANT_URL=$(az deployment sub show --name "$DEPLOYMENT_NAME" --query 'properties.outputs.tenantServiceUrl.value' -o tsv 2>/dev/null || echo "N/A")
    SERVICE_SETTING_URL=$(az deployment sub show --name "$DEPLOYMENT_NAME" --query 'properties.outputs.serviceSettingUrl.value' -o tsv 2>/dev/null || echo "N/A")
    ACR_LOGIN_SERVER=$(az deployment sub show --name "$DEPLOYMENT_NAME" --query 'properties.outputs.containerRegistryLoginServer.value' -o tsv 2>/dev/null || echo "N/A")
    KEY_VAULT_NAME=$(az deployment sub show --name "$DEPLOYMENT_NAME" --query 'properties.outputs.keyVaultName.value' -o tsv 2>/dev/null || echo "N/A")
    COSMOS_DB_NAME=$(az deployment sub show --name "$DEPLOYMENT_NAME" --query 'properties.outputs.cosmosDbName.value' -o tsv 2>/dev/null || echo "N/A")

    # デプロイサマリーを表示
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "                Deployment Summary"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Resource Group:        $RESOURCE_GROUP"
    echo ""
    echo "Frontend URL:          $FRONTEND_URL"
    echo "Auth Service URL:      $AUTH_URL"
    echo "Tenant Service URL:    $TENANT_URL"
    echo "Service Setting URL:   $SERVICE_SETTING_URL"
    echo ""
    echo "Container Registry:    $ACR_LOGIN_SERVER"
    echo "Key Vault:             $KEY_VAULT_NAME"
    echo "Cosmos DB:             $COSMOS_DB_NAME"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # 出力値をファイルに保存
    cat > "$OUTPUT_DIR/${ENVIRONMENT}-outputs.json" <<EOF
{
  "deploymentName": "$DEPLOYMENT_NAME",
  "environment": "$ENVIRONMENT",
  "resourceGroup": "$RESOURCE_GROUP",
  "frontendUrl": "$FRONTEND_URL",
  "authServiceUrl": "$AUTH_URL",
  "tenantServiceUrl": "$TENANT_URL",
  "serviceSettingUrl": "$SERVICE_SETTING_URL",
  "containerRegistryLoginServer": "$ACR_LOGIN_SERVER",
  "keyVaultName": "$KEY_VAULT_NAME",
  "cosmosDbName": "$COSMOS_DB_NAME",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    log_info "Output saved to: $OUTPUT_DIR/${ENVIRONMENT}-outputs.json"

    # 次のステップを表示
    echo ""
    log_section "次のステップ"
    echo ""
    echo "1. Docker イメージをビルドして ACR にプッシュ:"
    echo "   az acr login --name ${ACR_LOGIN_SERVER%%.*}"
    echo "   docker build -t ${ACR_LOGIN_SERVER}/auth-service:latest ./src/auth-service"
    echo "   docker push ${ACR_LOGIN_SERVER}/auth-service:latest"
    echo ""
    echo "2. Container Apps を更新:"
    echo "   az containerapp update --name ca-auth-${ENVIRONMENT} \\   "
    echo "     --resource-group $RESOURCE_GROUP \\   "
    echo "     --image ${ACR_LOGIN_SERVER}/auth-service:latest"
    echo ""
    echo "3. Key Vault シークレットを確認:"
    echo "   az keyvault secret list --vault-name $KEY_VAULT_NAME -o table"
    echo ""

else
    log_error "Deployment failed!"
    exit 1
fi

log_info "Deployment process completed."
