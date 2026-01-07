# 🚀 SaaS Admin Web Application - Polyrepo Integration

A comprehensive SaaS administration platform built with a polyrepo architecture using Git submodules. This project demonstrates a modern, scalable approach to building multi-service applications with independent service repositories.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Services](#services)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

This project provides a multi-tenant SaaS administration application with the following key features:

- **User Management**: Complete user lifecycle management with role-based access control
- **Authentication & Authorization**: JWT-based authentication with dot-notation permission system
- **Service Settings Management**: Centralized configuration management for services
- **Multi-tenant Architecture**: CosmosDB-based tenant partitioning for data isolation
- **Button-level Authorization**: Granular UI control based on user permissions

## 🏗️ Architecture

### Polyrepo Structure

This repository follows a **polyrepo integration** pattern using Git submodules. Each service is maintained in its own repository and integrated here as a submodule:

```
ws-demo-poly-integration/
├── src/
│   ├── front/                    # Frontend application (React + TypeScript)
│   ├── auth-service/             # Authentication service
│   ├── user-management-service/  # User management service
│   └── service-setting-service/  # Service settings service
├── docs/                         # Documentation
│   ├── api/                      # API documentation
│   ├── adr/                      # Architecture Decision Records
│   └── templates/                # Templates for services
├── README.md
├── CONTRIBUTING.md
└── DEVELOPMENT_PLAN.md
```

### Service Architecture

The application follows a **microservices architecture** pattern:

- **Frontend (React)**: Single-page application providing the user interface
- **Auth Service**: Handles JWT authentication and token management
- **User Management Service**: Manages user CRUD operations and profiles
- **Service Settings Service**: Manages service configurations and feature flags

All services communicate via RESTful APIs and share common types through a shared types library (`@types`).

### Key Design Principles

1. **Trunk-based Development**: Main branch is always deployable
2. **Feature Flags**: Environment-based feature toggling for progressive rollouts
3. **Multi-tenancy**: Tenant-partitioned data using CosmosDB
4. **Permission System**: Dot-notation based granular permission control
5. **API-First**: OpenAPI/Swagger documentation for all services

## 🔧 Services

### Frontend Application (`src/front`)
- **Repository**: [ws-demo-poly1](https://github.com/Takas0522/ws-demo-poly1.git)
- **Tech Stack**: React, TypeScript, Vite
- **Purpose**: User interface for admin operations with button-level authorization

### Authentication Service (`src/auth-service`)
- **Repository**: [ws-demo-poly3](https://github.com/Takas0522/ws-demo-poly3.git)
- **Tech Stack**: Node.js, Express, TypeScript
- **Purpose**: JWT authentication, token management, and session handling

### User Management Service (`src/user-management-service`)
- **Repository**: [ws-demo-poly2](https://github.com/Takas0522/ws-demo-poly2.git)
- **Tech Stack**: Node.js, Express, TypeScript, CosmosDB
- **Purpose**: User CRUD operations, profile management, and role assignment

### Service Settings Service (`src/service-setting-service`)
- **Repository**: [ws-demo-poly4](https://github.com/Takas0522/ws-demo-poly4.git)
- **Tech Stack**: Node.js, Express, TypeScript, CosmosDB
- **Purpose**: Service configuration management and feature flag control

## 💻 Technology Stack

### Frontend
- **Framework**: React 18+
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Library**: TBD (Material-UI/Ant Design)
- **State Management**: TBD (Redux/Zustand)

### Backend Services
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Azure CosmosDB (SQL API)
- **Authentication**: JWT (jsonwebtoken)
- **API Documentation**: OpenAPI 3.0 (Swagger)

### Infrastructure
- **Hosting**: Azure App Service
- **Database**: Azure CosmosDB
- **CI/CD**: GitHub Actions
- **Container**: DevContainer with CosmosDB Emulator
- **Monitoring**: Azure Application Insights (planned)

## 🚀 Getting Started

### Prerequisites

- **Git**: Version 2.13 or higher (for submodule support)
- **Node.js**: Version 18 or higher
- **Docker**: For DevContainer and CosmosDB Emulator
- **VS Code**: Recommended with Remote - Containers extension

### Initial Setup

1. **Clone the repository with submodules:**
   ```bash
   git clone --recursive https://github.com/Takas0522/ws-demo-poly-integration.git
   cd ws-demo-poly-integration
   ```

   If you already cloned without `--recursive`, initialize submodules:
   ```bash
   git submodule update --init --recursive
   ```

2. **Open in DevContainer** (Recommended):
   - Open the project in VS Code
   - Click "Reopen in Container" when prompted
   - The DevContainer includes CosmosDB Emulator and all necessary tools

3. **Install dependencies for each service:**
   ```bash
   # Frontend
   cd src/front
   npm install

   # Auth Service
   cd ../auth-service
   npm install

   # User Management Service
   cd ../user-management-service
   npm install

   # Service Settings Service
   cd ../service-setting-service
   npm install
   ```

4. **Configure environment variables:**
   - Copy `.env.example` to `.env` in each service directory
   - Update values according to your local setup
   - See each service's README for specific configuration

### Running Locally

Start each service in separate terminals:

```bash
# Frontend (default: http://localhost:5173)
cd src/front
npm run dev

# Auth Service (default: http://localhost:3001)
cd src/auth-service
npm run dev

# User Management Service (default: http://localhost:3002)
cd src/user-management-service
npm run dev

# Service Settings Service (default: http://localhost:3003)
cd src/service-setting-service
npm run dev
```

## 🛠️ Development

### Working with Submodules

**Update all submodules to latest:**
```bash
git submodule update --remote --recursive
```

**Pull latest changes including submodules:**
```bash
git pull --recurse-submodules
```

**Make changes in a submodule:**
```bash
cd src/[service-name]
git checkout -b feature/my-feature
# Make changes
git add .
git commit -m "Add feature"
git push origin feature/my-feature
```

**Update main repository to reference new submodule commit:**
```bash
cd ../..  # Back to main repo
git add src/[service-name]
git commit -m "Update [service-name] submodule"
git push
```

### Development Workflow

This project follows **trunk-based development**. See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

**Key practices:**
- Main branch is always deployable
- Short-lived feature branches (< 2 days)
- Feature flags for incomplete features
- Continuous integration via GitHub Actions
- Code review required for all changes

### Testing

Each service has its own test suite. Run tests before committing:

```bash
# In each service directory
npm test                 # Run unit tests
npm run test:integration # Run integration tests
npm run test:coverage    # Generate coverage report
```

### Code Quality

We maintain high code quality standards:

```bash
# In each service directory
npm run lint            # Check code style
npm run lint:fix        # Auto-fix style issues
npm run type-check      # TypeScript type checking
```

## 📚 Documentation

- **[CONTRIBUTING.md](./CONTRIBUTING.md)**: Development guidelines and contribution process
- **[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)**: Detailed development roadmap and issue breakdown
- **[docs/api/](./docs/api/)**: API documentation for each service
- **[docs/adr/](./docs/adr/)**: Architecture Decision Records
- **[docs/templates/](./docs/templates/)**: Templates for new services and documentation

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](./CONTRIBUTING.md) before submitting pull requests.

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes following our coding standards
4. Write/update tests as needed
5. Commit with conventional commits: `git commit -m "feat: add new feature"`
6. Push to your fork: `git push origin feature/my-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 📞 Support

For questions, issues, or contributions:

- **GitHub Issues**: [Create an issue](https://github.com/Takas0522/ws-demo-poly-integration/issues)
- **Documentation**: See [docs/](./docs/) directory
- **Development Plan**: See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)

## 🗺️ Roadmap

See our [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for the complete development roadmap organized in 6 phases:

1. **Phase 1**: Foundation & Development Environment
2. **Phase 2**: Data Layer & Core Infrastructure
3. **Phase 3**: Authentication & Authorization
4. **Phase 4**: Service Implementation
5. **Phase 5**: Data & Testing
6. **Phase 6**: Deployment & CI/CD

---

**Built with ❤️ using modern TypeScript, React, and Azure technologies**