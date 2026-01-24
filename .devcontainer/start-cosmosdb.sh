#!/bin/bash

################################################################################
# CosmosDB Docker in Docker Startup Script
################################################################################
# This script starts the CosmosDB Emulator using Docker in Docker (DinD)
# within the DevContainer.
################################################################################

set -e  # Exit on error

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         CosmosDB Docker in Docker Startup                     ║"
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

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker is not available"
    print_warning "Ensure Docker in Docker feature is enabled in devcontainer.json"
    exit 1
fi

print_success "Docker is available"

# Check if CosmosDB container is already running
if docker ps --format '{{.Names}}' | grep -q "^cosmosdb-emulator$"; then
    print_warning "CosmosDB Emulator is already running"
    echo ""
    docker ps --filter "name=cosmosdb-emulator" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    print_success "CosmosDB Emulator startup check complete"
    exit 0
fi

# Check if CosmosDB container exists but is stopped
if docker ps -a --format '{{.Names}}' | grep -q "^cosmosdb-emulator$"; then
    print_warning "CosmosDB Emulator container exists but is stopped"
    echo "🔄 Starting existing container..."

    if docker start cosmosdb-emulator; then
        print_success "CosmosDB Emulator started successfully"
        echo ""
        docker ps --filter "name=cosmosdb-emulator" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        print_success "CosmosDB Emulator is now running"
        exit 0
    else
        print_error "Failed to start existing container"
        print_warning "Removing old container and creating a new one..."
        docker rm -f cosmosdb-emulator || true
    fi
fi

# Start new CosmosDB Emulator container
echo "🚀 Starting CosmosDB Emulator container..."
echo ""

# Pull the latest image if not already present
print_warning "Pulling CosmosDB Emulator image (vnext-preview - this may take a few minutes on first run)..."
docker pull mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview || true

# Run CosmosDB Emulator with Docker in Docker
docker run -d \
    --name cosmosdb-emulator \
    --restart unless-stopped \
    -p 8081:8081 \
    -p 1234:1234 \
    -p 10250-10255:10250-10255 \
    --memory="3g" \
    --cpus="2" \
    -e AZURE_COSMOS_EMULATOR_PARTITION_COUNT=10 \
    -e AZURE_COSMOS_EMULATOR_ENABLE_DATA_PERSISTENCE="true" \
    -e AZURE_COSMOS_EMULATOR_IP_ADDRESS_OVERRIDE=0.0.0.0 \
    mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-preview

if [ $? -eq 0 ]; then
    print_success "CosmosDB Emulator container started"
    echo ""
    docker ps --filter "name=cosmosdb-emulator" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    print_success "CosmosDB Emulator is starting up..."
    echo ""
    print_warning "Note: The emulator takes 2-3 minutes to fully initialize"
    print_warning "The init-cosmosdb.sh script will wait for it to be ready"
else
    print_error "Failed to start CosmosDB Emulator"
    exit 1
fi

echo ""
print_success "CosmosDB Docker in Docker startup complete"
echo ""
