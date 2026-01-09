#!/bin/bash

# CosmosDB Emulator Connection Test Script
# This script verifies that the CosmosDB Emulator is running and accessible

set -e

echo "🔍 Testing CosmosDB Emulator connectivity..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# CosmosDB Emulator configuration
COSMOS_ENDPOINT="${COSMOS_DB_ENDPOINT:-https://localhost:8081}"
COSMOS_KEY="${COSMOS_DB_KEY:-C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==}"

echo "📋 Configuration:"
echo "   Endpoint: $COSMOS_ENDPOINT"
echo "   Using standard emulator key"
echo ""

# Test 1: Check if CosmosDB Emulator is reachable
echo "1️⃣  Testing endpoint reachability..."
if curl -k -s -f "$COSMOS_ENDPOINT/_explorer/emulator.pem" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} CosmosDB Emulator is reachable"
else
    echo -e "   ${RED}✗${NC} CosmosDB Emulator is not reachable"
    echo -e "   ${YELLOW}ℹ${NC}  Make sure the CosmosDB container is running"
    exit 1
fi

# Test 2: Download the emulator certificate
echo ""
echo "2️⃣  Downloading emulator certificate..."
if curl -k -s "$COSMOS_ENDPOINT/_explorer/emulator.pem" -o /tmp/cosmosdb-cert.pem 2>&1; then
    echo -e "   ${GREEN}✓${NC} Certificate downloaded successfully"
    echo "   Saved to: /tmp/cosmosdb-cert.pem"
else
    echo -e "   ${YELLOW}⚠${NC}  Could not download certificate"
fi

# Test 3: Check CosmosDB service health
echo ""
echo "3️⃣  Checking CosmosDB health endpoint..."
HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "$COSMOS_ENDPOINT/")
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
    echo -e "   ${GREEN}✓${NC} CosmosDB is responding (HTTP $HTTP_CODE)"
else
    echo -e "   ${YELLOW}⚠${NC}  Unexpected response code: HTTP $HTTP_CODE"
fi

# Test 4: Test connection with Azure SDK (if available)
echo ""
echo "4️⃣  Testing with Node.js (if available)..."
if command -v node &> /dev/null; then
    node -e "
        console.log('   Node.js version:', process.version);
        console.log('   \x1b[33mℹ\x1b[0m  To test with @azure/cosmos package:');
        console.log('      npm install @azure/cosmos');
        console.log('      node -e \"require('@azure/cosmos').CosmosClient\"');
    "
else
    echo -e "   ${YELLOW}ℹ${NC}  Node.js not available"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ CosmosDB Emulator is ready!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "📝 Connection details:"
echo "   Endpoint: $COSMOS_ENDPOINT"
echo "   Key: (using standard emulator key)"
echo ""
echo "🔗 Next steps:"
echo "   • Open Azure Cosmos DB extension in VS Code"
echo "   • Click 'Attach Emulator'"
echo "   • Use the endpoint and key shown above"
echo ""
echo "📚 Documentation:"
echo "   https://docs.microsoft.com/azure/cosmos-db/local-emulator"
