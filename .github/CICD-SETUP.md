# CI/CD セットアップガイド

このドキュメントでは、GitHub Actions CI/CDパイプラインのセットアップ手順を説明します。

## 前提条件

- Azureサブスクリプション
- Azure CLIがインストールされていること
- GitHubリポジトリへの管理者アクセス権

---

## 1. Azure リソースの準備

### 1.1 Azure リソースグループの作成

```bash
# リソースグループの作成
az group create \
  --name rg-poly-integration-poc \
  --location japaneast
```

### 1.2 サービスプリンシパルの作成

GitHub ActionsがAzureにアクセスするためのサービスプリンシパルを作成します。

```bash
# サブスクリプションIDを取得
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# サービスプリンシパルを作成
az ad sp create-for-rbac \
  --name "github-actions-poly-integration" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-poly-integration-poc \
  --sdk-auth
```

**出力例**:
```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

**⚠️ この出力をコピーして保存してください。GitHub Secretsの設定に使用します。**

---

## 2. GitHub Secrets の設定

### 2.1 必須シークレット

GitHubリポジトリに以下のシークレットを設定します。

**設定方法**:
1. GitHubリポジトリのページを開く
2. **Settings** → **Secrets and variables** → **Actions** に移動
3. **New repository secret** をクリック
4. シークレット名と値を入力して **Add secret** をクリック

#### `AZURE_CREDENTIALS`

**説明**: Azureサービスプリンシパルの認証情報

**値**: 上記の`az ad sp create-for-rbac`コマンドで出力されたJSON全体をコピー

```json
{
  "clientId": "...",
  "clientSecret": "...",
  "subscriptionId": "...",
  "tenantId": "...",
  ...
}
```

#### `JWT_SECRET`

**説明**: JWT署名用の秘密鍵

**生成方法**:
```bash
# 安全なランダム文字列を生成
openssl rand -base64 32
```

**値の例**:
```
3K8x9mQ2nR7wB5vC1dF4gH6jL0pM8sT5uW9yZ2aE4bN7cQ1rV6wX3zD8fG0hJ5k
```

---

## 3. シークレット設定の確認

### 3.1 シークレット一覧の確認

GitHubリポジトリの **Settings** → **Secrets and variables** → **Actions** で、以下のシークレットが設定されていることを確認してください：

- ✅ `AZURE_CREDENTIALS`
- ✅ `JWT_SECRET`

### 3.2 権限の確認

**GitHub Actions の権限設定**:

1. **Settings** → **Actions** → **General** に移動
2. **Workflow permissions** セクションで以下を確認:
   - "Read and write permissions" が選択されている
   - "Allow GitHub Actions to create and approve pull requests" にチェックが入っている（推奨）

---

## 4. ワークフローの有効化

### 4.1 CI Pipeline の確認

1. コードをプッシュまたはプルリクエストを作成
2. **Actions** タブで `CI Pipeline` ワークフローが実行されることを確認

### 4.2 デプロイワークフローの実行

**初回デプロイ（手動実行）**:

1. **Actions** タブを開く
2. **Deploy to Azure** ワークフローを選択
3. **Run workflow** をクリック
4. 環境を選択（`dev` または `prod`）
5. **Run workflow** を実行

**注意**: 初回デプロイでは、Azureリソースが存在しない場合、インフラストラクチャのデプロイから始まります。

### 4.3 Database Setup の実行

**データベースの初期化**:

1. **Actions** タブを開く
2. **Database Setup** ワークフローを選択
3. **Run workflow** をクリック
4. パラメータを設定:
   - **environment**: `dev`
   - **initialize_only**: `false`（シードデータも投入する場合）
   - **reset_data**: `false`（初回は不要）
5. **Run workflow** を実行

---

## 5. 環境変数の設定（オプション）

### 5.1 追加の環境変数

特定の環境で追加の環境変数が必要な場合は、以下の方法で設定します。

#### リポジトリレベルの環境変数

**Settings** → **Secrets and variables** → **Actions** → **Variables** タブ

例:
- `AZURE_LOCATION`: `japaneast`
- `ENVIRONMENT`: `dev`

#### 環境ごとの変数

**Settings** → **Environments** で環境（`dev`, `prod`）を作成し、環境固有の変数を設定できます。

---

## 6. トラブルシューティング

### 6.1 認証エラー

**エラーメッセージ**: `Error: Login failed with Error: ...`

**原因**: `AZURE_CREDENTIALS` シークレットが正しく設定されていない

**解決方法**:
1. サービスプリンシパルが正しく作成されているか確認
2. `AZURE_CREDENTIALS` の値が完全なJSONであることを確認
3. サービスプリンシパルに適切な権限があるか確認

```bash
# サービスプリンシパルの確認
az ad sp list --display-name "github-actions-poly-integration"

