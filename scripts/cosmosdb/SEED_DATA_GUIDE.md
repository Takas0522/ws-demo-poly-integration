# シードデータシステムガイド

SaaS管理アプリケーションの包括的なシードデータシステムのドキュメント

## 📚 目次

1. [概要](#概要)
2. [アーキテクチャ](#アーキテクチャ)
3. [環境別シードデータ](#環境別シードデータ)
4. [使用方法](#使用方法)
5. [シードデータの作成](#シードデータの作成)
6. [検証システム](#検証システム)
7. [クリーンアップユーティリティ](#クリーンアップユーティリティ)
8. [ベストプラクティス](#ベストプラクティス)

## 概要

シードデータシステムは、開発、テスト、ステージング環境用の一貫性のあるデータセットを提供します。主な機能：

✅ **JSONベースのシードデータ** - バージョン管理とレビューが容易  
✅ **環境別データセット** - 各環境に適したデータ  
✅ **冪等性** - 複数回実行しても同じ結果  
✅ **自動検証** - データ整合性を保証  
✅ **関係整合性** - テナント、ユーザー、権限の関係を維持  
✅ **クリーンアップユーティリティ** - テストデータの簡単な削除

## アーキテクチャ

### ディレクトリ構造

```
scripts/cosmosdb/
├── data/
│   └── seeds/
│       ├── development/      # 開発環境データ
│       │   ├── tenants.json
│       │   ├── users.json
│       │   └── permissions.json
│       ├── staging/          # ステージング環境データ
│       │   ├── tenants.json
│       │   ├── users.json
│       │   └── permissions.json
│       └── testing/          # テスト環境データ
│           ├── tenants.json
│           ├── users.json
│           └── permissions.json
├── init-database.ts          # データベース初期化
├── seed-data-json.ts         # JSONベースシーダー（推奨）
├── seed-data.ts              # レガシーシーダー
├── validation.ts             # 検証ユーティリティ
├── cleanup-data.ts           # クリーンアップユーティリティ
├── types.ts                  # TypeScript型定義
└── README.md                 # メインドキュメント
```

### コンポーネント

#### 1. JSONシードデータファイル (`data/seeds/`)

各環境用の構造化JSONデータファイル：

- **tenants.json** - テナント/組織データ
- **users.json** - ユーザーアカウントと認証情報
- **permissions.json** - 権限定義

#### 2. シードローダー (`seed-data-json.ts`)

環境を検出し、対応するJSONファイルをロードしてデータベースに投入：

- 環境の自動検出（引数またはNODE_ENV）
- シード前の検証
- 冪等なupsert操作
- パスワードの自動ハッシュ化

#### 3. 検証システム (`validation.ts`)

シードデータの完全性を保証：

- スキーマ検証
- 形式チェック（メール、権限名、日付）
- 関係整合性（テナント参照、権限参照）
- 重複チェック

#### 4. クリーンアップユーティリティ (`cleanup-data.ts`)

テストデータの管理：

- コンテナ単位のクリーンアップ
- テナント単位のクリーンアップ
- 完全リセット
- 統計表示

## 環境別シードデータ

### 開発環境 (`development/`)

**目的:** ローカル開発とデモ用の豊富なデータセット

**内容:**
- 2つのテナント（dev-tenant、demo-tenant）
- 4人のユーザー（admin、user、manager、demo-admin）
- 13の権限（全機能セット）
- 様々なロールと権限の組み合わせ

**ユースケース:**
- フロントエンド開発
- 機能デモ
- 手動テスト
- UI/UXレビュー

### ステージング環境 (`staging/`)

**目的:** 本番前検証用の最小限だが完全なデータセット

**内容:**
- 1つのテナント（staging-tenant）
- 1人の管理者（2FA有効）
- 13の権限（全機能セット）
- 本番に近い設定

**ユースケース:**
- 統合テスト
- パフォーマンステスト
- セキュリティテスト
- 本番前確認

**セキュリティノート:**
- すべてのユーザーで2FA推奨
- 初回ログイン時のパスワード変更必須
- 実際の本番データは使用しない

### テスト環境 (`testing/`)

**目的:** 自動テスト用の最小限のデータセット

**内容:**
- 2つのテナント（test-tenant-001、test-tenant-002）
- 3人のユーザー（各テナント用）
- 6つの基本権限
- 様々なサブスクリプションプラン

**ユースケース:**
- ユニットテスト
- 統合テスト
- E2Eテスト
- CI/CDパイプライン

## 使用方法

### 基本的なワークフロー

#### 1. データベースの初期化

```bash
cd scripts/cosmosdb
npm install  # 初回のみ
npm run init
```

#### 2. シードデータのロード

```bash
# 開発環境（デフォルト）
npm run seed:json:dev

# ステージング環境
npm run seed:json:staging

# テスト環境
npm run seed:json:testing
```

#### 3. データの確認

```bash
# 統計を確認
npm run cleanup:stats

# テナントをリスト表示
npm run cleanup:list
```

#### 4. データのクリーンアップ（必要に応じて）

```bash
# 特定のテナントを削除
npm run cleanup -- --tenant test-tenant-001

# すべてを削除して再シード
npm run cleanup -- --all
npm run seed:json:dev
```

### 高度な使用方法

#### カスタム環境の作成

```bash
# 新しい環境ディレクトリを作成
mkdir -p data/seeds/my-custom-env

# テンプレートからコピー
cp data/seeds/development/*.json data/seeds/my-custom-env/

# 必要に応じて編集
vim data/seeds/my-custom-env/users.json

# カスタム環境でシード
npx ts-node seed-data-json.ts my-custom-env
```

#### CI/CDパイプラインでの使用

```yaml
# GitHub Actions例
- name: Setup Database
  run: |
    cd scripts/cosmosdb
    npm install
    npm run init
    npm run seed:json:testing
  env:
    COSMOSDB_ENDPOINT: ${{ secrets.COSMOSDB_ENDPOINT }}
    COSMOSDB_KEY: ${{ secrets.COSMOSDB_KEY }}
    COSMOSDB_DATABASE: ${{ secrets.COSMOSDB_DATABASE }}
```

## シードデータの作成

### テナントデータ (`tenants.json`)

```json
{
  "id": "my-tenant",
  "tenantId": "my-tenant",
  "name": "My Organization",
  "status": "active",
  "subscription": {
    "plan": "professional",
    "startDate": "2026-01-01T00:00:00.000Z",
    "endDate": "2026-12-31T23:59:59.999Z",
    "maxUsers": 50
  },
  "settings": {
    "timezone": "Asia/Tokyo",
    "locale": "ja-JP",
    "features": {
      "twoFactorAuth": true,
      "apiAccess": true,
      "advancedReporting": true
    }
  }
}
```

**必須フィールド:**
- `id` - 一意の識別子（tenantIdと同じ）
- `tenantId` - パーティションキー
- `name` - 表示名
- `status` - `active` | `suspended` | `inactive`
- `subscription.plan` - `free` | `basic` | `professional` | `enterprise`

### ユーザーデータ (`users.json`)

```json
{
  "id": "user-001",
  "tenantId": "my-tenant",
  "email": "user@example.com",
  "username": "username",
  "firstName": "First",
  "lastName": "Last",
  "password": "SecurePassword@123",
  "status": "active",
  "roles": ["user"],
  "permissions": ["users.read", "services.read"],
  "profile": {
    "department": "Engineering",
    "jobTitle": "Developer"
  },
  "security": {
    "failedLoginAttempts": 0,
    "twoFactorEnabled": false
  }
}
```

**必須フィールド:**
- `id` - 一意の識別子
- `tenantId` - 所属テナント（存在するテナントを参照）
- `email` - 有効なメールアドレス
- `username` - ユーザー名
- `password` - プレーンテキスト（シード時に自動ハッシュ化）
- `roles` - ロールの配列
- `permissions` - 権限名の配列（ドット記法）

### 権限データ (`permissions.json`)

```json
{
  "name": "users.create",
  "displayName": "Create User",
  "description": "Permission to create new users",
  "category": "users",
  "resource": "users",
  "action": "create",
  "scope": "tenant",
  "isActive": true,
  "requiredPlan": "basic",
  "metadata": {
    "uiSection": "User Management",
    "uiButton": "Create User",
    "requiresConfirmation": true
  }
}
```

**必須フィールド:**
- `name` - ドット記法の権限名（例：`resource.action`）
- `category` - `users` | `services` | `settings` | `system`
- `action` - `create` | `read` | `update` | `delete` | `execute`
- `scope` - `tenant` | `global` | `own`

## 検証システム

### 自動検証

シードデータは自動的に以下を検証：

#### 1. スキーマ検証
- 必須フィールドの存在
- データ型の正確性
- 列挙値の妥当性

#### 2. 形式検証
- メールアドレス形式
- 権限名形式（ドット記法）
- ISO 8601日付形式
- UUID形式

#### 3. 関係整合性
- ユーザーが有効なテナントを参照
- 権限が定義された権限を参照
- 重複IDのチェック

#### 4. ビジネスルール
- ロールとプランの一貫性
- セキュリティ要件（パスワード、2FA）

### 検証出力

```
═══════════════════════════════════════════════════════
  Seed Data Validation Results
═══════════════════════════════════════════════════════

✅ All validations passed!

または

❌ ERRORS:
  • User[0] (email): Invalid email format: invalid-email
    Value: "invalid-email"

⚠️  WARNINGS:
  • User[1] (permissions[3]): Invalid permission name format: invalid_format
    Value: "invalid_format"
```

## クリーンアップユーティリティ

### コマンド

```bash
# 統計を表示（読み取り専用）
npm run cleanup:stats

# テナントをリスト表示（読み取り専用）
npm run cleanup:list

# 特定のテナントのデータを削除
npm run cleanup -- --tenant dev-tenant

# 特定のコンテナを削除
npm run cleanup -- --container Users

# すべてのデータを削除（確認あり）
npm run cleanup -- --all

# すべてのデータを削除（確認スキップ）
npm run cleanup -- --all --confirm
```

### 安全機能

- デフォルトで確認プロンプト
- 読み取り専用操作の分離
- 詳細なログ出力
- エラー処理とロールバック

## ベストプラクティス

### セキュリティ

1. **パスワード管理**
   - 開発環境でもシンプルなパスワードは避ける
   - ステージング/本番では初回ログイン時に変更を強制
   - パスワードをログに出力しない

2. **シークレット管理**
   - シードデータファイルに本番シークレットを含めない
   - 環境変数で機密データを管理
   - .gitignoreで機密ファイルを除外

3. **アクセス制御**
   - ステージング/本番では2FAを有効化
   - 最小権限の原則に従う
   - 定期的に権限をレビュー

### データ管理

1. **バージョン管理**
   - シードデータの変更をGitでトラック
   - 意味のあるコミットメッセージを使用
   - ブランチ戦略に従う

2. **環境分離**
   - 環境ごとに適切なデータセットを使用
   - 本番データをテスト環境で使用しない
   - データの最小化（テスト環境）

3. **冪等性**
   - シードスクリプトを複数回実行可能に
   - upsert操作を使用
   - 状態チェックを実装

### テスト

1. **CI/CD統合**
   - パイプラインでテストデータを自動シード
   - 各テスト実行前にクリーンアップ
   - 並列テストでテナントを分離

2. **データ品質**
   - シードデータを定期的に検証
   - スキーマ変更時にシードデータを更新
   - エッジケースをカバー

3. **クリーンアップ**
   - テスト後にデータをクリーンアップ
   - 一時テナントに明確な命名規則を使用
   - TTLを適切に設定

### ドキュメント

1. **データ構造**
   - シードデータの目的を文書化
   - 各環境のユースケースを説明
   - 認証情報のアクセス方法を明記

2. **変更管理**
   - シードデータの変更を記録
   - スキーマの進化を文書化
   - マイグレーションパスを提供

## トラブルシューティング

### よくある問題

#### 1. 接続エラー

```
Error: Connection failed
```

**解決策:**
- CosmosDBエミュレータが実行中か確認
- COSMOSDB_ENDPOINTとCOSMOSDB_KEYが正しいか確認
- ネットワーク接続を確認

#### 2. 検証エラー

```
Error: Invalid email format
```

**解決策:**
- JSONファイルのデータ形式を確認
- 必須フィールドがすべて存在するか確認
- 列挙値が有効か確認

#### 3. 権限参照エラー

```
Warning: User references undefined permission
```

**解決策:**
- permissions.jsonに権限定義を追加
- 権限名のスペルを確認
- テナント固有の権限を確認

#### 4. 重複エラー

```
Error: Duplicate tenant ID found
```

**解決策:**
- テナントIDが一意か確認
- 既存データをクリーンアップ
- IDの命名規則に従う

## 関連リソース

- [メインREADME](./README.md) - 全体的な使用方法
- [types.ts](./types.ts) - TypeScript型定義
- [スキーマドキュメント](../../docs/database/SCHEMA.md)
- [CosmosDB ADR](../../docs/adr/003-cosmosdb-schema-tenant-partitioning.md)

---

**最終更新:** 2026-01-11  
**バージョン:** 1.0.0
