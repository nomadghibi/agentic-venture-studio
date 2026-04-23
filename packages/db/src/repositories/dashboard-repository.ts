import type { DashboardSummary } from "@avs/types";
import { db } from "../client.js";

type DashboardSummaryRow = {
  active_opportunities: number | string;
  awaiting_approvals: number | string;
  live_ventures: number | string;
  low_confidence_runs: number | string;
};

export async function getDashboardSummary(workspaceId: string): Promise<DashboardSummary> {
  const result = await db.query<DashboardSummaryRow>(
    `
      SELECT
        (
          SELECT COUNT(*)
          FROM opportunities
          WHERE status = 'active' AND workspace_id = $1
        ) AS active_opportunities,
        (
          SELECT COUNT(*)
          FROM approvals a
          JOIN opportunities o ON o.id = a.entity_id
          WHERE
            a.entity_type = 'opportunity'
            AND a.status = 'pending'
            AND o.workspace_id = $1
        ) AS awaiting_approvals,
        (
          SELECT COUNT(*)
          FROM ventures
          WHERE stage = 'live' AND workspace_id = $1
        ) AS live_ventures,
        (
          SELECT COUNT(*)
          FROM agent_runs ar
          JOIN opportunities o ON o.id = ar.entity_id
          WHERE
            ar.entity_type = 'opportunity'
            AND ar.confidence_level = 'low'
            AND o.workspace_id = $1
        ) AS low_confidence_runs
    `,
    [workspaceId]
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
