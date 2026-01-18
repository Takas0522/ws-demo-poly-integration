# 🚀 SaaS 管理者 Web アプリケーション - Polyrepo 統合

Git サブモジュールを使用した polyrepo アーキテクチャで構築された包括的な SaaS 管理プラットフォームです。このプロジェクトは、独立したサービスリポジトリを持つマルチサービスアプリケーションを構築するための、モダンでスケーラブルなアプローチを示しています。

## 📋 目次

- [概要](#概要)
- [アーキテクチャ](#アーキテクチャ)
- [サービス](#サービス)
- [技術スタック](#技術スタック)
- [はじめに](#はじめに)
- [開発](#開発)
- [コントリビューション](#コントリビューション)
- [ライセンス](#ライセンス)

## 🎯 概要

このプロジェクトは、以下の主要機能を備えたマルチテナント SaaS 管理アプリケーションを提供します：

- **ユーザー管理**: ロールベースのアクセス制御を含む完全なユーザーライフサイクル管理
- **認証と認可**: ドット記法の権限システムを使用した JWT ベースの認証
- **サービス設定管理**: サービスの集中設定管理
- **マルチテナントアーキテクチャ**: データ分離のための CosmosDB ベースのテナントパーティショニング
- **ボタンレベルの認可**: ユーザー権限に基づく詳細な UI 制御

## 🏗️ アーキテクチャ

### Polyrepo 構造

このリポジトリは、Git サブモジュールを使用した**polyrepo 統合**パターンに従っています。各サービスは独自のリポジトリで管理され、ここでサブモジュールとして統合されます：

```
ws-demo-poly-integration/
├── src/
│   ├── front/                    # フロントエンドアプリケーション (React + TypeScript)
│   ├── auth-service/             # 認証サービス
│   ├── user-management-service/  # ユーザー管理サービス
│   └── service-setting-service/  # サービス設定サービス
├── packages/
│   └── @types/                   # 共有TypeScript型定義ライブラリ
├── docs/                         # ドキュメント
│   ├── api/                      # APIドキュメント
│   ├── adr/                      # アーキテクチャ決定記録
│   └── templates/                # サービス用テンプレート
├── scripts/                      # ユーティリティスクリプト
│   ├── permissions/              # 権限システム実装
│   └── cosmosdb/                 # CosmosDB関連スクリプト
├── README.md
├── CONTRIBUTING.md
└── DEVELOPMENT_PLAN.md
```

### サービスアーキテクチャ

アプリケーションは**マイクロサービスアーキテクチャ**パターンに従っています：

- **フロントエンド (React)**: ユーザーインターフェースを提供するシングルページアプリケーション
- **認証サービス**: JWT 認証とトークン管理を処理
- **ユーザー管理サービス**: ユーザーの CRUD 操作とプロファイルを管理
- **サービス設定サービス**: サービス構成と機能フラグを管理

すべてのサービスは RESTful API 経由で通信し、共有型ライブラリ（`@types`）を通じて共通の型を共有します。

### 主要な設計原則

1. **トランクベース開発**: メインブランチは常にデプロイ可能
2. **機能フラグ**: 段階的なロールアウトのための環境ベースの機能切り替え
3. **マルチテナンシー**: CosmosDB を使用したテナント分割データ
4. **権限システム**: ドット記法ベースの詳細な権限制御
5. **API 優先**: すべてのサービスの OpenAPI/Swagger ドキュメント

## 🔧 サービス

### フロントエンドアプリケーション (`src/front`)

- **リポジトリ**: [ws-demo-poly1](https://github.com/Takas0522/ws-demo-poly1.git)
- **技術スタック**: React, TypeScript, Vite
- **目的**: ボタンレベルの認可を持つ管理操作のユーザーインターフェース

### 認証サービス (`src/auth-service`)

- **リポジトリ**: [ws-demo-poly3](https://github.com/Takas0522/ws-demo-poly3.git)
- **技術スタック**: Python, FastAPI
- **目的**: JWT 認証、トークン管理、権限検証

### ユーザー管理サービス (`src/user-management-service`)

- **リポジトリ**: [ws-demo-poly2](https://github.com/Takas0522/ws-demo-poly2.git)
- **技術スタック**: Python, FastAPI, CosmosDB
- **目的**: ユーザー CRUD 操作、プロファイル管理、ロール割り当て

### サービス設定サービス (`src/service-setting-service`)

- **リポジトリ**: [ws-demo-poly4](https://github.com/Takas0522/ws-demo-poly4.git)
- **技術スタック**: Python, FastAPI, CosmosDB
- **目的**: サービス構成管理と機能フラグ制御

### 共有型ライブラリ (`packages/@types`)

- **パッケージ名**: `@saas-app/types`
- **技術スタック**: TypeScript
- **目的**: 全サービス間で共有される TypeScript 型定義
- **ドキュメント**: [README](./packages/@types/README.md)

このパッケージは、User、Tenant、Permission、JWT、API リクエスト/レスポンスなどの型定義を提供し、サービス間の型安全性を保証します。

## 💻 技術スタック

### フロントエンド

- **フレームワーク**: React 18+
- **言語**: TypeScript
- **ビルドツール**: Vite
- **UI ライブラリ**: 未定 (Material-UI/Ant Design)
- **状態管理**: 未定 (Redux/Zustand)

### バックエンドサービス

- **ランタイム**: Python 3.11+
- **フレームワーク**: FastAPI
- **言語**: Python
- **データベース**: Azure CosmosDB (SQL API)
- **認証**: JWT (python-jose)
- **API ドキュメント**: OpenAPI 3.0 (Swagger)

### インフラストラクチャ

- **ホスティング**: Azure App Service
- **データベース**: Azure CosmosDB
- **CI/CD**: GitHub Actions
- **コンテナ**: CosmosDB エミュレータ付き DevContainer
- **監視**: Azure Application Insights (予定)

## 🚀 はじめに

### 前提条件

- **Git**: バージョン 2.13 以降（サブモジュールサポート用）
- **Node.js**: バージョン 18 以降
- **Docker**: DevContainer と CosmosDB エミュレータ用
- **VS Code**: Remote - Containers 拡張機能の使用を推奨

### 初期セットアップ

1. **サブモジュールを含めてリポジトリをクローン：**

### DevContainer での起動

1. リポジトリをクローンします：

   ```bash
   git clone --recursive https://github.com/Takas0522/ws-demo-poly-integration.git
   cd ws-demo-poly-integration
   ```

   `--recursive`オプションなしでクローンした場合は、サブモジュールを初期化してください：

   ```bash
   git submodule update --init --recursive
   ```

2. **DevContainer で開く**（推奨）：

   - VS Code でプロジェクトを開く
   - プロンプトが表示されたら「コンテナで再度開く」をクリック
   - DevContainer には、CosmosDB エミュレータと必要なすべてのツールが含まれています

3. **Python 3.11 仮想環境を作成してアクティベート：**

   ```bash
   # プロジェクトルートで Python 3.11 の仮想環境を作成
   python3.11 -m venv .venv311

   # 仮想環境をアクティベート
   source .venv311/bin/activate
   ```

4. **各サービスの依存関係をインストール：**

   ```bash
   # 共有型ライブラリ
   cd packages/@types
   npm install
   npm run build

   # フロントエンド
   cd ../../src/front
   npm install

   # 認証サービス (Python/FastAPI) - 仮想環境がアクティブであることを確認
   cd ../auth-service
   pip install -r requirements.txt

   # ユーザー管理サービス (Python/FastAPI)
   cd ../user-management-service
   pip install -r requirements.txt

   # サービス設定サービス (Python/FastAPI)
   cd ../service-setting-service
   pip install -r requirements.txt
   ```

5. **環境変数を設定：**

   ```bash
   # ルートディレクトリで環境設定をコピー
   cp .env.template .env
   # または開発用のデフォルト設定を使用
   cp .env.development .env
   ```

   - ローカル開発には CosmosDB エミュレータのデフォルト設定を使用
   - JWT_SECRET などの値は開発環境ではデフォルトのままで問題ありません
   - 詳細な設定については[環境設定ガイド](./docs/ENVIRONMENT_CONFIGURATION.md)を参照

### ローカルで実行

#### 方法 1: 全サービスを一括起動（推奨）

全サービスを 1 つのコマンドで起動：

```bash
# プロジェクトルートで実行
npm start
# または
./start-all-services.sh
```

サービスの稼働状況を確認：

```bash
npm run status
# または
./check-services.sh
```

全サービスを停止：

```bash
npm stop
# または
./stop-all-services.sh
```

**起動後の URL:**

- Frontend: http://localhost:5173
- Auth Service: http://localhost:3001 ([API Docs](http://localhost:3001/docs))
- User Management: http://localhost:3002 ([API Docs](http://localhost:3002/docs))
- Service Settings: http://localhost:3003 ([API Docs](http://localhost:3003/docs))

**ログファイル:**
各サービスのログは `logs/` ディレクトリに出力されます：

- `logs/auth-service.log`
- `logs/user-management-service.log`
- `logs/service-setting-service.log`
- `logs/frontend.log`

#### 方法 2: 各サービスを個別に起動

各サービスを別々のターミナルで起動する場合：

```bash
# Python仮想環境をアクティベート（Pythonサービスを起動する前に実行）
source .venv311/bin/activate

# フロントエンド (デフォルト: http://localhost:3000)
cd src/front
npm run dev

# 認証サービス (Python/FastAPI, デフォルト: http://localhost:3001)
cd src/auth-service
uvicorn app.main:app --reload --host 0.0.0.0 --port 3001

# ユーザー管理サービス (Python/FastAPI, デフォルト: http://localhost:3002)
cd src/user-management-service
uvicorn app.main:app --reload --host 0.0.0.0 --port 3002

# サービス設定サービス (Python/FastAPI, デフォルト: http://localhost:3003)
cd src/service-setting-service
uvicorn app.main:app --reload --host 0.0.0.0 --port 3003
```

## 🛠️ 開発

### サブモジュールの操作

**すべてのサブモジュールを最新に更新：**

```bash
git submodule update --remote --recursive
```

**サブモジュールを含めて最新の変更をプル：**

```bash
git pull --recurse-submodules
```

**サブモジュール内で変更を行う：**

```bash
cd src/[service-name]
git checkout -b feature/my-feature
# 変更を行う
git add .
git commit -m "Add feature"
git push origin feature/my-feature
```

**新しいサブモジュールコミットを参照するようにメインリポジトリを更新：**

```bash
cd ../..  # メインリポジトリに戻る
git add src/[service-name]
git commit -m "Update [service-name] submodule"
git push
```

### 開発ワークフロー

このプロジェクトは**トランクベース開発**に従っています。詳細なガイドラインは[CONTRIBUTING.md](./CONTRIBUTING.md)を参照してください。

**主要なプラクティス：**

- メインブランチは常にデプロイ可能
- 短期間の機能ブランチ（2 日以内）
- 未完成機能の機能フラグ
- GitHub Actions 経由の継続的インテグレーション
- すべての変更にコードレビューが必要

### テスト

各サービスには独自のテストスイートがあります。コミット前にテストを実行してください：

```bash
# フロントエンドサービス (TypeScript)
npm test                 # ユニットテストを実行
npm run test:integration # 統合テストを実行
npm run test:coverage    # カバレッジレポートを生成

# Pythonサービス (auth-service, user-management-service, service-setting-service)
pytest                   # ユニットテストを実行
pytest --cov=app tests/  # カバレッジ付きで実行
```

### コード品質

高いコード品質基準を維持しています：

```bash
# TypeScriptサービス (front)
npm run lint            # コードスタイルをチェック
npm run lint:fix        # スタイルの問題を自動修正
npm run type-check      # TypeScriptの型チェック

# Pythonサービス (auth-service, user-management-service, service-setting-service)
black app/ tests/       # コードフォーマット
isort app/ tests/       # importソート
mypy app/               # 型チェック
flake8 app/ tests/      # リント
```

## 📚 ドキュメント

### プロジェクト管理

- **[docs/ISSUE_MANAGEMENT_GUIDELINE.md](./docs/ISSUE_MANAGEMENT_GUIDELINE.md)**: Polyrepo における issue 管理のガイドライン
- **[docs/ISSUE_MIGRATION_SUMMARY.md](./docs/ISSUE_MIGRATION_SUMMARY.md)**: Issue 移行の概要と現在の構造

### 開発ガイド

- **[CONTRIBUTING.md](./CONTRIBUTING.md)**: 開発ガイドラインとコントリビューションプロセス
- **[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)**: 詳細な開発ロードマップと issue 分類

### 設定とインフラ

- **[docs/ENVIRONMENT_CONFIGURATION.md](./docs/ENVIRONMENT_CONFIGURATION.md)**: 環境設定とフィーチャーフラグの完全ガイド
- **[docs/CONFIGURATION_VALIDATION.md](./docs/CONFIGURATION_VALIDATION.md)**: 設定検証の実装ガイド
- **[docs/AZURE_APP_SERVICE_CONFIGURATION.md](./docs/AZURE_APP_SERVICE_CONFIGURATION.md)**: Azure App Service での環境設定ガイド

### API とアーキテクチャ

- **[docs/api/](./docs/api/)**: 各サービスの API ドキュメント
- **[docs/adr/](./docs/adr/)**: アーキテクチャ決定記録
- **[docs/templates/](./docs/templates/)**: 新しいサービスとドキュメントのテンプレート

## 🤝 コントリビューション

コントリビューションを歓迎します！プルリクエストを送信する前に、[コントリビューションガイドライン](./CONTRIBUTING.md)をお読みください。

### クイックコントリビューションガイド

1. リポジトリをフォーク
2. 機能ブランチを作成：`git checkout -b feature/my-feature`
3. コーディング標準に従って変更を行う
4. 必要に応じてテストを作成/更新
5. 慣習的コミットでコミット：`git commit -m "feat: add new feature"`
6. フォークにプッシュ：`git push origin feature/my-feature`
7. プルリクエストを開く

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下でライセンスされています - 詳細は[LICENSE](./LICENSE)ファイルを参照してください。

## 📞 サポート

質問、issues、またはコントリビューションについては：

- **GitHub Issues**: [issue を作成](https://github.com/Takas0522/ws-demo-poly-integration/issues)
- **ドキュメント**: [docs/](./docs/)ディレクトリを参照
- **開発計画**: [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)を参照

## 🗺️ ロードマップ

6 つのフェーズに整理された完全な開発ロードマップについては、[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)を参照してください：

1. **フェーズ 1**: 基盤と開発環境
2. **フェーズ 2**: データレイヤーとコアインフラストラクチャ
3. **フェーズ 3**: 認証と認可
4. **フェーズ 4**: サービス実装
5. **フェーズ 5**: データとテスト
6. **フェーズ 6**: デプロイと CI/CD

---

**モダンな TypeScript、React、Azure テクノロジーで ❤️ を込めて構築**

2. Visual Studio Code でフォルダを開きます：

   ```bash
   code .
   ```

3. VS Code で「Reopen in Container」を選択します

   - コマンドパレット（`Ctrl+Shift+P` / `Cmd+Shift+P`）から `Dev Containers: Reopen in Container` を実行

4. コンテナのビルドと起動を待ちます（初回は数分かかります）

### 含まれている開発環境

DevContainer には以下がプリインストールされています：

- **Python 3.11** - バックエンドサービス用 (FastAPI)
- **Node.js 20** - フロントエンドと共有ライブラリ用
- **Azure CLI** - Azure リソース管理用
- **Git & GitHub CLI** - バージョン管理
- **CosmosDB Emulator** - ローカル開発用データベース

### CosmosDB Emulator への接続

CosmosDB Emulator は自動的に起動し、以下のエンドポイントで利用可能です：

- **エンドポイント**: `https://localhost:8081`
- **プライマリキー**: `C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==`

#### 接続テスト

VS Code 内のターミナルで以下のコマンドを実行して接続を確認：

```bash
# CosmosDB Emulatorの状態確認
curl -k https://localhost:8081/_explorer/emulator.pem

# Azure CLIを使用した接続テスト
az cosmosdb list-connection-strings --resource-group dummy --name dummy 2>/dev/null || echo "Emulator is running locally"
```

#### VS Code 拡張機能からの接続

1. Azure Cosmos DB 拡張機能を開く
2. 「Attach Emulator」をクリック
3. デフォルトのエンドポイントとキーで接続

### サブモジュールの初期化

サブモジュールが初期化されていない場合：

```bash
git submodule update --init --recursive
```

### サービスの起動

#### クイックスタート（全サービス一括起動）

```bash
# 全サービスを起動
npm start

# サービスの稼働確認
npm run status

# 全サービスを停止
npm stop
```

#### 個別に起動する場合

各サービスのディレクトリに移動して起動：

```bash
# Frontend (React + TypeScript)
cd src/front
npm install
npm run dev

# Auth Service (Python + FastAPI)
cd src/auth-service
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 3001

# User Management Service (Python + FastAPI)
cd src/user-management-service
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 3002

# Service Settings Service (Python + FastAPI)
cd src/service-setting-service
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 3003
```

## 🔧 開発ツール

### インストール済み VS Code 拡張機能

- **Azure Cosmos DB** - データベース管理
- **Docker** - コンテナ管理
- **ESLint & Prettier** - コードフォーマット
- **Python & Pylance** - Python 開発
- **GitLens** - Git 統合
- **REST Client** - API テスト
- **OpenAPI** - API 仕様管理

### ポートフォワーディング

以下のポートが自動的にフォワードされます：

- `3000` - Frontend
- `3001` - Auth Service
- `3002` - User Management Service
- `3003` - Service Settings Service
- `8081` - CosmosDB Emulator

## � トラブルシューティング

### Python 仮想環境の問題

#### ModuleNotFoundError が発生する

**症状**: Python サービスを起動すると `ModuleNotFoundError: No module named 'xxx'` エラーが発生

**原因**: Python 3.13 では一部のパッケージ（pydantic-core など）がビルドに失敗します

**解決策**:

```bash
# Python 3.11 の仮想環境を作成
python3.11 -m venv .venv311

# 仮想環境をアクティベート
source .venv311/bin/activate

# 各サービスの依存関係をインストール
cd src/auth-service && pip install -r requirements.txt
cd ../user-management-service && pip install -r requirements.txt
cd ../service-setting-service && pip install -r requirements.txt
```

**注意**: Python サービスを起動する前に必ず `.venv311` 環境をアクティベートしてください。

### CosmosDB Emulator 関連の問題

開発中に CosmosDB エミュレータで問題が発生した場合は、以下を試してください：

#### 503 Service Unavailable エラー

**症状**: サービス起動時に「Service Unavailable」や「high demand」エラーが発生

**解決策**:

```bash
# 1. 不要なデータベースを削除してリソースを解放
cd scripts/cosmosdb
python -c "
from azure.cosmos import CosmosClient
import warnings
warnings.filterwarnings('ignore')
client = CosmosClient('https://localhost:8081', 'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==', connection_verify=False)
for db in client.list_databases():
    if db['id'] not in ['saas-management-dev']:
        client.delete_database(db['id'])
        print(f'削除: {db[\"id\"]}')
"

# 2. またはDevContainerを再起動
# VS Code: Ctrl+Shift+P > Dev Containers: Rebuild Container
```

詳細なトラブルシューティングガイドは[docs/COSMOSDB_TROUBLESHOOTING.md](./docs/COSMOSDB_TROUBLESHOOTING.md)を参照してください。

## �📚 ドキュメント

- [開発計画](DEVELOPMENT_PLAN.md) - プロジェクト全体の開発計画とフェーズ
- [GitHub Issues](https://github.com/Takas0522/ws-demo-poly-integration/issues) - タスクと進捗管理

## 🤝 貢献

詳細な開発手順と Issue については、[DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)を参照してください。

## 📄 ライセンス

このプロジェクトは[LICENSE](LICENSE)ファイルに基づいてライセンスされています。
