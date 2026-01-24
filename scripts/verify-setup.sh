#!/bin/bash
# 開発環境の検証スクリプト
# DevContainerとCosmos DBエミュレータの動作を確認します

# Note: We don't use 'set -e' here because we want to continue testing
# even if some checks fail, and report all results at the end

echo "=========================================="
echo "  開発環境検証スクリプト"
echo "=========================================="
echo ""

# カラー出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 成功カウンター
SUCCESS_COUNT=0
TOTAL_TESTS=0

# テスト結果を記録する関数
test_passed() {
    echo -e "${GREEN}✓${NC} $1"
    ((SUCCESS_COUNT++))
    ((TOTAL_TESTS++))
}

test_failed() {
    echo -e "${RED}✗${NC} $1"
    ((TOTAL_TESTS++))
}

test_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "1. ツールのバージョン確認"
echo "----------------------------------------"

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    test_passed "Node.js: $NODE_VERSION"
else
    test_failed "Node.js がインストールされていません"
fi

# npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    test_passed "npm: $NPM_VERSION"
else
    test_failed "npm がインストールされていません"
fi

# Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    test_passed "Python: $PYTHON_VERSION"
else
    test_failed "Python がインストールされていません"
fi

# pip
if command -v pip3 &> /dev/null; then
    PIP_VERSION=$(pip3 --version | awk '{print $2}')
    test_passed "pip: $PIP_VERSION"
else
    test_failed "pip がインストールされていません"
fi

# Azure CLI
if command -v az &> /dev/null; then
    AZ_VERSION=$(az --version | head -n 1)
    test_passed "Azure CLI: $AZ_VERSION"
else
    test_warning "Azure CLI がインストールされていません（オプション）"
fi

# Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    test_passed "Git: $GIT_VERSION"
else
    test_failed "Git がインストールされていません"
fi

echo ""
echo "2. Docker環境の確認"
echo "----------------------------------------"

# Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    test_passed "Docker: $DOCKER_VERSION"
    
    # Docker daemon running check
    if docker ps &> /dev/null; then
        test_passed "Docker daemon が起動しています"
    else
        test_failed "Docker daemon が起動していません"
    fi
else
    test_failed "Docker がインストールされていません"
fi

# Docker Compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    test_passed "Docker Compose: $COMPOSE_VERSION"
else
    test_warning "Docker Compose がインストールされていません（Docker統合版を使用している可能性）"
fi

echo ""
echo "3. 環境ファイルの確認"
echo "----------------------------------------"

# .env ファイル
if [ -f ".env" ]; then
    test_passed ".env ファイルが存在します"
    
    # 必須環境変数のチェック
    if grep -q "COSMOSDB_ENDPOINT" .env; then
        test_passed "COSMOSDB_ENDPOINT が設定されています"
    else
        test_failed "COSMOSDB_ENDPOINT が設定されていません"
    fi
    
    if grep -q "COSMOSDB_DATABASE" .env; then
        test_passed "COSMOSDB_DATABASE が設定されています"
    else
        test_failed "COSMOSDB_DATABASE が設定されていません"
    fi
else
    test_warning ".env ファイルが存在しません（.env.development からコピーしてください）"
fi

# .env.template
if [ -f ".env.template" ]; then
    test_passed ".env.template ファイルが存在します"
else
    test_failed ".env.template ファイルが存在しません"
fi

# .env.development
if [ -f ".env.development" ]; then
    test_passed ".env.development ファイルが存在します"
else
    test_failed ".env.development ファイルが存在しません"
fi

echo ""
echo "4. DevContainer設定の確認"
echo "----------------------------------------"

# .devcontainer/devcontainer.json
if [ -f ".devcontainer/devcontainer.json" ]; then
    test_passed ".devcontainer/devcontainer.json が存在します"
else
    test_failed ".devcontainer/devcontainer.json が存在しません"
fi

# .devcontainer/docker-compose.yml
if [ -f ".devcontainer/docker-compose.yml" ]; then
    test_passed ".devcontainer/docker-compose.yml が存在します"
else
    test_failed ".devcontainer/docker-compose.yml が存在しません"
fi

# .devcontainer/setup-env.sh
if [ -f ".devcontainer/setup-env.sh" ]; then
    test_passed ".devcontainer/setup-env.sh が存在します"
    
    # 実行権限のチェック
    if [ -x ".devcontainer/setup-env.sh" ]; then
        test_passed "setup-env.sh に実行権限があります"
    else
        test_warning "setup-env.sh に実行権限がありません（chmod +x で付与してください）"
    fi
