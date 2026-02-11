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
    cosmosDbKey: cosmosDb.outputs.primaryKey
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
    cosmosDbKey: cosmosDb.outputs.primaryKey
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
    cosmosDbKey: cosmosDb.outputs.primaryKey
    serviceSharedSecret: serviceSharedSecret
    minReplicas: containerAppsMinReplicas
    maxReplicas: containerAppsMaxReplicas
  }
}

// =============================================================================
// 8. サービス: Frontend App Service (Next.js)
//    定義元: src/front/infra/app-service.bicep, app-service-plan.bicep
// =============================================================================

module appServicePlan '../src/front/infra/app-service-plan.bicep' = {
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

module frontendApp '../src/front/infra/app-service.bicep' = {
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
        value: 'https://${authService.outputs.fqdn}'
      }
      {
        name: 'TENANT_SERVICE_URL'
        value: 'https://${tenantService.outputs.fqdn}'
      }
      {
        name: 'SERVICE_SETTING_URL'
        value: 'https://${serviceSettingService.outputs.fqdn}'
      }
    ]
    allowedOrigins: []
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
output authServiceUrl string = 'https://${authService.outputs.fqdn}'
output tenantServiceUrl string = 'https://${tenantService.outputs.fqdn}'
output serviceSettingUrl string = 'https://${serviceSettingService.outputs.fqdn}'
output containerRegistryLoginServer string = containerRegistry.outputs.loginServer
output keyVaultName string = keyVault.outputs.name
output keyVaultUri string = keyVault.outputs.vaultUri
output cosmosDbName string = cosmosDb.outputs.name

// セキュリティのため、シークレット情報は出力しません
// シークレットは Key Vault に保存されています
