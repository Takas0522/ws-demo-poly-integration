@description('App Service Plan名')
param name string

@description('リージョン')
param location string

@description('SKU設定')
param sku object

@description('タグ')
param tags object

resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: name
  location: location
  tags: tags
  sku: sku
  kind: 'linux'
  properties: {
    reserved: true
  }
}

output id string = appServicePlan.id
output name string = appServicePlan.name
