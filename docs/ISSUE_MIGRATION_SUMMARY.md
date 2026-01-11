# Issue Migration Summary

## Overview

This document summarizes the migration of GitHub Issues from the Integration repository to appropriate service repositories, following the polyrepo architecture.

**Migration Date:** January 11, 2026

## Migration Summary

### Total Issues: 20

- **Remained in Integration:** 14 issues
- **Migrated to Service Repos:** 6 issues

## Issue Distribution

### Integration Repository (ws-demo-poly-integration)

**Open Issues:** 14

| Issue # | Title                                                               | Phase          |
| ------- | ------------------------------------------------------------------- | -------------- |
| #1      | 001-Foundation: Setup DevContainer with CosmosDB Emulator           | Foundation     |
| #2      | 002-Foundation: Repository Structure & Documentation                | Foundation     |
| #3      | 003-Foundation: Environment Configuration & Feature Flags           | Foundation     |
| #4      | 004-Infrastructure: CosmosDB Schema Design with Tenant Partitioning | Infrastructure |
| #5      | 005-Infrastructure: Dot Notation Permission System Design           | Infrastructure |
| #6      | 006-Infrastructure: Shared Types Library (@types)                   | Infrastructure |
| #13     | 013-Services: OpenAPI Documentation Generation                      | Services       |
| #14     | 014-Data: Seed Data Creation System                                 | Data & Testing |
| #15     | 015-Testing: Unit Testing Framework                                 | Data & Testing |
| #16     | 016-Testing: Integration Testing                                    | Data & Testing |
| #17     | 017-Deployment: Azure App Service Configuration                     | Deployment     |
| #18     | 018-Deployment: GitHub Actions CI/CD Pipeline                       | Deployment     |
| #19     | 019-Deployment: Monitoring & Logging Infrastructure                 | Deployment     |
| #20     | 020-Deployment: Security & Performance Optimization                 | Deployment     |

**Closed Issues (Migrated):** 6

| Old # | Title                               | Migrated To                                                            |
| ----- | ----------------------------------- | ---------------------------------------------------------------------- |
| #7    | JWT Authentication Service          | [ws-demo-poly3#1](https://github.com/Takas0522/ws-demo-poly3/issues/1) |
| #8    | Authorization Middleware            | [ws-demo-poly3#2](https://github.com/Takas0522/ws-demo-poly3/issues/2) |
| #9    | Button-Level Authorization Controls | [ws-demo-poly1#1](https://github.com/Takas0522/ws-demo-poly1/issues/1) |
| #10   | Frontend Application Foundation     | [ws-demo-poly1#2](https://github.com/Takas0522/ws-demo-poly1/issues/2) |
| #11   | User Management Service             | [ws-demo-poly2#1](https://github.com/Takas0522/ws-demo-poly2/issues/1) |
| #12   | Service Settings Service            | [ws-demo-poly4#1](https://github.com/Takas0522/ws-demo-poly4/issues/1) |

### Auth Service (ws-demo-poly3)

**New Issues:** 2

| Issue # | Title                                                       | Dependencies                   |
| ------- | ----------------------------------------------------------- | ------------------------------ |
| #1      | 007-Auth: JWT Authentication Service Implementation         | Integration#4, Integration#6   |
| #2      | 008-Auth: Authorization Middleware with Permission Checking | Integration#5, ws-demo-poly3#1 |

**Repository:** https://github.com/Takas0522/ws-demo-poly3

### Frontend (ws-demo-poly1)

**New Issues:** 2

| Issue # | Title                                             | Dependencies                     |
| ------- | ------------------------------------------------- | -------------------------------- |
| #1      | 009-Frontend: Button-Level Authorization Controls | ws-demo-poly3#2, ws-demo-poly1#2 |
| #2      | 010-Frontend: Frontend Application Foundation     | Integration#6                    |

**Repository:** https://github.com/Takas0522/ws-demo-poly1

### User Management Service (ws-demo-poly2)

**New Issues:** 1

| Issue # | Title                                                | Dependencies                                  |
| ------- | ---------------------------------------------------- | --------------------------------------------- |
| #1      | 011-UserMgmt: User Management Service Implementation | ws-demo-poly3#1, Integration#6, Integration#4 |

**Repository:** https://github.com/Takas0522/ws-demo-poly2

### Service Settings Service (ws-demo-poly4)

**New Issues:** 1

| Issue # | Title                                                 | Dependencies                                  |
| ------- | ----------------------------------------------------- | --------------------------------------------- |
| #1      | 012-Settings: Service Settings Service Implementation | ws-demo-poly3#1, Integration#6, Integration#4 |

**Repository:** https://github.com/Takas0522/ws-demo-poly4

## Implementation Order

Based on dependencies, the recommended implementation order is:

### Phase 1: Foundation (Issues 001-003)

1. Setup DevContainer
2. Repository Documentation
3. Environment Configuration

### Phase 2: Core Infrastructure (Issues 004-006)

4. CosmosDB Schema Design
5. Permission System Design
6. Shared Types Library

### Phase 3: Authentication & Authorization (Issues 007-009)

7. JWT Authentication Service (ws-demo-poly3#1)
8. Authorization Middleware (ws-demo-poly3#2)
9. Button-Level Authorization (ws-demo-poly1#1)

### Phase 4: Service Implementation (Issues 010-013)

10. Frontend Application Foundation (ws-demo-poly1#2)
11. User Management Service (ws-demo-poly2#1)
12. Service Settings Service (ws-demo-poly4#1)
13. OpenAPI Documentation

### Phase 5: Data & Testing (Issues 014-016)

14. Seed Data Creation
15. Unit Testing Framework
16. Integration Testing

### Phase 6: Deployment & CI/CD (Issues 017-020)

17. Azure App Service Configuration
18. CI/CD Pipeline
19. Monitoring & Logging
20. Security & Performance Optimization

## Key Dependencies

### Cross-Repository Dependencies

**Integration → Services:**

- Integration#4 (CosmosDB) → Required by all service implementations
- Integration#5 (Permissions) → Required by Auth Service
- Integration#6 (Types) → Required by all services and frontend

**Services → Services:**

- ws-demo-poly3#1 (Auth) → Required by all other services
- ws-demo-poly3#2 (Auth Middleware) → Required by Frontend authorization

**Services → Integration:**

- All service implementations → Required by Integration#13 (OpenAPI)
- All service implementations → Required by Integration#15 (Testing)
- All service implementations → Required by Integration#17 (Deployment)

## Migration Benefits

1. **Better Organization:** Service-specific work is tracked in service repositories
2. **Independent Development:** Teams can work on services independently
3. **Clear Ownership:** Each repository has clear responsibility boundaries
4. **Easier Deployment:** Service deployments can be tracked separately
5. **Improved Traceability:** Commits and PRs are linked to appropriate repositories

## Guidelines

For future issue management, please refer to:

- [Issue Management Guideline](./ISSUE_MANAGEMENT_GUIDELINE.md)

## Notes

- All migrated issues in the Integration repository have been closed with references to new locations
- New issues include proper cross-repository references using `owner/repo#issue` format
- Issue numbering follows the sequence format: `[Number]-[Phase]: [Title]`
- Branch naming strategy: Use the same branch name across Integration and service repositories