else
    test_failed ".devcontainer/setup-env.sh が存在しません"
fi

echo ""
echo "5. ドキュメントの確認"
echo "----------------------------------------"

# docs/init.md
if [ -f "docs/init.md" ]; then
    test_passed "docs/init.md が存在します"
else
    test_failed "docs/init.md が存在しません"
fi

# docs/architecture/README.md
if [ -f "docs/architecture/README.md" ]; then
    test_passed "docs/architecture/README.md が存在します"
else
    test_failed "docs/architecture/README.md が存在しません"
fi

echo ""
echo "6. Cosmos DBエミュレータの確認"
echo "----------------------------------------"

# エミュレータが起動しているか確認
if docker ps | grep -q cosmosdb; then
    CONTAINER_NAME=$(docker ps | grep cosmosdb | awk '{print $NF}')
    test_passed "Cosmos DBエミュレータが起動しています: $CONTAINER_NAME"
    
    # エンドポイントに接続できるか確認
    echo "  接続テスト中..."
    if curl -k -s -o /dev/null -w "%{http_code}" https://localhost:8081/_explorer/emulator.pem | grep -q "200\|302"; then
        test_passed "Cosmos DBエミュレータに接続できます"
    else
        test_warning "Cosmos DBエミュレータに接続できません（起動中の可能性があります）"
    fi
else
    test_warning "Cosmos DBエミュレータが起動していません"
    echo "  起動するには: docker-compose up -d cosmosdb"
fi

echo ""
echo "7. サブモジュールの確認"
echo "----------------------------------------"

# .gitmodules ファイル
if [ -f ".gitmodules" ]; then
    test_passed ".gitmodules ファイルが存在します"
    
    # サブモジュールの数を確認
    SUBMODULE_COUNT=$(grep -c '\[submodule' .gitmodules 2>/dev/null || echo "0")
    echo "  サブモジュール数: $SUBMODULE_COUNT"
    
    # 各サブモジュールの状態を確認
    if [ -d "src/front" ] && [ "$(ls -A src/front)" ]; then
        test_passed "src/front サブモジュールが初期化されています"
    else
        test_warning "src/front サブモジュールが空です（git submodule update が必要）"
    fi
    
    if [ -d "src/auth-service" ] && [ "$(ls -A src/auth-service)" ]; then
        test_passed "src/auth-service サブモジュールが初期化されています"
    else
        test_warning "src/auth-service サブモジュールが空です（git submodule update が必要）"
    fi
    
    if [ -d "src/user-management-service" ] && [ "$(ls -A src/user-management-service)" ]; then
        test_passed "src/user-management-service サブモジュールが初期化されています"
    else
        test_warning "src/user-management-service サブモジュールが空です（git submodule update が必要）"
    fi
    
    if [ -d "src/service-setting-service" ] && [ "$(ls -A src/service-setting-service)" ]; then
        test_passed "src/service-setting-service サブモジュールが初期化されています"
    else
        test_warning "src/service-setting-service サブモジュールが空です（git submodule update が必要）"
    fi
else
    test_failed ".gitmodules ファイルが存在しません"
fi

echo ""
echo "=========================================="
echo "  検証結果"
echo "=========================================="
echo ""
echo "合計テスト: $TOTAL_TESTS"
echo -e "${GREEN}成功: $SUCCESS_COUNT${NC}"
echo -e "${RED}失敗: $((TOTAL_TESTS - SUCCESS_COUNT))${NC}"
echo ""

if [ $SUCCESS_COUNT -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}✓ すべてのテストが成功しました！${NC}"
    echo "開発環境は正常にセットアップされています。"
    exit 0
elif [ $SUCCESS_COUNT -ge $((TOTAL_TESTS * 3 / 4)) ]; then
    echo -e "${YELLOW}⚠ いくつかの警告がありますが、開発は可能です。${NC}"
    echo "詳細は上記の結果を確認してください。"
    exit 0
else
    echo -e "${RED}✗ 重要な問題があります。${NC}"
    echo "上記のエラーを解決してから再度実行してください。"
    echo ""
    echo "ヘルプが必要な場合は、docs/init.md のトラブルシューティングを参照してください。"
    exit 1
fi
