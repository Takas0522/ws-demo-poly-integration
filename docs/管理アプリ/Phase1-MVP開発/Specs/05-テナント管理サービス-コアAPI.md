# 機能仕様書: テナント管理サービス - コアAPI

**バージョン**: 1.0.0  
**ドキュメントID**: SPEC-TENANT-001  
**作成日**: 2026-02-01  
**ステータス**: Draft

## 変更履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|----------|------|---------|--------|
| 1.0.0 | 2026-02-01 | 初版作成 | システム |

---

## 1. はじめに

### 1.1 目的

本仕様書は、マルチテナント管理アプリケーションにおける**テナント管理サービス - コアAPI**の機能要件と非機能要件を定義します。テナントの作成・更新・削除・参照の基本機能に焦点を当て、ユーザー管理・ドメイン管理は後続タスク（タスク06）で実装します。

### 1.2 スコープ

#### Phase 1に含まれる機能

- ✅ テナントCRUD操作（作成・取得・更新・削除）
- ✅ 特権テナント保護機能
- ✅ テナント一覧取得（ページネーション）
- ✅ ロールベース認可（閲覧者、管理者、全体管理者）
- ✅ 監査ログ（作成者・更新者の追跡）
- ✅ データ整合性検証（テナント名の一意性）

#### Phase 2以降に延期する機能

- ⏭ テナント所属ユーザー管理（タスク06）
- ⏭ ドメイン管理（タスク06）
- ⏭ テナントプラン管理（無料/標準/プレミアム）
- ⏭ テナントクォータ管理（ユーザー数制限、ストレージ制限）
- ⏭ テナントの論理削除と物理削除の分離
- ⏭ テナントのアーカイブ機能

### 1.3 用語定義

| 用語 | 定義 |
|------|------|
| テナント (Tenant) | マルチテナントシステムにおける顧客企業または組織の単位。各テナントのデータは論理的に分離される |
| 特権テナント (Privileged Tenant) | システム管理会社専用のテナント。`is_privileged=true`で識別され、削除・編集が禁止される |
| テナント分離 (Tenant Isolation) | 特権テナント以外のユーザーが、自分のテナントのデータのみにアクセスできる制約 |
| パーティションキー (Partition Key) | Cosmos DBのデータ分割単位。本サービスでは`tenantId`をパーティションキーとして使用 |
| ロールベース認可 (RBAC) | ユーザーに割り当てられたロールに基づいてアクセス制御を行う仕組み |
| 監査ログ (Audit Log) | データの作成・更新・削除を記録し、誰が・いつ・何を変更したかを追跡する |

---

## 2. ビジネス要件

### 2.1 ビジネス目標

本サービスは、マルチテナントシステムの中核として、以下のビジネス目標を達成します：

1. **顧客管理の効率化**: テナント単位での顧客管理により、営業・サポートの効率を30%向上
2. **データ分離の保証**: テナント間のデータ漏洩リスクをゼロに
3. **スケーラビリティ**: 新規テナント追加を5分以内で完了
4. **セキュリティ**: 特権テナントの保護により、システムの安定性を確保
5. **監査証跡の確保**: 全てのテナント操作を記録し、コンプライアンス要件を満たす

### 2.2 ユーザーストーリー

#### US-TENANT-001: テナント一覧の参照
**As a** 閲覧者  
**I want** テナント一覧を参照したい  
**So that** 管理対象の顧客企業を把握できる

**受入条件**:
- [ ] テナント一覧が表示される（テナント名、ユーザー数、作成日、利用サービス）
- [ ] ページネーション機能がある（最大100件/ページ）
- [ ] 特権テナント以外は自テナントのみ参照可能

#### US-TENANT-002: テナント詳細の参照
**As a** 閲覧者  
**I want** テナント詳細を参照したい  
**So that** 顧客企業の詳細情報を確認できる

**受入条件**:
- [ ] テナント名、ステータス、プラン、メタデータが表示される
- [ ] `is_privileged`フラグで特権テナントが識別できる
- [ ] テナント分離が強制される

#### US-TENANT-003: テナントの作成
**As a** 管理者  
**I want** 新規テナントを作成したい  
**So that** 新規顧客企業をシステムに登録できる

**受入条件**:
- [ ] テナント名、プラン、最大ユーザー数を指定して作成
- [ ] テナント名の重複チェックが行われる
- [ ] 作成者が記録される

#### US-TENANT-004: テナント情報の更新
**As a** 管理者  
**I want** テナント情報を更新したい  
**So that** 顧客企業の情報変更に対応できる

**受入条件**:
- [ ] 表示名、プラン、最大ユーザー数を更新可能
- [ ] 特権テナントは更新不可
- [ ] 更新者と更新日時が記録される

#### US-TENANT-005: テナントの削除
**As a** 管理者  
**I want** テナントを削除したい  
**So that** 契約終了した顧客企業をシステムから削除できる

**受入条件**:
- [ ] 特権テナントは削除不可
- [ ] 削除者が記録される
- [ ] Phase 1では物理削除（Phase 2で論理削除に変更予定）

