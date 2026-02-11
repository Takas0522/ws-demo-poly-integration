# アーキテクチャドキュメント

このディレクトリには、複数サービス管理アプリケーションPoCのアーキテクチャ設計ドキュメントが格納されています。

---

## 📚 ドキュメント一覧

### 1. [アーキテクチャ概要](./overview.md)

システム全体の概要、技術スタック、設計原則、主要コンポーネントの説明。

**内容**:

- システム概要と目的
- アーキテクチャスタイル（マイクロサービス、BFF）
- システム構成図
- 技術スタック
- 認証・認可モデル
- セキュリティ考慮事項
- デプロイメント構成

**対象読者**: すべての開発者、プロジェクト関係者

---

### 2. [コンポーネント設計（横断事項）](./components/README.md)

サービス間通信、共通依存関係、開発ガイドラインなどの横断的な設計。

> **注**: サービス固有のコンポーネント設計は各サービスリポジトリに移動しました：
>
> - [フロントエンド](../../src/front/docs/component-design.md)
> - [認証認可サービス](../../src/auth-service/docs/component-design.md)
> - [テナント管理サービス](../../src/tenant-management-service/docs/component-design.md)
> - [利用サービス設定サービス](../../src/service-setting-service/docs/component-design.md)

**内容**:

- サービス間通信パターン
- 共通依存関係
- 開発ガイドライン（コーディング規約、テスト方針、エラーハンドリング）

**対象読者**: 開発者、テクニカルリード

---

### 3. [データ設計](./data/data-model.md)

データベース設計、データモデル、データフロー。

**内容**:

- Cosmos DB 構成
- データモデル定義
  - テナント管理データ
  - 認証認可データ
  - サービス設定データ
- コンテナ設計
- パーティションキー戦略
- データアクセスパターン
- クエリ最適化
- データマイグレーション

**対象読者**: 開発者、データエンジニア

---

### 4. [API設計仕様書（共通仕様）](./api/api-specification.md)

APIの共通仕様（認証、エラーレスポンス、ページネーション、バージョニング、ヘルスチェック、レートリミット）。

> **注**: サービス固有のAPI仕様は各サービスリポジトリに移動しました：
>
> - [認証認可サービス API](../../src/auth-service/docs/api-specification.md)
> - [テナント管理サービス API](../../src/tenant-management-service/docs/api-specification.md)
> - [利用サービス設定サービス API](../../src/service-setting-service/docs/api-specification.md)
> - [BFF API](../../src/front/docs/api-specification.md)

**内容**:

- 共通仕様（認証、エラーレスポンス）
- ヘルスチェック、レートリミット
- バージョニング戦略

**対象読者**: 開発者、QAエンジニア、フロントエンド開発者

---

### 5. [開発環境設計](./development-environment.md)

ローカル開発環境の構成、DevContainer設定、Docker Compose構成。

**内容**:

- DevContainer構成
  - Dockerfile設計
  - devcontainer.json設定
  - VS Code拡張機能
- ディレクトリ構造
- Docker Compose構成
  - Workspace Container
  - Cosmos DB Emulator
- 開発ツールとパッケージ
  - Python環境
  - Node.js環境
  - Azure CLI
- 環境変数管理
- ポート構成
- 初期化プロセス
- トラブルシューティング

**対象読者**: すべての開発者、新規参加者

---

### 6. [デプロイメント設計](./deployment.md)

Azure インフラ構成、CI/CD、Bicep IaC 設計。

**内容**:

- インフラストラクチャ概要
- Azure リソース構成
  - App Service (Frontend)
  - Container Apps (Backend)
  - Cosmos DB
  - Application Insights
- ネットワーク設計
- CI/CD パイプライン（GitHub Actions）
- Bicep IaC テンプレート
- 環境変数管理
- コスト見積もり

**対象読者**: DevOpsエンジニア、インフラエンジニア、開発者

---

## 🎯 利用ガイド

### 新規参加者向け

