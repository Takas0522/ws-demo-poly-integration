# DevContainer Configuration

This directory contains the development container configuration for the SaaS Management Application.

## 📁 Files

- **devcontainer.json** - Main DevContainer configuration
- **docker-compose.yml** - Docker Compose configuration with CosmosDB Emulator
- **test-cosmosdb.sh** - Script to test CosmosDB Emulator connectivity

## 🚀 Quick Start

1. Install [Visual Studio Code](https://code.visualstudio.com/)
2. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
3. Open this repository in VS Code
4. Press `F1` and select "Dev Containers: Reopen in Container"

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
The following environment variables are automatically configured:
- `COSMOS_DB_ENDPOINT` - Points to the local emulator
- `COSMOS_DB_KEY` - The emulator's primary key
- `NODE_TLS_REJECT_UNAUTHORIZED=0` - Allows self-signed certificates

### Testing Connectivity
Run the connectivity test script:
```bash
.devcontainer/test-cosmosdb.sh
```

### Features
- 10 partitions configured
- Data persistence enabled
- Health checks configured
- 3GB memory limit
- 2 CPU cores allocated

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
```bash
npm --version && python --version && az --version
```

This verifies that all required tools are installed correctly.

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

### Container won't start
1. Ensure Docker Desktop is running
2. Check Docker Desktop has enough resources (at least 4GB RAM, 4 CPUs)
3. Try rebuilding: `Dev Containers: Rebuild Container`

### CosmosDB Emulator not responding
1. Wait for the emulator to fully start (can take 2-3 minutes)
2. Check logs: `docker logs <container-id>`
3. Verify health check: Run `test-cosmosdb.sh`

### Port already in use
1. Check if another service is using port 8081
2. Stop the conflicting service or change the port mapping in `docker-compose.yml`

## 📚 References

- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [Azure Cosmos DB Emulator](https://docs.microsoft.com/azure/cosmos-db/local-emulator)
- [Dev Container Features](https://containers.dev/features)
