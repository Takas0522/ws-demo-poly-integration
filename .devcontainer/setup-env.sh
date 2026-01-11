#!/bin/bash

# 環境設定ファイルセットアップスクリプト
# DevContainer起動時に自動的に.envファイルを生成します

set -e

WORKSPACE_ROOT="/workspaces/ws-demo-poly-integration"
ENV_FILE="$WORKSPACE_ROOT/.env"
ENV_DEV_FILE="$WORKSPACE_ROOT/.env.development"

echo "=========================================="
echo "  環境設定ファイルをセットアップ中..."
echo "=========================================="

# .envファイルが存在しない場合のみ作成
if [ ! -f "$ENV_FILE" ]; then
  echo "📄 .envファイルが見つかりません。.env.developmentからコピーします..."
  
  if [ -f "$ENV_DEV_FILE" ]; then
    cp "$ENV_DEV_FILE" "$ENV_FILE"
    echo "✅ .envファイルを作成しました: $ENV_FILE"
  else
    echo "⚠️  .env.developmentが見つかりません。.env.templateを使用します..."
    if [ -f "$WORKSPACE_ROOT/.env.template" ]; then
      cp "$WORKSPACE_ROOT/.env.template" "$ENV_FILE"
      echo "✅ .env.templateから.envファイルを作成しました"
    else
      echo "❌ エラー: .env.templateも見つかりません"
      exit 1
    fi
  fi
else
  echo "✅ .envファイルは既に存在します: $ENV_FILE"
fi

echo ""
echo "=========================================="
echo "  環境設定セットアップが完了しました！"
echo "=========================================="
echo ""
