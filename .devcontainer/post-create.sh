#!/bin/bash
set -e

echo "======================================"
echo " DevContainer セットアップ開始"
echo "======================================"

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
echo "� Python仮想環境の有効化:"
echo "  source /workspace/.venv/bin/activate"
echo ""
echo "🗄️ CosmosDB セットアップ (初回のみ):"
echo "  python scripts/create_database.py"
echo "  python scripts/seed_database.py"
echo "  python scripts/seed_sample_data.py  # サンプルデータ投入（任意）"
echo ""
echo "🚀 サービス起動:"
echo "  1. フロントエンド起動: cd src/front && npm run dev"
echo "  2. 認証サービス起動: cd src/auth-service && uvicorn app.main:app --reload --port 8001"
echo "  3. テナントサービス起動: cd src/tenant-management-service && uvicorn app.main:app --reload --port 8002"
echo "  4. サービス設定起動: cd src/service-setting-service && uvicorn app.main:app --reload --port 8003"
echo ""
echo "📊 CosmosDB Data Explorer: http://localhost:1234"
echo ""
