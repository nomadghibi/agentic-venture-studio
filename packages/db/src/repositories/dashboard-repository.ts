import type { DashboardSummary } from "@avs/types";
import { db } from "../client.js";

type DashboardSummaryRow = {
  active_opportunities: number | string;
  awaiting_approvals: number | string;
  live_ventures: number | string;
  low_confidence_runs: number | string;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const result = await db.query<DashboardSummaryRow>(
    `
      SELECT
        (SELECT COUNT(*) FROM opportunities WHERE status = 'active') AS active_opportunities,
        (SELECT COUNT(*) FROM approvals WHERE status = 'pending') AS awaiting_approvals,
        (SELECT COUNT(*) FROM ventures WHERE stage = 'live') AS live_ventures,
        (SELECT COUNT(*) FROM agent_runs WHERE confidence_level = 'low') AS low_confidence_runs
    `
  );

  const row = result.rows[0];
  if (!row) {
    return {
      activeOpportunities: 0,
      awaitingApprovals: 0,
      liveVentures: 0,
      lowConfidenceRuns: 0
    };
  }

  return {
    activeOpportunities: Number(row.active_opportunities),
    awaitingApprovals: Number(row.awaiting_approvals),
    liveVentures: Number(row.live_ventures),
    lowConfidenceRuns: Number(row.low_confidence_runs)
  };
}
