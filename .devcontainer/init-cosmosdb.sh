#!/bin/bash

################################################################################
# CosmosDB Initialization Script for DevContainer
################################################################################
# This script initializes the CosmosDB Emulator with the required database
# and containers for the SaaS Management Application.
#
# Prerequisites:
#   - CosmosDB Emulator must be running
#   - Node.js and npm must be installed
#   - Environment variables must be set (via docker-compose.yml)
################################################################################

set -e  # Exit on error

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         CosmosDB Initialization for DevContainer              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Navigate to workspace root
cd /workspace

# Check if CosmosDB connection details are set
if [ -z "$COSMOSDB_ENDPOINT" ] || [ -z "$COSMOSDB_KEY" ]; then
    print_error "CosmosDB connection details not set in environment variables"
    print_warning "Please ensure COSMOSDB_ENDPOINT and COSMOSDB_KEY are configured"
    exit 1
fi

print_success "Environment variables loaded"
echo "  - Endpoint: $COSMOSDB_ENDPOINT"
echo "  - Database: $COSMOSDB_DATABASE"
echo ""

# Wait for CosmosDB Emulator to be ready
echo "⏳ Waiting for CosmosDB Emulator to be ready..."
MAX_WAIT=300  # 5 minutes
WAIT_TIME=0
SLEEP_INTERVAL=10

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if curl -k -s -o /dev/null -w "%{http_code}" "https://localhost:8081/_explorer/emulator.pem" | grep -q "200\|302"; then
        print_success "CosmosDB Emulator is ready!"
        break
    fi
    
    echo "  Waiting... ($WAIT_TIME/$MAX_WAIT seconds)"
    sleep $SLEEP_INTERVAL
    WAIT_TIME=$((WAIT_TIME + SLEEP_INTERVAL))
done

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    print_error "CosmosDB Emulator did not start within $MAX_WAIT seconds"
    print_warning "You can manually initialize the database later by running:"
    print_warning "  cd /workspace/scripts/cosmosdb && npm install && npm run init"
    exit 1
fi

echo ""
echo "📦 Installing CosmosDB script dependencies..."
cd /workspace/scripts/cosmosdb

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found in scripts/cosmosdb"
    exit 1
fi

# Install dependencies
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

echo ""
echo "🚀 Initializing CosmosDB database and containers..."
echo ""

# Run the initialization script
if npm run init; then
    print_success "Database initialization completed successfully"
    echo ""
else
    print_error "Database initialization failed"
    print_warning "You can retry by running:"
    print_warning "  cd /workspace/scripts/cosmosdb && npm run init"
    exit 1
fi

# Seed initial data if seed script exists
echo ""
echo "🌱 Checking for seed data script..."

if [ -f "seed-data.ts" ]; then
    echo "📊 Seeding initial data..."
    if npm run seed; then
        print_success "Initial data seeded successfully"
    else
        print_warning "Failed to seed initial data"
        print_warning "You can manually seed data by running:"
        print_warning "  cd /workspace/scripts/cosmosdb && npm run seed"
    fi
else
    print_warning "Seed data script not found (seed-data.ts)"
    print_warning "Skipping initial data seeding"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           CosmosDB Initialization Complete!                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
print_success "Your development environment is ready!"
echo ""
echo "📝 Next Steps:"
echo "  1. Start the services: npm run dev (in respective service directories)"
echo "  2. Access the services:"
echo "     - Frontend: http://localhost:3000"
echo "     - Auth Service: http://localhost:3001/docs"
echo "     - User Management: http://localhost:3002/docs"
echo "     - Service Settings: http://localhost:3003/docs"
echo "  3. CosmosDB Explorer: https://localhost:8081/_explorer/index.html"
echo ""
