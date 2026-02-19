# ISSUE-05-01: [統合検証 1/1] 受け入れ基準（AC-01〜AC-10）最終検証

## 親Issue

[ISSUE-05: 統合検証・リリース確認](./ISSUE-05_統合検証・リリース確認.md)

## 実施順序

**1番目（本機能開発の最終タスク）**（ISSUE-04 全件完了後）

## 概要

実装と全テストが完了した状態で、受け入れ基準 AC-01〜AC-10 を一通り手動・自動で検証しサインオフする。

## 検証手順

### Step 1: DevContainer クリーンスタート

DevContainer を再起動し、`post-create` コマンドによる DB 初期化・シードデータ投入が正常に完了することを確認する。

```bash
# post-create 後の確認
python scripts/test_cosmos_connection.py
```

### Step 2: AC-08 — シードデータ確認

```bash
python scripts/test_cosmos_connection.py --check-features
# または直接クエリ
```

期待: CosmosDB `services` コンテナに `type: "service_feature"` ドキュメントが19件存在する

### Step 3: AC-01〜AC-07 — API テスト実行

```bash
cd src/service-setting-service
pytest tests/test_api_service_features.py -v
```

### Step 4: AC-10 — 退行テスト確認

```bash
pytest tests/ -v  # 全既存テストを含む
```

### Step 5: AC-09 — E2E テスト実行

```bash
cd src/front
npx playwright test tests/e2e/service-features.spec.ts
```

### Step 6: 性能確認（NFR-01, NFR-02）

管理者ユーザーでサービス設定ページを開き、機能一覧展開時のレスポンスタイムが P95 500ms 以内であることを開発者ツールで確認する。

## 受け入れ基準チェックリスト

| AC | 内容 | 検証方法 | 状態 |
|---|---|---|---|
| AC-01 | GET .../features が機能一覧を返す | pytest | ☐ |
| AC-02 | GET テナント別機能がマージして返す | pytest | ☐ |
| AC-03 | テナント設定未登録は default_enabled が返る | pytest | ☐ |
| AC-04 | PUT 後の GET に変更が反映される | pytest | ☐ |
| AC-05 | 未割り当てサービスへの PUT は 403 | pytest | ☐ |
| AC-06 | 存在しない feature_id への PUT は 404 | pytest | ☐ |
| AC-07 | admin 未満での PUT は 403 | pytest | ☐ |
| AC-08 | ServiceFeature 19件が DB に存在する | シードデータ確認 | ☐ |
| AC-09 | フロントで機能トグルが表示・操作できる | Playwright | ☐ |
| AC-10 | 既存のサービス割り当て/解除が正常動作 | pytest/Playwright | ☐ |

## 完了条件

- [ ] AC-01〜AC-10 が全件チェック済み（全件グリーン）
- [ ] 実装担当者によるサインオフ完了
- [ ] 本機能開発タスク一覧がすべて完了ステータスになっている

## 依存

- ISSUE-01〜04 の全タスク完了

## 参照仕様

- [06-検証計画.md](../06-検証計画.md)
- [02-システム要件仕様.md](../02-システム要件仕様.md)
