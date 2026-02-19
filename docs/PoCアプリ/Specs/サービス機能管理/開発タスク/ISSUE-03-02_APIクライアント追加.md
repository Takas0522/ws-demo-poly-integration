# ISSUE-03-02: [フロントエンド実装 2/4] API クライアントメソッド追加 (`lib/api-client.ts`)

## 親Issue

[ISSUE-03: フロントエンド実装](./ISSUE-03_フロントエンド実装.md)

## 実施順序

**2番目**（ISSUE-03-01 完了後）

## 概要

`src/front/lib/api-client.ts` に、サービス機能管理の3APIを呼び出すメソッドを追加する。  
既存メソッドの変更は行わない（追加のみ）。

## 変更対象ファイル

| ファイル | 変更種別 | 変更内容 |
|---|---|---|
| `src/front/lib/api-client.ts` | 変更（追加のみ） | 3メソッド追加 |

## 追加メソッド

```typescript
// GET /api/services/{id}/features （BFF経由）
export async function getServiceFeatures(
  serviceId: string
): Promise<ServiceFeaturesResponse> {
  const res = await fetch(`/api/services/${serviceId}/features`);
  if (!res.ok) throw new Error(`Failed to fetch service features: ${res.status}`);
  return res.json();
}

// GET /api/tenants/{id}/services/{serviceId}/features （BFF経由）
export async function getTenantServiceFeatures(
  tenantId: string,
  serviceId: string
): Promise<TenantServiceFeaturesResponse> {
  const res = await fetch(`/api/tenants/${tenantId}/services/${serviceId}/features`);
  if (!res.ok) throw new Error(`Failed to fetch tenant service features: ${res.status}`);
  return res.json();
}

// PUT /api/tenants/{id}/services/{serviceId}/features/{featureId} （BFF経由）
export async function updateTenantServiceFeature(
  tenantId: string,
  serviceId: string,
  featureId: string,
  isEnabled: boolean
): Promise<TenantServiceFeature> {
  const res = await fetch(
    `/api/tenants/${tenantId}/services/${serviceId}/features/${featureId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_enabled: isEnabled }),
    }
  );
  if (!res.ok) throw new Error(`Failed to update tenant service feature: ${res.status}`);
  return res.json();
}
```

## 完了条件

- [ ] `getServiceFeatures()` が追加されている
- [ ] `getTenantServiceFeatures()` が追加されている
- [ ] `updateTenantServiceFeature()` が追加されている
- [ ] 既存メソッドが変更されていない
- [ ] TypeScript 型チェックが通る

## 依存

- ISSUE-03-01（型定義 `ServiceFeaturesResponse`, `TenantServiceFeaturesResponse`, `TenantServiceFeature` が必要）

## 参照仕様

- [04-API仕様.md](../04-API仕様.md) §3〜4
