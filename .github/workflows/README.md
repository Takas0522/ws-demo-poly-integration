# GitHub Actions Workflows

このディレクトリには、CI/CDパイプラインのためのGitHub Actionsワークフローが含まれています。

## ワークフロー一覧

### 1. CI Pipeline (`ci.yml`)

**トリガー**:
- `main`、`develop`ブランチへのプッシュ
- `main`、`develop`ブランチへのプルリクエスト

**実行内容**:
- フロントエンド（Next.js）のビルドとLint
- バックエンド（Python FastAPI）のLint、テスト、構文チェック
- Bicep IaCテンプレートのバリデーション

**ジョブ**:
- `frontend-ci`: Next.jsアプリケーションのCI
- `backend-auth-service-ci`: 認証認可サービスのCI
- `backend-tenant-service-ci`: テナント管理サービスのCI
- `backend-service-setting-ci`: サービス設定サービスのCI
- `infrastructure-ci`: Bicepテンプレートの検証
- `ci-summary`: CI結果のサマリー表示

---

### 2. Deploy to Azure (`deploy.yml`)

**トリガー**:
- `main`ブランチへのプッシュ
- 手動トリガー（`workflow_dispatch`）

**実行内容**:
- Azure環境へのインフラストラクチャデプロイ（Bicep）
- バックエンドサービスのDockerイメージビルド＆プッシュ
- Azure Container Appsへのバックエンドデプロイ
- Azure App Serviceへのフロントエンドデプロイ

**ジョブ**:
- `deploy-infrastructure`: Bicepテンプレートを使用したインフラデプロイ
- `build-and-push-images`: Dockerイメージのビルドとプッシュ
- `deploy-backend-services`: Container Appsへのデプロイ
- `deploy-frontend`: App Serviceへのフロントエンドデプロイ
- `deployment-summary`: デプロイ結果のサマリー表示

**パラメータ**（手動トリガー時）:
- `environment`: デプロイ先環境（`dev` または `prod`）

---

### 3. Database Setup (`database-setup.yml`)

**トリガー**:
- 手動トリガーのみ（`workflow_dispatch`）

**実行内容**:
- Cosmos DBのデータベースとコンテナの初期化
- シードデータの投入
- データベース構造の検証

**ジョブ**:
- `initialize-database`: データベースとコンテナの作成
- `seed-database`: シードデータの投入
- `verify-database`: データベース構造の検証
- `database-setup-summary`: セットアップ結果のサマリー表示

**パラメータ**:
- `environment`: ターゲット環境（`dev` または `prod`）
- `initialize_only`: データベースの初期化のみ実行（シードデータをスキップ）
- `reset_data`: 既存データをリセット（⚠️ 警告: すべてのデータが削除されます）

---

## 必要なGitHub Secrets

以下のシークレットをGitHubリポジトリに設定する必要があります。

### 必須シークレット

| シークレット名 | 説明 | 取得方法 |
|--------------|------|---------|
| `AZURE_CREDENTIALS` | Azureサービスプリンシパルの認証情報 | Azure CLIで作成 |
| `JWT_SECRET` | JWT署名用の秘密鍵 | 任意の安全な文字列を生成 |

### Azure認証情報の作成

```bash
# サービスプリンシパルを作成
az ad sp create-for-rbac \
  --name "github-actions-poly-integration" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/rg-poly-integration-poc \
  --sdk-auth

# 出力されたJSONをGitHub SecretsのAZURE_CREDENTIALSに設定
```

