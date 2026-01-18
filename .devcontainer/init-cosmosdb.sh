#!/bin/bash

# CosmosDB初期化スクリプト
# このスクリプトはDevContainerビルド時に実行されます

set -e

echo "=========================================="
echo "  CosmosDB初期化を開始します..."
echo "=========================================="

# CosmosDBエミュレータが起動するまで待機
echo "CosmosDBエミュレータの起動を待機中..."
MAX_RETRIES=60 # 30 → 60に増やして最大10分待機
RETRY_COUNT=0
WAIT_INTERVAL=10 # 待機間隔（秒）

until curl -k -s https://localhost:8081/_explorer/emulator.pem > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -gt $MAX_RETRIES ]; then
    echo "❌ エラー: CosmosDBエミュレータが起動しませんでした"
    echo "   トラブルシューティング: bash .devcontainer/troubleshoot-cosmosdb.sh"
    exit 1
  fi
  echo "  リトライ $RETRY_COUNT/$MAX_RETRIES... (待機時間: $((RETRY_COUNT * WAIT_INTERVAL))秒)"
  sleep $WAIT_INTERVAL
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
# TypeScriptコンパイルエラーを回避するため、環境変数を確実に設定
if npx ts-node init-database.ts 2>&1; then
  echo "✅ データベース初期化が完了しました"
  
  echo ""
  echo "🌱 開発用データをシード中..."
  if npx ts-node seed-data.ts 2>&1; then
    echo "✅ データシードが完了しました"
  else
    echo "⚠️  データシードでエラーが発生しました"
    echo "    一部のコンテナが作成されていない可能性があります"
    echo "    手動でシードを実行してください: cd scripts/cosmosdb && npx ts-node seed-data.ts"
    echo "    または、init-database.tsを再実行してコンテナを作成してください"
  fi
else
  echo "⚠️  データベース初期化でエラーが発生しました"
  echo "    一部のコンテナが作成されている可能性があります"
  echo "    手動で初期化を実行してください: cd scripts/cosmosdb && npx ts-node init-database.ts"
  echo ""
  echo "    CosmosDBエミュレータのリソース制限により、"
  echo "    すべてのコンテナを一度に作成できない場合があります。"
  echo "    基本的なコンテナ（Tenants, Users, Permissions, AuditLogs）が"
  echo "    作成されていれば、アプリケーションは動作します。"
fi

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
