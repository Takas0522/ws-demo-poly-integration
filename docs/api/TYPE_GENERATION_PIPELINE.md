# OpenAPI Type Generation Pipeline

このガイドでは、OpenAPI仕様から自動的にTypeScript型を生成するパイプラインの設定と使用方法を説明します。

## 📋 目次

- [概要](#概要)
- [セットアップ](#セットアップ)
- [型生成の実行](#型生成の実行)
- [生成された型の使用](#生成された型の使用)
- [CI/CD統合](#cicd統合)
- [トラブルシューティング](#トラブルシューティング)

## 🎯 概要

OpenAPIからの型生成により、以下の利点があります：

- ✅ API仕様とコードの同期
- ✅ 型安全性の向上
- ✅ 手動での型定義メンテナンスの削減
- ✅ APIクライアントの自動生成
- ✅ ドキュメントとコードの一貫性

## 📦 セットアップ

### 必要なパッケージ

`@types` パッケージに既に追加済み：

```json
{
  "devDependencies": {
    "openapi-typescript": "^6.7.3",
    "typescript": "^5.3.3"
  }
}
```

### ディレクトリ構造

```
packages/@types/
├── src/
│   ├── user.types.ts           # 手動定義の型
│   ├── tenant.types.ts         # 手動定義の型
│   ├── permission.types.ts     # 手動定義の型
│   ├── jwt.types.ts            # 手動定義の型
│   ├── api.types.ts            # 手動定義の型
│   ├── auth.types.ts           # 手動定義の型
│   ├── generated/              # 自動生成される型（新規）
│   │   ├── auth.types.ts
│   │   ├── users.types.ts
│   │   └── settings.types.ts
│   └── index.ts                # すべての型をエクスポート
├── package.json
└── tsconfig.json
```

### .gitignore の更新

生成ファイルをバージョン管理から除外（オプション）：

```gitignore
# packages/@types/.gitignore
src/generated/
```

**注意:** 生成された型をコミットするかどうかは、プロジェクトの方針によります：

- **コミットする場合:** ビルド時に型が利用可能、依存関係が少ない
- **コミットしない場合:** 常に最新の仕様から生成、差分が小さい

## 🚀 型生成の実行

### 手動実行

```bash
# @typesディレクトリで実行
cd packages/@types

# すべてのサービスの型を生成
npm run generate:all

# または個別に生成
npm run generate:auth
npm run generate:users
npm run generate:settings
```

### 生成スクリプトの詳細

`package.json`に定義されたスクリプト：

```json
{
  "scripts": {
    "generate:auth": "openapi-typescript ../../docs/api/auth-service/openapi.yaml -o src/generated/auth.types.ts",
    "generate:users": "openapi-typescript ../../docs/api/user-management-service/openapi.yaml -o src/generated/users.types.ts",
    "generate:settings": "openapi-typescript ../../docs/api/service-setting-service/openapi.yaml -o src/generated/settings.types.ts",
    "generate:all": "npm run generate:auth && npm run generate:users && npm run generate:settings",
    "generate": "npm run generate:all"
  }
}
```

### ビルドワークフロー

推奨されるビルドフロー：

```bash
# 1. OpenAPI仕様を更新
# 2. 型を生成
npm run generate

# 3. 型チェック
npm run type-check

# 4. ビルド
npm run build

# 5. すべてを一度に実行
npm run generate && npm run type-check && npm run build
```

## 📝 生成された型の使用

### 基本的な使用

```typescript
// src/index.ts に自動生成型をエクスポート
export * as AuthAPI from './generated/auth.types';
export * as UsersAPI from './generated/users.types';
export * as SettingsAPI from './generated/settings.types';
```

### サービスでの使用例

#### 認証サービス

```typescript
// auth-service/src/controllers/auth.controller.ts
import { AuthAPI } from '@saas-app/types';

// pathsからエンドポイント型を取得
type LoginRequestBody = AuthAPI.paths['/auth/login']['post']['requestBody']['content']['application/json'];
type LoginResponse = AuthAPI.paths['/auth/login']['post']['responses']['200']['content']['application/json'];

export async function login(req: Request, res: Response) {
  const loginData: LoginRequestBody = req.body;
  
  // ビジネスロジック...
  
  const response: LoginResponse = {
    success: true,
    data: {
      tokens: { /* ... */ },
      user: { /* ... */ }
    }
  };
  
  res.json(response);
}
```

#### ユーザー管理サービス

```typescript
// user-management-service/src/controllers/users.controller.ts
import { UsersAPI } from '@saas-app/types';

// componentsからスキーマ型を取得
type User = UsersAPI.components['schemas']['User'];
type CreateUserRequest = UsersAPI.components['schemas']['CreateUserRequest'];
type UserResponse = UsersAPI.components['schemas']['UserResponse'];

export async function createUser(req: Request, res: Response) {
  const userData: CreateUserRequest = req.body;
  
  // ユーザー作成ロジック...
  const newUser: User = await userService.create(userData);
  
  const response: UserResponse = {
    success: true,
    data: newUser
  };
  
  res.json(response);
}
```

#### フロントエンド

```typescript
// frontend/src/api/auth.api.ts
import { AuthAPI } from '@saas-app/types';

type LoginRequest = AuthAPI.paths['/auth/login']['post']['requestBody']['content']['application/json'];
type LoginResponse = AuthAPI.paths['/auth/login']['post']['responses']['200']['content']['application/json'];

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  return response.json();
}
```

### 型ヘルパーの作成

便利な型ヘルパーを作成：

```typescript
// packages/@types/src/helpers/api-types.helper.ts

/**
 * OpenAPI pathsから型を抽出するヘルパー
 */
export type APIEndpoint<
  T extends Record<string, any>,
  Path extends keyof T,
  Method extends keyof T[Path]
> = T[Path][Method];

/**
 * リクエストボディの型を抽出
 */
export type RequestBody<T> = T extends { requestBody: { content: { 'application/json': infer R } } }
  ? R
  : never;

/**
 * レスポンスの型を抽出
 */
export type ResponseData<T> = T extends { responses: { '200': { content: { 'application/json': infer R } } } }
  ? R
  : T extends { responses: { '201': { content: { 'application/json': infer R } } } }
  ? R
  : never;

// 使用例
import { AuthAPI } from '@saas-app/types';
import type { APIEndpoint, RequestBody, ResponseData } from '@saas-app/types/helpers/api-types.helper';

type LoginEndpoint = APIEndpoint<AuthAPI.paths, '/auth/login', 'post'>;
type LoginRequest = RequestBody<LoginEndpoint>;
type LoginResponse = ResponseData<LoginEndpoint>;
```

### 手動型と生成型の組み合わせ

```typescript
// src/index.ts
// 手動定義の型（コア概念）
export * from './user.types';
export * from './tenant.types';
export * from './permission.types';
export * from './jwt.types';
export * from './api.types';
export * from './auth.types';

// 自動生成の型（サービス固有）
export * as AuthAPI from './generated/auth.types';
export * as UsersAPI from './generated/users.types';
export * as SettingsAPI from './generated/settings.types';

// ヘルパー
export * from './helpers/api-types.helper';
```

## 🔄 CI/CD統合

### GitHub Actions

```yaml
# .github/workflows/type-generation.yml
name: Generate Types from OpenAPI

on:
  push:
    paths:
      - 'docs/api/**/*.yaml'
      - 'packages/@types/**'
  pull_request:
    paths:
      - 'docs/api/**/*.yaml'
      - 'packages/@types/**'

jobs:
  generate-types:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'packages/@types/package-lock.json'
      
      - name: Install dependencies
        run: |
          cd packages/@types
          npm ci
      
      - name: Generate types from OpenAPI
        run: |
          cd packages/@types
          npm run generate:all
      
      - name: Type check
        run: |
          cd packages/@types
          npm run type-check
      
      - name: Build
        run: |
          cd packages/@types
          npm run build
      
      - name: Check for changes
        id: check-changes
        run: |
          git diff --exit-code packages/@types/src/generated/ || echo "changes=true" >> $GITHUB_OUTPUT
      
      - name: Commit generated types
        if: steps.check-changes.outputs.changes == 'true'
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add packages/@types/src/generated/
          git commit -m "chore: regenerate types from OpenAPI specs"
          git push
```

### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# OpenAPI仕様が変更された場合、型を再生成
if git diff --cached --name-only | grep -q "docs/api/.*\.yaml"; then
  echo "OpenAPI spec changed, regenerating types..."
  cd packages/@types
  npm run generate:all
  npm run type-check
  git add src/generated/
fi
```

### NPM Scripts の自動化

```json
{
  "scripts": {
    "prebuild": "npm run generate && npm run type-check",
    "build": "tsc",
    "pretest": "npm run generate",
    "test": "jest",
    "prepare": "npm run generate"
  }
}
```

## 🔍 トラブルシューティング

### 問題1: 型生成が失敗する

**症状:**
```
Error: Could not resolve reference: #/components/schemas/User
```

**原因:** OpenAPI仕様内の参照が正しくない

**解決策:**
```bash
# OpenAPI仕様を検証
npx @apidevtools/swagger-cli validate docs/api/auth-service/openapi.yaml
```

### 問題2: 生成された型が不完全

**症状:** 一部の型が `unknown` になる

**原因:** OpenAPI仕様が不完全または曖昧

**解決策:**
```yaml
# 明示的な型定義を追加
components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
      properties:
        id:
          type: string
          description: User ID
        email:
          type: string
          format: email
```

### 問題3: 型の衝突

**症状:**
```
Duplicate identifier 'User'
```

**原因:** 手動型と生成型で同じ名前が使用されている

**解決策:**

オプション1: 名前空間を使用
```typescript
export * as AuthAPI from './generated/auth.types';
export * as UsersAPI from './generated/users.types';
```

オプション2: 生成型に接頭辞を追加
```bash
openapi-typescript openapi.yaml -o generated.types.ts --export-type --path-params-as-types
```

### 問題4: ビルドパフォーマンス

**症状:** 型生成に時間がかかる

**解決策:**

1. 必要なサービスのみ生成
```bash
npm run generate:auth  # 必要なもののみ
```

2. キャッシュを活用
```json
{
  "scripts": {
    "generate:auth": "openapi-typescript ../../docs/api/auth-service/openapi.yaml -o src/generated/auth.types.ts --cached"
  }
}
```

3. 並列実行
```json
{
  "scripts": {
    "generate:all": "npm-run-all -p generate:auth generate:users generate:settings"
  }
}
```

## 📊 ベストプラクティス

### 1. OpenAPI仕様を信頼できる情報源に

```
OpenAPI Spec (YAML) → Generated Types → Application Code
```

### 2. 型の一貫性を保つ

```typescript
// ✅ 良い例：生成型を使用
import { UsersAPI } from '@saas-app/types';
type User = UsersAPI.components['schemas']['User'];

// ❌ 悪い例：手動で型を複製
type User = {
  id: string;
  email: string;
  // ...
};
```

### 3. バージョン管理

```
docs/api/
├── auth-service/
│   ├── v1/
│   │   └── openapi.yaml
│   └── v2/
│       └── openapi.yaml
```

```json
{
  "scripts": {
    "generate:auth:v1": "openapi-typescript ../../docs/api/auth-service/v1/openapi.yaml -o src/generated/auth.v1.types.ts",
    "generate:auth:v2": "openapi-typescript ../../docs/api/auth-service/v2/openapi.yaml -o src/generated/auth.v2.types.ts"
  }
}
```

### 4. ドキュメント化

生成された型の使用方法をREADMEに記載：

```markdown
## Generated Types

Types are automatically generated from OpenAPI specifications.

### Usage

\`\`\`typescript
import { AuthAPI } from '@saas-app/types';

type LoginRequest = AuthAPI.paths['/auth/login']['post']['requestBody']['content']['application/json'];
\`\`\`

### Regenerating Types

\`\`\`bash
npm run generate
\`\`\`
```

## 📚 関連ドキュメント

- [OpenAPI Integration](../../packages/@types/OPENAPI_INTEGRATION.md)
- [API Versioning Strategy](./API_VERSIONING_STRATEGY.md)
- [Swagger UI Integration](./SWAGGER_UI_INTEGRATION.md)

---

**最終更新**: 2026-01-11
