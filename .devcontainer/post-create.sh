#!/bin/bash
set -e

echo "======================================"
echo " DevContainer セットアップ開始"
echo "======================================"

# CosmosDB Emulatorを起動
echo "🗄️ CosmosDB Emulator を起動中..."
cd /workspace

# ネットワークが存在しない場合は作成（コンテナ作成前に必要）
if ! docker network ls | grep -q workspace_poc-network; then
  echo "  → workspace_poc-network を作成中..."
  docker network create workspace_poc-network
fi

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
  # vnext-preview: HTTP対応、最新SDK互換
  docker run -d --name cosmosdb-emulator \
    --network workspace_poc-network \
    -p 8081:8081 -p 1234:1234 \
    -e ENABLE_EXPLORER=true \
    --tmpfs /tmp:exec \
    --memory 3g \
    --cpus 2.0 \
    mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview
fi

# DevContainerをCosmosDBと同じネットワークに接続
# （DevContainerはデフォルトでbridgeネットワーク上にあり、CosmosDBと通信できないため）
DEVCONTAINER_ID=$(hostname)
if ! docker inspect "$DEVCONTAINER_ID" --format '{{json .NetworkSettings.Networks}}' 2>/dev/null | grep -q workspace_poc-network; then
  echo "  → DevContainerを workspace_poc-network に接続中..."
  docker network connect workspace_poc-network "$DEVCONTAINER_ID" 2>/dev/null || true
fi

# CosmosDBの起動を待機（同一ネットワーク上のホスト名で接続、vnext-previewはHTTP）
COSMOS_HOST="cosmosdb-emulator"
echo "  → CosmosDBの起動を待機中（最大3分）..."
MAX_WAIT=180
WAIT_TIME=0
while [ $WAIT_TIME -lt $MAX_WAIT ]; do
  if curl -s --connect-timeout 3 "http://${COSMOS_HOST}:8081/" >/dev/null 2>&1; then
    RESPONSE=$(curl -s --connect-timeout 3 "http://${COSMOS_HOST}:8081/")
    if echo "$RESPONSE" | grep -q "_dbs"; then
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

# CosmosDB データベース・コンテナ作成 & シードデータ投入
if [ $WAIT_TIME -lt $MAX_WAIT ]; then
  echo "🗄️ CosmosDB データベースをセットアップ中..."
  cd /workspace

  # 環境変数を設定（create_database.py / seed_database.py が参照）
  export COSMOS_DB_ENDPOINT="http://cosmosdb-emulator:8081"
  export COSMOS_DB_KEY="C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
  export COSMOS_DB_CONNECTION_VERIFY="false"

  # データベース・コンテナ作成
  if python scripts/create_database.py; then
    echo "  ✓ データベース・コンテナ作成完了"
  else
    echo "  ⚠️  データベース作成に失敗しました。後で手動実行してください:"
    echo "     python scripts/create_database.py"
  fi

  # シードデータ投入
  if python scripts/seed_database.py; then
    echo "  ✓ シードデータ投入完了"
  else
    echo "  ⚠️  シードデータ投入に失敗しました。後で手動実行してください:"
    echo "     python scripts/seed_database.py"
  fi
else
  echo "⚠️  CosmosDBが起動していないため、DBセットアップをスキップしました。"
  echo "   起動後に以下を手動実行してください:"
  echo "     bash scripts/setup_database.sh"
fi

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
echo "🚀 サービス起動:"
echo "  1. フロントエンド起動: cd src/front && npm run dev"
echo "  2. 認証サービス起動: cd src/auth-service && uvicorn app.main:app --reload --host 0.0.0.0 --port 8001"
echo "  3. テナントサービス起動: cd src/tenant-management-service && uvicorn app.main:app --reload --host 0.0.0.0 --port 8002"
echo "  4. サービス設定起動: cd src/service-setting-service && uvicorn app.main:app --reload --host 0.0.0.0 --port 8003"
echo ""
echo "🗄️ サンプルデータ投入（任意）:"
echo "  python scripts/seed_sample_data.py"
echo ""
echo "🔍 CosmosDB状態確認:"
echo "  docker ps | grep cosmosdb"
echo ""
