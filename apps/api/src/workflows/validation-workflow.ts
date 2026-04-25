import { validationAgent, runAgent } from "@avs/agents";
import type { ValidationOutput } from "@avs/agents";
import { getOpportunityById, listSignalsForOpportunity, updateOpportunityScores, createWorkflowEvent } from "@avs/db";

const FREQUENCY_TO_SCORE: Record<ValidationOutput["frequency"], number> = {
  rare: 25,
  occasional: 55,
  frequent: 82
};

const URGENCY_TO_SCORE: Record<ValidationOutput["urgency"], number> = {
  low: 25,
  medium: 55,
  high: 82
};

const BUYER_CLARITY_TO_SCORE: Record<ValidationOutput["buyerClarity"], number> = {
  unclear: 25,
  partial: 55,
  clear: 80
};

export interface ValidationWorkflowInput {
  opportunityId: string;
  workspaceId: string;
}

export async function runValidationWorkflow(input: ValidationWorkflowInput) {
  const opportunity = await getOpportunityById(input.opportunityId, input.workspaceId);
  if (!opportunity) {
    return { status: "skipped", reason: "opportunity_not_found" } as const;
  }

  const signals = await listSignalsForOpportunity(input.opportunityId, input.workspaceId);
  const signalExcerpts = signals.map((s) => s.contentExcerpt).slice(0, 20);

  const result = await runAgent(
    validationAgent,
    {
      opportunityId: opportunity.id,
      title: opportunity.title,
      description: opportunity.problemStatement,
      stage: opportunity.currentStage,
      signalExcerpts
    },
    { correlationId: input.opportunityId, opportunityId: input.opportunityId }
  );

  await updateOpportunityScores(input.opportunityId, input.workspaceId, {
    painScore: opportunity.painScore,
    frequencyScore: FREQUENCY_TO_SCORE[result.output.frequency],
    buyerClarityScore: BUYER_CLARITY_TO_SCORE[result.output.buyerClarity],
    willingnessToPayScore: URGENCY_TO_SCORE[result.output.urgency],
    feasibilityScore: opportunity.feasibilityScore,
    distributionScore: opportunity.distributionScore,
    strategicFitScore: opportunity.strategicFitScore,
    portfolioValueScore: opportunity.portfolioValueScore
  });

  await createWorkflowEvent({
    opportunityId: input.opportunityId,
    workspaceId: input.workspaceId,
    eventType: "opportunity_agent_validated",
    payload: {
      decision: result.output.decision,
      confidence: result.confidence,
      needsEscalation: result.needsEscalation,
      rationale: result.output.rationale,
      frequencyScore: FREQUENCY_TO_SCORE[result.output.frequency],
      buyerClarityScore: BUYER_CLARITY_TO_SCORE[result.output.buyerClarity],
      willingnessToPayScore: URGENCY_TO_SCORE[result.output.urgency]
    }
  });

  return {
    status: "completed",
    confidence: result.confidence,
    needsEscalation: result.needsEscalation,
    output: result.output
  } as const;
}
