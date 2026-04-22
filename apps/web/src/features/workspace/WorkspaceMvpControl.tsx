"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type Approval,
  type Opportunity,
  type OpportunityDecisionInput,
  type OpportunityStage,
  type OpportunityScoreInput,
  type OpportunityTimelineItem
} from "@avs/types";
import {
  createOpportunity,
  decideOpportunity,
  fetchOpportunityApprovals,
  fetchOpportunityTimeline,
  getApiErrorMessage,
  reviewApproval,
  scoreOpportunity,
  transitionOpportunityStage
} from "@/services/api";

type WorkspaceMvpControlProps = {
  initialOpportunities: Opportunity[];
};

const opportunityStages: OpportunityStage[] = [
  "discovery",
  "validation",
  "feasibility",
  "monetization",
  "design",
  "build",
  "launch",
  "live",
  "killed",
  "archived"
];

const decisionOptions: OpportunityDecisionInput["decisionType"][] = ["hold", "scale", "kill"];

function scoreStateFromOpportunity(opportunity: Opportunity): OpportunityScoreInput {
  return {
    painScore: opportunity.painScore,
    frequencyScore: opportunity.frequencyScore,
    buyerClarityScore: opportunity.buyerClarityScore,
    willingnessToPayScore: opportunity.willingnessToPayScore,
    feasibilityScore: opportunity.feasibilityScore,
    distributionScore: opportunity.distributionScore,
    strategicFitScore: opportunity.strategicFitScore,
    portfolioValueScore: opportunity.portfolioValueScore
  };
}

const defaultCreateInput = {
  title: "",
  problemStatement: "",
  targetBuyer: "",
  industry: ""
};

