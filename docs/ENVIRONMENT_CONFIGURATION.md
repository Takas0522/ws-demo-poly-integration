# 環境設定ガイド

このガイドは、すべての環境（開発、ステージング、本番）における環境変数と機能フラグの設定に関する包括的なドキュメントを提供します。

## 📋 目次

- [概要](#概要)
- [クイックスタート](#クイックスタート)
- [環境ファイル](#環境ファイル)
- [環境変数リファレンス](#環境変数リファレンス)
- [機能フラグ](#機能フラグ)
- [環境固有の設定](#環境固有の設定)
- [Azure App Service設定](#azure-app-service設定)
- [セキュリティのベストプラクティス](#セキュリティのベストプラクティス)
- [検証](#検証)
- [トラブルシューティング](#トラブルシューティング)

## 🎯 概要

このアプリケーションは、異なるデプロイ環境をサポートし、機能を動的に有効/無効にするために、環境ベースの設定と機能フラグを使用しています。このアプローチにより以下が可能になります：

- **環境の分離**: 開発、ステージング、本番環境の個別設定
- **機能制御**: 段階的なロールアウトやA/Bテストのためのフラグによる機能切り替え
- **セキュリティ**: 機密データをバージョン管理にコミットしない
- **柔軟性**: コードのデプロイなしで設定を簡単に変更可能

## 🚀 クイックスタート

### ローカル開発の場合

1. **テンプレートをコピー**:
   ```bash
   cp .env.template .env
   ```

2. **または開発用サンプルを使用**:
   ```bash
   cp .env.development .env
   ```

3. **サービスを起動**:
   - CosmosDBエミュレータが動作している必要があります（DevContainerで自動起動）
   - サービスは自動的に`.env`ファイルから読み込みます

### 個別のサービスの場合

各サービスは独自の`.env`ファイルを持つことができます。テンプレートを各サービスディレクトリにコピーします：

```bash
# フロントエンド
cp .env.template src/front/.env

# 認証サービス
cp .env.template src/auth-service/.env

# ユーザー管理サービス
cp .env.template src/user-management-service/.env

# サービス設定サービス
cp .env.template src/service-setting-service/.env
```

## 📁 環境ファイル

| ファイル | 目的 | 使用方法 |
|------|---------|-------|
| `.env.template` | 全変数を含むテンプレート | ローカル開発用に`.env`にコピー |
| `.env.development` | 開発環境のデフォルト設定 | ローカルセットアップの参照用 |
| `.env.staging` | ステージング環境設定の参照 | Azure App Serviceステージングの参照用 |
| `.env.production` | 本番環境設定の参照 | Azure App Service本番環境の参照用 |
| `.env` | 実際のローカル設定 | サービスで使用（git除外対象） |

**重要**: `.env`ファイルはgit除外対象であり、バージョン管理にコミットしてはいけません。

## 📖 環境変数リファレンス

### コア設定

#### Node環境
```bash
NODE_ENV=development  # オプション: development, staging, production
```

ランタイム環境を決定し、ログ、エラー処理、その他の動作に影響します。

### CosmosDB設定

#### 接続設定
```bash
COSMOSDB_ENDPOINT=https://localhost:8081
COSMOSDB_KEY=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==
COSMOSDB_DATABASE=saas-management
```

- **COSMOSDB_ENDPOINT**: CosmosDBインスタンスのエンドポイントURL
  - ローカル: `https://localhost:8081` (エミュレータ)
  - Azure: `https://your-account.documents.azure.com:443/`
- **COSMOSDB_KEY**: 認証用のプライマリまたはセカンダリキー
  - ローカルエミュレータではデフォルトキーを使用
  - 本番環境ではAzure Key Vaultから取得
- **COSMOSDB_DATABASE**: データベース名（環境ごとに個別）

#### リトライ設定
```bash
COSMOSDB_MAX_RETRY_ATTEMPTS=3
COSMOSDB_RETRY_INTERVAL_MS=1000
```

### JWT認証設定

```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

- **JWT_SECRET**: JWTトークンの署名用秘密鍵
  - **重要**: ステージングと本番環境では強力な秘密鍵を生成してください
  - 生成方法: `openssl rand -base64 32` (最小) または `openssl rand -base64 64` (推奨)
  - 開発環境以外でデフォルト値を使用しないでください
- **JWT_EXPIRES_IN**: アクセストークンの有効期限（形式: `1h`, `24h`, `7d`）
- **JWT_REFRESH_EXPIRES_IN**: リフレッシュトークンの有効期限

### サービスポートとURL

```bash
# ポート（内部使用）
FRONTEND_PORT=3000
AUTH_SERVICE_PORT=3001
USER_MANAGEMENT_SERVICE_PORT=3002
SERVICE_SETTINGS_SERVICE_PORT=3003

# URL（サービス間通信用）
FRONTEND_URL=http://localhost:3000
AUTH_SERVICE_URL=http://localhost:3001
USER_MANAGEMENT_SERVICE_URL=http://localhost:3002
SERVICE_SETTINGS_SERVICE_URL=http://localhost:3003
```

### CORS設定

```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

クロスオリジンリソース共有（CORS）で許可されるオリジンのカンマ区切りリスト。

### ログ設定

```bash
LOG_LEVEL=info        # オプション: error, warn, info, debug
LOG_FORMAT=json       # オプション: json, text
LOG_FILE_PATH=        # オプション: ログファイルパス
```

### セキュリティ設定

```bash
# パスワード要件
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL_CHARS=true

# セッション設定
SESSION_TIMEOUT_MINUTES=30
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
```

### 開発ツール

```bash
ENABLE_API_DOCS=true              # Swagger/OpenAPIドキュメントを有効化
ENABLE_DETAILED_ERRORS=true       # 詳細なエラーメッセージを表示
ENABLE_REQUEST_LOGGING=true       # すべてのHTTPリクエストをログ記録
```

**警告**: `ENABLE_DETAILED_ERRORS`は本番環境では無効にして、機密情報の露出を防いでください。

## 🎛️ 機能フラグ

機能フラグを使用すると、コード変更なしで機能を有効/無効にできます。すべてのフラグは`enabled`または`disabled`の値を受け付けます。

### ユーザー管理機能

```bash
FEATURE_USER_CREATE=enabled        # 新規ユーザー作成を許可
FEATURE_USER_EDIT=enabled          # ユーザー詳細の編集を許可
FEATURE_USER_DELETE=enabled        # ユーザー削除を許可
FEATURE_USER_ROLE_ASSIGN=enabled   # ユーザーへのロール割り当てを許可
```

### サービス設定機能

```bash
FEATURE_SERVICE_CREATE=enabled     # 新規サービス作成を許可
FEATURE_SERVICE_EDIT=enabled       # サービス設定の編集を許可
FEATURE_SERVICE_DELETE=enabled     # サービス削除を許可
```

### 認証機能

```bash
FEATURE_PASSWORD_RESET=enabled           # パスワードリセット機能を有効化
FEATURE_EMAIL_VERIFICATION=enabled       # メール検証を有効化
FEATURE_TWO_FACTOR_AUTH=disabled         # 二要素認証を有効化
```

### 高度な機能

```bash
FEATURE_ANALYTICS=disabled         # 分析トラッキングを有効化
FEATURE_AUDIT_LOGGING=enabled      # 監査ログを有効化
FEATURE_RATE_LIMITING=disabled     # APIレート制限を有効化
```

### レート制限設定

```bash
RATE_LIMIT_WINDOW_MS=900000        # 時間ウィンドウ（15分）
RATE_LIMIT_MAX_REQUESTS=100        # ウィンドウあたりの最大リクエスト数
```

### コードでの機能フラグの使用

**バックエンド（Node.js/TypeScript）**:
```typescript
// 例: config/features.ts
export const isFeatureEnabled = (featureName: string): boolean => {
  const value = process.env[`FEATURE_${featureName.toUpperCase()}`];
  return value === 'enabled';
};

// サービスでの使用
if (isFeatureEnabled('USER_DELETE')) {
  // 削除操作を許可
}
```

**フロントエンド（React）**:
```typescript
// 例: hooks/useFeatureFlag.ts
export const useFeatureFlag = (featureName: string): boolean => {
  return import.meta.env[`VITE_FEATURE_${featureName}`] === 'enabled';
};

// コンポーネントでの使用
const canDeleteUser = useFeatureFlag('USER_DELETE');
```

## 🌍 環境固有の設定

### 開発環境

**目的**: デバッグ機能を最大限に備えたローカル開発

**主要設定**:
- デフォルト認証情報のCosmosDBエミュレータ
- デバッグレベルのログ
- すべての開発ツールを有効化
- テスト容易性のためのセキュリティ設定の緩和
- テスト用にすべての機能フラグを有効化

**セットアップ**:
```bash
cp .env.development .env
```

### ステージング環境

**目的**: 本番環境を模倣したプレ本番テスト環境

**主要設定**:
- Azure CosmosDBインスタンス（ステージング）
- 情報レベルのログ
- APIドキュメントを有効化
- 本番レベルのセキュリティ
- 本番ロールアウト前の新機能テスト

**設定**: Azure App Serviceアプリケーション設定を使用（後述）

### 本番環境

**目的**: 最大セキュリティのライブ本番環境

**主要設定**:
- Azure CosmosDBインスタンス（本番）
- 警告/エラーレベルのログのみ
- APIドキュメントを無効化
- 最大セキュリティ設定
- 保守的な機能フラグアプローチ
- Azure Key Vaultからの秘密情報

**設定**: Azure App Serviceアプリケーション設定 + Azure Key Vaultを使用

## ☁️ Azure App Service設定

### Azureでの環境変数設定

1. **Azureポータル経由**:
   - App Serviceに移動
   - **構成** > **アプリケーション設定**を選択
   - **+ 新しいアプリケーション設定**をクリック
   - **名前**と**値**を入力
   - **OK**をクリックし、**保存**

2. **Azure CLI経由**:
   ```bash
   az webapp config appsettings set \
     --resource-group <リソースグループ名> \
     --name <アプリ名> \
     --settings COSMOSDB_ENDPOINT="https://your-account.documents.azure.com:443/"
   ```

3. **ARMテンプレート経由**:
   ```json
   {
     "type": "Microsoft.Web/sites/config",
     "apiVersion": "2021-02-01",
     "name": "[concat(parameters('appServiceName'), '/appsettings')]",
     "properties": {
       "COSMOSDB_ENDPOINT": "[parameters('cosmosDbEndpoint')]",
       "NODE_ENV": "production"
     }
   }
   ```

### シークレット用のAzure Key Vault使用

**推奨対象**: JWT_SECRET、COSMOSDB_KEY、接続文字列

1. **Key Vaultにシークレットを保存**:
   ```bash
   az keyvault secret set \
     --vault-name <キーボールト名> \
     --name jwt-secret \
     --value <安全なjwt秘密鍵>
   ```

2. **App Serviceで参照**:
   ```
   @Microsoft.KeyVault(SecretUri=https://your-keyvault.vault.azure.net/secrets/jwt-secret/)
   ```

3. **マネージドIDを有効化**:
   ```bash
   az webapp identity assign \
     --resource-group <リソースグループ名> \
     --name <アプリ名>
   ```

4. **App ServiceにKey Vaultへのアクセス権を付与**:
   ```bash
   az keyvault set-policy \
     --name <キーボールト名> \
     --object-id <アプリサービスプリンシパルID> \
     --secret-permissions get list
   ```

## 🔒 セキュリティのベストプラクティス

### 1. シークレットをコミットしない

- ✅ ドキュメント用に`.env.template`を使用
- ✅ `.env`を`.gitignore`に保持
- ❌ 実際の値を含む`.env`ファイルをコミットしない
- ❌ ソースコードにシークレットをハードコーディングしない

### 2. 強力なシークレットを使用

```bash
# JWT秘密鍵を生成（最小32バイト）
openssl rand -base64 32

# より強力な秘密鍵を生成（推奨64バイト）
openssl rand -base64 64
```

### 3. シークレットを定期的にローテーション

- JWT秘密鍵を90日ごとにローテーション
- データベースキーを年1回または侵害時にローテーション
- ローテーション時にすべての依存サービスを更新

### 4. 環境の分離

- 各環境で異なるシークレットを使用
- 開発/ステージングで本番シークレットを使用しない
- 各環境で個別のデータベースを使用

### 5. 最小権限アクセス

- 書き込みアクセスが不要な場合は読み取り専用キーを使用
- CORSオリジンを特定のドメインに限定
- リソースアクセス用にAzure RBACを構成

### 6. 監視とアラート

- ステージングと本番環境でApplication Insightsを有効化
- 認証失敗のアラートを設定
- 異常なAPI使用パターンを監視

## ✅ 検証

### 手動検証

必要な変数が設定されていることを確認：

```bash
# 検証スクリプトの例
#!/bin/bash
required_vars=(
  "NODE_ENV"
  "COSMOSDB_ENDPOINT"
  "COSMOSDB_KEY"
  "JWT_SECRET"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "エラー: $varが設定されていません"
    exit 1
  fi
done

echo "すべての必須環境変数が設定されています"
```

### 自動検証

アプリケーション起動時に検証を実装：

```typescript
// 例: config/validate.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  COSMOSDB_ENDPOINT: z.string().url(),
  COSMOSDB_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT秘密鍵は最低32文字必要です'),
  JWT_EXPIRES_IN: z.string(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']),
});

export const validateEnv = () => {
  try {
    envSchema.parse(process.env);
    console.log('✅ 環境変数の検証に成功しました');
  } catch (error) {
    console.error('❌ 環境検証に失敗しました:', error);
    process.exit(1);
  }
};
```

### 設定のテスト

異なる環境での設定を検証するテストを作成：

```typescript
// tests/config.test.ts
import { describe, it, expect } from 'vitest';

describe('環境設定', () => {
  it('すべての必須変数を持つべき', () => {
    expect(process.env.NODE_ENV).toBeDefined();
    expect(process.env.COSMOSDB_ENDPOINT).toBeDefined();
    expect(process.env.JWT_SECRET).toBeDefined();
  });

  it('本番環境では有効なJWT秘密鍵を持つべき', () => {
    if (process.env.NODE_ENV === 'production') {
      expect(process.env.JWT_SECRET).not.toBe('dev-secret-key-not-for-production-use-only');
      expect(process.env.JWT_SECRET!.length).toBeGreaterThanOrEqual(32);
    }
  });
});
```

## 🔧 トラブルシューティング

### 問題: サービスがCosmosDBに接続できない

**症状**: 接続エラー、タイムアウトエラー

**解決策**:
1. CosmosDBエミュレータが動作していることを確認（開発環境）:
   ```bash
   curl -k https://localhost:8081/_explorer/emulator.pem
   ```
2. エンドポイントURLの形式を確認（Azure）:
   - `:443/`で終わる必要があります
   - `https://`を使用する必要があります
3. キーが正しく、期限切れでないことを確認
4. Azureのファイアウォールルールを確認

### 問題: JWT認証が失敗する

**症状**: 「無効なトークン」または「トークンが期限切れ」エラー

**解決策**:
1. すべてのサービスで`JWT_SECRET`が一致していることを確認
2. トークンの有効期限設定を確認
3. サービス間で時計が同期されていることを確認
4. 環境間でシークレットが誤って異なっていないか確認

### 問題: 機能フラグが機能しない

**症状**: 機能が予期せぬ動作をする

**解決策**:
1. フラグ値が正確に`enabled`または`disabled`であることを確認（大文字小文字区別あり）
2. コードと環境でフラグ名が一致していることを確認
3. 環境変数変更後にサービスを再起動
4. 古い値を保存している可能性のあるキャッシュをクリア

### 問題: 環境変数が読み込まれない

**症状**: 未定義またはデフォルト値

**解決策**:
1. 正しいディレクトリに`.env`ファイルが存在することを確認
2. ファイルのパーミッションを確認（読み取り可能であるべき）
3. 変数名にタイプミスがないか確認
4. 環境変数ローダーが正しく構成されていることを確認
5. dotenvまたは類似のパッケージがインストールされ初期化されていることを確認

### 問題: フロントエンドでCORSエラー

**症状**: 「Access-Control-Allow-Origin」エラー

**解決策**:
1. `CORS_ORIGINS`にフロントエンドURLが含まれていることを確認
2. 正確なURLを使用（プロトコルとポートを含む）
3. URLに末尾のスラッシュなし
4. 変更後にバックエンドサービスを再起動

## 📚 追加リソース

- [Azure App Service設定](https://docs.microsoft.com/azure/app-service/configure-common)
- [Azure Key Vault](https://docs.microsoft.com/azure/key-vault/general/overview)
- [CosmosDBセキュリティ](https://docs.microsoft.com/azure/cosmos-db/secure-access-to-data)
- [JWTベストプラクティス](https://tools.ietf.org/html/rfc8725)
- [機能フラグのベストプラクティス](https://martinfowler.com/articles/feature-toggles.html)

## 🔄 このドキュメントの更新

新しい環境変数を追加する場合:
1. `.env.template`に新しい変数とドキュメントを更新
2. すべての環境固有ファイル（`.env.development`、`.env.staging`、`.env.production`）を更新
3. このガイドで変数をドキュメント化
4. 重要な変数の検証を追加
5. 関連するADRドキュメントを更新

---

**最終更新**: 2026-01-09
