// =============================================================================
// Cosmos DB モジュール (3 データベース構成: データ設計ドキュメント準拠)
// =============================================================================

@description('リソース名プレフィックス')
param resourcePrefix string

@description('環境名 (dev, staging, production)')
param environment string

@description('リージョン')
param location string

@description('タグ')
param tags object

@description('許可するIPアドレス範囲（CIDR形式、空の場合はAzureサービスのみ許可）')
param allowedIpRanges array = []

@description('Serverless モードを使用するか（PoC推奨）')
param useServerless bool = true

var accountName = 'cosmos-${resourcePrefix}-${environment}'

// -----------------------------------------------------------------------------
// Cosmos DB Account
// -----------------------------------------------------------------------------
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: accountName
  location: location
  tags: tags
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    // PoC: Serverless で最小コスト運用
    capabilities: useServerless ? [
      {
        name: 'EnableServerless'
      }
    ] : []
    backupPolicy: {
      type: 'Continuous'
      continuousModeProperties: {
        tier: 'Continuous30Days'
      }
    }
    // ネットワークセキュリティ設定
    publicNetworkAccess: 'Enabled'
    isVirtualNetworkFilterEnabled: false
    ipRules: [for ipRange in allowedIpRanges: {
      ipAddressOrRange: ipRange
    }]
    networkAclBypass: 'AzureServices'
    networkAclBypassResourceIds: []
    disableLocalAuth: false // PoC環境のため接続文字列認証を許可
  }
}

// =============================================================================
// Database: auth_management (認証認可)
// =============================================================================
resource authDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosAccount
  name: 'auth_management'
  properties: {
    resource: {
      id: 'auth_management'
    }
  }
}

// Container: users (ユーザー + ユーザーロール)
resource usersContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: authDatabase
  name: 'users'
  properties: {
    resource: {
      id: 'users'
      partitionKey: {
        paths: ['/id']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/*' }
        ]
        excludedPaths: [
          { path: '/passwordHash/?' }
          { path: '/"_etag"/?' }
        ]
      }
      // ユーザーIDの一意性を保証
      uniqueKeyPolicy: {
        uniqueKeys: [
          { paths: ['/userId'] }
        ]
      }
    }
  }
}

// Container: roles (ロール定義)
resource rolesContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: authDatabase
  name: 'roles'
  properties: {
    resource: {
      id: 'roles'
      partitionKey: {
        paths: ['/serviceId']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/*' }
        ]
      }
    }
  }
}

// =============================================================================
// Database: tenant_management (テナント管理)
// =============================================================================
resource tenantDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosAccount
  name: 'tenant_management'
  properties: {
    resource: {
      id: 'tenant_management'
    }
  }
}

// Container: tenants (テナント + テナントユーザー)
resource tenantsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: tenantDatabase
  name: 'tenants'
  properties: {
    resource: {
      id: 'tenants'
      partitionKey: {
        paths: ['/id']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/*' }
        ]
      }
    }
  }
}

// =============================================================================
// Database: service_management (サービス設定)
// =============================================================================
resource serviceDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosAccount
  name: 'service_management'
  properties: {
    resource: {
      id: 'service_management'
    }
  }
}

// Container: services (サービス定義 + テナントサービス紐付け)
resource servicesContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: serviceDatabase
  name: 'services'
  properties: {
    resource: {
      id: 'services'
      partitionKey: {
        paths: ['/id']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          { path: '/*' }
        ]
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Outputs
// -----------------------------------------------------------------------------
output id string = cosmosAccount.id
output name string = cosmosAccount.name
output endpoint string = cosmosAccount.properties.documentEndpoint
@secure()
output primaryKey string = cosmosAccount.listKeys().primaryMasterKey
@secure()
output connectionString string = cosmosAccount.listConnectionStrings().connectionStrings[0].connectionString

// データベース名
output databases object = {
  auth: authDatabase.name
  tenant: tenantDatabase.name
  service: serviceDatabase.name
}
