import { discoveryAgent, runAgent } from "@avs/agents";
import type { DiscoveryOutput } from "@avs/agents";
import { getSignalById, getOpportunityById, updateOpportunityScores } from "@avs/db";

const INTENSITY_TO_SCORE: Record<DiscoveryOutput["painIntensity"], number> = {
  low: 25,
  medium: 55,
  high: 82
};

const STRENGTH_TO_SCORE: Record<DiscoveryOutput["evidenceStrength"], number> = {
  weak: 25,
  moderate: 55,
  strong: 80
};

export interface DiscoveryWorkflowInput {
  signalId: string;
  opportunityId?: string;
  workspaceId?: string;
}

export async function runDiscoveryWorkflow(input: DiscoveryWorkflowInput) {
  const signal = await getSignalById(input.signalId);

  if (!signal) {
    return { status: "skipped", reason: "signal_not_found" } as const;
  }

  const agentInput = {
    signalId: signal.id,
    sourceType: signal.sourceType,
    contentExcerpt: signal.contentExcerpt,
    ...(signal.sourceTitle ? { sourceTitle: signal.sourceTitle } : {}),
    ...(signal.sourceUrl ? { sourceUrl: signal.sourceUrl } : {})
  };

  const result = await runAgent(discoveryAgent, agentInput, { correlationId: input.signalId });
  const output = result.output;

  if (input.opportunityId && input.workspaceId) {
    const current = await getOpportunityById(input.opportunityId, input.workspaceId);
    if (current) {
      await updateOpportunityScores(input.opportunityId, input.workspaceId, {
        painScore: INTENSITY_TO_SCORE[output.painIntensity],
        frequencyScore: current.frequencyScore,
        buyerClarityScore: STRENGTH_TO_SCORE[output.evidenceStrength],
        willingnessToPayScore: current.willingnessToPayScore,
        feasibilityScore: current.feasibilityScore,
        distributionScore: current.distributionScore,
        strategicFitScore: current.strategicFitScore,
        portfolioValueScore: current.portfolioValueScore
      });
    }
  }

  return {
    status: "completed",
    confidence: result.confidence,
    needsEscalation: result.needsEscalation,
    output
  } as const;
}
