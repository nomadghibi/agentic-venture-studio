import { buildPlanAgent, runAgent } from "@avs/agents";
import {
  getOpportunityById,
  listSignalsForOpportunity,
  getLatestOpportunityArtifact,
  upsertOpportunityArtifact,
  createWorkflowEvent
} from "@avs/db";
import type { ArchitectureContent, MvpRoadmapContent, FeasibilityContent, PrdContent } from "@avs/types";

export interface BuildPlanWorkflowInput {
  opportunityId: string;
  workspaceId: string;
}

export async function runBuildPlanWorkflow(input: BuildPlanWorkflowInput) {
  const opportunity = await getOpportunityById(input.opportunityId, input.workspaceId);
  if (!opportunity) {
    return { status: "skipped", reason: "opportunity_not_found" } as const;
  }

  const [signals, prdArtifact, feasibilityArtifact, architectureArtifact, mvpRoadmapArtifact] =
    await Promise.all([
      listSignalsForOpportunity(input.opportunityId, input.workspaceId),
      getLatestOpportunityArtifact(input.opportunityId, input.workspaceId, "prd"),
      getLatestOpportunityArtifact(input.opportunityId, input.workspaceId, "feasibility-report"),
      getLatestOpportunityArtifact(input.opportunityId, input.workspaceId, "architecture"),
      getLatestOpportunityArtifact(input.opportunityId, input.workspaceId, "mvp-roadmap")
    ]);

  const signalExcerpts = signals.map((s) => s.contentExcerpt).slice(0, 10);

  let mvpScope: string | undefined;
  let outOfScope: string | undefined;
  let coreFeatures: string[] | undefined;

  if (prdArtifact?.content) {
    try {
      const prd = JSON.parse(prdArtifact.content) as PrdContent;
      mvpScope = prd.mvpScope;
      outOfScope = prd.outOfScope;
      coreFeatures = prd.coreFeatures.map((f) => `${f.name}: ${f.description}`);
    } catch {
      // proceed without PRD context
    }
  }

  let buildComplexity: string | undefined;
  let teamRequirements: string | undefined;
  let estimatedBuildTime: string | undefined;

  if (feasibilityArtifact?.content) {
    try {
      const feasibility = JSON.parse(feasibilityArtifact.content) as FeasibilityContent;
      buildComplexity = feasibility.buildComplexity;
      teamRequirements = feasibility.teamRequirements;
      estimatedBuildTime = feasibility.estimatedTimeline;
    } catch {
      // proceed without feasibility context
    }
  }

  let techStack: Array<{ layer: string; technology: string; rationale: string }> | undefined;
  let deploymentApproach: string | undefined;
  let buildOrder: string[] | undefined;
  let technicalRisks: string[] | undefined;

  if (architectureArtifact?.content) {
    try {
      const arch = JSON.parse(architectureArtifact.content) as ArchitectureContent;
      techStack = arch.techStack;
      deploymentApproach = arch.deploymentApproach;
      buildOrder = arch.buildOrder;
      technicalRisks = arch.technicalRisks;
      if (!estimatedBuildTime) estimatedBuildTime = arch.estimatedBuildTime;
    } catch {
      // proceed without architecture context
    }
  }

  let totalDuration: string | undefined;
  let sprintGoals: string[] | undefined;
  let launchCriteria: string[] | undefined;
  let resourceRequirements: string | undefined;

  if (mvpRoadmapArtifact?.content) {
    try {
      const roadmap = JSON.parse(mvpRoadmapArtifact.content) as MvpRoadmapContent;
      totalDuration = roadmap.totalDuration;
      sprintGoals = roadmap.sprints.map((s) => s.goal);
      launchCriteria = roadmap.launchCriteria;
      resourceRequirements = roadmap.resourceRequirements;
    } catch {
      // proceed without roadmap context
    }
  }

  const result = await runAgent(
    buildPlanAgent,
    {
      opportunityId: opportunity.id,
      title: opportunity.title,
      problemStatement: opportunity.problemStatement,
      targetBuyer: opportunity.targetBuyer,
      industry: opportunity.industry,
      signalExcerpts,
      ...(mvpScope ? { mvpScope } : {}),
      ...(outOfScope ? { outOfScope } : {}),
      ...(coreFeatures ? { coreFeatures } : {}),
      ...(buildComplexity ? { buildComplexity } : {}),
      ...(teamRequirements ? { teamRequirements } : {}),
      ...(estimatedBuildTime ? { estimatedBuildTime } : {}),
      ...(techStack ? { techStack } : {}),
      ...(deploymentApproach ? { deploymentApproach } : {}),
      ...(buildOrder ? { buildOrder } : {}),
      ...(technicalRisks ? { technicalRisks } : {}),
      ...(totalDuration ? { totalDuration } : {}),
      ...(sprintGoals ? { sprintGoals } : {}),
      ...(launchCriteria ? { launchCriteria } : {}),
      ...(resourceRequirements ? { resourceRequirements } : {})
    },
    { correlationId: input.opportunityId, opportunityId: input.opportunityId }
  );

  await upsertOpportunityArtifact(
    input.opportunityId,
    input.workspaceId,
    "build-plan",
    `Build Plan: ${opportunity.title}`,
    JSON.stringify(result.output)
  );

  await createWorkflowEvent({
    opportunityId: input.opportunityId,
    workspaceId: input.workspaceId,
    eventType: "build_plan_generated",
    payload: {
      phaseCount: result.output.phases.length,
      confidence: result.confidence,
      needsEscalation: result.needsEscalation,
      totalBudgetEstimate: result.output.totalBudgetEstimate
    }
  });

  return {
    status: "completed",
    confidence: result.confidence,
    needsEscalation: result.needsEscalation,
    output: result.output
  } as const;
}
