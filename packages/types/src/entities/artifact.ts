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
