# 機能仕様書: サービス設定サービス - コアAPI

## 1. はじめに

### 1.1 目的
本仕様書は、サービス設定サービスのコアAPI実装に関する詳細な機能要件と非機能要件を定義します。本サービスは、各テナントが利用可能なサービスを管理し、サービスカタログの一元管理とテナントへのサービス割り当て機能を提供します。

### 1.2 スコープ

**対象範囲**:
- サービスカタログ（Service）の管理
- テナントへのサービス割り当て（ServiceAssignment）の管理
- サービス一覧・詳細取得API
- テナント利用サービス一覧・詳細取得API
- サービス割り当て・削除API

**対象外**（Phase 2以降）:
- ロール情報統合機能（タスク08）
- サービス利用統計・使用量管理
- サービス固有の設定管理（各サービスの責任）
- サービスヘルスチェック監視
- サービス課金・請求管理

### 1.3 用語定義

| 用語 | 定義 |
|------|------|
| サービスカタログ | システムが提供する全サービスの一覧情報 |
| Service | サービスカタログに登録されたサービスエンティティ（例: file-service, messaging-service） |
| ServiceAssignment | テナントに割り当てられたサービスの関連エンティティ |
| 管理対象サービス | テナントが利用可能なモックサービス（ファイル管理、メッセージング、API利用、バックアップ） |
| コアサービス | システムの基盤サービス（認証認可、テナント管理、サービス設定）で、全テナントが暗黙的に利用可能 |
| サービスID | サービスを一意に識別する文字列（例: "file-service", "messaging-service"） |
| 特権テナント | システム全体を管理する管理会社のテナント（tenant_privileged） |
| 一般テナント | クライアント企業のテナント（特権テナント以外） |

## 2. ビジネス要件

### 2.1 ビジネス目標
本サービスは、以下のビジネス目標を達成するために開発されます：

1. **サービス利用の可視化**: 各テナントがどのサービスを利用しているか一元管理
2. **柔軟なサービス提供**: テナントごとに異なるサービスセットを提供可能
3. **運用効率の向上**: サービス割り当ての自動化により、手動設定ミスを削減
4. **スケーラビリティ**: 新規サービス追加が既存システムに影響を与えない

### 2.2 ユーザーストーリー

#### US-01: サービスカタログ閲覧
- **As a** 全体管理者
- **I want** システムが提供する全サービスの一覧を参照したい
- **So that** テナントに割り当て可能なサービスを把握できる

**受入条件**:
- [ ] 全サービスの一覧を取得できる（GET /api/v1/services）
- [ ] サービス名、説明、バージョン、アクティブ状態が含まれる
- [ ] 非アクティブなサービスは表示されない（デフォルト）

#### US-02: テナント利用サービス確認
- **As a** 全体管理者または閲覧者
- **I want** 特定テナントが利用中のサービス一覧を参照したい
- **So that** 現在のサービス利用状況を把握できる

**受入条件**:
- [ ] テナントIDを指定して利用サービス一覧を取得できる（GET /api/v1/tenants/{tenantId}/services）
- [ ] サービス名、割り当て日時、ステータス（active/suspended）が含まれる
- [ ] 特権テナント以外は自テナントのみ参照可能

#### US-03: サービス割り当て
- **As a** 全体管理者
- **I want** テナントに新規サービスを割り当てたい
- **So that** テナントが追加のサービスを利用できるようになる

**受入条件**:
- [ ] テナントIDとサービスIDを指定して割り当てできる（POST /api/v1/tenants/{tenantId}/services）
- [ ] 割り当て成功時、サービスのステータスはactiveになる
- [ ] 重複した割り当ては409エラーを返す
- [ ] 全体管理者のみ実行可能

#### US-04: サービス割り当て解除
- **As a** 全体管理者
- **I want** テナントからサービスを削除したい
- **So that** サービス利用を停止できる

**受入条件**:
- [ ] テナントIDとサービスIDを指定して削除できる（DELETE /api/v1/tenants/{tenantId}/services/{serviceId}）
- [ ] 削除成功時、ServiceAssignmentが物理削除される
- [ ] 全体管理者のみ実行可能

#### US-05: サービス詳細確認
- **As a** 全体管理者または閲覧者
- **I want** 特定サービスの詳細情報を参照したい
- **So that** サービスの仕様や提供機能を確認できる

**受入条件**:
- [ ] サービスIDを指定して詳細情報を取得できる（GET /api/v1/services/{serviceId}）
- [ ] サービス名、説明、バージョン、エンドポイント情報が含まれる

### 2.3 ビジネスルール

#### BR-01: サービスカタログの管理
- システム初期化時に、管理対象サービス（4種類）がサービスカタログに自動登録される
- コアサービス（認証認可、テナント管理、サービス設定）はカタログに明示的に登録されない（暗黙的に全テナントが利用可能）
- サービスカタログの追加・削除は、データベースの直接操作で行う（Phase 1ではAPIは提供しない）

#### BR-02: テナントへのサービス割り当て
- 管理対象サービスのみ、テナントに明示的に割り当て可能
- 割り当て後、そのサービスのロールを該当テナントのユーザーに付与できる
- 同一テナント・同一サービスの重複割り当ては不可

#### BR-03: サービス割り当て解除
- サービス割り当て解除時、関連するロール割り当ても削除すべきだが、Phase 1では手動対応（Phase 2でカスケード削除を実装）
- **タスク08依存**: ロール統合機能実装後、以下のカスケード削除を実装予定
  - ServiceAssignment削除時に、関連するRoleAssignment（該当サービスに属するロール）を自動削除
  - 実装方法: タスク08で実装される`GET /api/v1/services/{serviceId}/roles`を呼び出し、サービス固有ロール一覧を取得し、該当テナントの各ロールに対する`DELETE /api/auth/v1/tenants/{tenantId}/users/*/roles/{roleId}`を実行
- 特権テナントは全サービスに暗黙的にアクセス可能なため、割り当て・削除は不要

#### BR-04: アクセス制御
- サービス一覧・詳細の参照: service-setting: 閲覧者以上
- テナント利用サービス一覧: service-setting: 閲覧者以上（自テナントのみ）
- サービス割り当て・削除: service-setting: 全体管理者のみ

#### BR-05: コアサービスの暗黙的利用可能性
- コアサービス（認証認可、テナント管理、サービス設定）は全テナントが暗黙的に利用可能
- **技術実現方法**: ServiceAssignmentを作成せず、各コアサービスのアクセス制御ミドルウェアで暗黙的に許可
  - 認証認可サービス: JWTを持つ全テナントが自動的にアクセス可能（JWTミドルウェアで許可）
  - テナント管理サービス: 特権テナント（全テナント管理）または自テナント（自テナント情報のみ）へのアクセスを許可
  - サービス設定サービス: 特権テナント（全サービス管理）または自テナント（自テナント利用サービスのみ）へのアクセスを許可
- ServiceカタログにはコアサービスをService Discoverabilityのために登録可能だが、ServiceAssignmentは作成しない

#### BR-06: US-03とタスク08の連携フロー
**フロー**: US-03（サービス割り当て）→ BR-02（ロール付与可能化）→ タスク08（ロール統合機能）

1. **US-03実行**: 全体管理者がテナントにサービスを割り当て（POST /api/v1/tenants/{tenantId}/services）
   - ServiceAssignment作成（status: active）
   - 監査ログ記録

