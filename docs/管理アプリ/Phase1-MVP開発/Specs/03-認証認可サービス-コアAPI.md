# 仕様書: 認証認可サービス - コアAPI

**バージョン**: 1.0.0  
**ドキュメントID**: SPEC-AUTH-001  
**作成日**: 2026-02-01  
**ステータス**: Draft

## 変更履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|----------|------|---------|--------|
| 1.0.0 | 2026-02-01 | 初版作成 | システム |

---

## 1. 概要

### 1.1 目的とビジネス価値

認証認可サービスは、マルチテナント管理アプリケーションにおける**ユーザー認証とJWT管理の中核**を担います。

#### ビジネス価値
- **セキュアなアクセス制御**: JWT による統一された認証・認可メカニズム
- **テナント分離の保証**: データ漏洩リスクの最小化
- **開発効率の向上**: 他サービスは認証ロジックを実装不要
- **監査証跡の確保**: 全ての認証・ユーザー操作を記録
- **スケーラビリティ**: マイクロサービスアーキテクチャに最適化

### 1.2 スコープ

**Phase 1 に含まれる機能**:
- ✅ ユーザー認証（ログイン/ログアウト）
- ✅ JWT発行・検証
- ✅ ユーザーCRUD操作
- ✅ ロールベース認可（基本）
- ✅ テナント分離の強制

**Phase 2 以降の機能**:
- ⏭ パスワードリセット
- ⏭ 多要素認証 (MFA)
- ⏭ トークンリフレッシュ
- ⏭ トークンブラックリスト（Redis）
- ⏭ OAuth 2.0 / OpenID Connect

---

## 2. 用語定義

### 2.1 ロール定義（Phase 1）

#### 2.1.1 認証認可サービスのロール

| ロール名 | 権限 | 説明 |
|---------|------|------|
| 全体管理者 | ユーザーのCRUD操作、ロール割り当て | システム全体の管理者。全テナントのユーザーを操作可能 |
| 閲覧者 | ユーザー情報の参照 | 自テナントのユーザー情報を参照できるが、変更は不可 |

**ロール階層**:
- 全体管理者 > 閲覧者

**Phase 1の制約**:
- ロール管理機能（タスク04）未実装のため、ロール割り当てはデータベースへの直接登録で対応
- JWT内のrolesフィールドは空配列で発行される

#### 2.1.2 特権テナント

特権テナント（Privileged Tenant）は、システム管理を行う管理会社専用のテナントです。

**識別方法**:
- テナントID: `tenant_privileged`（固定値）
- データモデルの `isPrivileged: true` フラグ

**特権**:
- 全テナントのデータへアクセス可能
- テナント自体の編集・削除が禁止される（保護対象）

---

## 3. ビジネス要件

### 2.1 認証機能要件

| 要件ID | 要件名 | 説明 | 優先度 |
|-------|--------|------|--------|
| BR-AUTH-001 | ログイン機能 | ユーザー名/パスワードでログイン可能 | 高 |
| BR-AUTH-002 | JWT発行 | ログイン成功時にJWTを発行 | 高 |
| BR-AUTH-003 | JWT検証 | 他サービスからのJWT検証リクエストに応答 | 高 |
| BR-AUTH-004 | ログアウト | ログアウト機能（Phase 2で完全実装） | 中 |
| BR-AUTH-005 | 現在のユーザー情報取得 | JWTから現在のユーザー情報を取得 | 高 |
| BR-AUTH-006 | パスワード検証 | bcrypt による安全な検証 | 高 |
| BR-AUTH-007 | アカウント状態チェック | 無効化されたアカウントはログイン不可 | 高 |

### 2.2 ユーザー管理要件