1. **[アーキテクチャ概要](./overview.md)** を読む
   - システム全体を理解
2. **[開発環境設計](./development-environment.md)** で開発環境をセットアップ
3. 担当サービスのREADMEと `docs/` ディレクトリを確認
4. **[API共通仕様](./api/api-specification.md)** + 担当サービスのAPI仕様で連携方法を把握

### フロントエンド開発者向け

1. **[開発環境設計](./development-environment.md)** でNext.js環境をセットアップ
2. **[BFF API仕様](../../src/front/docs/api-specification.md)** でエンドポイントを確認
3. **[フロントエンド コンポーネント設計](../../src/front/docs/component-design.md)** を参照
4. **[データ設計](./data/data-model.md)** でデータ構造を理解

### バックエンド開発者向け

1. **[開発環境設計](./development-environment.md)** でPython環境をセットアップ
2. 担当サービスの `docs/component-design.md` で詳細を確認
3. **[データ設計](./data/data-model.md)** でデータモデルを理解
4. 担当サービスの `docs/api-specification.md` + **[API共通仕様](./api/api-specification.md)** でエンドポイント仕様を実装

### インフラ担当者向け

1. **[デプロイメント設計](./deployment.md)** でインフラ構成を確認
2. Bicep テンプレートを使用してリソースをデプロイ
3. CI/CD パイプラインを設定

---

## 🔄 アーキテクチャ図

### システム全体像

```mermaid
graph TB
    User[ユーザー]

    subgraph "Frontend Layer"
        NextJS[Next.js BFF + UI]
    end

    subgraph "Backend Services"
        Auth[認証認可サービス]
        Tenant[テナント管理サービス]
        Service[利用サービス設定サービス]
    end

    subgraph "Data Layer"
        DB[(Cosmos DB)]
    end

    subgraph "Mock Services"
        Mock[モックサービス<br/>ファイル管理・メッセージング等]
    end

    User -->|HTTPS| NextJS
    NextJS -->|REST| Auth
    NextJS -->|REST| Tenant
    NextJS -->|REST| Service
    NextJS -.->|Mock Data| Mock

    Auth --> DB
    Tenant --> DB
    Service --> DB
```

---

## 📋 技術スタック概要

| レイヤー       | 技術                                    |
| -------------- | --------------------------------------- |
| **Frontend**   | React, Next.js, TypeScript              |
| **Backend**    | Python, FastAPI                         |
| **Database**   | Azure Cosmos DB (NoSQL)                 |
| **Hosting**    | Azure App Service, Azure Container Apps |
| **CI/CD**      | GitHub Actions                          |
| **IaC**        | Bicep                                   |
| **Monitoring** | Application Insights                    |

---

## 🔐 主要な設計原則

1. **マイクロサービスアーキテクチャ**: 各サービスは独立してデプロイ可能
2. **BFFパターン**: フロントエンド専用のバックエンド層でデータを集約
3. **JWT認証**: ステートレスな認証・認可
4. **ロールベースアクセス制御**: サービスごとのきめ細かい権限管理
5. **PoCに最適化**: シンプルで低コストな構成

---

## 📝 ドキュメント更新ルール

- アーキテクチャに変更がある場合は、該当ドキュメントを更新
- 変更履歴セクションに更新内容を記録
- プルリクエストに「architecture」ラベルを付与

---

## 📞 問い合わせ

アーキテクチャに関する質問や提案は、GitHubのIssueで管理してください。

---

## 関連ドキュメント

- [プロジェクト概要](../init.md)
- [開発環境について](../../.github/instructions/general.instructions.md)
- [エージェント利用ガイド](../../.github/instructions/agents.instructions.md)

---

## 変更履歴

| バージョン | 日付 | 変更内容                     | 作成者             |
| ---------- | ---- | ---------------------------- | ------------------ |
| 1.0.1      | 2024 | 開発環境設計ドキュメント追加 | Architecture Agent |
| 1.0.0      | 2024 | 初版作成                     | Architecture Agent |
