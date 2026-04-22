# API_CONTRACT.md

## 1. API Style
- REST for core app workflows
- async jobs for agent runs
- webhooks/events for background completion
- typed JSON contracts
- versioned endpoints

Base path example: `/api/v1`

## 2. Auth
All endpoints require authenticated access except explicitly public ones.

## 3. Opportunities
### Create Opportunity
`POST /api/v1/opportunities`

Request:
```json
{
  "title": "AI receptionist for independent roofers",
  "problem_statement": "Small roofing companies miss leads after hours and fail to follow up consistently.",
  "target_buyer": "Roofing business owner",
  "industry": "home_services"
}
```

### List Opportunities
`GET /api/v1/opportunities`

### Get Opportunity
`GET /api/v1/opportunities/:id`

### Update Opportunity
`PATCH /api/v1/opportunities/:id`

## 4. Signals
### Ingest Signal
`POST /api/v1/signals`

### List Signals for Opportunity
`GET /api/v1/opportunities/:id/signals`

## 5. Reports
### Trigger Validation Report
`POST /api/v1/opportunities/:id/reports/validation:run`

### Trigger Feasibility Report
`POST /api/v1/opportunities/:id/reports/feasibility:run`

### Trigger Monetization Report
`POST /api/v1/opportunities/:id/reports/monetization:run`

### List Reports
`GET /api/v1/opportunities/:id/reports`

### Get Report
`GET /api/v1/reports/:id`

## 6. Artifacts
### Generate PRD
`POST /api/v1/opportunities/:id/artifacts/prd:generate`

### Generate Architecture
`POST /api/v1/opportunities/:id/artifacts/architecture:generate`

### Generate Full Doc Pack
`POST /api/v1/opportunities/:id/artifacts/doc-pack:generate`

### List Artifacts
`GET /api/v1/opportunities/:id/artifacts`

### Get Artifact
`GET /api/v1/artifacts/:id`

## 7. Approvals
### Request Approval
`POST /api/v1/approvals`

### List Approval Queue
`GET /api/v1/approvals?status=pending`

### Review Approval
`POST /api/v1/approvals/:id/review`

## 8. Ventures
### Create Venture from Opportunity
`POST /api/v1/opportunities/:id/venture:create`

### List Ventures
`GET /api/v1/ventures`

### Get Venture
`GET /api/v1/ventures/:id`

### Update Venture Stage
`POST /api/v1/ventures/:id/stage-transition`

## 9. Metrics
### Add Metric Snapshot
`POST /api/v1/ventures/:id/metrics`

### Get Venture Metrics
`GET /api/v1/ventures/:id/metrics`

### Portfolio Summary
`GET /api/v1/portfolio/summary`

## 10. Agent Runs
### List Agent Runs
`GET /api/v1/agent-runs`

### Get Agent Run
`GET /api/v1/agent-runs/:id`

## 11. Knowledge Base
### List Knowledge Articles
`GET /api/v1/knowledge`

### Get Knowledge Article
`GET /api/v1/knowledge/:id`

### Trigger Knowledge Refresh
`POST /api/v1/knowledge/refresh`

## 12. Webhooks / Events
Optional callbacks:
- report.completed
- artifact.generated
- approval.reviewed
- venture.stage_changed
- metrics.updated

## 13. Error Contract
```json
{
  "error": {
    "code": "approval_required",
    "message": "Build approval is required before creating a venture."
  }
}
```
