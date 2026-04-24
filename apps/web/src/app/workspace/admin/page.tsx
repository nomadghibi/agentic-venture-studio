"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchWorkspaceMembers,
  updateMemberRole,
  getApiErrorMessage,
  type WorkspaceMember
} from "@/services/api";

const ALL_ROLES = [
  "founder",
  "product_lead",
  "research_reviewer",
  "technical_architect",
  "growth_lead",
  "finance_reviewer",
  "builder",
  "admin",
  "viewer"
] as const;

export default function AdminPage() {
  const router = useRouter();
  const { session, loading } = useAuth("/workspace/admin");

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    if (session.user.role !== "admin") {
      router.replace("/workspace");
      return;
    }
    let cancelled = false;
    async function load() {
      setDataLoading(true);
      try {
        const data = await fetchWorkspaceMembers();
        if (!cancelled) setMembers(data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err));
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [session, router]);

  async function handleRoleChange(userId: string, newRole: string) {
    setBusy(userId);
    setFeedback("");
    setError("");
    try {
      await updateMemberRole(userId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m))
      );
      setFeedback("Role updated.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  if (loading || dataLoading) {
    return (
      <main className="page-shell">
        <article className="panel"><p>Loading team members…</p></article>
      </main>
    );
  }

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <h1>Team & Roles</h1>
          <p className="topbar-meta">Workspace: <strong>{session.workspace.name}</strong></p>
        </div>
        <div className="topbar-actions">
          <Link href="/workspace" className="btn btn-ghost">← Workspace</Link>
        </div>
      </header>

      {feedback ? <p className="status-line success">{feedback}</p> : null}
      {error ? <p className="status-line error">{error}</p> : null}

      <article className="panel">
        <h2>Members ({members.length})</h2>
        <table className="table" aria-label="Team members">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td><strong>{m.name}</strong></td>
                <td>{m.email}</td>
                <td>
                  <span className="badge">{m.role}</span>
                </td>
                <td>
                  {m.id === session.user.id ? (
                    <span className="muted">You</span>
                  ) : (
                    <select
                      className="select"
                      value={m.role}
                      disabled={busy === m.id}
                      onChange={(e) => void handleRoleChange(m.id, e.target.value)}
                      style={{ fontSize: "0.85rem" }}
                    >
                      {ALL_ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <article className="panel">
        <h2>Invite new members</h2>
        <p>
          Share your beta invite code with collaborators. They use it on the registration form to join this workspace.
          Set <code>BETA_INVITE_CODE</code> in your API environment to control access.
        </p>
      </article>
    </main>
  );
}
