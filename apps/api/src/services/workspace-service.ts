import {
  createWorkspaceForUser,
  getSessionByToken,
  getWorkspaceForUser,
  listWorkspacesForUser,
  setDefaultWorkspaceForUser,
  updateSessionWorkspace
} from "@avs/db";

export class WorkspaceAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkspaceAccessError";
  }
}

export async function listWorkspaces(userId: string) {
  return listWorkspacesForUser(userId);
}

export async function createWorkspaceAndSelect(
  userId: string,
  workspaceName: string,
  sessionToken: string
) {
  const workspace = await createWorkspaceForUser({
    userId,
    name: workspaceName
  });

  const switched = await updateSessionWorkspace({
    token: sessionToken,
    userId,
    workspaceId: workspace.id
  });

  if (!switched) {
    throw new WorkspaceAccessError("Could not select workspace for this session");
  }

  await setDefaultWorkspaceForUser(userId, workspace.id);

  const session = await getSessionByToken(sessionToken);
  if (!session) {
    throw new WorkspaceAccessError("Session not found after workspace creation");
  }

  return session;
}

export async function selectWorkspace(
  userId: string,
  workspaceId: string,
  sessionToken: string
) {
  const workspace = await getWorkspaceForUser(userId, workspaceId);
  if (!workspace) {
    throw new WorkspaceAccessError("Workspace not found for this user");
  }

  const switched = await updateSessionWorkspace({
    token: sessionToken,
    userId,
    workspaceId: workspace.id
  });

  if (!switched) {
    throw new WorkspaceAccessError("Could not switch workspace for this session");
  }

  await setDefaultWorkspaceForUser(userId, workspace.id);

  const session = await getSessionByToken(sessionToken);
  if (!session) {
    throw new WorkspaceAccessError("Session not found after workspace switch");
  }

  return session;
}
