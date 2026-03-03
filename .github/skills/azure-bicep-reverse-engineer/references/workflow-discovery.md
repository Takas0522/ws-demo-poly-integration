# Azure リソース調査ワークフロー

## Phase 1: 事前準備 {#phase1}

### 1-1. ログインとサブスクリプション確認

```bash
# ログイン状態の確認
az account show --output table

# 利用可能なサブスクリプション一覧
az account list --output table

# 対象サブスクリプションに切り替え
az account set --subscription "<SUBSCRIPTION_ID_OR_NAME>"

# 現在のコンテキスト確認
az account show --query "{id:id, name:name, tenantId:tenantId}" --output table
```

### 1-2. 必要な権限の確認

Bicep 生成作業には最低限「Reader」ロールが必要です。リソースの設定詳細取得には以下の権限が必要になる場合があります。

```bash
# 自分のロール割り当て確認（サブスクリプションレベル）
az role assignment list --assignee $(az account show --query user.name -o tsv) \
  --include-inherited --output table

# リソースグループレベルの権限確認
az role assignment list \
  --assignee $(az account show --query user.name -o tsv) \
  --resource-group "<RESOURCE_GROUP>" \
  --output table
```

| 必要権限                                      | 用途                                               |
| --------------------------------------------- | -------------------------------------------------- |
| `Reader`                                      | リソース一覧・設定取得                             |
| `Key Vault Reader` / `Key Vault Secrets User` | Key Vault の設定確認（シークレット値は取得しない） |
| `Cosmos DB Account Reader Role`               | Cosmos DB の設定確認                               |

> **注意**: シークレット値、接続文字列、APIキーは絶対に取得・記録しないこと。

---

## Phase 2: リソース収集 {#phase2}

### 2-1. リソースグループの一覧取得

```bash
# 全リソースグループ
az group list --output table

# タグでフィルタリング（例: 環境タグ）
az group list --query "[?tags.Environment=='dev']" --output table

# JSON で保存
az group list --output json > discovered/resource-groups.json
```

### 2-2. リソースグループ内の全リソース棚卸

```bash
RG="rg-my-project-dev"

# リソース一覧（種別・名前・場所・タグ）
az resource list \
  --resource-group "$RG" \
  --query "[].{name:name, type:type, location:location, id:id}" \
  --output table

# JSON で保存（詳細情報含む）
az resource list \
  --resource-group "$RG" \
  --output json > "discovered/${RG}-resources.json"
```

### 2-3. リソースタイプ別の詳細取得

収集スクリプト [scripts/collect_resources.sh](../scripts/collect_resources.sh) を使うと自動的に以下を実行します。手動で行う場合は以下のコマンドを参照してください。

#### Container Apps 環境とアプリ

```bash
RG="rg-my-project-dev"

# Container Apps 環境
az containerapp env list --resource-group "$RG" --output json \
  > "discovered/containerapp-envs.json"

# 各 Container App
az containerapp list --resource-group "$RG" --output json \
  > "discovered/containerapps.json"

# 個別の Container App 詳細（シークレット除く）
for APP in $(az containerapp list -g "$RG" --query "[].name" -o tsv); do
  az containerapp show -g "$RG" -n "$APP" \
    --query "{name:name, location:location, properties: {configuration: {ingress: properties.configuration.ingress, registries: properties.configuration.registries, activeRevisionsMode: properties.configuration.activeRevisionsMode}, template: properties.template, environmentId: properties.environmentId}}" \
    --output json > "discovered/containerapp-${APP}.json"
done
```

#### Cosmos DB

```bash
# Cosmos DB アカウント一覧
az cosmosdb list --resource-group "$RG" --output json \
  > "discovered/cosmosdb-accounts.json"

# 各アカウントの設定
for ACCOUNT in $(az cosmosdb list -g "$RG" --query "[].name" -o tsv); do
  # アカウント詳細
  az cosmosdb show -g "$RG" -n "$ACCOUNT" --output json \
    > "discovered/cosmosdb-${ACCOUNT}.json"

  # データベース一覧
  az cosmosdb sql database list -g "$RG" -a "$ACCOUNT" --output json \
    > "discovered/cosmosdb-${ACCOUNT}-databases.json"

  # 各データベースのコンテナ
  for DB in $(az cosmosdb sql database list -g "$RG" -a "$ACCOUNT" --query "[].name" -o tsv); do
    az cosmosdb sql container list -g "$RG" -a "$ACCOUNT" -d "$DB" --output json \
      > "discovered/cosmosdb-${ACCOUNT}-${DB}-containers.json"
  done
done
```

#### Container Registry

```bash
az acr list --resource-group "$RG" --output json > "discovered/acr.json"

for ACR in $(az acr list -g "$RG" --query "[].name" -o tsv); do
  az acr show -g "$RG" -n "$ACR" --output json > "discovered/acr-${ACR}.json"
done
```

#### Key Vault

