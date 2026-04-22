# MVP_BACKLOG.md

## Goal
Build the smallest credible version of Agentic Venture Studio that can discover, score, validate, and document promising software opportunities.

## Epic 1 — Auth and Foundations
### Stories
1. Set up app shell with authenticated dashboard
2. Implement user roles and access checks
3. Create base database schema
4. Add audit logging for write actions

### Acceptance Criteria
- users can sign in
- role-based access is enforced
- key entities persist correctly

## Epic 2 — Opportunity Model
### Stories
1. Create opportunity CRUD
2. Create signal ingestion endpoint
3. Link signals to opportunities
4. Show ranked opportunity list

### Acceptance Criteria
- opportunity records can be created and viewed
- signals can be attached
- opportunities display score placeholders

## Epic 3 — Discovery Workflow
### Stories
1. Ingest raw signals
2. Run clustering and candidate creation
3. Create opportunity scoring service
4. Surface evidence snippets in UI

### Acceptance Criteria
- discovery workflow generates opportunity candidates
- evidence is visible per opportunity

## Epic 4 — Validation Reports
### Stories
1. Trigger validation report generation
2. Store report output with structured payload
3. Render validation report in opportunity workspace
4. Track confidence level and timestamps

### Acceptance Criteria
- validation report can be generated, stored, and reviewed

## Epic 5 — Feasibility and Monetization
### Stories
1. Trigger buildability report generation
2. Trigger monetization report generation
3. Compute score updates after report completion
4. Display recommendation summary

### Acceptance Criteria
- feasibility and monetization outputs are visible and linked to stage progression

## Epic 6 — Artifact Generation
### Stories
1. Generate PRD
2. Generate architecture outline
3. Generate MVP roadmap
4. Version artifacts
5. View artifacts in UI

### Acceptance Criteria
- top opportunity can produce a readable doc pack

## Epic 7 — Approval Workflow
### Stories
1. Request approval for stage transitions
2. Review and approve/reject with notes
3. Block restricted transitions without approval
4. Display pending approvals dashboard

### Acceptance Criteria
- approvals gate stage progression correctly

## Epic 8 — Dashboard and Workspace UX
### Stories
1. Build founder dashboard
2. Build opportunity pipeline table
3. Build opportunity detail workspace
4. Build artifact viewer
5. Build approvals queue

### Acceptance Criteria
- founder can review, approve, and inspect opportunities end-to-end

## Epic 9 — Agent Runtime Foundation
### Stories
1. Implement agent execution service
2. Track agent runs with metadata
3. Validate structured outputs
4. Log tool calls and errors

### Acceptance Criteria
- agent runs are auditable and retryable

## Epic 10 — Knowledge Base
### Stories
1. Create knowledge article records
2. Save reusable patterns from reports/artifacts
3. Browse accepted and rejected ideas
4. Link knowledge to opportunities

### Acceptance Criteria
- decisions and patterns are reusable and searchable

## Nice-to-Have After MVP
- venture creation flow
- metrics snapshots
- portfolio summary charts
- launch workspace
- agent run explorer

## Suggested Sprint Order
### Sprint 1
- auth
- schema
- opportunities
- signals
- dashboard shell

### Sprint 2
- discovery workflow
- validation reports
- scoring
- opportunity workspace

### Sprint 3
- feasibility
- monetization
- approvals
- artifact generation

### Sprint 4
- polish
- audit logs
- knowledge base
- bug fixing
- MVP readiness review

## MVP Exit Criteria
The MVP is ready when:
1. signals can be ingested
2. opportunities can be discovered and ranked
3. validation, feasibility, and monetization reports can be generated
4. artifacts can be produced for top opportunities
5. approvals gate progression
6. founders can review everything in one dashboard
