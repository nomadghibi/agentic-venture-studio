import type { AuthLoginInput, AuthRegisterInput } from "@avs/types";
import {
  consumePasswordResetToken,
  createPasswordResetToken,
  createSession,
  createUser,
  createWorkspaceForUser,
  deleteAllUserSessions,
  deleteSession,
  findPasswordResetToken,
  findUserByEmail,
  getDefaultWorkspaceForUser,
  getSessionByToken,
  hashPassword,
  listWorkspacesForUser,
  setDefaultWorkspaceForUser,
  updateUserPassword,
  verifyPassword
} from "@avs/db";
import { sendPasswordResetEmail } from "../utils/email.js";

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

export async function forgotPassword(email: string, webUrl: string, ttlMinutes: number): Promise<void> {
  const existing = await findUserByEmail(email);

  // Always return without error — never reveal whether an email exists.
  if (!existing) {
    return;
  }

  const rawToken = await createPasswordResetToken(existing.user.id, ttlMinutes);
  const resetLink = `${webUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

  await sendPasswordResetEmail(email, resetLink);
}

export class ResetTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResetTokenError";
  }
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const found = await findPasswordResetToken(rawToken);

  if (!found) {
    throw new ResetTokenError("Reset link has expired or already been used");
  }

  const consumed = await consumePasswordResetToken(rawToken);
  if (!consumed) {
    throw new ResetTokenError("Reset link has expired or already been used");
  }

  await updateUserPassword(found.userId, hashPassword(newPassword));

  // Force re-login on all devices after a password change.
  await deleteAllUserSessions(found.userId);
}
