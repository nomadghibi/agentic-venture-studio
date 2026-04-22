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
  name: string;
  ownerId?: string;
  stage?: string;
  tagline?: string;
  businessModel?: string;
  targetMarket?: string;
};

export async function ensureVentureForOpportunity(input: VentureInsert): Promise<string> {
  const ownerId = await resolveExistingUserId(input.ownerId);
  const result = await db.query<{ id: string }>(
    `
      INSERT INTO ventures (
        id,
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
        $8
      )
      ON CONFLICT (opportunity_id)
      DO UPDATE SET
        stage = EXCLUDED.stage,
        owner_id = COALESCE(EXCLUDED.owner_id, ventures.owner_id),
        updated_at = NOW()
      RETURNING id
    `,
    [
      crypto.randomUUID(),
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
