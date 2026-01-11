#!/bin/bash

# CosmosDB初期化スクリプト
# このスクリプトはDevContainerビルド時に実行されます

set -e

echo "=========================================="
echo "  CosmosDB初期化を開始します..."
echo "=========================================="

# CosmosDBエミュレータが起動するまで待機
echo "CosmosDBエミュレータの起動を待機中..."
MAX_RETRIES=30
RETRY_COUNT=0

until curl -k -s https://localhost:8081/_explorer/emulator.pem > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -gt $MAX_RETRIES ]; then
    echo "❌ エラー: CosmosDBエミュレータが起動しませんでした"
    exit 1
  fi
  echo "  リトライ $RETRY_COUNT/$MAX_RETRIES..."
  sleep 10
done

echo "✅ CosmosDBエミュレータが起動しました"
echo ""

# スクリプトディレクトリに移動
cd /workspaces/ws-demo-poly-integration/scripts/cosmosdb

# 依存関係をインストール
echo "📦 npm依存関係をインストール中..."
npm install --silent

# 環境変数を設定
export COSMOSDB_ENDPOINT=https://localhost:8081
export COSMOSDB_KEY="C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
export COSMOSDB_DATABASE=saas-management-dev
export NODE_TLS_REJECT_UNAUTHORIZED=0

echo ""
echo "🗄️  データベースとコンテナを作成中..."
npx ts-node init-database.ts

echo ""
echo "🌱 開発用データをシード中..."
npx ts-node seed-data.ts

echo ""
echo "=========================================="
echo "  ✅ CosmosDB初期化が完了しました！"
echo "=========================================="
echo ""
echo "📚 デフォルト認証情報:"
echo "  管理者:"
echo "    Email: admin@example.com"
echo "    Password: Admin@123"
echo "  ユーザー:"
echo "    Email: user@example.com"
echo "    Password: User@123"
echo ""
echo "⚠️  重要: 本番環境ではこれらのパスワードを変更してください！"
echo ""
