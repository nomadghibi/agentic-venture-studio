# DATA_MODEL.md

## 1. Data Model Philosophy
The model must support:
- auditability
- stage-based workflows
- artifact versioning
- evidence traceability
- multi-venture portfolio tracking
- knowledge reuse

All important records should be immutable by version, or at minimum versioned with history.

## 2. Core Entities

### Signal
Fields:
- id
- source_type
- source_url
- source_title
- source_author
- content_excerpt
- raw_content_ref
- captured_at
- language
- tags
- dedupe_hash
- ingestion_job_id

### Opportunity
Fields:
- id
- title
- problem_statement
- target_buyer
- industry
- status
- current_stage
- pain_score
- frequency_score
- buyer_clarity_score
- willingness_to_pay_score
- feasibility_score
- distribution_score
- strategic_fit_score
- portfolio_value_score
- overall_score
- confidence_level
- created_by
- owner_id
- created_at
- updated_at

### OpportunitySignalLink
- id
- opportunity_id
- signal_id
- relevance_score
- is_primary_evidence
- created_at

### Report
- id
- opportunity_id
- report_type
- version
- status
- summary
- structured_payload
- confidence_level
- agent_run_id
- created_at
- approved_at

### Artifact
- id
- opportunity_id
- venture_id
- artifact_type
- title
- version
- storage_uri
- content_hash
- status
- generated_by_agent_run_id
- created_at

### Approval
- id
- entity_type
- entity_id
- approval_type
- status
- requested_by
- reviewed_by
- review_notes
- requested_at
- reviewed_at

### Venture
- id
- opportunity_id
- name
- tagline
- business_model
- target_market
- stage
- owner_id
- launch_date
- status_reason
- created_at
- updated_at

### Experiment
- id
- venture_id
- name
- hypothesis
- channel
- start_date
- end_date
- status
- success_criteria
- result_summary
- metric_snapshot_id

### MetricSnapshot
- id
- venture_id
- snapshot_date
- visitors
- signups
- activation_rate
- conversion_rate
- mrr
- churn_rate
- cac_estimate
- payback_estimate
- nps_proxy
- notes
- created_at

### DecisionRecord
- id
- entity_type
- entity_id
- decision_type
- decision_reason
- decided_by
- supporting_report_ids
- created_at

### AgentRun
- id
- agent_name
- entity_type
- entity_id
- prompt_version
- input_hash
- output_hash
- status
- confidence_level
- latency_ms
- cost_estimate
- tool_calls
- error_message
- started_at
- completed_at

### WorkflowEvent
- id
- event_type
- entity_type
- entity_id
- stage_from
- stage_to
- triggered_by
- correlation_id
- payload
- created_at

### KnowledgeArticle
- id
- title
- slug
- article_type
- summary
- body_ref
- linked_entity_type
- linked_entity_id
- version
- created_at
- updated_at

### User
- id
- name
- email
- role
- status
- created_at
- updated_at

## 3. Enum Suggestions
### OpportunityStage
- discovery
- validation
- feasibility
- monetization
- design
- build
- launch
- live
- killed
- archived

### OpportunityStatus
- active
- rejected
- approved
- paused
- archived

### ApprovalStatus
- pending
- approved
- rejected
- needs_changes

### VentureStage
- design
- build
- launch_ready
- live
- paused
- killed
- scaled

## 4. Derived Views
- top opportunities by overall score
- opportunities awaiting approval
- ventures by stage
- artifact completeness per opportunity
- idea rejection reasons
- portfolio ROI ranking
- agent cost by workflow
- low-confidence report queue

## 5. Data Model Rules
1. Opportunities cannot skip required stage approvals.
2. Reports must reference an agent run or a human author.
3. Decisions should be append-only.
4. Artifacts should be versioned, not overwritten.
5. Rejected ideas must remain searchable.
