# 設定検証ガイド

このガイドは、アプリケーションが正しい設定で起動することを保証するために、環境設定を検証するための戦略と実装を提供します。

## 🎯 概要

設定検証は以下のために重要です：
- **早期エラー検出**: デプロイ前に設定の問題を検出
- **セキュリティ**: 本番環境が適切なセキュリティ設定を使用していることを確認
- **信頼性**: 設定不足や無効な設定による実行時エラーを防止
- **ドキュメント**: 必要な設定の生きたドキュメントとして機能

## 📋 検証戦略

### 1. 起動時検証

リクエストを受け付ける前に、アプリケーション起動時に設定を検証します。

### 2. 型検証

値が正しい型（文字列、数値、真偽値、URLなど）であることを確認します。

### 3. フォーマット検証

値が期待される形式（URL、時間期間など）に一致することを検証します。

### 4. 範囲検証

数値が許容範囲内であることを確認します。

### 5. 環境固有の検証

環境（開発、ステージング、本番）に基づいて異なるルールを適用します。

## 🛠️ 実装例

### Node.js/TypeScript with Zod

**インストール**:
```bash
npm install zod
```

**実装** (`src/config/env.validation.ts`):
```typescript
import { z } from 'zod';

/**
 * 検証ルール付き環境変数スキーマ
 */
const envSchema = z.object({
  // Node環境
  NODE_ENV: z.enum(['development', 'staging', 'production']),

  // CosmosDB設定
  COSMOSDB_ENDPOINT: z.string().url('COSMOSDB_ENDPOINTは有効なURLである必要があります'),
  COSMOSDB_KEY: z.string().min(1, 'COSMOSDB_KEYは必須です'),
  COSMOSDB_DATABASE: z.string().min(1, 'COSMOSDB_DATABASEは必須です'),
  COSMOSDB_MAX_RETRY_ATTEMPTS: z.coerce.number().min(1).max(10).default(3),
  COSMOSDB_RETRY_INTERVAL_MS: z.coerce.number().min(100).max(10000).default(1000),

  // JWT設定
  JWT_SECRET: z.string()
    .min(32, 'JWT_SECRETはセキュリティのため最低32文字必要です')
    .refine(
      (val) => process.env.NODE_ENV !== 'production' || val !== 'dev-secret-key-not-for-production-use-only',
      'JWT_SECRETは本番環境で開発用デフォルトを使用できません'
    ),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, 'JWT_EXPIRES_INは有効な期間（例: 1h, 24h, 7d）である必要があります'),
  JWT_REFRESH_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, 'JWT_REFRESH_EXPIRES_INは有効な期間である必要があります'),

  // サービスポート
  FRONTEND_PORT: z.coerce.number().min(1).max(65535).optional(),
  AUTH_SERVICE_PORT: z.coerce.number().min(1).max(65535).optional(),
  USER_MANAGEMENT_SERVICE_PORT: z.coerce.number().min(1).max(65535).optional(),
  SERVICE_SETTINGS_SERVICE_PORT: z.coerce.number().min(1).max(65535).optional(),

  // サービスURL
  FRONTEND_URL: z.string().url().optional(),
  AUTH_SERVICE_URL: z.string().url().optional(),
  USER_MANAGEMENT_SERVICE_URL: z.string().url().optional(),
  SERVICE_SETTINGS_SERVICE_URL: z.string().url().optional(),

  // 機能フラグ
  FEATURE_USER_CREATE: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_USER_EDIT: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_USER_DELETE: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_USER_ROLE_ASSIGN: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_SERVICE_CREATE: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_SERVICE_EDIT: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_SERVICE_DELETE: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_PASSWORD_RESET: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_EMAIL_VERIFICATION: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_TWO_FACTOR_AUTH: z.enum(['enabled', 'disabled']).default('disabled'),
  FEATURE_ANALYTICS: z.enum(['enabled', 'disabled']).default('disabled'),
  FEATURE_AUDIT_LOGGING: z.enum(['enabled', 'disabled']).default('enabled'),
  FEATURE_RATE_LIMITING: z.enum(['enabled', 'disabled']).default('disabled'),

  // ログ
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'text']).default('json'),
  LOG_FILE_PATH: z.string().optional(),

  // CORS
  CORS_ORIGINS: z.string().transform((val) => val.split(',').map(s => s.trim())),

  // レート制限
  RATE_LIMIT_WINDOW_MS: z.coerce.number().min(1000).default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().min(1).default(100),

  // テナント
  DEFAULT_TENANT_ID: z.string().min(1).default('default-tenant'),

  // セキュリティ
  PASSWORD_MIN_LENGTH: z.coerce.number().min(6).max(128).default(8),
  PASSWORD_REQUIRE_UPPERCASE: z.coerce.boolean().default(true),
  PASSWORD_REQUIRE_LOWERCASE: z.coerce.boolean().default(true),
  PASSWORD_REQUIRE_NUMBERS: z.coerce.boolean().default(true),
  PASSWORD_REQUIRE_SPECIAL_CHARS: z.coerce.boolean().default(true),
  SESSION_TIMEOUT_MINUTES: z.coerce.number().min(1).max(1440).default(30),
  MAX_LOGIN_ATTEMPTS: z.coerce.number().min(1).max(100).default(5),
  LOCKOUT_DURATION_MINUTES: z.coerce.number().min(1).max(1440).default(15),

  // 開発ツール
  ENABLE_API_DOCS: z.coerce.boolean().default(true),
  ENABLE_DETAILED_ERRORS: z.coerce.boolean().default(true),
  ENABLE_REQUEST_LOGGING: z.coerce.boolean().default(true),

  // Azure（オプション）
  APPINSIGHTS_INSTRUMENTATIONKEY: z.string().optional(),
  AZURE_STORAGE_CONNECTION_STRING: z.string().optional(),
});

/**
 * 検証済み環境設定の型
 */
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * 環境変数を検証してパース
 * @throws {z.ZodError} 検証に失敗した場合
 */
export function validateEnv(): EnvConfig {
  try {
    const config = envSchema.parse(process.env);
    
    // 追加のカスタム検証
    validateProductionSettings(config);
    validateServiceUrls(config);
    
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ 環境変数の検証に失敗しました:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('❌ 環境検証中に予期しないエラーが発生しました:', error);
    }
    throw error;
  }
}

/**
 * 本番環境の追加検証
 */
function validateProductionSettings(config: EnvConfig): void {
  if (config.NODE_ENV === 'production') {
    // 本番環境で機密ツールが無効であることを確認
    if (config.ENABLE_DETAILED_ERRORS) {
      console.warn('⚠️  警告: ENABLE_DETAILED_ERRORSは本番環境ではfalseにすべきです');
    }
    
    if (config.ENABLE_API_DOCS) {
      console.warn('⚠️  警告: 本番環境でのENABLE_API_DOCSの無効化を検討してください');
    }
    
    // セキュリティ設定が厳格であることを確認
    if (config.PASSWORD_MIN_LENGTH < 8) {
      throw new Error('本番環境ではPASSWORD_MIN_LENGTHは最低8である必要があります');
    }
    
    // 適切なログレベルを確認
    if (config.LOG_LEVEL === 'debug') {
      console.warn('⚠️  警告: LOG_LEVEL=debugは本番環境でパフォーマンスに影響する可能性があります');
    }
  }
}

/**
 * サービスURLがアクセス可能であることを検証（必要に応じて）
 */
function validateServiceUrls(config: EnvConfig): void {
  // 本番環境ではURLがHTTPSを使用していることを確認
  if (config.NODE_ENV === 'production') {
    const urls = [
      config.FRONTEND_URL,
      config.AUTH_SERVICE_URL,
      config.USER_MANAGEMENT_SERVICE_URL,
      config.SERVICE_SETTINGS_SERVICE_URL,
    ];
    
    urls.forEach((url) => {
      if (url && !url.startsWith('https://')) {
        throw new Error(`本番URLはHTTPSを使用する必要があります: ${url}`);
      }
    });
  }
}

/**
 * 検証済み設定を取得
 * 検証が一度だけ実行されることを保証するメモ化
 */
let cachedConfig: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = validateEnv();
    console.log('✅ 環境設定の検証に成功しました');
  }
  return cachedConfig;
}
```

