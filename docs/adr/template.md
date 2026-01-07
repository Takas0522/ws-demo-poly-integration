# [Number]. [Decision Title]

**Date**: YYYY-MM-DD  
**Status**: [Proposed | Accepted | Deprecated | Superseded]  
**Deciders**: [Names or roles of people involved in the decision]

## Context

Describe the context and problem statement that leads to this decision. What forces are at play? What constraints exist? What is the current situation?

Include relevant background information:
- Current architecture or approach
- Pain points or limitations
- Requirements driving the decision
- Technical or business constraints

## Decision

Clearly state the decision that was made. What approach or solution are we adopting?

Be specific about:
- What technology, pattern, or approach was chosen
- How it will be implemented
- What components or systems are affected
- Timeline for implementation (if applicable)

## Consequences

Describe the resulting context after applying the decision. What becomes easier or more difficult?

### Positive Consequences

List the benefits and improvements from this decision:
- Benefit 1
- Benefit 2
- Benefit 3

### Negative Consequences

List the drawbacks, limitations, or trade-offs:
- Trade-off 1
- Trade-off 2
- Trade-off 3

### Neutral Consequences

List changes that are neither positive nor negative:
- Change 1
- Change 2

## Alternatives Considered

Document the other options that were evaluated and explain why they were not chosen.

### Alternative 1: [Name]

**Description**: Brief description of this alternative.

**Pros**:
- Pro 1
- Pro 2

**Cons**:
- Con 1
- Con 2

**Why rejected**: Explanation of why this wasn't chosen.

### Alternative 2: [Name]

**Description**: Brief description of this alternative.

**Pros**:
- Pro 1
- Pro 2

**Cons**:
- Con 1
- Con 2

**Why rejected**: Explanation of why this wasn't chosen.

## Implementation Notes

Any specific notes about how to implement this decision:
- Migration path from current state
- Dependencies that need to be installed
- Configuration changes required
- Team training needs
- Documentation to create

## Validation

How will we validate that this decision was correct?
- Success metrics
- Performance benchmarks
- User feedback mechanisms
- Timeline for review

## References

Links to supporting resources:
- Technical documentation
- Research papers or articles
- Related ADRs
- Discussion threads or meeting notes
- Proof of concept code
- External examples or case studies

---

## Template Usage Guide

### When to Create an ADR

Create an ADR when:
- Choosing between multiple technology options
- Adopting a new architectural pattern
- Making infrastructure decisions
- Defining coding standards or practices
- Changing existing architecture significantly

### How to Fill Out This Template

1. **Number**: Use sequential numbering (001, 002, etc.)
2. **Title**: Clear, descriptive title starting with a verb (e.g., "Use PostgreSQL for Primary Database")
3. **Date**: Date when decision was made or proposed
4. **Status**: 
   - Proposed: Under discussion
   - Accepted: Approved and being implemented
   - Deprecated: No longer relevant
   - Superseded: Replaced by another ADR (link to it)
5. **Deciders**: List people or roles who made the decision

### Tips for Writing Good ADRs

- **Be concise**: Keep each section focused and to the point
- **Be specific**: Include concrete details, not vague statements
- **Think long-term**: Consider how this decision affects future development
- **Document trade-offs**: Be honest about the downsides
- **Link to evidence**: Include references to research or prototypes
- **Keep it immutable**: Once accepted, don't modify. Create a new ADR if changes are needed.

---

**Last Updated**: 2026-01-07
