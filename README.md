# 🚀 SaaS管理者Webアプリケーション - Polyrepo統合

Gitサブモジュールを使用したpolyrepoアーキテクチャで構築された包括的なSaaS管理プラットフォームです。このプロジェクトは、独立したサービスリポジトリを持つマルチサービスアプリケーションを構築するための、モダンでスケーラブルなアプローチを示しています。

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

このプロジェクトは、以下の主要機能を備えたマルチテナントSaaS管理アプリケーションを提供します：

- **ユーザー管理**: ロールベースのアクセス制御を含む完全なユーザーライフサイクル管理
- **認証と認可**: ドット記法の権限システムを使用したJWTベースの認証
- **サービス設定管理**: サービスの集中設定管理
- **マルチテナントアーキテクチャ**: データ分離のためのCosmosDBベースのテナントパーティショニング
- **ボタンレベルの認可**: ユーザー権限に基づく詳細なUI制御

## 🏗️ アーキテクチャ

### Polyrepo構造

このリポジトリは、Gitサブモジュールを使用した**polyrepo統合**パターンに従っています。各サービスは独自のリポジトリで管理され、ここでサブモジュールとして統合されます：

```
ws-demo-poly-integration/
├── src/
│   ├── front/                    # フロントエンドアプリケーション (React + TypeScript)
│   ├── auth-service/             # 認証サービス
│   ├── user-management-service/  # ユーザー管理サービス
│   └── service-setting-service/  # サービス設定サービス
├── docs/                         # ドキュメント
│   ├── api/                      # APIドキュメント
│   ├── adr/                      # アーキテクチャ決定記録
│   └── templates/                # サービス用テンプレート
├── README.md
├── CONTRIBUTING.md
└── DEVELOPMENT_PLAN.md
```

### サービスアーキテクチャ

アプリケーションは**マイクロサービスアーキテクチャ**パターンに従っています：

- **フロントエンド (React)**: ユーザーインターフェースを提供するシングルページアプリケーション
- **認証サービス**: JWT認証とトークン管理を処理
- **ユーザー管理サービス**: ユーザーのCRUD操作とプロファイルを管理
- **サービス設定サービス**: サービス構成と機能フラグを管理

すべてのサービスはRESTful API経由で通信し、共有型ライブラリ（`@types`）を通じて共通の型を共有します。

### 主要な設計原則

1. **トランクベース開発**: メインブランチは常にデプロイ可能
2. **機能フラグ**: 段階的なロールアウトのための環境ベースの機能切り替え
3. **マルチテナンシー**: CosmosDBを使用したテナント分割データ
4. **権限システム**: ドット記法ベースの詳細な権限制御
5. **API優先**: すべてのサービスのOpenAPI/Swaggerドキュメント

## 🔧 サービス

