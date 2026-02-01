targetScope = 'subscription'

@description('環境名 (dev, staging, production)')
param environment string

@description('リージョン')
param location string = 'japaneast'

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
// セキュリティのため、ローカル開発環境とAzure App Serviceからのアクセスのみ許可してください
// 例: ['203.0.113.0/24', '198.51.100.0/24']
// Azure App Serviceの送信IPは自動的にAzureサービス経由でアクセス可能です
param cosmosDbAllowedIpRanges array = [
  // 開発環境のIP範囲を追加してください
  // Azure App Serviceの送信IPは自動的にAzureサービス経由でアクセス可能です
]

// リソースグループ作成
resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: 'rg-management-app-${environment}'
  location: location
  tags: tags
}

// App Service Plan
module appServicePlan 'modules/app-service-plan.bicep' = {
  scope: rg
  name: 'appServicePlan'
  params: {
    name: 'plan-management-app-${environment}'
    location: location
    sku: {
      name: 'B1'
      tier: 'Basic'
      capacity: 1
    }
    tags: tags
  }
}

// Application Insights（Key Vaultより先に作成）
module appInsights 'modules/app-insights.bicep' = {
  scope: rg
  name: 'appInsights'
  params: {
    name: 'appi-management-app-${environment}'
    location: location
    tags: tags
  }
}

// Cosmos DB（Key Vaultより先に作成）
module cosmosDb 'modules/cosmos-db.bicep' = {
  scope: rg
  name: 'cosmosDb'
  params: {
    name: 'cosmos-management-app-${environment}'
    location: location
    databaseName: 'management-app'
    containers: [
      { name: 'auth', partitionKey: '/tenantId' }
      { name: 'tenant', partitionKey: '/tenantId' }
      { name: 'service-setting', partitionKey: '/tenantId' }
      { name: 'file-service', partitionKey: '/tenantId' }
      { name: 'messaging-service', partitionKey: '/tenantId' }
      { name: 'api-service', partitionKey: '/tenantId' }
      { name: 'backup-service', partitionKey: '/tenantId' }
    ]
    allowedIpRanges: cosmosDbAllowedIpRanges
    tags: tags
  }
}

// Frontend App Service
module frontendApp 'modules/app-service.bicep' = {
  scope: rg
  name: 'frontendApp'
  params: {
    name: 'app-frontend-${environment}'
    location: location
    planId: appServicePlan.outputs.id
    runtime: 'node'
    runtimeVersion: '20-lts'
    tags: tags
    environmentVariables: []
    // FrontendはブラウザからアクセスされるためCORS設定不要
    allowedOrigins: []
  }
}

// Auth Service App Service
module authServiceApp 'modules/app-service.bicep' = {
  scope: rg
  name: 'authServiceApp'
  params: {
    name: 'app-auth-${environment}'
    location: location
    planId: appServicePlan.outputs.id
    runtime: 'python'
    runtimeVersion: '3.11'
    tags: tags
    environmentVariables: []
    // Frontend URLからのCORSアクセスを許可
    allowedOrigins: [
      'https://${frontendApp.outputs.defaultHostName}'
    ]
  }
}

// Tenant Management Service App Service
module tenantServiceApp 'modules/app-service.bicep' = {
  scope: rg
  name: 'tenantServiceApp'
  params: {
    name: 'app-tenant-${environment}'
    location: location
    planId: appServicePlan.outputs.id
    runtime: 'python'
    runtimeVersion: '3.11'
    tags: tags
    environmentVariables: []
    // Frontend URLからのCORSアクセスを許可
    allowedOrigins: [
      'https://${frontendApp.outputs.defaultHostName}'
    ]
  }
}

// Service Setting Service App Service
module serviceSettingApp 'modules/app-service.bicep' = {
  scope: rg
  name: 'serviceSettingApp'
  params: {
    name: 'app-service-setting-${environment}'
    location: location
    planId: appServicePlan.outputs.id
    runtime: 'python'
    runtimeVersion: '3.11'
    tags: tags
    environmentVariables: []
    // Frontend URLからのCORSアクセスを許可
    allowedOrigins: [
      'https://${frontendApp.outputs.defaultHostName}'
    ]
  }
}