#### US-TENANT-006: 特権テナントの保護
**As a** システム管理者  
**I want** 特権テナントが削除・編集されないようにしたい  
**So that** システムの安定性を確保できる

**受入条件**:
- [ ] `is_privileged=true`のテナントは更新・削除できない
- [ ] 更新・削除を試みると403エラーが返却される

### 2.3 ビジネスルール

| ルールID | ルール名 | 説明 | 優先度 |
|---------|--------|------|--------|
| BR-TENANT-001 | 特権テナント保護 | `is_privileged=true`のテナントは削除・編集不可 | 高 |
| BR-TENANT-002 | テナント名の一意性 | テナント名はアクティブなテナント(`status=active`)間で一意である必要がある。削除済みテナント名の再利用は可能 | 高 |
| BR-TENANT-003 | デフォルトステータス | テナント作成時、デフォルトで`status=active` | 中 |
| BR-TENANT-004 | 物理削除 | Phase 1では物理削除、Phase 2で論理削除に移行 | 中 |
| BR-TENANT-005 | テナントID形式 | テナントIDは`tenant_{識別子}`形式（例: `tenant_acme`） | 高 |
| BR-TENANT-006 | パーティションキー | テナントIDをパーティションキーとして使用（自己参照） | 高 |
| BR-TENANT-007 | テナント分離 | 特権テナント以外は自テナントのみアクセス可能 | 高 |

---

## 3. 機能要件

### 3.1 機能概要

テナント管理サービスは、以下の機能を提供します：

1. **テナント一覧取得**: 全テナント（特権テナント）または自テナント（一般テナント）の一覧を取得
2. **テナント詳細取得**: 特定テナントの詳細情報を取得
3. **テナント作成**: 新規テナントを作成
4. **テナント更新**: 既存テナントの情報を更新（特権テナント除く）
5. **テナント削除**: 既存テナントを削除（特権テナント除く）

### 3.2 機能詳細

#### 3.2.1 テナント一覧取得

- **説明**: テナントの一覧を取得します。特権テナントのユーザーは全テナントを、一般テナントのユーザーは自テナントのみを取得できます。
- **入力**: 
  - クエリパラメータ: `status`（オプション）、`skip`（ページネーション）、`limit`（最大100件）
  - Authorization ヘッダー: JWT
- **処理**:
  1. JWTから現在のユーザーのテナントIDを取得
  2. 特権テナント（`tenant_privileged`）の場合、全テナントをクロスパーティションクエリで取得
  3. 一般テナントの場合、自テナントのみを単一パーティションクエリで取得
  4. `status`フィルタを適用（指定された場合）
  5. `skip`と`limit`でページネーション
- **出力**: テナント一覧（JSON配列）

**Cosmos DBクエリ例（特権テナント）**:
```sql
SELECT * FROM c 
WHERE c.type = 'tenant' 
  AND c.status = @status
ORDER BY c.createdAt DESC
OFFSET @skip LIMIT @limit
```

**Cosmos DBクエリ例（一般テナント）**:
```sql
SELECT * FROM c 
WHERE c.tenantId = @tenant_id 
  AND c.type = 'tenant'
```

#### 3.2.2 テナント詳細取得

- **説明**: 特定のテナントの詳細情報を取得します。
- **入力**: 
  - パスパラメータ: `tenant_id`
  - Authorization ヘッダー: JWT
- **処理**:
  1. JWTから現在のユーザーのテナントIDを取得
  2. 特権テナント以外は、`tenant_id`が自テナントと一致するかチェック
  3. Cosmos DBから該当テナントを取得
  4. 存在しない場合は404エラー
- **出力**: テナント詳細情報（JSON）

#### 3.2.3 テナント作成

- **説明**: 新規テナントを作成します。管理者ロールが必要です。
- **入力**: 
  - リクエストボディ:
    - `name` (required): テナント名
    - `display_name` (required): 表示名
    - `plan` (optional, default="standard"): プラン（free/standard/premium）
    - `max_users` (optional, default=100): 最大ユーザー数
    - `metadata` (optional): 追加メタデータ（業種、国など）
  - Authorization ヘッダー: JWT
- **処理**:
  1. ロール認可チェック（tenant-management: 管理者）
  2. バリデーション
     - **テナント名の一意性チェック**:
       - Cosmos DBクエリ: `SELECT * FROM c WHERE c.name = @name AND c.status = 'active'`
       - アクティブなテナント間でのみ一意性をチェック
       - 削除済みの同名テナントがあっても作成可能
     - 必須フィールドの確認
  3. テナントIDを生成（`tenant_{slug化したname}`）
  4. Tenantオブジェクト作成
     - `user_count=0`、`status=active`、`is_privileged=false`で初期化
     - `created_by`に現在のユーザーID
     - **user_countの更新方法 (Phase 1)**:
       - タスク06（TenantUser管理）実装時に、TenantUser作成・削除時に`user_count`をインクリメント/デクリメント
       - TenantServiceに`increment_user_count(tenant_id)`と`decrement_user_count(tenant_id)`メソッドを提供
       - タスク06のTenantUserServiceから呼び出し
  5. Cosmos DBに保存
  6. 監査ログ記録
