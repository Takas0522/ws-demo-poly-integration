# Swagger UI Integration Guide

このガイドでは、各サービスにSwagger UIを統合してインタラクティブなAPIドキュメントを提供する方法を説明します。

## 📋 目次

- [概要](#概要)
- [必要なパッケージ](#必要なパッケージ)
- [実装ステップ](#実装ステップ)
- [カスタマイゼーション](#カスタマイゼーション)
- [セキュリティ設定](#セキュリティ設定)
- [トラブルシューティング](#トラブルシューティング)

## 🎯 概要

Swagger UIは、OpenAPI仕様からインタラクティブなAPIドキュメントを自動生成します。開発者はブラウザから直接APIをテストできます。

### 主な機能

- 📖 インタラクティブなAPIドキュメント
- 🧪 ブラウザからの直接的なAPIテスト
- 🔐 JWT認証のサポート
- 📱 レスポンシブデザイン
- 🎨 カスタマイズ可能なUI

## 📦 必要なパッケージ

各サービスに以下のパッケージをインストールします：

```bash
npm install swagger-ui-express
npm install --save-dev @types/swagger-ui-express
```

OpenAPI仕様をYAMLで記述する場合：

```bash
npm install yaml
```

## 🚀 実装ステップ

### ステップ1: OpenAPI仕様の配置

サービスルートにOpenAPI仕様ファイルを配置：

```
src/
├── auth-service/
│   ├── openapi/
│   │   └── openapi.yaml
│   ├── src/
│   │   └── index.ts
│   └── package.json
```

または、統合リポジトリから参照：

```typescript
// OpenAPI仕様ファイルのパス
const openapiPath = path.join(__dirname, '../../docs/api/auth-service/openapi.yaml');
```

### ステップ2: Express.jsへの統合

#### 基本的な実装

```typescript
// src/index.ts or src/app.ts
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import fs from 'fs';
import path from 'path';

const app = express();

// OpenAPI仕様の読み込み
const openapiPath = path.join(__dirname, '../openapi/openapi.yaml');
const openapiFile = fs.readFileSync(openapiPath, 'utf8');
const openapiDocument = YAML.parse(openapiFile);

// Swagger UIのセットアップ
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Auth Service API Documentation',
}));

// OpenAPI仕様のJSON提供（オプション）
app.get('/api-docs.json', (req, res) => {
  res.json(openapiDocument);
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
  console.log('API Documentation: http://localhost:3001/api-docs');
});
```

#### TypeScript対応の実装

```typescript
// src/swagger.ts
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import fs from 'fs';
import path from 'path';
import { Express } from 'express';

export interface SwaggerConfig {
  openapiPath: string;
  routePath?: string;
  customOptions?: swaggerUi.SwaggerUiOptions;
}

export function setupSwagger(app: Express, config: SwaggerConfig): void {
  const {
    openapiPath,
    routePath = '/api-docs',
    customOptions = {}
  } = config;

  try {
    // OpenAPI仕様の読み込み
    const openapiFile = fs.readFileSync(openapiPath, 'utf8');
    const openapiDocument = YAML.parse(openapiFile);

    // デフォルトのカスタムオプション
    const defaultOptions: swaggerUi.SwaggerUiOptions = {
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .scheme-container { background: #f7f7f7; padding: 20px; }
      `,
      customSiteTitle: openapiDocument.info.title,
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        syntaxHighlight: {
          activate: true,
          theme: 'monokai'
        }
      }
    };

    // オプションのマージ
    const mergedOptions = { ...defaultOptions, ...customOptions };

    // Swagger UIのセットアップ
    app.use(routePath, swaggerUi.serve, swaggerUi.setup(openapiDocument, mergedOptions));

    // OpenAPI仕様のJSON提供
    app.get(`${routePath}.json`, (req, res) => {
      res.json(openapiDocument);
    });

    console.log(`📚 API Documentation available at: ${routePath}`);
    console.log(`📄 OpenAPI spec available at: ${routePath}.json`);
  } catch (error) {
    console.error('Failed to setup Swagger UI:', error);
    throw error;
  }
}
```

#### 使用例

```typescript
// src/index.ts
import express from 'express';
import path from 'path';
import { setupSwagger } from './swagger';

const app = express();

// APIルートの設定
app.use('/api', apiRouter);

// Swagger UIのセットアップ
setupSwagger(app, {
  openapiPath: path.join(__dirname, '../openapi/openapi.yaml'),
  routePath: '/api-docs',
  customOptions: {
    customSiteTitle: 'Auth Service API',
  }
});

// サーバー起動
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
});
```

### ステップ3: JWT認証の設定

OpenAPI仕様にセキュリティスキームを定義：

```yaml
# openapi.yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token obtained from login endpoint

security:
  - bearerAuth: []
```

Swagger UIでの使用：

1. `/api-docs` にアクセス
2. 右上の「Authorize」ボタンをクリック
3. JWTトークンを入力（`Bearer` プレフィックスなし）
4. 「Authorize」をクリック

これで、すべてのリクエストに自動的にAuthorizationヘッダーが追加されます。

### ステップ4: 環境別の設定

```typescript
// src/config/swagger.config.ts
export const swaggerConfig = {
  development: {
    enabled: true,
    routePath: '/api-docs',
  },
  staging: {
    enabled: true,
    routePath: '/api-docs',
    // 基本認証で保護
    auth: {
      username: process.env.SWAGGER_USERNAME,
      password: process.env.SWAGGER_PASSWORD,
    }
  },
  production: {
    enabled: false, // 本番環境では無効化を推奨
    routePath: '/api-docs',
    auth: {
      username: process.env.SWAGGER_USERNAME,
      password: process.env.SWAGGER_PASSWORD,
    }
  }
};

