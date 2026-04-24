import type { Venture } from "@avs/types";
import { db } from "../client.js";

async function resolveExistingUserId(userId?: string): Promise<string | null> {
  if (!userId) {
    return null;
  }

  const result = await db.query<{ id: string }>(
    `
      SELECT id
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0]?.id ?? null;
}

type VentureInsert = {
  opportunityId: string;
  workspaceId: string;
  name: string;
  ownerId?: string;
  stage?: string;
  tagline?: string;
  businessModel?: string;
  targetMarket?: string;
};

type VentureRow = {
  id: string;
  opportunity_id: string;
  name: string;
  tagline: string | null;
  business_model: string | null;
  target_market: string | null;
  stage: string;
  owner_id: string | null;
  launch_date: string | null;
  status_reason: string | null;
  created_at: string;
  updated_at: string;
};

function mapVenture(row: VentureRow): Venture {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    name: row.name,
    ...(row.tagline != null ? { tagline: row.tagline } : {}),
    ...(row.business_model != null ? { businessModel: row.business_model } : {}),
    ...(row.target_market != null ? { targetMarket: row.target_market } : {}),
    stage: row.stage,
    ...(row.owner_id != null ? { ownerId: row.owner_id } : {}),
    ...(row.launch_date != null ? { launchDate: row.launch_date } : {}),
    ...(row.status_reason != null ? { statusReason: row.status_reason } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listVentures(
  workspaceId: string,
  limit = 50,
  offset = 0
): Promise<Venture[]> {
  const result = await db.query<VentureRow>(
    `
      SELECT
        id,
        opportunity_id,
        name,
        tagline,
        business_model,
        target_market,
        stage,
        owner_id,
        launch_date::text AS launch_date,
        status_reason,
        created_at::text AS created_at,
        updated_at::text AS updated_at
      FROM ventures
      WHERE workspace_id = $1
      ORDER BY updated_at DESC
      LIMIT $2 OFFSET $3
    `,
    [workspaceId, limit, offset]
  );

  return result.rows.map((row: VentureRow) => mapVenture(row));
}

export async function getVentureById(id: string, workspaceId: string): Promise<Venture | null> {
  const result = await db.query<VentureRow>(
    `
      SELECT
        id,
        opportunity_id,
        name,
        tagline,
        business_model,
        target_market,
        stage,
        owner_id,
        launch_date::text AS launch_date,
        status_reason,
        created_at::text AS created_at,
        updated_at::text AS updated_at
      FROM ventures
      WHERE id = $1 AND workspace_id = $2
      LIMIT 1
    `,
    [id, workspaceId]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return mapVenture(row);
}

export async function ensureVentureForOpportunity(input: VentureInsert): Promise<string> {
  const ownerId = await resolveExistingUserId(input.ownerId);
  const result = await db.query<{ id: string }>(
    `
      INSERT INTO ventures (
        id,
        workspace_id,
        opportunity_id,
        name,
        tagline,
        business_model,
        target_market,
        stage,
        owner_id
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9
      )
      ON CONFLICT (opportunity_id)
      DO UPDATE SET
        stage = EXCLUDED.stage,
        owner_id = COALESCE(EXCLUDED.owner_id, ventures.owner_id),
        workspace_id = EXCLUDED.workspace_id,
        updated_at = NOW()
      RETURNING id
    `,
    [
      crypto.randomUUID(),
      input.workspaceId,
      input.opportunityId,
      input.name,
      input.tagline ?? null,
      input.businessModel ?? null,
      input.targetMarket ?? null,
      input.stage ?? "design",
      ownerId
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to ensure venture record");
  }

  return row.id;
}
