#!/bin/bash
# DevContainer初期化スクリプト
# このスクリプトはDevContainer作成後に自動実行されます

set -e

echo "=========================================="
echo "  DevContainer 初期化開始"
echo "=========================================="
echo ""

# CosmosDB Emulatorを起動
echo "Starting CosmosDB Emulator..."
docker run -d \
  --name cosmosdb-emulator \
  --publish 8081:8081 \
  --publish 10250-10255:10250-10255 \
  --env AZURE_COSMOS_EMULATOR_PARTITION_COUNT=6 \
  --env AZURE_COSMOS_EMULATOR_ENABLE_DATA_PERSISTENCE=true \
  --env AZURE_COSMOS_EMULATOR_IP_ADDRESS_OVERRIDE=127.0.0.1 \
  mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest \
  2>/dev/null || echo "CosmosDB Emulator already running"

echo ""
echo "Waiting for CosmosDB Emulator to be ready..."
for i in {1..30}; do
  if curl -k https://localhost:8081/_explorer/index.html > /dev/null 2>&1; then
    echo "CosmosDB Emulator is ready!"
    break
  fi
  echo "Waiting... ($i/30)"
  sleep 2
done

echo ""
echo "=========================================="
echo "  DevContainer 初期化完了"
echo "=========================================="
echo ""
echo "CosmosDB Emulator: https://localhost:8081"
echo "Data Explorer: https://localhost:8081/_explorer/index.html"
echo ""