// src/swagger.ts
import { swaggerConfig } from './config/swagger.config';

export function setupSwagger(app: Express): void {
  const env = process.env.NODE_ENV || 'development';
  const config = swaggerConfig[env];

  if (!config.enabled) {
    console.log('Swagger UI is disabled in this environment');
    return;
  }

  // 基本認証の設定
  if (config.auth) {
    app.use(config.routePath, basicAuth({
      users: { [config.auth.username]: config.auth.password },
      challenge: true,
    }));
  }

  // Swagger UIのセットアップ
  // ...
}
```

## 🎨 カスタマイゼーション

### カスタムCSS

```typescript
const customCss = `
  .swagger-ui .topbar { display: none }
  .swagger-ui .info .title { color: #667eea; }
  .swagger-ui .info .description { font-size: 16px; }
  .swagger-ui .scheme-container {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    border-radius: 8px;
  }
  .swagger-ui .btn.authorize { 
    background-color: #667eea;
    border-color: #667eea;
  }
  .swagger-ui .btn.authorize:hover {
    background-color: #764ba2;
    border-color: #764ba2;
  }
`;

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument, {
  customCss,
}));
```

### カスタムロゴ

```typescript
const customOptions = {
  customCss: customCss,
  customSiteTitle: 'My API Documentation',
  customfavIcon: '/assets/favicon.ico',
  swaggerOptions: {
    // ロゴURLを設定
    url: '/api-docs.json',
  }
};
```

### 複数のOpenAPI仕様

```typescript
// 複数のバージョンをサポート
app.use('/api-docs/v1', swaggerUi.serve, swaggerUi.setup(openapiDocumentV1));
app.use('/api-docs/v2', swaggerUi.serve, swaggerUi.setup(openapiDocumentV2));
```

## 🔐 セキュリティ設定

### 本番環境での保護

```typescript
import basicAuth from 'express-basic-auth';

// 基本認証でSwagger UIを保護
app.use('/api-docs', basicAuth({
  users: { 
    [process.env.SWAGGER_USERNAME!]: process.env.SWAGGER_PASSWORD! 
  },
  challenge: true,
  realm: 'API Documentation'
}));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
```

### IP制限

```typescript
import ipfilter from 'express-ipfilter';

// 特定のIPからのみアクセス可能
const allowedIPs = process.env.ALLOWED_IPS?.split(',') || [];

if (allowedIPs.length > 0) {
  app.use('/api-docs', ipfilter(allowedIPs, { mode: 'allow' }));
}
```

### 環境変数での制御

```typescript
// .env.production
SWAGGER_ENABLED=false
SWAGGER_USERNAME=admin
SWAGGER_PASSWORD=secure-password-here
ALLOWED_IPS=192.168.1.0/24,10.0.0.0/8

// アプリケーション
if (process.env.SWAGGER_ENABLED !== 'true') {
  console.log('Swagger UI is disabled');
} else {
  setupSwagger(app);
}
```

## 🔍 トラブルシューティング

### 問題1: OpenAPI仕様が読み込めない

**症状:** 
```
Error: Cannot read OpenAPI specification file
```

**解決策:**
```typescript
// パスを確認
const openapiPath = path.resolve(__dirname, '../openapi/openapi.yaml');
console.log('OpenAPI path:', openapiPath);
console.log('File exists:', fs.existsSync(openapiPath));
```

### 問題2: CORSエラー

**症状:**
```
Access to fetch at 'http://localhost:3001/api/users' from origin 'http://localhost:3001' 
has been blocked by CORS policy
```

**解決策:**
```typescript
import cors from 'cors';

// Swagger UI用のCORS設定
app.use('/api-docs', cors());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
```

### 問題3: JWT認証が動作しない

**症状:** 認証後もリクエストが401エラーを返す

**解決策:**

1. OpenAPI仕様でセキュリティスキームが正しく定義されているか確認
2. トークンフォーマットを確認（`Bearer`プレフィックスは自動追加される）
3. トークンの有効期限を確認

```typescript
// デバッグ用ミドルウェア
app.use((req, res, next) => {
  console.log('Authorization header:', req.headers.authorization);
  next();
});
```

### 問題4: スタイルが適用されない

**症状:** カスタムCSSが表示されない

**解決策:**
```typescript
// CSS文字列を確認
console.log('Custom CSS:', customCss);

// または外部CSSファイルを使用
const customCssUrl = '/static/swagger-custom.css';
app.use('/static', express.static('public'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument, {
  customCssUrl,
}));
```

## 📚 参考リンク

- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Express.js Documentation](https://expressjs.com/)

## 📝 チェックリスト

セットアップ完了時の確認事項：

- [ ] swagger-ui-expressパッケージがインストールされている
- [ ] OpenAPI仕様ファイルが正しい場所に配置されている
- [ ] `/api-docs` エンドポイントが動作している
- [ ] JWT認証が正しく設定されている
- [ ] カスタムスタイルが適用されている
- [ ] 環境別の設定が適切に行われている
- [ ] 本番環境でのセキュリティ対策が実施されている
- [ ] エラーハンドリングが実装されている

---

**最終更新**: 2026-01-11
