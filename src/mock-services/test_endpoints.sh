#!/bin/bash
# Test script for Mock Services API

echo "Testing Mock Services API endpoints..."
echo ""

BASE_URL="http://localhost:8004"

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s "${BASE_URL}/health" | python3 -m json.tool
echo ""
echo ""

# Test file-management service
echo "2. Testing file-management /api/roles..."
curl -s "${BASE_URL}/file-management/api/roles" | python3 -m json.tool
echo ""
echo ""

# Test messaging service
echo "3. Testing messaging /api/roles..."
curl -s "${BASE_URL}/messaging/api/roles" | python3 -m json.tool
echo ""
echo ""

# Test api-usage service
echo "4. Testing api-usage /api/roles..."
curl -s "${BASE_URL}/api-usage/api/roles" | python3 -m json.tool
echo ""
echo ""

# Test backup service
echo "5. Testing backup /api/roles..."
curl -s "${BASE_URL}/backup/api/roles" | python3 -m json.tool
echo ""
echo ""

echo "All tests completed!"
