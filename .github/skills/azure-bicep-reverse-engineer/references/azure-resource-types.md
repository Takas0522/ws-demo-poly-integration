# Azure リソースタイプ早見表

## ARM リソースタイプ → Bicep 型名

| Azureサービス | ARM type | Bicep リソース型 | 参考ドキュメント |
|------------|---------|----------------|----------------|
| Container Apps 環境 | `Microsoft.App/managedEnvironments` | `Microsoft.App/managedEnvironments@2023-05-01` | [learn.microsoft.com](https://learn.microsoft.com/azure/templates/microsoft.app/managedenvironments) |
| Container App | `Microsoft.App/containerApps` | `Microsoft.App/containerApps@2023-05-01` | [learn.microsoft.com](https://learn.microsoft.com/azure/templates/microsoft.app/containerapps) |
| Container Registry | `Microsoft.ContainerRegistry/registries` | `Microsoft.ContainerRegistry/registries@2023-01-01-preview` | [learn.microsoft.com](https://learn.microsoft.com/azure/templates/microsoft.containerregistry/registries) |
| Cosmos DB アカウント | `Microsoft.DocumentDB/databaseAccounts` | `Microsoft.DocumentDB/databaseAccounts@2023-11-15` | [learn.microsoft.com](https://learn.microsoft.com/azure/templates/microsoft.documentdb/databaseaccounts) |
| Cosmos DB SQL DB | `Microsoft.DocumentDB/databaseAccounts/sqlDatabases` | `Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-11-15` | [learn.microsoft.com](https://learn.microsoft.com/azure/templates/microsoft.documentdb/databaseaccounts/sqldatabases) |
| Cosmos DB SQL Container | `Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers` | `Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-11-15` | [learn.microsoft.com](https://learn.microsoft.com/azure/templates/microsoft.documentdb/databaseaccounts/sqldatabases/containers) |
| Key Vault | `Microsoft.KeyVault/vaults` | `Microsoft.KeyVault/vaults@2023-07-01` | [learn.microsoft.com](https://learn.microsoft.com/azure/templates/microsoft.keyvault/vaults) |
| Key Vault シークレット | `Microsoft.KeyVault/vaults/secrets` | `Microsoft.KeyVault/vaults/secrets@2023-07-01` | [learn.microsoft.com](https://learn.microsoft.com/azure/templates/microsoft.keyvault/vaults/secrets) |
| Log Analytics Workspace | `Microsoft.OperationalInsights/workspaces` | `Microsoft.OperationalInsights/workspaces@2022-10-01` | [learn.microsoft.com](https://learn.microsoft.com/azure/templates/microsoft.operationalinsights/workspaces) |
| Application Insights | `Microsoft.Insights/components` | `Microsoft.Insights/components@2020-02-02` | [learn.microsoft.com](https://learn.microsoft.com/azure/templates/microsoft.insights/components) |
| App Service | `Microsoft.Web/sites` | `Microsoft.Web/sites@2023-01-01` | [learn.microsoft.com](https://learn.microsoft.com/azure/templates/microsoft.web/sites) |
| App Service Plan | `Microsoft.Web/serverfarms` | `Microsoft.Web/serverfarms@2023-01-01` | [learn.microsoft.com](https://learn.microsoft.com/azure/templates/microsoft.web/serverfarms) |
| Virtual Network | `Microsoft.Network/virtualNetworks` | `Microsoft.Network/virtualNetworks@2023-09-01` | [learn.microsoft.com](https://learn.microsoft.com/azure/templates/microsoft.network/virtualnetworks) |
| Network Security Group | `Microsoft.Network/networkSecurityGroups` | `Microsoft.Network/networkSecurityGroups@2023-09-01` | [learn.microsoft.com](https://learn.microsoft.com/azure/templates/microsoft.network/networksecuritygroups) |
| Public IP | `Microsoft.Network/publicIPAddresses` | `Microsoft.Network/publicIPAddresses@2023-09-01` | [learn.microsoft.com](https://learn.microsoft.com/azure/templates/microsoft.network/publicipaddresses) |
| ユーザー割り当てマネージドID | `Microsoft.ManagedIdentity/userAssignedIdentities` | `Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31` | [learn.microsoft.com](https://learn.microsoft.com/azure/templates/microsoft.managedidentity/userassignedidentities) |
| ロール割り当て | `Microsoft.Authorization/roleAssignments` | `Microsoft.Authorization/roleAssignments@2022-04-01` | [learn.microsoft.com](https://learn.microsoft.com/azure/templates/microsoft.authorization/roleassignments) |
| ロール定義（カスタム） | `Microsoft.Authorization/roleDefinitions` | `Microsoft.Authorization/roleDefinitions@2022-05-01-preview` | [learn.microsoft.com](https://learn.microsoft.com/azure/templates/microsoft.authorization/roledefinitions) |

---

## よく使う Azure CLI コマンド早見表

### リソース情報取得

```bash
# リソース一覧
az resource list --resource-group <RG> --output table

# リソース詳細（IDから）
az resource show --ids <RESOURCE_ID>

# リソース詳細（名前から）
az resource show \
  --resource-group <RG> \
  --resource-type <TYPE> \
  --name <NAME>

# ARM テンプレートとしてエクスポート
az group export --resource-group <RG> --output json
```

### API バージョン確認

```bash
# プロバイダーのリソースタイプと API バージョン一覧
az provider show --namespace Microsoft.App \
  --query "resourceTypes[].{type:resourceType, versions:apiVersions}" \
  --output table

# 特定タイプの API バージョン
az provider show \
  --namespace Microsoft.DocumentDB \
  --query "resourceTypes[?resourceType=='databaseAccounts'].apiVersions" \
  --output json
```

### Bicep CLI 操作

```bash
# Bicep ビルド（ARM JSONへ）
az bicep build --file main.bicep

# ARM JSON から Bicep へ変換
az bicep decompile --file template.json

# Bicep バージョン確認
az bicep version

# Bicep アップグレード
az bicep upgrade
```

---

## Cosmos DB 設定値の対応表

### capabilities（機能フラグ）

| 収集 JSON の値 | 意味 | Bicep 記述 |
|-------------|------|-----------|
| `EnableServerless` | サーバーレスモード | `{ name: 'EnableServerless' }` |
| `EnableMongo` | MongoDB API | `{ name: 'EnableMongo' }` |
| `EnableGremlin` | Gremlin API | `{ name: 'EnableGremlin' }` |
| `EnableTable` | Table API | `{ name: 'EnableTable' }` |

### consistencyPolicy

| 収集 JSON の値 | Bicep の値 |
|-------------|-----------|
| `Session` | `'Session'` |
| `Strong` | `'Strong'` |
| `Eventual` | `'Eventual'` |
| `BoundedStaleness` | `'BoundedStaleness'` |
| `ConsistentPrefix` | `'ConsistentPrefix'` |

---

## Container Apps スケーリングルール

収集した Container App JSON の `properties.template.scale` を Bicep に変換する際の対応:

```json
// 収集 JSON
"scale": {
  "minReplicas": 0,
  "maxReplicas": 3,
  "rules": [
    {
      "name": "http-rule",
      "http": { "metadata": { "concurrentRequests": "100" } }
    }
  ]
}
```

```bicep
// Bicep
scale: {
  minReplicas: minReplicas
  maxReplicas: maxReplicas
  rules: [
    {
      name: 'http-rule'
      http: {
        metadata: {
          concurrentRequests: '100'
        }
      }
    }
  ]
}
```
