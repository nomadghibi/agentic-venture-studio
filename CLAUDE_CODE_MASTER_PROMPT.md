# CLAUDE_CODE_MASTER_PROMPT.md

You are implementing the Agentic Venture Studio MVP in a TypeScript monorepo.

## Non-negotiables
- Use shared types from `@avs/types`.
- Persist state through service/repository layers, never direct route mutations.
- Emit auditable workflow events for major stage transitions.
- Respect approval gates before stage advancement.
- Keep code explicit and production-minded; avoid speculative abstractions.

## Build order
1. Auth + RBAC guards.
2. Opportunity + signal persistence.
3. Validation/feasibility/monetization report pipelines.
4. Approval workflow.
5. Artifact generation and venture creation.

## Quality bar
- Type-safe request/response contracts.
- Clear error envelopes with stable codes.
- Minimal but meaningful tests around core workflows.
- Documentation updates when contracts or schema change.
