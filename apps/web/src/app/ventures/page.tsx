import { fetchDashboardSummary, fetchVentures } from "@/services/api";

function badgeClassForStage(stage: string): "good" | "pending" | "bad" {
  if (stage === "live") {
    return "good";
  }

  if (stage === "killed" || stage === "archived") {
    return "bad";
  }

  return "pending";
}

export default async function VenturesPage() {
  const [summary, ventures] = await Promise.all([
    fetchDashboardSummary(),
    fetchVentures()
  ]);

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <h1>Venture Portfolio</h1>
          <p>Scaled opportunities tracked as active portfolio ventures.</p>
        </div>
        <div className="topbar-actions">
          <a href="/workspace" className="btn btn-ghost">
            Back To Workspace
          </a>
        </div>
      </header>

      <section className="grid-2">
        <article className="panel">
          <h2>Live Ventures</h2>
          <p>{summary.liveVentures} ventures are currently in live stage.</p>
        </article>
        <article className="panel">
          <h2>Retention Layer</h2>
          <p>
            Use this portfolio view as workspace memory: revisit decisions,
            track stage changes, and keep venture context in one place.
          </p>
        </article>
      </section>

      {ventures.length === 0 ? (
        <article className="panel">
          <h2>No ventures yet</h2>
          <p>
            Scale an opportunity from the workspace to create your first venture
            record.
          </p>
        </article>
      ) : (
        <section className="venture-grid">
          {ventures.map((venture) => (
            <article className="panel venture-card" key={venture.id}>
              <div className="venture-head">
                <h2>{venture.name}</h2>
                <span className={`badge ${badgeClassForStage(venture.stage)}`}>
                  {venture.stage}
                </span>
              </div>
              {venture.tagline ? <p>{venture.tagline}</p> : null}
              <div className="venture-meta">
                <p>
                  <strong>Target Market:</strong>{" "}
                  {venture.targetMarket ?? "Not specified"}
                </p>
                <p>
                  <strong>Business Model:</strong>{" "}
                  {venture.businessModel ?? "Not specified"}
                </p>
                <p>
                  <strong>Opportunity ID:</strong> {venture.opportunityId}
                </p>
                <p>
                  <strong>Updated:</strong>{" "}
                  {new Date(venture.updatedAt).toLocaleString()}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