- **出力**: 作成されたテナント情報（JSON）

**バリデーションルール**:
- `name`: 3文字以上、100文字以内、英数字とハイフン・アンダースコアのみ
- `display_name`: 1文字以上、200文字以内
- `plan`: "free", "standard", "premium" のいずれか
- `max_users`: 1以上、10000以内

#### 3.2.4 テナント更新

- **説明**: 既存テナントの情報を更新します。特権テナントは更新不可です。
- **入力**: 
  - パスパラメータ: `tenant_id`
  - リクエストボディ:
    - `display_name` (optional): 表示名
    - `plan` (optional): プラン
    - `max_users` (optional): 最大ユーザー数
    - `metadata` (optional): メタデータ
  - Authorization ヘッダー: JWT
- **処理**:
  1. ロール認可チェック（tenant-management: 管理者）
  2. テナント取得
  3. 特権テナントチェック（`is_privileged=true`の場合は403エラー）
  4. 更新フィールドをマージ
  5. `updated_at`を現在時刻に更新
  6. `updated_by`に現在のユーザーID
  7. Cosmos DBに保存
  8. 監査ログ記録
- **出力**: 更新されたテナント情報（JSON）

#### 3.2.5 テナント削除

- **説明**: 既存テナントを削除します。特権テナントは削除不可です。
- **入力**: 
  - パスパラメータ: `tenant_id`
  - Authorization ヘッダー: JWT
- **処理**:
  1. ロール認可チェック（tenant-management: 管理者）
  2. テナント取得
  3. 特権テナントチェック（`is_privileged=true`の場合は403エラー）
  4. **削除前チェック（Phase 1の実装）**:
     - ユーザー数チェック: `user_count > 0`の場合は400エラーを返却
     - エラーメッセージ: "Cannot delete tenant with existing users. Please remove all users first."
  5. **関連データのカスケード削除（Phase 2で実装）**:
     - ServiceAssignmentの削除（サービス設定サービスと連携）
     - TenantUserの削除（タスク06実装後）
     - Domainの削除（タスク06実装後）
  6. Cosmos DBから物理削除
  7. 監査ログ記録（`deleted_by`に現在のユーザーID、Application Insightsに記録）
- **出力**: 204 No Content

**Phase 2での改善**:
- 論理削除に変更（`status=deleted`、`deleted_at`、`deleted_by`を記録）
- 30日後に物理削除する自動バッチ処理

### 3.3 画面仕様

本タスク（Phase 1）では画面は含まれません。タスク16「Frontend - テナント管理画面」で実装予定です。

### 3.4 API仕様

#### 3.4.1 GET /api/v1/tenants - テナント一覧取得

**認可**: tenant-management: 閲覧者以上

**リクエスト**:
```http
GET /api/v1/tenants?status=active&skip=0&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**クエリパラメータ**:
- `status` (optional): ステータスフィルタ（active/suspended/deleted）
- `skip` (optional, default=0): スキップ件数（ページネーション）
- `limit` (optional, default=20, max=100): 取得件数

**レスポンス** (200 OK):
```json
{
  "data": [
    {
      "id": "tenant_acme",
      "name": "acme",
      "display_name": "Acme Corporation",
      "is_privileged": false,
      "status": "active",
      "plan": "standard",
      "user_count": 25,
      "max_users": 100,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-20T15:00:00Z"
    }
  ],
  "pagination": {
    "skip": 0,
    "limit": 20,
    "total": 15
  }
}
```

**パフォーマンス要件**:
- 単一パーティションクエリ（一般テナント）: < 100ms (P95)
- クロスパーティションクエリ（特権テナント）: < 500ms (P95)

#### 3.4.2 GET /api/v1/tenants/{tenant_id} - テナント詳細取得

**認可**: tenant-management: 閲覧者以上

**リクエスト**:
```http
GET /api/v1/tenants/tenant_acme
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**パスパラメータ**:
- `tenant_id` (required): テナントID

**レスポンス** (200 OK):
```json
{
  "id": "tenant_acme",
  "name": "acme",
  "display_name": "Acme Corporation",
  "is_privileged": false,
  "status": "active",
  "plan": "standard",
  "user_count": 25,
  "max_users": 100,
  "metadata": {
    "industry": "Manufacturing",
    "country": "US"
  },
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-20T15:00:00Z",
  "created_by": "user_admin_001",
  "updated_by": "user_admin_001"
}
```

**エラーレスポンス**:
- `404 Not Found`: テナントが存在しない
- `403 Forbidden`: テナント分離違反

**パフォーマンス要件**: < 100ms (P95)

#### 3.4.3 POST /api/v1/tenants - テナント作成

**認可**: tenant-management: 管理者

