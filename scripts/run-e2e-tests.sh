#!/bin/bash
#
# Run Frontend E2E Tests Only
#

set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Running Frontend E2E Tests..."
echo ""

cd "${BASE_DIR}/src/front"
npm run test:e2e

echo ""
echo "Frontend E2E tests completed!"
