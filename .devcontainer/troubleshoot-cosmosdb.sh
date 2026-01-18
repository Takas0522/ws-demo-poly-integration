#!/bin/bash
# CosmosDBエミュレータのトラブルシューティングスクリプト

echo "=== CosmosDB Emulator Troubleshooting ==="
echo ""

# 1. コンテナの状態確認
echo "1. Checking container status..."
docker ps -a | grep cosmosdb

# 2. CosmosDBコンテナのログ確認
echo ""
echo "2. Checking CosmosDB logs (last 100 lines)..."
COSMOSDB_CONTAINER=$(docker ps -a | grep cosmosdb | awk '{print $1}' | head -n 1)
if [ ! -z "$COSMOSDB_CONTAINER" ]; then
  echo "Container ID: $COSMOSDB_CONTAINER"
  docker logs --tail 100 "$COSMOSDB_CONTAINER" 2>&1
  
  echo ""
  echo "3. Checking container exit code..."
  docker inspect "$COSMOSDB_CONTAINER" --format='{{.State.ExitCode}}' 2>/dev/null
  
  echo ""
  echo "4. Checking container error message..."
  docker inspect "$COSMOSDB_CONTAINER" --format='{{.State.Error}}' 2>/dev/null
else
  echo "CosmosDB container not found"
fi

# 3. メモリ使用状況確認
echo ""
echo "5. Checking memory usage..."
free -h
echo ""
echo "Docker container memory stats:"
docker stats --no-stream | grep cosmosdb || echo "CosmosDB container not running"

# 4. ヘルスチェック
echo ""
echo "6. Testing CosmosDB endpoint..."
curl -k https://localhost:8081/_explorer/emulator.pem 2>/dev/null && echo "✓ CosmosDB is responding" || echo "✗ CosmosDB is not responding"

# 5. クリーンアップオプション
echo ""
echo "7. Cleanup and restart options:"
echo "   To view real-time logs:  docker logs -f \$COSMOSDB_CONTAINER"
echo "   To restart CosmosDB:     docker-compose -f .devcontainer/docker-compose.yml restart cosmosdb"
echo "   To clean restart:        docker-compose -f .devcontainer/docker-compose.yml down cosmosdb && docker volume rm ws-demo-poly-integration_devcontainer-cosmosdb-data 2>/dev/null; docker-compose -f .devcontainer/docker-compose.yml up -d cosmosdb"
echo "   To rebuild all:          docker-compose -f .devcontainer/docker-compose.yml up -d --force-recreate"
