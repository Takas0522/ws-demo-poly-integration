# DevContainer 設定

このディレクトリには、VS Code DevContainerの設定ファイルが含まれています。

## 📁 ファイル構成

| ファイル | 説明 |
|---------|------|
| `devcontainer.json` | DevContainerのメイン設定ファイル |
| `docker-compose.yml` | Docker Composeによるサービス定義 |
| `Dockerfile` | 開発用コンテナのビルド定義 |
| `setup-env.sh` | 初期化スクリプト（自動実行） |

## 🚀 使用方法

### 1. 前提条件

以下のツールがインストールされている必要があります：

- **Docker Desktop** (v20.10以上)
- **Visual Studio Code** (最新版)
- **Dev Containers拡張機能** (`ms-vscode-remote.remote-containers`)

### 2. DevContainerの起動

```bash
# 1. リポジトリをクローン
git clone --recurse-submodules https://github.com/Takas0522/ws-demo-poly-integration.git
cd ws-demo-poly-integration

# 2. VS Codeで開く
code .

# 3. DevContainerで再オープン
# コマンドパレット (Ctrl+Shift+P / Cmd+Shift+P) を開き、
# "Dev Containers: Reopen in Container" を選択
```

初回起動時は以下の処理が実行されるため、5-10分かかります：
- Dockerイメージのダウンロードとビルド
- Cosmos DBエミュレータの起動
- 開発ツールのインストール

### 3. 環境変数の設定

DevContainerが起動すると、自動的に `.env.development` から `.env` が作成されます。
カスタマイズが必要な場合は `.env` を編集してください。

```bash
# 環境変数の確認
cat .env

# 必要に応じて編集
code .env
```

## 🛠️ 含まれるツール

DevContainer内では以下のツールが利用可能です：

### 言語・ランタイム
- **Node.js** 20.x (npm含む)
- **Python** 3.11 (pip含む)
- **TypeScript**

### 開発ツール
- **Azure CLI** - Azureリソース管理
- **Git** - バージョン管理
- **Black** - Pythonコードフォーマッター
- **Pylint** - Pythonリンター
- **ESLint** - JavaScriptリンター
- **Prettier** - コードフォーマッター

### Pythonパッケージ
- FastAPI
- uvicorn
- azure-cosmos
- pytest
- その他（詳細は `Dockerfile` を参照）

## 🌐 ポート転送

以下のポートが自動的に転送されます：

| ポート | サービス | 説明 |
|-------|---------|------|
| 3000 | Frontend | Next.jsアプリケーション |
| 8001 | Auth Service | 認証認可サービス |
| 8002 | User Management | ユーザー管理サービス |
| 8003 | Service Setting | サービス設定サービス |
| 8004 | Mock Services | モックサービス |
| 8081 | Cosmos DB | データベースエミュレータ |
| 10251-10254 | Cosmos DB | エミュレータ追加ポート |

## 💾 Cosmos DB Emulator

### 接続情報

| 項目 | 値 |
|------|-----|
| **エンドポイント** | `https://localhost:8081` |
| **キー** | `C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==` |
| **データベース名** | `saas-management-dev` |

⚠️ **注意**: このキーは開発専用の公開キーです。本番環境では絶対に使用しないでください。

### 起動確認

```bash
# エミュレータの状態確認
docker ps | grep cosmosdb

# 接続テスト
curl -k https://localhost:8081/_explorer/emulator.pem

# データエクスプローラー（ブラウザ）
# https://localhost:8081/_explorer/index.html
```

### データの永続化

Cosmos DBエミュレータのデータは Docker volume `cosmosdb-data` に保存されます。
コンテナを削除してもデータは保持されます。

データをリセットする場合：

```bash
# コンテナとボリュームを削除
docker-compose down -v

# 再起動
docker-compose up -d
```

## 🔄 環境の再構築

### コンテナの再ビルド

設定を変更した場合や問題が発生した場合：

```bash
# コマンドパレット > "Dev Containers: Rebuild Container"
# または
# コマンドパレット > "Dev Containers: Rebuild Container Without Cache"
```

### 完全リセット

```bash
# 1. DevContainerを閉じる
# 2. コンテナとボリュームを削除
docker-compose -f .devcontainer/docker-compose.yml down -v

# 3. イメージも削除する場合
docker-compose -f .devcontainer/docker-compose.yml down -v --rmi all

# 4. VS Codeで再度 "Reopen in Container"
```

## 📝 カスタマイズ

### 追加のVS Code拡張機能

`devcontainer.json` の `extensions` セクションに追加：

```json
"customizations": {
  "vscode": {
    "extensions": [
      "your-extension-id"
    ]
  }
}
```

### 追加のPythonパッケージ

`Dockerfile` に追加：

```dockerfile
RUN pip3 install --no-cache-dir \
    your-package-name
```

### 環境変数の追加

`docker-compose.yml` の `devcontainer` サービスに追加：

```yaml
environment:
  YOUR_VAR: your_value
```

## 🐛 トラブルシューティング

### Cosmos DBエミュレータが起動しない

**症状**: エミュレータへの接続が失敗する

**対処法**:
```bash
# ログを確認
docker logs ws-demo-cosmosdb

# 再起動
docker restart ws-demo-cosmosdb

# それでも解決しない場合は、より多くのメモリとCPUを割り当て
# Docker Desktop > Settings > Resources
# メモリ: 8GB以上、CPU: 2コア以上を推奨
```

### DevContainerが起動しない

**症状**: "Failed to connect" エラー

**対処法**:
1. Docker Desktopが起動していることを確認
2. Docker Desktopのリソース設定を確認（メモリ8GB以上推奨）
3. キャッシュなしで再ビルド:
   ```
   Dev Containers: Rebuild Container Without Cache
   ```

### ポートが既に使用されている

**症状**: "port is already allocated" エラー

**対処法**:
```bash
# 使用中のポートを確認
netstat -an | grep LISTEN

# 競合しているプロセスを停止するか、
# docker-compose.yml のポートマッピングを変更
```

### サブモジュールが空

**対処法**:
```bash
# サブモジュールの初期化と更新
git submodule init
git submodule update --recursive
```

## 📚 参考リンク

- [Dev Containers 公式ドキュメント](https://containers.dev/)
- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [Cosmos DB Emulator](https://docs.microsoft.com/azure/cosmos-db/local-emulator)
- [Docker Compose](https://docs.docker.com/compose/)

## ✅ 検証

環境が正しくセットアップされているか確認：

```bash
# 検証スクリプトを実行
bash scripts/verify-setup.sh
```

すべてのテストが成功すれば、開発環境は正常にセットアップされています！
