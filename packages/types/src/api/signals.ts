import { z } from "zod";
import { OpportunitySignalLinkSchema, SignalCreateInputSchema, SignalSchema } from "../entities/signal.js";

export const IngestSignalRequestSchema = SignalCreateInputSchema;

export const IngestSignalResponseSchema = z.object({
  data: SignalSchema.extend({
    queued: z.boolean(),
    link: OpportunitySignalLinkSchema.optional()
  })
});

export const ListOpportunitySignalsResponseSchema = z.object({
  data: z.array(
    SignalSchema.extend({
      relevanceScore: z.number().optional(),
      isPrimaryEvidence: z.boolean()
    })
  )
});
