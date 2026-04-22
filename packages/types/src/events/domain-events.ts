import { z } from "zod";

export const DomainEventSchema = z.object({
  type: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  payload: z.unknown(),
  occurredAt: z.string()
});

export type DomainEvent = z.infer<typeof DomainEventSchema>;
