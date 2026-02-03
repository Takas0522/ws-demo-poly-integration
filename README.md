# 複数サービス管理 PoC アプリケーション

複数のマイクロサービスを統合管理するマルチテナント対応PoCアプリケーション。

## 概要

本プロジェクトは、テナント管理・ユーザー管理・サービス設定を統合的に行うマイクロサービスアーキテクチャのPoCアプリケーションです。

### 主要機能

- **テナント管理**: マルチテナント対応の組織管理
- **ユーザー管理**: ロールベースのアクセス制御
- **サービス設定**: テナントごとのサービス利用設定
- **認証認可**: JWT ベースの認証とロール管理

## アーキテクチャ

### システム構成

```
┌─────────────────────────────────────────┐
│         Next.js Frontend (BFF)          │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐│
│  │  認証   │  │テナント │  │サービス ││
│  │  認可   │  │  管理   │  │  設定   ││
│  │ Service │  │ Service │  │ Service ││
│  └─────────┘  └─────────┘  └─────────┘│
└─────────────────────────────────────────┘
                   │
            ┌──────┴──────┐
            │  Cosmos DB  │
            └─────────────┘
```

### 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **バックエンド**: FastAPI (Python 3.11)
- **データベース**: Azure Cosmos DB
- **認証**: JWT (JSON Web Tokens)
- **インフラ**: Azure (App Service / Container Apps)

## 前提条件

以下のツールがインストールされている必要があります：

- **Docker Desktop**: 4.20以上（推奨: 最新版）
- **VS Code**: 1.80以上（推奨: 最新版）
- **Dev Containers 拡張機能**: VS Code用
- **Git**: バージョン管理
- **最小システム要件**:
  - メモリ: 8GB以上（推奨: 16GB）
  - ディスク空き容量: 10GB以上

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd ws-demo-poly-integration
```

### 2. DevContainer で開く

1. VS Code でプロジェクトフォルダを開く
2. コマンドパレット (Ctrl+Shift+P / Cmd+Shift+P) を開く
3. "Dev Containers: Reopen in Container" を選択
4. コンテナのビルドと起動を待つ（初回は10分程度かかる場合があります）

### 3. 環境変数の設定

各サービスディレクトリに `.env` ファイルが自動生成されます。必要に応じて編集してください。

```bash
# フロントエンド
src/front/.env.local

# バックエンドサービス
src/auth-service/.env
src/tenant-management-service/.env
src/service-setting-service/.env
```

### 4. サービスの起動

#### フロントエンド

```bash
cd src/front
npm run dev
```

アクセス: http://localhost:3000

#### 認証認可サービス

```bash
cd src/auth-service
uvicorn app.main:app --reload --port 8001
```

API ドキュメント: http://localhost:8001/docs

#### テナント管理サービス

```bash
cd src/tenant-management-service
uvicorn app.main:app --reload --port 8002
```

API ドキュメント: http://localhost:8002/docs

#### 利用サービス設定サービス

```bash
cd src/service-setting-service
uvicorn app.main:app --reload --port 8003
```

API ドキュメント: http://localhost:8003/docs

## 開発ガイド

### プロジェクト構造

```
/
├── .devcontainer/              # DevContainer設定
├── docs/                       # ドキュメント
│   ├── arch/                   # アーキテクチャ設計
│   └── PoCアプリ/              # 機能仕様
├── infra/                      # IaC (Bicep)
├── src/                        # ソースコード
│   ├── front/                  # Next.jsフロントエンド
│   ├── auth-service/           # 認証認可サービス
│   ├── tenant-management-service/
│   └── service-setting-service/
├── docker-compose.yml          # Docker Compose設定
└── README.md                   # このファイル
```

### コーディング規約

#### Python (FastAPI)

- PEP 8 に準拠
- 型ヒントを必須化
- Black でフォーマット（行長: 100）
- async/await を使用

#### TypeScript (Next.js)

- ESLint + Prettier 使用
- 厳格な型チェック有効化
- React Hooks 使用
- Tailwind CSS でスタイリング

### テスト実行

#### フロントエンド

```bash
cd src/front
npm test
npm run lint
```

#### バックエンド

```bash
cd src/auth-service  # または他のサービス
pytest
```

## トラブルシューティング

### ポート競合エラー

既にポートが使用されている場合、使用中のプロセスを確認してください：

```bash
# Linux/macOS
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

### Cosmos DB Emulator の使用

本プロジェクトでは Azure Cosmos DB Emulator (vnext-preview) を使用しています。
DevContainer起動時に自動的に開始されます。

**接続情報:**
- **エンドポイント**: https://localhost:8081
- **Data Explorer**: http://localhost:1234
- **キー**: `C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==`

**接続テスト:**
```bash
python scripts/test_cosmos_connection.py
```

詳細は [Cosmos DB Emulator セットアップガイド](./docs/cosmos-db-emulator.md) を参照してください。

### Cosmos DB Emulator が起動しない

コンテナのログを確認してください：

```bash
docker logs cosmosdb-emulator
```

再起動:

```bash
docker-compose restart cosmosdb
```

