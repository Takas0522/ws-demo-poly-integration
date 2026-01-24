# アーキテクチャ概要

このドキュメントでは、ws-demo-poly-integrationプロジェクトの全体的なアーキテクチャについて説明します。

## 📋 目次

- [システム概要](#システム概要)
- [アーキテクチャパターン](#アーキテクチャパターン)
- [サービス構成](#サービス構成)
- [技術スタック](#技術スタック)
- [データアーキテクチャ](#データアーキテクチャ)
- [ネットワークアーキテクチャ](#ネットワークアーキテクチャ)
- [セキュリティアーキテクチャ](#セキュリティアーキテクチャ)
- [デプロイメントアーキテクチャ](#デプロイメントアーキテクチャ)

## システム概要

ws-demo-poly-integrationは、マルチテナントSaaS管理プラットフォームです。複数の独立したマイクロサービスで構成され、各サービスは特定のビジネス機能を担当します。

### 主要な特徴

- **マルチテナント対応**: テナント単位でデータを分離
- **マイクロサービスアーキテクチャ**: サービスの独立した開発とデプロイ
- **Polyrepo構成**: 各サービスは独立したリポジトリで管理
- **統合開発環境**: DevContainerによる一貫した開発体験

## アーキテクチャパターン

### 1. Polyrepo with Git Submodules

このプロジェクトは、Gitサブモジュールを使用したpolyrepoアーキテクチャを採用しています。

```
ws-demo-poly-integration/          # 統合リポジトリ
├── src/
│   ├── front/                     # サブモジュール: フロントエンド
│   ├── auth-service/              # サブモジュール: 認証サービス
│   ├── user-management-service/   # サブモジュール: ユーザー管理
│   └── service-setting-service/   # サブモジュール: サービス設定
├── docs/                          # 共有ドキュメント
├── .devcontainer/                 # DevContainer設定
└── docker-compose.yml             # 統合開発環境
```

**詳細**: [ADR-001: Polyrepoアーキテクチャ](../adr/001-polyrepo-architecture.md)

### 2. トランクベース開発

すべてのサービスは、トランクベース開発ワークフローに従います。

**詳細**: [ADR-002: トランクベース開発](../adr/002-trunk-based-development.md)

### 3. マイクロサービスアーキテクチャ

各サービスは独立してデプロイ可能で、以下の原則に従います：

- **単一責任**: 各サービスは1つのビジネス機能を担当
- **疎結合**: サービス間の依存関係を最小化
- **独立デプロイ**: 他のサービスに影響を与えずにデプロイ可能
- **技術の多様性**: サービスごとに最適な技術スタックを選択可能

## サービス構成

### 1. フロントエンド (front)

**リポジトリ**: [ws-demo-poly1](https://github.com/Takas0522/ws-demo-poly1)

**責務**:
- ユーザーインターフェース
- クライアントサイドのルーティング
- 認証状態の管理
- APIとの通信

**技術スタック**:
- React
- TypeScript
- React Router
- Axios/Fetch API

### 2. 認証サービス (auth-service)

**リポジトリ**: [ws-demo-poly3](https://github.com/Takas0522/ws-demo-poly3)

**責務**:
- ユーザー認証
- JWTトークンの発行と検証
- パスワード管理
- セッション管理

**技術スタック**:
- Python (FastAPI)
- JWT
- bcrypt

**APIエンドポイント**:
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `POST /api/auth/refresh` - トークンリフレッシュ
- `POST /api/auth/verify` - トークン検証

### 3. ユーザー管理サービス (user-management-service)

**リポジトリ**: [ws-demo-poly2](https://github.com/Takas0522/ws-demo-poly2)

**責務**:
- ユーザーのCRUD操作
- ユーザープロフィール管理
- 権限管理
- ユーザー検索

**技術スタック**:
- Python (FastAPI)
- Azure Cosmos DB
- Pydantic

**APIエンドポイント**:
- `GET /api/users` - ユーザー一覧取得
- `GET /api/users/{id}` - ユーザー詳細取得
- `POST /api/users` - ユーザー作成
- `PUT /api/users/{id}` - ユーザー更新
- `DELETE /api/users/{id}` - ユーザー削除

### 4. サービス設定サービス (service-setting-service)

**リポジトリ**: [ws-demo-poly4](https://github.com/Takas0522/ws-demo-poly4)

**責務**:
- テナント設定管理
- 機能フラグ管理
- アプリケーション設定
- 設定の検証

**技術スタック**:
- Python (FastAPI)
- Azure Cosmos DB
- Pydantic

**APIエンドポイント**:
- `GET /api/settings` - 設定一覧取得
- `GET /api/settings/{key}` - 設定詳細取得
- `POST /api/settings` - 設定作成
- `PUT /api/settings/{key}` - 設定更新
- `DELETE /api/settings/{key}` - 設定削除

## 技術スタック

### フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| React | 18.x | UIフレームワーク |
| TypeScript | 5.x | 型安全性 |
| Vite | 5.x | ビルドツール |
| React Router | 6.x | ルーティング |

### バックエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Python | 3.11+ | プログラミング言語 |
| FastAPI | 0.100+ | Webフレームワーク |
| Pydantic | 2.x | データ検証 |
| Uvicorn | 0.20+ | ASGIサーバー |

### データベース

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Azure Cosmos DB | - | NoSQLデータベース |
| Cosmos DB Emulator | 最新 | ローカル開発 |

### 開発ツール

| 技術 | バージョン | 用途 |
|------|-----------|------|
| Docker | 20.10+ | コンテナ化 |
| Docker Compose | 2.0+ | マルチコンテナ管理 |
| VS Code | 最新 | IDE |
| Dev Containers | 最新 | 開発環境 |

## データアーキテクチャ

### データベース設計

このプロジェクトは、Azure Cosmos DBをメインデータストアとして使用します。

#### テナントパーティショニング

すべてのデータは`tenantId`でパーティショニングされます。

**詳細**: [ADR-003: CosmosDB スキーマ設計とテナントパーティショニング](../adr/003-cosmosdb-schema-tenant-partitioning.en.md)

#### コンテナ構成

```
saas-management-dev (データベース)
├── Tenants              # テナント情報
│   ├── パーティションキー: /tenantId
│   └── スループット: 400 RU/s
├── Users                # ユーザー情報
│   ├── パーティションキー: /tenantId
│   └── スループット: 400 RU/s
├── Permissions          # 権限情報
│   ├── パーティションキー: /tenantId
│   └── スループット: 400 RU/s
└── AuditLogs            # 監査ログ
    ├── パーティションキー: /tenantId
    ├── スループット: 400 RU/s
    └── TTL: 90日
```

### データフロー

```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐     ┌──────────────────┐
│Auth Service │────▶│  User Management │
└──────┬──────┘     └────────┬─────────┘
       │                     │
       │                     │
       ▼                     ▼
┌──────────────────────────────┐
│      Azure Cosmos DB         │
│  (テナントパーティショニング)  │
└──────────────────────────────┘
```

## ネットワークアーキテクチャ

### 開発環境

DevContainerとDocker Composeを使用して、ローカル開発環境を構築します。

```
┌─────────────────────────────────────────┐
│         Docker Network: dev-network     │
│                                         │
│  ┌────────────────┐                    │
│  │  DevContainer  │                    │
│  │  (VS Code)     │                    │
│  └────────┬───────┘                    │
│           │                             │
│           ▼                             │
│  ┌────────────────┐                    │
│  │  Cosmos DB     │                    │
│  │  Emulator      │                    │
│  │  :8081         │                    │
│  └────────────────┘                    │
│                                         │
│  ┌────────────────┐  ┌───────────────┐ │
│  │  Frontend      │  │  Auth Service │ │
│  │  :3000         │  │  :8001        │ │
│  └────────────────┘  └───────────────┘ │
│                                         │
│  ┌────────────────┐  ┌───────────────┐ │
│  │  User Mgmt     │  │  Service      │ │
│  │  :8002         │  │  Setting :8003│ │
│  └────────────────┘  └───────────────┘ │
└─────────────────────────────────────────┘
```

### ポート割り当て

| サービス | ポート | プロトコル |
|---------|--------|-----------|
| Frontend | 3000 | HTTP |
| Auth Service | 8001 | HTTP |
| User Management | 8002 | HTTP |
| Service Setting | 8003 | HTTP |
| Cosmos DB Emulator | 8081 | HTTPS |
| Cosmos DB Emulator Data | 10251-10254 | TCP |

## セキュリティアーキテクチャ

### 認証と認可

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ 1. Login (username/password)
     ▼
┌─────────────┐
│Auth Service │
└──────┬──────┘
       │ 2. JWT Token
       ▼
┌──────────────┐
│   Client     │
│ (Store Token)│
└──────┬───────┘
       │ 3. API Request (Bearer Token)
       ▼
┌──────────────────┐
│  Protected API   │
│  (Verify Token)  │
└──────────────────┘
```

### 権限システム

ドット記法を使用した階層的な権限システムを採用しています。

**詳細**: [ドット記法権限システム](../adr/005-dot-notation-permission-system.md)

### セキュリティのベストプラクティス

1. **パスワード**: bcryptでハッシュ化
2. **トークン**: JWTを使用、短い有効期限
3. **HTTPS**: すべての通信を暗号化
4. **環境変数**: 機密情報は環境変数で管理
5. **最小権限の原則**: 必要最小限の権限のみ付与

## デプロイメントアーキテクチャ

### 開発環境 (Local)

- DevContainerで実行
- Cosmos DB Emulator使用
- すべてのサービスをローカルで起動

### ステージング環境 (Azure)

- Azure App Serviceでホスト
- Azure Cosmos DB使用
- Azure AD認証

### 本番環境 (Azure)

- Azure App Serviceでホスト
- Azure Cosmos DB使用
- Azure AD認証
- Application Insightsで監視
- Azure Frontdoorでロードバランシング

## 関連ドキュメント

- [初期化ガイド](../init.md) - 開発環境のセットアップ
- [環境設定ガイド](../ENVIRONMENT_CONFIGURATION.md) - 環境変数の詳細
- [マルチテナント実装](../MULTI_TENANT_IMPLEMENTATION.md) - マルチテナント機能の詳細
- [権限システム](../PERMISSIONS.md) - 権限管理の詳細
- [ADRディレクトリ](../adr/) - アーキテクチャ決定記録

## 参考資料

- [マイクロサービスアーキテクチャ](https://microservices.io/)
- [Azure Well-Architected Framework](https://learn.microsoft.com/ja-jp/azure/architecture/framework/)
- [Azure Cosmos DB ドキュメント](https://learn.microsoft.com/ja-jp/azure/cosmos-db/)
- [FastAPI ドキュメント](https://fastapi.tiangolo.com/)
- [React ドキュメント](https://react.dev/)

---

**最終更新**: 2026-01-24
