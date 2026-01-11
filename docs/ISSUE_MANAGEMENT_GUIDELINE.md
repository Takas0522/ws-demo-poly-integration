# Issue Management Guideline

## Overview

This document defines how to manage GitHub Issues in a polyrepo architecture where each service is managed as a Git submodule.

## Repository Structure

```
ws-demo-poly-integration (Integration Repository)
├── src/
│   ├── auth-service/          → ws-demo-poly3 (submodule)
│   ├── user-management-service/ → ws-demo-poly2 (submodule)
│   ├── service-setting-service/ → ws-demo-poly4 (submodule)
│   └── front/                 → ws-demo-poly1 (submodule)
├── packages/
│   └── @types/                → Shared types (Integration)
└── scripts/                   → Common scripts (Integration)
```

## Repository Mapping

| Service                  | Repository               | URL                                                   |
| ------------------------ | ------------------------ | ----------------------------------------------------- |
| Integration (Main)       | ws-demo-poly-integration | https://github.com/Takas0522/ws-demo-poly-integration |
| Auth Service             | ws-demo-poly3            | https://github.com/Takas0522/ws-demo-poly3            |
| User Management Service  | ws-demo-poly2            | https://github.com/Takas0522/ws-demo-poly2            |
| Service Settings Service | ws-demo-poly4            | https://github.com/Takas0522/ws-demo-poly4            |
| Frontend                 | ws-demo-poly1            | https://github.com/Takas0522/ws-demo-poly1            |

## Issue Placement Rules

### 1. Service-Specific Issues

Issues that only affect a single service should be created in **the service's repository** (submodule origin).

**Examples:**

- Auth Service API implementation → **ws-demo-poly3**
- User Management CRUD operations → **ws-demo-poly2**
- Settings Service features → **ws-demo-poly4**
- Frontend UI components → **ws-demo-poly1**

### 2. Cross-Service Issues

Issues affecting multiple services or infrastructure should be created in **the Integration repository** (ws-demo-poly-integration).

**Examples:**

- CosmosDB schema design (affects all services)
- Shared types library (@types)
- CI/CD pipeline configuration
- Azure deployment configuration
- Monitoring & logging infrastructure
- Documentation and guidelines

### 3. Shared Resources

Issues related to shared resources managed in the Integration repository:

**Examples:**

- `packages/@types/` - Shared TypeScript types
- `scripts/` - Common scripts (CosmosDB init, permissions checker)
- `docs/` - Documentation and ADRs
- `.devcontainer/` - Development environment configuration

## Issue Lifecycle in Polyrepo

### Creating Issues

1. **Determine the scope**: Identify if the issue is service-specific or cross-service
2. **Choose the repository**: Based on the rules above
3. **Create in the appropriate repository**:
   - Service-specific → Service repository
   - Cross-service/Infrastructure → Integration repository

### Branch Strategy

When working on an issue in a submodule:

1. Create a feature branch in the **submodule repository** with the same name as the Integration branch
2. Make changes and commit to the **submodule repository**
3. Update the submodule reference in the **Integration repository**
4. Create PRs in both repositories (submodule first, then Integration)

Example:

```bash
# In Integration repository
git checkout -b feature/add-auth-endpoint

# In auth-service submodule
cd src/auth-service
git checkout -b feature/add-auth-endpoint  # Same branch name
# Make changes...
git commit -m "Add new auth endpoint"
git push origin feature/add-auth-endpoint

# Back to Integration repository
cd /workspaces/ws-demo-poly-integration
git add src/auth-service
git commit -m "Update auth-service submodule"
git push origin feature/add-auth-endpoint
```

### Dependencies Between Repositories

When an issue in one repository depends on another:

- Use GitHub issue references: `Depends on Takas0522/ws-demo-poly3#5`
- Document dependencies in the issue description
- Update submodule references when dependencies are resolved

## Issue Numbering Convention

To maintain clarity across repositories, use the following format:

**Format:** `[SequenceNumber]-[Phase]: [Title]`

Examples:

