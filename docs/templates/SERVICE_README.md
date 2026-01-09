# サービス名

このサービスが何をするかの簡単な1行の説明。

## 📋 概要

サービスの詳細な説明、その目的、およびアプリケーション全体のアーキテクチャにおける役割。

## 🎯 機能

- 機能1：説明
- 機能2：説明
- 機能3：説明

## 🏗️ アーキテクチャ

サービスのアーキテクチャ、主要コンポーネント、およびそれらの相互作用について説明します。

### 主要コンポーネント

- **コンポーネント1**：説明と責任
- **コンポーネント2**：説明と責任
- **コンポーネント3**：説明と責任

## 🚀 はじめに

### 前提条件

- Node.js 18+
- npmまたはyarn
- [その他の要件]

### インストール

```bash
# リポジトリをクローン
git clone [repository-url]
cd [service-directory]

# 依存関係をインストール
npm install
```

### 環境変数

ルートディレクトリに`.env`ファイルを作成し、以下の変数を設定してください：

```env
# サーバー設定
PORT=3000
NODE_ENV=development

# データベース設定
COSMOSDB_ENDPOINT=https://localhost:8081
COSMOSDB_KEY=your-cosmosdb-key
COSMOSDB_DATABASE=your-database-name

# 認証
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# 機能フラグ
FEATURE_NEW_FEATURE=enabled

# ロギング
LOG_LEVEL=info
```

### サービスの実行

```bash
# ホットリロード付き開発モード
npm run dev

# 本番モード
npm run build
npm start

# テストを実行
npm test

# リンターを実行
npm run lint
```

## 📡 APIエンドポイント

### ベースURL
- **開発環境**: `http://localhost:3000`
- **ステージング環境**: `https://staging.example.com`
- **本番環境**: `https://api.example.com`

### 認証

すべてのエンドポイント（公開のものを除く）はJWT認証が必要です：

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### エンドポイント

#### GET /api/resource

リソースのリストを取得します。

**クエリパラメータ:**
- `page` (number, オプション): ページ番号（デフォルト: 1）
- `limit` (number, オプション): ページあたりのアイテム数（デフォルト: 20）
- `filter` (string, オプション): フィルター条件

**レスポンス:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "name": "リソース名",
      "createdAt": "2026-01-07T00:00:00Z"
    }
  ],
  "metadata": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

**ステータスコード:**
- `200 OK`: 成功
- `401 Unauthorized`: 認証がないか無効
- `500 Internal Server Error`: サーバーエラー

#### POST /api/resource

新しいリソースを作成します。

**リクエストボディ:**
```json
{
  "name": "リソース名",
  "description": "リソースの説明"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "リソース名",
    "description": "リソースの説明",
    "createdAt": "2026-01-07T00:00:00Z"
  }
}
```

**ステータスコード:**
- `201 Created`: リソースが正常に作成されました
- `400 Bad Request`: 無効な入力
- `401 Unauthorized`: 認証がないか無効
- `500 Internal Server Error`: サーバーエラー

#### GET /api/resource/:id

IDで特定のリソースを取得します。

**パスパラメータ:**
- `id` (string, 必須): リソースID

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "リソース名",
    "createdAt": "2026-01-07T00:00:00Z"
  }
}
```

**ステータスコード:**
- `200 OK`: 成功
- `404 Not Found`: リソースが見つかりません
- `401 Unauthorized`: 認証がないか無効
- `500 Internal Server Error`: サーバーエラー

#### PUT /api/resource/:id

リソースを更新します（完全更新）。

**パスパラメータ:**
- `id` (string, 必須): リソースID

**リクエストボディ:**
```json
{
  "name": "更新された名前",
  "description": "更新された説明"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "更新された名前",
    "description": "更新された説明",
    "updatedAt": "2026-01-07T00:00:00Z"
  }
}
```

**ステータスコード:**
- `200 OK`: 成功
- `400 Bad Request`: 無効な入力
- `404 Not Found`: リソースが見つかりません
- `401 Unauthorized`: 認証がないか無効
- `500 Internal Server Error`: サーバーエラー

#### DELETE /api/resource/:id

リソースを削除します。

**パスパラメータ:**
- `id` (string, 必須): リソースID

**レスポンス:**
```json
{
  "success": true,
  "message": "リソースが正常に削除されました"
}
```

**ステータスコード:**
- `204 No Content`: 正常に削除されました
- `404 Not Found`: リソースが見つかりません
- `401 Unauthorized`: 認証がないか無効
- `500 Internal Server Error`: サーバーエラー

### エラーレスポンス

すべてのエラーレスポンスはこの形式に従います：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "人間が読めるエラーメッセージ",
    "details": {
      "field": "追加のエラー詳細"
    }
  },
  "metadata": {
    "timestamp": "2026-01-07T00:00:00Z",
    "requestId": "unique-request-id"
  }
}
```

## 🧪 テスト

### テストの実行

```bash
# すべてのテストを実行
npm test

# カバレッジ付きで実行
npm run test:coverage

# 特定のテストファイルを実行
npm test -- path/to/test.spec.ts

# ウォッチモードで実行
npm test -- --watch
```

