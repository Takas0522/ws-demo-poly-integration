// =============================================================================
// 監視モジュール (Log Analytics Workspace + Application Insights)
// =============================================================================

@description('リソース名プレフィックス')
param resourcePrefix string

@description('環境名 (dev, staging, production)')
param environment string

@description('リージョン')
param location string

@description('タグ')
param tags object

@description('ログ保持日数')
param retentionInDays int = 30

// -----------------------------------------------------------------------------
// Log Analytics Workspace
// -----------------------------------------------------------------------------
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'log-${resourcePrefix}-${environment}'
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: retentionInDays
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// -----------------------------------------------------------------------------
// Application Insights
// -----------------------------------------------------------------------------
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-${resourcePrefix}-${environment}'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// -----------------------------------------------------------------------------
// Outputs
// -----------------------------------------------------------------------------
output logAnalyticsWorkspaceId string = logAnalyticsWorkspace.id
output logAnalyticsWorkspaceName string = logAnalyticsWorkspace.name
output logAnalyticsCustomerId string = logAnalyticsWorkspace.properties.customerId
@secure()
output logAnalyticsSharedKey string = logAnalyticsWorkspace.listKeys().primarySharedKey
output appInsightsId string = applicationInsights.id
output appInsightsName string = applicationInsights.name
output appInsightsConnectionString string = applicationInsights.properties.ConnectionString
output appInsightsInstrumentationKey string = applicationInsights.properties.InstrumentationKey
