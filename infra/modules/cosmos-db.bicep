@description('Cosmos DBアカウント名')
param name string

@description('リージョン')
param location string

@description('データベース名')
param databaseName string

@description('コンテナ定義')
param containers array

@description('タグ')
param tags object

@description('許可するIPアドレス範囲（CIDR形式、空の場合はAzureサービスのみ許可）')
param allowedIpRanges array = []

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: name
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
    disableLocalAuth: false // MVP環境のため接続文字列認証を許可、本番では証明書認証を推奨
  }
}

resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosAccount
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
    options: {
      autoscaleSettings: {
        maxThroughput: 4000  // 自動スケール: 最小400RU/s（10%）〜最大4000RU/s
      }
    }
  }
}

resource containerResources 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = [for container in containers: {
  parent: database
  name: container.name
  properties: {
    resource: {
      id: container.name
      partitionKey: {
        paths: [
          container.partitionKey
        ]
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          {
            path: '/*'
          }
        ]
      }
    }
    // 自動スケール設定はデータベースレベルで共有
  }
}]

output id string = cosmosAccount.id
output name string = cosmosAccount.name
@secure()
output connectionString string = cosmosAccount.listConnectionStrings().connectionStrings[0].connectionString
