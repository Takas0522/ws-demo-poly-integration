# ISSUE-01-02: [データ基盤整備 2/4] `ServiceFeature` シードデータ追加 (initial_data.py)

## 親Issue

[ISSUE-01: データ基盤整備](./ISSUE-01_データ基盤整備.md)

## 実施順序

**2番目**（ISSUE-01-01 完了後）

## 概要

`scripts/seed_data/initial_data.py` に、全7サービス分の `ServiceFeature` マスターデータ（19件）を定義する `SERVICE_FEATURES` リストを追加する。

## 変更対象ファイル

| ファイル | 変更種別 | 変更内容 |
|---|---|---|
| `scripts/seed_data/initial_data.py` | 変更 | `SERVICE_FEATURES` リスト（19件）を追加 |

## 追加データ一覧

| 機能ID | service_id | feature_key | feature_name | default_enabled |
|---|---|---|---|---|
| feature-service-001-01 | service-001 | `audit_log` | 監査ログ | true |
| feature-service-001-02 | service-001 | `auto_backup` | 自動バックアップ | false |
| feature-service-002-01 | service-002 | `mfa` | 多要素認証 (MFA) | false |
| feature-service-002-02 | service-002 | `password_policy` | 強化パスワードポリシー | true |
| feature-service-002-03 | service-002 | `session_audit` | セッション監査 | false |
| feature-service-003-01 | service-003 | `service_report` | サービス利用レポート | true |
| feature-service-003-02 | service-003 | `auto_provisioning` | 自動プロビジョニング | false |
| feature-service-004-01 | service-004 | `version_control` | バージョン管理 | true |
| feature-service-004-02 | service-004 | `file_sharing` | ファイル外部共有 | false |
| feature-service-004-03 | service-004 | `auto_backup` | 自動バックアップ | true |
| feature-service-005-01 | service-005 | `email_notification` | メール通知 | true |
| feature-service-005-02 | service-005 | `sms_notification` | SMS通知 | false |
| feature-service-005-03 | service-005 | `push_notification` | プッシュ通知 | false |
| feature-service-006-01 | service-006 | `usage_analytics` | 利用分析エクスポート | true |
| feature-service-006-02 | service-006 | `rate_limiting` | レートリミット設定 | true |
| feature-service-006-03 | service-006 | `api_audit_log` | API監査ログ | false |
| feature-service-007-01 | service-007 | `incremental_backup` | 増分バックアップ | true |
| feature-service-007-02 | service-007 | `cross_region_backup` | クロスリージョンバックアップ | false |
| feature-service-007-03 | service-007 | `auto_schedule` | 自動スケジュール | true |

## ドキュメント形状

```python
SERVICE_FEATURES = [
    {
        "id": "feature-service-001-01",
        "type": "service_feature",
        "service_id": "service-001",
        "feature_key": "audit_log",
        "feature_name": "監査ログ",
        "description": "テナント内操作の監査ログを記録する機能",
        "default_enabled": True,
        "created_at": "2026-01-01T00:00:00Z",
        "partitionKey": "service-001"
    },
    # ... 18件続く
]
```

## 完了条件

- [ ] `SERVICE_FEATURES` リスト（19件）が `initial_data.py` に追加されている
- [ ] 各ドキュメントに `id`, `type`, `service_id`, `feature_key`, `feature_name`, `description`, `default_enabled`, `created_at`, `partitionKey` が含まれる

## 依存

- ISSUE-01-01（`services` コンテナの `partitionKey` フィールドが存在することの確認）

## 参照仕様

- [02-システム要件仕様.md](../02-システム要件仕様.md) §1.2 機能定義詳細
- [03-データモデル設計.md](../03-データモデル設計.md) §1.1, §6
