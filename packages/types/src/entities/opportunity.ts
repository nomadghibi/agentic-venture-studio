import { z } from "zod";
import { OpportunityStageValues, OpportunityStatusValues } from "../enums/opportunity.js";

export const OpportunitySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  problemStatement: z.string().min(1),
  targetBuyer: z.string().min(1),
  industry: z.string().min(1),
  status: z.enum(OpportunityStatusValues),
  currentStage: z.enum(OpportunityStageValues),
  painScore: z.number(),
  frequencyScore: z.number(),
  buyerClarityScore: z.number(),
  willingnessToPayScore: z.number(),
  feasibilityScore: z.number(),
  distributionScore: z.number(),
  strategicFitScore: z.number(),
  portfolioValueScore: z.number(),
  overallScore: z.number(),
  confidenceLevel: z.enum(["low", "medium", "high"]),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const OpportunityCreateInputSchema = z.object({
  title: z.string().min(1),
  problemStatement: z.string().min(1),
  targetBuyer: z.string().min(1),
  industry: z.string().min(1)
});

export const OpportunityScoreInputSchema = z.object({
  painScore: z.number().min(0).max(100),
  frequencyScore: z.number().min(0).max(100),
  buyerClarityScore: z.number().min(0).max(100),
  willingnessToPayScore: z.number().min(0).max(100),
  feasibilityScore: z.number().min(0).max(100),
  distributionScore: z.number().min(0).max(100),
  strategicFitScore: z.number().min(0).max(100),
  portfolioValueScore: z.number().min(0).max(100)
});

export const OpportunityStageTransitionInputSchema = z.object({
  nextStage: z.enum(OpportunityStageValues),
  note: z.string().min(1).max(500).optional()
});

export const OpportunityDecisionInputSchema = z.object({
  decisionType: z.enum(["scale", "kill", "hold"]),
  reason: z.string().min(5).max(1000)
});

export type Opportunity = z.infer<typeof OpportunitySchema>;
export type OpportunityCreateInput = z.infer<typeof OpportunityCreateInputSchema>;
export type OpportunityScoreInput = z.infer<typeof OpportunityScoreInputSchema>;
export type OpportunityStageTransitionInput = z.infer<typeof OpportunityStageTransitionInputSchema>;
export type OpportunityDecisionInput = z.infer<typeof OpportunityDecisionInputSchema>;
