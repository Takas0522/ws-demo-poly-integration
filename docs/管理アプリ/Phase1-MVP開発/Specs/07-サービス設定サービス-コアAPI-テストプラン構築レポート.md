# テストプラン構築レポート

## 対象機能
タスク07「サービス設定サービス - コアAPI」

**対象モジュール**:
- Service、ServiceAssignment管理のModel
- Schema（特にconfig検証ロジック）
- Repository（ServiceRepository、ServiceAssignmentRepository）
- Service（ServiceService、ServiceAssignmentService）
- API（サービスカタログAPI、サービス割り当てAPI）

## テストケース数

### レイヤー別テストケース数

| レイヤー | 正常系 | 異常系 | 境界値 | 合計 |
|---------|-------|-------|-------|------|
| **Model層** | 3 | 2 | 2 | **7件** |
| - Service Model | 3 | 2 | 2 | 7件 |
| - ServiceAssignment Model | 3 | 3 | 2 | 8件 |
| **Schema層** | 4 | 2 | 4 | **10件** |
| - ServiceAssignmentCreate Schema | 4 | 2 | 4 | 10件 |
| **Repository層** | 9 | 1 | 0 | **10件** |
| - ServiceRepository | 9 | 1 | 0 | 10件 |
| - ServiceAssignmentRepository | 9 | 1 | 0 | 10件 |
| **Service層** | 6 | 1 | 0 | **7件** |
| - ServiceService | 6 | 1 | 0 | 7件 |
| - ServiceAssignmentService | 5 | 7 | 0 | 12件 |
| **API層** | 4 | 1 | 0 | **5件** |
| - サービスカタログAPI | 3 | 2 | 0 | 5件 |
| - サービス割り当てAPI | 4 | 8 | 0 | 12件 |
| **合計** | **31件** | **14件** | **6件** | **51件** |

### 詳細テストケース分類

#### Model層（15件）
- **Service Model**: 7件
  - 正常系: 有効なデータでモデル作成、デフォルト値設定、ネストメタデータ受け入れ
  - 異常系: 空ID、不正な形式のID
  - 境界値: IDが100文字でOK、101文字でエラー

- **ServiceAssignment Model**: 8件
  - 正常系: 有効なデータでモデル作成、configなし作成
  - 異常系: 不正tenant_id形式、不正service_id形式、不正status値
  - 境界値: IDが255文字でOK、256文字でエラー

#### Schema層（10件）
- **ServiceAssignmentCreate Schema**: 10件
  - 正常系: 有効なconfig、configなし、プリミティブ型、配列
  - 異常系: 制御文字含む、非文字列キー
  - 境界値: 10KB以内でOK、10KB超過でエラー、ネストレベル5階層でOK、6階層でエラー

#### Repository層（20件）
- **ServiceRepository**: 10件
  - 正常系: サービス取得、存在しないサービスでNone、サービス作成、アクティブのみ一覧、全サービス一覧、名前検索、アクティブ数カウント、サービス更新、サービス削除
  - 異常系: 重複IDで409エラー

- **ServiceAssignmentRepository**: 10件
  - 正常系: 割り当て取得、存在しない割り当てでNone、割り当て作成、テナント別一覧、statusフィルタ、決定的ID検索、テナント別カウント、サービス別一覧（クロスパーティション）、割り当て削除
  - 異常系: 重複IDで409エラー

#### Service層（19件）
- **ServiceService**: 7件
  - 正常系: サービス詳細取得、存在しないサービスでNone、アクティブ一覧、非アクティブ一覧、サービス作成、アクティブ数カウント
  - 異常系: 重複IDでValueError

- **ServiceAssignmentService**: 12件
  - 正常系: サービス割り当て成功、割り当て解除成功、テナント利用サービス一覧、Service取得失敗時も継続、Service取得タイムアウトでも継続
  - 異常系: テナント不在エラー、サービス不在エラー、非アクティブサービスエラー、重複割り当てエラー、ID長制限超過エラー、テナントサービスタイムアウト、存在しない割り当て解除エラー

