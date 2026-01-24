#!/bin/bash
set -e

echo "🔧 Setting up environment variables..."

# Create .env file from template if it doesn't exist
if [ ! -f .env ]; then
    if [ -f .env.development ]; then
        echo "📝 Creating .env from .env.development..."
        cp .env.development .env
    elif [ -f .env.template ]; then
        echo "📝 Creating .env from .env.template..."
        cp .env.template .env
    else
        echo "⚠️  No .env.development or .env.template found. Creating basic .env..."
        cat > .env << 'EOF'
# Cosmos DB Configuration
COSMOSDB_ENDPOINT=https://localhost:8081
COSMOSDB_KEY=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==
COSMOSDB_DATABASE=saas-management-dev

# Node Environment
NODE_ENV=development

# Development Mode
DEVELOPMENT=true
EOF
    fi
    echo "✅ Environment file created successfully!"
else
    echo "ℹ️  .env file already exists, skipping creation."
fi

echo "✅ Environment setup complete!"
