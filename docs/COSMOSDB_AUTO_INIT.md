# CosmosDB 自動初期化セットアップガイド

このドキュメントは、DevContainerビルド時にCosmosDBを自動的に初期化する仕組みについて説明します。

## 概要

DevContainerを起動すると、以下の処理が自動的に実行されます：

1. **環境ファイルのセットアップ** - `.env`ファイルの作成
2. **Cosmos DB Emulatorの起動待機** - Emulatorが完全に起動するまで待機
3. **CosmosDBの初期化** - データベース、コンテナ、初期データの作成
4. **セットアップの検証** - 正常に初期化されたことを確認

## アーキテクチャ

```
DevContainer 起動
    ↓
.devcontainer/setup-env.sh (自動実行)
    ↓
    ├─ 1. 環境ファイルのセットアップ
    │     └─ .env.development → .env
    │
    ├─ 2. Git設定
    │     └─ サブモジュールの初期化
    │
    ├─ 3. Cosmos DB Emulator 起動確認
    │     └─ 最大60秒待機 (初回は5-10分かかる場合あり)
    │
    ├─ 4. Cosmos DB 初期化
    │     └─ src/auth-service/scripts/init_cosmosdb.sh
    │           ↓
    │           ├─ Python環境の確認
    │           ├─ パッケージのインストール
    │           ├─ 環境変数の確認
    │           ├─ Cosmos DB接続確認
    │           └─ src/auth-service/scripts/setup_all.py
    │                 ↓
    │                 ├─ setup_containers.py
    │                 │    └─ データベースとコンテナの作成
    │                 │
    │                 └─ seed_data.py
    │                      └─ 初期管理者ユーザーの作成
    │
    └─ 5. 環境の確認
          └─ Node.js, Python, Azure CLIのバージョン表示
```

## ファイル構成

### DevContainer設定

| ファイル | 説明 |
|---------|------|
| `.devcontainer/devcontainer.json` | DevContainer設定（postCreateCommandでsetup-env.shを実行） |
| `.devcontainer/docker-compose.yml` | CosmosDB Emulatorを含むサービス定義 |
| `.devcontainer/setup-env.sh` | DevContainer初期化スクリプト（更新済み） |

### Auth Service スクリプト

| ファイル | 説明 |
|---------|------|
| `src/auth-service/scripts/init_cosmosdb.sh` | CosmosDB初期化メインスクリプト（新規作成） |
| `src/auth-service/scripts/setup_all.py` | データベース＋コンテナ＋初期データの一括セットアップ |
| `src/auth-service/scripts/setup_containers.py` | データベースとコンテナの作成 |
| `src/auth-service/scripts/seed_data.py` | 初期管理者ユーザーの作成 |
| `src/auth-service/scripts/verify_setup.sh` | セットアップ検証スクリプト（新規作成） |
| `src/auth-service/scripts/SCRIPTS_README.md` | スクリプト詳細ドキュメント（新規作成） |

### 環境変数ファイル

| ファイル | 説明 |
|---------|------|
| `.env.development` | 開発環境用設定（Cosmos DB Emulator用） |
| `.env.template` | 環境変数テンプレート |
| `src/auth-service/.env.example` | Auth Service用環境変数サンプル（更新済み） |

## 作成されるリソース

### Cosmos DB

**Database:** `saas-management-dev`

**Containers:**
- `users` - ユーザー情報
  - Partition Key: `/id`
  - RU/s: 400
  
- `login-attempts` - ログイン試行履歴
  - Partition Key: `/loginId`
  - RU/s: 400
  - TTL: 90日（7776000秒）
  
- `role-configs` - ロール設定
  - Partition Key: `/serviceId`
  - RU/s: 400

### 初期データ

**管理者ユーザー:**
```json
{
  "id": "user-admin-001",
  "loginId": "admin@saas-platform.local",
  "name": "システム管理者",
  "passwordHash": "<bcrypt hash of Admin@123>",
  "isActive": true,
  "roles": [
    {
      "serviceId": "auth-service",
      "roleId": "role-auth-admin",
      "roleName": "全体管理者"
    }
  ],
  "tenantIds": ["tenant-001"]
}
```

**初期ログイン情報:**
- Login ID: `admin@saas-platform.local`
- Password: `Admin@123`

⚠️ **セキュリティ警告:** 初回ログイン後、必ずパスワードを変更してください

## 使用方法

### 1. 初回セットアップ（自動）

```bash
# VS Codeでリポジトリを開く
# コマンドパレット（Ctrl+Shift+P / Cmd+Shift+P）で実行:
Dev Containers: Reopen in Container
```

DevContainerが起動すると、自動的に全ての初期化が実行されます。

### 2. セットアップの確認

```bash
cd /workspace/src/auth-service
bash scripts/verify_setup.sh
```

