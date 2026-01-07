# 002. Adopt Trunk-Based Development Workflow

**Date**: 2026-01-07  
**Status**: Accepted  
**Deciders**: Development Team, DevOps Team

## Context

We need to establish a branching strategy and development workflow that:

- Supports continuous integration and continuous delivery
- Keeps the main branch always deployable
- Minimizes merge conflicts and integration problems
- Enables rapid feature development and deployment
- Works well with our polyrepo architecture
- Supports feature flags for progressive rollouts

Common branching strategies include:
- Git Flow: Long-lived feature and release branches
- GitHub Flow: Feature branches merged to main
- Trunk-Based Development: Short-lived feature branches with feature flags

## Decision

We will adopt **Trunk-Based Development** with the following practices:

### Core Principles

1. **Main Branch is Always Deployable**
   - Protected with required reviews and CI checks
   - All code merged to main must be production-ready
   - Automated tests must pass before merge

2. **Short-Lived Feature Branches**
   - Maximum lifetime: 2-3 days (ideally < 1 day)
   - Branch from latest main
   - Merge back to main via Pull Request
   - Delete after merge

3. **Feature Flags for Incomplete Features**
   - Features taking > 2 days hidden behind feature flags
   - Environment-variable controlled flags
   - Remove flags after feature stabilizes (1-2 releases)

4. **Continuous Integration**
   - Automated testing on every commit
   - Build verification for every PR
   - Code review required for all changes

### Branch Naming Convention

```
feature/description     # New features
fix/description        # Bug fixes
docs/description       # Documentation
refactor/description   # Code refactoring
test/description       # Test additions
chore/description      # Maintenance tasks
```

### Workflow Example

```bash
# 1. Start from main
git checkout main
git pull --recurse-submodules

# 2. Create short-lived feature branch
git checkout -b feature/user-profile-api

# 3. Develop and commit frequently
git commit -m "feat(user): add profile endpoint"
git commit -m "test(user): add profile tests"

# 4. Keep branch updated (if needed)
git checkout main && git pull
git checkout feature/user-profile-api
git rebase main

# 5. Push and create PR (within 2 days)
git push origin feature/user-profile-api
# Create PR on GitHub

# 6. Merge and delete branch
# (Done via GitHub after approval)
```

### Feature Flag Pattern

For features requiring more time:

```typescript
// In code
if (process.env.FEATURE_NEW_DASHBOARD === 'enabled') {
  return <NewDashboard />;
}
return <OldDashboard />;
```

```bash
# .env.local (development)
FEATURE_NEW_DASHBOARD=enabled

# .env.staging (staging)
FEATURE_NEW_DASHBOARD=enabled

# .env.production (production)
FEATURE_NEW_DASHBOARD=disabled  # Until ready
```

## Consequences

### Positive Consequences

- **Faster Integration**: Changes integrated continuously, reducing merge conflicts
- **Always Deployable**: Main branch can be released at any time
- **Reduced Risk**: Small, frequent merges are easier to review and less risky
- **Faster Feedback**: Developers get quick feedback on their changes
- **Simplified Process**: Fewer branches to manage and maintain
- **Better Collaboration**: Team sees changes quickly, improving coordination
- **Supports CI/CD**: Natural fit for automated deployment pipelines
- **Easier Rollback**: Smaller changes make issues easier to identify and revert

### Negative Consequences

- **Discipline Required**: Team must commit to short-lived branches
- **Feature Flag Overhead**: Managing feature flags adds some complexity
- **Requires Good Tests**: Inadequate tests can let bugs into main
- **Cultural Shift**: Teams used to long-lived branches need to adapt
- **Code Review Pressure**: Quick PR turnaround expected to maintain flow

### Neutral Consequences

- Feature flags need cleanup after features stabilize
- Requires strong automated testing infrastructure
- Team needs training on trunk-based practices

## Alternatives Considered

### Alternative 1: Git Flow

**Description**: Long-lived develop branch, release branches, feature branches can live for weeks.

**Pros**:
- Familiar to many developers
- Clear separation of development and production code
- Structured release process
- Multiple releases can be prepared in parallel

**Cons**:
- Complex branching model with many branch types
- Longer-lived branches lead to more merge conflicts
- Delayed integration increases risk
- Harder to maintain always-deployable state
- Release branches add overhead
- Not ideal for continuous delivery

**Why rejected**: Too complex for our needs and conflicts with our goal of continuous delivery. Long-lived branches increase integration risk and slow down development velocity.

### Alternative 2: GitHub Flow

**Description**: Feature branches merged directly to main, no develop branch.

**Pros**:
- Simpler than Git Flow
- Main branch is deployable
- Good for continuous delivery
- Easy to understand

**Cons**:
- No guidance on feature branch lifetime
- Can lead to long-lived branches without discipline
- No explicit feature flag strategy
- Less structured than trunk-based

**Why rejected**: Similar to trunk-based but less prescriptive. We prefer trunk-based development's explicit guidance on short-lived branches and feature flags.

### Alternative 3: Direct Commits to Main

**Description**: Developers commit directly to main branch.

**Pros**:
- Ultimate simplicity
- No branching overhead
- Immediate integration

**Cons**:
- No code review process
- High risk of breaking main
- Difficult to coordinate multiple developers
- No chance to run CI before merge

**Why rejected**: Too risky and eliminates important quality gates like code review and CI checks.

## Implementation Notes

### Team Onboarding

1. **Training Session**: Conduct workshop on trunk-based development
2. **Documentation**: Reference this ADR and CONTRIBUTING.md
3. **Pair Programming**: New team members pair with experienced developers
4. **PR Template**: Use PR template that reminds about branch lifetime

### Feature Flag Implementation

1. **Environment Variables**: Use `.env` files for flag configuration
2. **Naming Convention**: `FEATURE_<NAME>` for all feature flags
3. **Documentation**: Document all active flags in a central location
4. **Cleanup Schedule**: Review and remove flags quarterly
5. **Flag Types**:
   - Development flags (removed after feature completion)
   - Operational flags (permanent, control system behavior)

### CI/CD Pipeline

1. **PR Checks** (Required before merge):
   - Linting
   - Type checking
   - Unit tests (80%+ coverage)
   - Integration tests
   - Build verification

2. **Post-Merge** (Automatic):
   - Deploy to staging
   - Run smoke tests
   - Manual approval for production deployment

### Monitoring

- Track branch lifetime metrics
- Monitor main branch stability (build success rate)
- Measure time from commit to production
- Track feature flag usage and cleanup

## Validation

We will validate this decision by:

**Success Metrics**:
- Average branch lifetime < 2 days
- Main branch build success rate > 95%
- Time from commit to production < 1 day
- Merge conflict rate < 5%
- Developer satisfaction scores

**Review Timeline**: 3 months after adoption

**Review Criteria**:
- Are developers able to maintain short-lived branches?
- Is main branch stability maintained?
- Are feature flags being managed properly?
- Is the team satisfied with the workflow?

## References

- [Trunk-Based Development](https://trunkbaseddevelopment.com/)
- [Feature Flags Best Practices](https://martinfowler.com/articles/feature-toggles.html)
- [Continuous Integration by Martin Fowler](https://martinfowler.com/articles/continuousIntegration.html)
- [Git Flow vs Trunk-Based Development](https://www.toptal.com/software/trunk-based-development-git-flow)
- CONTRIBUTING.md in this repository

---

**Last Updated**: 2026-01-07
