# API Versioning Strategy

このドキュメントは、SaaS管理アプリケーションのAPIバージョニング戦略を定義します。

## 📋 目次

- [バージョニングアプローチ](#バージョニングアプローチ)
- [バージョニング方法](#バージョニング方法)
- [バージョンライフサイクル](#バージョンライフサイクル)
- [後方互換性](#後方互換性)
- [移行ガイドライン](#移行ガイドライン)
- [実装詳細](#実装詳細)

## 🎯 バージョニングアプローチ

### セマンティックバージョニング (Semantic Versioning)

すべてのAPIは **Semantic Versioning 2.0.0** に従います：

```
MAJOR.MINOR.PATCH
```

- **MAJOR** (1.x.x): 後方互換性のない変更
- **MINOR** (x.1.x): 後方互換性のある機能追加
- **PATCH** (x.x.1): 後方互換性のあるバグ修正

### 現在のバージョン

すべてのサービスは現在 **v1.0.0** です：

- Authentication Service: v1.0.0
- User Management Service: v1.0.0
- Service Settings Service: v1.0.0

## 📡 バージョニング方法

### URLパスバージョニング（推奨）

APIバージョンはURLパスに含めます：

```
/api/v1/users
/api/v2/users
```

**利点:**
- 明確で分かりやすい
- キャッシュフレンドリー
- ブラウザから簡単にテスト可能
- ドキュメント化が容易

**例:**

```bash
# v1 API
GET https://api.example.com/api/v1/users

# v2 API
GET https://api.example.com/api/v2/users
```

### ヘッダーバージョニング（代替案）

特定のケースでは、ヘッダーベースのバージョニングも使用可能：

```http
GET /api/users
Accept: application/vnd.saas-app.v1+json
```

## 🔄 バージョンライフサイクル

### フェーズ1: アクティブ開発

新機能の追加とアクティブな開発が行われるバージョン。

- すべての新機能がこのバージョンに追加される
- バグ修正とセキュリティパッチが提供される
- 完全なサポートとドキュメント

**現在:** v1.x.x

### フェーズ2: メンテナンス

重要な修正のみが提供されるバージョン。

- 新機能の追加なし
- 重大なバグ修正とセキュリティパッチのみ
- ドキュメントの更新は最小限

**期間:** 12ヶ月

### フェーズ3: 非推奨 (Deprecated)

使用が推奨されないバージョン。

- セキュリティパッチのみ提供
- 公式ドキュメントに非推奨の警告表示
- 移行ガイドの提供

**期間:** 6ヶ月

### フェーズ4: サポート終了 (End of Life)

サポートが終了したバージョン。

- すべてのサポート終了
- APIエンドポイントは削除される
- ドキュメントはアーカイブされる

## 🔐 後方互換性

### 互換性のある変更

以下の変更は後方互換性があります（MINORバージョン更新）：

✅ **許可される変更:**
- 新しいAPIエンドポイントの追加
- 新しいオプションパラメータの追加
- レスポンスへの新しいフィールドの追加
- 新しいエラーコードの追加（既存のコードを置き換えない）
- 新しいHTTPメソッドの追加
- より詳細なエラーメッセージ

**例:**

```typescript
// v1.0.0
interface User {
  id: string;
  email: string;
  name: string;
}

// v1.1.0 - 後方互換性あり
interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string; // 新しいオプションフィールド
}
```

### 互換性のない変更

以下の変更は後方互換性がありません（MAJORバージョン更新）：

❌ **禁止される変更:**
- 既存のエンドポイントの削除
- 既存のフィールドの削除
- 必須パラメータの追加
- フィールドの型変更
- エンドポイントのURLパス変更
- 既存のHTTPメソッドの削除
- レスポンス形式の変更

**例:**

```typescript
// v1.x.x
interface User {
  id: string;
  email: string;
  name: string;
}

// v2.0.0 - 後方互換性なし
interface User {
  id: string;
  email: string;
  displayName: string; // 'name'から'displayName'に変更
}
```

## 📝 移行ガイドライン

### クライアント向けガイドライン

#### 1. 段階的移行

新しいバージョンへは段階的に移行：

```javascript
// ステップ1: 新旧両方のバージョンをサポート
const API_VERSION = process.env.API_VERSION || 'v1';
const apiClient = new APIClient(`/api/${API_VERSION}`);

// ステップ2: 機能フラグで制御
if (featureFlags.useV2API) {
  apiClient.setVersion('v2');
}

// ステップ3: 完全移行後に古いコードを削除
```

#### 2. 非推奨機能の監視

非推奨の機能を使用している場合、レスポンスヘッダーで警告：

```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 01 Jan 2027 00:00:00 GMT
Link: </api/v2/users>; rel="successor-version"
```

#### 3. 移行期間の活用

```
v1.0.0 (2026-01) ─────┬───────────┬───────────┬──────> 削除
                      │           │           │
                   v2.0.0      非推奨     サポート終了
                 (2026-07)   (2027-01)    (2027-07)
                      │           │           │
                  12ヶ月      6ヶ月      18ヶ月合計
```

### サーバー側実装ガイドライン

#### 1. バージョン共存

複数のバージョンを同時にサポート：

```typescript
// Express.js example
import { Router } from 'express';

const v1Router = Router();
const v2Router = Router();

// v1 endpoints
v1Router.get('/users', getUsersV1);

// v2 endpoints
v2Router.get('/users', getUsersV2);

app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);
```

#### 2. 共通ロジックの抽出

バージョン間で共通のロジックは共有：

```typescript
// 共通サービスレイヤー
class UserService {
  async getUsers() {
    // 共通のビジネスロジック
  }
}

// v1コントローラー
async function getUsersV1(req, res) {
  const users = await userService.getUsers();
  res.json(transformToV1Format(users));
}

// v2コントローラー
async function getUsersV2(req, res) {
  const users = await userService.getUsers();
  res.json(transformToV2Format(users));
}
```

#### 3. OpenAPI仕様の管理

各バージョンごとに独立したOpenAPI仕様：

```
docs/api/
├── auth-service/
│   ├── v1/
│   │   └── openapi.yaml
│   └── v2/
│       └── openapi.yaml
├── user-management-service/
│   ├── v1/
│   │   └── openapi.yaml
│   └── v2/
│       └── openapi.yaml
└── service-setting-service/
    ├── v1/
    │   └── openapi.yaml
    └── v2/
        └── openapi.yaml
```

## 🚀 実装詳細

### バージョン検出

リクエストからAPIバージョンを抽出：

```typescript
// middleware/version-detector.ts
export function detectAPIVersion(req, res, next) {
  // URLパスから検出
  const pathMatch = req.path.match(/^\/api\/(v\d+)\//);
  if (pathMatch) {
    req.apiVersion = pathMatch[1];
  }
  
  // ヘッダーから検出（フォールバック）
  else if (req.headers['api-version']) {
    req.apiVersion = req.headers['api-version'];
  }
  
  // デフォルトバージョン
  else {
    req.apiVersion = 'v1';
  }
  
  next();
}
```

### 非推奨警告

非推奨のエンドポイントに警告を追加：

```typescript
// middleware/deprecation-warning.ts
export function deprecationWarning(sunsetDate: string) {
  return (req, res, next) => {
    res.set('Deprecation', 'true');
    res.set('Sunset', new Date(sunsetDate).toUTCString());
    res.set('Link', `</api/${nextVersion}${req.path}>; rel="successor-version"`);
    next();
  };
}

// 使用例
app.use('/api/v1/legacy-endpoint', 
  deprecationWarning('2027-01-01'),
  legacyEndpointHandler
);
```

### バージョン情報API

現在のバージョン情報を提供：

```typescript
// GET /api/version
app.get('/api/version', (req, res) => {
  res.json({
    current: 'v2',
    supported: ['v1', 'v2'],
    deprecated: [],
    sunset: {
      v1: '2027-07-01'
    }
  });
});
```

## 📊 バージョン管理のベストプラクティス

### 1. 明確なコミュニケーション

- 新バージョンリリースの事前通知（3ヶ月前）
- 非推奨の警告（6ヶ月前）
- サポート終了の通知（3ヶ月前）

### 2. 詳細な変更ログ

すべての変更を文書化：

```markdown
## v2.0.0 (2026-07-01)

### Breaking Changes
- `name` フィールドを `displayName` に変更
- `/users/search` エンドポイントを削除（`/users?search=` を使用）

### New Features
- ユーザーアバターのサポート追加
- 一括操作API追加

### Improvements
- パフォーマンス最適化
- エラーメッセージの改善
```

### 3. 自動化テスト

バージョン間の互換性テスト：

```typescript
describe('API Versioning', () => {
  it('should maintain backward compatibility in v1', async () => {
    const v1Response = await request(app).get('/api/v1/users');
    expect(v1Response.body).toHaveProperty('name');
  });
  
  it('should support new features in v2', async () => {
    const v2Response = await request(app).get('/api/v2/users');
    expect(v2Response.body).toHaveProperty('displayName');
    expect(v2Response.body).toHaveProperty('avatarUrl');
  });
});
```

## 📚 関連ドキュメント

- [OpenAPI仕様](./auth-service/openapi.yaml)
- [APIドキュメント](./README.md)
- [型生成ガイド](../../packages/@types/OPENAPI_INTEGRATION.md)

---

**最終更新**: 2026-01-11
