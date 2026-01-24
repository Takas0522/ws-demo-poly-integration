# 開発環境初期化ガイド

このドキュメントでは、ws-demo-poly-integrationプロジェクトの開発環境をセットアップする手順を説明します。

## 📋 目次

- [前提条件](#前提条件)
- [クイックスタート](#クイックスタート)
- [詳細セットアップ手順](#詳細セットアップ手順)
- [トラブルシューティング](#トラブルシューティング)
- [次のステップ](#次のステップ)

## 前提条件

開発環境をセットアップする前に、以下のツールがインストールされていることを確認してください：

### 必須ツール

- **Docker Desktop** (v20.10以上)
  - Windows: [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
  - macOS: [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
  - Linux: [Docker Engine](https://docs.docker.com/engine/install/)
- **Visual Studio Code** (最新版)
  - [ダウンロード](https://code.visualstudio.com/)
- **VS Code拡張機能: Dev Containers**
  - [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- **Git** (v2.30以上)

### システム要件

- **メモリ**: 最低8GB RAM (16GB推奨)
- **ディスク**: 20GB以上の空き容量
- **CPU**: 4コア以上推奨

## クイックスタート

最も早く開始する方法：

### 1. リポジトリのクローン

```bash
# 統合リポジトリをクローン（サブモジュール含む）
git clone --recurse-submodules https://github.com/Takas0522/ws-demo-poly-integration.git
cd ws-demo-poly-integration
```

サブモジュールを含めずにクローンした場合：

```bash
# サブモジュールを初期化して更新
git submodule init
git submodule update
```

### 2. DevContainerで開く

1. VS Codeでプロジェクトフォルダを開く
2. 左下の緑色のアイコン (><) をクリック
3. "Reopen in Container" を選択
4. 初回は環境構築に5-10分かかります（コンテナイメージのダウンロードとビルド）

### 3. 環境の確認

DevContainerが起動したら、以下のコマンドで環境を確認：

```bash
# Node.jsバージョン確認
node --version

# Pythonバージョン確認
python3 --version

# Azure CLIバージョン確認
az --version

# CosmosDBエミュレータの状態確認
curl -k https://localhost:8081/_explorer/emulator.pem
```

すべてのコマンドが正常に実行されれば、開発環境の準備は完了です！

## 詳細セットアップ手順

### ステップ1: リポジトリのクローン

```bash
# HTTPSを使用
git clone --recurse-submodules https://github.com/Takas0522/ws-demo-poly-integration.git

# またはSSHを使用（SSH鍵を設定済みの場合）
git clone --recurse-submodules git@github.com:Takas0522/ws-demo-poly-integration.git

cd ws-demo-poly-integration
```

### ステップ2: サブモジュールの確認

このプロジェクトは以下のサブモジュールを含みます：

- `src/front` - フロントエンドアプリケーション (ws-demo-poly1)
- `src/auth-service` - 認証サービス (ws-demo-poly3)
- `src/user-management-service` - ユーザー管理サービス (ws-demo-poly2)
- `src/service-setting-service` - サービス設定サービス (ws-demo-poly4)

サブモジュールの状態を確認：

```bash
git submodule status
```

すべてのサブモジュールが正しくクローンされていることを確認してください。

### ステップ3: DevContainerの起動

#### VS Codeから起動

1. VS Codeでプロジェクトフォルダを開く
2. コマンドパレット (Ctrl+Shift+P / Cmd+Shift+P) を開く
3. "Dev Containers: Reopen in Container" を入力して選択
4. コンテナのビルドと起動を待つ（初回は5-10分）

#### 自動的に実行される処理

DevContainer起動時に以下が自動実行されます：

1. **Cosmos DBエミュレータの起動**
   - Docker Composeで自動的に起動
   - エンドポイント: `https://localhost:8081`

2. **環境変数の設定**
   - `.env.development`から`.env`ファイルを自動生成
   - 開発に必要な環境変数が設定される

3. **依存パッケージのインストール**
   - Node.js、Python、Azure CLIツールのインストール

4. **CosmosDBの初期化**
   - データベース `saas-management-dev` の作成
   - 必要なコンテナ（Tenants, Users, Permissions, AuditLogs）の作成
   - 開発用初期データのシード

### ステップ4: 環境変数の確認

DevContainerが起動したら、環境変数が正しく設定されているか確認：

```bash
# 環境変数の確認
cat .env

# 必要な環境変数が設定されているか確認
echo $COSMOSDB_ENDPOINT
echo $COSMOSDB_DATABASE
```

### ステップ5: CosmosDBの動作確認

```bash
# CosmosDBエミュレータへの接続テスト
curl -k https://localhost:8081/_explorer/emulator.pem

# データベースの確認（Pythonスクリプト）
python3 << 'EOF'
from azure.cosmos import CosmosClient
import warnings
warnings.filterwarnings('ignore')

client = CosmosClient(
    'https://localhost:8081',
    'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==',
    connection_verify=False
)

print("データベース一覧:")
for db in client.list_databases():
    print(f"  - {db['id']}")
EOF
```

## トラブルシューティング

### 問題: DevContainerのビルドが失敗する

**解決策:**

1. Docker Desktopが起動していることを確認
2. Docker Desktopのリソース設定を確認（メモリ4GB以上、CPU 2コア以上）
3. VS Codeの「Dev Containers」拡張機能がインストールされているか確認
4. キャッシュをクリアして再ビルド：
   ```
   コマンドパレット > Dev Containers: Rebuild Container Without Cache
   ```

### 問題: CosmosDBエミュレータに接続できない

**症状:** `curl -k https://localhost:8081` が失敗する

**解決策:**

1. CosmosDBコンテナが起動しているか確認：
   ```bash
   docker ps | grep cosmosdb
   ```

2. コンテナのログを確認：
   ```bash
   docker logs <container-id>
   ```

3. CosmosDBコンテナを再起動：
   ```bash
   docker restart <container-id>
   ```

4. ポート8081が他のプロセスに使用されていないか確認：
   ```bash
   # Linux/macOS
   lsof -i :8081
   
   # Windows
   netstat -ano | findstr :8081
   ```

### 問題: サブモジュールが空

**症状:** `src/`配下のディレクトリが空

**解決策:**

```bash
# サブモジュールを初期化して更新
git submodule init
git submodule update --recursive
```

### 問題: メモリ不足エラー

**症状:** CosmosDBエミュレータが起動しない、または503エラーが発生

**解決策:**

1. Docker Desktopのリソース制限を増やす
   - メモリを8GB以上に設定
   - CPUを4コア以上に設定

2. 不要なDockerコンテナを停止：
   ```bash
   docker ps -a
   docker stop <container-id>
   ```

3. Dockerのクリーンアップ：
   ```bash
   docker system prune -a
   ```

### 問題: 環境変数が読み込まれない

**解決策:**

1. `.env`ファイルが存在することを確認：
   ```bash
   ls -la .env
   ```

2. 手動で`.env`ファイルを作成：
   ```bash
   cp .env.development .env
   ```

3. DevContainerを再起動：
   ```
   コマンドパレット > Dev Containers: Rebuild Container
   ```

## 次のステップ

開発環境のセットアップが完了したら、以下のドキュメントを参照してください：

1. **[アーキテクチャガイド](./architecture/README.md)** - システムアーキテクチャの理解
2. **[環境設定ガイド](./ENVIRONMENT_CONFIGURATION.md)** - 環境変数の詳細
3. **[CosmosDB初期化](./COSMOSDB_INITIALIZATION.md)** - データベースの詳細設定
4. **[サービス開発ガイド](./templates/SERVICE_README.md)** - 各サービスの開発方法

### 各サービスの開発を開始

各サービスは独立して開発できます：

- **フロントエンド**: `src/front/` - React/TypeScriptアプリケーション
- **認証サービス**: `src/auth-service/` - 認証とトークン管理
- **ユーザー管理サービス**: `src/user-management-service/` - ユーザーCRUD操作
- **サービス設定サービス**: `src/service-setting-service/` - 設定管理

各サービスのREADMEを参照して、サービス固有のセットアップと開発手順を確認してください。

## ヘルプとサポート

問題が解決しない場合：

1. [Issue](https://github.com/Takas0522/ws-demo-poly-integration/issues)を確認
2. 新しいIssueを作成（テンプレートに従って記入）
3. チームメンバーに相談

## 参考資料

- [Dev Containers公式ドキュメント](https://code.visualstudio.com/docs/devcontainers/containers)
- [Docker公式ドキュメント](https://docs.docker.com/)
- [Azure Cosmos DB Emulator](https://learn.microsoft.com/ja-jp/azure/cosmos-db/local-emulator)
- [Git Submodules](https://git-scm.com/book/ja/v2/Git-%E3%81%AE%E3%81%95%E3%81%BE%E3%81%96%E3%81%BE%E3%81%AA%E3%83%84%E3%83%BC%E3%83%AB-%E3%82%B5%E3%83%96%E3%83%A2%E3%82%B8%E3%83%A5%E3%83%BC%E3%83%AB)

---

**最終更新**: 2026-01-24
