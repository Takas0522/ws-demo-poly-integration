# コンポーネント設計（統合・横断事項）

## ドキュメント情報

- **バージョン**: 2.0.0
- **最終更新日**: 2024年
- **ステータス**: Draft

> **注**: 各サービス固有のコンポーネント設計は、各サービスリポジトリのドキュメントを参照してください。

---

## 各サービスのコンポーネント設計

| サービス                 | ドキュメント                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| フロントエンド（BFF）    | [src/front/docs/component-design.md](../../src/front/docs/component-design.md)                                         |
| 認証認可サービス         | [src/auth-service/docs/component-design.md](../../src/auth-service/docs/component-design.md)                           |
| テナント管理サービス     | [src/tenant-management-service/docs/component-design.md](../../src/tenant-management-service/docs/component-design.md) |
| 利用サービス設定サービス | [src/service-setting-service/docs/component-design.md](../../src/service-setting-service/docs/component-design.md)     |

---

## 1. サービス間通信

### 1.1 通信パターン

```
[Frontend (BFF)] → HTTP/REST → [Auth Service]
[Frontend (BFF)] → HTTP/REST → [Tenant Management Service]
[Frontend (BFF)] → HTTP/REST → [Service Setting Service]
[Auth Service]   → HTTP/REST → [Service Setting Service] (ロール収集)
```

### 1.2 認証フロー

```
1. Client → Frontend: ログインリクエスト
2. Frontend → Auth Service: 認証API呼び出し
3. Auth Service: ユーザー検証 + JWT発行
4. Auth Service → Frontend: JWTトークン返却
5. Frontend → Client: Cookie設定 + リダイレクト
6. Client → Frontend: 認証済みリクエスト（Cookie付き）
7. Frontend → Backend: API呼び出し（Bearer Token付き）
```

### 1.3 内部通信設定

```python
# サービス間通信の基本設定
INTERNAL_SERVICES = {
    "auth": {
        "base_url": "http://auth-service:8001",
        "timeout": 30,
        "retry_count": 3
    },
    "tenant": {
        "base_url": "http://tenant-management-service:8002",
        "timeout": 30,
        "retry_count": 3
    },
    "service-setting": {
        "base_url": "http://service-setting-service:8003",
        "timeout": 30,
        "retry_count": 3
    }
}
```

## 2. 共通依存関係

### 2.1 バックエンド共通（Python/FastAPI）

```
fastapi>=0.104.0
uvicorn>=0.24.0
azure-cosmos>=4.5.0
pydantic>=2.0.0
python-jose>=3.3.0
passlib>=1.7.4
httpx>=0.25.0
python-dotenv>=1.0.0
```

### 2.2 フロントエンド（Next.js）

```
next: ^14.0.0
react: ^18.0.0
typescript: ^5.0.0
tailwindcss: ^3.0.0
```

### 2.3 共有ライブラリ

```
src/shared/
├── __init__.py
├── cosmos_client.py        # CosmosDB接続管理（全バックエンドサービス共通）
```

## 3. 開発ガイドライン

### 3.1 コーディング規約

**Python（バックエンド）**

- PEP 8準拠
- Type hintsを積極的に使用
- async/awaitを使用した非同期処理
- Repository パターンによるデータアクセス層の分離

**TypeScript（フロントエンド）**

- ESLint + Prettier による統一フォーマット
- Server Components をデフォルト使用
- Client Components は最小限に

### 3.2 テスト方針

| レベル                | ツール         | カバレッジ目標   |
| --------------------- | -------------- | ---------------- |
| Unit Test（Backend）  | pytest         | 80%              |
| Unit Test（Frontend） | Jest           | 70%              |
| Integration Test      | pytest + httpx | 主要フロー       |
| E2E Test              | Playwright     | 主要ユースケース |

### 3.3 エラーハンドリング

**共通エラーレスポンス形式**

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定されたリソースが見つかりません",
    "details": []
  }
}
```

**HTTPステータスコード**
| コード | 用途 |
|-------|------|
| 200 | 成功 |
| 201 | リソース作成成功 |
| 400 | リクエスト不正 |
| 401 | 認証エラー |
| 403 | 認可エラー |
| 404 | リソース未存在 |
| 409 | 競合エラー |
| 500 | サーバーエラー |

---

## 変更履歴

| バージョン | 日付 | 変更内容                                                       | 作成者             |
| ---------- | ---- | -------------------------------------------------------------- | ------------------ |
| 1.0.0      | 2024 | 初版作成                                                       | Architecture Agent |
| 2.0.0      | 2024 | サービス固有設計を各サービスリポジトリに分離。横断事項のみ記載 | Architecture Agent |
