import { z } from "zod";

export const PrdFeatureSchema = z.object({
  name: z.string(),
  description: z.string(),
  priority: z.enum(["must-have", "should-have", "nice-to-have"])
});

export const PrdContentSchema = z.object({
  executiveSummary: z.string(),
  problemStatement: z.string(),
  targetUsers: z.string(),
  coreFeatures: z.array(PrdFeatureSchema),
  mvpScope: z.string(),
  outOfScope: z.string(),
  successMetrics: z.array(z.string()),
  monetizationModel: z.string(),
  openQuestions: z.array(z.string())
});

export const ArtifactSchema = z.object({
  id: z.string(),
  artifactType: z.string(),
  title: z.string(),
  version: z.number(),
  status: z.string(),
  content: z.string().nullable(),
  createdAt: z.string()
});

export type PrdFeature = z.infer<typeof PrdFeatureSchema>;
export type PrdContent = z.infer<typeof PrdContentSchema>;
export type Artifact = z.infer<typeof ArtifactSchema>;

export const ArchTechStackItemSchema = z.object({
  layer: z.string(),
  technology: z.string(),
  rationale: z.string()
});

export const ArchDataModelItemSchema = z.object({
  entity: z.string(),
  keyFields: z.string(),
  relationships: z.string()
});

export const ArchApiRouteSchema = z.object({
  method: z.string(),
  path: z.string(),
  purpose: z.string()
});

export const ArchitectureContentSchema = z.object({
  systemOverview: z.string(),
  techStack: z.array(ArchTechStackItemSchema),
  dataModel: z.array(ArchDataModelItemSchema),
  apiSurface: z.array(ArchApiRouteSchema),
  deploymentApproach: z.string(),
  buildOrder: z.array(z.string()),
  estimatedBuildTime: z.string(),
  technicalRisks: z.array(z.string())
});

export type ArchTechStackItem = z.infer<typeof ArchTechStackItemSchema>;
export type ArchDataModelItem = z.infer<typeof ArchDataModelItemSchema>;
export type ArchApiRoute = z.infer<typeof ArchApiRouteSchema>;
export type ArchitectureContent = z.infer<typeof ArchitectureContentSchema>;

export const MonetizationContentSchema = z.object({
  primaryModel: z.enum(["subscription", "usage_based", "one_time", "marketplace", "freemium", "enterprise_license"]),
  suggestedPrice: z.string(),
  pricingRationale: z.string(),
  revenueLeadIndicator: z.string(),
  alternativeModels: z.array(z.string()),
  antiPatterns: z.array(z.string()),
  year1RevenueEstimate: z.string(),
  confidence: z.number(),
  recommendation: z.string()
});

export type MonetizationContent = z.infer<typeof MonetizationContentSchema>;

export const FeasibilityContentSchema = z.object({
  buildComplexity: z.enum(["low", "medium", "high"]),
  teamRequirements: z.string(),
  estimatedTimeline: z.string(),
  keyRisks: z.array(z.string()),
  technicalDependencies: z.array(z.string()),
  feasibilityScore: z.number(),
  confidence: z.number(),
  recommendation: z.enum(["proceed", "de-risk", "reconsider"]),
  rationale: z.string()
});

export type FeasibilityContent = z.infer<typeof FeasibilityContentSchema>;

export const MvpRoadmapSprintSchema = z.object({
  sprint: z.number(),
  goal: z.string(),
  features: z.array(z.string()),
  deliverable: z.string()
});

export const MvpRoadmapMilestoneSchema = z.object({
  name: z.string(),
  week: z.number(),
  deliverable: z.string()
});

export const MvpRoadmapContentSchema = z.object({
  rationale: z.string(),
  totalDuration: z.string(),
  sprints: z.array(MvpRoadmapSprintSchema),
  milestones: z.array(MvpRoadmapMilestoneSchema),
  launchCriteria: z.array(z.string()),
  resourceRequirements: z.string(),
  confidence: z.number(),
  recommendation: z.string()
});

export type MvpRoadmapSprint = z.infer<typeof MvpRoadmapSprintSchema>;
export type MvpRoadmapMilestone = z.infer<typeof MvpRoadmapMilestoneSchema>;
export type MvpRoadmapContent = z.infer<typeof MvpRoadmapContentSchema>;

export const BuildPhaseSchema = z.object({
  phase: z.number(),
  name: z.string(),
  duration: z.string(),
  objectives: z.array(z.string()),
  tasks: z.array(z.string()),
  exitCriteria: z.string()
});

export const TeamRoleSchema = z.object({
  role: z.string(),
  responsibilities: z.string(),
  hoursPerWeek: z.number()
});

export const RiskMitigationSchema = z.object({
  risk: z.string(),
  mitigation: z.string()
});

export const BuildPlanContentSchema = z.object({
  overview: z.string(),
  phases: z.array(BuildPhaseSchema),
  teamRoles: z.array(TeamRoleSchema),
  externalDependencies: z.array(z.string()),
  riskMitigation: z.array(RiskMitigationSchema),
  definitionOfDone: z.string(),
  totalBudgetEstimate: z.string(),
  confidence: z.number(),
  recommendation: z.string()
});

export type BuildPhase = z.infer<typeof BuildPhaseSchema>;
export type TeamRole = z.infer<typeof TeamRoleSchema>;
export type RiskMitigation = z.infer<typeof RiskMitigationSchema>;
export type BuildPlanContent = z.infer<typeof BuildPlanContentSchema>;