**リクエスト**:
```http
POST /api/v1/tenants
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "name": "example-corp",
  "display_name": "Example Corporation",
  "plan": "standard",
  "max_users": 50,
  "metadata": {
    "industry": "IT",
    "country": "JP"
  }
}
```

**レスポンス** (201 Created):
```json
{
  "id": "tenant_example-corp",
  "name": "example-corp",
  "display_name": "Example Corporation",
  "is_privileged": false,
  "status": "active",
  "plan": "standard",
  "user_count": 0,
  "max_users": 50,
  "metadata": {
    "industry": "IT",
    "country": "JP"
  },
  "created_at": "2026-02-01T10:00:00Z",
  "updated_at": "2026-02-01T10:00:00Z",
  "created_by": "user_admin_001"
}
```

**エラーレスポンス**:
- `409 Conflict`: テナント名が既に存在
- `422 Unprocessable Entity`: バリデーションエラー
- `403 Forbidden`: 権限不足

**パフォーマンス要件**: < 300ms (P95)

#### 3.4.4 PUT /api/v1/tenants/{tenant_id} - テナント更新

**認可**: tenant-management: 管理者

**リクエスト**:
```http
PUT /api/v1/tenants/tenant_example-corp
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "display_name": "Example Corp (Updated)",
  "max_users": 100
}
```

**パスパラメータ**:
- `tenant_id` (required): テナントID

**レスポンス** (200 OK):
```json
{
  "id": "tenant_example-corp",
  "name": "example-corp",
  "display_name": "Example Corp (Updated)",
  "is_privileged": false,
  "status": "active",
  "plan": "standard",
  "user_count": 0,
  "max_users": 100,
  "updated_at": "2026-02-01T11:00:00Z",
  "updated_by": "user_admin_002"
}
```

**エラーレスポンス**:
- `404 Not Found`: テナントが存在しない
- `403 Forbidden`: 特権テナント、または権限不足
- `422 Unprocessable Entity`: バリデーションエラー

**パフォーマンス要件**: < 200ms (P95)

#### 3.4.5 DELETE /api/v1/tenants/{tenant_id} - テナント削除

**認可**: tenant-management: 管理者

**リクエスト**:
```http
DELETE /api/v1/tenants/tenant_example-corp
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**パスパラメータ**:
- `tenant_id` (required): テナントID

**レスポンス** (204 No Content):
（レスポンスボディなし）

**エラーレスポンス**:
- `404 Not Found`: テナントが存在しない
- `403 Forbidden`: 特権テナント、または権限不足

**パフォーマンス要件**: < 200ms (P95)

---

## 4. 非機能要件

### 4.1 パフォーマンス要件

| 項目 | 目標値 | 測定方法 | 測定条件 |
|------|--------|---------|---------|
| テナント一覧取得（単一パーティション） | < 100ms (P95) | Application Insights | 30日間のデータ |
| テナント一覧取得（クロスパーティション） | < 500ms (P95) | Application Insights | 30日間のデータ |
| テナント詳細取得 | < 100ms (P95) | Application Insights | 30日間のデータ |
| テナント作成 | < 300ms (P95) | Application Insights | 30日間のデータ |
| テナント更新 | < 200ms (P95) | Application Insights | 30日間のデータ |
| テナント削除 | < 200ms (P95) | Application Insights | 30日間のデータ |
| スループット | 100 req/秒 | 負荷テスト | 5分間持続 |
| 同時接続数 | 500接続 | 負荷テスト | ピーク時 |

### 4.2 セキュリティ要件

| 要件ID | 要件名 | 実装方法 | 優先度 |
|-------|--------|---------|--------|
| SEC-TENANT-001 | 認証必須 | 全APIエンドポイントでJWT認証を必須化 | 高 |
| SEC-TENANT-002 | ロールベース認可 | 共通ライブラリ`require_role`デコレータ使用 | 高 |
| SEC-TENANT-003 | テナント分離 | BaseRepositoryの3層チェック + アプリケーション層チェック | 高 |
| SEC-TENANT-004 | 特権テナント保護 | `is_privileged=true`の更新・削除を禁止 | 高 |
| SEC-TENANT-005 | 監査ログ | 全操作（作成・更新・削除）を記録 | 高 |
| SEC-TENANT-006 | 入力バリデーション | Pydantic v2でリクエストを検証 | 高 |
| SEC-TENANT-007 | SQLインジェクション対策 | パラメータ化クエリを使用 | 高 |

#### 4.2.1 認証・認可フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as Frontend (BFF)
    participant T as Tenant Service
    participant A as Auth Service
    participant DB as Cosmos DB
    
    U->>F: テナント作成リクエスト
    F->>T: POST /api/v1/tenants (JWT)
    T->>T: JWT検証（共通ライブラリ）
    T->>T: ロールチェック（require_role）
    T->>DB: テナント名の一意性チェック
    DB-->>T: 結果
    alt 一意性OK
        T->>DB: テナント作成
        DB-->>T: 作成成功
        T->>T: 監査ログ記録
        T-->>F: 201 Created
        F-->>U: 成功レスポンス
    else 重複
        T-->>F: 409 Conflict
        F-->>U: エラーメッセージ
    end
```

