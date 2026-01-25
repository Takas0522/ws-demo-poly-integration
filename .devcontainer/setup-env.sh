#!/bin/bash
# DevContainer初期化スクリプト
# このスクリプトはDevContainer作成後に自動実行されます

set -e

echo "=========================================="
echo "  DevContainer 初期化開始"
echo "=========================================="
echo ""

# カラー出力用
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 環境ファイルのセットアップ
echo "1. 環境ファイルのセットアップ..."
if [ ! -f .env ]; then
    if [ -f .env.development ]; then
        if cp .env.development .env 2>/dev/null; then
            echo -e "${GREEN}✓${NC} .env.development から .env を作成しました"
        else
            echo -e "${YELLOW}⚠${NC} .env の作成に失敗しました（権限エラー）"
            echo "  手動で実行してください: sudo cp .env.development .env && sudo chown \$(whoami) .env"
        fi
    else
        echo -e "${YELLOW}⚠${NC} .env.development が見つかりません。.env.template を参照してください"
    fi
else
    echo -e "${GREEN}✓${NC} .env ファイルは既に存在します"
fi

# 2. Git設定
echo ""
echo "2. Git設定..."
# サブモジュールの初期化（既に初期化されている場合はスキップ）
if [ -f .gitmodules ]; then
    echo "サブモジュールの初期化中..."
    git submodule init || true
    git submodule update || true
    echo -e "${GREEN}✓${NC} サブモジュールの初期化が完了しました"
else
    echo -e "${YELLOW}⚠${NC} .gitmodules が見つかりません"
fi

# 3. Cosmos DB Emulator の起動確認
echo ""
echo "3. Cosmos DB Emulator の起動確認..."
MAX_WAIT=60
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    HTTP_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost:8081/_explorer/emulator.pem)
    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "302" ]; then
        echo -e "${GREEN}✓${NC} Cosmos DB Emulator が起動しました"
        break
    fi
    
    if [ $WAIT_COUNT -eq 0 ]; then
        echo "Cosmos DB Emulator の起動を待機中..."
    fi
    
    sleep 2
    WAIT_COUNT=$((WAIT_COUNT + 2))
    
    if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
        echo -e "${YELLOW}⚠${NC} Cosmos DB Emulator の起動に時間がかかっています"
        echo "初回起動の場合、5-10分かかることがあります"
        echo "手動で確認する場合: curl -k https://localhost:8081/_explorer/emulator.pem"
    fi
done

# 4. 環境の確認
echo ""
echo "4. 開発環境の確認..."
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  Python: $(python3 --version)"
echo "  pip: $(pip3 --version)"
if command -v az &> /dev/null; then
    echo "  Azure CLI: $(az --version | head -n 1)"
fi
echo "  Git: $(git --version)"

echo ""
echo "=========================================="
echo "  DevContainer 初期化完了"
echo "=========================================="
echo ""
echo "次のステップ:"
echo "1. 環境変数を確認: cat .env"
echo "2. Cosmos DB接続確認: curl -k https://localhost:8081/_explorer/emulator.pem"
echo "3. セットアップ検証: bash scripts/verify-setup.sh"
echo ""
