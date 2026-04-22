import type {
  Opportunity,
  OpportunityDecisionInput,
  OpportunityScoreInput,
  OpportunityStage,
  OpportunityStatus,
  OpportunityTimelineItem
} from "@avs/types";
import { db } from "../client.js";
import { listOpportunitiesSql } from "../queries/opportunities.js";

type OpportunityRow = {
  id: string;
  title: string;
  problem_statement: string;
  target_buyer: string;
  industry: string;
  status: Opportunity["status"];
  current_stage: Opportunity["currentStage"];
  pain_score: number | string | null;
  frequency_score: number | string | null;
  buyer_clarity_score: number | string | null;
  willingness_to_pay_score: number | string | null;
  feasibility_score: number | string | null;
  distribution_score: number | string | null;
  strategic_fit_score: number | string | null;
  portfolio_value_score: number | string | null;
  overall_score: number | string | null;
  confidence_level: Opportunity["confidenceLevel"] | null;
  created_at: string;
  updated_at: string;
};

export type OpportunityInsert = Omit<Opportunity, "id" | "createdAt" | "updatedAt">;

type WorkflowEventInsert = {
  opportunityId: string;
  eventType: string;
  triggeredBy?: string;
  stageFrom?: string;
  stageTo?: string;
  payload?: Record<string, string | number | boolean>;
};

type DecisionRecordInsert = {
  opportunityId: string;
  decisionType: OpportunityDecisionInput["decisionType"];
  reason: string;
  decidedBy?: string;
};

type TimelineRow = {
  id: string;
  kind: OpportunityTimelineItem["kind"];
  title: string;
  description: string;
  created_at: string;
  actor_id: string | null;
  metadata: unknown;
};

function mapRowToOpportunity(row: OpportunityRow): Opportunity {
  return {
    id: row.id,
    title: row.title,
    problemStatement: row.problem_statement,
    targetBuyer: row.target_buyer,
    industry: row.industry,
    status: row.status,
    currentStage: row.current_stage,
    painScore: Number(row.pain_score ?? 0),
    frequencyScore: Number(row.frequency_score ?? 0),
    buyerClarityScore: Number(row.buyer_clarity_score ?? 0),
    willingnessToPayScore: Number(row.willingness_to_pay_score ?? 0),
    feasibilityScore: Number(row.feasibility_score ?? 0),
    distributionScore: Number(row.distribution_score ?? 0),
    strategicFitScore: Number(row.strategic_fit_score ?? 0),
    portfolioValueScore: Number(row.portfolio_value_score ?? 0),
    overallScore: Number(row.overall_score ?? 0),
    confidenceLevel: row.confidence_level ?? "medium",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function deriveConfidenceLevel(overallScore: number): Opportunity["confidenceLevel"] {
  if (overallScore >= 75) {
    return "high";
  }

  if (overallScore >= 45) {
    return "medium";
  }

  return "low";
}

function calculateOverallScore(input: OpportunityScoreInput): number {
  const values = [
    input.painScore,
    input.frequencyScore,
    input.buyerClarityScore,
    input.willingnessToPayScore,
    input.feasibilityScore,
    input.distributionScore,
    input.strategicFitScore,
    input.portfolioValueScore
  ];
  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
}

function sanitizeTimelineMetadata(
  raw: unknown
): Record<string, string | number | boolean> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }

  const output: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      output[key] = value;
    } else if (value != null) {
      output[key] = String(value);
    }
  }

  return Object.keys(output).length > 0 ? output : undefined;
}

