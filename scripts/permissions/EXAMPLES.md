# 権限システム統合例

このドキュメントでは、ドット記法権限システムをサービスに統合する実践的な例を提供します。

## 目次
- [基本設定](#基本設定)
- [バックエンドサービス統合](#バックエンドサービス統合)
- [フロントエンド統合](#フロントエンド統合)

## 基本設定

### パッケージのインポート

```typescript
import {
  requirePermission,
  hasPermission,
  createPermissionContext
} from '../../permissions';
```

### ロールの定義

```typescript
const roles: Role[] = [
  {
    id: 'role-user',
    name: 'user',
    displayName: 'ユーザー',
    permissions: ['users.read', 'profile.update'],
    isActive: true
  },
  {
    id: 'role-admin',
    name: 'admin',
    displayName: '管理者',
    permissions: ['users.*', 'services.*'],
    inheritsFrom: ['user'],
    isActive: true
  }
];
```

## バックエンドサービス統合

### ルートの保護

```typescript
import { requirePermission } from '../../permissions';

router.post('/users', 
  requirePermission('users.create'), 
  async (req, res) => {
    const newUser = await createUserInDB(req.body);
    res.json(newUser);
  }
);

router.put('/users/:id',
  requirePermission('users.update', {
    scope: 'own',
    getResourceOwnerId: (req) => req.params.id
  }),
  updateUser
);
```

### ビジネスロジックでの権限チェック

```typescript
import { hasPermission, createPermissionContext } from '../../permissions';

async function deleteUser(userId: string, currentUser: any) {
  const context = createPermissionContext(
    currentUser.id,
    currentUser.tenantId,
    currentUser.roles,
    currentUser.permissions
  );

  const result = hasPermission(context, 'users.delete');
  if (!result.granted) {
    throw new Error('権限が不足しています');
  }

  await db.users.delete(userId);
}
```

## フロントエンド統合

### 権限ベースのUIコンポーネント

```typescript
import { hasPermission, createPermissionContext } from '../../permissions';

function UserManagement({ currentUser }) {
  const context = createPermissionContext(
    currentUser.userId,
    currentUser.tenantId,
    currentUser.roles,
    currentUser.permissions
  );

  const canCreate = hasPermission(context, 'users.create').granted;

  return (
    <div>
      <h1>ユーザー管理</h1>
      {canCreate && <button onClick={handleCreate}>ユーザー作成</button>}
    </div>
  );
}
```

### カスタムフック

```typescript
function usePermission(permission: string): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;
    const context = createPermissionContext(
      user.userId, user.tenantId, user.roles, user.permissions
    );
    return hasPermission(context, permission).granted;
  }, [user, permission]);
}

// 使用例
function UserTable() {
  const canEdit = usePermission('users.update');
  const canDelete = usePermission('users.delete');
  
  return (
    <table>
      {users.map(user => (
        <tr key={user.id}>
          <td>{user.name}</td>
          <td>
            {canEdit && <button>編集</button>}
            {canDelete && <button>削除</button>}
          </td>
        </tr>
      ))}
    </table>
  );
}
```

## ベストプラクティス

1. **ワイルドカードを慎重に使用** - 管理者ロールにのみ使用
2. **具体的な権限を優先** - 通常ユーザーには具体的な権限を付与
3. **ロール継承を検証** - 循環依存を防ぐ
4. **権限をキャッシュ** - パフォーマンス向上のため
5. **ミドルウェアを使用** - ルート保護には常にミドルウェアを使用

## 詳細情報

完全な統合例、テスト戦略、トラブルシューティングについては、英語版ドキュメント（[EXAMPLES.en.md](./EXAMPLES.en.md)）を参照してください。

## 関連ドキュメント

- [README.md](./README.md) - 基本的な使用方法
- [CosmosDBスキーマ](../../docs/database/SCHEMA.md) - データベーススキーマ
- [ADR 005](../../docs/adr/005-dot-notation-permission-system.md) - アーキテクチャ決定記録
