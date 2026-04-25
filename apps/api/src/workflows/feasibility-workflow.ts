import { feasibilityAgent, runAgent } from "@avs/agents";
import {
  getOpportunityById,
  listSignalsForOpportunity,
  getLatestOpportunityArtifact,
  updateOpportunityScores,
  upsertOpportunityArtifact,
  createWorkflowEvent
} from "@avs/db";
import type { PrdContent } from "@avs/types";

export interface FeasibilityWorkflowInput {
  opportunityId: string;
  workspaceId: string;
}

export async function runFeasibilityWorkflow(input: FeasibilityWorkflowInput) {
  const opportunity = await getOpportunityById(input.opportunityId, input.workspaceId);
  if (!opportunity) {
    return { status: "skipped", reason: "opportunity_not_found" } as const;
  }

  const [signals, prdArtifact] = await Promise.all([
    listSignalsForOpportunity(input.opportunityId, input.workspaceId),
    getLatestOpportunityArtifact(input.opportunityId, input.workspaceId, "prd")
  ]);

  const signalExcerpts = signals.map((s) => s.contentExcerpt).slice(0, 15);

  let mvpScope: string | undefined;
  let coreFeatures: string[] | undefined;

  if (prdArtifact?.content) {
    try {
      const prd = JSON.parse(prdArtifact.content) as PrdContent;
      mvpScope = prd.mvpScope;
      coreFeatures = prd.coreFeatures.map((f) => `${f.name}: ${f.description}`);
    } catch {
      // proceed without PRD context
    }
  }

  const result = await runAgent(
    feasibilityAgent,
    {
      opportunityId: opportunity.id,
      title: opportunity.title,
      problemStatement: opportunity.problemStatement,
      targetBuyer: opportunity.targetBuyer,
      industry: opportunity.industry,
      signalExcerpts,
      ...(mvpScope ? { mvpScope } : {}),
      ...(coreFeatures ? { coreFeatures } : {})
    },
    { correlationId: input.opportunityId, opportunityId: input.opportunityId }
  );

  const newFeasibilityScore = Math.round(
    Math.min(100, Math.max(0, result.output.feasibilityScore))
  );

  await updateOpportunityScores(input.opportunityId, input.workspaceId, {
    painScore: opportunity.painScore,
    frequencyScore: opportunity.frequencyScore,
    buyerClarityScore: opportunity.buyerClarityScore,
    willingnessToPayScore: opportunity.willingnessToPayScore,
    feasibilityScore: newFeasibilityScore,
    distributionScore: opportunity.distributionScore,
    strategicFitScore: opportunity.strategicFitScore,
    portfolioValueScore: opportunity.portfolioValueScore
  });

  await upsertOpportunityArtifact(
    input.opportunityId,
    input.workspaceId,
    "feasibility-report",
    `Feasibility Report: ${opportunity.title}`,
    JSON.stringify(result.output)
  );

  await createWorkflowEvent({
    opportunityId: input.opportunityId,
    workspaceId: input.workspaceId,
    eventType: "feasibility_assessed",
    payload: {
      feasibilityScore: newFeasibilityScore,
      buildComplexity: result.output.buildComplexity,
      recommendation: result.output.recommendation,
      confidence: result.confidence,
      needsEscalation: result.needsEscalation,
      estimatedTimeline: result.output.estimatedTimeline
    }
  });

  return {
    status: "completed",
    confidence: result.confidence,
    needsEscalation: result.needsEscalation,
    output: result.output
  } as const;
}
