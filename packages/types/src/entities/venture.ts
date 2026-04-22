import { z } from "zod";

export const VentureSchema = z.object({
  id: z.string().uuid(),
  opportunityId: z.string().uuid(),
  name: z.string().min(1),
  tagline: z.string().optional(),
  businessModel: z.string().optional(),
  targetMarket: z.string().optional(),
  stage: z.string().min(1),
  ownerId: z.string().optional(),
  launchDate: z.string().optional(),
  statusReason: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Venture = z.infer<typeof VentureSchema>;