**アプリケーションでの使用**:
```typescript
// src/index.ts または src/app.ts
import 'dotenv/config'; // .envファイルを読み込み
import { getConfig } from './config/env.validation';

// 起動時に設定を検証
const config = getConfig();

// 検証済み設定を使用
console.log(`${config.NODE_ENV}環境を起動中`);
console.log(`CosmosDB: ${config.COSMOSDB_ENDPOINT}`);
console.log(`ログレベル: ${config.LOG_LEVEL}`);

// アプリケーションを起動
startServer(config);
```

### 代替案: カスタム検証

Zodを使用しないプロジェクトの場合、カスタム検証を実装：

```typescript
// src/config/env.validation.ts

interface RequiredEnvVar {
  name: string;
  validate?: (value: string) => boolean;
  errorMessage?: string;
}

const requiredEnvVars: RequiredEnvVar[] = [
  { name: 'NODE_ENV' },
  { 
    name: 'COSMOSDB_ENDPOINT',
    validate: (v) => v.startsWith('https://'),
    errorMessage: 'COSMOSDB_ENDPOINTはhttps://で始まる必要があります'
  },
  { name: 'COSMOSDB_KEY' },
  { name: 'COSMOSDB_DATABASE' },
  { 
    name: 'JWT_SECRET',
    validate: (v) => v.length >= 32,
    errorMessage: 'JWT_SECRETは最低32文字必要です'
  },
  { name: 'JWT_EXPIRES_IN' },
];

export function validateEnvironment(): void {
  const errors: string[] = [];

  // 必須変数を確認
  requiredEnvVars.forEach(({ name, validate, errorMessage }) => {
    const value = process.env[name];
    
    if (!value) {
      errors.push(`${name}は必須ですが設定されていません`);
      return;
    }
    
    if (validate && !validate(value)) {
      errors.push(errorMessage || `${name}の値が無効です`);
    }
  });

  // 本番環境固有の要件を確認
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET?.includes('dev-secret')) {
      errors.push('JWT_SECRETは本番環境で開発用デフォルトを使用できません');
    }
    
    if (process.env.ENABLE_DETAILED_ERRORS === 'true') {
      errors.push('ENABLE_DETAILED_ERRORSは本番環境ではfalseにすべきです');
    }
  }

  // エラーを報告
  if (errors.length > 0) {
    console.error('❌ 環境検証に失敗しました:');
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('環境検証に失敗しました');
  }

  console.log('✅ 環境検証に成功しました');
}
```

