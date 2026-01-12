# シードデータセキュリティガイド

開発、テスト、ステージング環境でのシードデータの安全な使用に関するベストプラクティス

## 🔒 セキュリティ原則

### 1. 本番データを使用しない

**絶対にしてはいけないこと:**
- 本番環境の実データをシードデータにコピーする
- 実際の顧客情報を開発/テスト環境で使用する
- 実際のAPIキー、トークン、シークレットを含める

**代わりに行うこと:**
- 合成データ（synthetic data）を使用
- テストケース用のダミーデータを作成
- 個人を特定できない匿名化データを使用

### 2. パスワード管理

#### 開発環境

**最小要件:**
```json
{
  "password": "DevPassword@123"
}
```
- 8文字以上
- 大文字、小文字、数字、特殊文字を含む
- 推測しやすいパスワード（"password"、"123456"）は避ける

#### ステージング環境

**必須要件:**
```json
{
  "password": "ChangeMeOnFirstLogin!Complex@2026",
  "security": {
    "twoFactorEnabled": true
  }
}
```
- 16文字以上の複雑なパスワード
- 初回ログイン時の変更を強制
- 2FA（二要素認証）を有効化
- パスワードの定期変更を推奨

#### 本番環境

**セキュリティ要件:**
- シードデータを使用しない
- ユーザー自身にパスワードを設定させる
- パスワードマネージャーの使用を推奨
- 定期的なパスワードローテーション
- 複雑性要件の強制

### 3. 環境変数とシークレット

**機密データの管理:**

```typescript
// ❌ 悪い例 - ハードコード
const cosmosKey = "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";

// ✅ 良い例 - 環境変数
const cosmosKey = process.env.COSMOSDB_KEY;

// ✅ さらに良い例 - Azure Key Vault
const cosmosKey = await keyVaultClient.getSecret("cosmosdb-key");
```

**環境変数のベストプラクティス:**

1. `.env`ファイルを`.gitignore`に追加
2. `.env.template`で必要な変数を文書化（値は空）
3. 本番シークレットは絶対にコミットしない
4. CI/CDではシークレット管理システムを使用

### 4. アクセス制御

#### 権限の最小化

```json
{
  "roles": ["user"],
  "permissions": [
    "users.read",
    "services.read"
  ]
}
```

**原則:**
- 必要最小限の権限のみ付与
- 管理者権限は本当に必要な場合のみ
- 定期的に権限をレビュー

#### ロールベースアクセス制御（RBAC）

**開発環境のロール構成:**
```
admin       → 全権限（デバッグ用）
manager     → ユーザー管理 + サービス管理
user        → 読み取り専用
test-user   → テスト専用の制限付き権限
```

### 5. データの暗号化

#### パスワードハッシュ

```typescript
import * as bcrypt from 'bcryptjs';

// ✅ 常にパスワードをハッシュ化
const passwordHash = await bcrypt.hash(password, 10); // 10ラウンドのソルト

// ❌ プレーンテキストでの保存は絶対禁止
```

#### 機密フィールド

**保存前に暗号化が必要:**
- `twoFactorSecret` - TOTP秘密鍵
- `apiKeys` - APIキーとトークン
- 個人を特定できる情報（PII）

```typescript
// 暗号化の例
import * as crypto from 'crypto';

function encrypt(text: string, key: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
```

### 6. 監査ログ

**記録すべき操作:**
```typescript
{
  "action": "user.login",
  "userId": "user-123",
  "timestamp": "2026-01-11T15:00:00.000Z",
  "metadata": {
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "success": true
  }
}
```

**監査対象:**
- ログイン試行（成功/失敗）
- 権限変更
- データの作成/更新/削除
- 設定変更
- セキュリティイベント

### 7. データ保持とクリーンアップ

#### TTL（Time To Live）設定

```json
{
  "ttl": 7776000  // 90日 = 90 * 24 * 60 * 60秒
}
```

**推奨TTL値:**
- 監査ログ: 90日
- セッション: 24時間
- 一時トークン: 1時間
- テストデータ: 7日

#### 定期的なクリーンアップ

