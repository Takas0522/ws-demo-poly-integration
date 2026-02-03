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

### Cosmos DB Emulator が起動しない

コンテナのログを確認してください：

```bash
docker logs cosmosdb-emulator
```

再起動:

```bash
docker-compose restart cosmosdb
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

- [アーキテクチャ概要](./docs/arch/overview.md)
- [開発環境設計](./docs/arch/development-environment.md)
- [コンポーネント設計](./docs/arch/components/README.md)
- [機能仕様](./docs/PoCアプリ/初期構築/Specs/)

## ライセンス

MIT License

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。
