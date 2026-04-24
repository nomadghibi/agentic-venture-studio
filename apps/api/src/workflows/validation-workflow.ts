import { validationAgent, runAgent } from "@avs/agents";
import { getOpportunityById, listSignalsForOpportunity, createWorkflowEvent } from "@avs/db";

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

  await createWorkflowEvent({
    opportunityId: input.opportunityId,
    workspaceId: input.workspaceId,
    eventType: "opportunity_agent_validated",
    payload: {
      decision: result.output.decision,
      confidence: result.confidence,
      needsEscalation: result.needsEscalation,
      rationale: result.output.rationale
    }
  });

  return {
    status: "completed",
    confidence: result.confidence,
    needsEscalation: result.needsEscalation,
    output: result.output
  } as const;
}
