import type { Opportunity, OpportunityStage } from "@avs/types";

export class StageTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StageTransitionError";
  }
}

const linearFlow: OpportunityStage[] = [
  "discovery",
  "validation",
  "feasibility",
  "monetization",
  "design",
  "build",
  "launch",
  "live"
];

export const stageOrder = new Map<OpportunityStage, number>(
  linearFlow.map((stage, index) => [stage, index])
);

export function statusForStage(stage: OpportunityStage): Opportunity["status"] {
  if (stage === "live") return "approved";
  if (stage === "killed") return "rejected";
  if (stage === "archived") return "archived";
  return "active";
}

export function approvalTypeForStage(stage: OpportunityStage): string | null {
  if (stage === "design") return "design_review";
  if (stage === "build") return "build_approval";
  if (stage === "launch") return "launch_approval";
  return null;
}

export function assertAllowedStageTransition(
  from: OpportunityStage,
  to: OpportunityStage
): void {
  if (from === to) {
    throw new StageTransitionError("Stage is already set to the requested value");
  }

  if (to === "killed") {
    if (from === "archived") {
      throw new StageTransitionError("Archived opportunities cannot be killed");
    }
    return;
  }

  if (to === "archived") {
    if (from !== "killed" && from !== "live") {
      throw new StageTransitionError("Only killed or live opportunities can be archived");
    }
    return;
  }

  const fromIndex = stageOrder.get(from);
  const toIndex = stageOrder.get(to);

  if (fromIndex == null || toIndex == null || toIndex !== fromIndex + 1) {
    throw new StageTransitionError(
      `Invalid stage progression from "${from}" to "${to}"`
    );
  }
}