#### API層（17件）
- **サービスカタログAPI**: 5件
  - 正常系: サービス一覧取得、is_active=falseで非アクティブのみ、サービス詳細取得
  - 異常系: 存在しないサービスで404、認証なしで401

- **サービス割り当てAPI**: 12件
  - 正常系: 利用サービス一覧取得、statusフィルタ、サービス割り当て成功、割り当て解除成功
  - 異常系: 無効なstatusで400、バリデーションエラー400、テナント不在404、サービス不在404、重複割り当て409、非アクティブ422、存在しない割り当て削除404、認証なし401

## 作成したテストファイル

### ディレクトリ構造
```
tests/
├── conftest.py                                    # 共通フィクスチャ
├── test_models/
│   ├── __init__.py
│   ├── test_service.py                            # Service Model テスト
│   └── test_service_assignment.py                 # ServiceAssignment Model テスト
├── test_schemas/
│   ├── __init__.py
│   ├── test_service_schema.py                     # Service Schema テスト
│   └── test_service_assignment_schema.py          # ServiceAssignment Schema テスト
├── test_repositories/
│   ├── __init__.py
│   ├── test_service_repository.py                 # ServiceRepository テスト
│   └── test_service_assignment_repository.py      # ServiceAssignmentRepository テスト
├── test_services/
│   ├── __init__.py
│   ├── test_service_service.py                    # ServiceService テスト
│   └── test_service_assignment_service.py         # ServiceAssignmentService テスト
└── test_api/
    ├── __init__.py
    ├── test_services_api.py                       # サービスカタログAPI テスト
    └── test_service_assignments_api.py            # サービス割り当てAPI テスト
```

### ファイル一覧
1. `tests/conftest.py`: 共通フィクスチャ定義
2. `tests/test_models/test_service.py`: Service Modelテスト（7件）
3. `tests/test_models/test_service_assignment.py`: ServiceAssignment Modelテスト（8件）
4. `tests/test_schemas/test_service_schema.py`: Service Schemaテスト（3件）
5. `tests/test_schemas/test_service_assignment_schema.py`: ServiceAssignment Schemaテスト（10件）
6. `tests/test_repositories/test_service_repository.py`: ServiceRepositoryテスト（10件）
7. `tests/test_repositories/test_service_assignment_repository.py`: ServiceAssignmentRepositoryテスト（10件）
8. `tests/test_services/test_service_service.py`: ServiceServiceテスト（7件）
9. `tests/test_services/test_service_assignment_service.py`: ServiceAssignmentServiceテスト（12件）
10. `tests/test_api/test_services_api.py`: サービスカタログAPIテスト（5件）
11. `tests/test_api/test_service_assignments_api.py`: サービス割り当てAPIテスト（12件）

## カバレッジ目標

| レイヤー | 行カバレッジ目標 | 分岐カバレッジ目標 |
|---------|----------------|------------------|
| Model層 | 90%以上 | 80%以上 |
| Schema層 | 95%以上 | 90%以上 |
| Repository層 | 85%以上 | 75%以上 |
| Service層 | 90%以上 | 85%以上 |
| API層 | 85%以上 | 80%以上 |
| **全体目標** | **80%以上** | **70%以上** |

## テスト設計の特徴

### ISTQB準拠のテスト技法

1. **同値分割法**: 入力を有効クラスと無効クラスに分割
   - 例: service_id（有効形式: "file-service"、無効形式: "File_Service"）
   
2. **境界値分析**: 境界条件での動作確認
   - 例: service_idが100文字でOK、101文字でエラー
   - 例: configが10KB以内でOK、10KB超過でエラー
   
3. **デシジョンテーブル**: 条件と結果の組み合わせ
   - 例: サービス割り当て（テナント存在 × サービス存在 × アクティブ状態 × 重複なし）
   