2. **BR-02有効化**: サービス割り当て完了後、該当テナントのユーザーに対してサービス固有ロールの付与が可能になる
   - 例: `file-service`を割り当て後、テナントユーザーに`file-service:editor`ロールを付与可能

3. **タスク08連携**: ロール統合機能が以下を提供（タスク08実装後）
   - `GET /api/v1/services/{serviceId}/roles`: サービス固有ロール一覧取得
   - `POST /api/auth/v1/tenants/{tenantId}/users/{userId}/roles`: ユーザーへのロール付与
   - 付与時、ServiceAssignmentの存在を検証（未割り当てサービスのロールは付与不可）

**検証ロジック（タスク08で実装）**:
```python
async def validate_service_assignment_for_role(
    tenant_id: str,
    service_id: str
) -> bool:
    """ロール付与前にServiceAssignmentの存在を検証"""
    assignment_id = f"assignment_{tenant_id}_{service_id}"
    assignment = await assignment_repository.get(assignment_id, tenant_id)
    return assignment is not None and assignment.status == "active"
```

## 3. 機能要件

### 3.1 機能概要

サービス設定サービスは、以下の主要機能を提供します：

1. **サービスカタログ管理**: システムが提供する全サービスの一覧を保持
2. **サービス割り当て管理**: テナントごとに利用可能なサービスを管理
3. **サービス利用状況の可視化**: テナントがどのサービスを利用しているか確認

### 3.2 機能詳細

#### 3.2.1 サービス一覧取得 (GET /api/v1/services)

**説明**: システムが提供する全サービスの一覧を取得します。

**入力**:
- クエリパラメータ:
  - `is_active` (optional, boolean, default=true): アクティブなサービスのみ表示

**処理**:
1. JWTから現在のユーザー情報を取得
2. ロール認可チェック（service-setting: 閲覧者以上）
3. Cosmos DBから`_system`パーティションのServiceエンティティを取得
4. `is_active`フィルタを適用
5. サービス一覧を返却

**出力**:
```json
{
  "data": [
    {
      "id": "file-service",
      "name": "ファイル管理サービス",
      "description": "ファイルのアップロード・ダウンロード・管理",
      "version": "1.0.0",
      "is_active": true,
      "metadata": {
        "icon": "file-icon.png",
        "category": "storage"
      }
    },
    {
      "id": "messaging-service",
      "name": "メッセージングサービス",
      "description": "メッセージ送受信、チャネル管理",
      "version": "1.0.0",
      "is_active": true,
      "metadata": {
        "icon": "message-icon.png",
        "category": "communication"
      }
    }
  ]
}
```

**エラー**:
- 401 Unauthorized: JWT無効または期限切れ
- 403 Forbidden: 必要なロールがない

**パフォーマンス要件**: < 200ms (P95)

#### 3.2.2 サービス詳細取得 (GET /api/v1/services/{serviceId})

**説明**: 特定サービスの詳細情報を取得します。

**入力**:
- パスパラメータ:
  - `serviceId` (required, string): サービスID（例: "file-service"）

**処理**:
1. JWTから現在のユーザー情報を取得
2. ロール認可チェック（service-setting: 閲覧者以上）
3. Cosmos DBから`_system`パーティションで指定されたServiceを取得
4. 存在しない場合は404エラー
5. サービス詳細を返却

