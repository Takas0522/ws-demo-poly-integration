# ADR 005: RBACを伴うドット記法権限システム

**ステータス**: 承認済み  
**日付**: 2026-01-11  
**決定者**: 開発チーム  
**関連issue**: Issue #005

## 背景

SaaS管理アプリケーションには、複数のサービスにわたってきめ細かいアクセス制御を実装するための、柔軟で階層的な権限システムが必要です。このシステムは以下をサポートする必要があります：

1. 異なるリソースとアクションに対するきめ細かい権限
2. ロール継承を伴うロールベースアクセス制御（RBAC）
3. マルチテナント分離
4. 管理者ロール用のワイルドカード権限
5. 所有権ベースの権限（ユーザーが自分のリソースを編集）
6. フロントエンドでのボタンレベル認可
7. Express.jsバックエンドサービスとの簡単な統合

## 決定

以下の特性を持つ**ドット記法権限システム**を実装することを決定しました：

### 権限形式

権限は2〜3セグメントの階層的ドット記法を使用します：

```
module.action              (例: users.create)
app.module.action          (例: app.users.create)
```

管理者ロール用にワイルドカード権限がサポートされています：
```
module.*                   (例: users.*)
app.module.*              (例: app.users.*)
app.*                     (例: app.*)
```

### コアコンポーネント

1. **権限パーサー**（`parser.ts`）
   - 権限形式を検証
   - 権限をコンポーネントに解析
   - ワイルドカードパターンをマッチング
   - 階層的比較をサポート

2. **RBACシステム**（`rbac.ts`）
   - 権限リストを持つロール定義
   - ロール継承（ロールは親ロールから継承可能）
   - 複数ロールからの権限集約
   - 循環依存検出
   - ロール階層の可視化

3. **権限チェッカー**（`checker.ts`）
   - ユーザーが特定の権限を持っているかチェック
   - 複数権限のいずれか/すべてをチェック
   - スコープベースチェック（tenant/global/own）
   - ロールベースと直接権限をサポート

4. **Expressミドルウェア**（`middleware.ts`）
   - `requirePermission()` - 特定の権限を要求
   - `requireAnyPermission()` - 複数権限のいずれかを要求
   - `requireAllPermissions()` - すべての指定権限を要求
   - `requireRole()` - 特定のロールを要求
   - `requireAnyRole()` - 複数ロールのいずれかを要求

### 権限スコープ

3つの権限スコープがサポートされています：

1. **Tenant**（デフォルト）: ユーザーのテナント内で権限が適用
2. **Global**: すべてのテナントにわたって権限が適用（システム管理者用）
3. **Own**: ユーザーが所有するリソースにのみ権限が適用

### データストレージ

権限は既存のスキーマで定義されているようにCosmosDBに保存されます：

```typescript
interface Permission {
  id: string;
  tenantId: string;
  name: string;              // ドット記法名
  displayName: string;
  description: string;
  category: string;
  resource: string;
  action: string;
  scope: 'tenant' | 'global' | 'own';
  isActive: boolean;
  requiredPlan?: string;
  metadata?: object;
}
```

ロールは権限と継承と共に保存されます：

```typescript
interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];     // 権限名の配列
  inheritsFrom?: string[];   // 親ロール名
  isActive: boolean;
  tenantId?: string;
}
```

## 根拠

### なぜドット記法か？

1. **直感的で人間が読みやすい**: `users.create`は即座に理解可能
2. **階層的**: リソースごとの権限の自然なグループ化
3. **柔軟**: 特定とワイルドカードの両方の権限をサポート
4. **拡張可能**: 新しいリソースとアクションの追加が容易
5. **業界標準**: 多くのシステム（AWS IAMなど）で使用

### なぜ継承を伴うRBACか？

1. **権限管理の複雑さを軽減**: 個別の権限ではなくロールを割り当て
2. **組織階層をサポート**: ロールは他から継承可能（マネージャーはユーザーから継承）
3. **柔軟性**: ユーザーは複数のロールを持てる
4. **保守性**: ロール権限を一度変更すれば、そのロールを持つすべてのユーザーに影響

