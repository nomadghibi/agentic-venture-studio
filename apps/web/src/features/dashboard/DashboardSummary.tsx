import type { DashboardSummary as DashboardSummaryData } from "@avs/types";

type DashboardSummaryProps = {
  summary: DashboardSummaryData;
};

export function DashboardSummary({ summary }: DashboardSummaryProps) {
  return (
    <article className="panel">
      <h2>Portfolio Snapshot</h2>
      <div className="metric-list">
        <div className="metric">
          <span>Active Opportunities</span>
          <strong>{summary.activeOpportunities}</strong>
        </div>
        <div className="metric">
          <span>Awaiting Approval</span>
          <strong>{summary.awaitingApprovals}</strong>
        </div>
        <div className="metric">
          <span>Live Ventures</span>
          <strong>{summary.liveVentures}</strong>
        </div>
        <div className="metric">
          <span>Low Confidence Runs</span>
          <strong>{summary.lowConfidenceRuns}</strong>
        </div>
      </div>
    </article>
  );
}