正常に完了すると以下のように表示されます：
```
==========================================
  ✓ すべての検証に合格しました
==========================================

Auth Service を起動できます:
  cd /workspace/src/auth-service
  uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

初期管理者アカウント:
  Login ID: admin@saas-platform.local
  Password: Admin@123
```

### 3. Auth Serviceの起動

```bash
cd /workspace/src/auth-service
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

APIドキュメント: http://localhost:8001/docs

### 4. 手動での初期化（必要な場合）

自動初期化に失敗した場合や、データをリセットしたい場合：

```bash
# Cosmos DB Emulatorの再起動（データクリア）
docker-compose -f .devcontainer/docker-compose.yml restart cosmosdb

# 初期化スクリプトの実行
cd /workspace/src/auth-service
bash scripts/init_cosmosdb.sh

# 検証
bash scripts/verify_setup.sh
```

## トラブルシューティング

### Cosmos DB Emulatorが起動しない

**症状:**
```
⚠ Cosmos DB Emulator の起動に時間がかかっています
```

**対処法:**
1. 初回起動は5-10分かかることがあります。しばらく待ってください
2. タイムアウトした場合は手動で確認:
   ```bash
   curl http://localhost:8081/
   ```
3. Emulatorを再起動:
   ```bash
   docker-compose -f .devcontainer/docker-compose.yml restart cosmosdb
   ```

### 初期化スクリプトがエラーで終了する

**症状:**
```
✗ Cosmos DB 初期化失敗
```

**対処法:**
1. Emulatorが起動しているか確認:
   ```bash
   curl http://localhost:8081/
   ```

2. 環境変数を確認:
   ```bash
   cat /workspace/.env | grep COSMOS
   ```

3. 必要なパッケージをインストール:
   ```bash
   cd /workspace/src/auth-service
   pip3 install -r requirements.txt
   ```

4. 手動で初期化を再実行:
   ```bash
   bash /workspace/src/auth-service/scripts/init_cosmosdb.sh
   ```

### データベースやコンテナが見つからない

**対処法:**
```bash
cd /workspace/src/auth-service
python3 scripts/setup_containers.py
```

### 管理者ユーザーが見つからない

**対処法:**
```bash
cd /workspace/src/auth-service
python3 scripts/seed_data.py
```

## 環境変数

### 必須項目

```bash
# Cosmos DB Endpoint
# DevContainer内: http://localhost:8081
COSMOSDB_ENDPOINT=http://localhost:8081

# Cosmos DB Key (Emulator固定キー)
COSMOSDB_KEY=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==

# Database Name
COSMOSDB_DATABASE=saas-management-dev
```

### 本番環境への移行

本番環境では以下を変更してください：

1. **COSMOSDB_ENDPOINT**: Azure Cosmos DBの実際のエンドポイント
2. **COSMOSDB_KEY**: Azure Portalから取得したアクセスキー
3. **COSMOSDB_DATABASE**: 本番用データベース名
4. **初期管理者パスワード**: 強力なパスワードに変更

## セキュリティ考慮事項

### 開発環境（OK）
- ✓ Cosmos DB Emulatorの固定キーを使用
- ✓ デフォルトパスワード `Admin@123` を使用
- ✓ HTTPエンドポイントを使用

### 本番環境（NG - 変更必須）
- ✗ Emulatorキーは絶対に使用しない
- ✗ デフォルトパスワードは使用しない
- ✗ HTTPSエンドポイントを使用
- ✓ Azure Key Vaultで機密情報を管理
- ✓ マネージドIDを使用した認証
- ✓ 初回ログイン時のパスワード変更を強制

## 今後の拡張

### 他のサービスへの適用

同様の手法で他のサービス（User Management Service、Service Setting Service）にも初期化スクリプトを追加できます：

1. `src/<service>/scripts/init_<service>_cosmosdb.sh` を作成
2. `.devcontainer/setup-env.sh` に初期化処理を追加
3. サービス固有のコンテナとデータを定義

### CI/CDパイプラインへの統合

```yaml
# Azure DevOps Pipeline example
- task: AzureCLI@2
  displayName: 'Initialize Cosmos DB'
  inputs:
    azureSubscription: '$(AzureSubscription)'
    scriptType: 'bash'
    scriptLocation: 'scriptPath'
    scriptPath: 'src/auth-service/scripts/init_cosmosdb.sh'
    arguments: '--production'
```

## 参考リンク

- [Cosmos DB Emulator Documentation](https://docs.microsoft.com/azure/cosmos-db/local-emulator)
- [DevContainers Documentation](https://containers.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Azure Cosmos DB Python SDK](https://docs.microsoft.com/python/api/overview/azure/cosmos-readme)

## 変更履歴

| 日付 | 変更内容 |
|-----|---------|
| 2026-01-25 | CosmosDB自動初期化機能を追加 |
| | - init_cosmosdb.sh 作成 |
| | - verify_setup.sh 作成 |
| | - setup-env.sh 更新 |
| | - ドキュメント整備 |
