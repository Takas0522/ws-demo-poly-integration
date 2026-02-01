#!/bin/bash

# 環境変数検証スクリプト
# サービスの .env ファイルが適切に設定されているかをチェックします

set -e

# 色付きログ用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
WORKSPACE_DIR=$(cd "$SCRIPT_DIR/../.." && pwd)

# エラーカウンター
ERROR_COUNT=0
WARNING_COUNT=0

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((ERROR_COUNT++))
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNING_COUNT++))
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_section() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# 弱いシークレットパターンをチェック
check_weak_secret() {
    local value=$1
    local var_name=$2
    
    # デフォルト値チェック
    if [[ "$value" == *"your-secret-key"* ]] || \
       [[ "$value" == *"change-in-production"* ]] || \
       [[ "$value" == *"shared-secret-between-services"* ]] || \
       [[ "$value" == "secret" ]] || \
       [[ "$value" == "password" ]]; then
        log_error "$var_name: デフォルト値が使用されています。本番環境では必ず変更してください！"
        return 1
    fi
    
    # 長さチェック（最小32文字）
    if [ ${#value} -lt 32 ]; then
        log_warn "$var_name: シークレットが短すぎます（現在: ${#value}文字、推奨: 32文字以上）"
        return 1
    fi
    
    return 0
}

# 必須変数のチェック
check_required_var() {
    local value=$1
    local var_name=$2
    
    if [ -z "$value" ]; then
        log_error "$var_name: 必須変数が設定されていません"
        return 1
    fi
    
    return 0
}

# .envファイルをチェック
check_env_file() {
    local service_name=$1
    local env_file=$2
    local is_production=${3:-false}
    
    log_section "チェック中: $service_name"
    
    if [ ! -f "$env_file" ]; then
        log_error ".envファイルが見つかりません: $env_file"
        echo ""
        return
    fi
    
    # .envファイルを読み込み
    source "$env_file" 2>/dev/null || {
        log_error ".envファイルの読み込みに失敗しました: $env_file"
        echo ""
        return
    }
    
    # 共通チェック
    check_required_var "$ENVIRONMENT" "ENVIRONMENT"
    check_required_var "$LOG_LEVEL" "LOG_LEVEL"
    
    # Cosmos DB接続文字列チェック
    if [ -n "$COSMOS_DB_CONNECTION_STRING" ]; then
        if [[ "$COSMOS_DB_CONNECTION_STRING" == *"localhost:8081"* ]]; then
            if [ "$is_production" = true ]; then
                log_error "COSMOS_DB_CONNECTION_STRING: 本番環境でlocalhostが使用されています！"
            else
                log_info "COSMOS_DB_CONNECTION_STRING: 開発環境（Emulator）を使用"
            fi
        else
            log_info "COSMOS_DB_CONNECTION_STRING: 設定済み"
        fi
    else
        check_required_var "$COSMOS_DB_CONNECTION_STRING" "COSMOS_DB_CONNECTION_STRING"
    fi
    
    # サービス固有のチェック
    case "$service_name" in
        "auth-service")
            check_required_var "$JWT_SECRET_KEY" "JWT_SECRET_KEY"
            if [ -n "$JWT_SECRET_KEY" ] && [ "$is_production" = true ]; then
                check_weak_secret "$JWT_SECRET_KEY" "JWT_SECRET_KEY"
            fi
            
            check_required_var "$JWT_ALGORITHM" "JWT_ALGORITHM"
            check_required_var "$JWT_EXPIRE_MINUTES" "JWT_EXPIRE_MINUTES"
            ;;
    esac
    
    # Service Shared Secretチェック（全サービス）
    if [ -n "$SERVICE_SHARED_SECRET" ]; then
        if [ "$is_production" = true ]; then
            check_weak_secret "$SERVICE_SHARED_SECRET" "SERVICE_SHARED_SECRET"
        fi
    fi
    
    # 本番環境でのENVIRONMENTチェック
    if [ "$is_production" = true ] && [ "$ENVIRONMENT" != "production" ]; then
        log_error "ENVIRONMENT: 本番環境では 'production' を設定してください（現在: $ENVIRONMENT）"
    fi
    
    log_info "$service_name のチェック完了"
    echo ""
}

# メイン処理
main() {
    local environment=${1:-development}
    local is_production=false
    
    if [ "$environment" = "production" ]; then
        is_production=true
        log_section "⚠️  本番環境モードでチェックを実行します"
        echo ""
    else
        log_section "開発環境モードでチェックを実行します"
        echo ""
    fi
    
    # 各サービスをチェック
    check_env_file "auth-service" "$WORKSPACE_DIR/src/auth-service/.env" "$is_production"
    check_env_file "tenant-management-service" "$WORKSPACE_DIR/src/tenant-management-service/.env" "$is_production"
    check_env_file "service-setting-service" "$WORKSPACE_DIR/src/service-setting-service/.env" "$is_production"
    check_env_file "frontend" "$WORKSPACE_DIR/src/front/.env" "$is_production"
    check_env_file "file-service" "$WORKSPACE_DIR/src/file-service/.env" "$is_production"
    check_env_file "messaging-service" "$WORKSPACE_DIR/src/messaging-service/.env" "$is_production"
    check_env_file "api-service" "$WORKSPACE_DIR/src/api-service/.env" "$is_production"
    check_env_file "backup-service" "$WORKSPACE_DIR/src/backup-service/.env" "$is_production"
    
    # 結果サマリー
    log_section "チェック結果"
    
    if [ $ERROR_COUNT -eq 0 ] && [ $WARNING_COUNT -eq 0 ]; then
        echo -e "${GREEN}✅ すべてのチェックをパスしました！${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  エラー: $ERROR_COUNT 件、警告: $WARNING_COUNT 件${NC}"
        
        if [ $ERROR_COUNT -gt 0 ]; then
            echo -e "${RED}修正が必要な問題があります。${NC}"
            exit 1
        else
            echo -e "${YELLOW}警告がありますが、続行可能です。${NC}"
            exit 0
        fi
    fi
}

# 使用方法
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "使用方法: $0 [environment]"
    echo "  environment: development (デフォルト) または production"
    echo ""
    echo "例:"
    echo "  $0              # 開発環境モードでチェック"
    echo "  $0 production   # 本番環境モードでチェック（厳格なチェック）"
    exit 0
fi

main "$@"