# 権限の確認
az role assignment list \
  --assignee <client-id> \
  --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-poly-integration-poc
```

### 6.2 デプロイエラー

**エラーメッセージ**: `Resource not found`

**原因**: Azureリソースがまだ作成されていない

**解決方法**:
1. インフラストラクチャのデプロイを先に実行
2. Azureポータルでリソースが正しく作成されているか確認

```bash
# リソースグループ内のリソース一覧を確認
az resource list \
  --resource-group rg-poly-integration-poc \
  --output table
```

### 6.3 Bicep バリデーションエラー

**エラーメッセージ**: `Bicep validation failed`

**原因**: Bicepテンプレートに構文エラーがある

**解決方法**:
1. ローカルでBicepテンプレートを検証

```bash
# Bicep CLIをインストール
curl -Lo bicep https://github.com/Azure/bicep/releases/latest/download/bicep-linux-x64
chmod +x ./bicep
sudo mv ./bicep /usr/local/bin/bicep

# テンプレートの検証
bicep build infra/main.bicep
```

### 6.4 データベースセットアップエラー

**エラーメッセージ**: `Cosmos DB connection failed`

**原因**: Cosmos DBアカウントが存在しないか、接続情報が間違っている

**解決方法**:
1. Cosmos DBアカウントが作成されているか確認

```bash
# Cosmos DBアカウントの確認
az cosmosdb show \
  --name cosmos-poly-poc \
  --resource-group rg-poly-integration-poc
```

2. `scripts/cosmos-*.py` スクリプトが存在するか確認

---

## 7. セキュリティベストプラクティス

### 7.1 シークレット管理

- ✅ シークレットをコードにハードコーディングしない
- ✅ GitHub Secretsを使用してすべての機密情報を管理
- ✅ 定期的にシークレットをローテーション
- ✅ 不要になったシークレットは削除

### 7.2 権限管理

- ✅ サービスプリンシパルには最小権限の原則を適用
- ✅ 本番環境へのデプロイには承認フローを追加（推奨）
- ✅ ブランチ保護ルールを設定

### 7.3 監視

- ✅ GitHub Actionsのワークフロー実行ログを定期的に確認
- ✅ Azureのアクティビティログを監視
- ✅ 失敗したワークフローは速やかに調査

---

## 8. 次のステップ

1. **CI/CDのカスタマイズ**
   - 環境ごとの設定を追加
   - 承認フローを追加
   - 通知の設定（Slack, Teams等）

2. **セキュリティ強化**
   - Azure Key Vaultの統合
   - OIDC認証への移行（推奨）

3. **パフォーマンス最適化**
   - キャッシュの活用
   - 並列実行の最適化

---

## 参考リンク

- [GitHub Actions公式ドキュメント](https://docs.github.com/actions)
- [Azure/login Action](https://github.com/Azure/login)
- [Azure CLI リファレンス](https://docs.microsoft.com/cli/azure/)
- [Bicep ドキュメント](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)

---

## 問い合わせ

問題が発生した場合は、以下を確認してください：

1. GitHub Actionsのワークフロー実行ログ
2. Azureポータルのアクティビティログ
3. 本ドキュメントのトラブルシューティングセクション

それでも解決しない場合は、開発チームに問い合わせてください。
