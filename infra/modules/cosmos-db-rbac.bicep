// =============================================================================
// Cosmos DB RBAC ロール割り当てモジュール
// =============================================================================
//
// Container App のマネージドIDに対して Cosmos DB Built-in Data Contributor
// ロールを割り当てる。Container App デプロイ後に呼び出す。
// =============================================================================

@description('Cosmos DB アカウント名')
param cosmosAccountName string

@description('Cosmos DB データ操作を許可するプリンシパルIDの配列')
param dataContributorPrincipalIds array

// -----------------------------------------------------------------------------
// 既存の Cosmos DB アカウントを参照
// -----------------------------------------------------------------------------
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' existing = {
  name: cosmosAccountName
}

// -----------------------------------------------------------------------------
// RBAC: Cosmos DB Built-in Data Contributor ロール割り当て
// Built-in Data Contributor ロールID: 00000000-0000-0000-0000-000000000002
// -----------------------------------------------------------------------------
resource cosmosDataContributorRoleAssignment 'Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments@2023-04-15' = [for (principalId, i) in dataContributorPrincipalIds: {
  parent: cosmosAccount
  name: guid(cosmosAccount.id, principalId, '00000000-0000-0000-0000-000000000002')
  properties: {
    roleDefinitionId: '${cosmosAccount.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002'
    principalId: principalId
    scope: cosmosAccount.id
  }
}]
