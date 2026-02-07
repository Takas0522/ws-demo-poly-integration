// =============================================================================
// メインテンプレート - 複数サービス管理アプリケーション PoC
// =============================================================================
//
// アーキテクチャ:
//   - Frontend: Azure App Service (Next.js)
//   - Backend: Azure Container Apps (Python FastAPI × 3)
//   - Database: Azure Cosmos DB (Serverless, 3 databases)
//   - Registry: Azure Container Registry
//   - Monitoring: Application Insights + Log Analytics
//   - Secrets: Azure Key Vault
//
// 参照: docs/arch/deployment.md
// =============================================================================

targetScope = 'subscription'

// =============================================================================
// パラメータ
// =============================================================================

@description('環境名 (dev, staging, production)')
param environment string

@description('リージョン')
param location string = 'japaneast'

@description('リソース名プレフィックス')
param resourcePrefix string = 'poly-integration'

@description('共通タグ')
param tags object = {
  Environment: environment
  Project: 'ManagementApp'
  ManagedBy: 'Bicep'
}

@description('JWT Secret Key（本番環境では必ず変更）')
@secure()
param jwtSecretKey string

@description('Service Shared Secret（本番環境では必ず変更）')
@secure()
param serviceSharedSecret string

@description('Cosmos DB許可IPアドレス範囲（CIDR形式）')
param cosmosDbAllowedIpRanges array = []

@description('Container Apps 最小レプリカ数')
param containerAppsMinReplicas int = 0

@description('Container Apps 最大レプリカ数')
param containerAppsMaxReplicas int = 3

// =============================================================================
// Resource Group
// =============================================================================

resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: 'rg-${resourcePrefix}-${environment}'
  location: location
  tags: tags
}

// =============================================================================
// 1. Monitoring (Log Analytics + Application Insights)
// =============================================================================

module monitoring 'modules/monitoring.bicep' = {
  scope: rg
  name: 'monitoring-deployment'
  params: {
    resourcePrefix: resourcePrefix
    environment: environment
    location: location
    tags: tags
  }
}

// =============================================================================
// 2. Container Registry
// =============================================================================

module containerRegistry 'modules/container-registry.bicep' = {
  scope: rg
  name: 'container-registry-deployment'
  params: {
    resourcePrefix: resourcePrefix
    environment: environment
    location: location
    tags: tags
  }
}

// =============================================================================
// 3. Cosmos DB (3 databases: auth/tenant/service)
// =============================================================================

module cosmosDb 'modules/cosmos-db.bicep' = {
  scope: rg
  name: 'cosmos-db-deployment'
  params: {
    resourcePrefix: resourcePrefix
    environment: environment
    location: location
    tags: tags
    allowedIpRanges: cosmosDbAllowedIpRanges
    useServerless: true
  }
}

// =============================================================================
// 4. Container Apps (3 Backend Services)
// =============================================================================

module containerApps 'modules/container-apps.bicep' = {
  scope: rg
  name: 'container-apps-deployment'
  params: {
    resourcePrefix: resourcePrefix
    environment: environment
    location: location
    tags: tags
    logAnalyticsCustomerId: monitoring.outputs.logAnalyticsCustomerId
    logAnalyticsSharedKey: monitoring.outputs.logAnalyticsSharedKey
    containerRegistryLoginServer: containerRegistry.outputs.loginServer
    containerRegistryName: containerRegistry.outputs.name
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    cosmosDbEndpoint: cosmosDb.outputs.endpoint
    cosmosDbKey: cosmosDb.outputs.primaryKey
    jwtSecretKey: jwtSecretKey
    serviceSharedSecret: serviceSharedSecret
    minReplicas: containerAppsMinReplicas
    maxReplicas: containerAppsMaxReplicas
  }
}

// =============================================================================
// 5. App Service (Frontend - Next.js)
// =============================================================================

module appServicePlan 'modules/app-service-plan.bicep' = {
  scope: rg
  name: 'app-service-plan-deployment'
  params: {
    name: 'plan-${resourcePrefix}-${environment}'
    location: location
    sku: {
      name: 'B1'
      tier: 'Basic'
      capacity: 1
    }
    tags: tags
  }
}

module frontendApp 'modules/app-service.bicep' = {
  scope: rg
  name: 'frontend-app-deployment'
  params: {
    name: 'app-${resourcePrefix}-frontend-${environment}'
    location: location
    planId: appServicePlan.outputs.id
    runtime: 'node'
    runtimeVersion: '20-lts'
    tags: tags
    environmentVariables: [
      {
        name: 'NODE_ENV'
        value: 'production'
      }
      {
        name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
        value: monitoring.outputs.appInsightsConnectionString
      }
      {
        name: 'AUTH_SERVICE_URL'
        value: 'https://${containerApps.outputs.authServiceFqdn}'
      }
      {
        name: 'TENANT_SERVICE_URL'
        value: 'https://${containerApps.outputs.tenantServiceFqdn}'
      }
      {
        name: 'SERVICE_SETTING_URL'
        value: 'https://${containerApps.outputs.serviceSettingFqdn}'
      }
    ]
    allowedOrigins: []
  }
}

// =============================================================================
// 6. Key Vault (シークレット管理)
// =============================================================================

module keyVault 'modules/key-vault.bicep' = {
  scope: rg
  name: 'key-vault-deployment'
  params: {
    name: 'kv-${resourcePrefix}-${environment}'
    location: location
    tags: tags
    cosmosDbConnectionString: cosmosDb.outputs.connectionString
    appInsightsInstrumentationKey: monitoring.outputs.appInsightsInstrumentationKey
    jwtSecretKey: jwtSecretKey
    serviceSharedSecret: serviceSharedSecret
    appServicePrincipalIds: [
      frontendApp.outputs.principalId
      frontendApp.outputs.stagingPrincipalId
    ]
  }
}

// =============================================================================
// Outputs
// =============================================================================

output resourceGroupName string = rg.name
output frontendUrl string = 'https://${frontendApp.outputs.defaultHostName}'
output authServiceUrl string = 'https://${containerApps.outputs.authServiceFqdn}'
output tenantServiceUrl string = 'https://${containerApps.outputs.tenantServiceFqdn}'
output serviceSettingUrl string = 'https://${containerApps.outputs.serviceSettingFqdn}'
output containerRegistryLoginServer string = containerRegistry.outputs.loginServer
output keyVaultName string = keyVault.outputs.name
output keyVaultUri string = keyVault.outputs.vaultUri
output cosmosDbName string = cosmosDb.outputs.name

// セキュリティのため、シークレット情報は出力しません
// シークレットは Key Vault に保存されています
