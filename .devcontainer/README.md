# DevContainer Configuration

This directory contains the development container configuration for the SaaS Management Application.

## 📁 Files

- **devcontainer.json** - Main DevContainer configuration
- **docker-compose.yml** - Docker Compose configuration with CosmosDB Emulator
- **setup-env.sh** - Script to automatically create `.env` file from `.env.development`
- **init-cosmosdb.sh** - Script to initialize CosmosDB database and seed data
- **test-cosmosdb.sh** - Script to test CosmosDB Emulator connectivity

## 🚀 Quick Start

1. Install [Visual Studio Code](https://code.visualstudio.com/)
2. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
3. Open this repository in VS Code
4. Press `F1` and select "Dev Containers: Reopen in Container"
5. Wait for the container to build and initialize (first time may take 5-10 minutes)

The DevContainer will automatically:
- Create `.env` file from `.env.development` (if not exists)
- Wait for CosmosDB Emulator to start
- Initialize database schema with 4 containers (Tenants, Users, Permissions, AuditLogs)
- Seed initial development data

## 🔧 What's Included

### Runtime Environments
- **Node.js 20** - For TypeScript/JavaScript services
- **Python 3.11** - For scripting and utilities
- **Azure CLI** - For Azure resource management

### Development Tools
- Git & GitHub CLI
- Docker CLI (communicates with host Docker daemon)

### VS Code Extensions
- Azure Cosmos DB - Database management UI
- Docker - Container management
- ESLint & Prettier - Code formatting
- Python & Pylance - Python development
- GitLens - Enhanced Git integration
- REST Client - API testing
- OpenAPI - API specification editing
- Jest - Testing framework integration
- Code Spell Checker - Spelling validation
- EditorConfig - Consistent editor settings

## 🗄️ CosmosDB Emulator

### Connection Details
- **Endpoint**: `https://localhost:8081`
- **Primary Key**: `C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==`

### Environment Variables
The following environment variables are automatically configured in `docker-compose.yml`:
- `COSMOSDB_ENDPOINT` - Points to the local emulator (`https://localhost:8081`)
- `COSMOSDB_KEY` - The emulator's primary key (for local dev only)
- `COSMOSDB_DATABASE` - Database name (`saas-management-dev`)
- `NODE_TLS_REJECT_UNAUTHORIZED=0` - Allows self-signed certificates

Additional environment variables are loaded from `.env` file (auto-created from `.env.development`)

### Testing Connectivity
Run the connectivity test script:
```bash
.devcontainer/test-cosmosdb.sh
```

### Resource Configuration
- **CPU**: 4 cores (2 cores reserved, 4 cores max)
- **Memory**: 6GB max, 3GB reserved
- **Partitions**: 1 (optimized for development)
- **Data Persistence**: Disabled (faster startup)
- **Health Check**: 45s interval, 30 retries, 600s startup period
- **Restart Policy**: unless-stopped (auto-restart on failure)

### Stability Improvements (2026-01-16)
The following settings have been optimized to prevent restart loops in WSL2/DevContainer environments:
- Increased memory limit to 6GB (from 4GB)
- Increased CPU limit to 4 cores (from 2 cores)
- Added CPU/memory reservations
- Enabled privileged mode for WSL2 compatibility
- Reduced partition count to 1 (from 2)
- Extended startup period to 10 minutes
- Added proper volume mounting for data persistence
- Improved health check with longer intervals
- Changed restart policy to "unless-stopped"

## 🔌 Port Forwarding

The following ports are automatically forwarded:

| Port  | Service                    |
|-------|----------------------------|
| 3000  | Frontend Application       |
| 3001  | Auth Service               |
| 3002  | User Management Service    |
| 3003  | Service Settings Service   |
| 8081  | CosmosDB Emulator (HTTPS)  |
| 10250 | CosmosDB Gateway           |
| 10251 | CosmosDB Data Plane        |
| 10252 | CosmosDB Primary           |
| 10253 | CosmosDB Secondary         |
| 10254 | CosmosDB Tertiary          |

## 📝 Post-Create Commands

After the container is created, the following commands are automatically executed:

1. **Environment Setup** - `.devcontainer/setup-env.sh`
   - Creates `.env` file from `.env.development` if not exists
   - Ensures environment variables are available for all services

2. **Version Check** - Verifies required tools are installed
   ```bash
   npm --version && python --version && az --version
   ```

3. **Database Initialization** - `.devcontainer/init-cosmosdb.sh`
   - Waits for CosmosDB Emulator to be ready (up to 5 minutes)
   - Installs npm dependencies in `scripts/cosmosdb`
   - Creates database and containers with proper partitioning
   - Seeds initial development data with default users:
     - **Admin**: `admin@example.com` / `Admin@123`
     - **User**: `user@example.com` / `User@123`

⚠️ **Important**: Change default passwords before deploying to production!

## 🔐 Security Notes

- The CosmosDB Emulator uses a well-known key for local development only
- Never use this key in production environments
- SSL certificate verification is disabled for the emulator (`NODE_TLS_REJECT_UNAUTHORIZED=0`)
- The emulator certificate can be downloaded from `https://localhost:8081/_explorer/emulator.pem`

## 🛠️ Customization

### Adding More Extensions
Edit the `customizations.vscode.extensions` array in `devcontainer.json`:
```json
"extensions": [
  "your.extension-id"
]
```

### Modifying VS Code Settings
Edit the `customizations.vscode.settings` object in `devcontainer.json`:
```json
"settings": {
  "your.setting": "value"
}
```

### Installing Additional Features
Add more features in the `features` section:
```json
"features": {
  "ghcr.io/devcontainers/features/your-feature:1": {}
}
```

## 🐛 Troubleshooting

### CosmosDB Emulator Restart Loop Issues

If the CosmosDB Emulator keeps restarting (ExitCode 255), try the following:

**1. Run the troubleshooting script:**
```bash
bash .devcontainer/troubleshoot-cosmosdb.sh
```

**2. Common causes and solutions:**

- **Insufficient resources**: The emulator requires at least 3GB RAM and 2 CPU cores
  - Solution: Increase Docker Desktop resources (Settings → Resources)
  - Current config: 6GB RAM limit, 4 CPU cores
  
- **Missing privileged mode**: WSL2 environments may require privileged mode
  - Solution: Already enabled in docker-compose.yml
  
- **Startup timeout**: First startup can take 5-10 minutes
  - Solution: Wait longer, health check has 10-minute startup period
  - Check logs: `docker logs -f <container-id>`
  
- **Port conflicts**: Port 8081 may be in use
  - Solution: Check `netstat -tulpn | grep 8081`
  
- **Volume corruption**: Data volume may be corrupted
  - Solution: Clean restart with:
    ```bash
    docker-compose -f .devcontainer/docker-compose.yml down cosmosdb
    docker volume rm ws-demo-poly-integration_devcontainer-cosmosdb-data
    docker-compose -f .devcontainer/docker-compose.yml up -d cosmosdb
    ```

**3. View real-time logs:**
```bash
docker logs -f $(docker ps -a | grep cosmosdb | awk '{print $1}' | head -n 1)
```

**4. Manual restart:**
```bash
docker-compose -f .devcontainer/docker-compose.yml restart cosmosdb
```

### Container won't start
1. Ensure Docker Desktop is running
2. Check Docker Desktop has enough resources (at least 4GB RAM, 4 CPUs)
3. Try rebuilding: `Dev Containers: Rebuild Container`

### CosmosDB Emulator not responding
1. Wait for the emulator to fully start (can take 2-3 minutes)
2. Check logs: `docker logs <container-id>`
3. Verify health check: Run `test-cosmosdb.sh`
4. Manual reinitialization:
   ```bash
   cd /workspaces/ws-demo-poly-integration/scripts/cosmosdb
   export COSMOSDB_ENDPOINT=https://localhost:8081
   export COSMOSDB_KEY="C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw=="
   export COSMOSDB_DATABASE=saas-management-dev
   npm run init
   ```

### Database initialization failed
1. Check if `.env` file exists in workspace root
2. Verify environment variables are set correctly
3. Re-run initialization manually:
   ```bash
   bash /workspaces/ws-demo-poly-integration/.devcontainer/init-cosmosdb.sh
   ```

### Port already in use
1. Check if another service is using port 8081
2. Stop the conflicting service or change the port mapping in `docker-compose.yml`

## 📚 References

- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [Azure Cosmos DB Emulator](https://docs.microsoft.com/azure/cosmos-db/local-emulator)
- [Dev Container Features](https://containers.dev/features)