接続テストを実行:

```bash
python scripts/test_cosmos_connection.py
```

### パッケージインストールエラー

手動でインストールを試してください：

```bash
# Python
cd src/auth-service
pip install -r requirements.txt

# Node.js
cd src/front
npm install
```

## ドキュメント

### 📚 主要ドキュメント

- **[ドキュメントIndex](./docs/README.md)** - すべてのドキュメントへのナビゲーション
- **[プロジェクト概要](./docs/init.md)** - サービス概要と初期要件
- **[アーキテクチャ概要](./docs/arch/overview.md)** - システムアーキテクチャの全体像

### 🛠️ 設計ドキュメント

- [コンポーネント設計](./docs/arch/components/README.md)
- [API設計仕様書](./docs/arch/api/api-specification.md)
- [データ設計](./docs/arch/data/data-model.md)
- [デプロイメント設計](./docs/arch/deployment.md)
- [開発環境設計](./docs/arch/development-environment.md)

### 📋 開発タスク

- [初期構築タスク](./docs/PoCアプリ/初期構築/開発タスク.md)
- [タスク別機能仕様](./docs/PoCアプリ/初期構築/Specs/)

### 🚀 クイックリンク

| 役割 | 主要ドキュメント |
|------|----------------|
| **新規参加者** | [プロジェクト概要](./docs/init.md) → [アーキテクチャ概要](./docs/arch/overview.md) |
| **フロントエンド開発者** | [コンポーネント設計 - Frontend](./docs/arch/components/README.md#1-frontend-nextjs) → [API仕様](./docs/arch/api/api-specification.md) |
| **バックエンド開発者** | [データ設計](./docs/arch/data/data-model.md) → [API仕様](./docs/arch/api/api-specification.md) |
| **インフラ担当者** | [デプロイメント設計](./docs/arch/deployment.md) |

## 運用ガイド

### デプロイメント

**開発環境へのデプロイ**:
```bash
# Bicep テンプレートのバリデーション
cd infra
az deployment group validate \
  --resource-group rg-poc-dev \
  --template-file main.bicep \
  --parameters @parameters.dev.json

# デプロイ実行
az deployment group create \
  --resource-group rg-poc-dev \
  --template-file main.bicep \
  --parameters @parameters.dev.json
```

詳細は [デプロイメント設計](./docs/arch/deployment.md) を参照してください。

### モニタリング

Application Insights でアプリケーションのメトリクスを監視：
- **Azure Portal**: https://portal.azure.com
- **ログクエリ**: Application Insights > Logs

### バックアップ

Cosmos DBは自動バックアップが有効（7日間保持）。  
手動バックアップが必要な場合は、Azure Portal から Point-in-Time Restore を実施。

## トラブルシューティング

### よくある問題

#### Q1: DevContainerが起動しない

**解決策**:
1. Docker Desktop が起動しているか確認
2. `.devcontainer/devcontainer.json` の設定を確認
3. コンテナを再ビルド: "Dev Containers: Rebuild Container"

#### Q2: Cosmos DB Emulator に接続できない

**解決策**:
```bash
# コンテナの状態確認
docker ps | grep cosmos

# ログ確認
docker logs cosmosdb-emulator

# 再起動
docker-compose restart cosmosdb
```

#### Q3: ポート競合エラー

**解決策**:
```bash
# 使用中のポートを確認
# Linux/macOS
lsof -i :3000

# Windows
netstat -ano | findstr :3000

# プロセスを停止するか、別のポートを使用
```

#### Q4: npm install / pip install が失敗する

**解決策**:
```bash
# キャッシュをクリア
# Node.js
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Python
pip cache purge
pip install -r requirements.txt --no-cache-dir
```

### さらなるサポート

- **技術的な質問**: [GitHub Issues](https://github.com/your-org/ws-demo-poly-integration/issues)
- **バグ報告**: [GitHub Issues](https://github.com/your-org/ws-demo-poly-integration/issues) (`bug` ラベル)
- **機能要望**: [GitHub Issues](https://github.com/your-org/ws-demo-poly-integration/issues) (`enhancement` ラベル)

## FAQ

### Q: 本番環境へのデプロイ手順は？

A: [デプロイメント設計](./docs/arch/deployment.md) の「本番環境デプロイ」セクションを参照してください。

### Q: 新しいサービスを追加する方法は？

A: [コンポーネント設計](./docs/arch/components/README.md) を参考に、既存サービスと同じ構造でサービスを作成してください。

### Q: テストはどう実行する？

A: 各サービスディレクトリで以下を実行：
- **フロントエンド**: `npm test`
- **バックエンド**: `pytest`

### Q: 環境変数の設定方法は？

A: 各サービスの `.env` ファイル（`.env.local`, `.env`）を編集してください。テンプレートは `.env.example` にあります。

## ライセンス

MIT License

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

### コントリビューションガイドライン

1. フォークしてブランチを作成
2. コーディング規約に従って実装
3. テストを追加・実行
4. ドキュメントを更新
5. プルリクエストを作成

詳細は [コーディング規約](#コーディング規約) を参照してください。
