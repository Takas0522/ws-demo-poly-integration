#!/bin/bash

echo "=== データベースセットアップ開始 ==="

# 環境変数設定（デフォルト値）
export COSMOS_DB_ENDPOINT=${COSMOS_DB_ENDPOINT:-"https://localhost:8081"}
export COSMOS_DB_KEY=${COSMOS_DB_KEY:-"C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="}
export COSMOS_DB_CONNECTION_VERIFY="false"

# 1. データベース・コンテナ作成
echo ""
python3 scripts/create_database.py
if [ $? -ne 0 ]; then
  echo "データベース作成に失敗しました"
  exit 1
fi

# 2. シードデータ投入
echo ""
python3 scripts/seed_database.py
if [ $? -ne 0 ]; then
  echo "シードデータ投入に失敗しました"
  exit 1
fi

echo ""
echo "=== データベースセットアップ完了 ==="