**出力**:
```json
{
  "id": "file-service",
  "name": "ファイル管理サービス",
  "description": "ファイルのアップロード・ダウンロード・管理",
  "version": "1.0.0",
  "base_url": "https://file-service.example.com",
  "role_endpoint": "/api/v1/roles",
  "health_endpoint": "/health",
  "is_active": true,
  "metadata": {
    "icon": "file-icon.png",
    "category": "storage",
    "features": ["upload", "download", "folder management"]
  },
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

**エラー**:
- 401 Unauthorized: JWT無効または期限切れ
- 403 Forbidden: 必要なロールがない
- 404 Not Found: サービスが存在しない

**パフォーマンス要件**: < 100ms (P95)

#### 3.2.3 テナント利用サービス一覧取得 (GET /api/v1/tenants/{tenantId}/services)

**説明**: 特定テナントが利用中のサービス一覧を取得します。

**入力**:
- パスパラメータ:
  - `tenantId` (required, string): テナントID
- クエリパラメータ:
  - `status` (optional, string): ステータスフィルタ（"active"/"suspended"）

**処理**:
1. JWTから現在のユーザー情報を取得
2. ロール認可チェック（service-setting: 閲覧者以上）
3. テナント分離チェック（特権テナント以外は自テナントのみアクセス可能）
4. Cosmos DBから指定テナントのServiceAssignmentを取得（パーティションキー: `tenantId`）
5. `status`フィルタを適用（指定された場合）
6. 各ServiceAssignmentに対応するServiceの詳細情報を取得（並列処理）
   - **並列取得実装**: `asyncio.gather()`と`asyncio.wait_for()`を使用して複数Serviceを同時取得（タイムアウト付き）
   - **タイムアウト設定**: 各Service取得に200msのタイムアウトを設定
   - **エラーハンドリング**: 個別Service取得失敗時もエラーを伝搬せず、警告ログを記録し他のServiceは返却
   - **実装例**:
     ```python
     async def get_service_safe(service_id: str) -> Optional[Service]:
         try:
             # 200msのタイムアウトを設定
             return await asyncio.wait_for(
                 service_repository.get(service_id, "_system"),
                 timeout=0.2
             )
         except asyncio.TimeoutError:
             logger.warning(f"Timeout fetching service {service_id}")
             return None
         except Exception as e:
             logger.warning(f"Failed to fetch service {service_id}: {e}")
             return None
     
     services = await asyncio.gather(
         *[get_service_safe(a.service_id) for a in assignments],
         return_exceptions=False
     )
     # Noneを除外してレスポンスに含める
     valid_services = [s for s in services if s is not None]
     ```
7. サービス一覧を返却

**出力**:
```json
{
  "data": [
    {
      "assignment_id": "assignment_tenant_acme_file-service",
      "service_id": "file-service",
      "service_name": "ファイル管理サービス",
      "status": "active",
      "config": {
        "max_storage": "100GB",
        "max_file_size": "10MB"
      },
      "assigned_at": "2026-01-10T09:00:00Z",
      "assigned_by": "user_admin_001"
    },
    {
      "assignment_id": "assignment_tenant_acme_messaging-service",
      "service_id": "messaging-service",
      "service_name": "メッセージングサービス",
      "status": "active",
      "config": {
        "max_channels": 50,
        "max_members_per_channel": 100
      },
      "assigned_at": "2026-01-15T14:30:00Z",
      "assigned_by": "user_admin_001"
    }
  ]
}
```

**エラー**:
- 401 Unauthorized: JWT無効または期限切れ
- 403 Forbidden: 必要なロールがない、またはテナント分離違反
- 404 Not Found: テナントが存在しない

**パフォーマンス要件**: < 300ms (P95)（並列Service情報取得を含む）

#### 3.2.4 サービス割り当て (POST /api/v1/tenants/{tenantId}/services)

**説明**: テナントに新規サービスを割り当てます。

**入力**:
- パスパラメータ:
  - `tenantId` (required, string): テナントID
- リクエストボディ:
```json
{
  "service_id": "messaging-service",
  "config": {
    "max_channels": 50,
    "max_members_per_channel": 100
  }
}
```

**config検証ルール詳細**:
- `config`フィールドはオプショナル（省略可能）
- 指定する場合はJSONオブジェクト形式（`dict`型）
- 最大サイズ: 10KB（10,240バイト）
- **最大ネストレベル**: 5階層まで（深い階層は可読性とパフォーマンスに悪影響）
- **禁止文字**: 特殊文字（制御文字`\x00-\x1F`、`\x7F`）は値に含めることを禁止
- **JSON Schema基本構造検証**: キーは文字列のみ、値はプリミティブ型（string/number/boolean/null）またはオブジェクト/配列のみ
- サービス固有の検証ルールは**各サービスの責任**（Phase 1ではサービス設定サービスでは検証しない）
- Phase 2以降の拡張: サービスごとのJSON Schemaによる検証機能を追加予定
- **バリデーション実装**:
  ```python
  import re
  
  class ServiceAssignmentCreate(BaseModel):
      service_id: str = Field(
          ..., 
          pattern="^[a-z0-9-]+$",
          max_length=100,
          description="サービスID（最大100文字）"
      )
      config: Optional[Dict[str, Any]] = Field(None, max_length=10240)
      
      @field_validator('config')
      def validate_config(cls, v):
          if v is None:
              return v
          
          # サイズ検証
          json_str = json.dumps(v)
          if len(json_str.encode('utf-8')) > 10240:
              raise ValueError('config must be less than 10KB')
          
          # ネストレベル検証
          def check_depth(obj, current_depth=1, max_depth=5):
              if current_depth > max_depth:
                  raise ValueError(f'config nesting level must be {max_depth} or less')
              if isinstance(obj, dict):
                  for value in obj.values():
                      check_depth(value, current_depth + 1, max_depth)
              elif isinstance(obj, list):
                  for item in obj:
                      check_depth(item, current_depth + 1, max_depth)
          
          check_depth(v)
          
          # 制御文字・特殊文字検証
          control_char_pattern = re.compile(r'[\x00-\x1F\x7F]')
          def check_control_chars(obj):
              if isinstance(obj, str):
                  if control_char_pattern.search(obj):
                      raise ValueError('config values must not contain control characters')
              elif isinstance(obj, dict):
                  for key, value in obj.items():
                      if not isinstance(key, str):
                          raise ValueError('config keys must be strings')
                      check_control_chars(value)
              elif isinstance(obj, list):
                  for item in obj:
                      check_control_chars(item)
              elif not isinstance(obj, (str, int, float, bool, type(None))):
                  raise ValueError('config values must be primitive types, objects, or arrays')
          
          check_control_chars(v)
          
          return v
  ```

**処理**:
1. JWTから現在のユーザー情報を取得
2. ロール認可チェック（service-setting: 全体管理者のみ）
3. **テナント存在確認**（テナント管理サービスAPIで検証）
   - **実装方法**: `GET /api/v1/tenants/{tenantId}`を呼び出し、200ステータスを確認
   - **タイムアウト**: 1秒
   - **エラーハンドリング**: 404の場合は`TENANT_002_NOT_FOUND`エラー、その他は`TENANT_SERVICE_UNAVAILABLE`エラー
   - **実装例**:
     ```python
     async with httpx.AsyncClient(timeout=1.0) as client:
         response = await client.get(
             f"{tenant_service_base_url}/api/v1/tenants/{tenant_id}",
             headers={"Authorization": f"Bearer {jwt_token}"}
         )
         if response.status_code == 404:
             raise HTTPException(status_code=404, detail="Tenant not found")
         elif response.status_code != 200:
             raise HTTPException(status_code=503, detail="Tenant service unavailable")
     ```
4. サービス存在確認（Cosmos DB、`_system`パーティションで検証）
5. サービスがアクティブか確認（`is_active=true`）
6. 重複チェック（同一テナント・同一サービスのServiceAssignmentが存在しないか）
7. **ID長制限検証**（`assignment_{tenantId}_{serviceId}`が255文字以内）
   - tenant_id最大100文字、service_id最大100文字、全体で255文字以内
   - 超過した場合は400エラー（`VALIDATION_002_ID_TOO_LONG`）
8. ServiceAssignmentエンティティ作成
   - `id`: `assignment_{tenantId}_{serviceId}` 形式（決定的ID）
   - `tenant_id`: `tenantId`（パーティションキー）
   - `service_id`: `serviceId`
   - `status`: "active"
   - `config`: リクエストボディのconfig（オプショナル）
   - `assigned_at`: 現在時刻
   - `assigned_by`: 現在のユーザーID
8. Cosmos DBに保存
9. 監査ログ記録（Application Insights）
10. 作成されたServiceAssignmentを返却

**出力**:
```json
{
  "assignment_id": "assignment_tenant_acme_messaging-service",
  "tenant_id": "tenant_acme",
  "service_id": "messaging-service",
  "service_name": "メッセージングサービス",
  "status": "active",
  "config": {
    "max_channels": 50,
    "max_members_per_channel": 100
  },
  "assigned_at": "2026-02-01T10:00:00Z",
  "assigned_by": "user_admin_001"
}
```

**エラー**:
- 400 Bad Request: バリデーションエラー（service_idが空、configが不正な形式）
- 401 Unauthorized: JWT無効または期限切れ
- 403 Forbidden: 必要なロールがない（全体管理者以外）
- 404 Not Found: サービスが存在しない
- 409 Conflict: 同一サービスが既に割り当て済み
- 422 Unprocessable Entity: サービスが非アクティブ（`is_active=false`）

**パフォーマンス要件**: < 300ms (P95)

**ビジネスロジック詳細**:
```python
import httpx

async def assign_service(
    self, 
    tenant_id: str, 
    service_id: str, 
    config: Optional[dict],
    assigned_by: str,
    jwt_token: str
) -> ServiceAssignment:
    """サービス割り当て"""
    # 1. ID長制限検証
    if len(tenant_id) > 100:
        raise HTTPException(
            status_code=400,
            detail="tenant_id must be 100 characters or less"
        )
    if len(service_id) > 100:
        raise HTTPException(
            status_code=400,
            detail="service_id must be 100 characters or less"
        )
    
    assignment_id = f"assignment_{tenant_id}_{service_id}"
    if len(assignment_id) > 255:
        raise HTTPException(
            status_code=400,
            detail="Combined assignment ID must be 255 characters or less"
        )
    
    # 2. テナント存在確認（テナント管理サービスAPI）
    try:
        async with httpx.AsyncClient(timeout=1.0) as client:
            response = await client.get(
                f"{self.tenant_service_base_url}/api/v1/tenants/{tenant_id}",
                headers={"Authorization": f"Bearer {jwt_token}"}
            )
            if response.status_code == 404:
                raise HTTPException(
                    status_code=404,
                    detail="Tenant not found"
                )
            elif response.status_code != 200:
                raise HTTPException(
                    status_code=503,
                    detail="Tenant service unavailable"
                )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Tenant service timeout"
        )
    
    # 3. サービス存在確認
    service = await self.service_repository.get(service_id, partition_key="_system")
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # 4. サービスアクティブ確認
    if not service.is_active:
        raise HTTPException(
            status_code=422,
            detail="Cannot assign inactive service"
        )
    
    # 5. 重複チェック（決定的ID）
    existing = await self.assignment_repository.get(assignment_id, tenant_id)
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Service is already assigned to this tenant"
        )
    
    # 6. ServiceAssignment作成
    assignment = ServiceAssignment(
        id=assignment_id,
        tenant_id=tenant_id,
        service_id=service_id,
        status="active",
        config=config or {},
        assigned_at=datetime.utcnow(),
        assigned_by=assigned_by
    )
    
    await self.assignment_repository.create(assignment)
    
    # 7. 監査ログ記録
    await log_audit(
        action="service.assign",
        target_type="service_assignment",
        target_id=assignment_id,
        performed_by=assigned_by,
        changes={"service_id": service_id, "tenant_id": tenant_id}
    )
    
    return assignment
