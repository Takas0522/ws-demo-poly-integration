#!/bin/bash

# SaaS Management Application - Stop All Services
# このスクリプトは実行中の全サービスを停止します

set -e

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
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# プロジェクトルートディレクトリ
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# PIDファイルの場所
PID_FILE="$PROJECT_ROOT/.service-pids"

log_info "=== サービスを停止中 ==="

# PIDファイルからサービスを停止
if [ -f "$PID_FILE" ]; then
    while read -r pid service_name; do
        if ps -p "$pid" > /dev/null 2>&1; then
            log_info "停止中: $service_name (PID: $pid)"
            kill "$pid" 2>/dev/null || true
            sleep 1
            
            # まだ実行中なら強制終了
            if ps -p "$pid" > /dev/null 2>&1; then
                log_warning "強制終了: $service_name (PID: $pid)"
                kill -9 "$pid" 2>/dev/null || true
            fi
        else
            log_info "既に停止: $service_name (PID: $pid)"
        fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
else
    log_warning "PIDファイルが見つかりません。ポート番号から検索します..."
    
    # ポート番号からプロセスを探して停止
    for port in 3001 3002 3003 5173; do
        pid=$(lsof -ti :$port 2>/dev/null || true)
        if [ -n "$pid" ]; then
            log_info "ポート $port で実行中のプロセスを停止 (PID: $pid)"
            kill "$pid" 2>/dev/null || true
            sleep 1
            
            # まだ実行中なら強制終了
            if ps -p "$pid" > /dev/null 2>&1; then
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
    done
fi

log_success "全サービスを停止しました"
