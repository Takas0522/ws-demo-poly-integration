# Architecture Decision Records (ADR)

This directory contains Architecture Decision Records (ADRs) documenting significant architectural decisions made in this project.

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences.

## ADR Format

Each ADR follows this structure:

```markdown
# [Number]. [Title]

Date: YYYY-MM-DD
Status: [Proposed | Accepted | Deprecated | Superseded]
Deciders: [List of people involved]

## Context

What is the issue that we're seeing that is motivating this decision or change?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?

### Positive Consequences
- [Positive consequence 1]
- [Positive consequence 2]

### Negative Consequences
- [Negative consequence 1]
- [Negative consequence 2]

## Alternatives Considered

What other options were considered and why were they rejected?

## References

- [Link to related resources]
```

## Index of ADRs

| # | Title | Status | Date |
|---|-------|--------|------|
| [001](./001-polyrepo-architecture.md) | Use Polyrepo Architecture with Git Submodules | Accepted | 2026-01-07 |
| [002](./002-trunk-based-development.md) | Adopt Trunk-Based Development Workflow | Accepted | 2026-01-07 |
| [003](./003-cosmosdb-multi-tenancy.md) | Use CosmosDB with Tenant Partitioning | Accepted | 2026-01-07 |
| [004](./004-jwt-authentication.md) | Use JWT for Authentication | Accepted | 2026-01-07 |
| [005](./005-dot-notation-permissions.md) | Use Dot-Notation Permission System | Accepted | 2026-01-07 |

## Creating a New ADR

1. Copy the template from [template.md](./template.md)
2. Number it sequentially (next available number)
3. Fill in all sections with context and reasoning
4. Submit as part of your Pull Request
5. Update the index table above

## ADR Lifecycle

### Proposed
Initial draft under discussion. Not yet implemented.

### Accepted
Decision has been made and is being implemented or has been implemented.

### Deprecated
Decision is no longer relevant but kept for historical context.

### Superseded
Decision has been replaced by a newer ADR. Link to the superseding ADR.

## Best Practices

1. **Write ADRs when**:
   - Making a significant architectural decision
   - Choosing between multiple viable options
   - Adopting a new technology or pattern
   - Changing an existing architectural approach

2. **Don't write ADRs for**:
   - Trivial decisions
   - Decisions that are easily reversible
   - Implementation details that don't affect architecture

3. **Keep ADRs**:
   - Concise but complete
   - Focused on "why" not "how"
   - Immutable once accepted (create new ADR if changes needed)
   - Easy to understand for future team members

4. **Include**:
   - Context that led to the decision
   - Alternatives that were considered
   - Trade-offs and consequences
   - References to relevant resources

## References

- [Michael Nygard's ADR article](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR GitHub Organization](https://adr.github.io/)
- [Markdown Architectural Decision Records](https://adr.github.io/madr/)

---

**Last Updated**: 2026-01-07
