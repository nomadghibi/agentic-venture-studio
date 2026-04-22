# AGENTS.md

## 1. Agent Design Standard
Every agent spec must define:
- purpose
- trigger
- inputs
- outputs
- tools
- constraints
- escalation rules
- evaluation metrics

## 2. Discovery Agents
### Opportunity Discovery Agent
- Purpose: identify repeated pain points with software potential
- Trigger: new source signals ingested or scheduled scan
- Outputs: opportunity candidates, evidence links, problem summary

### Trend Scanner Agent
- Purpose: detect emerging sectors and rising pain themes
- Outputs: trend reports, momentum score, sector clusters

### Competitor Watch Agent
- Purpose: identify competitors, substitute solutions, pricing norms
- Outputs: competitor map, positioning gaps, pricing summary

## 3. Validation Agents
### Market Research Agent
- Purpose: estimate market reality and buyer structure
- Outputs: market brief, buyer profiles, pricing range

### Problem Validation Agent
- Purpose: determine whether pain is real and worth solving
- Outputs: validation score, demand evidence summary, risk flags

### Buildability Agent
- Purpose: assess whether the idea can become a shippable product
- Outputs: feasibility score, MVP wedge, technical dependencies, risk register

### Monetization Agent
- Purpose: recommend how the venture makes money
- Outputs: pricing hypotheses, monetization model, margin assumptions

## 4. Product Design Agents
### Product Strategy Agent
- Purpose: convert opportunity into a defined product concept
- Outputs: PRD draft, personas, core workflow, feature priorities

### Architecture Agent
- Purpose: create realistic technical architecture
- Outputs: architecture document, service boundaries, data model outline, integration plan

### Knowledge Librarian Agent
- Purpose: maintain internal wiki and reusable knowledge system
- Outputs: wiki articles, backlinks, lessons learned, pattern catalog

## 5. Build and Execution Agents
### Builder Agent
- Purpose: scaffold and implement approved MVP slices
- Outputs: code artifacts, config, tests, migrations

### QA / Evaluation Agent
- Purpose: validate product quality and readiness
- Outputs: defect report, readiness score, release blockers

### Launch Agent
- Purpose: create launch-ready assets and execution checklists
- Outputs: landing page copy, channel suggestions, GTM checklist

## 6. Business Intelligence Agents
### Revenue Intelligence Agent
- Purpose: evaluate live business performance
- Outputs: activation, conversion, churn, revenue signals, recommendation

### Portfolio Manager Agent
- Purpose: compare ventures and allocate attention
- Outputs: build, pause, scale, kill recommendations

### Governance Agent
- Purpose: enforce rules and review boundaries
- Outputs: approval requests, blocked actions, audit traces

## 7. Agent Collaboration Rules
1. Agents do not directly mutate core state without service calls.
2. Agents do not self-approve stage transitions.
3. All inter-agent handoffs must pass through structured records.
4. Low-confidence outputs are never silently promoted.
5. Final recommendation and raw evidence must both be preserved.
