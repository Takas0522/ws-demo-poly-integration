#!/bin/bash

# リソース削除スクリプト

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
RESOURCE_GROUP="rg-poly-integration-${ENVIRONMENT}"

# 環境の検証
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    usage
fi

log_warn "⚠️  WARNING ⚠️"
log_warn "This will DELETE all resources in resource group: $RESOURCE_GROUP"
log_warn "This action is IRREVERSIBLE!"

# 確認プロンプト
read -p "Type the environment name '$ENVIRONMENT' to confirm: " -r
echo
if [[ "$REPLY" != "$ENVIRONMENT" ]]; then
    log_info "Deletion cancelled."
    exit 0
fi

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

# リソースグループの存在確認
log_info "Checking if resource group exists..."
if ! az group exists --name "$RESOURCE_GROUP" | grep -q "true"; then
    log_warn "Resource group $RESOURCE_GROUP does not exist."
    exit 0
fi

# リソースグループ内のリソース一覧を表示
log_info "Resources in $RESOURCE_GROUP:"
az resource list --resource-group "$RESOURCE_GROUP" --query "[].{Name:name, Type:type}" -o table

# 最終確認
log_warn "Last chance to cancel!"
read -p "Are you absolutely sure you want to delete all these resources? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    log_info "Deletion cancelled."
    exit 0
fi

# リソースグループを削除
log_info "Deleting resource group: $RESOURCE_GROUP"
az group delete --name "$RESOURCE_GROUP" --yes --no-wait

log_info "Deletion initiated. Resources will be removed in the background."
log_info "You can check the status with: az group show --name $RESOURCE_GROUP"
