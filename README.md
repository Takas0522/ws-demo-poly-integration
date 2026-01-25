# WS Demo Poly Integration

マルチテナント対応SaaS管理プラットフォーム - 統合リポジトリ

## 📋 概要

このリポジトリは、複数のマイクロサービスで構成されるSaaS管理プラットフォームの統合リポジトリです。各サービスは独立したリポジトリで管理され、Gitサブモジュールとして統合されています。

### アーキテクチャ

- **Polyrepo構成**: 各サービスは独立したリポジトリ
- **統合開発環境**: DevContainerで一貫した開発体験
- **マイクロサービス**: 疎結合で独立してデプロイ可能
- **マルチテナント**: テナント単位でデータを分離

## 🏗️ サービス構成

| サービス | 説明 | リポジトリ | ポート |
|---------|------|-----------|--------|
| **Frontend** | Reactフロントエンド | [ws-demo-poly1](https://github.com/Takas0522/ws-demo-poly1) | 3000 |
| **Auth Service** | 認証・認可サービス | [ws-demo-poly3](https://github.com/Takas0522/ws-demo-poly3) | 8001 |
| **User Management** | ユーザー管理サービス | [ws-demo-poly2](https://github.com/Takas0522/ws-demo-poly2) | 8002 |
| **Service Setting** | サービス設定管理 | [ws-demo-poly4](https://github.com/Takas0522/ws-demo-poly4) | 8003 |
| **Cosmos DB Emulator** | データベースエミュレータ | - | 8081 |

## 🚀 クイックスタート

### 前提条件

- Docker Desktop (v20.10以上)
- Visual Studio Code (最新版)
- VS Code拡張機能: Dev Containers
- Git (v2.30以上)

### セットアップ

```bash
# 1. リポジトリをクローン（サブモジュール含む）
git clone --recurse-submodules https://github.com/Takas0522/ws-demo-poly-integration.git
cd ws-demo-poly-integration

# 2. VS Codeで開く
code .

# 3. DevContainerで開く
# コマンドパレット (Ctrl+Shift+P) > "Dev Containers: Reopen in Container"
```

初回起動時は5-10分かかります（イメージのダウンロードとビルド）。

### 環境の確認

DevContainer起動後、以下のコマンドで環境を確認：

```bash
# ツールのバージョン確認
node --version      # Node.js 20.x
python3 --version   # Python 3.11+
az --version        # Azure CLI

# Cosmos DBエミュレータの確認
# DevContainerはcosmosdbサービスとネットワークを共有しているため、localhostでアクセス可能
curl -k https://localhost:8081/_explorer/emulator.pem
```

## 📚 ドキュメント

### はじめに

- **[初期化ガイド](docs/init.md)** - 開発環境のセットアップ手順
- **[アーキテクチャ概要](docs/architecture/README.md)** - システム全体のアーキテクチャ
- **[環境設定ガイド](docs/ENVIRONMENT_CONFIGURATION.md)** - 環境変数の詳細

### 開発ガイド

- **[DevContainer設定](.devcontainer/README.md)** - DevContainerの使い方
- **[サービステンプレート](docs/templates/SERVICE_README.md)** - 新サービス作成ガイド

### アーキテクチャ決定記録 (ADR)

- [ADR-001: Polyrepoアーキテクチャ](docs/adr/001-polyrepo-architecture.md)
- [ADR-002: トランクベース開発](docs/adr/002-trunk-based-development.md)
- [ADR-003: CosmosDB設計](docs/adr/003-cosmosdb-schema-tenant-partitioning.en.md)

### 技術ドキュメント

- [マルチテナント実装](docs/MULTI_TENANT_IMPLEMENTATION.md)
- [権限システム](docs/PERMISSIONS.md)
- [CosmosDB初期化](docs/COSMOSDB_INITIALIZATION.md)

## 🛠️ 開発

### サブモジュールの更新

```bash
# すべてのサブモジュールを最新に更新
git submodule update --remote

# 特定のサブモジュールを更新
cd src/front
git pull origin main
cd ../..
git add src/front
git commit -m "Update frontend submodule"
```

### サービスの起動

DevContainer内で各サービスを個別に起動できます：

```bash
# フロントエンド
cd src/front
npm install
npm run dev

# 認証サービス
cd src/auth-service
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

### Docker Composeでの起動

すべてのサービスを一度に起動（サブモジュールが実装済みの場合）：

```bash
docker-compose up
```

## 🔧 環境変数

環境変数は`.env`ファイルで管理します：

```bash
# テンプレートからコピー
cp .env.development .env
```

主要な環境変数：

| 変数 | 説明 | デフォルト値 |
|------|------|-------------|
| `COSMOSDB_ENDPOINT` | Cosmos DBエンドポイント | `https://localhost:8081` |
| `COSMOSDB_DATABASE` | データベース名 | `saas-management-dev` |
| `NODE_ENV` | Node環境 | `development` |
| `JWT_SECRET_KEY` | JWT秘密鍵 | 開発用の値 |

詳細は[環境設定ガイド](docs/ENVIRONMENT_CONFIGURATION.md)を参照してください。

## 🧪 テスト

```bash
# 各サービスのテストを実行
cd src/<service-name>
npm test  # または pytest
```

## 📦 ビルド

```bash
# 各サービスをビルド
cd src/<service-name>
npm run build  # または python setup.py build
```

## 🚢 デプロイ

各サービスは独立してデプロイ可能です。詳細は各サービスのREADMEを参照してください。

## 🐛 トラブルシューティング

### DevContainerが起動しない

1. Docker Desktopが起動していることを確認
2. リソース設定を確認（メモリ8GB以上、CPU 2コア以上）
3. キャッシュをクリアして再ビルド

```
コマンドパレット > Dev Containers: Rebuild Container Without Cache
```

### Cosmos DBエミュレータに接続できない

```bash
# エミュレータの状態を確認
docker ps | grep cosmosdb

# ログを確認
docker logs ws-demo-cosmosdb

# 再起動
docker restart ws-demo-cosmosdb
```

### サブモジュールが空

```bash
# サブモジュールを初期化
git submodule init
git submodule update --recursive
```

詳細は[初期化ガイド](docs/init.md)のトラブルシューティングセクションを参照してください。

## 🤝 コントリビューション

1. Issueを作成して変更内容を議論
2. 機能ブランチを作成
3. 変更をコミット
4. プルリクエストを作成
5. レビューを待つ

詳細なガイドラインは[Issue管理ガイドライン](docs/ISSUE_MANAGEMENT_GUIDELINE.md)を参照してください。

## 📄 ライセンス

このプロジェクトのライセンスについては、LICENSEファイルを参照してください。

## 🔗 リンク

- [GitHub Organization](https://github.com/Takas0522)
- [Issue Tracker](https://github.com/Takas0522/ws-demo-poly-integration/issues)
- [Pull Requests](https://github.com/Takas0522/ws-demo-poly-integration/pulls)

## 📞 サポート

質問や問題がある場合：

1. [ドキュメント](docs/)を確認
2. [Issue](https://github.com/Takas0522/ws-demo-poly-integration/issues)を検索
3. 新しいIssueを作成

---

**最終更新**: 2026-01-24