async function resolveExistingUserId(userId?: string): Promise<string | null> {
  if (!userId) {
    return null;
  }

  const result = await db.query<{ id: string }>(
    `
      SELECT id
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );

  const row = result.rows[0];
  return row?.id ?? null;
}

export async function listOpportunities(): Promise<Opportunity[]> {
  const result = await db.query(listOpportunitiesSql);
  return result.rows.map((row) => mapRowToOpportunity(row as OpportunityRow));
}

export async function getOpportunityById(id: string): Promise<Opportunity | null> {
  const result = await db.query<OpportunityRow>(
    `
      SELECT
        id,
        title,
        problem_statement,
        target_buyer,
        industry,
        status,
        current_stage,
        pain_score,
        frequency_score,
        buyer_clarity_score,
        willingness_to_pay_score,
        feasibility_score,
        distribution_score,
        strategic_fit_score,
        portfolio_value_score,
        overall_score,
        confidence_level,
        created_at::text AS created_at,
        updated_at::text AS updated_at
      FROM opportunities
      WHERE id = $1
    `,
    [id]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return mapRowToOpportunity(row);
}

export async function createOpportunity(input: OpportunityInsert): Promise<Opportunity> {
  const id = crypto.randomUUID();

  const result = await db.query<OpportunityRow>(
    `
      INSERT INTO opportunities (
        id,
        title,
        problem_statement,
        target_buyer,
        industry,
        status,
        current_stage,
        pain_score,
        frequency_score,
        buyer_clarity_score,
        willingness_to_pay_score,
        feasibility_score,
        distribution_score,
        strategic_fit_score,
        portfolio_value_score,
        overall_score,
        confidence_level
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,
        $17
      )
      RETURNING
        id,
        title,
        problem_statement,
        target_buyer,
        industry,
        status,
        current_stage,
        pain_score,
        frequency_score,
        buyer_clarity_score,
        willingness_to_pay_score,
        feasibility_score,
        distribution_score,
        strategic_fit_score,
        portfolio_value_score,
        overall_score,
        confidence_level,
        created_at::text AS created_at,
        updated_at::text AS updated_at
    `,
    [
      id,
      input.title,
      input.problemStatement,
      input.targetBuyer,
      input.industry,
      input.status,
      input.currentStage,
      input.painScore,
      input.frequencyScore,
      input.buyerClarityScore,
      input.willingnessToPayScore,
      input.feasibilityScore,
      input.distributionScore,
      input.strategicFitScore,
      input.portfolioValueScore,
      input.overallScore,
      input.confidenceLevel
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to create opportunity");
  }

  return mapRowToOpportunity(row);
}

export async function updateOpportunityScores(
  id: string,
  input: OpportunityScoreInput
): Promise<Opportunity | null> {
  const overallScore = calculateOverallScore(input);
  const confidenceLevel = deriveConfidenceLevel(overallScore);

  const result = await db.query<OpportunityRow>(
    `
      UPDATE opportunities
      SET
        pain_score = $2,
        frequency_score = $3,
        buyer_clarity_score = $4,
        willingness_to_pay_score = $5,
        feasibility_score = $6,
        distribution_score = $7,
        strategic_fit_score = $8,
        portfolio_value_score = $9,
        overall_score = $10,
        confidence_level = $11,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        title,
        problem_statement,
        target_buyer,
        industry,
        status,
        current_stage,
        pain_score,
        frequency_score,
        buyer_clarity_score,
        willingness_to_pay_score,
        feasibility_score,
        distribution_score,
        strategic_fit_score,
        portfolio_value_score,
        overall_score,
        confidence_level,
        created_at::text AS created_at,
        updated_at::text AS updated_at
    `,
    [
      id,
      input.painScore,
      input.frequencyScore,
      input.buyerClarityScore,
      input.willingnessToPayScore,
      input.feasibilityScore,
      input.distributionScore,
      input.strategicFitScore,
      input.portfolioValueScore,
      overallScore,
      confidenceLevel
    ]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return mapRowToOpportunity(row);
}

export async function updateOpportunityStage(input: {
  opportunityId: string;
  nextStage: OpportunityStage;
  status?: OpportunityStatus;
}): Promise<Opportunity | null> {
  const result = await db.query<OpportunityRow>(
    `
      UPDATE opportunities
      SET
        current_stage = $2,
        status = COALESCE($3, status),
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        title,
        problem_statement,
        target_buyer,
        industry,
        status,
        current_stage,
        pain_score,
        frequency_score,
        buyer_clarity_score,
        willingness_to_pay_score,
        feasibility_score,
        distribution_score,
        strategic_fit_score,
        portfolio_value_score,
        overall_score,
        confidence_level,
        created_at::text AS created_at,
        updated_at::text AS updated_at
    `,
    [input.opportunityId, input.nextStage, input.status ?? null]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return mapRowToOpportunity(row);
}

export async function createWorkflowEvent(input: WorkflowEventInsert): Promise<string> {
  const id = crypto.randomUUID();
  const actorId = await resolveExistingUserId(input.triggeredBy);

  await db.query(
    `
      INSERT INTO workflow_events (
        id,
        event_type,
        entity_type,
        entity_id,
        stage_from,
        stage_to,
        triggered_by,
        payload
      )
      VALUES ($1, $2, 'opportunity', $3, $4, $5, $6, $7::jsonb)
    `,
    [
      id,
      input.eventType,
      input.opportunityId,
      input.stageFrom ?? null,
      input.stageTo ?? null,
      actorId,
      JSON.stringify(input.payload ?? {})
    ]
  );

  return id;
}

export async function createDecisionRecord(input: DecisionRecordInsert): Promise<string> {
  const id = crypto.randomUUID();
  const decidedBy = await resolveExistingUserId(input.decidedBy);

  await db.query(
    `
      INSERT INTO decision_records (
        id,
        entity_type,
        entity_id,
        decision_type,
        decision_reason,
        decided_by
      )
      VALUES ($1, 'opportunity', $2, $3, $4, $5)
    `,
    [id, input.opportunityId, input.decisionType, input.reason, decidedBy]
  );

  return id;
}

export async function listOpportunityTimeline(
  opportunityId: string
): Promise<OpportunityTimelineItem[]> {
  const result = await db.query<TimelineRow>(
    `
      SELECT
        we.id,
        'stage_transition'::text AS kind,
        CONCAT('Stage advanced to ', COALESCE(we.stage_to, 'unknown')) AS title,
        COALESCE(
          CONCAT('Moved from ', we.stage_from, ' to ', we.stage_to),
          'Opportunity stage updated'
        ) AS description,
        we.created_at::text AS created_at,
        we.triggered_by AS actor_id,
        jsonb_strip_nulls(
          jsonb_build_object(
            'stageFrom', we.stage_from,
            'stageTo', we.stage_to,
            'eventType', we.event_type
          )
        ) AS metadata
      FROM workflow_events we
      WHERE
        we.entity_type = 'opportunity'
        AND we.entity_id = $1
        AND we.event_type = 'opportunity_stage_transition'

      UNION ALL

      SELECT
        a.id,
        'approval_requested'::text AS kind,
        CASE
          WHEN a.status = 'pending' THEN CONCAT('Approval requested: ', a.approval_type)
          ELSE CONCAT('Approval reviewed: ', a.approval_type)
        END AS title,
        CASE
          WHEN a.status = 'pending' THEN CONCAT('Approval status is ', a.status)
          WHEN a.review_notes IS NOT NULL AND LENGTH(TRIM(a.review_notes)) > 0
            THEN CONCAT('Approval status is ', a.status, ' - ', a.review_notes)
          ELSE CONCAT('Approval status is ', a.status)
        END AS description,
        COALESCE(a.reviewed_at, a.requested_at)::text AS created_at,
        COALESCE(a.reviewed_by, a.requested_by) AS actor_id,
        jsonb_strip_nulls(
          jsonb_build_object(
            'approvalType', a.approval_type,
            'status', a.status,
            'reviewNotes', a.review_notes
          )
        ) AS metadata
      FROM approvals a
      WHERE a.entity_type = 'opportunity' AND a.entity_id = $1

      UNION ALL

      SELECT
        d.id,
        'decision_recorded'::text AS kind,
        CONCAT('Decision: ', d.decision_type) AS title,
        d.decision_reason AS description,
        d.created_at::text AS created_at,
        d.decided_by AS actor_id,
        jsonb_strip_nulls(
          jsonb_build_object(
            'decisionType', d.decision_type
          )
        ) AS metadata
      FROM decision_records d
      WHERE d.entity_type = 'opportunity' AND d.entity_id = $1

      ORDER BY created_at DESC
    `,
    [opportunityId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    ...(row.actor_id ? { actorId: row.actor_id } : {}),
    ...(sanitizeTimelineMetadata(row.metadata)
      ? { metadata: sanitizeTimelineMetadata(row.metadata) }
      : {})
  }));
}
