# CosmosDB 自動初期化機能 - 変更サマリー

## 概要

Auth-Serviceのスクリプトを利用して、DevContainerビルド時にCosmosDBを自動的に初期化する機能を実装しました。

## 実装した機能

### 1. CosmosDB初期化スクリプト（新規作成）

**ファイル:** [src/auth-service/scripts/init_cosmosdb.sh](../src/auth-service/scripts/init_cosmosdb.sh)

- Python環境の確認とパッケージインストール
- 環境変数ファイル（.env）の確認
- Cosmos DB Emulatorへの接続確認（最大30秒待機）
- `setup_all.py`を実行してデータベース、コンテナ、初期データを作成
- カラフルな進捗表示とエラーハンドリング

### 2. セットアップ検証スクリプト（新規作成）

**ファイル:** [src/auth-service/scripts/verify_setup.sh](../src/auth-service/scripts/verify_setup.sh)

CosmosDBの初期化状態を検証：
- 環境変数ファイルの存在と必須項目
- Cosmos DB Emulatorへの接続
- Python環境と必要なパッケージ
- データベースとコンテナの存在
- 初期管理者ユーザーの存在

### 3. DevContainer初期化スクリプト更新

**ファイル:** [.devcontainer/setup-env.sh](../.devcontainer/setup-env.sh)

**変更内容:**
- Cosmos DB Emulator起動確認後に`init_cosmosdb.sh`を自動実行
- エラー時のフォールバック処理を追加
- セクション番号を再調整（4 → 5）

### 4. ドキュメント整備

#### 新規作成
- [src/auth-service/scripts/SCRIPTS_README.md](../src/auth-service/scripts/SCRIPTS_README.md)
  - 全スクリプトの詳細説明
  - 使用方法とトラブルシューティング
  - ワークフローとセキュリティ注意事項

- [docs/COSMOSDB_AUTO_INIT.md](../docs/COSMOSDB_AUTO_INIT.md)
  - アーキテクチャ図
  - ファイル構成
  - 作成されるリソースの詳細
  - トラブルシューティングガイド

#### 更新
- [src/auth-service/README.md](../src/auth-service/README.md)
  - DevContainerセットアップセクション追加
  - スクリプト一覧テーブル追加
  - 初期管理者アカウント情報追加

- [src/auth-service/.env.example](../src/auth-service/.env.example)
  - コメントを追加して各環境変数の用途を明確化

## 自動実行フロー

```
DevContainer起動
    ↓
devcontainer.json (postCreateCommand)
    ↓
.devcontainer/setup-env.sh
    ↓
    ├─ 環境ファイルセットアップ
    ├─ Git設定
    ├─ Cosmos DB Emulator起動確認
    ↓
src/auth-service/scripts/init_cosmosdb.sh
    ↓
    ├─ Python環境確認
    ├─ パッケージインストール
    ├─ 環境変数確認
    ├─ Cosmos DB接続確認
    ↓
src/auth-service/scripts/setup_all.py
    ↓
    ├─ setup_containers.py → DB/コンテナ作成
    └─ seed_data.py → 初期データ投入
```

## 作成されるリソース

### Cosmos DB Database
- **名前:** `saas-management-dev`

### Cosmos DB Containers
1. **users** (パーティションキー: `/id`, RU: 400)
2. **login-attempts** (パーティションキー: `/loginId`, RU: 400, TTL: 90日)
3. **role-configs** (パーティションキー: `/serviceId`, RU: 400)

### 初期データ
- **管理者ユーザー**
  - User ID: `user-admin-001`
  - Login ID: `admin@saas-platform.local`
  - Password: `Admin@123` ⚠️ 初回ログイン後に変更必須
  - Role: 全体管理者
  - Tenant ID: `tenant-001`

## 使用方法

### 自動セットアップ（推奨）

1. VS Codeでリポジトリを開く
2. コマンドパレットで `Dev Containers: Reopen in Container` を実行
3. 自動的にCosmosDBが初期化される

### 手動セットアップ

```bash
# Cosmos DB初期化
cd /workspace/src/auth-service
bash scripts/init_cosmosdb.sh

# 検証
bash scripts/verify_setup.sh

# Auth Service起動
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## トラブルシューティング

### よくある問題と対処法

| 問題 | 対処法 |
|-----|--------|
| Emulatorが起動しない | 初回は5-10分かかります。`docker-compose restart cosmosdb`で再起動 |
| 初期化スクリプトがエラー | `curl http://localhost:8081/`で接続確認、`pip3 install -r requirements.txt`でパッケージ再インストール |
| データベースが見つからない | `python3 scripts/setup_containers.py`で再作成 |
| 管理者ユーザーがいない | `python3 scripts/seed_data.py`で再作成 |

