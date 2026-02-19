# ISSUE-04-05: [テスト実装 5/5] 退行テスト実行・確認

## 親Issue

[ISSUE-04: テスト実装・検証](./ISSUE-04_テスト実装・検証.md)

## 実施順序

**3番目（ISSUE-04 の最終タスク）**（ISSUE-04-01〜04 完了後）

## 概要

新機能の実装が既存機能に影響を与えていないことを確認するために、既存のテストスイートを全件実行する。  
受け入れ基準 AC-10（既存のサービス割り当て/解除機能が正常動作する）を検証する。

## 実行対象テスト

### バックエンド（service-setting-service）

```bash
cd src/service-setting-service
pytest tests/ -v
```

確認項目:
- 既存エンドポイント（`GET /services`, `GET /services/{id}`, `GET /tenants/{id}/services`, `POST ...`, `DELETE ...`）のテストが全件 PASS

### フロントエンド（Next.js）

```bash
cd src/front
npx playwright test --grep-invert "service-features"  # 既存テストのみ実行
```

確認項目:
- ログイン画面・テナント管理画面・ユーザー管理画面等の既存テストが全件 PASS

## チェックリスト

| 確認項目 | 方法 | 期待結果 |
|---|---|---|
| 既存バックエンドテスト全件 | `pytest` 実行 | 全件 PASS |
| 既存 E2E テスト（サービス割り当て/解除） | Playwright 実行 | 全件 PASS |
| `services` コンテナの既存 Service ドキュメント取得 | API 経由で確認 | 全7件が正常に取得できる |
| `TenantService` 割り当て/解除 | UI 経由で確認 | 正常動作 |

## 完了条件

- [ ] 既存バックエンドテストが全件 PASS する
- [ ] 既存 E2E テストが全件 PASS する
- [ ] `services` コンテナの既存 `Service` ドキュメントが PK 変更後も正常に取得できる

## 依存

- ISSUE-04-01, ISSUE-04-02, ISSUE-04-03, ISSUE-04-04（新規テストが PASS していること）

## 参照仕様

- [06-検証計画.md](../06-検証計画.md) §7 退行テスト
- 受け入れ基準 AC-10
