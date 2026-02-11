@description('Key Vault名')
param name string

@description('リージョン')
param location string

@description('タグ')
param tags object

@description('App Serviceのプリンシパルに対してシークレット読み取り権限を付与')
param appServicePrincipalIds array = []

@description('Cosmos DB接続文字列')
@secure()
param cosmosDbConnectionString string

@description('Application Insights instrumentation key')
@secure()
param appInsightsInstrumentationKey string

@description('JWT secret key')
@secure()
param jwtSecretKey string

@description('Service shared secret')
@secure()
param serviceSharedSecret string

resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    networkAcls: {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
      ipRules: []
      virtualNetworkRules: []
    }
    publicNetworkAccess: 'Enabled' // MVP環境のため有効化、本番では制限を検討
  }
}

// シークレットを保存
resource cosmosDbConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'cosmos-db-connection-string'
  properties: {
    value: cosmosDbConnectionString
    contentType: 'text/plain'
  }
}

resource appInsightsKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'app-insights-instrumentation-key'
  properties: {
    value: appInsightsInstrumentationKey
    contentType: 'text/plain'
  }
}

resource jwtSecretKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'jwt-secret-key'
  properties: {
    value: jwtSecretKey
    contentType: 'text/plain'
  }
}

resource serviceSharedSecretSecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'service-shared-secret'
  properties: {
    value: serviceSharedSecret
    contentType: 'text/plain'
  }
}

// App ServiceにKey Vault Secrets User権限を付与
resource keyVaultSecretsUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for principalId in appServicePrincipalIds: {
  scope: keyVault
  name: guid(keyVault.id, principalId, 'Key Vault Secrets User')
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}]

output id string = keyVault.id
output name string = keyVault.name
output vaultUri string = keyVault.properties.vaultUri

// シークレット参照用のURIを出力
output cosmosDbConnectionStringSecretUri string = cosmosDbConnectionStringSecret.properties.secretUri
output appInsightsKeySecretUri string = appInsightsKeySecret.properties.secretUri
output jwtSecretKeySecretUri string = jwtSecretKeySecret.properties.secretUri
output serviceSharedSecretSecretUri string = serviceSharedSecretSecret.properties.secretUri
