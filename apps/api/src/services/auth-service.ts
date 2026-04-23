import type { AuthLoginInput, AuthRegisterInput } from "@avs/types";
import {
  createSession,
  createUser,
  createWorkspaceForUser,
  deleteSession,
  findUserByEmail,
  getDefaultWorkspaceForUser,
  getSessionByToken,
  hashPassword,
  listWorkspacesForUser,
  setDefaultWorkspaceForUser,
  verifyPassword
} from "@avs/db";

export class AuthConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthConflictError";
  }
}

export class AuthCredentialsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthCredentialsError";
  }
}

export async function registerFounder(input: AuthRegisterInput, sessionTtlDays: number) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AuthConflictError("An account with this email already exists");
  }

  const user = await createUser({
    name: input.name,
    email: input.email,
    role: "founder",
    passwordHash: hashPassword(input.password)
  });

  const workspace = await createWorkspaceForUser({
    userId: user.id,
    name: input.workspaceName ?? `${input.name}'s Workspace`
  });

  await setDefaultWorkspaceForUser(user.id, workspace.id);

  const createdSession = await createSession({
    userId: user.id,
    workspaceId: workspace.id,
    ttlDays: sessionTtlDays
  });

  const session = await getSessionByToken(createdSession.token);
  if (!session) {
    throw new Error("Failed to start session");
  }

  return {
    session,
    token: createdSession.token,
    expiresAt: createdSession.expiresAt
  };
}

export async function loginFounder(input: AuthLoginInput, sessionTtlDays: number) {
  const existing = await findUserByEmail(input.email);
  if (!existing || !existing.passwordHash) {
    throw new AuthCredentialsError("Email or password is incorrect");
  }

  const passwordValid = verifyPassword(input.password, existing.passwordHash);
  if (!passwordValid) {
    throw new AuthCredentialsError("Email or password is incorrect");
  }

  let workspace = await getDefaultWorkspaceForUser(existing.user.id);

  if (!workspace) {
    const workspaces = await listWorkspacesForUser(existing.user.id);
    workspace = workspaces[0] ?? null;
  }

  if (!workspace) {
    workspace = await createWorkspaceForUser({
      userId: existing.user.id,
      name: `${existing.user.name}'s Workspace`
    });
  }

  await setDefaultWorkspaceForUser(existing.user.id, workspace.id);

  const createdSession = await createSession({
    userId: existing.user.id,
    workspaceId: workspace.id,
    ttlDays: sessionTtlDays
  });

  const session = await getSessionByToken(createdSession.token);
  if (!session) {
    throw new Error("Failed to start session");
  }

  return {
    session,
    token: createdSession.token,
    expiresAt: createdSession.expiresAt
  };
}

export async function readSession(token: string) {
  return getSessionByToken(token);
}

export async function logoutSession(token: string): Promise<void> {
  await deleteSession(token);
}