- `001-Foundation: Setup DevContainer`
- `002-Foundation: Repository Documentation`
- `010-Services: Frontend Application Foundation`

### Sequence Number Assignment

Issues are numbered sequentially across the entire project to show implementation order:

| Range   | Phase                                |
| ------- | ------------------------------------ |
| 001-003 | Foundation & Development Environment |
| 004-006 | Data Layer & Core Infrastructure     |
| 007-009 | Authentication & Authorization       |
| 010-013 | Service Implementation               |
| 014-016 | Data & Testing                       |
| 017-020 | Deployment & CI/CD                   |

## Migration from Current State

### Current Issues (in Integration repository)

All current issues are in `ws-demo-poly-integration`. They need to be migrated to appropriate repositories:

**To ws-demo-poly3 (Auth Service):**

- #7: JWT Authentication Service Implementation
- #8: Authorization Middleware with Permission Checking

**To ws-demo-poly1 (Frontend):**

- #9: Button-Level Authorization Controls
- #10: Frontend Application Foundation

**To ws-demo-poly2 (User Management Service):**

- #11: User Management Service

**To ws-demo-poly4 (Service Settings Service):**

- #12: Service Settings Service

**Remain in Integration:**

- #1: Setup DevContainer
- #2: Repository Documentation
- #3: Environment Configuration
- #4: CosmosDB Schema Design
- #5: Permission System Design
- #6: Shared Types Library
- #13: OpenAPI Documentation Generation
- #14: Seed Data Creation System
- #15: Unit Testing Framework
- #16: Integration Testing
- #17: Azure App Service Configuration
- #18: CI/CD Pipeline
- #19: Monitoring & Logging
- #20: Security & Performance Optimization

## Best Practices

### 1. Clear Scope Definition

Always clearly define the scope in the issue description:

- Which service(s) are affected
- Which repository the code changes will be made in
- Dependencies on other issues/repositories

### 2. Submodule References

When an issue requires changes in a submodule, include:

```markdown
## Repository Information

- **Primary Repository**: [repo-name](repo-url)
- **Branch Strategy**: Use same branch name as Integration repository
- **Submodule Path**: `src/[service-name]`
```

### 3. Cross-Repository Communication

- Use GitHub's cross-repository references: `owner/repo#issue`
- Link related issues across repositories
- Document dependencies explicitly

### 4. Labels

Use consistent labels across repositories:

- `frontend`, `backend`, `infrastructure`
- `bug`, `feature`, `documentation`
- `security`, `performance`, `testing`
- `submodule-change` - Indicates changes in submodule

## Examples

### Example 1: Service-Specific Issue (Auth Service)

**Repository:** ws-demo-poly3

**Title:** `007-Auth: JWT Authentication Service Implementation`

**Description:**

```markdown
## 🎯 Objective

Implement JWT-based authentication service with 1-hour token expiry.

## 📦 Repository Information

- **Primary Repository**: ws-demo-poly3
- **Submodule Path**: `src/auth-service`
- **Branch Strategy**: Use same branch name as Integration

## 🔗 Dependencies

- Depends on Takas0522/ws-demo-poly-integration#4 (CosmosDB Schema)
- Depends on Takas0522/ws-demo-poly-integration#6 (Shared Types)
```

### Example 2: Cross-Service Issue (Integration)

**Repository:** ws-demo-poly-integration

**Title:** `004-Infrastructure: CosmosDB Schema Design`

**Description:**

```markdown
## 🎯 Objective

Design CosmosDB schema with tenant partitioning.

## 📦 Repository Information

- **Primary Repository**: ws-demo-poly-integration
- **Affects**: All services (auth, user-management, settings)
- **Implementation**: `scripts/cosmosdb/`

## 🔗 Related Issues

- Required by Takas0522/ws-demo-poly3#1 (Auth Service)
- Required by Takas0522/ws-demo-poly2#1 (User Management)
```

## Summary

1. **Service-specific work** → Service repository (submodule)
2. **Cross-service/Infrastructure** → Integration repository
3. **Use consistent branch names** across repositories
4. **Document dependencies** clearly
5. **Use sequence numbers** to show implementation order
