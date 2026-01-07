# 001. Use Polyrepo Architecture with Git Submodules

**Date**: 2026-01-07  
**Status**: Accepted  
**Deciders**: Development Team, Architecture Team

## Context

We are building a multi-service SaaS administration platform with several independent services (Frontend, Auth Service, User Management Service, Service Settings Service). We need to decide on a repository strategy that:

- Allows independent development and deployment of services
- Maintains clear service boundaries
- Enables coordinated releases when needed
- Supports different teams working on different services
- Provides a unified view of the entire system

The main options are:
1. Monorepo: Single repository containing all services
2. Polyrepo: Separate repositories for each service with an integration repository
3. Multirepo: Completely separate repositories with no integration layer

## Decision

We will use a **polyrepo architecture** implemented with Git submodules:

- Each service (frontend, auth-service, user-management-service, service-setting-service) has its own repository
- An integration repository (`ws-demo-poly-integration`) references all service repositories as Git submodules
- Each service can be developed, tested, and deployed independently
- The integration repository provides:
  - Unified documentation
  - Overall architecture documentation
  - Cross-service integration tests
  - Coordinated release management
  - Development environment setup (DevContainer)

Repository structure:
```
ws-demo-poly-integration/          # Integration repository
├── src/
│   ├── front/                     # Submodule: ws-demo-poly1
│   ├── auth-service/              # Submodule: ws-demo-poly3
│   ├── user-management-service/   # Submodule: ws-demo-poly2
│   └── service-setting-service/   # Submodule: ws-demo-poly4
├── docs/                          # Shared documentation
└── CONTRIBUTING.md                # Development guidelines
```

## Consequences

### Positive Consequences

- **Service Independence**: Each service can be developed, versioned, and deployed independently
- **Clear Boundaries**: Physical repository separation enforces service boundaries and reduces coupling
- **Team Autonomy**: Different teams can own different services with their own CI/CD pipelines
- **Selective Cloning**: Developers can clone only the services they need for their work
- **Individual Service History**: Each service maintains its own Git history, making changes easier to track
- **Technology Flexibility**: Services can use different technologies, frameworks, or languages
- **Faster CI/CD**: Service-specific pipelines run faster than monorepo pipelines

### Negative Consequences

- **Coordination Overhead**: Cross-service changes require coordination across multiple repositories
- **Submodule Complexity**: Team members need to understand Git submodules
- **Dependency Management**: Shared types or libraries require careful versioning
- **Integration Testing**: Cross-service tests must be maintained in the integration repository
- **Initial Setup**: More complex initial setup compared to monorepo

### Neutral Consequences

- Integration repository provides coordination point without tightly coupling services
- Requires clear documentation and guidelines for working with submodules

## Alternatives Considered

### Alternative 1: Monorepo

**Description**: Single repository containing all services in directories.

**Pros**:
- Simplified dependency management
- Atomic cross-service changes
- Single CI/CD pipeline
- Easier code sharing and refactoring
- No submodule complexity

**Cons**:
- Larger repository size
- Slower CI/CD (must test all services)
- Harder to enforce service boundaries
- All developers need access to all code
- More complex build configurations
- Potential for tight coupling

**Why rejected**: While simpler for small teams, our architecture emphasizes service independence and we want to support independent deployment cycles. Monorepo would make it too easy to violate service boundaries.

### Alternative 2: Completely Separate Repositories (Multirepo)

**Description**: Separate repositories with no integration layer.

**Pros**:
- Maximum service independence
- No submodule complexity
- Complete team autonomy

**Cons**:
- No unified view of the system
- Difficult to coordinate releases
- Harder to onboard new developers
- No shared documentation or standards
- Complex integration testing setup

**Why rejected**: Too much isolation makes it difficult to manage the system as a whole. We need a coordination point for documentation, standards, and integration testing.

## Implementation Notes

### Working with Submodules

**Initial clone**:
```bash
git clone --recursive https://github.com/Takas0522/ws-demo-poly-integration.git
```

**Update submodules**:
```bash
git submodule update --remote --recursive
```

**Make changes in a submodule**:
```bash
cd src/service-name
git checkout -b feature/my-feature
# Make changes
git commit -m "feat: add feature"
git push origin feature/my-feature
```

**Update integration repo to reference new submodule commit**:
```bash
cd ../..
git add src/service-name
git commit -m "Update service-name submodule"
git push
```

### Guidelines

1. Service repositories should be kept independent and deployable
2. Shared types should be published as npm packages
3. Integration tests go in the integration repository
4. Documentation standards maintained in integration repository
5. DevContainer configuration in integration repository

## Validation

We will validate this decision by:
- **Deployment Independence**: Successfully deploying services independently
- **Team Velocity**: Measuring if teams can work without blocking each other
- **Onboarding Time**: Tracking new developer onboarding experience
- **Code Quality**: Monitoring if service boundaries remain clean
- **Review Timeline**: 6 months after implementation

Success metrics:
- Services can be deployed independently without breaking others
- Teams report minimal cross-service coordination overhead
- New developers can contribute within 1 week
- Service dependencies remain loosely coupled

## References

- [Git Submodules Documentation](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
- [Monorepo vs Polyrepo](https://medium.com/@mattklein123/monorepos-please-dont-e9a279be011b)
- [Microservices and Repository Strategy](https://martinfowler.com/articles/microservices.html)
- DEVELOPMENT_PLAN.md in this repository

---

**Last Updated**: 2026-01-07
