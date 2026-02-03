#!/bin/bash
#
# Run All Tests Script
# This script runs all integration tests and E2E tests for the application
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_DIR="${BASE_DIR}/test-results"

# Create report directory
mkdir -p "${REPORT_DIR}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Execution Started${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print section header
print_header() {
    echo ""
    echo -e "${BLUE}----------------------------------------${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}----------------------------------------${NC}"
}

# Function to print success message
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error message
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print warning message
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Track test results
FAILED_TESTS=()
PASSED_TESTS=()

# Run auth-service integration tests
print_header "Auth Service Integration Tests"
cd "${BASE_DIR}/src/auth-service"
if [ -f "requirements.txt" ]; then
    if pytest tests/integration -v --tb=short --junit-xml="${REPORT_DIR}/auth-service-integration.xml" 2>&1 | tee "${REPORT_DIR}/auth-service-integration.log"; then
        print_success "Auth service integration tests passed"
        PASSED_TESTS+=("Auth Service Integration")
    else
        print_error "Auth service integration tests failed"
        FAILED_TESTS+=("Auth Service Integration")
    fi
else
    print_warning "Auth service requirements.txt not found, skipping"
fi

# Run tenant-management-service integration tests
print_header "Tenant Management Service Integration Tests"
cd "${BASE_DIR}/src/tenant-management-service"
if [ -f "requirements.txt" ]; then
    if pytest tests/integration -v --tb=short --junit-xml="${REPORT_DIR}/tenant-management-integration.xml" 2>&1 | tee "${REPORT_DIR}/tenant-management-integration.log"; then
        print_success "Tenant management service integration tests passed"
        PASSED_TESTS+=("Tenant Management Service Integration")
    else
        print_error "Tenant management service integration tests failed"
        FAILED_TESTS+=("Tenant Management Service Integration")
    fi
else
    print_warning "Tenant management service requirements.txt not found, skipping"
fi

# Run service-setting-service integration tests
print_header "Service Setting Service Integration Tests"
cd "${BASE_DIR}/src/service-setting-service"
if [ -f "requirements.txt" ]; then
    if pytest tests/integration -v --tb=short --junit-xml="${REPORT_DIR}/service-setting-integration.xml" 2>&1 | tee "${REPORT_DIR}/service-setting-integration.log"; then
        print_success "Service setting service integration tests passed"
        PASSED_TESTS+=("Service Setting Service Integration")
    else
        print_error "Service setting service integration tests failed"
        FAILED_TESTS+=("Service Setting Service Integration")
    fi
else
    print_warning "Service setting service requirements.txt not found, skipping"
fi

# Run frontend E2E tests
print_header "Frontend E2E Tests"
cd "${BASE_DIR}/src/front"
if [ -f "package.json" ]; then
    if npm run test:e2e 2>&1 | tee "${REPORT_DIR}/frontend-e2e.log"; then
        print_success "Frontend E2E tests passed"
        PASSED_TESTS+=("Frontend E2E")
    else
        print_error "Frontend E2E tests failed"
        FAILED_TESTS+=("Frontend E2E")
    fi
else
    print_warning "Frontend package.json not found, skipping"
fi

# Print summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Execution Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

echo -e "${GREEN}Passed Tests: ${#PASSED_TESTS[@]}${NC}"
for test in "${PASSED_TESTS[@]}"; do
    echo -e "  ${GREEN}✓${NC} $test"
done

echo ""

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    echo ""
    echo "Test reports saved to: ${REPORT_DIR}"
    exit 0
else
    echo -e "${RED}Failed Tests: ${#FAILED_TESTS[@]}${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}✗${NC} $test"
    done
    echo ""
    echo "Test reports saved to: ${REPORT_DIR}"
    exit 1
fi
