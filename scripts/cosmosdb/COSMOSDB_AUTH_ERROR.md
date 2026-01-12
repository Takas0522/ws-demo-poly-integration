# CosmosDB Emulator 認証エラーについて

## 現象

`npx ts-node init-v2-containers.ts` および他の CosmosDB 初期化スクリプトを実行すると、以下のエラーが発生します：

```
❌ Failed to create container: The input authorization token can't serve the request.
The wrong key is being used or the expected payload is not built as per the protocol.
Server used the following payload to sign: 'get

mon, 12 jan 2026 07:09:12 gmt

'
```

## 原因

Linux 版 Azure Cosmos DB Emulator と `@azure/cosmos` 4.x SDK 間の既知の互換性問題です。
日付ヘッダーが小文字（"mon, 12 jan 2026"）で生成されているため、認証トークンの署名検証に失敗しています。

正しい形式：`Mon, 12 Jan 2026 07:09:12 GMT`（頭文字大文字）
実際の形式：`mon, 12 jan 2026 07:09:12 gmt`（すべて小文字）

## 確認済みの対処法

### ❌ 効果がなかった方法

- `LC_ALL=C` 環境変数の設定
- `@azure/cosmos` の 3.x へのダウングレード（型定義の不一致でコンパイルエラー）
- CosmosClient 初期化時のカスタム agent 設定
- ロケール設定の変更

### ✅ 推奨される解決策

#### オプション 1: Azure Portal を使用して手動でコンテナを作成

CosmosDB Emulator のデータエクスプローラー（https://localhost:8081/\_explorer/index.html）にアクセスして、
以下のコンテナを手動で作成：

1. **TenantUsers**

   - Partition Key: `/userId`
   - Throughput: 400 RU/s

2. **Services**
   - Partition Key: `/tenantId`
   - Throughput: 400 RU/s

#### オプション 2: 新しい Linux Emulator イメージを使用（推奨）

`.devcontainer/docker-compose.yml` の CosmosDB イメージを新しい vnext-preview に変更：

```yaml
cosmosdb:
  image: mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview
  # その他の設定は同じ
```

その後、DevContainer を再構築：

```bash
# VS Code Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
> Dev Containers: Rebuild Container
```

#### オプション 3: 実際の Azure Cosmos DB を使用

開発環境で実際の Azure Cosmos DB インスタンスを使用し、環境変数を更新：

```bash
export COSMOSDB_ENDPOINT="https://your-account.documents.azure.com:443/"
export COSMOSDB_KEY="your-primary-key"
export COSMOSDB_DATABASE="saas-management-dev"
```

## 関連リンク

- [Azure Cosmos DB Linux Emulator (vnext-preview)](https://learn.microsoft.com/en-us/azure/cosmos-db/emulator-linux)
- [@azure/cosmos GitHub Issues](https://github.com/Azure/azure-sdk-for-js/issues)
- [Cosmos DB Emulator Troubleshooting](https://learn.microsoft.com/en-us/troubleshoot/azure/cosmos-db/tools-connectors/emulator)

## 更新履歴

- 2026-01-12: 初版作成 - Linux Emulator の認証問題を文書化
