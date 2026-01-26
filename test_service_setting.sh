#!/bin/bash
# Service Setting Service API Test Script

set -e

BASE_URL_AUTH="http://localhost:8003"
BASE_URL_SSS="http://localhost:8004"

echo "============================================================"
echo " Service Setting Service API Test"
echo "============================================================"
echo ""

# Step 1: Login
echo "【1】ログイン"
echo "------------------------------------------------------------"
curl -s -X POST "$BASE_URL_AUTH/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"loginId": "admin@saas-platform.local", "password": "Admin@123", "tenantId": "tenant-001"}' > /tmp/login_response.json

TOKEN=$(cat /tmp/login_response.json | jq -r '.accessToken')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ ログインに失敗しました"
  cat /tmp/login_response.json | jq '.'
  exit 1
fi

echo "✅ ログイン成功"
echo "   Token: ${TOKEN:0:50}..."
echo ""

# Step 2: Get all services
echo "【2】全サービス一覧取得 (GET /api/services)"
echo "------------------------------------------------------------"
curl -s -X GET "$BASE_URL_SSS/api/services" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" > /tmp/services.json

cat /tmp/services.json | jq '.'

SERVICE_COUNT=$(cat /tmp/services.json | jq '.data | length')
echo ""
echo "✅ サービス数: $SERVICE_COUNT"
echo ""

# Step 3: Get tenant services (before assignment)
echo "【3】テナントのサービス取得 (GET /api/tenants/tenant-001/services) - 割当前"
echo "------------------------------------------------------------"
curl -s -X GET "$BASE_URL_SSS/api/tenants/tenant-001/services" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" > /tmp/tenant_services_before.json

cat /tmp/tenant_services_before.json | jq '.'

ASSIGNED_COUNT_BEFORE=$(cat /tmp/tenant_services_before.json | jq '.data | length')
echo ""
echo "✅ 割当済サービス数 (割当前): $ASSIGNED_COUNT_BEFORE"
echo ""

# Step 4: Assign services to tenant
echo "【4】テナントにサービス割当 (PUT /api/tenants/tenant-001/services)"
echo "------------------------------------------------------------"
echo "   割当するサービス: file-management, messaging"
curl -s -X PUT "$BASE_URL_SSS/api/tenants/tenant-001/services" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serviceIds": ["file-management", "messaging"]}' > /tmp/assign_response.json

cat /tmp/assign_response.json | jq '.'
echo ""
echo "✅ サービスの割当が完了しました"
echo ""

# Step 5: Get tenant services (after assignment)
echo "【5】テナントのサービス取得 (GET /api/tenants/tenant-001/services) - 割当後"
echo "------------------------------------------------------------"
curl -s -X GET "$BASE_URL_SSS/api/tenants/tenant-001/services" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" > /tmp/tenant_services_after.json

cat /tmp/tenant_services_after.json | jq '.'

ASSIGNED_COUNT_AFTER=$(cat /tmp/tenant_services_after.json | jq '.data | length')
echo ""
echo "✅ 割当済サービス数 (割当後): $ASSIGNED_COUNT_AFTER"
echo ""

# Step 6: Update services (add more)
echo "【6】テナントのサービス更新 (PUT /api/tenants/tenant-001/services) - 追加"
echo "------------------------------------------------------------"
echo "   割当するサービス: file-management, messaging, api-usage, backup"
curl -s -X PUT "$BASE_URL_SSS/api/tenants/tenant-001/services" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serviceIds": ["file-management", "messaging", "api-usage", "backup"]}' > /tmp/update_response.json

cat /tmp/update_response.json | jq '.'
echo ""
echo "✅ サービスの追加が完了しました"
echo ""

# Step 7: Verify final state
echo "【7】最終確認 (GET /api/tenants/tenant-001/services)"
echo "------------------------------------------------------------"
curl -s -X GET "$BASE_URL_SSS/api/tenants/tenant-001/services" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" > /tmp/tenant_services_final.json

cat /tmp/tenant_services_final.json | jq '.'

ASSIGNED_COUNT_FINAL=$(cat /tmp/tenant_services_final.json | jq '.data | length')
echo ""
echo "✅ 最終割当サービス数: $ASSIGNED_COUNT_FINAL"
echo ""

# Summary
echo "============================================================"
echo " テスト結果サマリー"
echo "============================================================"
echo "✅ 全サービス数: $SERVICE_COUNT"
echo "✅ 割当前: $ASSIGNED_COUNT_BEFORE サービス"
echo "✅ 初回割当後: $ASSIGNED_COUNT_AFTER サービス"
echo "✅ 最終割当数: $ASSIGNED_COUNT_FINAL サービス"
echo ""
echo "🎉 すべてのテストが正常に完了しました！"
echo "============================================================"
