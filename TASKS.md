# TASKS.md

## Sprint 1
1. Wire real auth and role guards in `apps/api` + `apps/web`.
2. Replace in-memory opportunity repo with `@avs/db` repository.
3. Implement `POST /signals` persistence and signal-to-opportunity linking.
4. Connect dashboard cards and table to live API data.

## Sprint 2
1. Add validation, feasibility, monetization report endpoints.
2. Add agent run persistence and workflow events.
3. Add opportunity workspace tabs: evidence, reports, artifacts.

## Sprint 3
1. Add approval workflow endpoints and UI queue.
2. Add artifact generation stubs and versioning model.
3. Add venture creation endpoint gated by approvals.

## Quality Gates
1. Typecheck all workspaces cleanly.
2. CI: lint + typecheck + build on PR.
3. API contracts documented in `OPENAPI.yaml`.
