# ISSUE-03-01: [フロントエンド実装 1/4] 型定義追加 (`types/index.ts`)

## 親Issue

[ISSUE-03: フロントエンド実装](./ISSUE-03_フロントエンド実装.md)

## 実施順序

**1番目（ISSUE-03 内の最初のタスク）**

## 概要

`src/front/types/index.ts` に `ServiceFeature` および `TenantServiceFeature` の TypeScript インターフェースを追加する。  
既存の `Service`, `TenantService` 型は変更しない（追加のみ）。

## 変更対象ファイル

| ファイル | 変更種別 | 変更内容 |
|---|---|---|
| `src/front/types/index.ts` | 変更（追加のみ） | 2インターフェース追加 |

## 追加内容

```typescript
// サービス機能マスター
export interface ServiceFeature {
  id: string;
  service_id: string;
  feature_key: string;
  feature_name: string;
  description: string;
  default_enabled: boolean;
  created_at: string;
}

export interface ServiceFeaturesResponse {
  service_id: string;
  features: ServiceFeature[];
}

// テナント別機能設定
export interface TenantServiceFeature {
  feature_id: string;
  service_id: string;
  feature_key: string;
  feature_name: string;
  description: string;
  is_enabled: boolean;
  is_default: boolean;
  updated_at: string | null;
  updated_by: string | null;
}

export interface TenantServiceFeaturesResponse {
  tenant_id: string;
  service_id: string;
  features: TenantServiceFeature[];
}

export interface UpdateTenantServiceFeatureRequest {
  is_enabled: boolean;
}
```

## 完了条件

- [ ] `ServiceFeature`, `ServiceFeaturesResponse` インターフェースが追加されている
- [ ] `TenantServiceFeature`, `TenantServiceFeaturesResponse` インターフェースが追加されている
- [ ] `UpdateTenantServiceFeatureRequest` インターフェースが追加されている
- [ ] 既存の型定義が変更されていない
- [ ] TypeScript コンパイルエラーがない

## 依存

- なし（ISSUE-02 と並走可能）

## 参照仕様

- [04-API仕様.md](../04-API仕様.md) §2 レスポンス定義