```bash
# テスト環境のクリーンアップスケジュール
0 2 * * 0  cd /path/to/scripts && npm run cleanup -- --tenant test-tenant-*
```

## 🛡️ 環境別セキュリティチェックリスト

### 開発環境

- [ ] ダミーデータのみ使用
- [ ] 弱いパスワードOK（ただし最小要件は満たす）
- [ ] 2FA無効でOK
- [ ] ローカルCosmosDBエミュレータ使用
- [ ] 監査ログは最小限
- [ ] Git履歴に機密情報がないか確認

### ステージング環境

- [ ] 本番データを使用しない
- [ ] 強力なパスワード必須
- [ ] 2FA有効化必須
- [ ] 初回ログイン時のパスワード変更を強制
- [ ] Azure CosmosDB使用（専用インスタンス）
- [ ] 完全な監査ログ
- [ ] 定期的なセキュリティスキャン
- [ ] 環境変数でシークレット管理

### 本番環境

- [ ] シードデータを使用しない
- [ ] パスワードポリシーの強制
- [ ] 多要素認証（MFA）必須
- [ ] IPホワイトリスト
- [ ] 暗号化（転送中・保存時）
- [ ] Azure Key Vault使用
- [ ] 完全な監査ログとアラート
- [ ] 定期的なセキュリティ監査
- [ ] GDPR/プライバシー法準拠

## 🚨 セキュリティインシデント対応

### インシデントタイプと対応

#### 1. パスワード漏洩

**即座に実行:**
1. 影響を受けるアカウントをロック
2. 全ユーザーにパスワードリセットを強制
3. アクティブセッションを無効化
4. 監査ログを確認

#### 2. 不正アクセス

**即座に実行:**
1. 影響を受けるテナントを停止
2. アクセスログを保存
3. 攻撃元IPをブロック
4. チームに通知

#### 3. データ漏洩

**即座に実行:**
1. 影響範囲を特定
2. データベース接続を制限
3. インシデントレポートを作成
4. 必要に応じて当局に通報

## 📋 定期的なセキュリティレビュー

### 週次チェック

- [ ] 異常なログインパターンを確認
- [ ] 失敗したログイン試行を監視
- [ ] 新しいユーザーと権限をレビュー

### 月次チェック

- [ ] 使用されていないアカウントを無効化
- [ ] 権限の妥当性を確認
- [ ] シードデータを更新（脆弱性パッチ）
- [ ] セキュリティスキャン実行

### 四半期チェック

- [ ] セキュリティ監査実施
- [ ] パスワードポリシーをレビュー
- [ ] アクセス制御をレビュー
- [ ] コンプライアンス確認

## 🔍 セキュリティスキャンツール

### 推奨ツール

1. **OWASP ZAP** - Webアプリケーション脆弱性スキャン
2. **Snyk** - 依存関係の脆弱性検出
3. **SonarQube** - コード品質とセキュリティ
4. **Azure Security Center** - クラウドセキュリティ

### スキャン設定

```yaml
# GitHub Actions例
- name: Security Scan
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

## 📚 参考リソース

### 標準とガイドライン

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CIS Controls](https://www.cisecurity.org/controls)

### Azureセキュリティ

- [Azure Security Best Practices](https://docs.microsoft.com/azure/security/fundamentals/best-practices-and-patterns)
- [Azure Key Vault](https://docs.microsoft.com/azure/key-vault/)
- [Azure Active Directory](https://docs.microsoft.com/azure/active-directory/)

### コンプライアンス

- [GDPR Compliance](https://gdpr.eu/)
- [ISO 27001](https://www.iso.org/isoiec-27001-information-security.html)
- [SOC 2](https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/sorhome.html)

## 📞 連絡先

セキュリティの問題や懸念事項がある場合：

- **セキュリティチーム**: security@example.com
- **緊急連絡先**: +81-XX-XXXX-XXXX
- **インシデント報告**: [Security Incident Form]

---

**最終更新:** 2026-01-11  
**バージョン:** 1.0.0  
**次回レビュー:** 2026-04-11
