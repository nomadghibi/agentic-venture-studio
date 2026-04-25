"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { Opportunity, OpportunityTimelineItem, PrdContent, Signal, MonetizationContent, FeasibilityContent, MvpRoadmapContent, BuildPlanContent } from "@avs/types";
import type { ArchitectureContent } from "@avs/types";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchOpportunity,
  fetchOpportunityTimeline,
  fetchOpportunitySignals,
  fetchPrd,
  generatePrd,
  fetchArchitecture,
  generateArchitecture,
  fetchMonetization,
  generateMonetizationPlan,
  fetchFeasibility,
  generateFeasibilityReport,
  fetchMvpRoadmap,
  generateMvpRoadmap,
  fetchBuildPlan,
  generateBuildPlan,
  getApiErrorMessage,
  type PrdArtifact,
  type ArchitectureArtifact,
  type MonetizationArtifact,
  type FeasibilityArtifact,
  type MvpRoadmapArtifact,
  type BuildPlanArtifact
} from "@/services/api";

type Tab = "overview" | "prd" | "architecture" | "monetization" | "feasibility" | "mvp-roadmap" | "build-plan" | "signals" | "timeline";

const SCORE_LABELS: Record<string, string> = {
  painScore: "Pain Intensity",
  frequencyScore: "Frequency",
  buyerClarityScore: "Buyer Clarity",
  willingnessToPayScore: "Willingness to Pay",
  feasibilityScore: "Feasibility",
  distributionScore: "Distribution",
  strategicFitScore: "Strategic Fit",
  portfolioValueScore: "Portfolio Value"
};

const PRIORITY_CLASS: Record<string, string> = {
  "must-have": "badge good",
  "should-have": "badge pending",
  "nice-to-have": "badge"
};

function ScoreBar({ value, label }: { value: number; label: string }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 70 ? "var(--accent)" : pct >= 40 ? "var(--accent-2)" : "var(--danger)";
  return (
    <div className="score-row">
      <span className="score-label">{label}</span>
      <div className="score-bar-wrap">
        <div className="score-bar" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="score-val">{pct.toFixed(0)}</span>
    </div>
  );
}

function PrdView({
  prd,
  onRegenerate,
  busy,
  canWrite
}: {
  prd: PrdArtifact | null;
  onRegenerate: () => void;
  busy: boolean;
  canWrite: boolean;
}) {
  const c: PrdContent | null = prd?.content ?? null;

  return (
    <div className="stack">
      <div className="topbar-actions" style={{ justifyContent: "flex-start" }}>
        {canWrite ? (
          <button
            className="btn btn-primary"
            type="button"
            onClick={onRegenerate}
            disabled={busy}
          >
            {prd ? "Regenerate PRD" : "Generate PRD"}
          </button>
        ) : null}
        {prd ? (
          <small className="muted">
            Version {prd.version} · {new Date(prd.createdAt).toLocaleString()}
          </small>
        ) : null}
      </div>

      {busy ? <p>Generating PRD… polling for results (20–40 seconds).</p> : null}

      {!c && !busy ? (
        <article className="panel">
          <p>No PRD generated yet. Click &ldquo;Generate PRD&rdquo; to create one using Claude.</p>
        </article>
      ) : null}

      {c ? (
        <div className="prd-doc stack">
          <article className="panel">
            <h3>Executive Summary</h3>
            <p>{c.executiveSummary}</p>
          </article>

          <div className="grid-2">
            <article className="panel">
              <h3>Problem Statement</h3>
              <p>{c.problemStatement}</p>
            </article>
            <article className="panel">
              <h3>Target Users</h3>
              <p>{c.targetUsers}</p>
            </article>
          </div>

          <article className="panel">
            <h3>Core Features</h3>
            <div className="feature-list">
              {c.coreFeatures.map((f) => (
                <div className="feature-item" key={f.name}>
                  <div className="feature-head">
                    <strong>{f.name}</strong>
                    <span className={PRIORITY_CLASS[f.priority] ?? "badge"}>
                      {f.priority}
                    </span>
                  </div>
                  <p>{f.description}</p>
                </div>
              ))}
            </div>
          </article>

          <div className="grid-2">
            <article className="panel">
              <h3>MVP Scope</h3>
              <p>{c.mvpScope}</p>
            </article>
            <article className="panel">
              <h3>Out of Scope</h3>
              <p>{c.outOfScope}</p>
            </article>
          </div>

          <div className="grid-2">
            <article className="panel">
              <h3>Success Metrics</h3>
              <ul className="prd-list">
                {c.successMetrics.map((m) => <li key={m}>{m}</li>)}
              </ul>
            </article>
            <article className="panel">
              <h3>Monetization Model</h3>
              <p>{c.monetizationModel}</p>
            </article>
          </div>

          <article className="panel">
            <h3>Open Questions</h3>
            <ul className="prd-list">
              {c.openQuestions.map((q) => <li key={q}>{q}</li>)}
            </ul>
          </article>
        </div>
      ) : null}
    </div>
  );
}

