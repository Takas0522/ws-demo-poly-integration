// =============================================================================
// Container Apps モジュール (Environment + 3 Backend Services)
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

@description('Container Registry のログインサーバー')
param containerRegistryLoginServer string

@description('Container Registry 名')
param containerRegistryName string

@description('Application Insights 接続文字列')
param appInsightsConnectionString string

@description('Cosmos DB エンドポイント')
param cosmosDbEndpoint string

@secure()
@description('Cosmos DB プライマリキー')
param cosmosDbKey string

@secure()
@description('JWT Secret Key')
param jwtSecretKey string

@secure()
@description('Service Shared Secret')
param serviceSharedSecret string

// --- スケーリング設定 ---

@description('最小レプリカ数')
param minReplicas int = 0

@description('最大レプリカ数')
param maxReplicas int = 3

// --- CPU/メモリ設定 ---

@description('コンテナの CPU コア数')
param containerCpu string = '0.25'

@description('コンテナのメモリ (Gi)')
param containerMemory string = '0.5Gi'

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
// 認証認可サービス (Auth Service)
// -----------------------------------------------------------------------------
resource authServiceApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'ca-auth-${environment}'
  location: location
  tags: union(tags, { Service: 'auth-service' })
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 8001
        transport: 'http'
        allowInsecure: false
        corsPolicy: {
          allowedOrigins: ['*'] // デプロイ後に Frontend URL に制限
          allowCredentials: true
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
          allowedHeaders: ['*']
        }
      }
      registries: [
        {
          server: containerRegistryLoginServer
          username: containerRegistryName
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'cosmos-db-key'
          value: cosmosDbKey
        }
        {
          name: 'jwt-secret-key'
          value: jwtSecretKey
        }
        {
          name: 'service-shared-secret'
          value: serviceSharedSecret
        }
        {
          name: 'acr-password'
          value: listCredentials(resourceId('Microsoft.ContainerRegistry/registries', containerRegistryName), '2023-07-01').passwords[0].value
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'auth-service'
          // 初回デプロイ時はプレースホルダーイメージを使用
          image: '${containerRegistryLoginServer}/auth-service:latest'
          env: [
            { name: 'SERVICE_NAME', value: 'auth-service' }
            { name: 'PORT', value: '8001' }
            { name: 'ENVIRONMENT', value: environment }
            { name: 'COSMOS_DB_ENDPOINT', value: cosmosDbEndpoint }
            { name: 'COSMOS_DB_KEY', secretRef: 'cosmos-db-key' }
            { name: 'COSMOS_DB_DATABASE', value: 'auth_management' }
            { name: 'JWT_SECRET_KEY', secretRef: 'jwt-secret-key' }
            { name: 'JWT_ALGORITHM', value: 'HS256' }
            { name: 'JWT_EXPIRE_MINUTES', value: '1440' }
            { name: 'SERVICE_SHARED_SECRET', secretRef: 'service-shared-secret' }
            { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsightsConnectionString }
          ]
          resources: {
            cpu: json(containerCpu)
            memory: containerMemory
          }
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

// -----------------------------------------------------------------------------
// テナント管理サービス (Tenant Management Service)
// -----------------------------------------------------------------------------
resource tenantServiceApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'ca-tenant-${environment}'
  location: location
  tags: union(tags, { Service: 'tenant-management-service' })
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 8002
        transport: 'http'
        allowInsecure: false
        corsPolicy: {
          allowedOrigins: ['*']
          allowCredentials: true
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
          allowedHeaders: ['*']
        }
      }
      registries: [
        {
          server: containerRegistryLoginServer
          username: containerRegistryName
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'cosmos-db-key'
          value: cosmosDbKey
        }
        {
          name: 'service-shared-secret'
          value: serviceSharedSecret
        }
        {
          name: 'acr-password'
          value: listCredentials(resourceId('Microsoft.ContainerRegistry/registries', containerRegistryName), '2023-07-01').passwords[0].value
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'tenant-service'
          image: '${containerRegistryLoginServer}/tenant-service:latest'
          env: [
            { name: 'SERVICE_NAME', value: 'tenant-management-service' }
            { name: 'PORT', value: '8002' }
            { name: 'ENVIRONMENT', value: environment }
            { name: 'COSMOS_DB_ENDPOINT', value: cosmosDbEndpoint }
            { name: 'COSMOS_DB_KEY', secretRef: 'cosmos-db-key' }
            { name: 'COSMOS_DB_DATABASE', value: 'tenant_management' }
            { name: 'SERVICE_SHARED_SECRET', secretRef: 'service-shared-secret' }
            { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsightsConnectionString }
          ]
          resources: {
            cpu: json(containerCpu)
            memory: containerMemory
          }
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

// -----------------------------------------------------------------------------
// 利用サービス設定サービス (Service Setting Service)
// -----------------------------------------------------------------------------
resource serviceSettingApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: 'ca-service-setting-${environment}'
  location: location
  tags: union(tags, { Service: 'service-setting-service' })
  properties: {
    managedEnvironmentId: containerAppsEnvironment.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 8003
        transport: 'http'
        allowInsecure: false
        corsPolicy: {
          allowedOrigins: ['*']
          allowCredentials: true
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
          allowedHeaders: ['*']
        }
      }
      registries: [
        {
          server: containerRegistryLoginServer
          username: containerRegistryName
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'cosmos-db-key'
          value: cosmosDbKey
        }
        {
          name: 'service-shared-secret'
          value: serviceSharedSecret
        }
        {
          name: 'acr-password'
          value: listCredentials(resourceId('Microsoft.ContainerRegistry/registries', containerRegistryName), '2023-07-01').passwords[0].value
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'service-setting'
          image: '${containerRegistryLoginServer}/service-setting:latest'
          env: [
            { name: 'SERVICE_NAME', value: 'service-setting-service' }
            { name: 'PORT', value: '8003' }
            { name: 'ENVIRONMENT', value: environment }
            { name: 'COSMOS_DB_ENDPOINT', value: cosmosDbEndpoint }
            { name: 'COSMOS_DB_KEY', secretRef: 'cosmos-db-key' }
            { name: 'COSMOS_DB_DATABASE', value: 'service_management' }
            { name: 'SERVICE_SHARED_SECRET', secretRef: 'service-shared-secret' }
            { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsightsConnectionString }
          ]
          resources: {
            cpu: json(containerCpu)
            memory: containerMemory
          }
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Outputs
// -----------------------------------------------------------------------------
output environmentId string = containerAppsEnvironment.id
output environmentName string = containerAppsEnvironment.name
output environmentDefaultDomain string = containerAppsEnvironment.properties.defaultDomain

output authServiceFqdn string = authServiceApp.properties.configuration.ingress.fqdn
output tenantServiceFqdn string = tenantServiceApp.properties.configuration.ingress.fqdn
output serviceSettingFqdn string = serviceSettingApp.properties.configuration.ingress.fqdn

output serviceUrls object = {
  authService: 'https://${authServiceApp.properties.configuration.ingress.fqdn}'
  tenantService: 'https://${tenantServiceApp.properties.configuration.ingress.fqdn}'
  serviceSetting: 'https://${serviceSettingApp.properties.configuration.ingress.fqdn}'
}
