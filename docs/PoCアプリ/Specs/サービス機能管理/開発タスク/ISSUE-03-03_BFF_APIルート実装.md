# ISSUE-03-03: [フロントエンド実装 3/4] BFF API ルート実装（3ファイル新規作成）

## 親Issue

[ISSUE-03: フロントエンド実装](./ISSUE-03_フロントエンド実装.md)

## 実施順序

**2番目**（ISSUE-03-01 完了後、ISSUE-03-02 と **並走可能**）

## 概要

フロントエンドから service-setting-service へのプロキシとなる BFF API ルートを3ファイル新規作成する。  
既存の `app/api/services/route.ts` や `app/api/tenants/[id]/services/route.ts` のパターンを踏襲する。

## 作成対象ファイル

| ファイル | メソッド | プロキシ先 |
|---|---|---|
| `src/front/app/api/services/[id]/features/route.ts` | GET | `GET /api/v1/services/{id}/features` |
| `src/front/app/api/tenants/[id]/services/[serviceId]/features/route.ts` | GET | `GET /api/v1/tenants/{id}/services/{serviceId}/features` |
| `src/front/app/api/tenants/[id]/services/[serviceId]/features/[featureId]/route.ts` | PUT | `PUT /api/v1/tenants/{id}/services/{serviceId}/features/{featureId}` |

## 実装パターン（各ファイル共通）

```typescript
// src/front/app/api/services/[id]/features/route.ts
import { getSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(
    `${process.env.SERVICE_SETTING_SERVICE_URL}/api/v1/services/${params.id}/features`,
    {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    }
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
```

> PUT ルートでは `req.json()` でボディを受け取り、service-setting-service にそのまま転送する。

## 完了条件

- [ ] 3ファイルが作成されている
- [ ] GET ルート2本がトークンをヘッダーに付与してプロキシする
- [ ] PUT ルートがリクエストボディをそのまま転送する
- [ ] セッションなし（未認証）の場合に 401 を返す
- [ ] TypeScript コンパイルエラーがない

## 依存

- ISSUE-03-01（型定義が存在すること）

## 参照仕様

- [04-API仕様.md](../04-API仕様.md) §3 BFF APIルート
- [02-システム要件仕様.md](../02-システム要件仕様.md) §3.3 BFFインターフェース