| 要件ID | 要件名 | 説明 | 優先度 |
|-------|--------|------|--------|
| BR-USER-001 | ユーザー作成 | 全体管理者がユーザーを作成可能 | 高 |
| BR-USER-002 | ユーザー一覧取得 | テナント内のユーザー一覧を取得 | 高 |
| BR-USER-003 | ユーザー詳細取得 | 特定ユーザーの詳細情報を取得 | 高 |
| BR-USER-004 | ユーザー更新 | ユーザー情報を更新可能 | 高 |
| BR-USER-005 | ユーザー削除 | ユーザーを削除可能 | 中 |
| BR-USER-006 | ユーザー名の一意性 | テナント内でユーザー名は一意 | 高 |
| BR-USER-007 | メールアドレスの一意性 | テナント内でメールアドレスは一意 | 高 |
| BR-USER-008 | パスワードポリシー | **最小12文字**、大小英数字記号を含む（NIST/OWASP推奨） | 高 |

### 2.3 セキュリティ要件

| 要件ID | 要件名 | 説明 | 優先度 |
|-------|--------|------|--------|
| BR-SEC-001 | パスワードハッシュ化 | bcrypt (cost factor 12) でハッシュ化 | 高 |
| BR-SEC-002 | JWT署名 | HS256 アルゴリズムで署名 | 高 |
| BR-SEC-003 | JWT有効期限 | デフォルト60分、設定可能 | 高 |
| BR-SEC-004 | テナント分離 | 特権テナント以外は自テナントのみアクセス | 高 |
| BR-SEC-005 | ロールベース認可 | 共通ライブラリの `require_role` を使用 | 高 |
| BR-SEC-006 | レート制限 | ログインAPI: 5回/分（Phase 2） | 中 |
| BR-SEC-007 | 監査ログ | 全操作を記録（作成者、更新者など） | 高 |

---

## 4. 機能仕様

### 3.1 データモデル

#### 3.1.1 User モデル

```python
class User(BaseModel):
    id: str                     # user_{UUID}
    tenant_id: str               # パーティションキー
    type: str = "user"           # Cosmos DB識別子
    username: str                # ユーザー名（テナント内一意）
    email: EmailStr              # メールアドレス（テナント内一意）
    password_hash: str           # bcrypt ハッシュ
    display_name: str            # 表示名
    is_active: bool = True       # アカウント有効/無効
    created_at: datetime         # 作成日時
    updated_at: datetime         # 更新日時
    created_by: Optional[str]    # 作成者ID
    updated_by: Optional[str]    # 更新者ID
```

**Cosmos DB格納例**:
```json
{
  "id": "user_123e4567-e89b-12d3-a456-426614174000",
  "tenantId": "tenant-acme",
  "type": "user",
  "username": "john.doe",
  "email": "john@acme.com",
  "passwordHash": "$2b$12$...",
  "displayName": "John Doe",
  "isActive": true,
  "createdAt": "2026-02-01T10:00:00Z",
  "updatedAt": "2026-02-01T10:00:00Z"
}
```

#### 3.1.2 TokenData モデル

```python
class TokenData(BaseModel):
    user_id: str                # sub クレーム
    tenant_id: str               # テナントID
    username: str                # ユーザー名
    roles: List[Dict[str, str]] # ロール情報
    exp: int                     # 有効期限（Unix Timestamp）
    iat: int                     # 発行日時
    jti: str                     # JWT ID
```

### 3.2 認証API仕様

#### 3.2.1 POST /api/v1/auth/login - ログイン

**リクエスト**:
```json
{
  "username": "john.doe",
  "password": "SecureP@ssw0rd"
}
```

