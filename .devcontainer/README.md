# DevContainer 設定

このディレクトリには、VS Code DevContainerの設定が含まれています。

## 📋 概要

DevContainerを使用することで、すべての開発者が同じ開発環境で作業できます。環境には以下が含まれます：

- Node.js 20.x
- Python 3.11
- Azure CLI
- Cosmos DB Emulator
- 必要なVS Code拡張機能

## 🚀 使い方

### 前提条件

- Docker Desktop がインストールされている
- VS Code がインストールされている
- VS Code拡張機能「Dev Containers」がインストールされている

### 起動方法

1. VS Codeでプロジェクトを開く
2. コマンドパレット（Ctrl+Shift+P / Cmd+Shift+P）を開く
3. "Dev Containers: Reopen in Container" を選択
4. 初回は5-10分かかります（イメージのダウンロードとビルド）

### 自動実行される処理

DevContainer起動時に以下が自動的に実行されます：

1. **Cosmos DBエミュレータの起動**
   - docker-compose.ymlで定義
   - ポート8081でリッスン

2. **環境変数の設定**
   - setup-env.shが実行される
   - .env.developmentから.envファイルを自動生成

3. **バージョン確認**
   - Node.js、Python、Azure CLIのバージョンを表示

## 📁 ファイル構成

```
.devcontainer/
├── devcontainer.json      # DevContainer設定
├── docker-compose.yml     # Docker Compose設定
├── setup-env.sh          # 環境変数セットアップスクリプト
└── README.md             # このファイル
```

## ⚙️ 設定の詳細

### devcontainer.json

DevContainerのメイン設定ファイルです：

- **サービス定義**: Docker Composeサービスを指定
- **VS Code拡張機能**: 自動インストールされる拡張機能
- **ポートフォワーディング**: ホストに公開するポート
- **postCreateCommand**: 起動後に実行するコマンド

### docker-compose.yml

2つのサービスを定義：

1. **devcontainer**: 開発コンテナ
   - Ubuntu base image
   - ワークスペースをマウント
   - 環境変数を設定

2. **cosmosdb**: Cosmos DBエミュレータ
   - 4GB メモリ制限
   - 2 CPU コア
   - データ永続化有効
   - 5パーティション

### setup-env.sh

環境変数ファイルのセットアップスクリプト：

- .envファイルが存在しない場合に自動作成
- .env.developmentまたは.env.templateからコピー
- 実行権限が必要（chmod +x setup-env.sh）

## 🔧 カスタマイズ

### VS Code拡張機能の追加

`devcontainer.json`の`extensions`配列に追加：

```json
"extensions": [
  "existing.extension",
  "new.extension"
]
```

### ポートの追加

`devcontainer.json`の`forwardPorts`配列に追加：

```json
"forwardPorts": [
  3000,
  8080  // 新しいポート
]
```

### 環境変数の追加

`docker-compose.yml`の`environment`セクションに追加：

```yaml
environment:
  - EXISTING_VAR=value
  - NEW_VAR=new_value
```

## 🐛 トラブルシューティング

### DevContainerがビルドできない

**原因**: Docker Desktopが起動していない、またはリソース不足

**解決策**:
1. Docker Desktopが起動していることを確認
2. Docker Desktopの設定でリソースを増やす
   - メモリ: 最低8GB
   - CPU: 最低2コア

### Cosmos DBエミュレータが起動しない

**原因**: メモリ不足、またはポート競合

**解決策**:
```bash
# コンテナの状態を確認
docker ps -a

# ログを確認
docker logs ws-demo-cosmosdb-emulator

# コンテナを再起動
docker restart ws-demo-cosmosdb-emulator
```

### 環境変数が読み込まれない

**原因**: .envファイルが作成されていない

**解決策**:
```bash
# 手動で作成
cp .env.development .env

# DevContainerを再ビルド
# コマンドパレット > Dev Containers: Rebuild Container
```

### ポートが使用中

**原因**: 別のプロセスがポートを使用している

**解決策**:
```bash
# Linux/macOS
lsof -i :8081

# Windows
netstat -ano | findstr :8081

# プロセスを停止してから再起動
```

## 🔒 セキュリティ

### 機密情報の取り扱い

- `.env`ファイルは`.gitignore`に含まれており、コミットされません
- ローカル開発では、Cosmos DBエミュレータのデフォルトキーを使用
- 本番環境では、必ず強力なキーを使用してください

### エミュレータの制限

Cosmos DBエミュレータは開発専用です：

- SSL証明書は自己署名
- パフォーマンスは本番環境と異なる
- 一部の機能が制限されている

## 📚 参考資料

- [Dev Containers公式ドキュメント](https://code.visualstudio.com/docs/devcontainers/containers)
- [Docker Compose公式ドキュメント](https://docs.docker.com/compose/)
- [Azure Cosmos DB Emulator](https://learn.microsoft.com/ja-jp/azure/cosmos-db/local-emulator)

## 💡 ヒント

### コンテナ内でのコマンド実行

DevContainerは既にコンテナ内で実行されているため、通常のターミナルコマンドをそのまま使用できます：

```bash
# Node.jsアプリの起動
cd src/front
npm install
npm run dev

# Pythonサービスの起動
cd src/auth-service
pip install -r requirements.txt
python main.py
```

### 複数のターミナル

VS Codeで複数のターミナルを開いて、同時に複数のサービスを起動できます：

- ターミナル1: Frontend
- ターミナル2: Auth Service
- ターミナル3: User Management Service
- ターミナル4: Service Setting Service

### データの永続化

Cosmos DBエミュレータのデータは、Docker volumeに保存されます：

```bash
# ボリュームの確認
docker volume ls | grep ws-demo

# ボリュームの削除（データをリセット）
docker volume rm ws-demo-cosmosdb-data
```

---

**最終更新**: 2026-01-24
