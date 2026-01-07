# ws-demo-poly-integration

🎯 SaaS管理者Webアプリケーション - マルチテナント権限管理システム

## 📋 概要

このリポジトリは、複数のマイクロサービスを統合したSaaS管理者向けWebアプリケーションの開発環境です。Azure CosmosDBを使用したマルチテナントアーキテクチャと、きめ細かな権限管理システムを実装しています。

## 🏗️ アーキテクチャ

このプロジェクトは以下のサービスで構成されています：

- **Frontend** (`src/front`) - React TypeScript製のWebアプリケーション
- **Auth Service** (`src/auth-service`) - JWT認証サービス
- **User Management Service** (`src/user-management-service`) - ユーザー管理サービス
- **Service Settings Service** (`src/service-setting-service`) - サービス設定管理サービス

## 🚀 ローカル開発環境のセットアップ

### 前提条件

- [Visual Studio Code](https://code.visualstudio.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### DevContainerでの起動

1. リポジトリをクローンします：
   ```bash
   git clone --recursive https://github.com/Takas0522/ws-demo-poly-integration.git
   cd ws-demo-poly-integration
   ```

2. Visual Studio Codeでフォルダを開きます：
   ```bash
   code .
   ```

3. VS Codeで「Reopen in Container」を選択します
   - コマンドパレット（`Ctrl+Shift+P` / `Cmd+Shift+P`）から `Dev Containers: Reopen in Container` を実行

4. コンテナのビルドと起動を待ちます（初回は数分かかります）

### 含まれている開発環境

DevContainerには以下がプリインストールされています：

- **Node.js 20** - フロントエンドとバックエンドサービス用
- **Python 3.11** - スクリプトとツール用
- **Azure CLI** - Azureリソース管理用
- **Git & GitHub CLI** - バージョン管理
- **CosmosDB Emulator** - ローカル開発用データベース

### CosmosDB Emulatorへの接続

CosmosDB Emulatorは自動的に起動し、以下のエンドポイントで利用可能です：

- **エンドポイント**: `https://localhost:8081`
- **プライマリキー**: `C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==`

#### 接続テスト

VS Code内のターミナルで以下のコマンドを実行して接続を確認：

```bash
# CosmosDB Emulatorの状態確認
curl -k https://localhost:8081/_explorer/emulator.pem

# Azure CLIを使用した接続テスト
az cosmosdb list-connection-strings --resource-group dummy --name dummy 2>/dev/null || echo "Emulator is running locally"
```

#### VS Code拡張機能からの接続

1. Azure Cosmos DB拡張機能を開く
2. 「Attach Emulator」をクリック
3. デフォルトのエンドポイントとキーで接続

### サブモジュールの初期化

サブモジュールが初期化されていない場合：

```bash
git submodule update --init --recursive
```

### 各サービスの起動

各サービスのディレクトリに移動して起動します：

```bash
# Frontend
cd src/front
npm install
npm run dev

# Auth Service
cd src/auth-service
npm install
npm start

# User Management Service
cd src/user-management-service
npm install
npm start

# Service Settings Service
cd src/service-setting-service
npm install
npm start
```

## 🔧 開発ツール

### インストール済みVS Code拡張機能

- **Azure Cosmos DB** - データベース管理
- **Docker** - コンテナ管理
- **ESLint & Prettier** - コードフォーマット
- **Python & Pylance** - Python開発
- **GitLens** - Git統合
- **REST Client** - API テスト
- **OpenAPI** - API仕様管理

### ポートフォワーディング

以下のポートが自動的にフォワードされます：

- `3000` - Frontend
- `3001` - Auth Service
- `3002` - User Management Service
- `3003` - Service Settings Service
- `8081` - CosmosDB Emulator

## 📚 ドキュメント

- [開発計画](DEVELOPMENT_PLAN.md) - プロジェクト全体の開発計画とフェーズ
- [GitHub Issues](https://github.com/Takas0522/ws-demo-poly-integration/issues) - タスクと進捗管理

## 🤝 貢献

詳細な開発手順とIssueについては、[DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)を参照してください。

## 📄 ライセンス

このプロジェクトは[LICENSE](LICENSE)ファイルに基づいてライセンスされています。