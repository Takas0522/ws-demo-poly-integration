#!/bin/bash

# SaaS Management Application - Start All Services
# このスクリプトは全サービスを同時に起動します

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

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# プロジェクトルートディレクトリ
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# PIDファイルの場所
PID_FILE="$PROJECT_ROOT/.service-pids"

# クリーンアップ関数
cleanup() {
    log_warning "サービスを停止しています..."
    
    if [ -f "$PID_FILE" ]; then
        while read -r pid service_name; do
            if ps -p "$pid" > /dev/null 2>&1; then
                log_info "停止中: $service_name (PID: $pid)"
                kill "$pid" 2>/dev/null || true
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    
    log_success "全サービスを停止しました"
    exit 0
}

# シグナルハンドラの設定
trap cleanup SIGINT SIGTERM

# 既存のPIDファイルをクリア
rm -f "$PID_FILE"

log_info "=== SaaS Management Application - サービス起動 ==="
echo ""

# 仮想環境の確認とアクティベート
if [ -d "$PROJECT_ROOT/.venv" ]; then
    log_info "Python仮想環境をアクティベート中..."
    source "$PROJECT_ROOT/.venv/bin/activate"
else
    log_warning "Python仮想環境が見つかりません。グローバルのPythonを使用します。"
fi

# Auth Service (port 3001)
log_info "Auth Service を起動中 (http://localhost:3001)..."
cd "$PROJECT_ROOT/src/auth-service"
uvicorn app.main:app --host 0.0.0.0 --port 3001 > "$PROJECT_ROOT/logs/auth-service.log" 2>&1 &
AUTH_PID=$!
echo "$AUTH_PID auth-service" >> "$PID_FILE"
log_success "Auth Service 起動完了 (PID: $AUTH_PID)"

# User Management Service (port 3002)
log_info "User Management Service を起動中 (http://localhost:3002)..."
cd "$PROJECT_ROOT/src/user-management-service"
uvicorn app.main:app --host 0.0.0.0 --port 3002 > "$PROJECT_ROOT/logs/user-management-service.log" 2>&1 &
USER_PID=$!
echo "$USER_PID user-management-service" >> "$PID_FILE"
log_success "User Management Service 起動完了 (PID: $USER_PID)"

# Service Settings Service (port 3003)
log_info "Service Settings Service を起動中 (http://localhost:3003)..."
cd "$PROJECT_ROOT/src/service-setting-service"
uvicorn app.main:app --host 0.0.0.0 --port 3003 > "$PROJECT_ROOT/logs/service-setting-service.log" 2>&1 &
SETTINGS_PID=$!
echo "$SETTINGS_PID service-setting-service" >> "$PID_FILE"
log_success "Service Settings Service 起動完了 (PID: $SETTINGS_PID)"

# Frontend (port 5173)
log_info "Frontend を起動中 (http://localhost:5173)..."
cd "$PROJECT_ROOT/src/front"
npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
FRONT_PID=$!
echo "$FRONT_PID frontend" >> "$PID_FILE"
log_success "Frontend 起動完了 (PID: $FRONT_PID)"

echo ""
log_success "=== 全サービスが起動しました ==="
echo ""
echo -e "${BLUE}サービスURL:${NC}"
echo "  - Frontend:              http://localhost:5173"
echo "  - Auth Service:          http://localhost:3001"
echo "  - Auth Service (Docs):   http://localhost:3001/docs"
echo "  - User Management:       http://localhost:3002"
echo "  - User Management (Docs): http://localhost:3002/docs"
echo "  - Service Settings:      http://localhost:3003"
echo "  - Service Settings (Docs): http://localhost:3003/docs"
echo ""
echo -e "${BLUE}ログファイル:${NC}"
echo "  - logs/auth-service.log"
echo "  - logs/user-management-service.log"
echo "  - logs/service-setting-service.log"
echo "  - logs/frontend.log"
echo ""
echo -e "${YELLOW}停止するには Ctrl+C を押してください${NC}"
echo ""

# サービスの稼働を監視
while true; do
    sleep 5
    
    # 各プロセスが生きているか確認
    for pid in $AUTH_PID $USER_PID $SETTINGS_PID $FRONT_PID; do
        if ! ps -p "$pid" > /dev/null 2>&1; then
            log_error "サービスが予期せず停止しました (PID: $pid)"
            cleanup
        fi
    done
done