```

#### 3.2.5 サービス割り当て解除 (DELETE /api/v1/tenants/{tenantId}/services/{serviceId})

**説明**: テナントからサービスを削除し、利用を停止します。

**入力**:
- パスパラメータ:
  - `tenantId` (required, string): テナントID
  - `serviceId` (required, string): サービスID

**処理**:
1. JWTから現在のユーザー情報を取得
2. ロール認可チェック（service-setting: 全体管理者のみ）
3. ServiceAssignment存在確認（`assignment_{tenantId}_{serviceId}`）
4. 存在しない場合は404エラー
5. Cosmos DBから物理削除
6. 監査ログ記録（Application Insights、`deleted_by`に現在のユーザーID）
7. 204 No Contentを返却

**出力**: レスポンスボディなし（204 No Content）

**エラー**:
- 401 Unauthorized: JWT無効または期限切れ
- 403 Forbidden: 必要なロールがない（全体管理者以外）
- 404 Not Found: ServiceAssignmentが存在しない

**パフォーマンス要件**: < 200ms (P95)

**Phase 2での改善予定**:
- **論理削除への変更**:
  - **変更理由**: 監査要件の強化、削除履歴の保持、誤削除時の復旧容易性
  - **実装方法**: `status`フィールドに`deleted`を追加、`deleted_at`（削除日時）、`deleted_by`（削除実行者）を記録
  - **クエリ変更**: デフォルトで`status != 'deleted'`のフィルタを追加
  - **物理削除との比較**:
  
| 項目 | 物理削除 (Phase 1) | 論理削除 (Phase 2) |
|------|-------------------|-------------------|
| **監査追跡** | Application Insightsのログのみ | データベースに削除履歴を永続化 |
| **復旧容易性** | 不可（バックアップから復旧） | `status`を`active`に変更するだけ |
| **ストレージコスト** | 低い | 削除データが累積（定期的なアーカイブ必要） |
| **クエリ複雑度** | 低い | フィルタ条件の追加が必要 |
| **実装複雑度** | 低い | 中程度 |

- **データマイグレーション手順（Phase 1 → Phase 2移行時）**:
  1. **事前準備**:
     - 論理削除フィールドを追加した新しいServiceAssignmentスキーマを定義
     - マイグレーションスクリプト`scripts/migrate_to_soft_delete.py`を作成
  
  2. **マイグレーション実行**:
     - **ステップ1**: 既存の全ServiceAssignmentに`status`フィールドを追加（デフォルト値: `"active"`）
       ```python
       async def migrate_add_status_field():
           query = "SELECT * FROM c WHERE c.type = 'service_assignment' AND NOT IS_DEFINED(c.status)"
           assignments = await cosmos_client.query_items(query)
           for assignment in assignments:
               assignment['status'] = 'active'
               await cosmos_client.upsert_item(assignment)
       ```
     - **ステップ2**: Application Insightsログから削除履歴を抽出し、論理削除レコードを作成
       ```python
       async def migrate_deleted_assignments():
           # Application Insightsから「service.unassign」アクションを抽出
           deleted_logs = await query_app_insights(
               query="customEvents | where name == 'audit' and properties.action == 'service.unassign'"
           )
           for log in deleted_logs:
               assignment_id = log['target_id']
               tenant_id = log['changes']['tenant_id']
               service_id = log['changes']['service_id']
               deleted_at = log['timestamp']
               deleted_by = log['performed_by']
               
               # 論理削除レコードを作成
               assignment = ServiceAssignment(
                   id=assignment_id,
                   tenant_id=tenant_id,
                   service_id=service_id,
                   status='deleted',
                   config={},
                   assigned_at=deleted_at,  # 正確な割り当て日時が不明な場合
                   assigned_by='unknown',
                   deleted_at=deleted_at,
                   deleted_by=deleted_by
               )
               await cosmos_client.upsert_item(assignment)
       ```
     - **ステップ3**: アプリケーションコードを論理削除対応版にデプロイ
     - **ステップ4**: マイグレーション結果を検証
       ```python
       async def validate_migration():
           # 全ServiceAssignmentに`status`フィールドが存在するか確認
           query = "SELECT COUNT(1) as count FROM c WHERE c.type = 'service_assignment' AND NOT IS_DEFINED(c.status)"
           result = await cosmos_client.query_items(query)
           if result[0]['count'] > 0:
               raise Exception(f"{result[0]['count']} assignments missing status field")
           
           # 論理削除レコード数がApplication Insightsログと一致するか確認
           deleted_count_db = await cosmos_client.query_items(
               "SELECT COUNT(1) as count FROM c WHERE c.type = 'service_assignment' AND c.status = 'deleted'"
           )
           deleted_count_logs = await query_app_insights(
               "customEvents | where name == 'audit' and properties.action == 'service.unassign' | count"
           )
           if deleted_count_db[0]['count'] != deleted_count_logs:
               logger.warning(f"Deleted count mismatch: DB={deleted_count_db[0]['count']}, Logs={deleted_count_logs}")
       ```
  
  3. **ロールバック手順**（マイグレーション失敗時）:
     - アプリケーションコードをPhase 1版に戻す
     - 追加した`status`フィールドを削除（オプショナル、既存コードは無視するため影響なし）
     - 作成した論理削除レコードを削除
  
  4. **ダウンタイム**:
     - ゼロダウンタイム移行可能（後方互換性あり）
     - Phase 1コードは`status`フィールドを無視するため、マイグレーション中も動作可能

- **カスケード削除の実装**:
  - タスク08で実装される`GET /api/v1/services/{serviceId}/roles`と`DELETE /api/auth/v1/tenants/{tenantId}/users/*/roles/{roleId}`を活用
  - ServiceAssignment削除時、該当サービスの全ロールを取得し、テナント内の全ユーザーから該当ロールを削除
  - トランザクション不整合リスク: Cosmos DBはマルチドキュメントトランザクション非対応のため、Sagaパターンまたは補償トランザクションで実装

**ビジネスロジック詳細**:
```python
async def remove_service_assignment(
    self, 
    tenant_id: str, 
    service_id: str, 
    deleted_by: str
) -> None:
    """サービス割り当て解除"""
    # 1. ServiceAssignment取得
    assignment_id = f"assignment_{tenant_id}_{service_id}"
    assignment = await self.assignment_repository.get(assignment_id, tenant_id)
    
    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Service assignment not found"
        )
    
    # 2. 物理削除（Phase 1）
    await self.assignment_repository.delete(assignment_id, tenant_id)
    
    # 3. 監査ログ記録（Application Insights）
    await log_audit(
        action="service.unassign",
        target_type="service_assignment",
        target_id=assignment_id,
        performed_by=deleted_by,
        changes={"service_id": service_id, "tenant_id": tenant_id}
    )
    
    logger.info(f"Service unassigned: {service_id} from {tenant_id} by {deleted_by}")
```

### 3.3 データモデル

#### 3.3.1 Service エンティティ

```python
class Service(BaseModel):
    id: str                          # サービスID（"file-service"等）
    tenant_id: str = "_system"       # パーティションキー（システム共通）
    type: str = "service"            # Cosmos DB識別子
    name: str                        # サービス名（"ファイル管理サービス"等）
    description: str                 # サービス説明
    version: str = "1.0.0"           # バージョン
    base_url: Optional[str]          # サービスのベースURL
    role_endpoint: Optional[str] = "/api/v1/roles"    # ロール情報取得エンドポイント
    health_endpoint: Optional[str] = "/health"        # ヘルスチェックエンドポイント
    is_active: bool = True           # アクティブ状態
    metadata: Optional[dict] = None  # 追加メタデータ（アイコン、カテゴリ等）
    created_at: datetime             # 作成日時
    updated_at: datetime             # 更新日時
```

**Cosmos DB格納例**:
```json
{
  "id": "file-service",
  "tenantId": "_system",
  "type": "service",
  "name": "ファイル管理サービス",
  "description": "ファイルのアップロード・ダウンロード・管理",
  "version": "1.0.0",
  "baseUrl": "https://file-service.example.com",
  "roleEndpoint": "/api/v1/roles",
  "healthEndpoint": "/health",
  "isActive": true,
  "metadata": {
    "icon": "file-icon.png",
    "category": "storage"
  },
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z",
  "_ts": 1704067200
}
```

**パーティション分離の設計**:
- **パーティションキー**: `tenant_id = "_system"`（全Serviceエンティティ共通）
- **設計根拠**:
  - **クエリ効率**: 全サービス一覧取得時、単一パーティションからの取得でRU消費を最小化（1 RU）
  - **データ局所性**: 全Serviceが同一物理パーティションに格納され、ネットワークホップが不要
  - **運用シンプル性**: クロスパーティションクエリが不要で、パフォーマンスが予測可能
  - **スケーラビリティ**: Phase 1では4サービス、Phase 2でも最大20サービス程度で、単一パーティションの10GBおよび10,000 RU/s制限に収まる

- **Cosmos DB一貫性レベル**: **Session Consistency**（セッション一貫性）
  - **選択理由**:
    - 同一セッション内での読み取り一貫性を保証（書き込み後すぐに読み取り可能）
    - Strong Consistencyよりも低レイテンシ・高スループット
    - Eventual Consistencyよりも予測可能な動作
  - **影響**:
    - サービス割り当て直後、同一ユーザーの次のリクエストで即座に反映
    - 異なるセッション（異なるユーザー・リージョン）では最大数秒の遅延あり（通常は1秒未満）
  - **設定方法**: Cosmos DB SDK初期化時に`consistency_level="Session"`を指定

- **代替案比較**:

| 設計案 | 利点 | 欠点 | 評価 |
|--------|------|------|------|
| **_system統一パーティション** (採用) | クエリ効率最高、RU消費最小、運用シンプル | 単一パーティション制限（10GB/10K RU/s）に依存 | ◎ |
| **サービスIDごとにパーティション** | 理論的な無制限スケール | サービス一覧取得でクロスパーティションクエリ必要、RU消費増加 | △ |
| **カテゴリごとにパーティション** | カテゴリ別フィルタ時に効率的 | サービスカテゴリが固定され、柔軟性が低い | × |

**インデックス設計**:
```json
{
  "indexingPolicy": {
    "indexingMode": "consistent",
    "automatic": true,
    "includedPaths": [
      {"path": "/isActive/?"},
      {"path": "/name/?"},
      {"path": "/createdAt/?"}
    ],
    "excludedPaths": [
      {"path": "/metadata/*"}
    ]
  }
}
```

#### 3.3.2 ServiceAssignment エンティティ

```python
class ServiceAssignment(BaseModel):
    id: str                          # assignment_{tenantId}_{serviceId}
    tenant_id: str                   # パーティションキー
    type: str = "service_assignment" # Cosmos DB識別子
    service_id: str                  # サービスID
    status: str = "active"           # ステータス（active/suspended）
    config: Optional[dict] = None    # サービス固有設定（オプショナル）
    assigned_at: datetime            # 割り当て日時
    assigned_by: str                 # 割り当て実行者ユーザーID
```

**Cosmos DB格納例**:
```json
{
  "id": "assignment_tenant_acme_file-service",
  "tenantId": "tenant_acme",
  "type": "service_assignment",
  "serviceId": "file-service",
  "status": "active",
  "config": {
    "maxStorage": "100GB",
    "maxFileSize": "10MB"
  },
  "assignedAt": "2026-01-10T09:00:00Z",
  "assignedBy": "user_admin_001",
  "_ts": 1704700800
}
```

**インデックス設計**:
```json
{
  "indexingPolicy": {
    "indexingMode": "consistent",
    "automatic": true,
    "includedPaths": [
      {"path": "/serviceId/?"},
      {"path": "/status/?"},
      {"path": "/assignedAt/?"}
    ],
    "excludedPaths": [
      {"path": "/config/*"}
    ]
  }
}
```

**ID設計**:
- 決定的ID: `assignment_{tenant_id}_{service_id}`
- **設計根拠**:
  - **重複防止**: Cosmos DBの主キー制約により、同一IDの重複挿入が自動的に409エラーになり、アプリケーションレベルでの重複チェックが不要
  - **クエリ効率**: IDから直接対象を特定可能（`GET`操作でパーティションキーとIDのみで取得可能、追加クエリ不要）
  - **監査追跡**: ログやエラーメッセージでIDを見るだけで、どのテナント・サービスの割り当てか即座に判別可能
  - **べき等性**: 同じリクエストを複数回実行しても、409エラーで失敗するため、副作用がない

- **代替案比較**:

| 設計案 | 利点 | 欠点 | 評価 |
|--------|------|------|------|
| **決定的ID** (採用) | 重複防止が自動、クエリ効率が高い、IDが人間可読 | IDフォーマットの変更が困難 | ◎ |
| **UUID** | IDの衝突リスクがゼロ、フォーマット自由 | 重複チェックに追加クエリ必要、IDが人間非可読 | △ |
| **自動採番** | 実装がシンプル | 重複チェックに追加クエリ必要、分散環境で採番が複雑 | × |
| **複合インデックス** (tenant_id + service_id) | 正規化されたデータモデル | Cosmos DBではセカンダリユニークインデックス非対応、クエリコスト増加 | × |

**クエリ例**:
```sql
-- テナントの利用サービス一覧
SELECT * FROM c 
WHERE c.tenantId = @tenant_id
  AND c.type = 'service_assignment'
ORDER BY c.assignedAt DESC

-- アクティブなサービス割り当てのみ
SELECT * FROM c 
WHERE c.tenantId = @tenant_id
  AND c.type = 'service_assignment'
  AND c.status = 'active'

-- 特定サービスを利用しているテナント数（クロスパーティションクエリ、管理用）
SELECT COUNT(1) as count FROM c 
WHERE c.type = 'service_assignment' 
  AND c.serviceId = @service_id
  AND c.status = 'active'
```

### 3.4 システム初期化

#### 3.4.1 サービスカタログの初期データ

システム初期化時、以下の管理対象サービスをカタログに登録します：

```python
initial_services = [
    Service(
        id="file-service",
        name="ファイル管理サービス",
        description="ファイルのアップロード・ダウンロード・管理",
        version="1.0.0",
        base_url="https://file-service.example.com",
        role_endpoint="/api/v1/roles",
        health_endpoint="/health",
        is_active=True,
        metadata={
            "icon": "file-icon.png",
            "category": "storage"
        }
    ),
    Service(
        id="messaging-service",
        name="メッセージングサービス",
        description="メッセージ送受信、チャネル管理",
        version="1.0.0",
        base_url="https://messaging-service.example.com",
        role_endpoint="/api/v1/roles",
        health_endpoint="/health",
        is_active=True,
        metadata={
            "icon": "message-icon.png",
            "category": "communication"
        }
    ),
    Service(
        id="api-service",
        name="API利用サービス",
        description="外部API利用状況の監視・制御",
        version="1.0.0",
        base_url="https://api-service.example.com",
        role_endpoint="/api/v1/roles",
        health_endpoint="/health",
        is_active=True,
        metadata={
            "icon": "api-icon.png",
            "category": "integration"
        }
    ),
    Service(
        id="backup-service",
        name="バックアップサービス",
        description="データバックアップ・リストア",
        version="1.0.0",
        base_url="https://backup-service.example.com",
        role_endpoint="/api/v1/roles",
        health_endpoint="/health",
        is_active=True,
        metadata={
            "icon": "backup-icon.png",
            "category": "operations"
        }
    )
]

async def initialize_service_catalog():
    """サービスカタログの初期化"""
    for service in initial_services:
        try:
            await service_repository.create(service)
            logger.info(f"Service registered: {service.id}")
        except CosmosHttpResponseError as e:
            if e.status_code == 409:  # 既に存在する場合はスキップ
                logger.info(f"Service already exists: {service.id}")
            else:
                raise
```

**実行タイミング推奨**:

1. **開発環境**: アプリケーション起動時に自動実行
   - `app/main.py`の`@app.on_event("startup")`で`initialize_service_catalog()`を呼び出し
   - 既存データがある場合はスキップ（べき等性を保証）

2. **本番環境**: デプロイパイプラインで専用の初期化スクリプトを実行
   - **理由**: アプリケーション起動を高速化、初期化エラーがアプリケーション起動をブロックしないようにする
   - **実装**: `scripts/initialize_services.py`として分離し、CI/CDパイプラインの「デプロイ後フック」で実行
   - **スクリプト例**:
     ```python
     # scripts/initialize_services.py
     import asyncio
     from app.utils.initialization import initialize_service_catalog
     
     async def main():
         try:
             await initialize_service_catalog()
             print("Service catalog initialized successfully")
         except Exception as e:
             print(f"Initialization failed: {e}")
             raise
     
     if __name__ == "__main__":
         asyncio.run(main())
     ```
   - **CI/CD統合**: `.github/workflows/deploy.yml`または`infra/scripts/deploy.sh`で以下を追加:
     ```bash
     # デプロイ後にサービスカタログを初期化
     python scripts/initialize_services.py
     ```

3. **ステージング環境**: 自動テスト前に初期化スクリプトを実行
   - テストデータの一貫性を保証

## 4. 非機能要件

### 4.1 性能要件

| API | 目標応答時間 (P95) | 最大応答時間 (P99) | 根拠 |
|-----|-------------------|-------------------|------|
| GET /api/v1/services | < 200ms | < 500ms | カタログ参照（単一パーティションクエリ） |
| GET /api/v1/services/{serviceId} | < 100ms | < 300ms | 単一アイテム取得 |
| GET /api/v1/tenants/{tenantId}/services | < 300ms | < 600ms | 並列Service情報取得を含む |
| POST /api/v1/tenants/{tenantId}/services | < 300ms | < 700ms | 存在確認と作成 |
| DELETE /api/v1/tenants/{tenantId}/services/{serviceId} | < 200ms | < 500ms | 単一アイテム削除 |

**スループット要件**:
- 最大同時リクエスト: 100 req/sec（初期構成）
- 平均Cosmos DB RU消費: 50 RU/sec
- ピーク時RU消費: 500 RU/sec

### 4.2 セキュリティ要件

#### 4.2.1 認証
- 全エンドポイントでJWT認証必須（共通ライブラリ使用）
- JWT有効期限: 60分
- トークン検証失敗時は401 Unauthorizedを返却

#### 4.2.2 認可
- ロールベースアクセス制御（RBAC）を実装
- 必要ロール:
  - サービス一覧・詳細: service-setting: 閲覧者以上
  - テナント利用サービス一覧: service-setting: 閲覧者以上（自テナントのみ）
  - サービス割り当て・削除: service-setting: 全体管理者のみ

#### 4.2.3 テナント分離
- 特権テナント以外は自テナントのServiceAssignmentのみアクセス可能
- パーティションキー（tenant_id）を常に指定し、クロステナントアクセスを防止
- 共通ライブラリBaseRepositoryの3層セキュリティチェックを活用

#### 4.2.4 入力検証
- Pydantic v2による自動バリデーション
- サービスID形式: `^[a-z0-9-]+$`（小文字英数字とハイフン）
- テナントID形式: `^tenant_[a-zA-Z0-9_]+$`
- configフィールド: JSONオブジェクト（最大10KB）

### 4.3 可用性要件

- **SLA**: 99.9%（年間ダウンタイム8.76時間以内）
- **RTO（目標復旧時間）**: 1時間
- **RPO（目標復旧時点）**: 1時間
- **依存サービス**: 認証認可サービス（クリティカル）、Cosmos DB（クリティカル）

### 4.4 拡張性要件

- **新規サービス追加**: データベース直接操作で追加（Phase 1）、Phase 2でAPI提供
- **テナント数**: 最大100テナント（Phase 1）
- **サービス数**: 最大20サービス（Phase 1では4サービス）

### 4.5 運用要件

#### 4.5.1 ログ
- 構造化ログ（JSON形式）をApplication Insightsに送信
- 監査ログ: サービス割り当て・削除操作を記録
- ログレベル: INFO（本番環境）、DEBUG（開発環境）

#### 4.5.2 監視
- Application Insightsによるメトリクス収集
- 監視項目:
  - API応答時間
  - エラー率（5xx）
  - Cosmos DB RU消費量
  - ServiceAssignment作成・削除件数

#### 4.5.3 アラート
- API応答時間がP95で1秒を超えた場合
- 5xxエラーが1分間に10件を超えた場合
- Cosmos DB RU消費量が4000 RU/sを超えた場合

## 5. 制約条件

### 5.1 技術的制約
- **Cosmos DB**: NoSQLデータベースのため、リレーショナルな結合クエリは使用不可
- **パーティションキー**: `tenant_id`または`_system`を使用し、変更不可
- **環境**: Azure App Service (B1プラン) の制約内で動作すること
- **Python**: 3.11+を使用
- **FastAPI**: 0.100+を使用

### 5.2 ビジネス的制約
- **Phase 1スコープ**: ロール情報統合機能は含まない（タスク08）
- **コスト制約**: 最小限のAzureリソースで構成
- **納期**: タスク06完了後、2日以内に実装完了

## 6. 依存関係

### 6.1 先行タスク
- タスク01: インフラ基盤構築（完了）
- タスク02: 共通ライブラリ実装（完了）
- タスク03: 認証認可サービス - コアAPI（完了）
- タスク04: 認証認可サービス - ロール管理（完了）
- タスク05: テナント管理サービス - コアAPI（完了）
- タスク06: テナント管理サービス - ユーザー・ドメイン管理（完了）

### 6.2 後続タスク
- タスク08: サービス設定サービス - ロール統合（本タスク完了後に開始可能）
  - **依存内容**: タスク07で実装されたServiceAssignmentを利用して、ロール付与時の検証を実装
  - **連携ポイント**: `assignment_repository.get(assignment_id, tenant_id)`でServiceAssignmentの存在を確認
  - **実装タイミング**: タスク07のServiceAssignment CRUD完了後、タスク08でロール付与前検証ロジックを追加
- タスク09: モックサービス基盤（並行開始可能）
  - **依存内容**: なし（独立して開始可能）

### 6.3 外部依存
- **認証認可サービス**: JWT検証
- **Cosmos DB**: データ永続化
- **Application Insights**: ログ・メトリクス収集

## 7. エラー処理

### 7.1 エラーコード一覧

| エラーコード | HTTPステータス | 条件 | メッセージ | 対応 |
|-------------|--------------|------|------------|------|
| AUTH_001_INVALID_TOKEN | 401 | JWT無効または期限切れ | Invalid or expired token | トークン再取得 |
| AUTH_002_INSUFFICIENT_ROLE | 403 | 必要なロールがない | Insufficient role for this operation | 管理者に権限を依頼 |
| TENANT_001_ACCESS_DENIED | 403 | テナント分離違反 | Cross-tenant access denied | 自テナントのリソースのみ参照 |
| SERVICE_001_NOT_FOUND | 404 | サービスが存在しない | Service not found | サービスIDを確認 |
| SERVICE_002_INACTIVE | 422 | サービスが非アクティブ | Cannot assign inactive service | アクティブなサービスを選択 |
| ASSIGNMENT_001_NOT_FOUND | 404 | ServiceAssignmentが存在しない | Service assignment not found | 割り当て済みサービスを確認 |
| ASSIGNMENT_002_DUPLICATE | 409 | 重複した割り当て | Service is already assigned to this tenant | 既存の割り当てを確認 |
| VALIDATION_001_INVALID_INPUT | 400 | バリデーションエラー | Request validation failed | リクエストボディを確認 |
| VALIDATION_002_ID_TOO_LONG | 400 | ID長制限超過 | Assignment ID exceeds 255 characters | tenant_idまたはservice_idを短縮 |
| VALIDATION_003_CONFIG_INVALID | 400 | config検証エラー | Invalid config structure | configのネストレベル・文字制約を確認 |
| TENANT_002_NOT_FOUND | 404 | テナントが存在しない | Tenant not found | テナントIDを確認 |
| TENANT_SERVICE_UNAVAILABLE | 503 | テナント管理サービス接続エラー | Tenant service unavailable | リトライ後、サポートに連絡 |
| DB_001_CONNECTION_ERROR | 503 | Cosmos DB接続エラー | Database connection error | リトライ後、サポートに連絡 |
| DB_002_TIMEOUT | 504 | Cosmos DBタイムアウト | Database operation timeout | リトライ |
| INTERNAL_001_UNEXPECTED | 500 | 予期しないエラー | An unexpected error occurred | ログを確認、サポートに連絡 |

### 7.2 エラーレスポンス形式

```json
{
  "error": {
    "code": "ASSIGNMENT_002_DUPLICATE",
    "message": "Service is already assigned to this tenant",
    "details": [
      {
        "field": "service_id",
        "message": "file-service is already assigned",
        "value": "file-service"
      }
    ],
    "timestamp": "2026-02-01T10:00:00Z",
    "request_id": "req_abc123"
  }
}
```

### 7.3 エラーハンドリング戦略

#### 7.3.1 リトライ可能なエラー
- Cosmos DB一時的エラー（429 RU不足、503サービス一時停止）
- タイムアウト（408）

**リトライポリシー**:
- 最大3回リトライ
- 指数バックオフ（初回: 100ms、2回目: 200ms、3回目: 400ms）

#### 7.3.2 リトライ不可なエラー
- 認証エラー（401）
- 認可エラー（403）
- バリデーションエラー（400）
- リソース不在（404）
- 競合エラー（409）

これらのエラーは即座にクライアントに返却し、リトライしない。

## 8. テスト観点

### 8.1 機能テスト

#### 8.1.1 サービス一覧取得
- [ ] 全サービスが取得できること
- [ ] `is_active=true`のフィルタが正しく動作すること
- [ ] `is_active=false`のサービスがデフォルトで除外されること
- [ ] 認証なしでアクセスすると401エラーになること
- [ ] 閲覧者ロール以上でアクセスできること

#### 8.1.2 サービス詳細取得
- [ ] 指定したサービスの詳細が取得できること
- [ ] 存在しないサービスIDで404エラーになること
- [ ] 認証なしでアクセスすると401エラーになること

#### 8.1.3 テナント利用サービス一覧取得
- [ ] 自テナントの利用サービス一覧が取得できること
- [ ] 特権テナントは全テナントの利用サービスを取得できること
- [ ] 一般テナントは他テナントの利用サービスを取得できないこと（403エラー）
- [ ] `status`フィルタが正しく動作すること
- [ ] 存在しないテナントIDで404エラーになること
- [ ] 並列Service情報取得で一部のServiceが取得できない場合も、他のServiceは正常に返却されること
- [ ] 並列Service情報取得時のエラーが警告ログに記録されること

#### 8.1.4 サービス割り当て
- [ ] 全体管理者がサービスを割り当てできること
- [ ] 全体管理者以外は割り当てできないこと（403エラー）
- [ ] 同一サービスの重複割り当ては409エラーになること
- [ ] 非アクティブなサービスは割り当てできないこと（422エラー）
- [ ] 存在しないサービスIDで404エラーになること
- [ ] 監査ログが記録されること

#### 8.1.5 サービス割り当て解除
- [ ] 全体管理者がサービスを削除できること
- [ ] 全体管理者以外は削除できないこと（403エラー）
- [ ] 存在しないServiceAssignmentで404エラーになること
- [ ] 監査ログが記録されること

### 8.2 非機能テスト

#### 8.2.1 性能テスト
- [ ] 各APIのP95応答時間が要件を満たすこと
- [ ] 100 req/secの同時リクエストに耐えられること
- [ ] Cosmos DB RU消費量が想定範囲内であること

#### 8.2.2 セキュリティテスト
- [ ] テナント分離が正しく機能すること
- [ ] 不正なJWTでアクセスできないこと
- [ ] 必要なロールがない場合はアクセスできないこと
- [ ] SQLインジェクションに対して脆弱でないこと

**テナント分離違反テスト手順（具体化）**:

1. **テスト準備**:
   ```python
   # テナントAとテナントBを作成
   tenant_a = "tenant_company_a"
   tenant_b = "tenant_company_b"
   
   # テナントAにサービス割り当て
   assignment_a = await assign_service(tenant_a, "file-service")
   
   # テナントBの全体管理者トークンを取得
   token_b = await get_jwt_token(user_id="user_admin_b", tenant_id=tenant_b)
   ```

2. **違反テストケース1: 他テナントのServiceAssignment直接取得**:
   ```python
   # テナントBのトークンでテナントAのServiceAssignmentを取得試行
   response = await client.get(
       f"/api/v1/tenants/{tenant_a}/services",
       headers={"Authorization": f"Bearer {token_b}"}
   )
   assert response.status_code == 403
   assert response.json()["error"]["code"] == "TENANT_001_ACCESS_DENIED"
   ```

3. **違反テストケース2: パーティションキー直接指定による取得試行**:
   ```python
   # テナントBのトークンで、パーティションキーを偽装してテナントAのデータ取得試行
   # （Repository層で検証されることを確認）
   assignment_id = f"assignment_{tenant_a}_file-service"
   
   # 内部的にはtenant_bのパーティションキーで検証される
   assignment = await assignment_repository.get(
       assignment_id,
       partition_key=tenant_a,  # 偽装パーティションキー
       current_user={"tenant_id": tenant_b}  # 実際のユーザーはテナントB
   )
   # BaseRepositoryの3層セキュリティチェックで403エラーになることを確認
   assert assignment is None or raises HTTPException(status_code=403)
   ```

4. **違反テストケース3: クロスパーティションクエリによる全データ取得試行**:
   ```python
   # 特権テナント以外でクロスパーティションクエリは不可
   response = await client.get(
       "/api/v1/tenants/all/services",  # 不正なエンドポイント
       headers={"Authorization": f"Bearer {token_b}"}
   )
   assert response.status_code == 404  # エンドポイント自体が存在しない
   ```

5. **正常ケース: 特権テナントは全テナントアクセス可能**:
   ```python
   # 特権テナントのトークンを取得
   token_privileged = await get_jwt_token(
       user_id="user_admin_privileged",
       tenant_id="tenant_privileged"
   )
   
   # テナントAのServiceAssignmentを取得
   response = await client.get(
       f"/api/v1/tenants/{tenant_a}/services",
       headers={"Authorization": f"Bearer {token_privileged}"}
   )
   assert response.status_code == 200
   assert len(response.json()["data"]) > 0
   ```

#### 8.2.3 障害テスト
- [ ] Cosmos DB一時停止時にリトライが機能すること
- [ ] タイムアウト時に適切なエラーが返却されること
- [ ] 予期しないエラー時に500エラーが返却されること

### 8.3 統合テスト

#### 8.3.1 認証認可サービスとの連携
- [ ] JWT検証が正しく動作すること
- [ ] ロールベース認可が正しく動作すること

#### 8.3.2 システム初期化
- [ ] サービスカタログ初期データが正しく登録されること
- [ ] 既存データがある場合はスキップされること

## 9. 実装ガイドライン

### 9.1 ディレクトリ構造

```
src/service-setting-service/
├── app/
│   ├── main.py              # FastAPIアプリケーションエントリポイント
│   ├── config.py            # 設定管理
│   ├── dependencies.py      # 依存注入
│   ├── api/                 # APIエンドポイント
│   │   ├── __init__.py
│   │   ├── services.py      # サービスカタログAPI
│   │   └── assignments.py   # サービス割り当てAPI
│   ├── models/              # Pydanticモデル
│   │   ├── __init__.py
│   │   ├── service.py       # Serviceモデル
│   │   └── assignment.py    # ServiceAssignmentモデル
│   ├── schemas/             # リクエスト/レスポンススキーマ
│   │   ├── __init__.py
│   │   ├── service.py       # Service関連スキーマ
│   │   └── assignment.py    # ServiceAssignment関連スキーマ
│   ├── services/            # ビジネスロジック
│   │   ├── __init__.py
│   │   ├── service_catalog_service.py
│   │   └── assignment_service.py
│   ├── repositories/        # データアクセス層
│   │   ├── __init__.py
│   │   ├── service_repository.py
│   │   └── assignment_repository.py
│   └── utils/               # ユーティリティ
│       ├── __init__.py
│       └── initialization.py # システム初期化
├── tests/                   # テストコード
│   ├── __init__.py
│   ├── conftest.py          # pytestフィクスチャ
│   ├── test_api_services.py
│   ├── test_api_assignments.py
│   ├── test_service_catalog_service.py
│   ├── test_assignment_service.py
│   ├── test_service_repository.py
│   └── test_assignment_repository.py
├── pytest.ini               # pytest設定
├── requirements.txt         # 依存パッケージ
├── requirements-dev.txt     # 開発用依存パッケージ
└── README.md               # サービスドキュメント
```

### 9.2 技術スタック

- **フレームワーク**: FastAPI 0.100+
- **言語**: Python 3.11+
- **バリデーション**: Pydantic v2
- **非同期DB**: Azure Cosmos DB SDK (async)
- **共通ライブラリ**: `common` パッケージ（認証、データベース、ロギング等）
- **テストフレームワーク**: pytest, pytest-asyncio
- **カバレッジ**: pytest-cov（目標: 80%以上）

### 9.3 実装順序

1. **Phase 1: データモデルとリポジトリ層**
   - Service、ServiceAssignmentモデル定義
   - ServiceRepository、AssignmentRepository実装
   - 単体テスト（Repository層）

2. **Phase 2: サービス層**
   - ServiceCatalogService実装
   - AssignmentService実装
   - 単体テスト（Service層）

3. **Phase 3: API層**
   - サービスカタログAPI実装（GET /services, GET /services/{serviceId}）
   - サービス割り当てAPI実装（GET/POST/DELETE /tenants/{tenantId}/services）
   - 統合テスト（API層）

4. **Phase 4: システム初期化**
   - サービスカタログ初期化スクリプト
   - 初期化テスト

5. **Phase 5: 総合テスト**
   - E2Eテスト
   - 性能テスト
   - セキュリティテスト

### 9.4 共通ライブラリの使用

```python
# app/main.py
from fastapi import FastAPI
from common.middleware.error_handler import ErrorHandlerMiddleware
from common.middleware.request_id import RequestIDMiddleware
from common.auth.middleware import JWTAuthenticationMiddleware
from common.logging import setup_logging
from common.database.cosmos import CosmosDBClient

# アプリケーション初期化
app = FastAPI(title="Service Setting Service", version="1.0.0")

# ミドルウェア追加
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(JWTAuthenticationMiddleware)

# ロガー設定
logger = setup_logging("service-setting-service", log_level="INFO")

# Cosmos DB接続
cosmos_client = CosmosDBClient.get_instance(
    connection_string=os.getenv("COSMOS_DB_CONNECTION_STRING"),
    database_name="management-app"
)

# ヘルスチェックエンドポイント
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "service-setting-service"}
```

### 9.5 環境変数

```bash
# .env（開発環境）
COSMOS_DB_CONNECTION_STRING=AccountEndpoint=https://...
JWT_SECRET_KEY=your-secret-key-here
LOG_LEVEL=DEBUG
```

```bash
# Azure App Service環境変数（本番環境）
COSMOS_DB_CONNECTION_STRING=<Azure Cosmos DB接続文字列>
JWT_SECRET_KEY=<JWT秘密鍵>
LOG_LEVEL=INFO
APPINSIGHTS_INSTRUMENTATIONKEY=<Application Insights キー>
```

## 10. 変更履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|----------|------|---------|--------|
| 1.0.0 | 2026-02-01 | 初版作成 | Development Team |

---

**レビュー承認**:
- [ ] ビジネス要件レビュー（Product Owner）
- [ ] アーキテクチャレビュー（Tech Lead）
- [ ] セキュリティレビュー（Security Team）
- [ ] 実装可能性レビュー（Development Team）
