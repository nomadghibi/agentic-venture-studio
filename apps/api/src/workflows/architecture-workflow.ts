import { architectureAgent, runAgent } from "@avs/agents";
import type { PrdContent } from "@avs/types";
import {
  getOpportunityById,
  listSignalsForOpportunity,
  getLatestOpportunityArtifact,
  upsertOpportunityArtifact,
  createWorkflowEvent
} from "@avs/db";

export interface ArchitectureWorkflowInput {
  opportunityId: string;
  workspaceId: string;
}

export async function runArchitectureWorkflow(input: ArchitectureWorkflowInput) {
  const opportunity = await getOpportunityById(input.opportunityId, input.workspaceId);
  if (!opportunity) {
    return { status: "skipped", reason: "opportunity_not_found" } as const;
  }

  const [signals, prdArtifact] = await Promise.all([
    listSignalsForOpportunity(input.opportunityId, input.workspaceId),
    getLatestOpportunityArtifact(input.opportunityId, input.workspaceId, "prd")
  ]);

  const signalExcerpts = signals.map((s) => s.contentExcerpt).slice(0, 10);

  let coreFeatures: string[] | undefined;
  let mvpScope: string | undefined;

  if (prdArtifact?.content) {
    try {
      const prd = JSON.parse(prdArtifact.content) as PrdContent;
      coreFeatures = prd.coreFeatures.map((f) => `${f.name}: ${f.description}`);
      mvpScope = prd.mvpScope;
    } catch {
      // continue without PRD context
    }
  }

  const result = await runAgent(
    architectureAgent,
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

  await upsertOpportunityArtifact(
    input.opportunityId,
    input.workspaceId,
    "architecture",
    `Architecture: ${opportunity.title}`,
    JSON.stringify(result.output)
  );

  await createWorkflowEvent({
    opportunityId: input.opportunityId,
    workspaceId: input.workspaceId,
    eventType: "architecture_generated",
    payload: { confidence: result.confidence }
  });

  return {
    status: "completed",
    confidence: result.confidence,
    output: result.output
  } as const;
}
