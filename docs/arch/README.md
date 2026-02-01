# アーキテクチャドキュメント Index

## ドキュメント情報
- バージョン: 1.0.0
- 最終更新日: 2026-02-01
- プロジェクト: マルチテナント管理アプリケーション

## ドキュメント構成

本ディレクトリには、マルチテナント管理アプリケーションの全体アーキテクチャに関するドキュメントが格納されています。

### 📖 主要ドキュメント

#### 1. [システムアーキテクチャ概要](./overview.md)
システム全体の概要、アーキテクチャスタイル、技術スタック、設計原則について説明します。

**主要トピック**:
- システム概要とビジネス目的
- マイクロサービスアーキテクチャの採用理由
- BFFパターンの設計
- 全体システム構成図
- コンポーネント一覧
- スケーラビリティとコスト最適化
- 将来的な拡張性

**対象読者**: プロジェクトマネージャー、アーキテクト、全開発者

---

#### 2. [コンポーネント設計](./components/README.md)
各マイクロサービスの詳細設計、責務、技術スタック、コンポーネント間通信について説明します。

**主要トピック**:
- Frontend (Next.js BFF)
  - BFF層の実装
  - API Routes設計
  - 認証Middleware
- 認証認可サービス
  - JWT発行・検証
  - ユーザー管理
  - ロール管理とサービス統合
- テナント管理サービス
  - テナントCRUD
  - 特権テナント保護
  - ドメイン管理
- サービス設定サービス
  - サービス割り当て
  - ロール情報統合
- 管理対象サービス (4つのモックサービス)
  - 共通設計パターン
  - ロール定義
- **共通ライブラリ (common)**
  - 認証モジュール (common.auth): JWT処理、認証Middleware、ロールベース認可
  - データベースモジュール (common.database): Cosmos DB接続管理、BaseRepositoryクラス（テナント分離強制）
  - ロギングモジュール (common.logging): 構造化ログ（JSON形式）、Application Insights統合
  - モデルモジュール (common.models): 基底BaseModel、標準ErrorResponse
  - ミドルウェアモジュール (common.middleware): エラーハンドリング、リクエストID生成
  - ユーティリティモジュール (common.utils): バリデーター、ヘルパー関数
  - **セキュリティ機能**: BaseRepositoryによる3層のテナント分離チェック、セキュリティ違反の自動検知
- サービス間通信
  - RESTful API
  - 認証・認可
  - エラーハンドリング

**対象読者**: バックエンド開発者、フロントエンド開発者

---

#### 3. [データモデル設計](./data/README.md)
Cosmos DBを使用したデータストア設計、各エンティティのスキーマ、パーティション戦略について説明します。

**主要トピック**:
- Cosmos DB構成とパーティション戦略
- 認証認可サービスのデータモデル
  - User
  - RoleAssignment
  - ServiceRoleDefinition
- テナント管理サービスのデータモデル
  - Tenant
  - TenantUser
  - Domain
- サービス設定サービスのデータモデル
  - Service
  - ServiceAssignment
  - ServiceUsage
- 管理対象サービスのデータモデル
  - File, Folder
  - Channel, Message
  - APIKey, APIUsage
  - BackupJob, BackupHistory
- データ整合性とバリデーション
- データライフサイクル管理 (TTL, ソフトデリート)
- パフォーマンス最適化 (インデックス、クエリ)
- データ移行とスキーマバージョニング
- セキュリティ考慮事項

**対象読者**: バックエンド開発者、データベースエンジニア

---

#### 4. [API設計](./api/README.md)
RESTful API設計、エンドポイント仕様、リクエスト・レスポンス形式、エラーハンドリングについて説明します。

**主要トピック**:
- API設計原則
  - RESTful設計ガイドライン
  - HTTPメソッドとステータスコード
  - バージョニング戦略
- 共通仕様
  - リクエスト・レスポンス形式
  - ページネーション
  - フィルタリング・ソート
- 認証認可サービスAPI
  - `/auth/login`, `/auth/verify`
  - ユーザー管理エンドポイント
  - ロール管理エンドポイント
- テナント管理サービスAPI
  - テナント管理エンドポイント
  - テナントユーザー管理
  - ドメイン管理
- サービス設定サービスAPI
  - サービスカタログ
  - サービス割り当て
  - ロール統合
- BFF (Frontend) API
  - 認証エンドポイント
  - 集約エンドポイント
- エラーコード一覧
- セキュリティ (レート制限、CORS、セキュリティヘッダー)
- OpenAPI仕様

**対象読者**: バックエンド開発者、フロントエンド開発者、APIインテグレーター

---

#### 5. [セキュリティ設計](./security/README.md)
認証・認可、データ保護、ネットワークセキュリティ、監査ログについて説明します。

**主要トピック**:
- セキュリティ概要と脅威モデル (STRIDE分析)
- 認証 (Authentication)
  - JWT設計と実装（共通ライブラリによる一元化）
  - パスワード管理 (bcrypt)
  - トークン保存 (HTTPOnly Cookie)
  - 認証失敗時の保護 (レート制限、ロックアウト)
- 認可 (Authorization)
  - RBAC実装（ロールベース認可デコレータ）
  - **テナント分離（共通ライブラリBaseRepositoryによる3層チェック）**
    - パーティションキー強制
    - クエリ内テナントIDフィルタ検証
    - パラメータ検証
  - 特権テナント保護
  - 特権テナント保護
