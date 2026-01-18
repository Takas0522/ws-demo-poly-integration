# CosmosDB Emulator 再起動ループ問題の修正

## 問題の概要

DevContainer環境でCosmosDBエミュレータが再起動を繰り返し、ExitCode 255で終了する問題が発生していました。メモリは十分（15GB中12GB利用可能）にもかかわらず、エミュレータが正常に起動しない状況でした。

## 原因の分析

調査の結果、以下の原因が特定されました：

### 1. リソース制限が不十分
- **CPU制限**: 2コアでは初回起動時にタイムアウトする可能性
- **メモリ制限**: 4GBでは、WSL2環境でマージンが不足
- **リソース予約未設定**: reservationsがないため、他のコンテナに圧迫される可能性

### 2. 再起動ポリシーの問題
- `restart: "no"` により、一度失敗すると再起動されない
- 初回起動失敗時のリカバリーが機能しない

### 3. ヘルスチェック無効化
- `condition: service_started` では、CosmosDBが完全に起動する前にアプリコンテナが起動
- アプリの接続試行がエミュレータの起動を妨げる可能性

### 4. 起動時間が不足
- 初回起動には5-10分かかることがあるが、タイムアウト設定が不適切
- ヘルスチェックが無効化されていたため、起動完了を正確に検出できない

### 5. stdin_open未設定
- 一部の環境でttyのみでは不十分で、stdin_openも必要

## 実施した修正

### 1. リソース制限の改善 ([docker-compose.yml](../.devcontainer/docker-compose.yml))

```yaml
deploy:
  resources:
    limits:
      cpus: '4.0'      # 2.0 → 4.0に増加
      memory: 6G       # 4G → 6Gに増加
    reservations:      # 新規追加
      cpus: '2.0'
      memory: 3G
```

**効果**: 
- CPU処理能力が2倍になり、初回起動の安定性が向上
- メモリマージンが2GB増加し、WSL2環境での安定性が向上
- リソース予約により、他のコンテナからの圧迫を防止

### 2. 再起動ポリシーの改善

```yaml
restart: unless-stopped  # "no" → "unless-stopped"に変更
stdin_open: true         # 新規追加
mem_swappiness: 0        # 新規追加（スワップ無効化）
```

**効果**:
- 異常終了時に自動的に再起動されるようになり、一時的な問題から自動復旧
- stdin_openにより、よりインタラクティブなコンテナ動作
- スワップ無効化によりパフォーマンス向上

### 3. ヘルスチェックの再有効化

```yaml
healthcheck:
  test: [
    "CMD-SHELL",
    "curl -k https://localhost:8081/_explorer/emulator.pem > /dev/null 2>&1 || exit 1"
  ]
  interval: 45s      # 30s → 45sに延長
  timeout: 15s       # 10s → 15sに延長
  retries: 30        # 20 → 30に増加
  start_period: 600s # 360s → 600sに延長（10分）
```

**効果**:
- より長い起動猶予期間により、初回起動の成功率が向上
- 確実に起動完了を検出してからアプリコンテナが起動

### 4. 環境変数の最適化

```yaml
environment:
  - AZURE_COSMOS_EMULATOR_PARTITION_COUNT=1  # 変更なし（既に最適化済み）
  - AZURE_COSMOS_EMULATOR_ENABLE_DATA_PERSISTENCE=false  # 変更なし
  - AZURE_COSMOS_EMULATOR_KEY_VAULT_ENDPOINT=  # 新規追加
  - AZURE_COSMOS_EMULATOR_ENABLE_PREVIEW=true  # ARGS → 環境変数に変更
```

**効果**:
- ARGSの代わりに環境変数を使用することで設定がより明確に
- KEY_VAULT_ENDPOINTを空にすることで不要な機能を無効化

### 5. ボリューム設定の追加

```yaml
volumes:
  - cosmosdb-data:/tmp/cosmos

# volumesセクションを追加
volumes:
  cosmosdb-data:
    driver: local
```

**効果**:
- データ永続化は無効でも、一時ファイル用の適切なマウントポイントを提供
- コンテナの安定性が向上

### 6. 依存関係の改善

```yaml
depends_on:
  cosmosdb:
    condition: service_healthy  # service_started → service_healthyに変更
```

**効果**:
- アプリコンテナがCosmosDBの完全起動を待つようになる
- 接続エラーの減少

### 7. 初期化スクリプトの改善 ([init-cosmosdb.sh](../.devcontainer/init-cosmosdb.sh))

```bash
MAX_RETRIES=60  # 30 → 60に増加
WAIT_INTERVAL=10
# 最大待機時間: 10分
```

