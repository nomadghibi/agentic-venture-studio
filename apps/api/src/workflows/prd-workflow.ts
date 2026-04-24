import { prdAgent, runAgent } from "@avs/agents";
import {
  getOpportunityById,
  listSignalsForOpportunity,
  upsertOpportunityArtifact,
  createWorkflowEvent
} from "@avs/db";

export interface PrdWorkflowInput {
  opportunityId: string;
  workspaceId: string;
}

export async function runPrdWorkflow(input: PrdWorkflowInput) {
  const opportunity = await getOpportunityById(input.opportunityId, input.workspaceId);
  if (!opportunity) {
    return { status: "skipped", reason: "opportunity_not_found" } as const;
  }

  const signals = await listSignalsForOpportunity(input.opportunityId, input.workspaceId);
  const signalExcerpts = signals.map((s) => s.contentExcerpt).slice(0, 15);

  const result = await runAgent(
    prdAgent,
    {
      opportunityId: opportunity.id,
      title: opportunity.title,
      problemStatement: opportunity.problemStatement,
      targetBuyer: opportunity.targetBuyer,
      industry: opportunity.industry,
      stage: opportunity.currentStage,
      painScore: opportunity.painScore,
      overallScore: opportunity.overallScore,
      signalExcerpts
    },
    { correlationId: input.opportunityId, opportunityId: input.opportunityId }
  );

  await upsertOpportunityArtifact(
    input.opportunityId,
    input.workspaceId,
    "prd",
    `PRD: ${opportunity.title}`,
    JSON.stringify(result.output)
  );

  await createWorkflowEvent({
    opportunityId: input.opportunityId,
    workspaceId: input.workspaceId,
    eventType: "prd_generated",
    payload: { confidence: result.confidence, version: 1 }
  });

  return {
    status: "completed",
    confidence: result.confidence,
    output: result.output
  } as const;
}