### テスト構造

```
tests/
├── unit/              # ユニットテスト
├── integration/       # 統合テスト
└── fixtures/          # テストデータとフィクスチャ
```

### テストの記述

テスト例：

```typescript
import { describe, it, expect } from 'vitest';
import { ResourceService } from './resource.service';

describe('ResourceService', () => {
  describe('createResource', () => {
    it('新しいリソースを作成できること', async () => {
      const service = new ResourceService();
      const data = { name: 'テストリソース' };
      
      const result = await service.createResource(data);
      
      expect(result).toBeDefined();
      expect(result.name).toBe(data.name);
    });
  });
});
```

## 🛠️ 開発

### プロジェクト構造

```
src/
├── controllers/       # リクエストハンドラ
├── services/         # ビジネスロジック
├── models/           # データモデル
├── middleware/       # Expressミドルウェア
├── utils/            # ユーティリティ関数
├── types/            # TypeScript型
├── config/           # 設定ファイル
└── index.ts          # アプリケーションエントリポイント
```

### コードスタイル

このプロジェクトは以下を使用します：
- **ESLint**：コードリンティング
- **Prettier**：コードフォーマット
- **TypeScript**：型チェック

リンティングとフォーマットを実行：

```bash
npm run lint          # リンティングエラーをチェック
npm run lint:fix      # リンティングエラーを自動修正
npm run format        # Prettierでコードをフォーマット
npm run type-check    # TypeScript型チェック
```

### 開発ワークフロー

1. 機能ブランチを作成：`git checkout -b feature/my-feature`
2. 変更を行い、慣習的コミットに従ってコミット
3. テストとリンティングを実行：`npm test && npm run lint`
4. 変更をプッシュしてプルリクエストを作成
5. CIチェックとコードレビューを待つ
6. 承認後にマージ

## 📚 ドキュメント

### APIドキュメント

OpenAPI/Swaggerドキュメントは以下で利用可能です：
- 開発環境：`http://localhost:3000/api-docs`
- 本番環境：`https://api.example.com/api-docs`

### コードドキュメント

インラインドキュメントにはJSDocを使用します：

```typescript
/**
 * 提供されたデータで新しいリソースを作成します。
 * 
 * @param data - リソースデータ
 * @returns 作成されたリソースに解決されるPromise
 * @throws {ValidationError} データが無効な場合
 */
async function createResource(data: ResourceInput): Promise<Resource> {
  // 実装
}
```

## 🚀 デプロイ

### 本番用ビルド

```bash
# アプリケーションをビルド
npm run build

# ビルド出力は'dist'ディレクトリに配置されます
```

### 環境固有の設定

- **開発環境**：`.env`ファイルを使用
- **ステージング環境**：Azure App Serviceの環境変数を使用
- **本番環境**：Azure App Serviceの環境変数を使用

### ヘルスチェック

サービスはヘルスチェックエンドポイントを提供します：

- `GET /health` - 基本的なヘルスチェック
- `GET /health/ready` - レディネスチェック（データベース接続を含む）
- `GET /health/live` - ライブネスチェック

## 📊 監視とロギング

### ロギング

このサービスは、異なるログレベルで構造化ロギングを使用します：

- `error`: エラー状態
- `warn`: 警告状態
- `info`: 情報メッセージ
- `debug`: デバッグレベルのメッセージ

ログレベルは`LOG_LEVEL`環境変数で設定します。

### メトリクス

公開される主要なメトリクス：
- リクエスト率
- レスポンス時間
- エラー率
- データベースクエリパフォーマンス

## 🔒 セキュリティ

### 認証

このサービスはJWTベースの認証を使用します。トークンは`Authorization`ヘッダーに含める必要があります：

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 認可

ドット記法を使用した権限ベースのアクセス制御：
- `resource.read` - 読み取りアクセス
- `resource.write` - 書き込みアクセス
- `resource.delete` - 削除アクセス

### セキュリティベストプラクティス

- すべての機密データは静止時に暗号化
- すべてのエンドポイントにHTTPSが必要
- 入力検証とサニタイゼーション
- SQLインジェクション防止
- XSS保護
- レート制限が有効

## 🤝 コントリビューション

コントリビューションガイドラインについては、ルートリポジトリの[CONTRIBUTING.md](../CONTRIBUTING.md)をお読みください。

## 📄 ライセンス

このプロジェクトはMITライセンスの下でライセンスされています - 詳細は[LICENSE](../LICENSE)ファイルを参照してください。

## 📞 サポート

issueと質問については：
- **GitHub Issues**: [issueを作成](https://github.com/Takas0522/ws-demo-poly-integration/issues)
- **ドキュメント**: メインリポジトリの`/docs`ディレクトリを参照

## 🗺️ ロードマップ

プロジェクト全体のロードマップについては、メインリポジトリの[DEVELOPMENT_PLAN.md](../DEVELOPMENT_PLAN.md)を参照してください。

---

**最終更新**: 2026-01-07
