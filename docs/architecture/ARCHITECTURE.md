# ARCHITECTURE.md

## 1. System Overview
Agentic Venture Studio is a multi-agent software platform that discovers business opportunities, validates them, converts the best ones into product artifacts, and manages them through launch and portfolio review.

The architecture is designed around five layers:
1. Ingestion Layer
2. Analysis and Scoring Layer
3. Artifact Generation Layer
4. Execution and Workflow Layer
5. Portfolio Intelligence Layer

The platform must support:
- repeatable opportunity discovery
- evidence-backed evaluation
- human approval gates
- additive expansion from MVP to full venture factory
- auditability across every agent decision

## 2. Architectural Principles
- Problem-First
- Agentic Where Reasoning Is Needed
- Human Governance
- Typed Outputs
- Evidence Traceability

## 3. High-Level Component Diagram
```text
Public Web Sources / Internal Inputs
        ↓
Data Ingestion Services
        ↓
Raw Signal Store
        ↓
Opportunity Discovery Agent
        ↓
Validation + Scoring Engine
        ↓
Research / Feasibility / Monetization Agents
        ↓
Opportunity Workspace
        ↓
Product Strategy Agent
        ↓
Architecture Agent
        ↓
Artifact Store (PRD, architecture, roadmap, prompts)
        ↓
Approval Workflow
        ↓
Builder / QA / Launch Agents
        ↓
Venture Tracking + Revenue Intelligence
        ↓
Portfolio Dashboard
```

## 4. Core Services
- Ingestion Service
- Opportunity Service
- Scoring Engine
- Agent Runtime
- Artifact Generation Service
- Workflow Orchestrator
- Approval Service
- Portfolio Intelligence Service

## 5. Agent Architecture
Each agent has:
- identity
- purpose
- input schema
- output schema
- allowed tools
- confidence rules
- escalation logic
- audit metadata

## 6. Data Architecture
### Primary Database
Suggested tables:
- opportunities
- signal_evidence
- market_reports
- validation_reports
- feasibility_reports
- monetization_models
- product_specs
- architecture_specs
- artifacts
- approvals
- ventures
- metric_snapshots
- agent_runs
- workflow_events
- knowledge_articles

### Object / Document Storage
For raw source captures, generated markdown docs, exported reports, snapshots, build bundles.

### Knowledge Store
Reusable patterns, accepted/rejected idea memory, decision rationale, internal wiki articles.

## 7. Event Model
Core events:
- signal.ingested
- opportunity.created
- opportunity.scored
- validation.completed
- feasibility.completed
- monetization.completed
- artifact.generated
- approval.requested
- approval.granted
- approval.rejected
- venture.created
- launch.started
- metrics.updated
- portfolio.reviewed

## 8. Security Architecture
Roles:
- Founder
- Operator
- Research Reviewer
- Product Lead
- Architect
- Builder
- Growth Lead
- Finance Reviewer
- Admin

Key controls:
- tool isolation
- RBAC
- auditability

## 9. Observability
Track:
- per-agent latency
- per-run cost
- failed jobs
- low-confidence outputs
- approval bottlenecks
- stage conversion rates
- model usage by workflow

## 10. MVP Architecture Choice
- Frontend: Next.js or React dashboard
- Backend: TypeScript API service
- Database: Postgres
- Queue / Workflow: BullMQ / Temporal / event queue
- Storage: S3-compatible object store
- Agent Runtime: LLM orchestration service with typed schema validation
- Auth: RBAC with session or token-based access

## 11. Scale Architecture Evolution
### MVP
- single workspace
- manual approvals
- narrow source set
- limited artifact generation
- semi-synchronous workflows

### Phase 2
- async orchestration
- builder agent
- launch support
- richer analytics

### Phase 3
- multi-tenant venture studio
- autonomous experimentation
- portfolio optimization engine
- private data connectors
- richer feedback loops
