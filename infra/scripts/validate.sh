#!/bin/bash

# Bicep テンプレート検証スクリプト

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
    echo "Usage: $0 [environment]"
    echo "  environment: dev, staging, production (optional, default: all)"
    exit 1
}

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
INFRA_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
BICEP_FILE="$INFRA_DIR/main.bicep"

# Azure CLIのインストール確認
if ! command -v az &> /dev/null; then
    log_error "Azure CLI is not installed. Please install it first."
    exit 1
fi

# Bicep ファイルの存在確認
if [ ! -f "$BICEP_FILE" ]; then
    log_error "Bicep file not found: $BICEP_FILE"
    exit 1
fi

# Azure ログイン確認
log_info "Checking Azure login status..."
if ! az account show &> /dev/null; then
    log_warn "Not logged in to Azure. Skipping deployment validation."
    log_info "Performing local syntax check only..."
    SKIP_DEPLOYMENT_VALIDATION=true
else
    SKIP_DEPLOYMENT_VALIDATION=false
fi

# 環境の指定
if [ $# -eq 0 ]; then
    ENVIRONMENTS=("dev" "staging" "production")
else
    ENVIRONMENT=$1
    if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        usage
    fi
    ENVIRONMENTS=("$ENVIRONMENT")
fi

VALIDATION_FAILED=false

# 各環境のパラメータファイルを検証
for ENV in "${ENVIRONMENTS[@]}"; do
    PARAM_FILE="$INFRA_DIR/parameters/${ENV}.bicepparam"
    
    log_info "========================================="
    log_info "Validating environment: $ENV"
    log_info "========================================="
    
    if [ ! -f "$PARAM_FILE" ]; then
        log_error "Parameter file not found: $PARAM_FILE"
        VALIDATION_FAILED=true
        continue
    fi
    
    # Bicep ビルド（構文チェック）
    log_info "Running Bicep build (syntax check)..."
    if az bicep build --file "$BICEP_FILE" --stdout > /dev/null 2>&1; then
        log_info "✓ Bicep syntax check passed"
    else
        log_error "✗ Bicep syntax check failed"
        az bicep build --file "$BICEP_FILE"
        VALIDATION_FAILED=true
        continue
    fi
    
    # Linter実行
    log_info "Running Bicep linter..."
    LINT_OUTPUT=$(az bicep lint --file "$BICEP_FILE" 2>&1 || true)
    if [ -z "$LINT_OUTPUT" ]; then
        log_info "✓ No linting issues found"
    else
        log_warn "Linting warnings/errors:"
        echo "$LINT_OUTPUT"
    fi
    
    # デプロイメント検証（Azureログイン済みの場合のみ）
    if [ "$SKIP_DEPLOYMENT_VALIDATION" = false ]; then
        log_info "Running deployment validation..."
        if az deployment sub validate \
            --location japaneast \
            --template-file "$BICEP_FILE" \
            --parameters "$PARAM_FILE" > /dev/null 2>&1; then
            log_info "✓ Deployment validation passed"
        else
            log_error "✗ Deployment validation failed"
            az deployment sub validate \
                --location japaneast \
                --template-file "$BICEP_FILE" \
                --parameters "$PARAM_FILE"
            VALIDATION_FAILED=true
            continue
        fi
        
        # What-If実行
        log_info "Running What-If analysis..."
        az deployment sub what-if \
            --location japaneast \
            --template-file "$BICEP_FILE" \
            --parameters "$PARAM_FILE" \
            --name "validation-whatif-$(date +%Y%m%d-%H%M%S)" \
            --no-prompt
    else
        log_warn "Skipping deployment validation (not logged in to Azure)"
    fi
    
    echo ""
done

# 結果サマリー
log_info "========================================="
log_info "Validation Summary"
log_info "========================================="

if [ "$VALIDATION_FAILED" = true ]; then
    log_error "❌ Validation FAILED"
    log_error "Please fix the errors above and run validation again."
    exit 1
else
    log_info "✅ All validations PASSED"
    log_info "Bicep templates are ready for deployment."
    exit 0
fi
