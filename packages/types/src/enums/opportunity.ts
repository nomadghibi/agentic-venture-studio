export const OpportunityStatusValues = [
  "active",
  "rejected",
  "approved",
  "paused",
  "archived"
] as const;

export const OpportunityStageValues = [
  "discovery",
  "validation",
  "feasibility",
  "monetization",
  "design",
  "build",
  "launch",
  "live",
  "killed",
  "archived"
] as const;

export type OpportunityStatus = (typeof OpportunityStatusValues)[number];
export type OpportunityStage = (typeof OpportunityStageValues)[number];
