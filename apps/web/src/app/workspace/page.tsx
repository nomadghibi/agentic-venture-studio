import { DashboardSummary } from "@/features/dashboard/DashboardSummary";
import { ApprovalQueuePreview } from "@/features/approvals/ApprovalQueuePreview";
import { WorkspaceMvpControl } from "@/features/workspace/WorkspaceMvpControl";
import { fetchDashboardSummary, fetchOpportunities } from "@/services/api";

export default async function WorkspacePage() {
  const [summary, opportunities] = await Promise.all([
    fetchDashboardSummary(),
    fetchOpportunities()
  ]);

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <h1>Agentic Venture Studio Workspace</h1>
          <p>Discovery to decision workflow console</p>
        </div>
        <div className="topbar-actions">
          <a href="/ventures" className="btn btn-ghost">
            View Venture Portfolio
          </a>
        </div>
      </header>
      <section className="grid-2">
        <DashboardSummary summary={summary} />
        <ApprovalQueuePreview awaitingApprovals={summary.awaitingApprovals} />
      </section>
      <WorkspaceMvpControl initialOpportunities={opportunities} />
    </main>
  );
}