**レスポンス** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "user_123e4567...",
    "username": "john.doe",
    "email": "john@acme.com",
    "display_name": "John Doe",
    "tenant_id": "tenant-acme",
    "is_active": true
  }
}
```

**エラーレスポンス**:
- `401 Unauthorized`: 認証失敗（ユーザー名またはパスワードが不正）
- `403 Forbidden`: アカウント無効化
- `422 Unprocessable Entity`: バリデーションエラー

**ビジネスロジック**:
1. ユーザー名でユーザーを検索
   - **クエリ方法**: `SELECT * FROM c WHERE c.username = @username`
   - **パーティションキー**: クロスパーティションクエリ（`allow_cross_partition=True`）
   - **パフォーマンス**: インデックス使用、最大100ms以内
2. パスワード検証（共通ライブラリの`verify_password`使用、bcrypt.verify）
3. `is_active` チェック（falseの場合は403エラー）
4. JWT生成（共通ライブラリの`create_access_token`使用、ロール情報は空配列）
5. ログイン成功時、監査ログ記録（Application Insights）

**パフォーマンス要件**:
- 応答時間: < 500ms（P95）
- スループット: 100 req/秒

#### 3.2.2 POST /api/v1/auth/verify - JWT検証

**リクエスト**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**レスポンス** (200 OK):
```json
{
  "sub": "user_123e4567...",
  "username": "john.doe",
  "tenant_id": "tenant-acme",
  "roles": [],
  "exp": 1738412400,
  "iat": 1738408800,
  "jti": "jwt_456e7890..."
}
```

**エラーレスポンス**:
- `401 Unauthorized`: トークン無効、期限切れ、署名不正

**ビジネスロジック**:
1. Authorization ヘッダーからトークン抽出
2. 共通ライブラリ `decode_access_token` で検証
3. ペイロードを返却

**用途**:
- 他マイクロサービスからの JWT検証リクエスト
- BFF からの検証リクエスト

#### 3.2.3 POST /api/v1/auth/logout - ログアウト

**リクエスト**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**レスポンス** (200 OK):
```json
{
  "message": "ログアウトしました"
}
```

**Phase 1 の実装**:
- 現時点ではトークン無効化なし（クライアント側で削除）
- Phase 2 で Redis によるブラックリスト実装

#### 3.2.4 GET /api/v1/auth/me - 現在のユーザー情報取得

**リクエスト**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**レスポンス** (200 OK):
```json
{
  "id": "user_123e4567...",
  "username": "john.doe",
  "email": "john@acme.com",
  "display_name": "John Doe",
  "tenant_id": "tenant-acme",
  "is_active": true,
  "created_at": "2026-02-01T10:00:00Z"
}
```

**ビジネスロジック**:
1. JWT から `user_id`, `tenant_id` を抽出（共通ライブラリ Middleware）
2. Cosmos DB から最新のユーザー情報を取得
3. レスポンス返却

### 3.3 ユーザー管理API仕様

#### 3.3.1 GET /api/v1/users - ユーザー一覧取得

**認可**: 閲覧者以上

**クエリパラメータ**:
- `tenant_id` (required): テナントID
- `skip` (optional, default=0): ページネーション
- `limit` (optional, default=100): 取得件数

**レスポンス** (200 OK):
```json
[
  {
    "id": "user_123e4567...",
    "username": "john.doe",
    "email": "john@acme.com",
    "display_name": "John Doe",
    "tenant_id": "tenant-acme",
    "is_active": true,
    "created_at": "2026-02-01T10:00:00Z"
  }
]
```

**テナント分離**:
- 特権テナント: 全テナントのユーザーを取得可能
- 一般テナント: 自テナントのユーザーのみ取得可能

#### 3.3.2 GET /api/v1/users/{user_id} - ユーザー詳細取得

**認可**: 閲覧者以上

**パスパラメータ**:
- `user_id` (required): ユーザーID

**クエリパラメータ**:
- `tenant_id` (required): テナントID

**レスポンス** (200 OK):
```json
{
  "id": "user_123e4567...",
  "username": "john.doe",
  "email": "john@acme.com",
  "display_name": "John Doe",
  "tenant_id": "tenant-acme",
  "is_active": true,
  "created_at": "2026-02-01T10:00:00Z",
  "updated_at": "2026-02-01T10:00:00Z"
}
```

**エラーレスポンス**:
- `404 Not Found`: ユーザーが存在しない
- `403 Forbidden`: テナント分離違反

#### 3.3.3 POST /api/v1/users - ユーザー作成

**認可**: 全体管理者

**リクエスト**:
```json
{
  "username": "jane.smith",
  "email": "jane@acme.com",
  "password": "SecureP@ssw0rd",
  "display_name": "Jane Smith",
  "tenant_id": "tenant-acme"
}
```

**レスポンス** (201 Created):
```json
{
  "id": "user_789e0123...",
  "username": "jane.smith",
  "email": "jane@acme.com",
  "display_name": "Jane Smith",
  "tenant_id": "tenant-acme",
  "is_active": true,
  "created_at": "2026-02-01T11:00:00Z"
}
```

**バリデーション**:
- ユーザー名: テナント内で一意
- メールアドレス: テナント内で一意、形式チェック
- パスワード: **最小12文字**、大小英数字記号を含む（共通ライブラリの`validate_password_strength`使用）

**ビジネスロジック**:
1. バリデーション実施
2. パスワードを bcrypt でハッシュ化（cost factor 12）
3. ユーザーオブジェクト作成
4. Cosmos DB に保存
5. 監査ログ記録（`created_by` に現在のユーザーID）

#### 3.3.4 PUT /api/v1/users/{user_id} - ユーザー更新

**認可**: 全体管理者

**パスパラメータ**:
- `user_id` (required): ユーザーID

**クエリパラメータ**:
- `tenant_id` (required): テナントID

**リクエスト**:
```json
{
  "display_name": "Jane Doe Smith",
  "email": "jane.smith@acme.com",
  "is_active": false
}
```

**レスポンス** (200 OK):
```json
{
  "id": "user_789e0123...",
  "username": "jane.smith",
  "email": "jane.smith@acme.com",
  "display_name": "Jane Doe Smith",
  "tenant_id": "tenant-acme",
  "is_active": false,
  "updated_at": "2026-02-01T12:00:00Z"
}
```

**ビジネスロジック**:
1. ユーザー取得
2. 更新フィールドをマージ
3. `updated_at` を現在時刻に更新
4. 監査ログ記録（`updated_by` に現在のユーザーID）

#### 3.3.5 DELETE /api/v1/users/{user_id} - ユーザー削除

**認可**: 全体管理者

**パスパラメータ**:
- `user_id` (required): ユーザーID

**クエリパラメータ**:
- `tenant_id` (required): テナントID

**レスポンス** (204 No Content):
（レスポンスボディなし）

**ビジネスロジック**:
1. ユーザー取得
2. Cosmos DB から削除
3. 監査ログ記録（`deleted_by` に現在のユーザーID）

---

## 5. 非機能要件

### 4.1 パフォーマンス

| 項目 | 目標値 | 測定方法 |
|------|--------|---------|
| ログインAPI応答時間 | < 500ms (P95) | Application Insights |
| JWT検証応答時間 | < 50ms (P95) | Application Insights |
| ユーザーCRUD応答時間 | < 200ms (P95) | Application Insights |
| スループット | 100 req/秒 | 負荷テスト |

### 5.2 セキュリティ

#### 5.2.1 JWT秘密鍵管理

**Phase 1の実装**:
- 環境変数名: `JWT_SECRET_KEY`
- 最小長: 64文字以上（512ビット）
- 形式: ランダムな英数字文字列
- 生成方法: `openssl rand -base64 64`

**ローテーション方針**:
- Phase 1: 手動ローテーション（緊急時のみ）
- Phase 2: Azure Key Vault統合、自動ローテーション（90日ごと）

**セキュリティガイドライン**:
- 秘密鍵は `.env` ファイルに保存し、`.gitignore` に追加
- 本番環境は Azure App Service の環境変数で管理
- 秘密鍵変更時は全JWTが無効化されることを通知

#### 5.2.2 セキュリティ要件一覧

| 要件 | 実装方法 |
|------|--------|
| パスワードハッシュ | bcrypt (cost factor 12) |
| JWT署名アルゴリズム | HS256（理由: Phase 1では秘密鍵の管理がシンプル、Phase 2でRS256検討） |
| JWT秘密鍵管理 | 環境変数 `JWT_SECRET_KEY`、最小64文字 |
| 平文パスワード保護 | ログに出力禁止、共通ライブラリのマスキング使用 |
| テナント分離 | BaseRepository の3層チェック + アプリケーション層チェック |
| ロールベース認可 | 共通ライブラリの `require_role` デコレータ |
| レート制限 | Phase 2 で実装（ログイン: 5回/分） |
| 監査ログ | 全操作（作成・更新・削除）を記録 |

### 4.3 可用性

| 項目 | 目標値 |
|------|--------|
| 稼働率 | 99.9% |
| 復旧時間 (RTO) | < 1時間 |
| データ損失許容 (RPO) | < 5分 |

### 4.4 スケーラビリティ

- **水平スケーリング**: Azure App Service の自動スケーリング
- **Cosmos DBスケーリング**: 自動スケーリング（RU/s）
- **初期スループット**: 400 RU/s
- **同時接続数**: 最大1,000接続

### 4.5 保守性

- **コードカバレッジ**: 75%以上
- **ドキュメント**: README.md、OpenAPI仕様書（/docs）
- **ロギング**: 構造化ログ（JSON形式）、Application Insights統合
- **エラーハンドリング**: 共通ライブラリの標準エラーレスポンス使用

---

## 6. エラーコード一覧

### 6.1 認証エラー

| エラーコード | HTTPステータス | メッセージ | 発生条件 |
|------------|--------------|-----------|--------|
| AUTH_001_INVALID_CREDENTIALS | 401 | ユーザー名またはパスワードが不正です | 認証失敗 |
| AUTH_002_ACCOUNT_DISABLED | 403 | アカウントが無効化されています | is_active=false |
| AUTH_003_TOKEN_EXPIRED | 401 | トークンの有効期限が切れています | JWT期限切れ |
| AUTH_004_TOKEN_INVALID | 401 | トークンが無効です | JWT署名不正・形式不正 |
| AUTH_005_TOKEN_MISSING | 401 | 認証トークンが必要です | Authorizationヘッダー欠如 |

### 6.2 ユーザー管理エラー

| エラーコード | HTTPステータス | メッセージ | 発生条件 |
|------------|--------------|-----------|--------|
| USER_001_NOT_FOUND | 404 | ユーザーが見つかりません | ユーザーID不存在 |
| USER_002_DUPLICATE_USERNAME | 409 | ユーザー名は既に使用されています | ユーザー名重複 |
| USER_003_DUPLICATE_EMAIL | 409 | メールアドレスは既に使用されています | メール重複 |
| USER_004_WEAK_PASSWORD | 422 | パスワードが条件を満たしていません | パスワードポリシー違反 |
| USER_005_INVALID_EMAIL | 422 | メールアドレスの形式が不正です | メール形式エラー |

### 6.3 認可エラー

| エラーコード | HTTPステータス | メッセージ | 発生条件 |
|------------|--------------|-----------|--------|
| AUTHZ_001_INSUFFICIENT_ROLE | 403 | この操作を実行する権限がありません | ロール不足 |
| AUTHZ_002_TENANT_ISOLATION_VIOLATION | 403 | 他テナントのデータにはアクセスできません | テナント分離違反 |

### 6.4 バリデーションエラー

| エラーコード | HTTPステータス | メッセージ | 発生条件 |
|------------|--------------|-----------|--------|
| VAL_001_REQUIRED_FIELD_MISSING | 422 | 必須フィールドが不足しています | 必須パラメータ欠如 |
| VAL_002_INVALID_FORMAT | 422 | フィールドの形式が不正です | 形式エラー |

---

## 7. テスト要件

### 5.1 単体テスト

#### 5.1.1 Repository テスト
- UserRepository CRUD操作
- ユーザー名検索
- メールアドレス検索
- テナント内一覧取得

#### 5.1.2 Service テスト
- AuthService: 認証ロジック、パスワード検証、JWT生成
- UserService: ユーザー作成・更新・削除、バリデーション

#### 5.1.3 API テスト
- 認証API: ログイン成功/失敗、JWT検証、ログアウト、/me
- ユーザー管理API: CRUD操作、権限チェック

### 5.2 統合テスト

- Cosmos DB との統合
- 共通ライブラリとの統合
- JWT発行から検証までのフロー

### 5.3 セキュリティテスト

| テストケース | 期待結果 |
|------------|---------|
| 不正パスワードでログイン | 401エラー |
| 無効化されたアカウントでログイン | 403エラー |
| 期限切れJWTで検証 | 401エラー |
| 不正署名JWTで検証 | 401エラー |
| テナント分離違反（他テナントのユーザー取得） | 403エラー |
| 権限不足（閲覧者でユーザー作成） | 403エラー |

### 5.4 パフォーマンステスト

- ログインAPI: 100 req/秒で5分間
- JWT検証API: 500 req/秒で5分間
- 応答時間が目標値以内

### 5.5 カバレッジ目標

- **行カバレッジ**: 75%以上
- **分岐カバレッジ**: 70%以上
- **関数カバレッジ**: 80%以上

### 7.6 トレーサビリティマトリックス

| 要件ID | API | テストケース | 優先度 |
|-------|-----|-------------|--------|
| BR-AUTH-001 | POST /api/v1/auth/login | test_api_auth::test_login_success | 高 |
| BR-AUTH-002 | POST /api/v1/auth/login | test_api_auth::test_jwt_issued | 高 |
| BR-AUTH-003 | POST /api/v1/auth/verify | test_api_auth::test_verify_token | 高 |
| BR-AUTH-004 | POST /api/v1/auth/logout | test_api_auth::test_logout | 中 |
| BR-AUTH-005 | GET /api/v1/auth/me | test_api_auth::test_get_me | 高 |
| BR-USER-001 | POST /api/v1/users | test_api_users::test_create_user | 高 |
| BR-USER-002 | GET /api/v1/users | test_api_users::test_list_users | 高 |
| BR-USER-003 | GET /api/v1/users/{user_id} | test_api_users::test_get_user | 高 |
| BR-USER-004 | PUT /api/v1/users/{user_id} | test_api_users::test_update_user | 高 |
| BR-USER-005 | DELETE /api/v1/users/{user_id} | test_api_users::test_delete_user | 中 |
| BR-SEC-001 | - | test_service_auth::test_password_hash | 高 |
| BR-SEC-004 | - | test_api_users::test_tenant_isolation | 高 |
| BR-SEC-005 | - | test_api_users::test_role_authorization | 高 |

---

## 8. 依存関係

### 8.1 共通ライブラリ依存

| モジュール | 使用関数/クラス | 用途 |
|----------|--------------|------|
| common.auth.jwt | create_access_token, decode_access_token | JWT生成・検証 |
| common.auth.middleware | JWTAuthenticationMiddleware | JWT認証Middleware |
| common.auth.dependencies | get_current_user, require_role | 依存注入、ロール認可 |
| common.database.cosmos | CosmosDBClient | Cosmos DB接続 |
| common.database.repository | BaseRepository | CRUD操作基底クラス |
| common.logging | setup_logging, get_logger | 構造化ログ |
| common.models.base | BaseModel | モデル基底クラス |
| common.models.errors | ErrorResponse | エラーレスポンス |
| common.middleware.error_handler | ErrorHandlerMiddleware | エラーハンドリング |
| common.middleware.request_id | RequestIDMiddleware | リクエストID生成 |
| common.utils.validators | validate_email, validate_password_strength | バリデーション |
| common.utils.helpers | hash_password, verify_password, generate_id | ヘルパー関数 |

### 8.2 外部サービス依存

| サービス | 用途 | Phase 1実装 |
|---------|------|------------|
| Azure Cosmos DB | ユーザーデータ永続化 | ✅ |
| Azure Application Insights | ログ・監視 | ✅ |
| Azure Key Vault | JWT秘密鍵管理 | ⏭ Phase 2 |

---

## 9. 制約事項

### 6.1 技術的制約

- Python 3.11+
- FastAPI 0.100+
- Cosmos DB パーティション設計に準拠
- 共通ライブラリの使用必須

### 6.2 実装上の制約

- ロール管理機能はタスク04で実装（Phase 1では空配列）
- パスワードリセット機能は Phase 2
- トークンブラックリスト（ログアウト）は Phase 2
- レート制限機能は Phase 2

### 6.3 運用上の制約

- JWT秘密鍵の変更時は全トークンが無効化
- ユーザー削除は物理削除（Phase 2で論理削除検討）

---

## 10. 受け入れ基準

### 7.1 機能的受け入れ基準

- [ ] 全APIエンドポイントが実装され、動作する
- [ ] ログインAPI: ユーザー認証、JWT発行
- [ ] JWT検証API: トークン検証、ペイロード返却
- [ ] ログアウトAPI: 実装済み（Phase 1では簡易実装）
- [ ] /me API: 現在のユーザー情報取得
- [ ] ユーザー管理API: CRUD操作が動作
- [ ] ロールベース認可が動作（閲覧者、全体管理者）
- [ ] テナント分離が強制される

### 7.2 非機能的受け入れ基準

- [ ] パフォーマンス目標達成（ログイン < 500ms, JWT検証 < 50ms）
- [ ] セキュリティ要件達成（bcrypt, JWT署名、テナント分離）
- [ ] テストカバレッジ 75%以上
- [ ] 全テストが合格
- [ ] OpenAPI仕様書が生成される (/docs)

### 7.3 運用的受け入れ基準

- [ ] ローカル環境で起動・動作確認
- [ ] README.md が作成され、起動方法が記載
- [ ] .env.example が作成され、必要な環境変数が記載
- [ ] ヘルスチェックAPI (/health) が動作

---

## 11. リスク分析

| リスク | 影響度 | 発生確率 | 緩和策 |
|-------|--------|---------|--------|
| JWT秘密鍵の漏洩 | 高 | 低 | 環境変数管理、Phase 2で Key Vault移行 |
| パスワードポリシー不足 | 中 | 中 | バリデーションの厳格化、Phase 2で強化 |
| Cosmos DB パフォーマンス問題 | 中 | 中 | RU/s 監視、スケーリング計画 |
| テナント分離の不備 | 高 | 低 | BaseRepository の3層チェック、テスト徹底 |
| レート制限未実装 | 中 | 高 | Phase 2 で実装、監視強化 |

---

## 12. 成功の定義

### 9.1 短期（Phase 1）

- 全ての受け入れ基準を満たす
- タスク04（ロール管理）、タスク05（テナント管理）が共通ライブラリと認証サービスを使用して実装可能
- テストカバレッジ 75%以上
- パフォーマンス目標達成

### 9.2 長期（Phase 2以降）

- 認証サービス起因のインシデント月1件以下
- ログイン成功率 99.5%以上
- JWT検証失敗率 0.1%以下
- ユーザー満足度向上

---

## 13. 参照ドキュメント

- [コンポーネント設計 - 認証認可サービス](../../arch/components/README.md#3-認証認可サービス)
- [API設計 - 認証認可サービスAPI](../../arch/api/README.md#3-認証認可サービスapi)
- [データモデル設計 - 認証認可サービス](../../arch/data/README.md#2-認証認可サービス-auth-コンテナ)
- [セキュリティ設計 - 認証](../../arch/security/README.md#2-認証-authentication)
- [タスク02 - 共通ライブラリ実装](./02-共通ライブラリ実装.md)

---

## 14. 付録

### 11.1 JWT ペイロード例

```json
{
  "sub": "user_123e4567-e89b-12d3-a456-426614174000",
  "username": "john.doe",
  "tenant_id": "tenant-acme",
  "roles": [],
  "exp": 1738412400,
  "iat": 1738408800,
  "jti": "jwt_456e7890-ab12-34cd-ef56-789012345678"
}
```

### 11.2 エラーレスポンス形式

```json
{
  "code": "AUTHENTICATION_FAILED",
  "message": "ユーザー名またはパスワードが不正です",
  "timestamp": "2026-02-01T10:00:00Z",
  "request_id": "req_abc123..."
}
```

---

**ドキュメント終了**