**出力例**:
```json
{
  "clientId": "xxxxx-xxxx-xxxx-xxxx-xxxxxxxxx",
  "clientSecret": "xxxxx~xxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxx-xxxx-xxxx-xxxx-xxxxxxxxx",
  "tenantId": "xxxxx-xxxx-xxxx-xxxx-xxxxxxxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

### JWT秘密鍵の生成

```bash
# 安全なランダム文字列を生成（例）
openssl rand -base64 32
```

---

## GitHub Secretsの設定方法

1. GitHubリポジトリのページを開く
2. **Settings** → **Secrets and variables** → **Actions** に移動
3. **New repository secret** をクリック
4. シークレット名と値を入力して **Add secret** をクリック

---

## ワークフローの実行方法

### CI Pipeline（自動実行）

- プルリクエスト作成時に自動実行
- `main`または`develop`ブランチへのプッシュ時に自動実行

### デプロイ（自動/手動）

**自動実行**:
```bash
# mainブランチにマージすると自動デプロイ
git checkout main
git merge feature-branch
git push origin main
```

**手動実行**:
1. GitHubリポジトリの **Actions** タブを開く
2. **Deploy to Azure** ワークフローを選択
3. **Run workflow** をクリック
4. 環境を選択（`dev` または `prod`）
5. **Run workflow** を実行

### Database Setup（手動のみ）

1. GitHubリポジトリの **Actions** タブを開く
2. **Database Setup** ワークフローを選択
3. **Run workflow** をクリック
4. パラメータを設定:
   - **environment**: `dev` または `prod`
   - **initialize_only**: データベース初期化のみの場合はチェック
   - **reset_data**: データをリセットする場合はチェック（⚠️ 注意）
5. **Run workflow** を実行

---

## 環境変数

### CI/CD環境変数（ワークフロー内で定義）

```yaml
env:
  AZURE_RESOURCE_GROUP: rg-poly-integration-poc
  AZURE_LOCATION: japaneast
  ACR_NAME: acrpolypoc
  FRONTEND_APP_NAME: app-poly-frontend
  AUTH_SERVICE_APP_NAME: ca-auth-service
  TENANT_SERVICE_APP_NAME: ca-tenant-service
  SERVICE_SETTING_APP_NAME: ca-service-setting
  COSMOS_ACCOUNT_NAME: cosmos-poly-poc
```

これらの環境変数は、Azureリソース名と一致するように設定されています。

---

## トラブルシューティング

### CI Pipeline が失敗する場合

1. **Lintエラー**:
   - ローカルで `npm run lint` または `flake8` を実行して修正
   
2. **ビルドエラー**:
   - ローカルで `npm run build` を実行して確認
   - 依存関係が正しくインストールされているか確認

3. **テストエラー**:
   - ローカルで `pytest` を実行して確認

### デプロイが失敗する場合

1. **Azure認証エラー**:
   - `AZURE_CREDENTIALS` シークレットが正しく設定されているか確認
   - サービスプリンシパルの権限を確認

2. **リソースが見つからない**:
   - インフラストラクチャが正しくデプロイされているか確認
   - リソース名が環境変数と一致しているか確認

3. **Dockerイメージのプッシュエラー**:
   - Azure Container Registryへのアクセス権限を確認
   - Dockerfileが正しく配置されているか確認

### Database Setupが失敗する場合

1. **Cosmos DB接続エラー**:
   - Cosmos DBアカウントが存在するか確認
   - 接続文字列が正しいか確認

2. **スクリプト実行エラー**:
   - `scripts/cosmos-*.py` スクリプトが存在するか確認
   - Python依存関係が正しくインストールされているか確認

---

## ワークフローのカスタマイズ

### デプロイ先リソース名の変更

`deploy.yml`の`env`セクションでリソース名を変更できます：

```yaml
env:
  AZURE_RESOURCE_GROUP: your-resource-group
  FRONTEND_APP_NAME: your-frontend-app
  # ...
```

### 追加環境への対応

`deploy.yml`の`workflow_dispatch`セクションで環境を追加できます：

```yaml
inputs:
  environment:
    type: choice
    options:
      - dev
      - staging  # 追加
      - prod
```

---

## セキュリティベストプラクティス

### シークレット管理

- ✅ すべての機密情報をGitHub Secretsで管理
- ✅ シークレットをログに出力しない（`::add-mask::`を使用）
- ✅ 最小権限の原則でサービスプリンシパルを作成

### コード品質

- ✅ プルリクエストでCI Pipelineを必須にする
- ✅ コードレビューを必須にする
- ✅ `main`ブランチを保護する

### デプロイ戦略

- ✅ 本番環境へのデプロイは手動承認を推奨
- ✅ デプロイ前にステージング環境でテスト
- ✅ ロールバック手順を準備

---

## 関連ドキュメント

- [デプロイメント設計](../../docs/arch/deployment.md)
- [インフラストラクチャ構築](../../docs/PoCアプリ/初期構築/02-インフラ構築.md)
- [データベース設計](../../docs/PoCアプリ/初期構築/03-データベース設計・初期構築.md)

---

## 更新履歴

| 日付 | 変更内容 | 作成者 |
|------|---------|-------|
| 2024 | 初版作成 | Implementer Agent |
