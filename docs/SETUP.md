# セットアップガイド

## 前提条件

- **Docker Desktop**: 4.20以上（推奨: 最新版）
- **VS Code**: 1.80以上（推奨: 最新版）
- **Dev Containers 拡張機能**: VS Code用
- **Git**: バージョン管理
- **最小システム要件**:
  - メモリ: 8GB以上（推奨: 16GB）
  - ディスク空き容量: 10GB以上

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd <repository-name>
```

### 2. DevContainerを開く

VS Codeでプロジェクトを開き:

1. コマンドパレット（Ctrl/Cmd + Shift + P）を開く
2. **"Dev Containers: Reopen in Container"** を選択
3. ビルドが完了するまで待つ（初回は5〜10分程度）

⚠️ **重要**: 
- DevContainer起動時に**自動的にCosmosDBエミュレーターが起動**します
- 初回起動時は、CosmosDBの起動に追加で2〜3分かかります
- post-create.shが完了するまで待ってください

### 3. DevContainer内でのセットアップ

DevContainerが起動したら、ターミナルで以下を実行:

#### 仮想環境の有効化:

```bash
source /workspace/.venv/bin/activate
```

#### CosmosDB起動確認:

```bash
# CosmosDBコンテナの状態を確認
docker ps | grep cosmosdb
```

正常に起動していれば、以下のような出力が表示されます:

```
CONTAINER ID   IMAGE                                                   ...   STATUS
xxxxx          mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator...   Up X minutes (healthy)
```

#### CosmosDB接続テスト:

```bash
python scripts/test_cosmos_connection.py
```

成功すると以下のような出力が表示されます:

```
============================================================
Cosmos DB Emulator 接続テスト
============================================================

1. Cosmos DBクライアントを作成中...
   ✓ クライアント作成成功
...
✓ すべてのテストが正常に完了しました！
============================================================
```

#### データベースとコンテナの作成:

```bash
python scripts/create_database.py
```

#### 初期データの投入:

```bash
python scripts/seed_database.py
```

#### サンプルデータの投入（任意）:

```bash
python scripts/seed_sample_data.py
```

## トラブルシューティング

### CosmosDBに接続できない

**症状**: `Failed to resolve 'cosmosdb'` エラー

**原因**: CosmosDBコンテナが起動していない

**解決策**:

1. DevContainer内でCosmosDBコンテナの状態を確認:
   ```bash
   docker ps | grep cosmosdb
   ```

2. コンテナが表示されない場合は起動:
   ```bash
   docker compose up -d cosmosdb
   ```

3. 起動を待機:
   ```bash
   # 最大2分待機
   sleep 30
   docker ps | grep cosmosdb
   ```

4. それでも起動しない場合は、コンテナログを確認:
   ```bash
   docker logs cosmosdb-emulator
   ```

5. DevContainerを再起動:
   - コマンドパレット → "Dev Containers: Rebuild Container"

### CosmosDBエミュレーターの起動が遅い

**症状**: `ServiceUnavailable` エラー

**原因**: エミュレーターの初期化に時間がかかっている

**解決策**:

- 2〜3分待ってから再試行
- スクリプトにはリトライロジックが組み込まれているため、自動的に再試行されます
- 手動で起動を確認:
  ```bash
  curl -k https://localhost:8081/
  ```

### Dockerコマンドが使えない

**症状**: `docker: command not found`

**原因**: DevContainerが正しくビルドされていない

**解決策**:

1. DevContainerを再ビルド:
   - コマンドパレット → "Dev Containers: Rebuild Container"

2. Dockerfileの内容を確認:
   ```bash
   cat .devcontainer/Dockerfile
   ```
   Docker CLIがインストールされていることを確認

### ポート競合

**症状**: ポート8081が既に使用されている

**解決策**:

1. 既存のプロセスを確認:

   ```bash
   # Linux/Mac
   lsof -i :8081

   # Windows（ホスト側で実行）
   netstat -ano | findstr :8081
   ```

2. 競合するCosmosDBコンテナを停止:
   ```bash
   docker stop cosmosdb-emulator
   docker rm cosmosdb-emulator
   ```

3. DevContainerを再起動

## 開発環境の起動

すべてのセットアップが完了したら、以下のコマンドでサービスを起動できます:

### フロントエンド:

```bash
cd src/front
npm run dev
```

→ http://localhost:3000

### 認証サービス:

```bash
cd src/auth-service
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

→ http://localhost:8001/docs

### テナント管理サービス:

```bash
cd src/tenant-management-service
uvicorn app.main:app --reload --host 0.0.0.0 --port 8002
```

→ http://localhost:8002/docs

### サービス設定サービス:

```bash
cd src/service-setting-service
uvicorn app.main:app --reload --host 0.0.0.0 --port 8003
```

→ http://localhost:8003/docs

## 参考資料

- [CosmosDBエミュレーター詳細](cosmos-db-emulator.md)
- [CosmosDBクイックスタート](cosmos-db-quickstart.md)
- [テスト実行ガイド](TESTING.md)
