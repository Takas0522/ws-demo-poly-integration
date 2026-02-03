#!/bin/bash
#
# Run Backend Integration Tests Only
#

set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_DIR="${BASE_DIR}/test-results"

mkdir -p "${REPORT_DIR}"

echo "Running Backend Integration Tests..."
echo ""

# Auth Service
echo "Testing auth-service..."
cd "${BASE_DIR}/src/auth-service"
pytest tests/integration -v --tb=short --junit-xml="${REPORT_DIR}/auth-service-integration.xml"

# Tenant Management Service
echo ""
echo "Testing tenant-management-service..."
cd "${BASE_DIR}/src/tenant-management-service"
pytest tests/integration -v --tb=short --junit-xml="${REPORT_DIR}/tenant-management-integration.xml"

# Service Setting Service
echo ""
echo "Testing service-setting-service..."
cd "${BASE_DIR}/src/service-setting-service"
pytest tests/integration -v --tb=short --junit-xml="${REPORT_DIR}/service-setting-integration.xml"

echo ""
echo "Backend integration tests completed!"
echo "Reports saved to: ${REPORT_DIR}"
