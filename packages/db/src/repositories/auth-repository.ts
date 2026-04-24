import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { AuthSession, UserProfile, Workspace } from "@avs/types";
import { db } from "../client.js";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: UserProfile["role"];
  password_hash: string | null;
  default_workspace_id: string | null;
};

type SessionRow = {
  token_hash: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: UserProfile["role"];
  workspace_id: string;
  workspace_name: string;
  workspace_slug: string;
  workspace_role: string;
  workspace_created_at: string;
  workspace_updated_at: string;
};

type SessionInsert = {
  userId: string;
  workspaceId: string;
  ttlDays: number;
};

export type UserWithPassword = {
  user: UserProfile;
  passwordHash: string | null;
  defaultWorkspaceId: string | null;
};

export type AuthSessionRecord = AuthSession & {
  sessionToken: string;
};

function hashSessionToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function mapUserRow(row: UserRow): UserWithPassword {
  return {
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role
    },
    passwordHash: row.password_hash,
    defaultWorkspaceId: row.default_workspace_id
  };
}

function mapSessionRow(row: SessionRow, rawToken: string): AuthSessionRecord {
  const workspace: Workspace = {
    id: row.workspace_id,
    name: row.workspace_name,
    slug: row.workspace_slug,
    role: row.workspace_role,
    createdAt: row.workspace_created_at,
    updatedAt: row.workspace_updated_at
  };

  return {
    sessionToken: rawToken,
    user: {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      role: row.user_role
    },
    workspace
  };
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, hashValue: string): boolean {
  const [salt, expectedHash] = hashValue.split(":");

  if (!salt || !expectedHash) {
    return false;
  }

  const expected = Buffer.from(expectedHash, "hex");
  const derived = scryptSync(password, salt, expected.length);

  if (expected.length !== derived.length) {
    return false;
  }

  return timingSafeEqual(expected, derived);
}

export async function findUserByEmail(email: string): Promise<UserWithPassword | null> {
  const result = await db.query<UserRow>(
    `
      SELECT
        id,
        name,
        email,
        role,
        password_hash,
        default_workspace_id
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return mapUserRow(row);
}

export async function createUser(input: {
  name: string;
  email: string;
  role?: UserProfile["role"];
  passwordHash: string;
}): Promise<UserProfile> {
  const userId = crypto.randomUUID();

  const result = await db.query<UserRow>(
    `
      INSERT INTO users (
        id,
        name,
        email,
        role,
        status,
        password_hash
      )
      VALUES ($1, $2, $3, $4, 'active', $5)
      RETURNING
        id,
        name,
        email,
        role,
        password_hash,
        default_workspace_id
    `,
    [userId, input.name.trim(), input.email.trim().toLowerCase(), input.role ?? "founder", input.passwordHash]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to create user");
  }

  return mapUserRow(row).user;
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  await db.query(
    `UPDATE users SET password_hash = $2 WHERE id = $1`,
    [userId, passwordHash]
  );
}

export async function updateUserRole(
  userId: string,
  role: UserProfile["role"],
  workspaceId: string
): Promise<boolean> {
  const result = await db.query(
    `
      UPDATE users SET role = $2, updated_at = NOW()
      WHERE id = $1
        AND EXISTS (
          SELECT 1 FROM workspace_memberships
          WHERE user_id = $1 AND workspace_id = $3
        )
    `,
    [userId, role, workspaceId]
  );
  return Number(result.rowCount ?? 0) > 0;
}

type WorkspaceMemberRow = {
  id: string;
  name: string;
  email: string;
  role: UserProfile["role"];
  workspace_role: string;
};

export type WorkspaceMember = UserProfile & { workspaceRole: string };

export async function listUsersInWorkspace(workspaceId: string): Promise<WorkspaceMember[]> {
  const result = await db.query<WorkspaceMemberRow>(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        wm.role AS workspace_role
      FROM workspace_memberships wm
      JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = $1
      ORDER BY wm.created_at ASC
    `,
    [workspaceId]
  );

  return result.rows.map((row: WorkspaceMemberRow) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    workspaceRole: row.workspace_role
  }));
}

export async function createSession(input: SessionInsert): Promise<{ token: string; expiresAt: string }> {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + input.ttlDays * 24 * 60 * 60 * 1000);

  await db.query(
    `
      INSERT INTO user_sessions (token_hash, user_id, workspace_id, expires_at)
      VALUES ($1, $2, $3, $4)
    `,
    [tokenHash, input.userId, input.workspaceId, expiresAt.toISOString()]
  );

  return { token: rawToken, expiresAt: expiresAt.toISOString() };
}

export async function deleteSession(rawToken: string): Promise<void> {
  await db.query(
    `DELETE FROM user_sessions WHERE token_hash = $1`,
    [hashSessionToken(rawToken)]
  );
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  await db.query(`DELETE FROM user_sessions WHERE user_id = $1`, [userId]);
}

export async function updateSessionWorkspace(input: {
  token: string;
  userId: string;
  workspaceId: string;
}): Promise<boolean> {
  const result = await db.query(
    `
      UPDATE user_sessions us
      SET workspace_id = $3
      FROM workspace_memberships wm
      WHERE
        us.token_hash = $1
        AND us.user_id = $2
        AND wm.workspace_id = $3
        AND wm.user_id = $2
    `,
    [hashSessionToken(input.token), input.userId, input.workspaceId]
  );

  return Number(result.rowCount ?? 0) > 0;
}

export async function getSessionByToken(rawToken: string): Promise<AuthSessionRecord | null> {
  const result = await db.query<SessionRow>(
    `
      SELECT
        us.token_hash,
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email,
        u.role AS user_role,
        w.id AS workspace_id,
        w.name AS workspace_name,
        w.slug AS workspace_slug,
        wm.role AS workspace_role,
        w.created_at::text AS workspace_created_at,
        w.updated_at::text AS workspace_updated_at
      FROM user_sessions us
      JOIN users u ON u.id = us.user_id
      JOIN workspace_memberships wm ON wm.workspace_id = us.workspace_id AND wm.user_id = u.id
      JOIN workspaces w ON w.id = us.workspace_id
      WHERE
        us.token_hash = $1
        AND us.expires_at > NOW()
        AND u.status = 'active'
      LIMIT 1
    `,
    [hashSessionToken(rawToken)]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return mapSessionRow(row, rawToken);
}
