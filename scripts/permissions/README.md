# ドット記法権限システム

マルチテナントSaaSアプリケーション向けの、ロールベースアクセス制御（RBAC）を備えた階層的権限システムです。

## 機能

- ✅ **ドット記法形式**: 直感的なドット記法（例: `app.users.create`, `users.read`）
- ✅ **ワイルドカードサポート**: ワイルドカードで広範な権限を定義（例: `users.*`, `app.*`）
- ✅ **ロールベースアクセス制御**: 権限をロールに、ロールをユーザーに割り当て
- ✅ **ロール継承**: ロールが親ロールから権限を継承可能
- ✅ **スコープベース権限**: テナント、グローバル、所有権ベースのスコープをサポート
- ✅ **Expressミドルウェア**: ルート保護のための即座に使用可能なミドルウェア
- ✅ **型安全**: 完全な型定義を備えたTypeScript
- ✅ **パフォーマンス最適化**: キャッシュサポートによる効率的な権限チェック

## インストール

```bash
npm install @saas-app/permissions
```

## クイックスタート

### 基本的な権限チェック

```typescript
import { hasPermission, createPermissionContext } from '@saas-app/permissions';

const userContext = createPermissionContext(
  'user-123', 'tenant-456', ['admin'], ['users.read']
);

const result = hasPermission(userContext, 'users.read');
if (result.granted) {
  console.log('ユーザーはユーザーを読み取ることができます');
}
```

### Expressミドルウェア

```typescript
import { requirePermission } from '@saas-app/permissions';

app.post('/users', requirePermission('users.create'), (req, res) => {
  res.json({ message: 'ユーザーが作成されました' });
});
```

## 詳細ドキュメント

完全なAPIリファレンス、統合例、ベストプラクティスについては、英語版ドキュメント（[README.en.md](./README.en.md)）を参照してください。

## 主要API

- `hasPermission()` - ユーザーが権限を持っているかチェック
- `requirePermission()` - Expressルートを保護するミドルウェア
- `aggregateRolePermissions()` - ロールから権限を集約
- `validatePermissionFormat()` - 権限形式を検証

## ライセンス

MIT
