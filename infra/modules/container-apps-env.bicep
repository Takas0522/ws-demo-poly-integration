// =============================================================================
// Container Apps Environment モジュール (共有ホスティング環境)
// =============================================================================
//
// Container Apps Environment は全バックエンドサービスが共有する
// ホスティング環境です。個別のサービス定義は各サービスリポジトリの
// infra/container-app.bicep に定義されています。
// =============================================================================

@description('リソース名プレフィックス')
param resourcePrefix string

@description('環境名 (dev, staging, production)')
param environment string

@description('リージョン')
param location string

@description('タグ')
param tags object

// --- 依存リソースからの入力 ---

@description('Log Analytics Workspace のカスタマーID')
param logAnalyticsCustomerId string

@secure()
@description('Log Analytics Workspace の共有キー')
param logAnalyticsSharedKey string

// -----------------------------------------------------------------------------
// Container Apps Environment
// -----------------------------------------------------------------------------
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: 'cae-${resourcePrefix}-${environment}'
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsCustomerId
        sharedKey: logAnalyticsSharedKey
      }
    }
    zoneRedundant: false // PoC のため無効
  }
}

// -----------------------------------------------------------------------------
// Outputs
// -----------------------------------------------------------------------------
output id string = containerAppsEnvironment.id
output name string = containerAppsEnvironment.name
output defaultDomain string = containerAppsEnvironment.properties.defaultDomain
