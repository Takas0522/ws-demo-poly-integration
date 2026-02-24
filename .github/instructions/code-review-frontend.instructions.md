---
applyTo: "src/front/**/*.ts,src/front/**/*.tsx,src/front/**/*.mts"
excludeAgent: "coding-agent"
---

# TypeScript / Next.js / React コードレビューガイドライン

## レビューコメントの言語

- **レビューコメントはすべて日本語で記述すること**
- コード例やコマンドはそのままでよいが、指摘・提案・質問の説明文は必ず日本語で書く

## アーキテクチャの遵守

フロントエンドは Next.js App Router と BFF パターンを採用している。

- `app/` — ページコンポーネントと API Routes（BFF）
- `app/api/` — BFF層（バックエンドサービスへの中継）
- `components/features/` — 機能固有コンポーネント
- `components/ui/` — 再利用可能UIプリミティブ（Button, Input, Alert等）
- `components/layouts/` — レイアウトコンポーネント
- `hooks/` — カスタムフック
- `lib/` — ユーティリティモジュール（APIクライアント等）
- `types/` — 共有型定義

## 型安全性

- `any` 型の使用を避け、`unknown` または具体的な型を使用する
- すべてのpropsに型定義（interface/type）が付与されているか確認する
- API レスポンスの型が `types/index.ts` の既存型定義と一致しているか確認する
- イベントハンドラに適切なReact型（`React.ChangeEvent<HTMLInputElement>` 等）が使用されているか確認する

```typescript
// 避けるべき例
function handleData(data: any) { ... }

// 正しい例
function handleData(data: Tenant) { ... }
```

## 命名規則

- コンポーネント: `PascalCase`（例: `LoginForm`, `MainLayout`）
- ファイル名: コンポーネントは `PascalCase.tsx`、ユーティリティは `kebab-case.ts`
- インターフェース / 型: `PascalCase`（例: `User`, `Tenant`, `LoginRequest`）
- インターフェースフィールド: `camelCase`（例: `userId`, `isPrivileged`）
- 変数・関数: `camelCase`
- 定数: `UPPER_CASE` または `camelCase`

## コンポーネント設計

- 関数コンポーネント + Hooks を使用する（クラスコンポーネントは不可）
- UI プリミティブコンポーネントでは `forwardRef` と `displayName` を設定する
- コンポーネントは200行以下を目安にする
- ビジネスロジックはカスタムフック（`hooks/`）に抽出する
- `'use client'` ディレクティブが必要なコンポーネントに正しく設定されているか確認する

```tsx
// UIプリミティブの正しいパターン
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', ...props }, ref) => { ... }
);
Button.displayName = 'Button';
```

## 状態管理

- サーバー状態: TanStack React Query (`useQuery`, `useMutation`) を使用する
- 認証状態: `useAuth()` フックを使用する
- ローカル状態: `useState` を使用する
- Prop drilling は2〜3階層以下に抑える

## BFF パターン (API Routes)

- ブラウザから直接バックエンドサービスのURLを呼び出していないか確認する（必ず `app/api/` を経由すること）
- API Route 内での `apiClient`（`lib/api-client.ts`）の使用を確認する
- 環境変数 `NEXT_PUBLIC_*` にシークレットが含まれていないか確認する

## 認証

- JWT は `httpOnly` の `auth_token` Cookie に保存されているか確認する
- 保護ページへのアクセスは `middleware.ts` で制御されているか確認する
- `useAuth()` フックの既存パターンに従っているか確認する
- ログイン・ログアウト処理が `/api/auth/login`, `/api/auth/logout` の API Route を経由しているか確認する

## エラーハンドリング

- `try/catch` で適切にエラーがハンドリングされているか確認する
- エラーメッセージがユーザーに `Alert` コンポーネント等で表示されているか確認する
- `error.tsx` / `global-error.tsx` のエラーバウンダリパターンが維持されているか確認する

## スタイリング

- Tailwind CSS ユーティリティクラスを使用する（カスタム CSS は最小限に）
- レスポンシブデザインが考慮されているか確認する
- アクセシビリティ属性（`aria-*`, セマンティック HTML）が適切に設定されているか確認する

## テスト

- E2E テストは Playwright で `test.describe()` ブロック構成に従う
- ユニットテストは Jest + Testing Library で記述する
- テストの説明は英語で記述する

## パフォーマンス

- 不要な再レンダリングを引き起こすパターンがないか確認する（インラインオブジェクト/関数定義等）
- `useCallback` / `useMemo` が適切に使用されているか確認する
- `@/*` パスエイリアスが一貫して使用されているか確認する

※ 本ファイルに記載されたすべての観点について、レビューコメントは日本語で記述すること。
