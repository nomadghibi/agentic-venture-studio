import { z } from "zod";
import {
  OpportunityDecisionInputSchema,
  OpportunityCreateInputSchema,
  OpportunityScoreInputSchema,
  OpportunityStageTransitionInputSchema,
  OpportunitySchema
} from "../entities/opportunity.js";

export const CreateOpportunityRequestSchema = OpportunityCreateInputSchema;

export const CreateOpportunityResponseSchema = z.object({
  data: OpportunitySchema
});

export const ListOpportunitiesResponseSchema = z.object({
  data: z.array(OpportunitySchema)
});

export const UpdateOpportunityScoresRequestSchema = OpportunityScoreInputSchema;

export const UpdateOpportunityStageRequestSchema = OpportunityStageTransitionInputSchema;

export const CreateOpportunityDecisionRequestSchema = OpportunityDecisionInputSchema;

export const OpportunityTimelineItemSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["stage_transition", "approval_requested", "decision_recorded"]),
  title: z.string().min(1),
  description: z.string().min(1),
  createdAt: z.string(),
  actorId: z.string().optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
});

export const OpportunityTimelineResponseSchema = z.object({
  data: z.array(OpportunityTimelineItemSchema)
});

export type OpportunityTimelineItem = z.infer<typeof OpportunityTimelineItemSchema>;