## 🧪 設定のテスト

### ユニットテスト

```typescript
// tests/config/env.validation.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateEnv } from '../../src/config/env.validation';

describe('環境検証', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // 環境をリセット
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('有効な開発設定でパスすべき', () => {
    process.env.NODE_ENV = 'development';
    process.env.COSMOSDB_ENDPOINT = 'https://localhost:8081';
    process.env.COSMOSDB_KEY = 'test-key';
    process.env.COSMOSDB_DATABASE = 'test-db';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.JWT_EXPIRES_IN = '24h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.CORS_ORIGINS = 'http://localhost:3000';

    expect(() => validateEnv()).not.toThrow();
  });

  it('必須変数が欠けている場合は失敗すべき', () => {
    process.env.NODE_ENV = 'development';
    // COSMOSDB_ENDPOINTが欠けている

    expect(() => validateEnv()).toThrow();
  });

  it('短いJWT秘密鍵で失敗すべき', () => {
    process.env.NODE_ENV = 'development';
    process.env.COSMOSDB_ENDPOINT = 'https://localhost:8081';
    process.env.COSMOSDB_KEY = 'test-key';
    process.env.COSMOSDB_DATABASE = 'test-db';
    process.env.JWT_SECRET = 'too-short'; // 32文字未満
    process.env.JWT_EXPIRES_IN = '24h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.CORS_ORIGINS = 'http://localhost:3000';

    expect(() => validateEnv()).toThrow(/最低32文字/);
  });

  it('本番環境で開発用JWT秘密鍵を使用した場合は失敗すべき', () => {
    process.env.NODE_ENV = 'production';
    process.env.COSMOSDB_ENDPOINT = 'https://prod.documents.azure.com:443/';
    process.env.COSMOSDB_KEY = 'test-key';
    process.env.COSMOSDB_DATABASE = 'test-db';
    process.env.JWT_SECRET = 'dev-secret-key-not-for-production-use-only';
    process.env.JWT_EXPIRES_IN = '24h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.CORS_ORIGINS = 'https://app.example.com';

    expect(() => validateEnv()).toThrow(/開発用デフォルト/);
  });

  it('本番環境ではHTTPS URLを要求すべき', () => {
    process.env.NODE_ENV = 'production';
    process.env.COSMOSDB_ENDPOINT = 'https://prod.documents.azure.com:443/';
    process.env.COSMOSDB_KEY = 'test-key';
    process.env.COSMOSDB_DATABASE = 'test-db';
    process.env.JWT_SECRET = 'a'.repeat(64);
    process.env.JWT_EXPIRES_IN = '24h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.CORS_ORIGINS = 'https://app.example.com';
    process.env.FRONTEND_URL = 'http://insecure.com'; // 本番環境でHTTP

    expect(() => validateEnv()).toThrow(/HTTPS/);
  });

  it('機能フラグ値を検証すべき', () => {
    process.env.NODE_ENV = 'development';
    process.env.COSMOSDB_ENDPOINT = 'https://localhost:8081';
    process.env.COSMOSDB_KEY = 'test-key';
    process.env.COSMOSDB_DATABASE = 'test-db';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.JWT_EXPIRES_IN = '24h';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.CORS_ORIGINS = 'http://localhost:3000';
    process.env.FEATURE_USER_CREATE = 'invalid'; // 無効な値

    expect(() => validateEnv()).toThrow();
  });
});
```

