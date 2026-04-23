import type { Workspace } from "@avs/types";
import { db } from "../client.js";

const slugSuffixLength = 6;

type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  role: string;
  created_at: string;
  updated_at: string;
};

function slugify(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalized.length === 0) {
    return "workspace";
  }

  return normalized.slice(0, 60);
}

function randomSlugSuffix(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, slugSuffixLength);
}

function mapWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function findUniqueSlug(baseSlug: string): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${randomSlugSuffix()}`;
    const check = await db.query<{ id: string }>(
      `
        SELECT id
        FROM workspaces
        WHERE slug = $1
        LIMIT 1
      `,
      [candidate]
    );

    if (check.rowCount === 0) {
      return candidate;
    }
  }

  return `${baseSlug}-${randomSlugSuffix()}`;
}

export async function listWorkspacesForUser(userId: string): Promise<Workspace[]> {
  const result = await db.query<WorkspaceRow>(
    `
      SELECT
        w.id,
        w.name,
        w.slug,
        wm.role,
        w.created_at::text AS created_at,
        w.updated_at::text AS updated_at
      FROM workspace_memberships wm
      JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = $1
      ORDER BY w.updated_at DESC, w.created_at DESC
    `,
    [userId]
  );

  return result.rows.map((row) => mapWorkspace(row));
}

export async function getWorkspaceForUser(
  userId: string,
  workspaceId: string
): Promise<Workspace | null> {
  const result = await db.query<WorkspaceRow>(
    `
      SELECT
        w.id,
        w.name,
        w.slug,
        wm.role,
        w.created_at::text AS created_at,
        w.updated_at::text AS updated_at
      FROM workspace_memberships wm
      JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = $1 AND w.id = $2
      LIMIT 1
    `,
    [userId, workspaceId]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return mapWorkspace(row);
}

export async function createWorkspaceForUser(input: {
  userId: string;
  name: string;
}): Promise<Workspace> {
  const baseSlug = slugify(input.name);
  const slug = await findUniqueSlug(baseSlug);
  const workspaceId = crypto.randomUUID();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        INSERT INTO workspaces (id, name, slug, owner_user_id)
        VALUES ($1, $2, $3, $4)
      `,
      [workspaceId, input.name.trim(), slug, input.userId]
    );

    await client.query(
      `
        INSERT INTO workspace_memberships (id, workspace_id, user_id, role)
        VALUES ($1, $2, $3, 'owner')
        ON CONFLICT (workspace_id, user_id) DO NOTHING
      `,
      [crypto.randomUUID(), workspaceId, input.userId]
    );

    await client.query(
      `
        UPDATE users
        SET default_workspace_id = COALESCE(default_workspace_id, $2),
            updated_at = NOW()
        WHERE id = $1
      `,
      [input.userId, workspaceId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const workspace = await getWorkspaceForUser(input.userId, workspaceId);
  if (!workspace) {
    throw new Error("Failed to create workspace");
  }

  return workspace;
}

export async function setDefaultWorkspaceForUser(
  userId: string,
  workspaceId: string
): Promise<void> {
  await db.query(
    `
      UPDATE users
      SET default_workspace_id = $2,
          updated_at = NOW()
      WHERE id = $1
    `,
    [userId, workspaceId]
  );
}

export async function getDefaultWorkspaceForUser(userId: string): Promise<Workspace | null> {
  const result = await db.query<WorkspaceRow>(
    `
      SELECT
        w.id,
        w.name,
        w.slug,
        wm.role,
        w.created_at::text AS created_at,
        w.updated_at::text AS updated_at
      FROM users u
      JOIN workspaces w ON w.id = u.default_workspace_id
      JOIN workspace_memberships wm ON wm.workspace_id = w.id AND wm.user_id = u.id
      WHERE u.id = $1
      LIMIT 1
    `,
    [userId]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return mapWorkspace(row);
}