export function WorkspaceMvpControl({ initialOpportunities }: WorkspaceMvpControlProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>(
    initialOpportunities[0]?.id ?? ""
  );
  const [timeline, setTimeline] = useState<OpportunityTimelineItem[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [reviewNotesByApprovalId, setReviewNotesByApprovalId] = useState<Record<string, string>>(
    {}
  );

  const [createInput, setCreateInput] = useState(defaultCreateInput);
  const [stageInput, setStageInput] = useState<{
    nextStage: OpportunityStage;
    note: string;
  }>({
    nextStage: "validation",
    note: ""
  });
  const [decisionInput, setDecisionInput] = useState<OpportunityDecisionInput>({
    decisionType: "hold",
    reason: ""
  });
  const [scoreInput, setScoreInput] = useState<OpportunityScoreInput>({
    painScore: 50,
    frequencyScore: 50,
    buyerClarityScore: 50,
    willingnessToPayScore: 50,
    feasibilityScore: 50,
    distributionScore: 50,
    strategicFitScore: 50,
    portfolioValueScore: 50
  });

  const sortedOpportunities = useMemo(
    () => [...opportunities].sort((a, b) => b.overallScore - a.overallScore),
    [opportunities]
  );

  const selectedOpportunity = useMemo(
    () => opportunities.find((opportunity) => opportunity.id === selectedOpportunityId) ?? null,
    [opportunities, selectedOpportunityId]
  );

  const pendingApprovals = useMemo(
    () => approvals.filter((approval) => approval.status === "pending"),
    [approvals]
  );

  useEffect(() => {
    if (!selectedOpportunity) {
      return;
    }

    setScoreInput(scoreStateFromOpportunity(selectedOpportunity));
    setStageInput((previous) => ({
      ...previous,
      nextStage: selectedOpportunity.currentStage
    }));
  }, [selectedOpportunity]);

  useEffect(() => {
    if (!selectedOpportunityId) {
      setTimeline([]);
      return;
    }

    let cancelled = false;

    async function loadTimeline() {
      setTimelineLoading(true);
      try {
        const data = await fetchOpportunityTimeline(selectedOpportunityId);
        if (!cancelled) {
          setTimeline(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getApiErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) {
          setTimelineLoading(false);
        }
      }
    }

    void loadTimeline();

    return () => {
      cancelled = true;
    };
  }, [selectedOpportunityId]);

  useEffect(() => {
    if (!selectedOpportunityId) {
      setApprovals([]);
      return;
    }

    let cancelled = false;

    async function loadApprovals() {
      setApprovalsLoading(true);
      try {
        const data = await fetchOpportunityApprovals(selectedOpportunityId);
        if (!cancelled) {
          setApprovals(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getApiErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) {
          setApprovalsLoading(false);
        }
      }
    }

    void loadApprovals();

    return () => {
      cancelled = true;
    };
  }, [selectedOpportunityId]);

  function upsertOpportunity(next: Opportunity) {
    setOpportunities((previous) => {
      const index = previous.findIndex((item) => item.id === next.id);
      if (index < 0) {
        return [next, ...previous];
      }

      const copy = [...previous];
      copy[index] = next;
      return copy;
    });
  }

  async function refreshTimeline(opportunityId: string) {
    const data = await fetchOpportunityTimeline(opportunityId);
    setTimeline(data);
  }

  async function refreshApprovals(opportunityId: string) {
    const data = await fetchOpportunityApprovals(opportunityId);
    setApprovals(data);
  }

  function badgeClassForApprovalStatus(status: Approval["status"]): "good" | "pending" | "bad" {
    if (status === "approved") {
      return "good";
    }

    if (status === "rejected") {
      return "bad";
    }

    return "pending";
  }

  async function handleCreateOpportunity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionBusy(true);
    setFeedback("");
    setError("");

    try {
      const created = await createOpportunity(createInput);
      upsertOpportunity(created);
      setSelectedOpportunityId(created.id);
      setCreateInput(defaultCreateInput);
      setFeedback("Opportunity created and selected.");
    } catch (createError) {
      setError(getApiErrorMessage(createError));
    } finally {
      setActionBusy(false);
    }
  }

  async function handleScoreOpportunity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOpportunityId) {
      return;
    }

    setActionBusy(true);
    setFeedback("");
    setError("");

    try {
      const updated = await scoreOpportunity(selectedOpportunityId, scoreInput);
      upsertOpportunity(updated);
      await refreshTimeline(selectedOpportunityId);
      setFeedback("Opportunity scores updated.");
    } catch (scoreError) {
      setError(getApiErrorMessage(scoreError));
    } finally {
      setActionBusy(false);
    }
  }

  async function handleStageTransition(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOpportunityId) {
      return;
    }

    setActionBusy(true);
    setFeedback("");
    setError("");

    try {
      const response = await transitionOpportunityStage(selectedOpportunityId, stageInput);
      upsertOpportunity(response.opportunity);
      await Promise.all([
        refreshTimeline(selectedOpportunityId),
        refreshApprovals(selectedOpportunityId)
      ]);
      setFeedback(
        response.approvalRequested
          ? "Stage updated and approval request created."
          : "Stage updated."
      );
    } catch (transitionError) {
      setError(getApiErrorMessage(transitionError));
    } finally {
      setActionBusy(false);
    }
  }

  async function handleDecision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOpportunityId) {
      return;
    }

    setActionBusy(true);
    setFeedback("");
    setError("");

    try {
      const response = await decideOpportunity(selectedOpportunityId, decisionInput);
      upsertOpportunity(response.opportunity);
      await Promise.all([
        refreshTimeline(selectedOpportunityId),
        refreshApprovals(selectedOpportunityId)
      ]);
      setDecisionInput({
        decisionType: decisionInput.decisionType,
        reason: ""
      });
      setFeedback(`Decision recorded (${decisionInput.decisionType}).`);
    } catch (decisionError) {
      setError(getApiErrorMessage(decisionError));
    } finally {
      setActionBusy(false);
    }
  }

  async function handleReviewApproval(
    approvalId: string,
    status: "approved" | "rejected"
  ) {
    if (!selectedOpportunityId) {
      return;
    }

    setActionBusy(true);
    setFeedback("");
    setError("");

    try {
      const reviewNotes = reviewNotesByApprovalId[approvalId]?.trim();
      await reviewApproval(approvalId, {
        status,
        ...(reviewNotes ? { reviewNotes } : {})
      });

      await Promise.all([
        refreshTimeline(selectedOpportunityId),
        refreshApprovals(selectedOpportunityId)
      ]);
      setReviewNotesByApprovalId((previous) => ({
        ...previous,
        [approvalId]: ""
      }));
      setFeedback(`Approval ${status}.`);
    } catch (reviewError) {
      setError(getApiErrorMessage(reviewError));
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <section className="workspace-grid">
      <article className="panel">
        <h2>Ranked Opportunities</h2>
        <p>Select an opportunity to run lifecycle commands.</p>
        {sortedOpportunities.length === 0 ? (
          <p>No opportunities yet. Create your first one below.</p>
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
            {sortedOpportunities.map((row) => (
              <tr
                key={row.id}
                className={row.id === selectedOpportunityId ? "row-selected" : ""}
                onClick={() => setSelectedOpportunityId(row.id)}
              >
                <td>{row.title}</td>
                <td>{row.currentStage}</td>
                <td>{row.overallScore.toFixed(1)}</td>
                <td>
                  <span className={`badge ${row.status === "approved" ? "good" : "pending"}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <article className="panel stack">
        <h2>MVP Control Center</h2>
        <p>
          {selectedOpportunity
            ? `Selected: ${selectedOpportunity.title}`
            : "Create an opportunity to begin."}
        </p>
        {feedback ? <p className="status-line success">{feedback}</p> : null}
        {error ? <p className="status-line error">{error}</p> : null}

        <form className="stack" onSubmit={handleCreateOpportunity}>
          <h3>Create Opportunity</h3>
          <div className="form-grid">
            <label className="field">
              <span>Title</span>
              <input
                className="input"
                value={createInput.title}
                onChange={(event) =>
                  setCreateInput((previous) => ({
                    ...previous,
                    title: event.target.value
                  }))
                }
                required
              />
            </label>
            <label className="field">
              <span>Target Buyer</span>
              <input
                className="input"
                value={createInput.targetBuyer}
                onChange={(event) =>
                  setCreateInput((previous) => ({
                    ...previous,
                    targetBuyer: event.target.value
                  }))
                }
                required
              />
            </label>
            <label className="field">
              <span>Industry</span>
              <input
                className="input"
                value={createInput.industry}
                onChange={(event) =>
                  setCreateInput((previous) => ({
                    ...previous,
                    industry: event.target.value
                  }))
                }
                required
              />
            </label>
            <label className="field field-span">
              <span>Problem Statement</span>
              <textarea
                className="textarea"
                value={createInput.problemStatement}
                onChange={(event) =>
                  setCreateInput((previous) => ({
                    ...previous,
                    problemStatement: event.target.value
                  }))
                }
                required
              />
            </label>
          </div>
          <div className="button-row">
            <button className="btn btn-primary" type="submit" disabled={actionBusy}>
              Create Opportunity
            </button>
          </div>
        </form>

        <form className="stack" onSubmit={handleScoreOpportunity}>
          <h3>Update Scores</h3>
          <div className="form-grid">
            {Object.entries(scoreInput).map(([key, value]) => (
              <label className="field" key={key}>
                <span>{key}</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={value}
                  onChange={(event) =>
                    setScoreInput((previous) => ({
                      ...previous,
                      [key]: Number(event.target.value)
                    }))
                  }
                  required
                />
              </label>
            ))}
          </div>
          <div className="button-row">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={actionBusy || !selectedOpportunityId}
            >
              Apply Scores
            </button>
          </div>
        </form>

        <form className="stack" onSubmit={handleStageTransition}>
          <h3>Advance Stage</h3>
          <div className="form-grid">
            <label className="field">
              <span>Next Stage</span>
              <select
                className="select"
                value={stageInput.nextStage}
                onChange={(event) =>
                  setStageInput((previous) => ({
                    ...previous,
                    nextStage: event.target.value as OpportunityStage
                  }))
                }
              >
                {opportunityStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </label>
            <label className="field field-span">
              <span>Transition Note (optional)</span>
              <textarea
                className="textarea"
                value={stageInput.note}
                onChange={(event) =>
                  setStageInput((previous) => ({
                    ...previous,
                    note: event.target.value
                  }))
                }
              />
            </label>
          </div>
          <div className="button-row">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={actionBusy || !selectedOpportunityId}
            >
              Move Stage
            </button>
          </div>
        </form>

        <form className="stack" onSubmit={handleDecision}>
          <h3>Record Decision</h3>
          <div className="form-grid">
            <label className="field">
              <span>Decision</span>
              <select
                className="select"
                value={decisionInput.decisionType}
                onChange={(event) =>
                  setDecisionInput((previous) => ({
                    ...previous,
                    decisionType: event.target.value as OpportunityDecisionInput["decisionType"]
                  }))
                }
              >
                {decisionOptions.map((decision) => (
                  <option key={decision} value={decision}>
                    {decision}
                  </option>
                ))}
              </select>
            </label>
            <label className="field field-span">
              <span>Decision Reason</span>
              <textarea
                className="textarea"
                value={decisionInput.reason}
                onChange={(event) =>
                  setDecisionInput((previous) => ({
                    ...previous,
                    reason: event.target.value
                  }))
                }
                required
              />
            </label>
          </div>
          <div className="button-row">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={actionBusy || !selectedOpportunityId}
            >
              Save Decision
            </button>
          </div>
        </form>
      </article>

      <article className="panel">
        <h2>Approval Queue</h2>
        {!selectedOpportunityId ? <p>Select an opportunity to see approvals.</p> : null}
        {selectedOpportunityId && approvalsLoading ? <p>Loading approvals…</p> : null}
        {selectedOpportunityId && !approvalsLoading && approvals.length === 0 ? (
          <p>No approvals requested yet for this opportunity.</p>
        ) : null}
        {selectedOpportunityId && !approvalsLoading && pendingApprovals.length === 0 && approvals.length > 0 ? (
          <p>All approvals for this opportunity have been reviewed.</p>
        ) : null}
        <div className="timeline-list">
          {approvals.map((approval) => (
            <div className="timeline-item" key={approval.id}>
              <div className="approval-head">
                <strong>{approval.approvalType}</strong>
                <span className={`badge ${badgeClassForApprovalStatus(approval.status)}`}>
                  {approval.status}
                </span>
              </div>
              <p>Requested on {new Date(approval.requestedAt).toLocaleString()}</p>
              {approval.reviewedAt ? (
                <small>Reviewed on {new Date(approval.reviewedAt).toLocaleString()}</small>
              ) : (
                <small>Awaiting reviewer action.</small>
              )}
              {approval.status === "pending" ? (
                <div className="stack">
                  <label className="field">
                    <span>Review Notes (optional)</span>
                    <textarea
                      className="textarea approval-note"
                      value={reviewNotesByApprovalId[approval.id] ?? ""}
                      onChange={(event) =>
                        setReviewNotesByApprovalId((previous) => ({
                          ...previous,
                          [approval.id]: event.target.value
                        }))
                      }
                    />
                  </label>
                  <div className="button-row">
                    <button
                      className="btn btn-primary btn-sm"
                      type="button"
                      disabled={actionBusy}
                      onClick={() => handleReviewApproval(approval.id, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      disabled={actionBusy}
                      onClick={() => handleReviewApproval(approval.id, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : null}
              {approval.status !== "pending" && approval.reviewNotes ? <p>{approval.reviewNotes}</p> : null}
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <h2>Opportunity Timeline</h2>
        {timelineLoading ? <p>Loading timeline…</p> : null}
        {!timelineLoading && timeline.length === 0 ? (
          <p>No timeline events yet for this opportunity.</p>
        ) : null}
        <div className="timeline-list">
          {timeline.map((item) => (
            <div className="timeline-item" key={item.id}>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
              <small>{new Date(item.createdAt).toLocaleString()}</small>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
