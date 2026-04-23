"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthSession, DashboardSummary, Venture } from "@avs/types";
import {
  fetchDashboardSummary,
  fetchSession,
  fetchVentures,
  getApiErrorMessage,
  getApiStatusCode,
  logout
} from "@/services/api";

function badgeClassForStage(stage: string): "good" | "pending" | "bad" {
  if (stage === "live") {
    return "good";
  }

  if (stage === "killed" || stage === "archived") {
    return "bad";
  }

  return "pending";
}

export default function VenturesPage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const activeSession = await fetchSession();
        if (!activeSession) {
          router.replace("/login?next=/ventures");
          return;
        }

        const [summaryData, ventureData] = await Promise.all([
          fetchDashboardSummary(),
          fetchVentures()
        ]);

        if (cancelled) {
          return;
        }

        setSession(activeSession);
        setSummary(summaryData);
        setVentures(ventureData);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        const statusCode = getApiStatusCode(loadError);
        if (statusCode === 401) {
          router.replace("/login?next=/ventures");
          return;
        }

        setError(getApiErrorMessage(loadError));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogout() {
    setBusy(true);

    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  }

  if (loading) {
    return (
      <main className="page-shell">
        <article className="panel">
          <h1>Loading venture portfolio...</h1>
          <p>Syncing ventures for your current workspace.</p>
        </article>
      </main>
    );
  }

  if (!session || !summary) {
    return (
      <main className="page-shell">
        <article className="panel">
          <h1>Session required</h1>
          <p>Please sign in to view venture portfolio data.</p>
          <a href="/login" className="btn btn-primary">
            Go To Login
          </a>
        </article>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <h1>Venture Portfolio</h1>
          <p>Scaled opportunities tracked as active portfolio ventures.</p>
          <p className="topbar-meta">
            Workspace: <strong>{session.workspace.name}</strong>
          </p>
        </div>
        <div className="topbar-actions">
          <a href="/workspace" className="btn btn-ghost">
            Back To Workspace
          </a>
          <button type="button" className="btn btn-ghost" onClick={handleLogout} disabled={busy}>
            Log Out
          </button>
        </div>
      </header>

      {error ? <p className="status-line error">{error}</p> : null}

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
