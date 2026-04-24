"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { Venture } from "@avs/types";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchVenture,
  fetchOpportunity,
  fetchPrd,
  fetchArchitecture,
  fetchMonetization,
  getApiErrorMessage,
  type PrdArtifact,
  type ArchitectureArtifact,
  type MonetizationArtifact
} from "@/services/api";
import type { Opportunity } from "@avs/types";

type Tab = "overview" | "prd" | "architecture" | "monetization";

export default function VentureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const { session, loading: authLoading } = useAuth("/ventures");

  const [venture, setVenture] = useState<Venture | null>(null);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [prd, setPrd] = useState<PrdArtifact | null>(null);
  const [arch, setArch] = useState<ArchitectureArtifact | null>(null);
  const [mono, setMono] = useState<MonetizationArtifact | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session || !id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const v = await fetchVenture(id);
        if (!v) { router.replace("/ventures"); return; }
        if (cancelled) return;
        setVenture(v);

        const [opp, prdData, archData, monoData] = await Promise.all([
          fetchOpportunity(v.opportunityId).catch(() => null),
          fetchPrd(v.opportunityId).catch(() => null),
          fetchArchitecture(v.opportunityId).catch(() => null),
          fetchMonetization(v.opportunityId).catch(() => null)
        ]);

        if (cancelled) return;
        if (opp) setOpportunity(opp);
        setPrd(prdData);
        setArch(archData);
        setMono(monoData);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [session, id, router]);

  if (authLoading || loading) {
    return (
      <main className="page-shell">
        <article className="panel"><p>Loading venture…</p></article>
      </main>
    );
  }

  if (!session || !venture) {
    return (
      <main className="page-shell">
        <article className="panel">
          <h1>Not found</h1>
          <Link href="/ventures" className="btn btn-ghost">Back to Portfolio</Link>
        </article>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <h1>{venture.name}</h1>
          <p className="topbar-meta">
            <span className={`badge ${venture.stage === "live" ? "good" : "pending"}`}>
              {venture.stage}
            </span>
            {venture.tagline ? <> · {venture.tagline}</> : null}
          </p>
        </div>
        <div className="topbar-actions">
          {opportunity ? (
            <Link href={`/workspace/opportunities/${opportunity.id}`} className="btn btn-ghost">
              Open in Workspace
            </Link>
          ) : null}
          <Link href="/ventures" className="btn btn-ghost">← Portfolio</Link>
        </div>
      </header>

      {error ? <p className="status-line error">{error}</p> : null}

      <section className="grid-2">
        <article className="panel">
          <h2>Venture Details</h2>
          <p><strong>Business Model:</strong> {venture.businessModel ?? "Not specified"}</p>
          <p><strong>Target Market:</strong> {venture.targetMarket ?? "Not specified"}</p>
          <p><strong>Created:</strong> {new Date(venture.createdAt).toLocaleDateString()}</p>
          <p><strong>Updated:</strong> {new Date(venture.updatedAt).toLocaleDateString()}</p>
        </article>

        {opportunity ? (
          <article className="panel">
            <h2>Source Opportunity</h2>
            <p><strong>{opportunity.title}</strong></p>
            <p>{opportunity.problemStatement}</p>
            <p style={{ marginTop: 8 }}>
              Overall Score: <strong>{opportunity.overallScore.toFixed(1)}</strong>
              {" · "}
              <span className={`badge ${opportunity.confidenceLevel === "high" ? "good" : "pending"}`}>
                {opportunity.confidenceLevel} confidence
              </span>
            </p>
          </article>
        ) : null}
      </section>

      <nav className="tab-nav">
        {(["overview", "prd", "architecture", "monetization"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`tab-btn${tab === t ? " tab-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "prd" ? "PRD" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      {tab === "overview" && opportunity ? (
        <div className="stack">
          <div className="grid-2">
            <article className="panel">
              <h3>Industry</h3>
              <p>{opportunity.industry}</p>
            </article>
            <article className="panel">
              <h3>Target Buyer</h3>
              <p>{opportunity.targetBuyer}</p>
            </article>
          </div>
          {mono?.content ? (
            <article className="panel">
              <h3>Monetization</h3>
              <p><span className="badge good">{mono.content.primaryModel.replace(/_/g, " ")}</span> · <strong>{mono.content.suggestedPrice}</strong></p>
              <p style={{ marginTop: 8 }}>{mono.content.year1RevenueEstimate}</p>
            </article>
          ) : null}
        </div>
      ) : null}

      {tab === "prd" ? (
        prd?.content ? (
          <div className="prd-doc stack">
            <article className="panel">
              <h3>Executive Summary</h3>
              <p>{prd.content.executiveSummary}</p>
            </article>
            <div className="grid-2">
              <article className="panel">
                <h3>MVP Scope</h3>
                <p>{prd.content.mvpScope}</p>
              </article>
              <article className="panel">
                <h3>Monetization Model</h3>
                <p>{prd.content.monetizationModel}</p>
              </article>
            </div>
            <article className="panel">
              <h3>Core Features</h3>
              <div className="feature-list">
                {prd.content.coreFeatures.map((f) => (
                  <div className="feature-item" key={f.name}>
                    <div className="feature-head">
                      <strong>{f.name}</strong>
                      <span className="badge">{f.priority}</span>
                    </div>
                    <p>{f.description}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        ) : (
          <article className="panel">
            <p>No PRD generated for this venture yet. Open in workspace to generate one.</p>
          </article>
        )
      ) : null}

      {tab === "architecture" ? (
        arch?.content ? (
          <div className="prd-doc stack">
            <article className="panel">
              <h3>System Overview</h3>
              <p>{arch.content.systemOverview}</p>
            </article>
            <div className="grid-2">
              <article className="panel">
                <h3>Tech Stack</h3>
                <div className="feature-list">
                  {arch.content.techStack.map((t) => (
                    <div className="feature-item" key={t.layer}>
                      <div className="feature-head">
                        <strong>{t.layer}</strong>
                        <span className="badge">{t.technology}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
              <article className="panel">
                <h3>Build Timeline</h3>
                <p>{arch.content.estimatedBuildTime}</p>
                <h3 style={{ marginTop: 16 }}>Deployment</h3>
                <p>{arch.content.deploymentApproach}</p>
              </article>
            </div>
            <article className="panel">
              <h3>Build Order</h3>
              <ol className="prd-list">
                {arch.content.buildOrder.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </article>
          </div>
        ) : (
          <article className="panel">
            <p>No architecture generated yet. Open in workspace to generate one.</p>
          </article>
        )
      ) : null}

      {tab === "monetization" ? (
        mono?.content ? (
          <div className="prd-doc stack">
            <div className="grid-2">
              <article className="panel">
                <h3>Primary Model</h3>
                <p><span className="badge good">{mono.content.primaryModel.replace(/_/g, " ")}</span></p>
                <p style={{ marginTop: 8 }}><strong>{mono.content.suggestedPrice}</strong></p>
                <p>{mono.content.pricingRationale}</p>
              </article>
              <article className="panel">
                <h3>Year 1 Estimate</h3>
                <p>{mono.content.year1RevenueEstimate}</p>
                <h3 style={{ marginTop: 16 }}>Lead Indicator</h3>
                <p>{mono.content.revenueLeadIndicator}</p>
              </article>
            </div>
            <article className="panel">
              <h3>Validation Next Step</h3>
              <p>{mono.content.recommendation}</p>
            </article>
          </div>
        ) : (
          <article className="panel">
            <p>No monetization strategy yet. Open in workspace to generate one.</p>
          </article>
        )
      ) : null}
    </main>
  );
}