### なぜ3つのスコープか？

1. **テナントスコープ**: マルチテナント分離のデフォルト
2. **グローバルスコープ**: システム管理者に必要
3. **所有スコープ**: ユーザーが自分のデータを編集する一般的なパターン

### なぜワイルドカードか？

1. **管理者ロールを簡素化**: すべてのユーザーアクションをリストする代わりに`users.*`を付与
2. **権限の肥大化を削減**: 管理する権限が少なくなる
3. **柔軟**: 新しいアクションが追加されたときに管理者が自動的に新しい権限を取得

## 結果

### プラス面

1. **きめ細かい制御**: 個々のアクションレベルでアクセスを制御可能
2. **スケーラブル**: 新しいリソースとアクションの追加が容易
3. **型安全**: インターフェースを伴う完全なTypeScriptサポート
4. **よくテストされている**: 98%以上のテストカバレッジ
5. **簡単な統合**: Expressルート用のシンプルなミドルウェア
6. **フロントエンドサポート**: Reactでボタンレベル認可に使用可能
7. **パフォーマンス**: 効率的なワイルドカードマッチングと権限集約
8. **監査可能**: ログと監査証跡での明確な権限名

### マイナス面

1. **学習曲線**: チームが権限形式とスコープを理解する必要
2. **初期設定**: すべてのロールと権限を事前に定義する必要
3. **キャッシュの複雑さ**: 大規模でのパフォーマンスにはキャッシュが必要な場合
4. **検証オーバーヘッド**: 権限形式を検証する必要

### リスクと軽減策

| リスク | 軽減策 |
|--------|--------|
| 過度に広範なワイルドカード権限 | ロール定義のコードレビュー、最小権限の原則 |
| 多くのロールでのパフォーマンス | 権限キャッシングの実装、集約の最適化 |
| 循環ロール継承 | 検証関数が循環依存を防ぐ |
| 一貫性のない権限名 | リンティング、ドキュメント、命名規則 |

## 検討された代替案

### 代替案1: シンプルなロールベース権限

**アプローチ**: ユーザーはロールを持ち、ロールが全体的な機能/ページへのアクセスを付与

**却下理由**:
- ボタンレベル認可には十分にきめ細かくない
- 部分的なアクセス（例: 読み取りは可能だが削除は不可）の実装が困難
- 複雑な権限要件には柔軟性が低い

### 代替案2: リソース-アクションタプル

**アプローチ**: データベース内の別々のリソースとアクションフィールドとしての権限

**却下理由**:
- クエリと管理がより複雑
- 読み取りと理解が困難
- ワイルドカードの実装が困難
- データベースストレージが多い

### 代替案3: ビット単位権限

**アプローチ**: 異なる権限にビットフラグを使用

**却下理由**:
- 拡張不可能（固定数の権限）
- 人間が読めない
- 理解と監査が困難
- ドキュメント化が困難

## 実装詳細

### ファイル構造

```
scripts/permissions/
├── types.ts              # TypeScriptインターフェース
├── parser.ts             # 権限解析と検証
├── rbac.ts              # ロールベースアクセス制御
├── checker.ts           # 権限チェックロジック
├── middleware.ts        # Expressミドルウェア
├── index.ts             # メインエクスポート
├── README.md            # ドキュメント
├── EXAMPLES.md          # 統合例
├── *.test.ts            # テストファイル
├── package.json         # 依存関係
└── tsconfig.json        # TypeScript設定
```

### 依存関係

- **express**: ミドルウェア型定義用
- **typescript**: 型安全性用
- **jest**: テスト用
- **ts-jest**: JestのTypeScriptサポート

### 統合ポイント

1. **認証サービス**: 権限を含むJWTトークンを生成
2. **ユーザー管理サービス**: ユーザー、ロール、権限を管理
3. **すべてのバックエンドサービス**: ルートを保護するためにミドルウェアを使用
4. **フロントエンド**: UI レンダリングのための権限チェック
5. **CosmosDB**: 権限とロール定義を保存

