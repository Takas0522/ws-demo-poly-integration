# 06 — BFFプロキシルート追加

## 概要

Next.js の BFF 層に、service-setting-service のサービス機能管理 API へのプロキシルートを 3 本追加する。

## 背景・目的

フロントエンドから直接バックエンドサービスを呼び出さず、Next.js の API Routes（BFF）を経由してリクエストをプロキシする既存パターンに従い、サービス機能管理用のルートを追加する。

## 対象リポジトリ

- `src/front/` — BFF ルートファイルの新規作成、APIクライアントへのメソッド追加

## タスク詳細

### 実装内容

1. **`src/front/app/api/services/[id]/features/route.ts` の新規作成**
   - `GET` ハンドラの実装
   - `getSession()` による認証確認
   - `cookies()` から `auth_token` を取得
   - `apiClient.getServiceFeatures(id, token)` を呼び出し（タスク07で追加するメソッド。このタスクで先にAPIクライアントメソッドも追加する）
   - レスポンスをそのままプロキシ
   - エラーハンドリングは既存の `app/api/services/route.ts` のパターンに準拠

2. **`src/front/app/api/tenants/[id]/services/[serviceId]/features/route.ts` の新規作成**
   - `GET` ハンドラの実装
   - params から `id`（tenant_id）と `serviceId` を取得
   - `apiClient.getTenantServiceFeatures(id, serviceId, token)` を呼び出し
   - レスポンスをそのままプロキシ

3. **`src/front/app/api/tenants/[id]/services/[serviceId]/features/[featureId]/route.ts` の新規作成**
   - `PUT` ハンドラの実装
   - params から `id`（tenant_id）、`serviceId`、`featureId` を取得
   - リクエストボディ `{ is_enabled: boolean }` を読み取り
   - `apiClient.updateTenantServiceFeature(id, serviceId, featureId, body, token)` を呼び出し
   - レスポンスをそのままプロキシ

4. **`src/front/lib/api-client.ts` へのメソッド追加**
   - `getServiceFeatures(serviceId: string, token: string)` — `GET /api/v1/services/{serviceId}/features`
   - `getTenantServiceFeatures(tenantId: string, serviceId: string, token: string)` — `GET /api/v1/tenants/{tenantId}/services/{serviceId}/features`
   - `updateTenantServiceFeature(tenantId: string, serviceId: string, featureId: string, data: { is_enabled: boolean }, token: string)` — `PUT /api/v1/tenants/{tenantId}/services/{serviceId}/features/{featureId}`
   - すべて `serviceClient`（service-setting-service 接続用 Axios インスタンス）を使用

### 参照ドキュメント

- [04-API仕様.md](../04-API仕様.md) — セクション 3（BFF APIルート）
- 既存コード: `src/front/app/api/services/route.ts`、`src/front/app/api/tenants/[id]/services/route.ts`、`src/front/app/api/tenants/[id]/services/[serviceId]/route.ts`（実装パターンの参考）
- 既存コード: `src/front/lib/api-client.ts`

### 影響範囲

- `src/front/app/api/services/[id]/features/route.ts` — 新規作成
- `src/front/app/api/tenants/[id]/services/[serviceId]/features/route.ts` — 新規作成
- `src/front/app/api/tenants/[id]/services/[serviceId]/features/[featureId]/route.ts` — 新規作成
- `src/front/lib/api-client.ts` — 3 メソッド追加（既存メソッドは変更なし）

## 完了条件（Success Criteria）

- [ ] `src/front/app/api/services/[id]/features/route.ts` が存在し、GET ハンドラが実装されている
- [ ] `src/front/app/api/tenants/[id]/services/[serviceId]/features/route.ts` が存在し、GET ハンドラが実装されている
- [ ] `src/front/app/api/tenants/[id]/services/[serviceId]/features/[featureId]/route.ts` が存在し、PUT ハンドラが実装されている
- [ ] `src/front/lib/api-client.ts` に `getServiceFeatures`、`getTenantServiceFeatures`、`updateTenantServiceFeature` メソッドが追加されている
- [ ] 各ルートで `getSession()` による認証確認が行われている
- [ ] `npm run build`（Next.js ビルド）がエラーなく完了する
- [ ] 既存の BFF ルートが引き続き正常に動作する

## 依存関係

- **前提タスク:** 04-バックエンドサービス層とAPIエンドポイント
- **後続タスク:** 08-フロントエンドUI実装

## 備考

- BFF ルートのレスポンス変換（バックエンドの snake_case → フロントエンドのフィールド名）については、サービス機能管理 API ではバックエンドのレスポンスをそのまま返却する方針とする（フロントエンド側で必要に応じて変換）
- Next.js の App Router では `params` は `Promise<{ id: string }>` 型であり、`await params` が必要（既存コードのパターンに合わせる）