### 4.3 可用性要件

| 項目 | 目標値 | 測定方法 |
|------|--------|---------|
| 稼働率 (SLA) | 99.9% | Azure Monitor |
| 年間ダウンタイム | < 8.76時間 | Azure Monitor |
| 目標復旧時間 (RTO) | < 1時間 | インシデント記録 |
| 目標復旧時点 (RPO) | < 5分 | バックアップログ |
| 計画メンテナンス | 月1回、最大2時間 | 保守記録 |

### 4.4 スケーラビリティ要件

| 項目 | Phase 1目標値 | Phase 2目標値 |
|------|------------|------------|
| 最大テナント数 | 100テナント | 1,000テナント |
| テナントあたりユーザー数 | 500ユーザー | 5,000ユーザー |
| Cosmos DB RU/s | 400-4,000 (自動スケール) | 4,000-40,000 (自動スケール) |
| App Service インスタンス数 | 1-3 (自動スケール) | 3-10 (自動スケール) |

### 4.5 保守性要件

| 項目 | 要件 |
|------|------|
| コードカバレッジ | 75%以上（行カバレッジ） |
| ドキュメント | README.md、OpenAPI仕様書（/docs） |
| ロギング | 構造化ログ（JSON形式）、Application Insights統合 |
| エラーハンドリング | 共通ライブラリの標準エラーレスポンス使用 |
| コード品質 | pylint, flake8, black, isortでフォーマット |

---

## 5. データモデル

### 5.1 Tenant エンティティ

#### 5.1.1 スキーマ

```python
class Tenant(BaseModel):
    id: str                          # tenant_{name}
    tenant_id: str                   # パーティションキー（idと同値）
    type: str = "tenant"             # Cosmos DB識別子
    name: str                        # テナント名（一意、英数字とハイフン・アンダースコア）
    display_name: str                # 表示名
    is_privileged: bool = False      # 特権テナントフラグ
    status: str = "active"           # ステータス（active/suspended/deleted）
    plan: str = "standard"           # プラン（free/standard/premium）
    user_count: int = 0              # 所属ユーザー数（Phase 1では手動更新）
    max_users: int = 100             # 最大ユーザー数
    metadata: Optional[dict] = None  # 追加メタデータ（業種、国など）
    created_at: datetime             # 作成日時
    updated_at: datetime             # 更新日時
    created_by: Optional[str]        # 作成者ユーザーID
    updated_by: Optional[str]        # 更新者ユーザーID
```

#### 5.1.2 Cosmos DB格納例

```json
{
  "id": "tenant_acme",
  "tenantId": "tenant_acme",
  "type": "tenant",
  "name": "acme",
  "displayName": "Acme Corporation",
  "isPrivileged": false,
  "status": "active",
  "plan": "standard",
  "userCount": 25,
  "maxUsers": 100,
  "metadata": {
    "industry": "Manufacturing",
    "country": "US"
  },
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-20T15:00:00Z",
  "createdBy": "user_admin_001",
  "updatedBy": "user_admin_001",
  "_ts": 1706178600
}
```

#### 5.1.3 特権テナントの格納例

