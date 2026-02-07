using '../main.bicep'

param environment = 'production'
param location = 'japaneast'
param resourcePrefix = 'poly-integration'
param tags = {
  Environment: 'production'
  Project: 'ManagementApp'
  ManagedBy: 'Bicep'
  CostCenter: 'Engineering'
}

// ⚠️ セキュリティ警告 ⚠️
// 以下のシークレット情報はパラメータファイルには記載しません。
// デプロイ時に以下のパラメータを指定してください：
//
//   --parameters jwtSecretKey='<強力なランダム文字列>' \
//                serviceSharedSecret='<強力なランダム文字列>'
//
// シークレット生成: bash infra/scripts/generate-secrets.sh

// Cosmos DBネットワーク設定
// 本番環境では必ずIP制限を設定してください
// 例: param cosmosDbAllowedIpRanges = ['203.0.113.0/24', '198.51.100.0/24']
// Azure App ServiceからのアクセスはAzureサービス経由で自動許可されます
param cosmosDbAllowedIpRanges = [
  // 本番環境のIP範囲を指定してください
]

// Container Apps スケーリング設定（本番は常時稼働）
param containerAppsMinReplicas = 1
param containerAppsMaxReplicas = 5
