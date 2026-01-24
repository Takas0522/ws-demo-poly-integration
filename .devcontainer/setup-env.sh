#!/bin/bash

################################################################################
# Environment Setup Script for DevContainer
################################################################################
# This script sets up the environment variables for the development container
# by copying .env.development to .env if it doesn't exist.
################################################################################

set -e  # Exit on error

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Environment Setup for DevContainer                    ║"
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

echo "🔧 Setting up environment configuration..."
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    print_warning ".env file already exists, skipping creation"
    echo "  To recreate, delete .env and run this script again"
else
    # Try to copy from .env.development
    if [ -f ".env.development" ]; then
        cp .env.development .env
        print_success "Created .env from .env.development"
    # Fallback to .env.template if available
    elif [ -f ".env.template" ]; then
        cp .env.template .env
        print_success "Created .env from .env.template"
        print_warning "Please review and update .env with your configuration"
    else
        print_error "No .env.development or .env.template found"
        print_warning "Skipping .env creation"
    fi
fi

echo ""

# Setup .env for individual services
echo "🔧 Setting up service-specific environment files..."
echo ""

# Array of services that need .env files
declare -a services=(
    "src/auth-service"
    "src/user-management-service"
    "src/service-setting-service"
)

for service in "${services[@]}"; do
    if [ -d "$service" ]; then
        echo "Setting up $service..."
        
        if [ -f "$service/.env" ]; then
            print_warning "  .env already exists, skipping"
        elif [ -f "$service/.env.example" ]; then
            cp "$service/.env.example" "$service/.env"
            print_success "  Created .env from .env.example"
        else
            print_warning "  No .env.example found, skipping"
        fi
    fi
done

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           Environment Setup Complete!                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Install Python dependencies for services
echo "📦 Installing Python dependencies for services..."
echo ""

for service in "${services[@]}"; do
    if [ -d "$service" ] && [ -f "$service/requirements.txt" ]; then
        echo "Installing dependencies for $service..."
        cd "/workspace/$service"
        
        if pip install -r requirements.txt --quiet; then
            print_success "  Dependencies installed for $service"
        else
            print_warning "  Failed to install dependencies for $service"
        fi
        
        cd /workspace
    fi
done

echo ""

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
echo ""

# Install root package dependencies
if [ -f "package.json" ]; then
    echo "Installing root dependencies..."
    if npm install --quiet; then
        print_success "Root dependencies installed"
    else
        print_warning "Failed to install root dependencies"
    fi
fi

# Install frontend dependencies
if [ -f "src/front/package.json" ]; then
    echo "Installing frontend dependencies..."
    cd /workspace/src/front
    if npm install --quiet; then
        print_success "Frontend dependencies installed"
    else
        print_warning "Failed to install frontend dependencies"
    fi
    cd /workspace
fi

echo ""
print_success "All dependencies installed!"
echo ""
echo "📝 Summary:"
echo "  ✓ Environment files configured"
echo "  ✓ Python dependencies installed"
echo "  ✓ Node.js dependencies installed"
echo ""
echo "Next: CosmosDB initialization will begin..."
echo ""
