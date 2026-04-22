import { z } from "zod";

export const DashboardSummarySchema = z.object({
  activeOpportunities: z.number().int().nonnegative(),
  awaitingApprovals: z.number().int().nonnegative(),
  liveVentures: z.number().int().nonnegative(),
  lowConfidenceRuns: z.number().int().nonnegative()
});

export const DashboardSummaryResponseSchema = z.object({
  data: DashboardSummarySchema
});

export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