## 例

### ロールの定義

```typescript
const roles: Role[] = [
  {
    id: 'role-user',
    name: 'user',
    displayName: 'ユーザー',
    description: '基本ユーザー',
    permissions: ['users.read', 'profile.update'],
    isActive: true
  },
  {
    id: 'role-admin',
    name: 'admin',
    displayName: '管理者',
    description: '管理者',
    permissions: ['users.*', 'services.*'],
    inheritsFrom: ['user'],
    isActive: true
  }
];
```

### ルートの保護

```typescript
router.post('/users', 
  requirePermission('users.create'), 
  createUser
);

router.put('/users/:id',
  requirePermission('users.update', {
    scope: 'own',
    getResourceOwnerId: (req) => req.params.id
  }),
  updateUser
);
```

### フロントエンド認可

```typescript
function UserManagement() {
  const canCreate = usePermission('users.create');
  
  return (
    <div>
      {canCreate && <button onClick={createUser}>ユーザー作成</button>}
    </div>
  );
}
```

## 検証

### テスト

- すべての機能をカバーする95のテストケース
- 98%以上のコードカバレッジ
- パーサー、RBAC、チェッカー、ミドルウェアのテスト
- エッジケースとエラー条件をテスト

### セキュリティ

- 依存関係にセキュリティ脆弱性なし
- 権限形式検証がインジェクションを防ぐ
- スコープチェックが不正アクセスを防ぐ
- ロール継承検証が循環依存を防ぐ

## モニタリングとメトリクス

### 推奨メトリクス

1. **権限チェック遅延**: 権限チェックにかかる時間を監視
2. **権限拒否率**: 失敗した権限チェックを追跡
3. **最もよく使用される権限**: 一般的な権限を特定
4. **ロール分布**: ユーザー間のロール割り当てを追跡
5. **ワイルドカード権限使用**: 管理者アクションを監視

### ロギング

すべての権限拒否は以下と共にログに記録されるべきです：
- ユーザーID
- テナントID
- 必要な権限
- タイムスタンプ
- リクエストコンテキスト

## 将来の拡張

1. **権限グループ**: 簡単な管理のための関連権限のグループ化
2. **時間ベース権限**: 一時的な権限付与
3. **条件付き権限**: 条件に基づく権限（例: 時刻）
4. **権限委任**: ユーザーが他者に権限を委任
5. **権限ごとのAPIレート制限**: 権限ごとに異なるレート制限
6. **権限分析ダッシュボード**: 権限使用を可視化

## 参考文献

- [CosmosDBスキーマドキュメント](../../docs/database/SCHEMA.md)
- [権限システムREADME](./README.md)
- [統合例](./EXAMPLES.md)
- [AWS IAM ポリシー](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html)（インスピレーション）
- [NIST RBAC標準](https://csrc.nist.gov/projects/role-based-access-control)

## 付録: 命名規則

### リソース名

- 小文字のケバブケースを使用: `api-keys`, `user-profiles`
- コレクションには複数形を使用: `users`, `services`
- シングルトンリソースには単数形を使用: `profile`, `settings`

### アクション名

標準CRUDアクション:
- `create` - 新しいリソースを作成
- `read` - リソースを読み取り
- `update` - 既存のリソースを更新
- `delete` - リソースを削除
- `list` - リソースをリスト（コレクションの読み取りの代替）

カスタムアクション:
- `execute` - 操作を実行
- `import` - データをインポート
- `export` - データをエクスポート
- `approve` - リクエストを承認
- `reject` - リクエストを拒否

### 権限例

```
users.create
users.read
users.update
users.delete
users.list

api-keys.create
api-keys.delete
api-keys.revoke

profile.read
profile.update

settings.read
settings.update

audit-logs.read
audit-logs.export

reports.read
reports.generate
reports.export
```
