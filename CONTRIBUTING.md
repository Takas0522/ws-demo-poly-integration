# SaaS管理者Webアプリケーションへのコントリビューション

このプロジェクトへのコントリビューションに興味を持っていただきありがとうございます！このドキュメントは、コードベースへのコントリビューションのためのガイドラインと基準を提供します。

## 📋 目次

- [行動規範](#行動規範)
- [開発ワークフロー](#開発ワークフロー)
- [コーディング基準](#コーディング基準)
- [コミットガイドライン](#コミットガイドライン)
- [プルリクエストプロセス](#プルリクエストプロセス)
- [テスト要件](#テスト要件)
- [ドキュメント基準](#ドキュメント基準)

## 🤝 行動規範

私たちは、すべてのコントリビューターにとって歓迎的で包括的な環境を提供することに取り組んでいます。以下を守ってください：

- すべてのやり取りで敬意を持ち、思いやりを持つ
- 新参者を歓迎し、開始を支援する
- 建設的なフィードバックとコラボレーションに焦点を当てる
- 異なる視点と経験を尊重する

## 🔄 開発ワークフロー

このプロジェクトは、未完成機能を管理するための機能フラグを使用した**トランクベース開発**に従っています。

### ブランチ戦略

#### メインブランチ
- 常にデプロイ可能で本番環境対応
- 必須のレビューとCIチェックで保護
- すべての変更はプルリクエスト経由でマージ
- リリース時にタグ付け

#### 機能ブランチ
- 短期間（理想的には2日未満、最大1週間）
- 命名規則：`feature/description`または`fix/description`
- 最新の`main`ブランチから作成
- プルリクエスト経由で`main`にマージ

**ブランチ名の例：**
```bash
feature/user-profile-api
feature/jwt-authentication
fix/permission-check-bug
docs/api-documentation
```

#### ブランチ命名規則

- `feature/` - 新機能または拡張
- `fix/` - バグ修正
- `docs/` - ドキュメント更新
- `refactor/` - コードリファクタリング
- `test/` - テスト追加または更新
- `chore/` - メンテナンスタスク

### 機能フラグの使用

2日以上かかる機能の場合：

1. **未完成機能を機能フラグの後ろに隠す：**
   ```typescript
   if (process.env.FEATURE_NEW_DASHBOARD === 'enabled') {
     // 新機能のコード
   }
   ```

2. **制御に環境変数を使用：**
   - 開発環境：`.env.local`でフラグを有効化
   - ステージング環境：テスト用に選択的に有効化
   - 本番環境：準備ができたときのみ有効化

3. **機能が安定したらフラグを削除**（通常、デプロイ後1-2リリース後）

### 日々の開発ワークフロー

1. **1日の開始：**
   ```bash
   git checkout main
   git pull --recurse-submodules
   ```

2. **機能ブランチを作成：**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **変更を行い、頻繁にコミット：**
   ```bash
   git add .
   git commit -m "feat: ユーザープロファイルエンドポイントを追加"
   ```

4. **ブランチを最新に保つ：**
   ```bash
   git checkout main
   git pull --recurse-submodules
   git checkout feature/your-feature-name
   git rebase main
   ```

5. **プッシュしてPRを作成：**
   ```bash
   git push origin feature/your-feature-name
   # GitHubでPRを作成
   ```

## 💻 コーディング基準

### TypeScript/JavaScript基準

#### コードスタイル
- すべての新しいコードに**TypeScript**を使用
- **ESLint**と**Prettier**の設定に従う
- インデントに**2スペース**を使用
- 最大行長：**100文字**
- 文字列に**シングルクォート**を使用（テンプレートリテラルが必要な場合を除く）

#### 命名規則
```typescript
// クラスとインターフェース - PascalCase
class UserService {}
interface UserProfile {}

// 関数と変数 - camelCase
function getUserById() {}
const userName = 'John';

// 定数 - UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

// プライベートクラスメンバー - アンダースコアで始める
class MyClass {
  private _internalState: string;
}

// 型エイリアス - PascalCase
type UserId = string;
```

#### ベストプラクティス

**1. 型安全性：**
```typescript
// ✅ 良い - 明示的な型
function getUser(id: string): Promise<User> {
  return userService.findById(id);
}

// ❌ 悪い - 'any'を使用
function getUser(id: any): Promise<any> {
  return userService.findById(id);
}
```

**2. エラーハンドリング：**
```typescript
// ✅ 良い - 適切なエラーハンドリング
async function createUser(data: UserInput): Promise<User> {
  try {
    const user = await userService.create(data);
    return user;
  } catch (error) {
    logger.error('Failed to create user', { error, data });
    throw new UserCreationError('Unable to create user', { cause: error });
  }
}
```

**3. Async/Await：**
```typescript
// ✅ 良い - async/awaitを使用
async function fetchUserData(userId: string) {
  const user = await userService.getUser(userId);
  const permissions = await permissionService.getPermissions(userId);
  return { user, permissions };
}

// ❌ 悪い - コールバック地獄
function fetchUserData(userId: string, callback) {
  userService.getUser(userId, (user) => {
    permissionService.getPermissions(userId, (permissions) => {
      callback({ user, permissions });
    });
  });
}
```

**4. 不変性：**
```typescript
// ✅ 良い - 不変な操作
const updatedUser = { ...user, name: 'New Name' };
const filteredItems = items.filter(item => item.active);

// ❌ 悪い - オブジェクトを変更
user.name = 'New Name';
items.splice(0, 1);
```

### React/フロントエンド基準

#### コンポーネント構造
```typescript
// ✅ 良い - TypeScriptを使用した関数コンポーネント
import React from 'react';

interface UserProfileProps {
  userId: string;
  onUpdate: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const [user, setUser] = React.useState<User | null>(null);
  
  React.useEffect(() => {
    loadUser(userId);
  }, [userId]);
  
  const loadUser = async (id: string) => {
    const userData = await userService.getUser(id);
    setUser(userData);
  };
  
  return (
    <div className="user-profile">
      {user && <UserDetails user={user} />}
    </div>
  );
};
```

#### フックガイドライン
- カスタムフックは`use`プレフィックスで始める：`useUserData`、`useAuth`
- フックは単一責任に焦点を当てる
- 複雑なフックにはJSDocコメントでドキュメント化

### バックエンド/API基準

#### RESTful APIデザイン
```typescript
// ✅ 良い - RESTfulエンドポイント
GET    /api/users              // ユーザー一覧
GET    /api/users/:id          // 特定のユーザーを取得
POST   /api/users              // ユーザーを作成
PUT    /api/users/:id          // ユーザーを更新（全体）
PATCH  /api/users/:id          // ユーザーを更新（部分）
DELETE /api/users/:id          // ユーザーを削除

// ❌ 悪い - 非RESTful
GET    /api/getUsers
POST   /api/createNewUser
POST   /api/deleteUser/:id
```

#### レスポンス形式
```typescript
// ✅ 良い - 一貫したレスポンス形式
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}
```

#### ステータスコード
- **200 OK** - 成功したGET、PUT、PATCH
- **201 Created** - 成功したPOST
- **204 No Content** - 成功したDELETE
- **400 Bad Request** - 無効な入力
- **401 Unauthorized** - 認証がないか無効
- **403 Forbidden** - 権限不足
- **404 Not Found** - リソースが見つからない
- **500 Internal Server Error** - 予期しないエラー

### データベース基準

#### CosmosDB規約
- 意味のあるパーティションキーを使用（例：`tenantId`）
- ドキュメントタイプにプレフィックスを付ける：`USER_`、`PERMISSION_`、`SETTING_`
- すべてのドキュメントに`_ts`タイムスタンプを含める
- 保存データのフィールド名にsnake_caseを使用

```typescript
// ✅ 良い - ドキュメント構造
interface UserDocument {
  id: string;
  type: 'USER';
  tenant_id: string;  // パーティションキー
  email: string;
  created_at: string;
  updated_at: string;
  _ts: number;
}
```

## 📝 コミットガイドライン

明確で意味のあるコミットメッセージのために**慣習的コミット**仕様に従います。

### コミットメッセージ形式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### タイプ
- **feat**: 新機能
- **fix**: バグ修正
- **docs**: ドキュメント変更
- **style**: コードスタイル変更（フォーマット、セミコロンの欠落など）
- **refactor**: 機能変更のないコードリファクタリング
- **test**: テストの追加または更新
- **chore**: メンテナンスタスク、依存関係の更新

### スコープ（オプション）
スコープは、コードベースのどの部分が影響を受けるかを指定します：
- `auth` - 認証サービス
- `user` - ユーザー管理サービス
- `settings` - サービス設定サービス
- `frontend` - フロントエンドアプリケーション
- `api` - API変更
- `db` - データベース関連

### コミット例

```bash
# 機能追加
feat(auth): JWTトークンリフレッシュエンドポイントを追加

# バグ修正
fix(user): ユーザープロファイル取得のnullポインタを解決

# ドキュメント
docs: 認証エンドポイントのAPIドキュメントを更新

# リファクタリング
refactor(frontend): ユーザーコンポーネントの状態管理を簡素化

# 破壊的変更
feat(api)!: ユーザーAPIレスポンス形式を変更

BREAKING CHANGE: User APIは、フラット構造の代わりに
ネストされたプロファイルオブジェクトを返すようになりました。
クライアントコードを適宜更新してください。
```

### コミットのベストプラクティス

1. **アトミックコミット** - コミットごとに1つの論理的変更
2. **現在形** - 「機能を追加」であり「機能を追加した」ではない
3. **命令形** - 「変更する」であり「変更」や「変更した」ではない
4. **説明的なサブジェクト** - 明確で簡潔な説明（最大72文字）
5. **コンテキストのためのボディ** - 「何を」ではなく「なぜ」を説明（必要な場合）
6. **issueの参照** - フッターにissue番号を含める

**良いコミット例：**
```bash
git commit -m "feat(auth): パスワードリセットフローを実装"
git commit -m "fix(user): 重複メール登録を防止"
git commit -m "docs: READMEにAPI例を追加"
git commit -m "test(auth): ログインの統合テストを追加"
```

## 🔍 プルリクエストプロセス

### PRを作成する前に

1. **ブランチを更新：**
   ```bash
   git checkout main
   git pull --recurse-submodules
   git checkout your-feature-branch
   git rebase main
   ```

2. **すべてのチェックを実行：**
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build
   ```

3. **必要に応じてドキュメントを更新**

4. **ローカル環境で手動テスト**

### PRタイトル形式

コミットと同じ規約に従います：
```
feat(auth): JWTトークンリフレッシュエンドポイントを追加
fix(user): ユーザープロファイル取得のnullポインタを解決
```

### PR説明テンプレート

```markdown
## 説明
変更の簡単な説明と動機。

## 変更のタイプ
- [ ] バグ修正（既存機能を変更しない、issueを修正する変更）
- [ ] 新機能（既存機能を変更しない、機能を追加する変更）
- [ ] 破壊的変更（既存機能を変更する修正または機能）
- [ ] ドキュメント更新

## 行った変更
- 変更1
- 変更2
- 変更3

## テスト
- [ ] ユニットテストを追加/更新
- [ ] 統合テストを追加/更新
- [ ] 手動テスト完了

## スクリーンショット（該当する場合）
UI変更のスクリーンショットを追加。

## 関連Issues
Fixes #123
Related to #456

## チェックリスト
- [ ] コードはプロジェクトのスタイルガイドラインに従っている
- [ ] セルフレビュー完了
- [ ] 複雑なコードにコメントを追加
- [ ] ドキュメントを更新
- [ ] 新しい警告が生成されていない
- [ ] テストがローカルで成功
- [ ] 依存する変更がマージ済み
```

### PRレビュープロセス

1. **自動チェックが成功する必要があります：**
   - リンティング
   - 型チェック
   - ユニットテスト
   - 統合テスト
   - ビルド成功

2. **コードレビューが必要：**
   - チームメンバーから少なくとも1つの承認
   - すべてのレビューコメントに対応
   - 未解決の会話がない

3. **マージ戦略：**
   - 機能ブランチには**squash and merge**を使用
   - 最終コミットメッセージが規約に従っていることを確認
   - マージ後にブランチを削除

### PRのレビュー

レビュアーとして：

✅ **すべきこと：**
- 24時間以内にレビュー
- 重要な場合はローカルで変更をテスト
- 建設的なフィードバックを提供
- 理由を理解するために質問する
- 満足したら承認

❌ **すべきでないこと：**
- 個人的な好みで細かい指摘
- 説明なしに変更を要求
- コードをレビューせずに承認
- フィードバックなしでPRを放置

## 🧪 テスト要件

### テストカバレッジ基準
- **最小カバレッジ**: すべてのサービスで80%
- **クリティカルパス**: 100%カバレッジが必要
- **新機能**: テストを含める必要があります

### テストタイプ

#### ユニットテスト
```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('有効なデータで新しいユーザーを作成できること', async () => {
      const userData = { email: 'test@example.com', name: 'Test User' };
      const result = await userService.createUser(userData);
      
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
    });
    
    it('重複メールの場合エラーをスローすること', async () => {
      const userData = { email: 'existing@example.com', name: 'Test' };
      
      await expect(userService.createUser(userData))
        .rejects.toThrow('Email already exists');
    });
  });
});
```

#### 統合テスト
```typescript
describe('User API統合', () => {
  it('ユーザーを作成して取得できること', async () => {
    // ユーザーを作成
    const createResponse = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', name: 'Test User' })
      .expect(201);
    
    const userId = createResponse.body.data.id;
    
    // ユーザーを取得
    const getResponse = await request(app)
      .get(`/api/users/${userId}`)
      .expect(200);
    
    expect(getResponse.body.data.email).toBe('test@example.com');
  });
});
```

### テストの実行

```bash
# すべてのテストを実行
npm test

# カバレッジ付きで実行
npm run test:coverage

# 特定のテストファイルを実行
npm test -- user.service.test.ts

# ウォッチモードで実行
npm test -- --watch

# 統合テストのみ実行
npm run test:integration
```

## 📚 ドキュメント基準

### コードドキュメント

#### JSDocコメント
```typescript
/**
 * 一意の識別子でユーザーを取得します。
 * 
 * @param userId - ユーザーの一意の識別子
 * @returns ユーザーオブジェクトに解決されるPromise
 * @throws {UserNotFoundError} ユーザーが存在しない場合
 * @throws {DatabaseError} データベースクエリが失敗した場合
 * 
 * @example
 * ```typescript
 * const user = await getUserById('user-123');
 * console.log(user.email);
 * ```
 */
async function getUserById(userId: string): Promise<User> {
  // 実装
}
```

#### 複雑なロジックのコメント
```typescript
// ユーザーのアクティビティとエンゲージメントに基づいて加重スコアを計算
// 式：(activity_count * 0.6) + (engagement_rate * 0.4)
// これは、エンゲージメントの質も考慮しながら、アクティブなユーザーを優遇します
const weightedScore = (activityCount * 0.6) + (engagementRate * 0.4);
```

### APIドキュメント

- **OpenAPI 3.0**仕様を使用
- すべてのエンドポイントを例付きでドキュメント化
- リクエスト/レスポンススキーマを含める
- 認証要件を追加
- エラーレスポンス例を提供

### READMEドキュメント

各サービスには以下を含むREADMEが必要です：
- サービスの概要と目的
- セットアップ手順
- 環境変数
- APIエンドポイント（簡単に）
- 開発コマンド
- テストガイドライン

`docs/templates/SERVICE_README.md`のテンプレートを使用してください。

## 🚀 リリースプロセス

### バージョン番号
**セマンティックバージョニング**（SemVer）に従います：
- **MAJOR**: 破壊的変更（2.0.0）
- **MINOR**: 新機能、下位互換性あり（1.1.0）
- **PATCH**: バグ修正、下位互換性あり（1.0.1）

### リリースチェックリスト
1. `package.json`のバージョンを更新
2. CHANGELOG.mdを更新
3. gitタグを作成：`git tag v1.2.3`
4. タグをプッシュ：`git push origin v1.2.3`
5. GitHub Actionsがデプロイを処理

## ❓ 質問がありますか？

コントリビューションについて質問がある場合：

1. `/docs`の既存ドキュメントを確認
2. 既存のGitHub Issuesを検索
3. `question`ラベルで新しいissueを作成
4. メンテナーに連絡

## 🙏 ありがとうございます！

あなたのコントリビューションがこのプロジェクトをより良くします。これらのガイドラインに従い、コード品質の維持を支援していただき、時間と労力に感謝します。

---

**最終更新**: 2026-01-07  
**管理者**: 開発チーム