### 統合テスト

```typescript
// tests/integration/config.integration.test.ts
import { describe, it, expect } from 'vitest';
import { getConfig } from '../../src/config/env.validation';

describe('設定統合', () => {
  it('実際の環境を読み込んで検証すべき', () => {
    const config = getConfig();
    
    expect(config.NODE_ENV).toBeDefined();
    expect(config.COSMOSDB_ENDPOINT).toBeDefined();
    expect(config.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it('一貫性のあるサービスURLを持つべき', () => {
    const config = getConfig();
    
    if (config.AUTH_SERVICE_URL) {
      expect(config.AUTH_SERVICE_URL).toMatch(/^https?:\/\//);
    }
  });
});
```

## 🚀 CI/CD統合

### GitHub Actionsの例

```yaml
# .github/workflows/validate-config.yml
name: 設定を検証

on:
  pull_request:
    paths:
      - '.env.*'
      - 'src/config/**'
      - 'docs/ENVIRONMENT_CONFIGURATION.md'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Node.jsをセットアップ
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: 依存関係をインストール
        run: npm ci
      
      - name: .env.templateが最新であることを確認
        run: |
          # コード内のすべての変数がテンプレートで文書化されていることを確認
          npm run check:env-template
      
      - name: 環境サンプルを検証
        run: |
          # サンプルファイルが有効であることをテスト
          cp .env.development .env
          npm run validate:env
          
          cp .env.staging .env
          npm run validate:env
      
      - name: 設定テストを実行
        run: npm test -- config
```

### プレコミットフック

```bash
#!/bin/bash
# .git/hooks/pre-commit

# .envファイルのコミットを防止
if git diff --cached --name-only | grep -q "^\.env$"; then
  echo "エラー: .envファイルをコミットしようとしています"
  echo ".envをステージングから削除してください"
  exit 1
fi

# .env.templateが完全であることを検証
npm run check:env-template
if [ $? -ne 0 ]; then
  echo "エラー: .env.templateの検証に失敗しました"
  exit 1
fi

exit 0
```

## 📊 検証チェックリスト

新しい環境変数を追加する際にこのチェックリストを使用：

- [ ] `.env.template`に説明付きで変数を追加
- [ ] 環境固有ファイル（`.env.development`、`.env.staging`、`.env.production`）に変数を追加
- [ ] `env.validation.ts`に検証ルールを追加
- [ ] `docs/ENVIRONMENT_CONFIGURATION.md`を更新
- [ ] 新しい変数のテストケースを追加
- [ ] 無効な値でテストして検証が機能することを確認
- [ ] 環境固有の要件をドキュメント化
- [ ] 必要に応じてCI/CDパイプラインを更新

## 🔍 ベストプラクティス

1. **早期検証**: 設定が無効な場合、起動時に素早く失敗
2. **明確なエラーメッセージ**: アクション可能なエラーメッセージを提供
3. **型安全性**: 設定にTypeScript型を使用
4. **デフォルト値**: 適切な場所で賢明なデフォルトを提供
5. **環境固有のルール**: 本番環境ではより厳格な検証を適用
6. **ドキュメント**: 検証ルールとドキュメントを同期させる
7. **テスト**: 検証ロジックの包括的なテストを記述
8. **ログ**: 検証成功と警告を明確にログ記録

## 📚 追加リソース

- [Zodドキュメント](https://zod.dev/)
- [Twelve-Factor App: Config](https://12factor.net/config)
- [Azure App Service設定](https://docs.microsoft.com/azure/app-service/configure-common)

---

**最終更新**: 2026-01-09