### フロントエンドアプリケーション (`src/front`)
- **リポジトリ**: [ws-demo-poly1](https://github.com/Takas0522/ws-demo-poly1.git)
- **技術スタック**: React, TypeScript, Vite
- **目的**: ボタンレベルの認可を持つ管理操作のユーザーインターフェース

### 認証サービス (`src/auth-service`)
- **リポジトリ**: [ws-demo-poly3](https://github.com/Takas0522/ws-demo-poly3.git)
- **技術スタック**: Node.js, Express, TypeScript
- **目的**: JWT認証、トークン管理、セッション処理

### ユーザー管理サービス (`src/user-management-service`)
- **リポジトリ**: [ws-demo-poly2](https://github.com/Takas0522/ws-demo-poly2.git)
- **技術スタック**: Node.js, Express, TypeScript, CosmosDB
- **目的**: ユーザーCRUD操作、プロファイル管理、ロール割り当て

### サービス設定サービス (`src/service-setting-service`)
- **リポジトリ**: [ws-demo-poly4](https://github.com/Takas0522/ws-demo-poly4.git)
- **技術スタック**: Node.js, Express, TypeScript, CosmosDB
- **目的**: サービス構成管理と機能フラグ制御

## 💻 技術スタック

### フロントエンド
- **フレームワーク**: React 18+
- **言語**: TypeScript
- **ビルドツール**: Vite
- **UIライブラリ**: 未定 (Material-UI/Ant Design)
- **状態管理**: 未定 (Redux/Zustand)

### バックエンドサービス
- **ランタイム**: Node.js 18+
- **フレームワーク**: Express.js
- **言語**: TypeScript
- **データベース**: Azure CosmosDB (SQL API)
- **認証**: JWT (jsonwebtoken)
- **APIドキュメント**: OpenAPI 3.0 (Swagger)

### インフラストラクチャ
- **ホスティング**: Azure App Service
- **データベース**: Azure CosmosDB
- **CI/CD**: GitHub Actions
- **コンテナ**: CosmosDBエミュレータ付きDevContainer
- **監視**: Azure Application Insights (予定)

## 🚀 はじめに

### 前提条件

- **Git**: バージョン2.13以降（サブモジュールサポート用）
- **Node.js**: バージョン18以降
- **Docker**: DevContainerとCosmosDBエミュレータ用
- **VS Code**: Remote - Containers拡張機能の使用を推奨

### 初期セットアップ

1. **サブモジュールを含めてリポジトリをクローン：**
   ```bash
   git clone --recursive https://github.com/Takas0522/ws-demo-poly-integration.git
   cd ws-demo-poly-integration
   ```

   `--recursive`オプションなしでクローンした場合は、サブモジュールを初期化してください：
   ```bash
   git submodule update --init --recursive
   ```

2. **DevContainerで開く**（推奨）：
   - VS Codeでプロジェクトを開く
   - プロンプトが表示されたら「コンテナで再度開く」をクリック
   - DevContainerには、CosmosDBエミュレータと必要なすべてのツールが含まれています

3. **各サービスの依存関係をインストール：**
   ```bash
   # フロントエンド
   cd src/front
   npm install

   # 認証サービス
   cd ../auth-service
   npm install

   # ユーザー管理サービス
   cd ../user-management-service
   npm install

   # サービス設定サービス
   cd ../service-setting-service
   npm install
   ```

4. **環境変数を設定：**
   - 各サービスディレクトリで`.env.example`を`.env`にコピー
   - ローカルセットアップに応じて値を更新
   - 各サービスの具体的な設定については、各サービスのREADMEを参照

### ローカルで実行

各サービスを別々のターミナルで起動：

```bash
# フロントエンド (デフォルト: http://localhost:5173)
cd src/front
npm run dev

# 認証サービス (デフォルト: http://localhost:3001)
cd src/auth-service
npm run dev

# ユーザー管理サービス (デフォルト: http://localhost:3002)
cd src/user-management-service
npm run dev

# サービス設定サービス (デフォルト: http://localhost:3003)
cd src/service-setting-service
npm run dev
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
- 短期間の機能ブランチ（2日以内）
- 未完成機能の機能フラグ
- GitHub Actions経由の継続的インテグレーション
- すべての変更にコードレビューが必要

### テスト

各サービスには独自のテストスイートがあります。コミット前にテストを実行してください：

```bash
# 各サービスディレクトリで
npm test                 # ユニットテストを実行
npm run test:integration # 統合テストを実行
npm run test:coverage    # カバレッジレポートを生成
```

### コード品質

高いコード品質基準を維持しています：

```bash
# 各サービスディレクトリで
npm run lint            # コードスタイルをチェック
npm run lint:fix        # スタイルの問題を自動修正
npm run type-check      # TypeScriptの型チェック
```

## 📚 ドキュメント

- **[CONTRIBUTING.md](./CONTRIBUTING.md)**: 開発ガイドラインとコントリビューションプロセス
- **[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)**: 詳細な開発ロードマップとissue分類
- **[docs/api/](./docs/api/)**: 各サービスのAPIドキュメント
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

このプロジェクトはMITライセンスの下でライセンスされています - 詳細は[LICENSE](./LICENSE)ファイルを参照してください。

## 📞 サポート

質問、issues、またはコントリビューションについては：

- **GitHub Issues**: [issueを作成](https://github.com/Takas0522/ws-demo-poly-integration/issues)
- **ドキュメント**: [docs/](./docs/)ディレクトリを参照
- **開発計画**: [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)を参照

## 🗺️ ロードマップ

6つのフェーズに整理された完全な開発ロードマップについては、[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)を参照してください：

1. **フェーズ1**: 基盤と開発環境
2. **フェーズ2**: データレイヤーとコアインフラストラクチャ
3. **フェーズ3**: 認証と認可
4. **フェーズ4**: サービス実装
5. **フェーズ5**: データとテスト
6. **フェーズ6**: デプロイとCI/CD

---

**モダンなTypeScript、React、Azureテクノロジーで❤️を込めて構築**