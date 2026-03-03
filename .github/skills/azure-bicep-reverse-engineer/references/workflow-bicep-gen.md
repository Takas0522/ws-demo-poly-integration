# Bicep コード生成ワークフロー

## 概要

`workflow-discovery.md` で収集した JSON データを元に、Bicep IaC コードを生成します。

---

## Phase 4: Bicep コード生成

### 4-1. 出力ディレクトリ構成を設計する

まず生成する Bicep の構成を決定します。

**推奨ディレクトリ構成（モジュール分割型）:**

```
infra/
├── main.bicep                  # オーケストレーション（エントリポイント）
├── main.bicepparam             # パラメータファイル（環境別）
├── modules/
│   ├── monitoring.bicep        # Log Analytics + Application Insights
│   ├── container-registry.bicep
│   ├── cosmos-db.bicep
│   ├── key-vault.bicep
│   ├── container-apps-env.bicep
│   └── container-app.bicep     # 各アプリ用（または個別ファイル）
└── parameters/
    ├── dev.bicepparam
    ├── staging.bicepparam
    └── production.bicepparam
```

### 4-2. az bicep decompile による自動変換（利用可能な場合）

ARM テンプレート (JSON) が入手できる場合は、Bicep CLI の decompile 機能を活用します。

```bash
# ARM テンプレートのエクスポート（リソースグループ全体）
az group export \
  --resource-group "rg-my-project-dev" \
  --output json > discovered/arm-export.json

# Bicep に変換
az bicep decompile --file discovered/arm-export.json

# 生成された arm-export.bicep を確認・整形
# ※ decompile 結果は必ず手動レビューが必要
```

> **注意**: `az group export` は一部のリソースタイプでシークレットを含める場合があります。
> `--skip-resource-name-params` オプションの利用を検討してください。

### 4-3. 収集 JSON から手動で Bicep を記述する手順

`az bicep decompile` が使えない、または不完全な場合は以下の手順で手動作成します。

#### ステップ1: リソースタイプと API バージョンの確認

```bash
# リソースタイプの一覧確認
cat discovered/<RG>-resources.json | jq -r '.[].type' | sort -u

# 各タイプの最新 API バージョン確認
az provider show \
  --namespace Microsoft.ContainerRegistry \
  --query "resourceTypes[?resourceType=='registries'].apiVersions" \
  --output json

# または Bicep 対応 API バージョンをブラウザで確認
# https://learn.microsoft.com/azure/templates/
```

#### ステップ2: テンプレートのスキャフォールドから開始

[templates/bicep-scaffold.bicep](../templates/bicep-scaffold.bicep) をコピーして開始します。

```bash
cp .github/skills/azure-bicep-reverse-engineer/templates/bicep-scaffold.bicep infra/main.bicep
```

#### ステップ3: リソースタイプ別の変換手順

**Container Apps 環境:**

```json
// collected JSON の重要フィールド（例）
{
  "name": "cae-my-project-dev",
  "location": "japaneast",
  "properties": {
    "appLogsConfiguration": {
      "destination": "log-analytics",
      "logAnalyticsConfiguration": { "customerId": "...", "sharedKey": "..." }
    },
    "zoneRedundant": false
  }
}
```

↓ Bicep に変換:

```bicep
resource containerAppsEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: 'cae-${resourcePrefix}-${environment}'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey  // Key Vault 参照に変更推奨
      }
    }
    zoneRedundant: false
  }
}
```

**Cosmos DB アカウント:**

```bicep
resource cosmosDb 'Microsoft.DocumentDB/databaseAccounts@2023-11-15' = {
  name: 'cosmos-${resourcePrefix}-${environment}'
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    // JSON の properties.capabilities から取得
    capabilities: [
      { name: 'EnableServerless' }
    ]
    // JSON の properties.locations から取得
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    // JSON の properties.consistencyPolicy から取得
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    // JSON の properties.ipRules から取得
    ipRules: []
    isVirtualNetworkFilterEnabled: false
    enableAutomaticFailover: false
    publicNetworkAccess: 'Enabled'
  }
}
```

**Container Registry:**

```bicep
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' = {
  name: 'acr${replace(resourcePrefix, '-', '')}${environment}'  // ハイフン除去
  location: location
  sku: {
    // JSON の sku.name から取得（Basic / Standard / Premium）
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false  // セキュリティのため false 推奨
  }
}
```

