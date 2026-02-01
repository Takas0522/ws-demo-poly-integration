#!/bin/bash

# シークレット生成スクリプト
# 強力なランダム文字列を生成し、GitHub Secretsや環境変数として使用します

set -e

# 色付きログ用
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== シークレット生成ツール ===${NC}"
echo ""
echo "生成されたシークレットは、以下の用途で使用してください："
echo "  - GitHub Secrets"
echo "  - Bicepパラメータファイル（Key Vault保存用）"
echo "  - ローカル開発環境の .env ファイル"
echo ""
echo -e "${YELLOW}⚠️  これらの値は安全に保管し、絶対にGitにコミットしないでください${NC}"
echo ""

# JWT Secret Key生成（64文字）
JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
echo -e "${GREEN}JWT_SECRET_KEY:${NC}"
echo "$JWT_SECRET"
echo ""

# Service Shared Secret生成（64文字）
SERVICE_SECRET=$(openssl rand -base64 48 | tr -d '\n')
echo -e "${GREEN}SERVICE_SHARED_SECRET:${NC}"
echo "$SERVICE_SECRET"
echo ""

# .env形式で表示
echo -e "${BLUE}=== .env形式 ===${NC}"
cat << EOF
JWT_SECRET_KEY=$JWT_SECRET
SERVICE_SHARED_SECRET=$SERVICE_SECRET
EOF
echo ""

# GitHub Secrets設定コマンド例
echo -e "${BLUE}=== GitHub Secrets設定コマンド例 ===${NC}"
echo "以下のコマンドで GitHub Secrets に登録できます："
echo ""
echo "gh secret set JWT_SECRET_KEY --body \"$JWT_SECRET\""
echo "gh secret set SERVICE_SHARED_SECRET --body \"$SERVICE_SECRET\""
echo ""

# Azure Key Vault設定コマンド例
echo -e "${BLUE}=== Azure Key Vault設定コマンド例 ===${NC}"
echo "既にKey Vaultが作成されている場合、以下のコマンドで登録できます："
echo ""
echo "az keyvault secret set --vault-name <your-keyvault-name> --name jwt-secret-key --value \"$JWT_SECRET\""
echo "az keyvault secret set --vault-name <your-keyvault-name> --name service-shared-secret --value \"$SERVICE_SECRET\""
echo ""

# セキュリティガイドライン
echo -e "${BLUE}=== セキュリティガイドライン ===${NC}"
echo "✅ シークレットは最低32文字以上"
echo "✅ 英数字と記号を含む複雑な文字列"
echo "✅ 本番環境では必ず再生成する"
echo "✅ 定期的にローテーションする（推奨: 90日毎）"
echo "✅ シークレットへのアクセスを最小限に制限する"
echo "✅ ログやエラーメッセージにシークレットが含まれないようにする"
echo ""
echo -e "${YELLOW}⚠️  このターミナル出力は第三者に見られないよう注意してください${NC}"
