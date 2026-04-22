# UI_SCREEN_SPEC.md

## 1. Design Goals
The UI should feel like a serious venture operating console:
- clear
- information-dense but not cluttered
- workflow-oriented
- trust-building
- highly explainable

Target user mindset:
“I am making resource allocation decisions, not browsing a novelty dashboard.”

## 2. Primary Screens
### Dashboard
Purpose:
- quick view of the opportunity and venture pipeline

Sections:
- top opportunity candidates
- pending approvals
- ventures by stage
- key portfolio metrics
- recent agent activity
- low-confidence alerts

### Opportunity Pipeline
Columns:
- title
- industry
- current stage
- overall score
- pain score
- feasibility score
- monetization score
- owner
- approval status
- updated at

Filters:
- stage
- industry
- score range
- owner
- status
- evidence strength

### Opportunity Detail Workspace
Tabs:
1. Overview
2. Evidence
3. Reports
4. Artifacts
5. Approvals
6. Decisions
7. Related Patterns

### Artifact Viewer
Features:
- markdown/rich text viewer
- artifact versions
- compare revisions
- approve / request changes
- export/copy actions

### Approval Queue
Actions:
- approve
- reject
- request changes
- open supporting reports

### Venture Workspace
Tabs:
1. Summary
2. Metrics
3. Experiments
4. Launch Assets
5. Decisions
6. Knowledge

### Portfolio View
Views:
- ranked ventures
- opportunity heatmap
- stage funnel
- capital/time allocation board
- kill candidates
- scale candidates

### Knowledge Base
Capabilities:
- search patterns
- browse accepted/rejected ideas
- read postmortems
- see reusable market patterns
- backlink related ventures/opportunities

### Agent Run Explorer
Columns:
- agent name
- target entity
- status
- confidence
- cost
- latency
- created at

## 3. Navigation Structure
Primary nav:
- Dashboard
- Opportunities
- Ventures
- Approvals
- Knowledge
- Agent Runs
- Portfolio
- Settings

## 4. UX Rules
1. Show score breakdowns, not just totals.
2. Always show why a recommendation exists.
3. Never hide confidence levels.
4. Keep stage transitions explicit.
5. Make approvals prominent.
6. Make rejected ideas searchable.
7. Avoid “magic AI” feeling; emphasize evidence and traceability.

## 5. Suggested Visual Language
- dark or neutral executive SaaS theme
- data-card based layout
- strong typography hierarchy
- color only for status, confidence, and stage
- minimal decorative UI
- modern control-room aesthetic

## 6. MVP Screen Priority
Build first:
1. Dashboard
2. Opportunity Pipeline
3. Opportunity Detail Workspace
4. Artifact Viewer
5. Approval Queue
6. Portfolio Summary

## 7. Empty State Guidance
- explain discovery pipeline
- prompt manual submission
- suggest running first discovery job
- prompt generation of PRD/doc pack when no artifacts exist
- show missing approval/report clearly when stage is blocked

## 8. Key UI Acceptance Criteria
A founder can:
- understand what the system found
- understand why it scored that way
- review supporting evidence
- approve or reject progression
- access generated venture artifacts
- monitor live venture health
- make portfolio decisions confidently

## 9. Suggested MVP User Journey
1. Founder logs in
2. Sees ranked opportunities
3. Opens top opportunity
4. Reviews evidence and reports
5. Requests or reviews doc pack
6. Approves build or rejects idea
7. Monitors venture status from portfolio dashboard

## 10. Future UX Expansion
- scenario simulation view
- interactive score tuning
- side-by-side opportunity comparison
- playbook templates by sector
- automated launch checklist flows
- capital planning overlay
