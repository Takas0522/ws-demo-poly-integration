# ISSUE-04-04: [テスト実装 4/5] E2E テスト実装 (Playwright)

## 親Issue

[ISSUE-04: テスト実装・検証](./ISSUE-04_テスト実装・検証.md)

## 実施順序

**2番目**（ISSUE-03-04 および ISSUE-02-05 完了後）

## 概要

Playwright を使用して、ブラウザ操作を通じたサービス設定ページの機能設定 UI を E2E テストする。  
受け入れ基準 AC-09（機能一覧トグルの表示・操作）を検証する。

## 作成対象ファイル

新規作成: `src/front/tests/e2e/service-features.spec.ts`（または既存 E2E ディレクトリに準じたパス）

## テストケース一覧

| テスト ID | シナリオ | 期待結果 |
|---|---|---|
| TC-E-01 | admin ユーザーでサービス設定ページを開く | サービス一覧が表示される |
| TC-E-02 | 割り当て済みサービスの展開ボタンをクリック | 機能一覧が表示される |
| TC-E-03 | 機能のトグルをクリック（admin） | トグル状態が変更される |
| TC-E-04 | viewer ユーザーでサービス設定ページを開く | トグルが disabled 状態で表示される |
| TC-E-05 | 未割り当てサービスに機能設定セクションが表示されない | 機能設定セクションなし |

## 実装方針

```typescript
import { test, expect } from "@playwright/test";

test("admin can toggle service feature", async ({ page }) => {
  await page.goto("/dashboard/services");
  await page.getByRole("button", { name: "ファイル管理" }).click();
  
  const toggle = page.getByLabel("ファイル外部共有");
  const initialState = await toggle.isChecked();
  await toggle.click();
  
  await expect(toggle).toBeChecked({ checked: !initialState });
});

test("viewer cannot toggle service feature", async ({ page }) => {
  // viewer ロールでログイン
  await page.goto("/dashboard/services");
  await page.getByRole("button", { name: "ファイル管理" }).click();
  
  const toggle = page.getByLabel("ファイル外部共有");
  await expect(toggle).toBeDisabled();
});
```

## 完了条件

- [ ] TC-E-01〜TC-E-05 が実装されている
- [ ] `npx playwright test` 実行時に全件 PASS する
- [ ] admin と viewer の権限差が E2E テストで検証されている

## 依存

- ISSUE-03-04（UI が実装済みであること）
- ISSUE-02-05（バックエンド API が動作していること）
- ISSUE-01（シードデータが存在すること）

## 参照仕様

- [06-検証計画.md](../06-検証計画.md) §5
- 受け入れ基準 AC-09
