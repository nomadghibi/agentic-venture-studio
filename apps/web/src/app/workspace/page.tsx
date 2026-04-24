"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardSummary as DashboardSummaryCard } from "@/features/dashboard/DashboardSummary";
import { ApprovalQueuePreview } from "@/features/approvals/ApprovalQueuePreview";
import { WorkspaceMvpControl } from "@/features/workspace/WorkspaceMvpControl";
import { SignalsPanel } from "@/features/signals/SignalsPanel";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceData } from "@/hooks/useWorkspaceData";
import { logout } from "@/services/api";

export default function WorkspacePage() {
  const router = useRouter();
  const { session: authSession, loading } = useAuth("/workspace");

  const handleUnauthenticated = useCallback(() => {
    router.replace("/login?next=/workspace");
  }, [router]);

  const {
    session,
    workspaces,
    currentWorkspaceId,
    summary,
    opportunities,
    selectedWorkspace,
    busy,
    error,
    newWorkspaceName,
    setNewWorkspaceName,
    handleSelectWorkspace,
    handleCreateWorkspace
  } = useWorkspaceData(authSession, handleUnauthenticated);

  async function handleLogout() {
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
          <Link href="/login" className="btn btn-primary">
            Go To Login
          </Link>
        </article>
      </main>
    );
  }

  const canCreateWorkspace =
    session.user.role === "founder" || session.user.role === "admin";

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <h1>Agentic Venture Studio Workspace</h1>
          <p>Discovery to decision workflow console</p>
          <p className="topbar-meta">
            Signed in as <strong>{session.user.name}</strong> ({session.user.email})
            {" — "}
            <span className="role-badge">{session.user.role}</span>
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

          {canCreateWorkspace ? (
            <form className="workspace-create" onSubmit={handleCreateWorkspace}>
              <input
                className="input"
                placeholder="New workspace name"
                value={newWorkspaceName}
                onChange={(event) => setNewWorkspaceName(event.target.value)}
                disabled={busy}
              />
              <button
                type="submit"
                className="btn btn-ghost"
                disabled={busy || !newWorkspaceName.trim()}
              >
                Create
              </button>
            </form>
          ) : null}

          <Link href="/ventures" className="btn btn-ghost">
            View Venture Portfolio
          </Link>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleLogout}
            disabled={busy}
          >
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
        userRole={session.user.role}
      />

      <SignalsPanel key={currentWorkspaceId} />
    </main>
  );
}
