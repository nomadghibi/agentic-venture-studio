"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthSession, DashboardSummary, Opportunity, Workspace } from "@avs/types";
import { DashboardSummary as DashboardSummaryCard } from "@/features/dashboard/DashboardSummary";
import { ApprovalQueuePreview } from "@/features/approvals/ApprovalQueuePreview";
import { WorkspaceMvpControl } from "@/features/workspace/WorkspaceMvpControl";
import {
  createWorkspace as createWorkspaceApi,
  fetchDashboardSummary,
  fetchOpportunities,
  fetchSession,
  fetchWorkspaceOptions,
  getApiErrorMessage,
  getApiStatusCode,
  logout,
  selectWorkspace
} from "@/services/api";

export default function WorkspacePage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>("");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === currentWorkspaceId) ?? null,
    [workspaces, currentWorkspaceId]
  );

  const loadWorkspaceData = useCallback(async () => {
    const [summaryData, opportunitiesData, workspaceData] = await Promise.all([
      fetchDashboardSummary(),
      fetchOpportunities(),
      fetchWorkspaceOptions()
    ]);

    setSummary(summaryData);
    setOpportunities(opportunitiesData);
    setWorkspaces(workspaceData.workspaces);
    setCurrentWorkspaceId(workspaceData.currentWorkspaceId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      setError("");

      try {
        const activeSession = await fetchSession();
        if (!activeSession) {
          router.replace("/login?next=/workspace");
          return;
        }

        if (cancelled) {
          return;
        }

        setSession(activeSession);
        await loadWorkspaceData();
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        const statusCode = getApiStatusCode(loadError);
        if (statusCode === 401) {
          router.replace("/login?next=/workspace");
          return;
        }

        setError(getApiErrorMessage(loadError));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [loadWorkspaceData, router]);

  async function handleSelectWorkspace(nextWorkspaceId: string) {
    if (!nextWorkspaceId || nextWorkspaceId === currentWorkspaceId) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const result = await selectWorkspace(nextWorkspaceId);
      setSession(result.session);
      setWorkspaces(result.workspaces);
      setCurrentWorkspaceId(result.currentWorkspaceId);
      await loadWorkspaceData();
    } catch (selectError) {
      const statusCode = getApiStatusCode(selectError);
      if (statusCode === 401) {
        router.replace("/login?next=/workspace");
        return;
      }

      setError(getApiErrorMessage(selectError));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = newWorkspaceName.trim();
    if (!trimmed) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const result = await createWorkspaceApi({ name: trimmed });
      setSession(result.session);
      setWorkspaces(result.workspaces);
      setCurrentWorkspaceId(result.currentWorkspaceId);
      setNewWorkspaceName("");
      await loadWorkspaceData();
    } catch (createError) {
      const statusCode = getApiStatusCode(createError);
      if (statusCode === 401) {
        router.replace("/login?next=/workspace");
        return;
      }

      setError(getApiErrorMessage(createError));
    } finally {
      setBusy(false);
    }
  }

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
          <h1>Loading workspace...</h1>
          <p>Preparing your venture validation environment.</p>
        </article>
      </main>
    );
  }

  if (!session || !summary) {
    return (
      <main className="page-shell">
        <article className="panel">
          <h1>Session required</h1>
          <p>Please sign in to continue.</p>
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
          <h1>Agentic Venture Studio Workspace</h1>
          <p>Discovery to decision workflow console</p>
          <p className="topbar-meta">
            Signed in as <strong>{session.user.name}</strong> ({session.user.email})
          </p>
        </div>
        <div className="topbar-actions">
          <label className="workspace-select-wrap">
            <span>Workspace</span>
            <select
              className="select workspace-select"
              value={currentWorkspaceId}
              onChange={(event) => {
                void handleSelectWorkspace(event.target.value);
              }}
              disabled={busy}
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </label>

          <form className="workspace-create" onSubmit={handleCreateWorkspace}>
            <input
              className="input"
              placeholder="New workspace name"
              value={newWorkspaceName}
              onChange={(event) => setNewWorkspaceName(event.target.value)}
              disabled={busy}
            />
            <button type="submit" className="btn btn-ghost" disabled={busy || !newWorkspaceName.trim()}>
              Create
            </button>
          </form>

          <a href="/ventures" className="btn btn-ghost">
            View Venture Portfolio
          </a>
          <button type="button" className="btn btn-ghost" onClick={handleLogout} disabled={busy}>
            Log Out
          </button>
        </div>
      </header>

      {selectedWorkspace ? (
        <article className="panel workspace-banner">
          <h2>{selectedWorkspace.name}</h2>
          <p>
            Active workspace slug: <code>{selectedWorkspace.slug}</code>
          </p>
        </article>
      ) : null}

      {error ? <p className="status-line error">{error}</p> : null}

      <section className="grid-2">
        <DashboardSummaryCard summary={summary} />
        <ApprovalQueuePreview awaitingApprovals={summary.awaitingApprovals} />
      </section>

      <WorkspaceMvpControl
        key={currentWorkspaceId}
        initialOpportunities={opportunities}
      />
    </main>
  );
}