詳細は [docs/COSMOSDB_AUTO_INIT.md](../docs/COSMOSDB_AUTO_INIT.md) を参照

## セキュリティ注意事項

### 開発環境（現在の設定）
- ✓ Cosmos DB Emulatorの公開キーを使用（開発専用）
- ✓ デフォルトパスワード `Admin@123`（開発専用）
- ✓ HTTPエンドポイント（開発専用）

### 本番環境（変更必須）
- ✗ Emulatorキーを絶対に使用しない
- ✗ デフォルトパスワードを使用しない
- ✓ Azure Key Vaultで機密情報を管理
- ✓ HTTPSエンドポイントを使用
- ✓ マネージドIDを使用した認証
- ✓ 初回ログイン時のパスワード変更を強制

## ファイル一覧

### 新規作成ファイル
- ✨ `src/auth-service/scripts/init_cosmosdb.sh` - CosmosDB初期化スクリプト
- ✨ `src/auth-service/scripts/verify_setup.sh` - セットアップ検証スクリプト
- ✨ `src/auth-service/scripts/SCRIPTS_README.md` - スクリプト詳細ドキュメント
- ✨ `docs/COSMOSDB_AUTO_INIT.md` - 自動初期化機能ガイド
- ✨ `docs/CHANGES_SUMMARY.md` - このファイル

### 更新ファイル
- 📝 `.devcontainer/setup-env.sh` - CosmosDB初期化処理を追加
- 📝 `src/auth-service/README.md` - DevContainerセットアップセクション追加
- 📝 `src/auth-service/.env.example` - コメント追加

### 既存ファイル（変更なし）
- ✓ `src/auth-service/scripts/setup_all.py` - 既存スクリプトをそのまま活用
- ✓ `src/auth-service/scripts/setup_containers.py` - 既存スクリプトをそのまま活用
- ✓ `src/auth-service/scripts/seed_data.py` - 既存スクリプトをそのまま活用
- ✓ `.env.development` - 既存設定をそのまま活用
- ✓ `.devcontainer/devcontainer.json` - 変更不要
- ✓ `.devcontainer/docker-compose.yml` - 変更不要

## テスト方法

### 完全なテスト手順

```bash
# 1. DevContainerをリビルド
# VS Code: コマンドパレット → "Dev Containers: Rebuild Container"

# 2. 自動初期化の確認
# ターミナルに表示される初期化ログを確認

# 3. セットアップの検証
cd /workspace/src/auth-service
bash scripts/verify_setup.sh

# 4. Auth Serviceの起動
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# 5. APIドキュメントにアクセス
# ブラウザで http://localhost:8001/docs を開く

# 6. ログインテスト
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "loginId": "admin@saas-platform.local",
    "password": "Admin@123"
  }'
```

## 今後の拡張案

1. **他のサービスへの適用**
   - User Management Service用初期化スクリプト
   - Service Setting Service用初期化スクリプト

2. **CI/CDパイプライン統合**
   - Azure DevOpsパイプラインでの自動初期化
   - GitHub Actionsでのテスト自動化

3. **本番環境対応**
   - Azure Key Vault統合
   - マネージドID対応
   - 初回パスワード変更の強制機能

4. **モニタリング**
   - 初期化ログの収集
   - セットアップ時間の計測
   - エラーレポート

## 関連ドキュメント

- [CosmosDB Auto Init Guide](../docs/COSMOSDB_AUTO_INIT.md)
- [Scripts README](../src/auth-service/scripts/SCRIPTS_README.md)
- [Auth Service README](../src/auth-service/README.md)
- [Service Specification](../src/auth-service/docs/services/auth/spec.md)
- [Data Model](../src/auth-service/docs/services/auth/data-model.md)

## まとめ

Auth-Serviceの既存スクリプト（`setup_all.py`、`setup_containers.py`、`seed_data.py`）を活用して、DevContainerビルド時にCosmosDBを完全自動で初期化する仕組みを構築しました。

これにより：
- ✅ DevContainer起動後すぐに開発を開始できます
- ✅ 手動セットアップの手間が不要になります
- ✅ チームメンバー全員が同じ環境で作業できます
- ✅ 新メンバーのオンボーディングが簡単になります
- ✅ 初期データ（管理者ユーザー）が自動で用意されます

開発体験が大幅に向上します！🎉
