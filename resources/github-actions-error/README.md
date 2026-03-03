# GitHub Actions エラー情報

直近で失敗したGitHub Actionsのワークフロー実行に関するRawデータです。
機密情報（actor名、client-id、tenant-id、AUTHORIZATION tokenなど）はマスク済みです。

## ファイル一覧

| ファイル                               | 内容                                                         |
| -------------------------------------- | ------------------------------------------------------------ |
| `failed-runs-list.json`                | 直近の失敗ラン一覧（10件）                                   |
| `run-22610631254-deploy-to-azure.json` | Deploy to Azure ワークフロー (2026-03-03) - 構造化エラー情報 |
| `run-22610631254-failed-step-log.txt`  | Deploy to Azure ワークフロー - 失敗ステップのRawログ         |
| `run-22566647577-ci-pipeline.json`     | CI Pipeline ワークフロー (2026-03-02) - 構造化エラー情報     |
| `run-22566647577-failed-step-log.txt`  | CI Pipeline ワークフロー - 失敗ステップのRawログ             |

## エラー概要

### 1. Deploy to Azure (Run #22610631254 / 2026-03-03)

- **失敗ジョブ**: Deploy Container Registry
- **失敗ステップ**: Azure Login (`azure/login@v2`)
- **原因**: `subscription-id` が設定されていない。`allow-no-subscriptions` も `false` のため認証に失敗。

### 2. CI Pipeline (Run #22566647577 / 2026-03-02)

- **失敗ジョブ1**: Frontend CI
  - **失敗ステップ**: Run ESLint
  - **原因**: ESLintエラー1件（`@typescript-eslint/no-explicit-any` in `src/front/lib/auth.ts:27`）、警告2件（`react-hooks/exhaustive-deps`）
- **失敗ジョブ2**: Infrastructure CI
  - **失敗ステップ**: Bicep Build Validation
  - **原因**: サブモジュールが未チェックアウトのため `src/*/infra/container-app.bicep` が見つからない（BCP091エラー）。加えてAzure Login（v1）で `client-id` / `tenant-id` 未設定エラー。

## マスク済み情報

- GitHub actor / triggering_actor → `***`
- Azure client-id / tenant-id → `***`
- AUTHORIZATION ヘッダー → `***`
