// =============================================================================
// Bicep スキャフォールドテンプレート
// Azure リソース調査 → Bicep 生成スキルで使用するひな型
//
// 使い方:
//   1. このファイルを infra/main.bicep にコピーする
//   2. discovered/ 配下の JSON を参照しながら各モジュールを実装する
//   3. 不要なセクションは削除する
//   4. workflow-bicep-gen.md の手順に従って検証する
// =============================================================================

targetScope = 'subscription'

// =============================================================================
// パラメータ
// TODO: discovered/subscription.json と各リソースの JSON から適切な値を設定
// =============================================================================

@description('環境名 (dev, staging, production)')
@allowed(['dev', 'staging', 'production'])
param environment string

@description('デプロイ先リージョン')
// TODO: discovered/resource-groups.json の location から取得
param location string = 'japaneast'

@description('リソース名プレフィックス')
// TODO: 既存リソース名のパターンから命名規則を把握して設定
param resourcePrefix string

@description('共通タグ')
// TODO: discovered/<RG>-resources.json の tags から既存タグを把握して設定
param tags object = {
  Environment: environment
  Project: 'TODO: プロジェクト名'
  ManagedBy: 'Bicep'
}

// --- セキュアパラメータ（値はデプロイ時に渡す / Key Vault 参照を使う） ---
// TODO: 必要なシークレットパラメータを追加する
// @secure()
// param exampleSecret string

// =============================================================================
// リソースグループ
// TODO: discovered/resource-groups.json から名前・場所を確認して設定
// =============================================================================

resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: 'rg-${resourcePrefix}-${environment}'
  location: location
  tags: tags
}

// =============================================================================
// モジュール: 監視 (Log Analytics + Application Insights)
// TODO: discovered/<RG>-log-analytics.json, <RG>-app-insights.json を参照
// =============================================================================

// module monitoring './modules/monitoring.bicep' = {
//   scope: rg
//   name: 'monitoring'
//   params: {
//     location: location
//     resourcePrefix: resourcePrefix
//     environment: environment
//     tags: tags
//   }
// }

// =============================================================================
// モジュール: Container Registry
// TODO: discovered/<RG>-acr.json を参照
// =============================================================================

// module containerRegistry './modules/container-registry.bicep' = {
//   scope: rg
//   name: 'containerRegistry'
//   params: {
//     location: location
//     resourcePrefix: resourcePrefix
//     environment: environment
//     tags: tags
//   }
// }

// =============================================================================
// モジュール: Cosmos DB
// TODO: discovered/<RG>-cosmosdb-accounts.json, cosmosdb-<名前>.json を参照
// =============================================================================

// module cosmosDb './modules/cosmos-db.bicep' = {
//   scope: rg
//   name: 'cosmosDb'
//   params: {
//     location: location
//     resourcePrefix: resourcePrefix
//     environment: environment
//     tags: tags
//   }
// }

// =============================================================================
// モジュール: Key Vault
// TODO: discovered/<RG>-keyvault-<名前>.json を参照
// =============================================================================

// module keyVault './modules/key-vault.bicep' = {
//   scope: rg
//   name: 'keyVault'
//   params: {
//     location: location
//     resourcePrefix: resourcePrefix
//     environment: environment
//     tags: tags
//   }
// }

// =============================================================================
// モジュール: Container Apps 環境
// TODO: discovered/<RG>-containerapp-envs.json を参照
// =============================================================================

// module containerAppsEnv './modules/container-apps-env.bicep' = {
//   scope: rg
//   name: 'containerAppsEnv'
//   dependsOn: [monitoring]
//   params: {
//     location: location
//     resourcePrefix: resourcePrefix
//     environment: environment
//     tags: tags
//     logAnalyticsWorkspaceId: monitoring.outputs.logAnalyticsWorkspaceId
//   }
// }

// =============================================================================
// モジュール: Container Apps（サービスごとに追加）
// TODO: discovered/<RG>-containerapp-<名前>.json を参照
// =============================================================================

// module myService './modules/my-service.bicep' = {
//   scope: rg
//   name: 'myService'
//   dependsOn: [containerAppsEnv, containerRegistry]
//   params: {
//     location: location
//     resourcePrefix: resourcePrefix
//     environment: environment
//     tags: tags
//     containerAppsEnvId: containerAppsEnv.outputs.containerAppsEnvId
//     containerRegistryName: containerRegistry.outputs.containerRegistryName
//   }
// }

// =============================================================================
// 出力
// TODO: 後続のモジュールや CI/CD が参照する出力値を定義する
// =============================================================================

// output resourceGroupName string = rg.name
// output containerRegistryLoginServer string = containerRegistry.outputs.loginServer
// output cosmosDbEndpoint string = cosmosDb.outputs.endpoint
