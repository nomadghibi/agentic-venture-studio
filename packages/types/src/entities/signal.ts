import { z } from "zod";

export const SignalSchema = z.object({
  id: z.string().uuid(),
  sourceType: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  sourceTitle: z.string().optional(),
  contentExcerpt: z.string().min(1).max(10_000),
  createdAt: z.string()
});

export const SignalCreateInputSchema = z.object({
  sourceType: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  sourceTitle: z.string().optional(),
  contentExcerpt: z.string().min(1).max(10_000),
  opportunityId: z.string().uuid().optional(),
  relevanceScore: z.number().min(0).max(1).optional(),
  isPrimaryEvidence: z.boolean().optional()
});

export const OpportunitySignalLinkSchema = z.object({
  signalId: z.string().uuid(),
  opportunityId: z.string().uuid(),
  relevanceScore: z.number().optional(),
  isPrimaryEvidence: z.boolean()
});

export type Signal = z.infer<typeof SignalSchema>;
export type SignalCreateInput = z.infer<typeof SignalCreateInputSchema>;
export type OpportunitySignalLink = z.infer<typeof OpportunitySignalLinkSchema>;
