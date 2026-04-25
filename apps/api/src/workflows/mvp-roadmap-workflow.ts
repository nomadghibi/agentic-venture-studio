import { mvpRoadmapAgent, runAgent } from "@avs/agents";
import {
  getOpportunityById,
  listSignalsForOpportunity,
  getLatestOpportunityArtifact,
  upsertOpportunityArtifact,
  createWorkflowEvent
} from "@avs/db";
import type { PrdContent, FeasibilityContent } from "@avs/types";

export interface MvpRoadmapWorkflowInput {
  opportunityId: string;
  workspaceId: string;
}

export async function runMvpRoadmapWorkflow(input: MvpRoadmapWorkflowInput) {
  const opportunity = await getOpportunityById(input.opportunityId, input.workspaceId);
  if (!opportunity) {
    return { status: "skipped", reason: "opportunity_not_found" } as const;
  }

  const [signals, prdArtifact, feasibilityArtifact] = await Promise.all([
    listSignalsForOpportunity(input.opportunityId, input.workspaceId),
    getLatestOpportunityArtifact(input.opportunityId, input.workspaceId, "prd"),
    getLatestOpportunityArtifact(input.opportunityId, input.workspaceId, "feasibility-report")
  ]);

  const signalExcerpts = signals.map((s) => s.contentExcerpt).slice(0, 15);

  let coreFeatures: string[] | undefined;
  let mvpScope: string | undefined;
  let outOfScope: string | undefined;

  if (prdArtifact?.content) {
    try {
      const prd = JSON.parse(prdArtifact.content) as PrdContent;
      coreFeatures = prd.coreFeatures.map((f) => `${f.name}: ${f.description}`);
      mvpScope = prd.mvpScope;
      outOfScope = prd.outOfScope;
    } catch {
      // proceed without PRD context
    }
  }

  let estimatedTimeline: string | undefined;
  let buildComplexity: string | undefined;
  let teamRequirements: string | undefined;

  if (feasibilityArtifact?.content) {
    try {
      const feasibility = JSON.parse(feasibilityArtifact.content) as FeasibilityContent;
      estimatedTimeline = feasibility.estimatedTimeline;
      buildComplexity = feasibility.buildComplexity;
      teamRequirements = feasibility.teamRequirements;
    } catch {
      // proceed without feasibility context
    }
  }

  const result = await runAgent(
    mvpRoadmapAgent,
    {
      opportunityId: opportunity.id,
      title: opportunity.title,
      problemStatement: opportunity.problemStatement,
      targetBuyer: opportunity.targetBuyer,
      industry: opportunity.industry,
      signalExcerpts,
      ...(coreFeatures ? { coreFeatures } : {}),
      ...(mvpScope ? { mvpScope } : {}),
      ...(outOfScope ? { outOfScope } : {}),
      ...(estimatedTimeline ? { estimatedTimeline } : {}),
      ...(buildComplexity ? { buildComplexity } : {}),
      ...(teamRequirements ? { teamRequirements } : {})
    },
    { correlationId: input.opportunityId, opportunityId: input.opportunityId }
  );

  await upsertOpportunityArtifact(
    input.opportunityId,
    input.workspaceId,
    "mvp-roadmap",
    `MVP Roadmap: ${opportunity.title}`,
    JSON.stringify(result.output)
  );

  await createWorkflowEvent({
    opportunityId: input.opportunityId,
    workspaceId: input.workspaceId,
    eventType: "mvp_roadmap_generated",
    payload: {
      totalDuration: result.output.totalDuration,
      sprintCount: result.output.sprints.length,
      milestoneCount: result.output.milestones.length,
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
