using '../main.bicep'

param environment = 'dev'
param location = 'japaneast'
param resourcePrefix = 'poly-integration'
param tags = {
  Environment: 'dev'
  Project: 'ManagementApp'
  ManagedBy: 'Bicep'
  CostCenter: 'Engineering'
}

// ⚠️ セキュリティ警告 ⚠️
// 以下のシークレットは開発環境用のデフォルト値です。
// 本番環境では必ず強力なランダム文字列に変更してください！
// シークレット生成: bash infra/scripts/generate-secrets.sh

// 開発環境用のデフォルトシークレット（本番環境では使用禁止）
param jwtSecretKey = 'dev-jwt-secret-key-change-in-production-use-generate-secrets-script'
param serviceSharedSecret = 'dev-service-shared-secret-change-in-production-use-generate-secrets-script'

// Cosmos DBネットワーク設定（開発環境では全て許可）
param cosmosDbAllowedIpRanges = []

// Container Apps スケーリング設定（開発環境は最小構成）
param containerAppsMinReplicas = 0
param containerAppsMaxReplicas = 1

