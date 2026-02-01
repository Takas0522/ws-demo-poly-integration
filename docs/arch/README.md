# アーキテクチャドキュメント

## 概要

本ディレクトリには、マルチテナント管理アプリケーションのアーキテクチャ設計ドキュメントが含まれています。すべてのドキュメントはIEEE 1016に準拠した構成で作成されています。

## ドキュメント構成

### 1. [アーキテクチャ概要](./overview.md)

システム全体のアーキテクチャ設計の概要

**内容:**
- システム概要とビジネス要件
- アーキテクチャスタイル（マイクロサービス）
- 全体構成図
- コンポーネント一覧
- 非機能要件
- 設計原則
- 技術スタック
- デプロイメントアーキテクチャ

**対象読者:** すべてのステークホルダー

---

### 2. [コンポーネント設計](./components/)

各マイクロサービスの詳細設計

#### 2.1 [Frontend Service](./components/frontend.md)
- Next.js BFFアプリケーション
- UI/UXコンポーネント
- 認証フロー（NextAuth.js）
- API Routes実装
- 状態管理（TanStack Query）

#### 2.2 [Auth Service](./components/auth-service.md)
- 認証・認可処理
- JWT発行・検証
- ユーザー管理
- ロール管理
- パスワードハッシュ化

#### 2.3 [Tenant Management Service](./components/tenant-service.md)
- テナント管理CRUD
- テナントユーザー管理
- 特権テナント保護
- ドメイン管理

#### 2.4 [Service Setting Service](./components/service-setting-service.md)
- サービスカタログ管理
- テナント-サービスマッピング
- ロール情報収集
- サービス利用設定

#### 2.5 [Mock Services](./components/mock-services.md)
- File Service（ファイル管理）
- Messaging Service（メッセージング）
- API Service（API統合）
- Backup Service（バックアップ）

**対象読者:** 開発エンジニア、アーキテクト

---

### 3. [データモデル設計](./data/)

#### 3.1 [データモデル](./data/data-model.md)
- Cosmos DB設計
- コンテナ設計
- パーティションキー戦略
- インデックス戦略
- TTL設定
- データマイグレーション
- バックアップ戦略

**対象読者:** データベースエンジニア、開発エンジニア

---

### 4. [API設計](./api/)

#### 4.1 [API設計](./api/api-design.md)
- RESTful API仕様
- エンドポイント一覧
- リクエスト/レスポンス形式
- エラーハンドリング
- 認証・認可
- ページネーション
- レート制限
- OpenAPI仕様

**対象読者:** フロントエンドエンジニア、バックエンドエンジニア、API利用者

---

### 5. [セキュリティ設計](./security/)

#### 5.1 [認証認可フロー](./security/authentication-flow.md)
- ログインシーケンス
- JWT構造
- JWT鍵管理（Azure Key Vault）
- 認可フロー
- ロール階層
- トークン管理

#### 5.2 [セキュリティ考慮事項](./security/security-considerations.md)
- 脅威モデル（STRIDE分析）
- 攻撃シナリオと対策
- データセキュリティ
- ネットワークセキュリティ
- アプリケーションセキュリティ
- 監視とインシデント対応
- コンプライアンス

**対象読者:** セキュリティエンジニア、アーキテクト、監査担当者

---

### 6. [インフラストラクチャ設計](./infrastructure/)

#### 6.1 [インフラストラクチャ](./infrastructure/infrastructure.md)
- Azureリソース構成
- ネットワーク設計
- コンピューティングリソース（Container Apps）
- データストアサービス（Cosmos DB, Redis, Blob Storage）
- セキュリティサービス（Key Vault, API Management）
- 監視・ログ（Azure Monitor, Application Insights）
- CI/CDパイプライン（GitHub Actions, Bicep）
- ディザスタリカバリ
- コスト見積もり

**対象読者:** インフラエンジニア、DevOpsエンジニア、SRE

---

## ドキュメント読解ガイド

### 初めてプロジェクトに参画する方

1. **[アーキテクチャ概要](./overview.md)** - システム全体像を把握
2. **[セキュリティ考慮事項](./security/security-considerations.md)** - セキュリティ要件の理解
3. **担当する領域のコンポーネント設計** - 実装詳細の確認

### フロントエンド開発者

1. [Frontend Service](./components/frontend.md)
2. [API設計](./api/api-design.md)
3. [認証認可フロー](./security/authentication-flow.md)

### バックエンド開発者

1. [担当サービスのコンポーネント設計](./components/)
2. [データモデル設計](./data/data-model.md)
3. [API設計](./api/api-design.md)
4. [セキュリティ考慮事項](./security/security-considerations.md)

### インフラ・DevOpsエンジニア

1. [インフラストラクチャ設計](./infrastructure/infrastructure.md)
2. [セキュリティ考慮事項](./security/security-considerations.md)
3. [アーキテクチャ概要](./overview.md)

### アーキテクト・リードエンジニア

すべてのドキュメントを確認し、システム全体の整合性を理解

---

## ドキュメント更新ガイド

### 更新時の注意事項

1. **バージョン管理**: 各ドキュメントの変更履歴セクションを更新
2. **関連ドキュメントの更新**: 変更が他のドキュメントに影響する場合は同時に更新
3. **レビュー**: アーキテクトまたはリードエンジニアのレビューを受ける
4. **図の更新**: Mermaid形式で図を更新（PNG等のバイナリは避ける）

### 更新プロセス

```bash
# 1. ブランチ作成
git checkout -b docs/update-architecture

# 2. ドキュメント編集
# vi docs/arch/...

# 3. コミット
git add docs/arch/
git commit -m "docs: update architecture documentation"

# 4. プルリクエスト作成
git push origin docs/update-architecture
```

---

## ドキュメント規約

### Markdown規約

- **見出し**: `#`（H1）はドキュメントタイトルのみ使用
- **コードブロック**: 言語を指定（```python, ```yaml等）
- **リンク**: 相対パスを使用
- **図**: Mermaid記法を優先

### 命名規則

- **ファイル名**: kebab-case（例: `auth-service.md`）
- **セクション名**: 明確で簡潔な日本語
- **変数・定数**: 元の技術スタックの規約に従う

---

## ツールとリソース

### 推奨エディタ

- Visual Studio Code
  - 拡張機能: Markdown All in One
  - 拡張機能: Mermaid Preview

### 参考資料

- [IEEE 1016-2009](https://standards.ieee.org/standard/1016-2009.html) - Software Design Descriptions
- [C4 Model](https://c4model.com/) - アーキテクチャ図の記法
- [ADR（Architecture Decision Records）](https://adr.github.io/) - アーキテクチャ決定の記録

---

## お問い合わせ

ドキュメントに関する質問や提案は、以下の方法でお寄せください：

- **GitHub Issues**: プロジェクトリポジトリのIssuesセクション
- **チャット**: 開発チームSlackチャンネル
- **メール**: architecture-team@example.com

---

## 変更履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|-----------|------|---------|--------|
| 1.0.0 | 2026-02-01 | 初版作成 | Architecture Team |

---

**最終更新日**: 2026-02-01  
**ドキュメントバージョン**: 1.0.0  
**準拠規格**: IEEE 1016-2009
