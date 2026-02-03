# Frontend (Next.js BFF)

## 概要

本サービスは、複数サービス管理PoCアプリケーションのフロントエンドです。  
Next.js の App Router を使用し、UIレンダリングとBFF（Backend for Frontend）機能を提供します。

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **UIライブラリ**: React 18
- **スタイリング**: Tailwind CSS
- **状態管理**: React Context / useState
- **認証**: JWT (JSON Web Token)

## ディレクトリ構造

```
src/front/
├── app/                      # Next.js App Router
│   ├── api/                  # BFF APIルート
│   │   ├── auth/            # 認証API
│   │   ├── tenants/         # テナント管理API
│   │   ├── users/           # ユーザー管理API
│   │   ├── services/        # サービス設定API
│   │   └── mock/            # モックサービスAPI
│   ├── (auth)/              # 認証グループ
│   │   └── login/           # ログイン画面
│   ├── (dashboard)/         # ダッシュボードグループ
│   │   ├── tenants/         # テナント管理画面
│   │   ├── users/           # ユーザー管理画面
│   │   └── services/        # サービス設定画面
│   ├── layout.tsx           # ルートレイアウト
│   └── page.tsx             # ホーム画面
├── components/               # Reactコンポーネント
│   ├── ui/                  # 汎用UIコンポーネント
│   ├── features/            # 機能固有コンポーネント
│   └── layout/              # レイアウトコンポーネント
├── lib/                      # ユーティリティ・ヘルパー
│   ├── api/                 # APIクライアント
│   ├── auth/                # 認証ロジック
│   └── utils/               # 汎用ユーティリティ
├── types/                    # TypeScript型定義
├── public/                   # 静的ファイル
├── .env.local               # 環境変数（ローカル）
├── next.config.js           # Next.js設定
├── tailwind.config.js       # Tailwind CSS設定
└── tsconfig.json            # TypeScript設定
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成：

```bash
# Backend Service URLs
AUTH_SERVICE_URL=http://localhost:8001
TENANT_SERVICE_URL=http://localhost:8002
SERVICE_SETTING_URL=http://localhost:8003

# JWT Secret
JWT_SECRET=your-secret-key-here

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

アクセス: http://localhost:3000

## 開発

### コンポーネント作成

```bash
# 新しいUIコンポーネント
touch components/ui/Button.tsx

# 機能固有コンポーネント
touch components/features/TenantList.tsx
```

### API Route 作成

```bash
# 新しいAPIエンドポイント
touch app/api/tenants/[id]/route.ts
```

**例**:
```typescript
// app/api/tenants/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  // バックエンドサービスへのプロキシ
  const response = await fetch(`${process.env.TENANT_SERVICE_URL}/api/v1/tenants/${id}`);
  const data = await response.json();
  
  return NextResponse.json(data);
}
```

## テスト

```bash
# ユニットテスト
npm test

# リンター
npm run lint

# フォーマット
npm run format
```

## ビルド

```bash
# 開発ビルド
npm run build

# 本番起動
npm start
```

## 関連ドキュメント

- [コンポーネント設計](../../docs/arch/components/README.md#1-frontend-nextjs)
- [API設計仕様書](../../docs/arch/api/api-specification.md)

## ライセンス

MIT License
