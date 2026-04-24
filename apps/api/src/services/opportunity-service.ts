import type {
  Opportunity,
  OpportunityCreateInput,
  OpportunityDecisionInput,
  OpportunityScoreInput,
  OpportunityStage,
  OpportunityStageTransitionInput,
  OpportunityTimelineItem
} from "@avs/types";
import {
  countPendingApprovalsForOpportunity,
  createApprovalRequest,
  createDecisionRecord,
  createWorkflowEvent,
  createOpportunity as createOpportunityRecord,
  ensureVentureForOpportunity,
  getOpportunityById,
  listOpportunities as listOpportunityRecords,
  listOpportunityTimeline as listOpportunityTimelineRecords,
  updateOpportunityScores as updateOpportunityScoresRecord,
  updateOpportunityStage as updateOpportunityStageRecord
} from "@avs/db";
import {
  StageTransitionError,
  approvalTypeForStage,
  assertAllowedStageTransition,
  statusForStage
} from "./opportunity-logic.js";

export { StageTransitionError };

export class DecisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DecisionError";
  }
}

export async function listOpportunities(
  workspaceId: string,
  limit?: number,
  offset?: number
): Promise<Opportunity[]> {
  return listOpportunityRecords(workspaceId, limit, offset);
}

export async function getOpportunity(
  id: string,
  workspaceId: string
): Promise<Opportunity | null> {
  return getOpportunityById(id, workspaceId);
}

export async function createOpportunity(
  input: OpportunityCreateInput,
  workspaceId: string,
  actorId?: string
): Promise<Opportunity> {
  return createOpportunityRecord({
    ...input,
    workspaceId,
    ...(actorId ? { createdBy: actorId, ownerId: actorId } : {}),
    status: "active",
    currentStage: "discovery",
    confidenceLevel: "medium",
    painScore: 0,
    frequencyScore: 0,
    buyerClarityScore: 0,
    willingnessToPayScore: 0,
    feasibilityScore: 0,
    distributionScore: 0,
    strategicFitScore: 0,
    portfolioValueScore: 0,
    overallScore: 0
  });
}

export async function scoreOpportunity(
  id: string,
  input: OpportunityScoreInput,
  workspaceId: string,
  actorId?: string
): Promise<Opportunity | null> {
  const updated = await updateOpportunityScoresRecord(id, workspaceId, input);
  if (!updated) {
    return null;
  }

  await createWorkflowEvent({
    opportunityId: id,
    workspaceId,
    eventType: "opportunity_scored",
    ...(actorId ? { triggeredBy: actorId } : {}),
    payload: {
      overallScore: Number(updated.overallScore.toFixed(2)),
      confidenceLevel: updated.confidenceLevel
    }
  });

  return updated;
}

type StageTransitionResult = {
  opportunity: Opportunity;
  approvalRequested: boolean;
  approvalId?: string;
};

export async function transitionOpportunityStage(
  id: string,
  input: OpportunityStageTransitionInput,
  workspaceId: string,
  actorId?: string
): Promise<StageTransitionResult | null> {
  const current = await getOpportunityById(id, workspaceId);
  if (!current) {
    return null;
  }

  const pendingApprovals = await countPendingApprovalsForOpportunity(id, workspaceId);
  if (pendingApprovals > 0) {
    throw new StageTransitionError("Cannot transition stages while approvals are pending");
  }

  assertAllowedStageTransition(current.currentStage, input.nextStage);

  const nextStatus = statusForStage(input.nextStage);
  const updated = await updateOpportunityStageRecord({
    opportunityId: id,
    workspaceId,
    nextStage: input.nextStage,
    status: nextStatus
  });

  if (!updated) {
    return null;
  }

  await createWorkflowEvent({
    opportunityId: id,
    workspaceId,
    eventType: "opportunity_stage_transition",
    ...(actorId ? { triggeredBy: actorId } : {}),
    stageFrom: current.currentStage,
    stageTo: input.nextStage,
    ...(input.note ? { payload: { note: input.note } } : {})
  });

  const approvalType = approvalTypeForStage(input.nextStage);
  if (!approvalType) {
    return {
      opportunity: updated,
      approvalRequested: false
    };
  }

  const approvalId = await createApprovalRequest({
    opportunityId: id,
    workspaceId,
    approvalType,
    ...(actorId ? { requestedBy: actorId } : {})
  });

  return {
    opportunity: updated,
    approvalRequested: true,
    approvalId
  };
}

type DecisionResult = {
  opportunity: Opportunity;
  decisionId: string;
};

export async function decideOpportunity(
  id: string,
  input: OpportunityDecisionInput,
  workspaceId: string,
  actorId?: string
): Promise<DecisionResult | null> {
  const current = await getOpportunityById(id, workspaceId);
  if (!current) {
    return null;
  }

  const pendingApprovals = await countPendingApprovalsForOpportunity(id, workspaceId);
  if (input.decisionType === "scale" && pendingApprovals > 0) {
    throw new DecisionError("Cannot scale while approvals are pending");
  }

  const decisionId = await createDecisionRecord({
    opportunityId: id,
    workspaceId,
    decisionType: input.decisionType,
    reason: input.reason,
    ...(actorId ? { decidedBy: actorId } : {})
  });

  const targetStage: OpportunityStage =
    input.decisionType === "kill"
      ? "killed"
      : input.decisionType === "scale"
        ? "live"
        : current.currentStage;

  const targetStatus: Opportunity["status"] =
    input.decisionType === "hold" ? "paused" : statusForStage(targetStage);

  const updated = await updateOpportunityStageRecord({
    opportunityId: id,
    workspaceId,
    nextStage: targetStage,
    status: targetStatus
  });

  if (!updated) {
    return null;
  }

  if (input.decisionType === "scale") {
    const ventureId = await ensureVentureForOpportunity({
      opportunityId: id,
      workspaceId,
      name: `${updated.title} Venture`,
      ...(actorId ? { ownerId: actorId } : {}),
      stage: "live",
      tagline: `Validated venture built from ${updated.title}`,
      businessModel: "subscription",
      targetMarket: updated.targetBuyer
    });

    await createWorkflowEvent({
      opportunityId: id,
      workspaceId,
      eventType: "opportunity_scaled_to_venture",
      ...(actorId ? { triggeredBy: actorId } : {}),
      payload: { ventureId }
    });
  }

  if (targetStage !== current.currentStage) {
    await createWorkflowEvent({
      opportunityId: id,
      workspaceId,
      eventType: "opportunity_stage_transition",
      ...(actorId ? { triggeredBy: actorId } : {}),
      stageFrom: current.currentStage,
      stageTo: targetStage,
      payload: { source: "decision" }
    });
  }

  await createWorkflowEvent({
    opportunityId: id,
    workspaceId,
    eventType: "opportunity_decision_recorded",
    ...(actorId ? { triggeredBy: actorId } : {}),
    payload: { decisionType: input.decisionType }
  });

  return {
    opportunity: updated,
    decisionId
  };
}

export async function listOpportunityTimeline(
  id: string,
  workspaceId: string
): Promise<OpportunityTimelineItem[] | null> {
  const current = await getOpportunityById(id, workspaceId);
  if (!current) {
    return null;
  }

  return listOpportunityTimelineRecords(id, workspaceId);
}
