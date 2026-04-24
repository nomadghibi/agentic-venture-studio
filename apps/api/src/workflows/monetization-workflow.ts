import { monetizationAgent, runAgent } from "@avs/agents";
import {
  getOpportunityById,
  listSignalsForOpportunity,
  getLatestOpportunityArtifact,
  upsertOpportunityArtifact,
  createWorkflowEvent
} from "@avs/db";
import type { PrdContent } from "@avs/types";

export interface MonetizationWorkflowInput {
  opportunityId: string;
  workspaceId: string;
}

export async function runMonetizationWorkflow(input: MonetizationWorkflowInput) {
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
  if (prdArtifact?.content) {
    try {
      const prd = JSON.parse(prdArtifact.content) as PrdContent;
      mvpScope = prd.mvpScope;
    } catch {
      // proceed without PRD context
    }
  }

  const result = await runAgent(
    monetizationAgent,
    {
      opportunityId: opportunity.id,
      title: opportunity.title,
      problemStatement: opportunity.problemStatement,
      targetBuyer: opportunity.targetBuyer,
      industry: opportunity.industry,
      signalExcerpts,
      feasibilityScore: opportunity.feasibilityScore,
      ...(mvpScope ? { mvpScope } : {})
    },
    { correlationId: input.opportunityId, opportunityId: input.opportunityId }
  );

  await upsertOpportunityArtifact(
    input.opportunityId,
    input.workspaceId,
    "monetization",
    `Monetization Strategy: ${opportunity.title}`,
    JSON.stringify(result.output)
  );

  await createWorkflowEvent({
    opportunityId: input.opportunityId,
    workspaceId: input.workspaceId,
    eventType: "monetization_analyzed",
    payload: {
      primaryModel: result.output.primaryModel,
      suggestedPrice: result.output.suggestedPrice,
      confidence: result.confidence,
      needsEscalation: result.needsEscalation
    }
  });

  return {
    status: "completed",
    confidence: result.confidence,
    needsEscalation: result.needsEscalation,
    output: result.output
  } as const;
}
