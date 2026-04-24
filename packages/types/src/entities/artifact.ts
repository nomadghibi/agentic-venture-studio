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
