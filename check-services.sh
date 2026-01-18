#!/bin/bash

# SaaS Management Application - Check Services Status
# このスクリプトは全サービスの稼働状況を確認します

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

echo -e "${BLUE}=== サービス稼働状況チェック ===${NC}"
echo ""

# ヘルスチェック関数
check_service() {
    local name=$1
    local url=$2
    local port=$3
    
    # ポートが開いているか確認
    if ! lsof -i :$port > /dev/null 2>&1; then
        log_error "$name: ポート $port でプロセスが見つかりません"
        return 1
    fi
    
    # HTTPリクエストでヘルスチェック
    if curl -s -f -m 5 "$url" > /dev/null 2>&1; then
        log_success "$name: 正常稼働中 ($url)"
        return 0
    else
        log_error "$name: 応答がありません ($url)"
        return 1
    fi
}

# 各サービスをチェック
all_ok=true

check_service "Auth Service" "http://localhost:3001/health" 3001 || all_ok=false
check_service "User Management Service" "http://localhost:3002/health" 3002 || all_ok=false
check_service "Service Settings Service" "http://localhost:3003/health" 3003 || all_ok=false

# Frontendはヘルスエンドポイントがないので、ポートチェックのみ
echo -n -e "${BLUE}[INFO]${NC} Frontend: "
if lsof -i :5173 > /dev/null 2>&1; then
    log_success "正常稼働中 (http://localhost:5173)"
else
    log_error "ポート 5173 でプロセスが見つかりません"
    all_ok=false
fi

echo ""

if [ "$all_ok" = true ]; then
    echo -e "${GREEN}全サービスが正常に稼働しています！${NC}"
    exit 0
else
    echo -e "${RED}一部のサービスが停止しています${NC}"
    echo ""
    echo "サービスを起動するには以下を実行してください:"
    echo "  ./start-all-services.sh"
    exit 1
fi