- データセキュリティ
  - 暗号化 (at rest, in transit)
  - PII保護
  - 入力検証とサニタイゼーション
  - 秘密情報管理
- ネットワークセキュリティ
  - CORS
  - レート制限
  - DDoS対策
- アプリケーションセキュリティ
  - XSS対策
  - CSRF対策
  - 依存関係の脆弱性管理
- 監査とロギング
  - 監査ログ設計
  - セキュリティログ
  - ログ保持ポリシー
- インシデント対応
  - 検知と対応手順
- セキュリティチェックリスト

**対象読者**: セキュリティエンジニア、全開発者、運用担当者

---

#### 6. [デプロイメント設計](./deployment/README.md)
Azureインフラストラクチャ、CI/CDパイプライン、モニタリング、バックアップ戦略について説明します。

**主要トピック**:
- デプロイメント概要とAzureリソース構成
- Bicepテンプレート設計
  - main.bicep
  - App Service, Cosmos DB, Application Insights モジュール
- CI/CDパイプライン
  - GitHub Actions ワークフロー
  - CI (テスト、リント)
  - インフラデプロイ
  - アプリケーションデプロイ
- デプロイメント戦略
  - ブルーグリーンデプロイメント
  - カナリアデプロイメント
  - ロールバック戦略
- モニタリングとロギング
  - Application Insights
  - カスタムメトリクス
  - ログ集約
  - ダッシュボード
- 環境変数管理
  - GitHub Secrets
  - Azure App Service設定
- バックアップとディザスタリカバリ
  - Cosmos DB継続的バックアップ
  - リストア手順
  - DR計画
- スケーリング戦略
  - App Serviceオートスケール
  - Cosmos DB自動スケール
- デプロイメントチェックリスト

**対象読者**: DevOpsエンジニア、インフラエンジニア、運用担当者

---

## ドキュメント横断的トピック

### アーキテクチャ原則
本システムは以下の原則に基づいて設計されています：

1. **疎結合**: サービス間の依存を最小化し、REST APIで連携
2. **高凝集**: 各サービスは明確なドメイン責務を持つ
3. **単一責務**: 1サービス1ドメイン原則
4. **クラウドネイティブ**: Azure PaaSサービスを最大活用
5. **コスト最適化**: 最小限のリソースで最大の価値を提供
6. **セキュリティファースト**: ゼロトラスト原則の適用

### 技術スタック概要

| レイヤー | 技術 | 理由 |
|---------|------|------|
| Frontend | Next.js 14, React 18 | BFFパターン、SSR、最適化 |
| Backend | Python 3.11, FastAPI | 非同期処理、高速、型安全 |
| Database | Azure Cosmos DB | NoSQL、グローバル分散、スケーラブル |
| IaC | Azure Bicep | 宣言的、型安全、Azureネイティブ |
| CI/CD | GitHub Actions | 無料、統合性、柔軟性 |
| Monitoring | Application Insights | Azure統合、リアルタイム監視 |

### コスト概算

| リソース | プラン | 月額 (USD) |
|---------|-------|-----------|
| App Service x5 | B1 | $65 |
| Cosmos DB | 400 RU/s 自動スケール | $24 |
| Application Insights | Basic | $5 |
| **合計** | | **$94** |

**最適化オプション**: 複数App Serviceを1つのPlanで共有することで、最大$26まで削減可能。

## ドキュメント更新履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|----------|------|---------|--------|
| 1.0.0 | 2026-02-01 | 初版作成 - 全ドキュメント作成 | Architecture Team |
| 1.1.0 | 2026-02-01 | 共通ライブラリのセクションを追加、主要モジュールとセキュリティ機能を明記 | Architecture Team |

## ドキュメントの使い方

### 新規参加者向け
1. まず[システムアーキテクチャ概要](./overview.md)を読んで全体像を把握
2. 担当する領域のドキュメントを詳読
   - Frontend開発者: コンポーネント設計、API設計
   - Backend開発者: コンポーネント設計、データモデル設計、API設計
   - インフラエンジニア: デプロイメント設計
3. [セキュリティ設計](./security/README.md)は全員必読

### 機能追加時
1. [コンポーネント設計](./components/README.md)で既存パターンを確認
2. [データモデル設計](./data/README.md)で新規エンティティを設計
3. [API設計](./api/README.md)でエンドポイント仕様を定義
4. [セキュリティ設計](./security/README.md)でセキュリティ要件を確認
5. ドキュメントを更新

### 問題発生時
1. [デプロイメント設計](./deployment/README.md)でロールバック手順を確認
2. [セキュリティ設計](./security/README.md)でインシデント対応手順を確認
3. Application Insightsでログとメトリクスを調査

## 関連リソース

### 外部ドキュメント
- [プロジェクト概要](../init.md)
- [開発環境セットアップ](../../README.md)

### 技術リファレンス
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
- [Azure Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)

### ベストプラクティス
- [Microservices Patterns](https://microservices.io/patterns/)
- [The Twelve-Factor App](https://12factor.net/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Azure Architecture Center](https://docs.microsoft.com/azure/architecture/)

## 貢献とフィードバック

ドキュメントの改善提案や誤りの報告は、GitHubのIssueまたはPull Requestでお願いします。

### ドキュメント更新ガイドライン
1. IEEE 1016に準拠した構成を維持
2. Mermaid記法で図を作成
3. コードサンプルは実行可能なものを提供
4. 変更履歴を必ず記録

---

**最終更新**: 2026-02-01  
**管理**: Architecture Team  
**問い合わせ**: architecture@example.com