```bash
# Key Vault のメタデータのみ（シークレット値は取得しない）
az keyvault list --resource-group "$RG" --output json > "discovered/keyvaults.json"

for KV in $(az keyvault list -g "$RG" --query "[].name" -o tsv); do
  # アクセスポリシーとネットワーク設定のみ（シークレット値は取得しない）
  az keyvault show -g "$RG" -n "$KV" \
    --query "{name:name, location:location, properties: {sku: properties.sku, accessPolicies: properties.accessPolicies, networkAcls: properties.networkAcls, enableRbacAuthorization: properties.enableRbacAuthorization, enableSoftDelete: properties.enableSoftDelete, softDeleteRetentionInDays: properties.softDeleteRetentionInDays}}" \
    --output json > "discovered/keyvault-${KV}.json"
done
```

#### App Service / Web Apps

```bash
az webapp list --resource-group "$RG" --output json > "discovered/webapps.json"

for APP in $(az webapp list -g "$RG" --query "[].name" -o tsv); do
  az webapp show -g "$RG" -n "$APP" --output json > "discovered/webapp-${APP}.json"

  # App Serviceプランも取得
  PLAN_ID=$(az webapp show -g "$RG" -n "$APP" --query appServicePlanId -o tsv)
  az appservice plan show --ids "$PLAN_ID" --output json \
    > "discovered/appplan-$(basename $PLAN_ID).json"
done
```

#### Log Analytics / Application Insights

```bash
az monitor log-analytics workspace list -g "$RG" --output json \
  > "discovered/log-analytics.json"

az monitor app-insights component list -g "$RG" --output json \
  > "discovered/app-insights.json"
```

#### ネットワーク系

```bash
az network vnet list -g "$RG" --output json > "discovered/vnets.json"
az network nsg list -g "$RG" --output json > "discovered/nsgs.json"
az network public-ip list -g "$RG" --output json > "discovered/public-ips.json"
```

### 2-4. RBAC・IAM 設定の収集

```bash
# リソースグループレベルのロール割り当て
az role assignment list \
  --scope "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RG" \
  --output json > "discovered/role-assignments.json"

# マネージドID の確認
az identity list --resource-group "$RG" --output json > "discovered/managed-identities.json"
```

---

## Phase 3: 依存関係分析 {#phase3}

### 3-1. リソース間の依存関係を整理する観点

収集した JSON ファイルから以下の依存関係を特定します。

| 依存元        | 依存先                        | 確認キー                                                                   |
| ------------- | ----------------------------- | -------------------------------------------------------------------------- |
| Container App | Container Apps 環境           | `properties.environmentId`                                                 |
| Container App | Container Registry            | `properties.configuration.registries[].server`                             |
| Container App | Key Vault（参照シークレット） | `properties.configuration.secrets[].keyVaultUrl`                           |
| Container App | マネージドID                  | `identity.userAssignedIdentities`                                          |
| App Service   | App Service Plan              | `properties.serverFarmId`                                                  |
| App Service   | Application Insights          | `properties.siteConfig.appSettings[APPLICATIONINSIGHTS_CONNECTION_STRING]` |
| Cosmos DB     | マネージドID（RBAC）          | `properties.ipRules`, ロール割り当て                                       |
| Key Vault     | アクセスポリシー / RBAC       | `properties.accessPolicies` or RBAC                                        |

### 3-2. 依存関係マップの作成

```bash
# jq で環境IDからリソース名を逆引き
cat discovered/containerapps.json | jq -r '.[] | {app: .name, env: .properties.environmentId}'

# タグの一覧を確認して命名規則を把握
cat discovered/<RG>-resources.json | jq '[.[] | {name, type, tags}]'

# リソースIDのパターンを確認
cat discovered/<RG>-resources.json | jq '[.[] | .id] | sort'
```

### 3-3. 命名規則・タグ規則の確認

```bash
# タグのキー一覧
cat discovered/<RG>-resources.json | jq '[.[] | .tags // {} | keys] | add | unique'

# 使用中のロケーション
cat discovered/<RG>-resources.json | jq '[.[] | .location] | unique'
```

---

## 収集データの整理

全フェーズ完了後、`discovered/` ディレクトリには以下のファイルが揃っているはずです。

```
discovered/
├── resource-groups.json
├── <RG>-resources.json
├── role-assignments.json
├── managed-identities.json
├── containerapp-envs.json
├── containerapps.json
├── containerapp-<名前>.json       # 各アプリ個別
├── cosmosdb-accounts.json
├── cosmosdb-<名前>.json           # 各アカウント個別
├── cosmosdb-<名前>-databases.json
├── cosmosdb-<名前>-<DB>-containers.json
├── acr.json
├── acr-<名前>.json
├── keyvaults.json
├── keyvault-<名前>.json
├── webapps.json
├── webapp-<名前>.json
├── log-analytics.json
├── app-insights.json
└── vnets.json
```

次のステップ: [Bicep 生成ワークフロー](./workflow-bicep-gen.md)
