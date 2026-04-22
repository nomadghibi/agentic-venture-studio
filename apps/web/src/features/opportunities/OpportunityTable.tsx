import type { Opportunity } from "@avs/types";

type OpportunityTableProps = {
  rows: Opportunity[];
};

export function OpportunityTable({ rows }: OpportunityTableProps) {
  return (
    <article className="panel">
      <h2>Ranked Opportunities</h2>
      {rows.length === 0 ? (
        <p>No opportunities found yet. Ingest signals to populate the pipeline.</p>
      ) : null}
      <table className="table" aria-label="Opportunity table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Stage</th>
            <th>Score</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.title}</td>
              <td>{row.currentStage}</td>
              <td>{row.overallScore.toFixed(1)}</td>
              <td>
                <span
                  className={`badge ${row.status === "approved" ? "good" : "pending"}`}
                >
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
