"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthSession, DashboardSummary, Opportunity, Workspace } from "@avs/types";
import {
  createWorkspace as createWorkspaceApi,
  fetchDashboardSummary,
  fetchOpportunities,
  fetchWorkspaceOptions,
  getApiErrorMessage,
  getApiStatusCode,
  selectWorkspace
} from "@/services/api";

type WorkspaceData = {
  session: AuthSession | null;
  workspaces: Workspace[];
  currentWorkspaceId: string;
  summary: DashboardSummary | null;
  opportunities: Opportunity[];
  selectedWorkspace: Workspace | null;
  busy: boolean;
  error: string;
  newWorkspaceName: string;
  setNewWorkspaceName: (name: string) => void;
  handleSelectWorkspace: (id: string) => Promise<void>;
  handleCreateWorkspace: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useWorkspaceData(
  session: AuthSession | null,
  onUnauthenticated: () => void
): WorkspaceData {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState("");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [sessionOverride, setSessionOverride] = useState<AuthSession | null>(null);

  const activeSession = sessionOverride ?? session;

  const selectedWorkspace = useMemo(
    () => workspaces.find((w) => w.id === currentWorkspaceId) ?? null,
    [workspaces, currentWorkspaceId]
  );

  const refresh = useCallback(async () => {
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
    if (!session) return;
    let cancelled = false;

    async function load() {
      try {
        await refresh();
      } catch (err) {
        if (cancelled) return;
        if (getApiStatusCode(err) === 401) {
          onUnauthenticated();
          return;
        }
        setError(getApiErrorMessage(err));
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [session, refresh, onUnauthenticated]);

  async function handleSelectWorkspace(nextId: string) {
    if (!nextId || nextId === currentWorkspaceId) return;
    setBusy(true);
    setError("");
    try {
      const result = await selectWorkspace(nextId);
      setSessionOverride(result.session);
      setWorkspaces(result.workspaces);
      setCurrentWorkspaceId(result.currentWorkspaceId);
      await refresh();
    } catch (err) {
      if (getApiStatusCode(err) === 401) { onUnauthenticated(); return; }
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = newWorkspaceName.trim();
    if (!trimmed) return;
    setBusy(true);
    setError("");
    try {
      const result = await createWorkspaceApi({ name: trimmed });
      setSessionOverride(result.session);
      setWorkspaces(result.workspaces);
      setCurrentWorkspaceId(result.currentWorkspaceId);
      setNewWorkspaceName("");
      await refresh();
    } catch (err) {
      if (getApiStatusCode(err) === 401) { onUnauthenticated(); return; }
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return {
    session: activeSession,
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
    handleCreateWorkspace,
    refresh
  };
}
