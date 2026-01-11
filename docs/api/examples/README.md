# Service Implementation Examples

このディレクトリには、各サービスでOpenAPI/Swagger UIを実装するための実例コードが含まれています。

## 📁 ディレクトリ構造

```
examples/
├── auth-service/
│   ├── swagger-setup.ts        # Swagger UI設定
│   ├── controllers/
│   │   └── auth.controller.ts  # OpenAPI準拠のコントローラー
│   └── package.json            # 必要な依存関係
├── user-management-service/
│   ├── swagger-setup.ts
│   ├── controllers/
│   │   └── users.controller.ts
│   └── package.json
└── service-setting-service/
    ├── swagger-setup.ts
    ├── controllers/
    │   └── settings.controller.ts
    └── package.json
```

## 🚀 使用方法

### 1. 依存関係のインストール

各サービスで以下をインストール：

```bash
npm install swagger-ui-express yaml
npm install --save-dev @types/swagger-ui-express
```

### 2. Swagger設定のコピー

該当するサービスの `swagger-setup.ts` をサービスの `src/` ディレクトリにコピー。

### 3. メインファイルへの統合

```typescript
// src/index.ts or src/app.ts
import { setupSwagger } from './swagger-setup';

const app = express();

// ... その他のミドルウェア設定 ...

// Swagger UIのセットアップ
setupSwagger(app);

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
  console.log('API Docs: http://localhost:3001/api-docs');
});
```

### 4. コントローラーの実装

各サービスの `controllers/` 内の例を参考に、OpenAPI仕様に準拠したコントローラーを実装。

## 📝 注意事項

これらは実装例であり、各サービスの実際の構造や要件に応じて調整が必要です。

- TypeScript型は `@saas-app/types` から取得
- エラーハンドリングは統一
- バリデーションは各サービスで実装
- 環境変数による設定制御

## 🔗 関連ドキュメント

- [Swagger UI Integration Guide](../SWAGGER_UI_INTEGRATION.md)
- [API Versioning Strategy](../API_VERSIONING_STRATEGY.md)
- [Type Generation Pipeline](../TYPE_GENERATION_PIPELINE.md)