#### ステップ4: シークレット・接続文字列の処理

> **重要**: 収集した JSON にシークレット値が含まれている場合でも、Bicep コード内にハードコードしないこと。

```bicep
// NG: ハードコード
param connectionString string = 'AccountEndpoint=https://...'

// OK: セキュアパラメータにする
@secure()
param jwtSecretKey string

// OK: Key Vault 参照にする
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

// シークレット参照の例（Container App のシークレット）
// Bicep で直接 Key Vault 参照を使うか、デプロイ時に渡す
```

#### ステップ5: パラメータ化の原則

環境差異を吸収するためにパラメータ化する項目:

| 項目 | パラメータ例 | 理由 |
|------|------------|------|
| 環境名 | `param environment string` | dev/staging/prod で変わる |
| リソースプレフィックス | `param resourcePrefix string` | 名前の一貫性 |
| レプリカ数 | `param minReplicas int = 0` | 環境依存 |
| SKU | `param cosmosSkuName string = 'Standard'` | コスト最適化 |
| 許可 IP 帯域 | `param allowedIpRanges array = []` | セキュリティ設定 |
| シークレット | `@secure() param jwtSecretKey string` | 機密情報 |

### 4-4. 依存関係を Bicep の参照で表現する

```bicep
// シンボリック参照（同一ファイル内）
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = { ... }

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  properties: {
    WorkspaceResourceId: logAnalytics.id  // 依存関係を参照で表現
  }
}

// モジュール出力経由の参照
module monitoring './modules/monitoring.bicep' = { ... }

resource containerAppsEnv '...' = {
  properties: {
    appLogsConfiguration: {
      logAnalyticsConfiguration: {
        customerId: monitoring.outputs.logAnalyticsWorkspaceId
      }
    }
  }
}
```

---

## Phase 5: 検証 {#validation}

### 5-1. Bicep のビルド（構文チェック）

```bash
az bicep build --file infra/main.bicep
```

### 5-2. What-if デプロイ（影響確認）

```bash
# サブスクリプションスコープ
az deployment sub what-if \
  --location japaneast \
  --template-file infra/main.bicep \
  --parameters infra/parameters/dev.bicepparam \
  --result-format FullResourcePayloads

# リソースグループスコープ
az deployment group what-if \
  --resource-group "rg-my-project-dev" \
  --template-file infra/modules/cosmos-db.bicep \
  --parameters @infra/parameters/dev.json
```

### 5-3. バリデーション（ドライラン）

```bash
# Bicep テンプレートのバリデーション（実際のデプロイなし）
az deployment sub validate \
  --location japaneast \
  --template-file infra/main.bicep \
  --parameters infra/parameters/dev.bicepparam
```

### 5-4. 生成 Bicep のチェックリスト

| チェック項目 | 確認方法 |
|------------|---------|
| シークレット値がハードコードされていない | `grep -r "password\|secret\|key" infra/*.bicep` でスクリーニング |
| `@secure()` デコレータが適用されている | シークレット系パラメータに付与されているか確認 |
| API バージョンが最新または安定版 | `az bicep build` の警告を確認 |
| 依存関係がシンボリック参照で表現されている | `dependsOn` の代わりに参照を使用 |
| パラメータが環境別ファイルに分離されている | `parameters/dev.bicepparam` などが存在するか |
| リソース名がパラメータ化されている | ハードコードされた名前が残っていないか |
| タグが全リソースに付与されている | `tags: tags` が各リソースに含まれているか |

---

## 参考: Azure リソースタイプ早見表

詳細は [azure-resource-types.md](./azure-resource-types.md) を参照してください。

---

## トラブルシューティング

| 問題 | 原因 | 解決策 |
|------|------|--------|
| `az group export` が失敗する | 権限不足 | `Reader` ロールが必要 |
| `az bicep decompile` で不完全な変換 | 複雑なリソース設定 | 手動で該当箇所を補完 |
| What-if で `NoChange` にならない | パラメータ不一致 | 収集 JSON と Bicep パラメータを照合 |
| API バージョンエラー | 古い API バージョン指定 | `az provider show` で最新版を確認 |
| シンタックスエラー | タイプミス | `az bicep build` のエラーメッセージを確認 |