// File Service App Service (Mock)
module fileServiceApp 'modules/app-service.bicep' = {
  scope: rg
  name: 'fileServiceApp'
  params: {
    name: 'app-file-service-${environment}'
    location: location
    planId: appServicePlan.outputs.id
    runtime: 'python'
    runtimeVersion: '3.11'
    tags: tags
    environmentVariables: []
    // Frontend URLからのCORSアクセスを許可
    allowedOrigins: [
      'https://${frontendApp.outputs.defaultHostName}'
    ]
  }
}

// Messaging Service App Service (Mock)
module messagingServiceApp 'modules/app-service.bicep' = {
  scope: rg
  name: 'messagingServiceApp'
  params: {
    name: 'app-messaging-service-${environment}'
    location: location
    planId: appServicePlan.outputs.id
    runtime: 'python'
    runtimeVersion: '3.11'
    tags: tags
    environmentVariables: []
    // Frontend URLからのCORSアクセスを許可
    allowedOrigins: [
      'https://${frontendApp.outputs.defaultHostName}'
    ]
  }
}

// API Service App Service (Mock)
module apiServiceApp 'modules/app-service.bicep' = {
  scope: rg
  name: 'apiServiceApp'
  params: {
    name: 'app-api-service-${environment}'
    location: location
    planId: appServicePlan.outputs.id
    runtime: 'python'
    runtimeVersion: '3.11'
    tags: tags
    environmentVariables: []
    // Frontend URLからのCORSアクセスを許可
    allowedOrigins: [
      'https://${frontendApp.outputs.defaultHostName}'
    ]
  }
}

// Backup Service App Service (Mock)
module backupServiceApp 'modules/app-service.bicep' = {
  scope: rg
  name: 'backupServiceApp'
  params: {
    name: 'app-backup-service-${environment}'
    location: location
    planId: appServicePlan.outputs.id
    runtime: 'python'
    runtimeVersion: '3.11'
    tags: tags
    environmentVariables: []
    // Frontend URLからのCORSアクセスを許可
    allowedOrigins: [
      'https://${frontendApp.outputs.defaultHostName}'
    ]
  }
}

// Key Vault（すべてのApp Serviceの後に作成し、プリンシパルIDを取得）
module keyVault 'modules/key-vault.bicep' = {
  scope: rg
  name: 'keyVault'
  params: {
    name: 'kv-mgmt-app-${environment}-${uniqueString(rg.id)}'
    location: location
    tags: tags
    cosmosDbConnectionString: cosmosDb.outputs.connectionString
    appInsightsInstrumentationKey: appInsights.outputs.instrumentationKey
    jwtSecretKey: jwtSecretKey
    serviceSharedSecret: serviceSharedSecret
    appServicePrincipalIds: [
      frontendApp.outputs.principalId
      frontendApp.outputs.stagingPrincipalId
      authServiceApp.outputs.principalId
      authServiceApp.outputs.stagingPrincipalId
      tenantServiceApp.outputs.principalId
      tenantServiceApp.outputs.stagingPrincipalId
      serviceSettingApp.outputs.principalId
      serviceSettingApp.outputs.stagingPrincipalId
      fileServiceApp.outputs.principalId
      fileServiceApp.outputs.stagingPrincipalId
      messagingServiceApp.outputs.principalId
      messagingServiceApp.outputs.stagingPrincipalId
      apiServiceApp.outputs.principalId
      apiServiceApp.outputs.stagingPrincipalId
      backupServiceApp.outputs.principalId
      backupServiceApp.outputs.stagingPrincipalId
    ]
  }
}

output resourceGroupName string = rg.name
output keyVaultName string = keyVault.outputs.name
output keyVaultUri string = keyVault.outputs.vaultUri
output frontendUrl string = frontendApp.outputs.defaultHostName
output authServiceUrl string = authServiceApp.outputs.defaultHostName

// セキュリティのため、シークレット情報は出力しません
// App Serviceの環境変数は、Key Vault参照を使用して自動的に設定されます
// 手動で環境変数を設定する場合は、以下のKey Vaultシークレット名を使用してください：
//   - cosmos-db-connection-string
//   - app-insights-instrumentation-key
//   - jwt-secret-key
//   - service-shared-secret