function ArchView({
  arch,
  onRegenerate,
  busy,
  canWrite
}: {
  arch: ArchitectureArtifact | null;
  onRegenerate: () => void;
  busy: boolean;
  canWrite: boolean;
}) {
  const c: ArchitectureContent | null = arch?.content ?? null;

  return (
    <div className="stack">
      <div className="topbar-actions" style={{ justifyContent: "flex-start" }}>
        {canWrite ? (
          <button
            className="btn btn-primary"
            type="button"
            onClick={onRegenerate}
            disabled={busy}
          >
            {arch ? "Regenerate Architecture" : "Generate Architecture"}
          </button>
        ) : null}
        {arch ? (
          <small className="muted">
            Version {arch.version} · {new Date(arch.createdAt).toLocaleString()}
          </small>
        ) : null}
      </div>

      {busy ? <p>Generating architecture… polling for results (20–40 seconds).</p> : null}

      {!c && !busy ? (
        <article className="panel">
          <p>No architecture generated yet. Click &ldquo;Generate Architecture&rdquo; to create one using Claude.</p>
        </article>
      ) : null}

      {c ? (
        <div className="prd-doc stack">
          <article className="panel">
            <h3>System Overview</h3>
            <p>{c.systemOverview}</p>
          </article>

          <div className="grid-2">
            <article className="panel">
              <h3>Tech Stack</h3>
              <div className="feature-list">
                {c.techStack.map((t) => (
                  <div className="feature-item" key={t.layer}>
                    <div className="feature-head">
                      <strong>{t.layer}</strong>
                      <span className="badge">{t.technology}</span>
                    </div>
                    <p>{t.rationale}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="panel">
              <h3>Data Model</h3>
              <div className="feature-list">
                {c.dataModel.map((d) => (
                  <div className="feature-item" key={d.entity}>
                    <strong>{d.entity}</strong>
                    {d.keyFields ? <small className="muted">Fields: {d.keyFields}</small> : null}
                    {d.relationships ? <p>{d.relationships}</p> : null}
                  </div>
                ))}
              </div>
            </article>
          </div>

          <article className="panel">
            <h3>API Surface</h3>
            <div className="feature-list">
              {c.apiSurface.map((a) => (
                <div className="feature-item" key={`${a.method}-${a.path}`}>
                  <div className="feature-head">
                    <strong>{a.method} {a.path}</strong>
                  </div>
                  <p>{a.purpose}</p>
                </div>
              ))}
            </div>
          </article>

          <div className="grid-2">
            <article className="panel">
              <h3>Deployment Approach</h3>
              <p>{c.deploymentApproach}</p>
            </article>
            <article className="panel">
              <h3>Estimated Build Time</h3>
              <p>{c.estimatedBuildTime}</p>
            </article>
          </div>

          <article className="panel">
            <h3>Build Order</h3>
            <ol className="prd-list">
              {c.buildOrder.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </article>

          {c.technicalRisks.length > 0 ? (
            <article className="panel">
              <h3>Technical Risks</h3>
              <ul className="prd-list">
                {c.technicalRisks.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </article>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MonetizationView({
  mono,
  onRegenerate,
  busy,
  canWrite
}: {
  mono: MonetizationArtifact | null;
  onRegenerate: () => void;
  busy: boolean;
  canWrite: boolean;
}) {
  const c: MonetizationContent | null = mono?.content ?? null;

  return (
    <div className="stack">
      <div className="topbar-actions" style={{ justifyContent: "flex-start" }}>
        {canWrite ? (
          <button className="btn btn-primary" type="button" onClick={onRegenerate} disabled={busy}>
            {mono ? "Regenerate Strategy" : "Generate Monetization Strategy"}
          </button>
        ) : null}
        {mono ? (
          <small className="muted">
            Version {mono.version} · {new Date(mono.createdAt).toLocaleString()}
          </small>
        ) : null}
      </div>

      {busy ? <p>Generating monetization strategy… polling for results (20–40 seconds).</p> : null}

      {!c && !busy ? (
        <article className="panel">
          <p>No monetization strategy yet. Click &ldquo;Generate Monetization Strategy&rdquo; or advance the opportunity to the monetization stage.</p>
        </article>
      ) : null}

      {c ? (
        <div className="prd-doc stack">
          <div className="grid-2">
            <article className="panel">
              <h3>Primary Model</h3>
              <p><span className="badge good">{c.primaryModel.replace(/_/g, " ")}</span></p>
              <p style={{ marginTop: 8 }}><strong>{c.suggestedPrice}</strong></p>
              <p style={{ marginTop: 4 }}>{c.pricingRationale}</p>
            </article>
            <article className="panel">
              <h3>Year 1 Revenue Estimate</h3>
              <p>{c.year1RevenueEstimate}</p>
              <h3 style={{ marginTop: 16 }}>Revenue Lead Indicator</h3>
              <p>{c.revenueLeadIndicator}</p>
            </article>
          </div>

          <article className="panel">
            <h3>Next Step to Validate</h3>
            <p>{c.recommendation}</p>
          </article>

          <div className="grid-2">
            <article className="panel">
              <h3>Alternative Models</h3>
              <ul className="prd-list">
                {c.alternativeModels.map((m) => <li key={m}>{m}</li>)}
              </ul>
            </article>
            <article className="panel">
              <h3>Anti-Patterns to Avoid</h3>
              <ul className="prd-list">
                {c.antiPatterns.map((a) => <li key={a}>{a}</li>)}
              </ul>
            </article>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FeasibilityView({
  feasibility,
  onRegenerate,
  busy,
  canWrite
}: {
  feasibility: FeasibilityArtifact | null;
  onRegenerate: () => void;
  busy: boolean;
  canWrite: boolean;
}) {
  const c: FeasibilityContent | null = feasibility?.content ?? null;

  const complexityClass = c?.buildComplexity === "low"
    ? "good"
    : c?.buildComplexity === "medium"
      ? "pending"
      : "bad";

  const recommendationClass = c?.recommendation === "proceed"
    ? "good"
    : c?.recommendation === "de-risk"
      ? "pending"
      : "bad";

  return (
    <div className="stack">
      <div className="topbar-actions" style={{ justifyContent: "flex-start" }}>
        {canWrite ? (
          <button
            className="btn btn-primary"
            type="button"
            onClick={onRegenerate}
            disabled={busy}
          >
            {feasibility ? "Regenerate Report" : "Generate Feasibility Report"}
          </button>
        ) : null}
        {feasibility ? (
          <small className="muted">
            Version {feasibility.version} · {new Date(feasibility.createdAt).toLocaleString()}
          </small>
        ) : null}
      </div>

      {busy ? <p>Generating feasibility report… polling for results (20–40 seconds).</p> : null}

      {!c && !busy ? (
        <article className="panel">
          <p>No feasibility report yet. Click &ldquo;Generate Feasibility Report&rdquo; or advance the opportunity to the feasibility stage.</p>
        </article>
      ) : null}

      {c ? (
        <div className="prd-doc stack">
          <div className="grid-2">
            <article className="panel">
              <h3>Assessment</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <span className={`badge ${complexityClass}`}>
                  {c.buildComplexity} complexity
                </span>
                <span className={`badge ${recommendationClass}`}>
                  {c.recommendation}
                </span>
              </div>
              <p><strong>Score:</strong> {c.feasibilityScore}/100</p>
              <p><strong>Confidence:</strong> {Math.round(c.confidence * 100)}%</p>
            </article>
            <article className="panel">
              <h3>Build Estimate</h3>
              <p style={{ fontSize: "1.1em", fontWeight: 600 }}>{c.estimatedTimeline}</p>
              <h3 style={{ marginTop: 16 }}>Team Requirements</h3>
              <p>{c.teamRequirements}</p>
            </article>
          </div>

          <article className="panel">
            <h3>Rationale</h3>
            <p>{c.rationale}</p>
          </article>

          {c.keyRisks.length > 0 ? (
            <article className="panel">
              <h3>Key Risks</h3>
              <ul className="prd-list">
                {c.keyRisks.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </article>
          ) : null}

          {c.technicalDependencies.length > 0 ? (
            <article className="panel">
              <h3>Technical Dependencies</h3>
              <ul className="prd-list">
                {c.technicalDependencies.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </article>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MvpRoadmapView({
  roadmap,
  onRegenerate,
  busy,
  canWrite
}: {
  roadmap: MvpRoadmapArtifact | null;
  onRegenerate: () => void;
  busy: boolean;
  canWrite: boolean;
}) {
  const c: MvpRoadmapContent | null = roadmap?.content ?? null;

  return (
    <div className="stack">
      <div className="topbar-actions" style={{ justifyContent: "flex-start" }}>
        {canWrite ? (
          <button className="btn btn-primary" type="button" onClick={onRegenerate} disabled={busy}>
            {roadmap ? "Regenerate Roadmap" : "Generate MVP Roadmap"}
          </button>
        ) : null}
        {roadmap ? (
          <small className="muted">
            Version {roadmap.version} · {new Date(roadmap.createdAt).toLocaleString()}
          </small>
        ) : null}
      </div>

      {busy ? <p>Generating MVP roadmap… polling for results (30–60 seconds).</p> : null}

      {!c && !busy ? (
        <article className="panel">
          <p>No MVP roadmap yet. Generate a PRD and feasibility report first, then click &ldquo;Generate MVP Roadmap&rdquo;.</p>
        </article>
      ) : null}

      {c ? (
        <div className="prd-doc stack">
          <div className="grid-2">
            <article className="panel">
              <h3>Sprint Plan</h3>
              <p><strong>Total Duration:</strong> {c.totalDuration}</p>
              <p style={{ marginTop: 8 }}>{c.rationale}</p>
            </article>
            <article className="panel">
              <h3>Resources</h3>
              <p>{c.resourceRequirements}</p>
              <h3 style={{ marginTop: 16 }}>Confidence</h3>
              <p>{Math.round(c.confidence * 100)}%</p>
            </article>
          </div>

          <article className="panel">
            <h3>Sprints</h3>
            <div className="feature-list">
              {c.sprints.map((s) => (
                <div className="feature-item" key={s.sprint}>
                  <div className="feature-head">
                    <strong>Sprint {s.sprint}</strong>
                    <span className="badge">{s.features.length} features</span>
                  </div>
                  <p><strong>Goal:</strong> {s.goal}</p>
                  <ul className="prd-list">
                    {s.features.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                  <p><em>Done when:</em> {s.deliverable}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Milestones</h3>
            <div className="feature-list">
              {c.milestones.map((m) => (
                <div className="feature-item" key={m.name}>
                  <div className="feature-head">
                    <strong>{m.name}</strong>
                    <span className="badge">Week {m.week}</span>
                  </div>
                  <p>{m.deliverable}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Launch Criteria</h3>
            <ul className="prd-list">
              {c.launchCriteria.map((lc) => <li key={lc}>{lc}</li>)}
            </ul>
          </article>

          <article className="panel">
            <h3>Next Action</h3>
            <p>{c.recommendation}</p>
          </article>
        </div>
      ) : null}
    </div>
  );
}

function BuildPlanView({
  plan,
  onRegenerate,
  busy,
  canWrite
}: {
  plan: BuildPlanArtifact | null;
  onRegenerate: () => void;
  busy: boolean;
  canWrite: boolean;
}) {
  const c: BuildPlanContent | null = plan?.content ?? null;

  return (
    <div className="stack">
      <div className="topbar-actions" style={{ justifyContent: "flex-start" }}>
        {canWrite ? (
          <button className="btn btn-primary" type="button" onClick={onRegenerate} disabled={busy}>
            {plan ? "Regenerate Build Plan" : "Generate Build Plan"}
          </button>
        ) : null}
        {plan ? (
          <small className="muted">
            Version {plan.version} · {new Date(plan.createdAt).toLocaleString()}
          </small>
        ) : null}
      </div>

      {busy ? <p>Generating build plan… polling for results (30–60 seconds).</p> : null}

      {!c && !busy ? (
        <article className="panel">
          <p>No build plan yet. Generate an architecture doc and MVP roadmap first, then click &ldquo;Generate Build Plan&rdquo;.</p>
        </article>
      ) : null}

      {c ? (
        <div className="prd-doc stack">
          <div className="grid-2">
            <article className="panel">
              <h3>Overview</h3>
              <p>{c.overview}</p>
            </article>
            <article className="panel">
              <h3>Budget Estimate</h3>
              <p>{c.totalBudgetEstimate}</p>
              <h3 style={{ marginTop: 16 }}>Confidence</h3>
              <p>{Math.round(c.confidence * 100)}%</p>
            </article>
          </div>

          <article className="panel">
            <h3>Build Phases</h3>
            <div className="feature-list">
              {c.phases.map((p) => (
                <div className="feature-item" key={p.phase}>
                  <div className="feature-head">
                    <strong>Phase {p.phase}: {p.name}</strong>
                    <span className="badge">{p.duration}</span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <strong>Objectives:</strong>
                    <ul className="prd-list">
                      {p.objectives.map((o) => <li key={o}>{o}</li>)}
                    </ul>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <strong>Tasks:</strong>
                    <ul className="prd-list">
                      {p.tasks.map((t) => <li key={t}>{t}</li>)}
                    </ul>
                  </div>
                  <p style={{ marginTop: 8 }}><em>Done when:</em> {p.exitCriteria}</p>
                </div>
              ))}
            </div>
          </article>

          <div className="grid-2">
            <article className="panel">
              <h3>Team</h3>
              <div className="feature-list">
                {c.teamRoles.map((r) => (
                  <div className="feature-item" key={r.role}>
                    <div className="feature-head">
                      <strong>{r.role}</strong>
                      <span className="badge">{r.hoursPerWeek}h/wk</span>
                    </div>
                    <p>{r.responsibilities}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="panel">
              <h3>External Dependencies</h3>
              <ul className="prd-list">
                {c.externalDependencies.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </article>
          </div>

          {c.riskMitigation.length > 0 ? (
            <article className="panel">
              <h3>Risk Mitigation</h3>
              <div className="feature-list">
                {c.riskMitigation.map((r) => (
                  <div className="feature-item" key={r.risk}>
                    <strong>{r.risk}</strong>
                    <p>{r.mitigation}</p>
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          <article className="panel">
            <h3>Definition of Done</h3>
            <p>{c.definitionOfDone}</p>
          </article>

          <article className="panel">
            <h3>Next Action</h3>
            <p>{c.recommendation}</p>
          </article>
        </div>
      ) : null}
    </div>
  );
}

const POLL_INTERVAL_MS = 5_000;
const POLL_MAX_ATTEMPTS = 18; // 90 seconds

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const { session, loading: authLoading } = useAuth("/workspace");

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [prd, setPrd] = useState<PrdArtifact | null>(null);
  const [prdLoading, setPrdLoading] = useState(false);
  const [prdBusy, setPrdBusy] = useState(false);
  const [arch, setArch] = useState<ArchitectureArtifact | null>(null);
  const [archLoading, setArchLoading] = useState(false);
  const [archBusy, setArchBusy] = useState(false);
  const [mono, setMono] = useState<MonetizationArtifact | null>(null);
  const [monoLoading, setMonoLoading] = useState(false);
  const [monoBusy, setMonoBusy] = useState(false);
  const [feasibility, setFeasibility] = useState<FeasibilityArtifact | null>(null);
  const [feasibilityLoading, setFeasibilityLoading] = useState(false);
  const [feasibilityBusy, setFeasibilityBusy] = useState(false);
  const [roadmap, setRoadmap] = useState<MvpRoadmapArtifact | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmapBusy, setRoadmapBusy] = useState(false);
  const [buildPlan, setBuildPlan] = useState<BuildPlanArtifact | null>(null);
  const [buildPlanLoading, setBuildPlanLoading] = useState(false);
  const [buildPlanBusy, setBuildPlanBusy] = useState(false);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [timeline, setTimeline] = useState<OpportunityTimelineItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const prdPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const archPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const monoPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feasibilityPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roadmapPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const buildPlanPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!session || !id) return;
    let cancelled = false;
    async function load() {
      setDataLoading(true);
      try {
        const opp = await fetchOpportunity(id);
        if (!cancelled) setOpportunity(opp);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err));
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [session, id]);

  const loadPrd = useCallback(async () => {
    if (!id) return;
    setPrdLoading(true);
    try {
      const data = await fetchPrd(id);
      setPrd(data);
    } finally {
      setPrdLoading(false);
    }
  }, [id]);

  const loadArch = useCallback(async () => {
    if (!id) return;
    setArchLoading(true);
    try {
      const data = await fetchArchitecture(id);
      setArch(data);
    } finally {
      setArchLoading(false);
    }
  }, [id]);

  const loadMono = useCallback(async () => {
    if (!id) return;
    setMonoLoading(true);
    try {
      const data = await fetchMonetization(id);
      setMono(data);
    } finally {
      setMonoLoading(false);
    }
  }, [id]);

  const loadFeasibility = useCallback(async () => {
    if (!id) return;
    setFeasibilityLoading(true);
    try {
      const data = await fetchFeasibility(id);
      setFeasibility(data);
    } finally {
      setFeasibilityLoading(false);
    }
  }, [id]);

  const loadRoadmap = useCallback(async () => {
    if (!id) return;
    setRoadmapLoading(true);
    try {
      const data = await fetchMvpRoadmap(id);
      setRoadmap(data);
    } finally {
      setRoadmapLoading(false);
    }
  }, [id]);

  const loadBuildPlan = useCallback(async () => {
    if (!id) return;
    setBuildPlanLoading(true);
    try {
      const data = await fetchBuildPlan(id);
      setBuildPlan(data);
    } finally {
      setBuildPlanLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (tab === "prd" && session) void loadPrd();
  }, [tab, session, loadPrd]);

  useEffect(() => {
    if (tab === "architecture" && session) void loadArch();
  }, [tab, session, loadArch]);

  useEffect(() => {
    if (tab === "monetization" && session) void loadMono();
  }, [tab, session, loadMono]);

  useEffect(() => {
    if (tab === "feasibility" && session) void loadFeasibility();
  }, [tab, session, loadFeasibility]);

  useEffect(() => {
    if (tab === "mvp-roadmap" && session) void loadRoadmap();
  }, [tab, session, loadRoadmap]);

  useEffect(() => {
    if (tab === "build-plan" && session) void loadBuildPlan();
  }, [tab, session, loadBuildPlan]);

  useEffect(() => {
    if (tab !== "signals" || !session || !id) return;
    let cancelled = false;
    void fetchOpportunitySignals(id)
      .then((data) => { if (!cancelled) setSignals(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [tab, session, id]);

  useEffect(() => {
    if (tab !== "timeline" || !session || !id) return;
    let cancelled = false;
    void fetchOpportunityTimeline(id)
      .then((data) => { if (!cancelled) setTimeline(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [tab, session, id]);

  useEffect(() => {
    return () => {
      if (prdPollRef.current) clearInterval(prdPollRef.current);
      if (archPollRef.current) clearInterval(archPollRef.current);
      if (monoPollRef.current) clearInterval(monoPollRef.current);
      if (feasibilityPollRef.current) clearInterval(feasibilityPollRef.current);
      if (roadmapPollRef.current) clearInterval(roadmapPollRef.current);
      if (buildPlanPollRef.current) clearInterval(buildPlanPollRef.current);
    };
  }, []);

  function startPrdPolling() {
    if (prdPollRef.current) clearInterval(prdPollRef.current);
    let attempts = 0;
    prdPollRef.current = setInterval(async () => {
      attempts++;
      const data = await fetchPrd(id).catch(() => null);
      if (data) {
        setPrd(data);
        setPrdBusy(false);
        if (prdPollRef.current) clearInterval(prdPollRef.current);
        setFeedback("PRD generated successfully.");
      } else if (attempts >= POLL_MAX_ATTEMPTS) {
        setPrdBusy(false);
        if (prdPollRef.current) clearInterval(prdPollRef.current);
        setFeedback("PRD is taking longer than expected — refresh the page to check.");
      }
    }, POLL_INTERVAL_MS);
  }

  function startArchPolling() {
    if (archPollRef.current) clearInterval(archPollRef.current);
    let attempts = 0;
    archPollRef.current = setInterval(async () => {
      attempts++;
      const data = await fetchArchitecture(id).catch(() => null);
      if (data) {
        setArch(data);
        setArchBusy(false);
        if (archPollRef.current) clearInterval(archPollRef.current);
        setFeedback("Architecture generated successfully.");
      } else if (attempts >= POLL_MAX_ATTEMPTS) {
        setArchBusy(false);
        if (archPollRef.current) clearInterval(archPollRef.current);
        setFeedback("Architecture is taking longer than expected — refresh the page to check.");
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleGeneratePrd() {
    setPrdBusy(true);
    setFeedback("");
    setError("");
    try {
      await generatePrd(id);
      startPrdPolling();
    } catch (err) {
      setPrdBusy(false);
      setError(getApiErrorMessage(err));
    }
  }

  async function handleGenerateArchitecture() {
    setArchBusy(true);
    setFeedback("");
    setError("");
    try {
      await generateArchitecture(id);
      startArchPolling();
    } catch (err) {
      setArchBusy(false);
      setError(getApiErrorMessage(err));
    }
  }

  function startMonoPolling() {
    if (monoPollRef.current) clearInterval(monoPollRef.current);
    let attempts = 0;
    monoPollRef.current = setInterval(async () => {
      attempts++;
      const data = await fetchMonetization(id).catch(() => null);
      if (data) {
        setMono(data);
        setMonoBusy(false);
        if (monoPollRef.current) clearInterval(monoPollRef.current);
        setFeedback("Monetization strategy generated successfully.");
      } else if (attempts >= POLL_MAX_ATTEMPTS) {
        setMonoBusy(false);
        if (monoPollRef.current) clearInterval(monoPollRef.current);
        setFeedback("Monetization strategy is taking longer than expected — refresh to check.");
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleGenerateMonetization() {
    setMonoBusy(true);
    setFeedback("");
    setError("");
    try {
      await generateMonetizationPlan(id);
      startMonoPolling();
    } catch (err) {
      setMonoBusy(false);
      setError(getApiErrorMessage(err));
    }
  }

  function startFeasibilityPolling() {
    if (feasibilityPollRef.current) clearInterval(feasibilityPollRef.current);
    let attempts = 0;
    feasibilityPollRef.current = setInterval(async () => {
      attempts++;
      const data = await fetchFeasibility(id).catch(() => null);
      if (data) {
        setFeasibility(data);
        setFeasibilityBusy(false);
        if (feasibilityPollRef.current) clearInterval(feasibilityPollRef.current);
        setFeedback("Feasibility report generated successfully.");
      } else if (attempts >= POLL_MAX_ATTEMPTS) {
        setFeasibilityBusy(false);
        if (feasibilityPollRef.current) clearInterval(feasibilityPollRef.current);
        setFeedback("Feasibility report is taking longer than expected — refresh the page to check.");
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleGenerateFeasibility() {
    setFeasibilityBusy(true);
    setFeedback("");
    setError("");
    try {
      await generateFeasibilityReport(id);
      startFeasibilityPolling();
    } catch (err) {
      setFeasibilityBusy(false);
      setError(getApiErrorMessage(err));
    }
  }

  function startRoadmapPolling() {
    if (roadmapPollRef.current) clearInterval(roadmapPollRef.current);
    let attempts = 0;
    roadmapPollRef.current = setInterval(async () => {
      attempts++;
      const data = await fetchMvpRoadmap(id).catch(() => null);
      if (data) {
        setRoadmap(data);
        setRoadmapBusy(false);
        if (roadmapPollRef.current) clearInterval(roadmapPollRef.current);
        setFeedback("MVP roadmap generated successfully.");
      } else if (attempts >= POLL_MAX_ATTEMPTS) {
        setRoadmapBusy(false);
        if (roadmapPollRef.current) clearInterval(roadmapPollRef.current);
        setFeedback("MVP roadmap is taking longer than expected — refresh the page to check.");
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleGenerateRoadmap() {
    setRoadmapBusy(true);
    setFeedback("");
    setError("");
    try {
      await generateMvpRoadmap(id);
      startRoadmapPolling();
    } catch (err) {
      setRoadmapBusy(false);
      setError(getApiErrorMessage(err));
    }
  }

  function startBuildPlanPolling() {
    if (buildPlanPollRef.current) clearInterval(buildPlanPollRef.current);
    let attempts = 0;
    buildPlanPollRef.current = setInterval(async () => {
      attempts++;
      const data = await fetchBuildPlan(id).catch(() => null);
      if (data) {
        setBuildPlan(data);
        setBuildPlanBusy(false);
        if (buildPlanPollRef.current) clearInterval(buildPlanPollRef.current);
        setFeedback("Build plan generated successfully.");
      } else if (attempts >= POLL_MAX_ATTEMPTS) {
        setBuildPlanBusy(false);
        if (buildPlanPollRef.current) clearInterval(buildPlanPollRef.current);
        setFeedback("Build plan is taking longer than expected — refresh the page to check.");
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleGenerateBuildPlan() {
    setBuildPlanBusy(true);
    setFeedback("");
    setError("");
    try {
      await generateBuildPlan(id);
      startBuildPlanPolling();
    } catch (err) {
      setBuildPlanBusy(false);
      setError(getApiErrorMessage(err));
    }
  }

  if (authLoading || dataLoading) {
    return (
      <main className="page-shell">
        <article className="panel"><h1>Loading opportunity…</h1></article>
      </main>
    );
  }

  if (!session || !opportunity) {
    return (
      <main className="page-shell">
        <article className="panel">
          <h1>Not found</h1>
          <Link href="/workspace" className="btn btn-ghost">Back to Workspace</Link>
        </article>
      </main>
    );
  }

  const canWrite = ["founder", "product_lead", "research_reviewer", "technical_architect", "admin"].includes(session.user.role);
  const scoreEntries = Object.entries(SCORE_LABELS) as [keyof Opportunity, string][];

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <h1>{opportunity.title}</h1>
          <p className="topbar-meta">
            <span className={`badge ${opportunity.status === "approved" ? "good" : "pending"}`}>
              {opportunity.status}
            </span>
            {" · "}
            Stage: <strong>{opportunity.currentStage}</strong>
            {" · "}
            Score: <strong>{opportunity.overallScore.toFixed(1)}</strong>
            {" · "}
            <span className={`badge ${opportunity.confidenceLevel === "high" ? "good" : opportunity.confidenceLevel === "medium" ? "pending" : "bad"}`}>
              {opportunity.confidenceLevel} confidence
            </span>
          </p>
        </div>
        <div className="topbar-actions">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => router.back()}
          >
            ← Back
          </button>
        </div>
      </header>

      {feedback ? <p className="status-line success">{feedback}</p> : null}
      {error ? <p className="status-line error">{error}</p> : null}

      <nav className="tab-nav">
        {(["overview", "prd", "architecture", "monetization", "feasibility", "mvp-roadmap", "build-plan", "signals", "timeline"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`tab-btn${tab === t ? " tab-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "prd" ? "PRD" : t === "mvp-roadmap" ? "MVP Roadmap" : t === "build-plan" ? "Build Plan" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      {tab === "overview" ? (
        <div className="stack">
          <div className="grid-2">
            <article className="panel">
              <h2>Problem Statement</h2>
              <p>{opportunity.problemStatement}</p>
            </article>
            <article className="panel">
              <h2>Target Buyer</h2>
              <p>{opportunity.targetBuyer}</p>
              <p><strong>Industry:</strong> {opportunity.industry}</p>
            </article>
          </div>
          <article className="panel">
            <h2>Validation Scores</h2>
            <div className="score-grid">
              {scoreEntries.map(([key, label]) => (
                <ScoreBar key={key} label={label} value={opportunity[key] as number} />
              ))}
            </div>
          </article>
        </div>
      ) : null}

      {tab === "prd" ? (
        prdLoading ? (
          <article className="panel"><p>Loading PRD…</p></article>
        ) : (
          <PrdView
            prd={prd}
            onRegenerate={handleGeneratePrd}
            busy={prdBusy}
            canWrite={canWrite}
          />
        )
      ) : null}

      {tab === "architecture" ? (
        archLoading ? (
          <article className="panel"><p>Loading architecture…</p></article>
        ) : (
          <ArchView
            arch={arch}
            onRegenerate={handleGenerateArchitecture}
            busy={archBusy}
            canWrite={canWrite}
          />
        )
      ) : null}

      {tab === "monetization" ? (
        monoLoading ? (
          <article className="panel"><p>Loading monetization strategy…</p></article>
        ) : (
          <MonetizationView
            mono={mono}
            onRegenerate={handleGenerateMonetization}
            busy={monoBusy}
            canWrite={canWrite}
          />
        )
      ) : null}

      {tab === "feasibility" ? (
        feasibilityLoading ? (
          <article className="panel"><p>Loading feasibility report…</p></article>
        ) : (
          <FeasibilityView
            feasibility={feasibility}
            onRegenerate={handleGenerateFeasibility}
            busy={feasibilityBusy}
            canWrite={canWrite}
          />
        )
      ) : null}

      {tab === "mvp-roadmap" ? (
        roadmapLoading ? (
          <article className="panel"><p>Loading MVP roadmap…</p></article>
        ) : (
          <MvpRoadmapView
            roadmap={roadmap}
            onRegenerate={handleGenerateRoadmap}
            busy={roadmapBusy}
            canWrite={canWrite}
          />
        )
      ) : null}

      {tab === "build-plan" ? (
        buildPlanLoading ? (
          <article className="panel"><p>Loading build plan…</p></article>
        ) : (
          <BuildPlanView
            plan={buildPlan}
            onRegenerate={handleGenerateBuildPlan}
            busy={buildPlanBusy}
            canWrite={canWrite}
          />
        )
      ) : null}

      {tab === "signals" ? (
        <article className="panel">
          <h2>Linked Signals</h2>
          {signals.length === 0 ? (
            <p>No signals linked to this opportunity yet.</p>
          ) : (
            <div className="timeline-list">
              {signals.map((s) => (
                <div className="timeline-item" key={s.id}>
                  <div className="tl-head">
                    <span className="tl-kind tl-kind-stage">{s.sourceType}</span>
                    {s.sourceTitle ? <strong className="tl-title">{s.sourceTitle}</strong> : null}
                  </div>
                  <p>{s.contentExcerpt}</p>
                  {s.sourceUrl ? (
                    <small>
                      <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">{s.sourceUrl}</a>
                    </small>
                  ) : null}
                  <small>{new Date(s.createdAt).toLocaleString()}</small>
                </div>
              ))}
            </div>
          )}
        </article>
      ) : null}

      {tab === "timeline" ? (
        <article className="panel">
          <h2>History</h2>
          {timeline.length === 0 ? (
            <p>No timeline events yet.</p>
          ) : (
            <div className="timeline-list">
              {timeline.map((item) => (
                <div className="timeline-item" key={item.id}>
                  <div className="tl-head">
                    <span className="tl-kind tl-kind-stage">{item.kind.replace(/_/g, " ")}</span>
                    <strong className="tl-title">{item.title}</strong>
                  </div>
                  <p>{item.description}</p>
                  <small>{new Date(item.createdAt).toLocaleString()}</small>
                </div>
              ))}
            </div>
          )}
        </article>
      ) : null}
    </main>
  );
}
