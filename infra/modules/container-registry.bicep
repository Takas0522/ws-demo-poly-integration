// =============================================================================
// Azure Container Registry モジュール
// =============================================================================

@description('リソース名プレフィックス')
param resourcePrefix string

@description('環境名 (dev, staging, production)')
param environment string

@description('リージョン')
param location string

@description('タグ')
param tags object

@description('SKU (Basic, Standard, Premium)')
param sku string = 'Basic'

@description('管理者ユーザーの有効化')
param adminUserEnabled bool = true

// ACR名はグローバルに一意で英数字のみ
var registryName = replace('acr${resourcePrefix}${environment}', '-', '')

// -----------------------------------------------------------------------------
// Container Registry
// -----------------------------------------------------------------------------
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: registryName
  location: location
  tags: tags
  sku: {
    name: sku
  }
  properties: {
    adminUserEnabled: adminUserEnabled
    publicNetworkAccess: 'Enabled'
    policies: {
      retentionPolicy: {
        status: 'disabled' // Basic SKUでは利用不可
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Outputs
// -----------------------------------------------------------------------------
output id string = containerRegistry.id
output name string = containerRegistry.name
output loginServer string = containerRegistry.properties.loginServer
