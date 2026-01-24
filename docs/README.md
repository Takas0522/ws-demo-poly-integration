# マルチテナント管理アプリケーション仕様書

**バージョン**: 1.0.0  
**最終更新**: 2026-01-24  
**ステータス**: Draft

## 概要

複数サービスを提供する会社のための統合管理アプリケーションです。マイクロサービスアーキテクチャで構成され、テナント管理、ユーザー認証認可、サービス利用設定を一元的に行えます。

## システムアーキテクチャ

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
    end

    subgraph "Frontend Layer"
        Frontend[Frontend Service<br/>Next.js BFF]
    end

    subgraph "Backend Services"
        Auth[認証認可サービス<br/>FastAPI]
        Tenant[テナント管理サービス<br/>FastAPI]
        ServiceSetting[利用サービス設定サービス<br/>FastAPI]
    end

    subgraph "Mock Services"
        FileService[ファイル管理サービス]
        MessageService[メッセージングサービス]
        APIService[API利用サービス]
        BackupService[バックアップサービス]
    end

    subgraph "Data Layer"
        CosmosDB[(Cosmos DB)]
    end

    Browser --> Frontend
    Frontend --> Auth
    Frontend --> Tenant
    Frontend --> ServiceSetting
    
    Auth --> CosmosDB
    Tenant --> CosmosDB
    ServiceSetting --> CosmosDB

    ServiceSetting -.->|サービス連携| FileService
    ServiceSetting -.->|サービス連携| MessageService
    ServiceSetting -.->|サービス連携| APIService
    ServiceSetting -.->|サービス連携| BackupService
```

## サービス一覧

| サービス名 | 役割 | 技術スタック | ドキュメント |
|-----------|------|-------------|-------------|
| Frontend | BFFとしてUIを提供 | Next.js (React) | [詳細](./services/frontend/spec.md) |
| テナント管理サービス | テナントとユーザーの管理 | FastAPI (Python) | [詳細](./services/user-management/spec.md) |
| 認証認可サービス | 認証・認可・JWT管理 | FastAPI (Python) | [詳細](./services/auth/spec.md) |
| 利用サービス設定サービス | テナントへのサービス割当 | FastAPI (Python) | [詳細](./services/service-setting/spec.md) |

## リポジトリ構成

```
ws-demo-poly-integration/        # 統合リポジトリ (repo0)
├── infra/                       # IaCコード (Bicep)
├── docs/                        # ドキュメント
│   ├── README.md               # 本ファイル
│   ├── architecture/           # アーキテクチャ設計
│   └── services/               # サービス別仕様
└── src/
    ├── front/                   # repo1: フロントエンド
    ├── user-management-service/ # repo2: テナント管理
    ├── auth-service/            # repo3: 認証認可
    └── service-setting-service/ # repo4: サービス設定
```

## ロール概要

各サービスで定義されるロールの概要です。

```mermaid
graph LR
    subgraph "全サービス共通"
        GA[全体管理者]
        Admin[管理者]
        Viewer[閲覧者]
    end

    subgraph "権限レベル"
        GA -->|最上位| Priv[特権テナント操作可能]
        Admin -->|中位| Normal[通常テナント操作可能]
        Viewer -->|下位| Read[参照のみ]
    end
```

## ドキュメント構成

- [アーキテクチャ設計](./architecture/README.md)
  - [認証フロー](./architecture/authentication-flow.md)
  - [データベース設計](./architecture/database-design.md)
  - [API設計ガイドライン](./architecture/api-guidelines.md)
- サービス仕様
  - [Frontend](./services/frontend/spec.md)
  - [テナント管理サービス](./services/user-management/spec.md)
  - [認証認可サービス](./services/auth/spec.md)
  - [利用サービス設定サービス](./services/service-setting/spec.md)
  - [モックサービス](./services/mock-services/spec.md)

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | React (Next.js) |
| バックエンド | Python (FastAPI) |
| データベース | Azure Cosmos DB |
| インフラ | Bicep (Azure IaC) |
| 認証方式 | JWT (JSON Web Token) |
