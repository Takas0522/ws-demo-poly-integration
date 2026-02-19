# ISSUE-03-04: [フロントエンド実装 4/4] サービス設定ページ UI 拡張 (`app/dashboard/services/page.tsx`)

## 親Issue

[ISSUE-03: フロントエンド実装](./ISSUE-03_フロントエンド実装.md)

## 実施順序

**3番目（ISSUE-03 の最終タスク）**（ISSUE-03-02 および ISSUE-03-03 完了後）

## 概要

`src/front/app/dashboard/services/page.tsx` に、割り当て済みサービス行を展開して機能一覧を表示するUI要素を追加する。  
既存の「サービス割り当て/解除」機能は変更しない（UI拡張のみ）。

## 変更対象ファイル

| ファイル | 変更種別 | 変更内容 |
|---|---|---|
| `src/front/app/dashboard/services/page.tsx` | 変更 | サービス行の展開UI、機能一覧テーブル、有効/無効トグルの追加 |

## 追加 UI 要素

| UI要素 | 動作 |
|---|---|
| サービス行の展開ボタン（▼/▶） | クリックで当該サービスの機能一覧を展開/折り畳み |
| 機能一覧テーブル | `feature_name`, `description`, 現在の `is_enabled` 状態を表示 |
| 有効/無効トグル | `admin` 以上のロールを持つユーザーのみ操作可能 |
| 権限なしユーザーへの表示 | トグルを `disabled` 状態で表示（読み取り専用） |
| デフォルト表示 | `is_default: true` の機能には「(デフォルト)」ラベル |
| 割り当て済みサービスのみ | 割り当て済みサービスに対してのみ機能設定セクションを表示 |

## 実装方針

```tsx
// 展開状態管理
const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
const [featureMap, setFeatureMap] = useState<Record<string, TenantServiceFeature[]>>({});

// サービス行クリック時に機能一覧をフェッチ
const handleExpandService = async (serviceId: string) => {
  if (!featureMap[serviceId]) {
    const data = await getTenantServiceFeatures(tenantId, serviceId);
    setFeatureMap(prev => ({ ...prev, [serviceId]: data.features }));
  }
  setExpandedServices(prev => {
    const next = new Set(prev);
    next.has(serviceId) ? next.delete(serviceId) : next.add(serviceId);
    return next;
  });
};

// トグル操作（admin のみ）
const handleToggleFeature = async (serviceId: string, featureId: string, isEnabled: boolean) => {
  await updateTenantServiceFeature(tenantId, serviceId, featureId, isEnabled);
  // featureMap を更新してUIを再描画
};
```

## 権限制御

```tsx
const isAdmin = session?.user?.role === "admin" || session?.user?.role === "global_admin";

<Switch
  checked={feature.is_enabled}
  onCheckedChange={(v) => handleToggleFeature(serviceId, feature.feature_id, v)}
  disabled={!isAdmin}   // admin 未満は disabled
/>
```

## 完了条件

- [ ] 割り当て済みサービス行に展開ボタンが表示される
- [ ] 展開時に機能一覧がテーブルで表示される
- [ ] `admin`/`global_admin` のみトグルが操作可能（他は disabled）
- [ ] トグル変更後に画面が即座に更新される
- [ ] 既存のサービス割り当て/解除 UI が変更されていない
- [ ] TypeScript コンパイルエラーがない

## 依存

- ISSUE-03-02（`getTenantServiceFeatures`, `updateTenantServiceFeature` メソッド）
- ISSUE-03-03（BFF ルートが動作していること）

## 参照仕様

- [02-システム要件仕様.md](../02-システム要件仕様.md) §3.2 UI要件
- [05-影響範囲分析.md](../05-影響範囲分析.md) §3.2 UI変更箇所
