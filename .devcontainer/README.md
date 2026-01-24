# DevContainer Configuration

This directory contains the DevContainer configuration for the SaaS Management Application workspace.

## Overview

The DevContainer provides a complete, pre-configured development environment with:

- **Python 3.11**: For backend services (FastAPI)
- **Node.js 20**: For frontend (React/Vite) and tooling
- **CosmosDB Emulator**: Local Azure Cosmos DB instance
- **VS Code Extensions**: Pre-installed extensions for Python, TypeScript, React, and Azure
- **Automatic Initialization**: Database and seed data setup on container creation

## Quick Start

1. Open the workspace in VS Code
2. Click "Reopen in Container" when prompted
3. Wait for the container to build and initialize (~5-10 minutes first time)
4. Start developing!

## Services and Ports

The following ports are automatically forwarded:

| Port | Service | Description |
|------|---------|-------------|
| 3000 | Frontend | React/Vite application |
| 3001 | Auth Service | FastAPI authentication service |
| 3002 | User Management | FastAPI user management service |
| 3003 | Service Settings | FastAPI service settings service |
| 8081 | CosmosDB Emulator | Local Azure Cosmos DB instance |

## Files

### Core Configuration

- **devcontainer.json**: Main DevContainer configuration
  - Defines Docker Compose integration
  - Lists required VS Code extensions
  - Configures port forwarding
  - Sets up post-creation commands

- **docker-compose.yml**: Multi-service container orchestration
  - `app`: Development environment container
  - `cosmosdb`: Azure Cosmos DB Emulator

- **Dockerfile**: Custom container image
  - Based on Microsoft's Python 3.11 DevContainer
  - Includes Node.js 20.x
  - Pre-installs system dependencies

### Initialization Scripts

- **setup-env.sh**: Environment setup script
  - Copies `.env.development` to `.env`
  - Creates service-specific `.env` files from `.env.example`
  - Installs Python and Node.js dependencies

- **init-cosmosdb.sh**: CosmosDB initialization script
  - Waits for CosmosDB Emulator to be ready (max 5 minutes)
  - Installs CosmosDB script dependencies
  - Creates database and containers
  - Seeds initial development data

## Initialization Flow

```
┌─────────────────────────────────────────┐
│  DevContainer Build Started             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Docker Compose: Start Services         │
│  - app (development environment)        │
│  - cosmosdb (emulator)                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Run: setup-env.sh                      │
│  - Create .env files                    │
│  - Install dependencies                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Run: init-cosmosdb.sh                  │
│  - Wait for CosmosDB ready              │
│  - Initialize database                  │
│  - Seed development data                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Development Environment Ready! 🎉      │
└─────────────────────────────────────────┘
```

## Environment Variables

All environment variables are configured in `docker-compose.yml` and loaded from `.env.development`.

Key variables:

```bash
# CosmosDB
COSMOSDB_ENDPOINT=https://localhost:8081
COSMOSDB_KEY=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw==
COSMOSDB_DATABASE=saas-management-dev

# Services
AUTH_SERVICE_PORT=3001
USER_MANAGEMENT_SERVICE_PORT=3002
SERVICE_SETTINGS_SERVICE_PORT=3003
FRONTEND_PORT=3000

# JWT (Development only)
JWT_SECRET=dev-secret-key-not-for-production-use-only
JWT_EXPIRES_IN=7200
```

## Development Workflow

### Starting Services

Each service can be started independently:

```bash
# Auth Service
cd /workspace/src/auth-service
python -m app.main

# User Management Service
cd /workspace/src/user-management-service
python -m app.main

# Service Settings Service
cd /workspace/src/service-setting-service
python -m app.main

# Frontend
cd /workspace/src/front
npm run dev
```

### Accessing Services

- **Frontend**: http://localhost:3000
- **Auth Service API Docs**: http://localhost:3001/docs
- **User Management API Docs**: http://localhost:3002/docs
- **Service Settings API Docs**: http://localhost:3003/docs
- **CosmosDB Data Explorer**: https://localhost:8081/_explorer/index.html

### Default Test Users

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | Admin@123 | Admin |
| manager@example.com | Manager@123 | Manager |
| user@example.com | User@123 | User |

⚠️ **Important**: These are development-only credentials. Change them in production!

## Troubleshooting

### Container Won't Start

1. Check Docker is running: `docker ps`
2. Check Docker Compose logs: `docker-compose -f .devcontainer/docker-compose.yml logs`
3. Rebuild container: VS Code → Command Palette → "Dev Containers: Rebuild Container"

### CosmosDB Initialization Failed

Manual initialization:

```bash
# Set environment variables
export COSMOSDB_ENDPOINT=https://localhost:8081
export COSMOSDB_KEY="C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw=="
export COSMOSDB_DATABASE=saas-management-dev

# Run initialization
cd /workspace/scripts/cosmosdb
npm install
npm run init
npm run seed:json:dev
```

### CosmosDB Connection Issues

1. Check emulator status:
   ```bash
   curl -k https://localhost:8081/_explorer/emulator.pem
   ```

2. Verify network connectivity:
   ```bash
   docker network inspect devcontainer-network
   ```

3. Restart CosmosDB container:
   ```bash
   docker restart cosmosdb-emulator
   ```

### Port Already in Use

If ports are already in use on your host:

1. Stop conflicting services
2. Or modify port mappings in `docker-compose.yml`

### Python/Node Modules Not Found

Reinstall dependencies:

```bash
# Python services
cd /workspace/src/[service-name]
pip install -r requirements.txt

# Frontend
cd /workspace/src/front
npm install
```

## VS Code Extensions

The following extensions are automatically installed:

### Python Development
- Python (ms-python.python)
- Pylance (ms-python.vscode-pylance)
- Black Formatter (ms-python.black-formatter)
- Ruff (charliermarsh.ruff)

### JavaScript/TypeScript Development
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- ES7+ React/Redux/React-Native snippets (dsznajder.es7-react-js-snippets)

### Azure & Databases
- Azure Cosmos DB (ms-azuretools.vscode-cosmosdb)
- Docker (ms-azuretools.vscode-docker)

### Testing
- Playwright Test for VS Code (ms-playwright.playwright)

### Productivity
- EditorConfig (editorconfig.editorconfig)
- Code Spell Checker (streetsidesoftware.code-spell-checker)
- Todo Tree (gruntfuggly.todo-tree)
- GitLens (eamodio.gitlens)

## Custom Settings

Code formatting is configured for consistency:

- **Python**: Black formatter, 4 spaces, auto-format on save
- **JavaScript/TypeScript**: Prettier, 2 spaces, auto-format on save
- **JSON**: Prettier, 2 spaces, auto-format on save

## Resource Requirements

Minimum system requirements:

- **RAM**: 8 GB (16 GB recommended)
- **CPU**: 4 cores (for CosmosDB Emulator)
- **Disk**: 10 GB free space
- **Docker**: Docker Desktop 4.0+ or Docker Engine 20.10+

CosmosDB Emulator container limits:

- **Memory**: 3 GB
- **CPU**: 2 cores

## Additional Resources

- [VS Code DevContainers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [Azure Cosmos DB Emulator](https://learn.microsoft.com/azure/cosmos-db/local-emulator)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

## Support

For issues or questions:

1. Check this README
2. Review [CONTRIBUTING.md](../CONTRIBUTING.md)
3. Check existing documentation in [docs/](../docs/)
4. Create an issue in the repository
