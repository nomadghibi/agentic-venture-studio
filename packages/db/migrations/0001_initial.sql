-- DB_SCHEMA.sql
-- Agentic Venture Studio
-- PostgreSQL-oriented starter schema

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE signals (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL,
    source_url TEXT,
    source_title TEXT,
    source_author TEXT,
    content_excerpt TEXT NOT NULL,
    raw_content_ref TEXT,
    captured_at TIMESTAMPTZ,
    language TEXT,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    dedupe_hash TEXT,
    ingestion_job_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE opportunities (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    target_buyer TEXT,
    industry TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    current_stage TEXT NOT NULL DEFAULT 'discovery',
    pain_score NUMERIC(5,2),
    frequency_score NUMERIC(5,2),
    buyer_clarity_score NUMERIC(5,2),
    willingness_to_pay_score NUMERIC(5,2),
    feasibility_score NUMERIC(5,2),
    distribution_score NUMERIC(5,2),
    strategic_fit_score NUMERIC(5,2),
    portfolio_value_score NUMERIC(5,2),
    overall_score NUMERIC(5,2),
    confidence_level TEXT,
    created_by TEXT REFERENCES users(id),
    owner_id TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE opportunity_signal_links (
    id TEXT PRIMARY KEY,
    opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    signal_id TEXT NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
    relevance_score NUMERIC(5,2),
    is_primary_evidence BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE agent_runs (
    id TEXT PRIMARY KEY,
    agent_name TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    prompt_version TEXT,
    input_hash TEXT,
    output_hash TEXT,
    status TEXT NOT NULL,
    confidence_level TEXT,
    latency_ms INTEGER,
    cost_estimate NUMERIC(12,4),
    tool_calls JSONB NOT NULL DEFAULT '[]'::jsonb,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reports (
    id TEXT PRIMARY KEY,
    opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft',
    summary TEXT,
    structured_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    confidence_level TEXT,
    agent_run_id TEXT REFERENCES agent_runs(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

CREATE TABLE ventures (
    id TEXT PRIMARY KEY,
    opportunity_id TEXT NOT NULL UNIQUE REFERENCES opportunities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tagline TEXT,
    business_model TEXT,
    target_market TEXT,
    stage TEXT NOT NULL DEFAULT 'design',
    owner_id TEXT REFERENCES users(id),
    launch_date DATE,
    status_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE artifacts (
    id TEXT PRIMARY KEY,
    opportunity_id TEXT REFERENCES opportunities(id) ON DELETE CASCADE,
    venture_id TEXT REFERENCES ventures(id) ON DELETE CASCADE,
    artifact_type TEXT NOT NULL,
    title TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    storage_uri TEXT NOT NULL,
    content_hash TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    generated_by_agent_run_id TEXT REFERENCES agent_runs(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (opportunity_id IS NOT NULL OR venture_id IS NOT NULL)
);

CREATE TABLE approvals (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    approval_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_by TEXT REFERENCES users(id),
    reviewed_by TEXT REFERENCES users(id),
    review_notes TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

CREATE TABLE experiments (
    id TEXT PRIMARY KEY,
    venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    hypothesis TEXT,
    channel TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'planned',
    success_criteria TEXT,
    result_summary TEXT,
    metric_snapshot_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE metric_snapshots (
    id TEXT PRIMARY KEY,
    venture_id TEXT NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    visitors INTEGER,
    signups INTEGER,
    activation_rate NUMERIC(6,3),
    conversion_rate NUMERIC(6,3),
    mrr NUMERIC(12,2),
    churn_rate NUMERIC(6,3),
    cac_estimate NUMERIC(12,2),
    payback_estimate NUMERIC(12,2),
    nps_proxy NUMERIC(6,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE experiments
ADD CONSTRAINT experiments_metric_snapshot_fk
FOREIGN KEY (metric_snapshot_id) REFERENCES metric_snapshots(id);

CREATE TABLE decision_records (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    decision_type TEXT NOT NULL,
    decision_reason TEXT NOT NULL,
    decided_by TEXT REFERENCES users(id),
    supporting_report_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workflow_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    stage_from TEXT,
    stage_to TEXT,
    triggered_by TEXT REFERENCES users(id),
    correlation_id TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE knowledge_articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    article_type TEXT NOT NULL,
    summary TEXT,
    body_ref TEXT NOT NULL,
    linked_entity_type TEXT,
    linked_entity_id TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_signals_source_type ON signals(source_type);
CREATE INDEX idx_opportunities_stage ON opportunities(current_stage);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_reports_opportunity_id ON reports(opportunity_id);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_artifacts_opportunity_id ON artifacts(opportunity_id);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_ventures_stage ON ventures(stage);
CREATE INDEX idx_metric_snapshots_venture_date ON metric_snapshots(venture_id, snapshot_date);
CREATE INDEX idx_agent_runs_agent_name ON agent_runs(agent_name);
CREATE INDEX idx_workflow_events_entity ON workflow_events(entity_type, entity_id);