4. **状態遷移テスト**: ステータス遷移の検証
   - 例: ServiceAssignmentのステータス（active/suspended）

### テストカバレッジ戦略

- **高優先度（必須）**: 正常系の主要フロー、ビジネスロジックが複雑な異常系
- **中優先度（推奨）**: 境界値、補助的な正常系、一般的な異常系
- **低優先度（任意）**: 管理用機能、クロスパーティションクエリ等

### モック設計

1. **Cosmos DBコンテナモック**: in-memoryストレージで読み書きをシミュレート
2. **TenantClientモック**: HTTP依存を排除し、テナント存在確認をモック
3. **依存注入オーバーライド**: FastAPIのdependency_overridesでモックを注入

## 完了条件達成状況

- [x] 全テストケース（51件以上）がテストメソッドとして定義されている
- [x] テストの枠組み（describe/it または class/method）が作成されている
- [x] 各テストメソッドに適切なコメント（テストID、説明）がある
- [x] モックの構造が設計されている（conftest.py）
- [x] テストコードがコンパイル/構文エラーなく通る（実装は空のためPASS扱い）
- [x] テスト設計書が作成されている
- [x] pytest.iniにマーカー設定が追加されている（normal/error/boundary/priority_*）

## 実行方法

### 全テスト実行
```bash
cd /workspace/src/service-setting-service
pytest tests/ -v
```

### カバレッジ付き実行
```bash
pytest tests/ --cov=app --cov-report=html --cov-report=term
```

### レイヤー別実行
```bash
# Model層のみ
pytest tests/test_models/ -v

# Schema層のみ
pytest tests/test_schemas/ -v

# Repository層のみ
pytest tests/test_repositories/ -v

# Service層のみ
pytest tests/test_services/ -v

# API層のみ
pytest tests/test_api/ -v
```

### マーカー別実行
```bash
# 正常系のみ
pytest -m "normal" -v

# 異常系のみ
pytest -m "error" -v

# 高優先度のみ
pytest -m "priority_high" -v
```

## 次のステップ

### テスト実装フェーズ
1. **フェーズ1: Model層テスト実装** (優先度: 高)
   - Service Modelバリデーションテスト
   - ServiceAssignment Modelバリデーションテスト
   
2. **フェーズ2: Schema層テスト実装** (優先度: 高)
   - ServiceAssignmentCreate Schemaの詳細なconfig検証テスト
   
3. **フェーズ3: Repository層テスト実装** (優先度: 高)
   - ServiceRepositoryのCRUD操作テスト
   - ServiceAssignmentRepositoryのCRUD操作テスト
   
4. **フェーズ4: Service層テスト実装** (優先度: 高)
   - ServiceServiceのビジネスロジックテスト
   - ServiceAssignmentServiceの複雑なビジネスロジックテスト
   
5. **フェーズ5: API層テスト実装** (優先度: 高)
   - サービスカタログAPIのエンドツーエンドテスト
   - サービス割り当てAPIのエンドツーエンドテスト

### 品質保証活動
1. カバレッジ測定とギャップ分析
2. セルフレビュー（ISTQBテスト観点）
3. コードレビュー依頼
4. CI/CDパイプラインへの統合

## 備考

### テストデータ管理
- 共通テストデータはフィクスチャで定義（conftest.py）
- テストごとに独立したデータを使用（相互干渉防止）
- ファクトリーパターンでテストデータ生成機能を提供（large_config_dict、nested_config_dict）

### 非同期テスト対応
- pytest-asyncioを使用
- `@pytest.mark.asyncio`デコレータで非同期テストをマーク
- `async def test_*`でテストメソッドを定義

### エラーハンドリングテスト
- `pytest.raises(ExceptionType, match="error message pattern")`で例外を検証
- カスタムエラー（ServiceSettingException）のエラーコード検証
- HTTPステータスコードの検証（FastAPI TestClient）

---

**作成日**: 2026-02-01  
**バージョン**: 1.0.0  
**作成者**: Development Team
