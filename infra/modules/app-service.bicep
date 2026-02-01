@description('App Service名')
param name string

@description('リージョン')
param location string

@description('App Service PlanのID')
param planId string

@description('ランタイム (node, python)')
param runtime string

@description('ランタイムバージョン')
param runtimeVersion string

@description('タグ')
param tags object

@description('追加の環境変数（Key Vault参照を含む）')
param environmentVariables array = []

@description('CORS許可オリジン（空の場合はCORSは無効）')
param allowedOrigins array = []

resource appService 'Microsoft.Web/sites@2022-03-01' = {
  name: name
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: planId
    httpsOnly: true
    siteConfig: {
      alwaysOn: true
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      
      // CORS設定（Frontend URLのみ許可）
      cors: length(allowedOrigins) > 0 ? {
        allowedOrigins: allowedOrigins
        supportCredentials: true
      } : null
      
      // Python設定
      linuxFxVersion: runtime == 'python' ? 'PYTHON|${runtimeVersion}' : null
      
      // Node.js設定
      nodeVersion: runtime == 'node' ? runtimeVersion : null
      
      appSettings: concat([
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
      ], environmentVariables)
    }
  }

  // Staging スロット
  resource stagingSlot 'slots' = {
    name: 'staging'
    location: location
    identity: {
      type: 'SystemAssigned'
    }
    properties: {
      serverFarmId: planId
      httpsOnly: true
      siteConfig: {
        alwaysOn: true
        http20Enabled: true
        minTlsVersion: '1.2'
        ftpsState: 'Disabled'
        
        // CORS設定（Frontend URLのみ許可）
        cors: length(allowedOrigins) > 0 ? {
          allowedOrigins: allowedOrigins
          supportCredentials: true
        } : null
        
        linuxFxVersion: runtime == 'python' ? 'PYTHON|${runtimeVersion}' : null
        nodeVersion: runtime == 'node' ? runtimeVersion : null
        appSettings: concat([
          {
            name: 'WEBSITE_RUN_FROM_PACKAGE'
            value: '1'
          }
        ], environmentVariables)
      }
    }
  }
}

output id string = appService.id
output name string = appService.name
output defaultHostName string = appService.properties.defaultHostName
output principalId string = appService.identity.principalId
output stagingPrincipalId string = appService::stagingSlot.identity.principalId
