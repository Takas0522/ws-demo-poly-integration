// =============================================================================
// メインテンプレート - 複数サービス管理アプリケーション PoC
// =============================================================================
//
// オーケストレーション:
//   統合リポジトリが共有インフラを管理し、各サービスリポジトリが
//   サービス固有のリソースを定義するポリレポ構成に対応。
//
// 共有インフラ (統合リポジトリ管理):
//   - Monitoring: Application Insights + Log Analytics
//   - Registry: Azure Container Registry
//   - Database: Azure Cosmos DB (Serverless, 3 databases)
//   - Secrets: Azure Key Vault
//   - Container Apps Environment (共有ホスティング環境)
//
// サービス固有リソース (各サービスリポジトリで定義):
//   - Frontend: Azure App Service (src/front/infra/)
//   - Auth Service: Container App (src/auth-service/infra/)
//   - Tenant Service: Container App (src/tenant-management-service/infra/)
//   - Service Setting: Container App (src/service-setting-service/infra/)
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

@description('Entra ID アプリケーション (クライアント) ID')
param entraClientId string

@description('Entra ID クライアントシークレット')
@secure()
param entraClientSecret string

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
// 1. 共有インフラ: Monitoring (Log Analytics + Application Insights)
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
// 2. 共有インフラ: Container Registry
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
// 3. 共有インフラ: Cosmos DB (3 databases: auth/tenant/service)
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
// 4. 共有インフラ: Container Apps Environment
// =============================================================================

module containerAppsEnv 'modules/container-apps-env.bicep' = {
  scope: rg
  name: 'container-apps-env-deployment'
  params: {
    resourcePrefix: resourcePrefix
    environment: environment
    location: location
    tags: tags
    logAnalyticsCustomerId: monitoring.outputs.logAnalyticsCustomerId
    logAnalyticsSharedKey: monitoring.outputs.logAnalyticsSharedKey
  }
}

// =============================================================================
// 5. サービス: 認証認可サービス (Auth Service)
//    定義元: src/auth-service/infra/container-app.bicep
// =============================================================================

module authService '../src/auth-service/infra/container-app.bicep' = {
  scope: rg
  name: 'auth-service-deployment'
  params: {
    environment: environment
    location: location
    tags: tags
    containerAppsEnvironmentId: containerAppsEnv.outputs.id
    containerRegistryLoginServer: containerRegistry.outputs.loginServer
    containerRegistryName: containerRegistry.outputs.name
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    cosmosDbEndpoint: cosmosDb.outputs.endpoint
    jwtSecretKey: jwtSecretKey
    serviceSharedSecret: serviceSharedSecret
    minReplicas: containerAppsMinReplicas
    maxReplicas: containerAppsMaxReplicas
  }
}

// =============================================================================
// 6. サービス: テナント管理サービス (Tenant Management Service)
//    定義元: src/tenant-management-service/infra/container-app.bicep
// =============================================================================

module tenantService '../src/tenant-management-service/infra/container-app.bicep' = {
  scope: rg
  name: 'tenant-service-deployment'
  params: {
    environment: environment
    location: location
    tags: tags
    containerAppsEnvironmentId: containerAppsEnv.outputs.id
    containerRegistryLoginServer: containerRegistry.outputs.loginServer
    containerRegistryName: containerRegistry.outputs.name
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    cosmosDbEndpoint: cosmosDb.outputs.endpoint
    serviceSharedSecret: serviceSharedSecret
    minReplicas: containerAppsMinReplicas
    maxReplicas: containerAppsMaxReplicas
  }
}

// =============================================================================
// 7. サービス: 利用サービス設定サービス (Service Setting Service)
//    定義元: src/service-setting-service/infra/container-app.bicep
// =============================================================================

module serviceSettingService '../src/service-setting-service/infra/container-app.bicep' = {
  scope: rg
  name: 'service-setting-deployment'
  params: {
    environment: environment
    location: location
    tags: tags
    containerAppsEnvironmentId: containerAppsEnv.outputs.id
    containerRegistryLoginServer: containerRegistry.outputs.loginServer
    containerRegistryName: containerRegistry.outputs.name
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    cosmosDbEndpoint: cosmosDb.outputs.endpoint
    serviceSharedSecret: serviceSharedSecret
    minReplicas: containerAppsMinReplicas
    maxReplicas: containerAppsMaxReplicas
  }
}

// =============================================================================
// 8. サービス: Frontend Container App (Next.js)
//    定義元: src/front/infra/container-app.bicep
// =============================================================================

module frontendApp '../src/front/infra/container-app.bicep' = {
  scope: rg
  name: 'frontend-app-deployment'
  params: {
    environment: environment
    location: location
    tags: tags
    containerAppsEnvironmentId: containerAppsEnv.outputs.id
    containerRegistryLoginServer: containerRegistry.outputs.loginServer
    containerRegistryName: containerRegistry.outputs.name
    appInsightsConnectionString: monitoring.outputs.appInsightsConnectionString
    authServiceFqdn: authService.outputs.fqdn
    tenantServiceFqdn: tenantService.outputs.fqdn
    serviceSettingServiceFqdn: serviceSettingService.outputs.fqdn
    entraClientId: entraClientId
    entraClientSecret: entraClientSecret
    entraTenantId: tenant().tenantId
    minReplicas: containerAppsMinReplicas
    maxReplicas: containerAppsMaxReplicas
  }
}

// =============================================================================
// 8.5. Cosmos DB RBAC ロール割り当て
//     Container App のマネージドIDに Cosmos DB データ操作権限を付与
// =============================================================================

module cosmosDbRbac 'modules/cosmos-db-rbac.bicep' = {
  scope: rg
  name: 'cosmos-db-rbac-deployment'
  params: {
    cosmosAccountName: cosmosDb.outputs.name
    dataContributorPrincipalIds: [
      authService.outputs.principalId
      tenantService.outputs.principalId
      serviceSettingService.outputs.principalId
    ]
  }
}

// =============================================================================
// 9. 共有インフラ: Key Vault (シークレット管理)
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
    appServicePrincipalIds: []
  }
}

// =============================================================================
// Outputs
// =============================================================================

output resourceGroupName string = rg.name
output frontendUrl string = 'https://${frontendApp.outputs.fqdn}'
output authServiceUrl string = 'https://${authService.outputs.fqdn}'
output tenantServiceUrl string = 'https://${tenantService.outputs.fqdn}'
output serviceSettingUrl string = 'https://${serviceSettingService.outputs.fqdn}'
output containerRegistryLoginServer string = containerRegistry.outputs.loginServer
output keyVaultName string = keyVault.outputs.name
output keyVaultUri string = keyVault.outputs.vaultUri
output cosmosDbName string = cosmosDb.outputs.name

// セキュリティのため、シークレット情報は出力しません
// シークレットは Key Vault に保存されています