```json
{
  "id": "tenant_privileged",
  "tenantId": "tenant_privileged",
  "type": "tenant",
  "name": "privileged",
  "displayName": "管理会社",
  "isPrivileged": true,
  "status": "active",
  "plan": "privileged",
  "userCount": 5,
  "maxUsers": 50,
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

#### 5.1.4 インデックス設計

```json
{
  "indexingPolicy": {
    "indexingMode": "consistent",
    "automatic": true,
    "includedPaths": [
      {"path": "/name/?"},
      {"path": "/status/?"},
      {"path": "/isPrivileged/?"},
      {"path": "/createdAt/?"}
    ],
    "excludedPaths": [
      {"path": "/metadata/*"}
    ]
  }
}
```

**インデックス設計の理由**:
- `/name/?`: テナント名検索で使用（一意性チェック）
- `/status/?`: ステータスフィルタで使用
- `/isPrivileged/?`: 特権テナント検索で使用
- `/createdAt/?`: 作成日時でソート
- `/metadata/*`: メタデータは検索対象外のため除外（RU削減）

### 5.2 データ整合性

#### 5.2.1 テナント名の一意性チェック

```python
# app/repositories/tenant_repository.py
async def find_by_name(self, name: str) -> Optional[Tenant]:
    """テナント名でテナントを検索（クロスパーティションクエリ）"""
    query = "SELECT * FROM c WHERE c.type = 'tenant' AND c.name = @name"
    parameters = [{"name": "@name", "value": name}]
    
    results = await self.query(
        query, 
        parameters, 
        partition_key=None,  # クロスパーティションクエリ
        allow_cross_partition=True
    )
    
    return results[0] if results else None

# app/services/tenant_service.py
async def create_tenant(self, tenant_data: TenantCreateRequest, created_by: str) -> Tenant:
    """テナント作成（一意性チェック付き）"""
    # 1. テナント名の一意性チェック
    existing = await self.tenant_repository.find_by_name(tenant_data.name)
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Tenant name already exists"
        )
    
    # 2. テナント作成
    tenant = Tenant(
        id=f"tenant_{tenant_data.name}",
        tenant_id=f"tenant_{tenant_data.name}",
        name=tenant_data.name,
        display_name=tenant_data.display_name,
        plan=tenant_data.plan or "standard",
        max_users=tenant_data.max_users or 100,
        user_count=0,
        status="active",
        is_privileged=False,
        metadata=tenant_data.metadata,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        created_by=created_by
    )
    
    await self.tenant_repository.create(tenant)
    return tenant
```

#### 5.2.2 特権テナント保護

```python
# app/services/tenant_service.py
async def update_tenant(self, tenant_id: str, data: TenantUpdateRequest, updated_by: str) -> Tenant:
    """テナント更新（特権テナント保護）"""
    # 1. テナント取得
    tenant = await self.tenant_repository.get(tenant_id, partition_key=tenant_id)
    
    # 2. 特権テナントチェック
    if tenant.is_privileged:
        raise HTTPException(
            status_code=403,
            detail="Privileged tenant cannot be modified"
        )
    
    # 3. 更新
    if data.display_name is not None:
        tenant.display_name = data.display_name
    if data.plan is not None:
        tenant.plan = data.plan
    if data.max_users is not None:
        tenant.max_users = data.max_users
    if data.metadata is not None:
        tenant.metadata = data.metadata
    
    tenant.updated_at = datetime.utcnow()
    tenant.updated_by = updated_by
    
    await self.tenant_repository.update(tenant_id, tenant_id, tenant.model_dump())
    return tenant
```

---

## 6. エラーコード一覧

### 6.1 テナント関連エラー

| エラーコード | HTTPステータス | メッセージ | 発生条件 |
|------------|--------------|-----------|--------|
| TENANT_001_NOT_FOUND | 404 | Tenant not found | テナントIDが存在しない |
| TENANT_002_DUPLICATE_NAME | 409 | Tenant name already exists | テナント名が重複 |
| TENANT_003_PRIVILEGED_IMMUTABLE | 403 | Privileged tenant cannot be modified | 特権テナントの更新試行 |
| TENANT_004_PRIVILEGED_UNDELETABLE | 403 | Privileged tenant cannot be deleted | 特権テナントの削除試行 |
| TENANT_005_INVALID_NAME_FORMAT | 422 | Invalid tenant name format | テナント名の形式不正 |
| TENANT_006_INVALID_PLAN | 422 | Invalid plan type | プランの値不正 |
| TENANT_007_INVALID_MAX_USERS | 422 | Invalid max users value | 最大ユーザー数の値不正 |

### 6.2 認可エラー

| エラーコード | HTTPステータス | メッセージ | 発生条件 |
|------------|--------------|-----------|--------|
| AUTHZ_001_INSUFFICIENT_ROLE | 403 | Role required: tenant-management:管理者 | ロール不足 |
| AUTHZ_002_TENANT_ISOLATION_VIOLATION | 403 | Cannot access tenant data in different tenant | テナント分離違反 |

### 6.3 バリデーションエラー

| エラーコード | HTTPステータス | メッセージ | 発生条件 |
|------------|--------------|-----------|--------|
| VAL_001_REQUIRED_FIELD_MISSING | 422 | Required field is missing: {field_name} | 必須パラメータ欠如 |
| VAL_002_INVALID_FORMAT | 422 | Invalid format for field: {field_name} | 形式エラー |
| VAL_003_VALUE_OUT_OF_RANGE | 422 | Value out of range for field: {field_name} | 値の範囲外 |

---

## 7. テスト要件

### 7.1 単体テスト

#### 7.1.1 Repository テスト
- **TenantRepository CRUD操作**
  - `test_create_tenant`: テナント作成
  - `test_get_tenant`: テナント取得
  - `test_update_tenant`: テナント更新
  - `test_delete_tenant`: テナント削除
  - `test_find_by_name`: テナント名検索
  - `test_list_tenants`: テナント一覧取得

#### 7.1.2 Service テスト
- **TenantService**
  - `test_create_tenant_success`: 正常作成
  - `test_create_tenant_duplicate_name`: 名前重複エラー
  - `test_update_privileged_tenant_fails`: 特権テナント更新失敗
  - `test_delete_privileged_tenant_fails`: 特権テナント削除失敗
  - `test_validate_tenant_name`: テナント名バリデーション

#### 7.1.3 API テスト
- **テナント管理API**
  - `test_list_tenants_as_privileged`: 特権テナントでの一覧取得
  - `test_list_tenants_as_normal`: 一般テナントでの一覧取得
  - `test_get_tenant_success`: テナント詳細取得成功
  - `test_get_tenant_not_found`: テナント詳細取得失敗（404）
  - `test_create_tenant_success`: テナント作成成功
  - `test_create_tenant_unauthorized`: 権限なし（403）
  - `test_update_tenant_success`: テナント更新成功
  - `test_update_privileged_tenant_fails`: 特権テナント更新失敗
  - `test_delete_tenant_success`: テナント削除成功
  - `test_delete_privileged_tenant_fails`: 特権テナント削除失敗

### 7.2 統合テスト

- Cosmos DBとの統合
- 共通ライブラリとの統合（認証・認可）
- テナント作成から削除までのフロー

### 7.3 セキュリティテスト

| テストケース | 期待結果 |
|------------|---------|
| 認証トークンなしでAPI呼び出し | 401エラー |
| 閲覧者ロールでテナント作成 | 403エラー |
| 他テナントのデータ取得試行 | 403エラー |
| 特権テナントの更新試行 | 403エラー |
| 特権テナントの削除試行 | 403エラー |
| SQLインジェクション試行 | エラーまたは無効な結果 |

### 7.4 パフォーマンステスト

| テストケース | 目標値 | 測定方法 |
|------------|--------|---------|
| テナント一覧取得（単一パーティション） | < 100ms (P95) | Apache JMeter / Locust |
| テナント一覧取得（クロスパーティション） | < 500ms (P95) | Apache JMeter / Locust |
| テナント作成 | < 300ms (P95) | Apache JMeter / Locust |
| 負荷テスト（100 req/秒） | 5分間持続 | Apache JMeter / Locust |

### 7.5 カバレッジ目標

- **行カバレッジ**: 75%以上
- **分岐カバレッジ**: 70%以上
- **関数カバレッジ**: 80%以上

### 7.6 トレーサビリティマトリックス

| 要件ID | API | テストケース | 優先度 |
|-------|-----|-------------|--------|
| BR-TENANT-001 | PUT /api/v1/tenants/{tenant_id} | test_update_privileged_tenant_fails | 高 |
| BR-TENANT-001 | DELETE /api/v1/tenants/{tenant_id} | test_delete_privileged_tenant_fails | 高 |
| BR-TENANT-002 | POST /api/v1/tenants | test_create_tenant_duplicate_name | 高 |
| BR-TENANT-003 | POST /api/v1/tenants | test_create_tenant_default_status | 中 |
| BR-TENANT-007 | GET /api/v1/tenants | test_tenant_isolation_enforcement | 高 |
| US-TENANT-001 | GET /api/v1/tenants | test_list_tenants_with_pagination | 高 |
| US-TENANT-002 | GET /api/v1/tenants/{tenant_id} | test_get_tenant_details | 高 |
| US-TENANT-003 | POST /api/v1/tenants | test_create_tenant_success | 高 |
| US-TENANT-004 | PUT /api/v1/tenants/{tenant_id} | test_update_tenant_success | 高 |
| US-TENANT-005 | DELETE /api/v1/tenants/{tenant_id} | test_delete_tenant_success | 高 |

---

## 8. 依存関係

### 8.1 共通ライブラリ依存

| モジュール | 使用関数/クラス | 用途 |
|----------|--------------|------|
| common.auth.jwt | decode_access_token | JWT検証 |
| common.auth.middleware | JWTAuthenticationMiddleware | JWT認証Middleware |
| common.auth.dependencies | get_current_user, require_role | 依存注入、ロール認可 |
| common.database.cosmos | CosmosDBClient | Cosmos DB接続 |
| common.database.repository | BaseRepository | CRUD操作基底クラス |
| common.logging | setup_logging, get_logger | 構造化ログ |
| common.models.base | BaseModel | モデル基底クラス |
| common.models.errors | ErrorResponse | エラーレスポンス |
| common.middleware.error_handler | ErrorHandlerMiddleware | エラーハンドリング |
| common.middleware.request_id | RequestIDMiddleware | リクエストID生成 |
| common.utils.validators | validate_email | バリデーション |
| common.utils.helpers | generate_id | ヘルパー関数 |

### 8.2 外部サービス依存

| サービス | 用途 | Phase 1実装 |
|---------|------|------------|
| Azure Cosmos DB | テナントデータ永続化 | ✅ |
| Azure Application Insights | ログ・監視 | ✅ |
| 認証認可サービス | JWT検証 | ✅ |

### 8.3 データ依存

- **特権テナント**: システム初期化時に`tenant_privileged`を作成
- **認証認可サービス**: ユーザー情報とロール情報（`created_by`, `updated_by`に使用）

---

## 9. 制約事項

### 9.1 技術的制約

- Python 3.11+
- FastAPI 0.100+
- Cosmos DB パーティション設計に準拠（`tenantId`がパーティションキー）
- 共通ライブラリの使用必須

### 9.2 実装上の制約

- Phase 1ではテナント所属ユーザー管理は未実装（タスク06）
- Phase 1ではドメイン管理は未実装（タスク06）
- `user_count`の自動更新は未実装（Phase 1では手動更新）
- 論理削除は未実装（Phase 1では物理削除）

### 9.3 運用上の制約

- テナント削除は物理削除（Phase 2で論理削除に変更）
- テナント名変更は不可（`name`フィールドは不変）
- 特権テナントの`is_privileged`フラグは変更不可

---

## 10. 受け入れ基準

### 10.1 機能的受け入れ基準

- [ ] 全APIエンドポイントが実装され、動作する
- [ ] GET /api/v1/tenants: テナント一覧取得（ページネーション）
- [ ] GET /api/v1/tenants/{tenant_id}: テナント詳細取得
- [ ] POST /api/v1/tenants: テナント作成（一意性チェック）
- [ ] PUT /api/v1/tenants/{tenant_id}: テナント更新（特権テナント保護）
- [ ] DELETE /api/v1/tenants/{tenant_id}: テナント削除（特権テナント保護）
- [ ] ロールベース認可が動作（閲覧者、管理者）
- [ ] テナント分離が強制される

### 10.2 非機能的受け入れ基準

- [ ] パフォーマンス目標達成（各API応答時間）
- [ ] セキュリティ要件達成（ロール認可、テナント分離、特権テナント保護）
- [ ] テストカバレッジ 75%以上
- [ ] 全テストが合格
- [ ] OpenAPI仕様書が生成される (/docs)

### 10.3 運用的受け入れ基準

- [ ] ローカル環境で起動・動作確認
- [ ] README.md が作成され、起動方法が記載
- [ ] .env.example が作成され、必要な環境変数が記載
- [ ] ヘルスチェックAPI (/health) が動作

---

## 11. リスク分析

| リスク | 影響度 | 発生確率 | 緩和策 |
|-------|--------|---------|--------|
| Cosmos DBパフォーマンス問題 | 中 | 中 | RU/s監視、スケーリング計画、インデックス最適化 |
| テナント分離の不備 | 高 | 低 | BaseRepositoryの3層チェック、テスト徹底 |
| 特権テナント保護の不備 | 高 | 低 | コードレビュー、セキュリティテスト |
| テナント名重複チェックの競合 | 中 | 中 | 一意性チェックのトランザクション化、Cosmos DBのid一意制約活用 |
| ユーザー数カウントの不整合 | 低 | 高 | Phase 2で自動更新機能追加、定期的な整合性チェック |

---

## 12. 成功の定義

### 12.1 短期（Phase 1）

- 全ての受け入れ基準を満たす
- タスク06（テナント管理サービス - ユーザー・ドメイン管理）が本タスクのAPIを使用して実装可能
- テストカバレッジ 75%以上
- パフォーマンス目標達成

### 12.2 長期（Phase 2以降）

- テナント管理サービス起因のインシデント月1件以下
- テナントCRUD操作の成功率 99.9%以上
- テナント作成時間 < 5分（管理操作含む）
- ユーザー満足度向上

---

## 13. 参照ドキュメント

- [コンポーネント設計 - テナント管理サービス](../../arch/components/README.md#4-テナント管理サービス)
- [API設計 - テナント管理サービスAPI](../../arch/api/README.md#4-テナント管理サービスapi)
- [データモデル設計 - テナント管理サービス](../../arch/data/README.md#3-テナント管理サービス-tenant-コンテナ)
- [セキュリティ設計 - テナント分離](../../arch/security/README.md#32-テナント分離)
- [タスク02 - 共通ライブラリ実装](./02-共通ライブラリ実装.md)
- [タスク03 - 認証認可サービス - コアAPI](./03-認証認可サービス-コアAPI.md)
- [タスク04 - 認証認可サービス - ロール管理](./04-認証認可サービス-ロール管理.md)

---

## 14. 付録

### 14.1 ロール定義（Phase 1）

#### テナント管理サービスのロール

```python
TENANT_SERVICE_ROLES = [
    {
        "service_id": "tenant-management",
        "role_name": "全体管理者",
        "description": "特権テナントに対する操作が可能"
    },
    {
        "service_id": "tenant-management",
        "role_name": "管理者",
        "description": "通常のテナントの追加・削除・編集が可能"
    },
    {
        "service_id": "tenant-management",
        "role_name": "閲覧者",
        "description": "テナント情報の参照が可能"
    }
]
```

### 14.2 エラーレスポンス形式

```json
{
  "code": "TENANT_002_DUPLICATE_NAME",
  "message": "Tenant name already exists",
  "timestamp": "2026-02-01T10:00:00Z",
  "request_id": "req_abc123..."
}
```

### 14.3 環境変数

```bash
# Cosmos DB接続
COSMOS_CONNECTION_STRING=AccountEndpoint=https://...
COSMOS_DATABASE_NAME=management-app
COSMOS_TENANT_CONTAINER_NAME=tenants

# JWT検証（認証認可サービスと共有）
JWT_SECRET_KEY=your-secure-secret-key-64-bytes-or-longer
JWT_ALGORITHM=HS256

# ロギング
LOG_LEVEL=INFO

# Application Insights
APPINSIGHTS_INSTRUMENTATIONKEY=your-instrumentation-key
```

---

**ドキュメント終了**