**効果**:
- より長い待機時間により、初回起動の成功率が向上
- 明確なエラーメッセージとトラブルシューティングガイドの提示

### 8. トラブルシューティングスクリプトの強化 ([troubleshoot-cosmosdb.sh](../.devcontainer/troubleshoot-cosmosdb.sh))

```bash
# より詳細なログ出力（50行 → 100行）
# ExitCodeとErrorメッセージの表示
# システムメモリ状況の表示
# より具体的な復旧手順の提示
```

**効果**:
- 問題診断が容易になる
- ユーザーが自己解決できる可能性が向上

## 期待される効果

### 短期的な効果
1. **起動成功率の向上**: リソースマージンの増加により、初回起動が安定
2. **自動復旧の実現**: restart policyにより、一時的な問題から自動復旧
3. **アプリの安定性**: ヘルスチェックにより、準備完了前の接続試行を防止

### 長期的な効果
1. **開発体験の向上**: 再起動ループによる作業中断が減少
2. **トラブルシューティングの効率化**: 詳細なログと診断ツールにより問題解決が迅速に
3. **チーム全体の生産性向上**: 安定した開発環境により、環境問題への対応時間が削減

## 動作確認方法

### 1. 既存コンテナのクリーンアップ
```bash
# 既存のコンテナとボリュームを削除
docker-compose -f .devcontainer/docker-compose.yml down cosmosdb
docker volume rm ws-demo-poly-integration_devcontainer-cosmosdb-data 2>/dev/null
```

### 2. 新しい設定での起動
```bash
# DevContainerを再構築
# VS Code: F1 → "Dev Containers: Rebuild Container"

# または、手動でCosmosDBのみ起動
docker-compose -f .devcontainer/docker-compose.yml up -d cosmosdb
```

### 3. 起動状況の監視
```bash
# リアルタイムログ
docker logs -f $(docker ps -a | grep cosmosdb | awk '{print $1}' | head -n 1)

# ヘルスステータス確認
docker ps | grep cosmosdb
# STATUS列が "healthy" になるまで待機（最大10分）
```

### 4. 接続確認
```bash
# 証明書が取得できればOK
curl -k https://localhost:8081/_explorer/emulator.pem

# または、テストスクリプト実行
bash .devcontainer/test-cosmosdb.sh
```

### 5. トラブルシューティング
問題が発生した場合：
```bash
bash .devcontainer/troubleshoot-cosmosdb.sh
```

## システム要件

修正後の最小要件：
- **CPU**: 4コア推奨（最低2コア）
- **メモリ**: 8GB以上推奨（CosmosDBに6GB + その他に2GB）
- **ディスク**: 10GB以上の空き容量
- **Docker Desktop**: 最新版推奨
- **WSL2**: Windows環境では必須

## 注意事項

### Docker Desktopのリソース設定
修正を有効にするには、Docker Desktopに十分なリソースを割り当てる必要があります：

1. Docker Desktop → Settings → Resources
2. 以下の値を設定：
   - **CPUs**: 6以上（CosmosDB 4 + その他 2）
   - **Memory**: 10GB以上（CosmosDB 6GB + その他 4GB）
   - **Disk image size**: 30GB以上

### WSL2の場合
WSL2を使用している場合は、`.wslconfig` ファイルでリソースを設定：

```ini
# %USERPROFILE%\.wslconfig
[wsl2]
memory=12GB
processors=8
swap=4GB
```

設定後、WSL2を再起動：
```powershell
wsl --shutdown
```

## 関連ファイル

- [.devcontainer/docker-compose.yml](../.devcontainer/docker-compose.yml) - Docker Compose設定
- [.devcontainer/devcontainer.json](../.devcontainer/devcontainer.json) - DevContainer設定
- [.devcontainer/init-cosmosdb.sh](../.devcontainer/init-cosmosdb.sh) - 初期化スクリプト
- [.devcontainer/troubleshoot-cosmosdb.sh](../.devcontainer/troubleshoot-cosmosdb.sh) - トラブルシューティング
- [.devcontainer/README.md](../.devcontainer/README.md) - DevContainer総合ドキュメント

## 参考資料

- [Azure Cosmos DB Emulator on Linux](https://docs.microsoft.com/en-us/azure/cosmos-db/linux-emulator)
- [Docker Compose Resources](https://docs.docker.com/compose/compose-file/compose-file-v3/#resources)
- [Dev Containers Specification](https://containers.dev/)
- [WSL2 Configuration](https://docs.microsoft.com/en-us/windows/wsl/wsl-config)

---

**修正日**: 2026-01-16
**修正者**: GitHub Copilot (AI Assistant)
**問題番号**: CosmosDB Emulator restart loop (ExitCode 255)
