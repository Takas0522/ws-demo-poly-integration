#!/bin/bash
set -e

echo "======================================"
echo " DevContainer セットアップ開始"
echo "======================================"

# CosmosDB Emulatorを起動
echo "🗄️ CosmosDB Emulator を起動中..."
cd /workspace

# 既存のコンテナを確認
if docker ps -a | grep -q cosmosdb-emulator; then
  echo "  → 既存のCosmosDBコンテナを検出"
  if docker ps | grep -q cosmosdb-emulator; then
    echo "  → CosmosDBは既に起動しています"
  else
    echo "  → CosmosDBコンテナを起動中..."
    docker start cosmosdb-emulator
  fi
else
  echo "  → CosmosDBコンテナを新規作成・起動中..."
  # ポート競合を避けるため、Dockerネットワーク経由のみでアクセス
  docker run -d --name cosmosdb-emulator \
    --network workspace_poc-network \
    -p 8081:8081 -p 10251:10251 -p 10252:10252 -p 10253:10253 -p 10254:10254 \
    -e AZURE_COSMOS_EMULATOR_PARTITION_COUNT=10 \
    -e AZURE_COSMOS_EMULATOR_ENABLE_DATA_PERSISTENCE=false \
    -e AZURE_COSMOS_EMULATOR_IP_ADDRESS_OVERRIDE=0.0.0.0 \
    --tmpfs /tmp:exec \
    --memory 3g \
    --cpus 2.0 \
    mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest
  
  # ネットワークが存在しない場合は作成
  if ! docker network ls | grep -q workspace_poc-network; then
    docker network create workspace_poc-network
  fi
fi

# CosmosDBの起動を待機
echo "  → CosmosDBの起動を待機中（最大2分）..."
MAX_WAIT=120
WAIT_TIME=0
while [ $WAIT_TIME -lt $MAX_WAIT ]; do
  if curl -k -s https://localhost:8081/ >/dev/null 2>&1; then
    RESPONSE=$(curl -k -s https://localhost:8081/)
    if ! echo "$RESPONSE" | grep -q "ServiceUnavailable"; then
      echo "  ✓ CosmosDB Emulator 起動完了！"
      break
    fi
  fi
  echo "    待機中... ($WAIT_TIME/$MAX_WAIT 秒)"
  sleep 5
  WAIT_TIME=$((WAIT_TIME + 5))
done

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
  echo "  ⚠️  CosmosDB起動タイムアウト。後で手動確認してください。"
else
  echo ""
fi

# Python仮想環境のセットアップ
VENV_PATH="/workspace/.venv"
echo "🐍 Python仮想環境をセットアップ中..."
if [ ! -d "$VENV_PATH" ]; then
  echo "  → 仮想環境を作成: $VENV_PATH"
  python3 -m venv "$VENV_PATH"
fi

# 仮想環境を有効化
source "$VENV_PATH/bin/activate"
echo "  → 仮想環境を有効化: $(which python)"

# Python依存関係インストール
echo "📦 Python依存関係をインストール中..."
for service in auth-service tenant-management-service service-setting-service; do
  if [ -f "/workspace/src/$service/requirements.txt" ]; then
    echo "  → $service"
    pip install -q -r "/workspace/src/$service/requirements.txt"
  fi
done

# スクリプト用依存関係インストール
if [ -f "/workspace/scripts/requirements.txt" ]; then
  echo "  → scripts"
  pip install -q -r "/workspace/scripts/requirements.txt"
fi

# Node.js依存関係インストール
echo "📦 Node.js依存関係をインストール中..."
if [ -f "/workspace/src/front/package.json" ]; then
  echo "  → frontend"
  cd /workspace/src/front
  npm install --silent
  cd /workspace
fi

# 環境変数ファイルの作成
echo "🔧 環境変数ファイルをセットアップ中..."
for service in front auth-service tenant-management-service service-setting-service; do
  ENV_EXAMPLE="/workspace/src/$service/.env.example"
  ENV_FILE="/workspace/src/$service/.env"
  if [ -f "$ENV_EXAMPLE" ] && [ ! -f "$ENV_FILE" ]; then
    echo "  → $service/.env を作成"
    cp "$ENV_EXAMPLE" "$ENV_FILE"
  fi
done

# Git設定
echo "🔧 Git設定を確認中..."
if [ ! -f ~/.gitconfig ]; then
  git config --global core.autocrlf input
  git config --global core.eol lf
fi

echo ""
echo "======================================"
echo " ✅ セットアップ完了!"
echo "======================================"
echo ""
echo "📝 次のステップ:"
echo ""
echo "🐍 Python仮想環境の有効化:"
echo "  source /workspace/.venv/bin/activate"
echo ""
echo "🗄️ CosmosDB 接続テスト:"
echo "  python scripts/test_cosmos_connection.py"
echo ""
echo "🗄️ CosmosDB セットアップ (初回のみ):"
echo "  python scripts/create_database.py"
echo "  python scripts/seed_database.py"
echo "  python scripts/seed_sample_data.py  # サンプルデータ投入（任意）"
echo ""
echo "🚀 サービス起動:"
echo "  1. フロントエンド起動: cd src/front && npm run dev"
echo "  2. 認証サービス起動: cd src/auth-service && uvicorn app.main:app --reload --host 0.0.0.0 --port 8001"
echo "  3. テナントサービス起動: cd src/tenant-management-service && uvicorn app.main:app --reload --host 0.0.0.0 --port 8002"
echo "  4. サービス設定起動: cd src/service-setting-service && uvicorn app.main:app --reload --host 0.0.0.0 --port 8003"
echo ""
echo "🔍 CosmosDB状態確認:"
echo "  docker ps | grep cosmosdb"
echo ""
