import { createHash, randomBytes } from "node:crypto";
import { db } from "../client.js";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function createPasswordResetToken(
  userId: string,
  ttlMinutes: number
): Promise<string> {
  // Invalidate any existing unused tokens so only one is valid at a time.
  await db.query(
    `UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`,
    [userId]
  );

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await db.query(
    `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3)`,
    [tokenHash, userId, expiresAt.toISOString()]
  );

  return rawToken;
}

export async function findPasswordResetToken(
  rawToken: string
): Promise<{ userId: string } | null> {
  const result = await db.query<{ user_id: string }>(
    `
      SELECT user_id FROM password_reset_tokens
      WHERE token_hash = $1 AND expires_at > NOW() AND used_at IS NULL
      LIMIT 1
    `,
    [hashToken(rawToken)]
  );

  const row = result.rows[0];
  return row ? { userId: row.user_id } : null;
}

export async function consumePasswordResetToken(rawToken: string): Promise<boolean> {
  const result = await db.query(
    `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE token_hash = $1 AND expires_at > NOW() AND used_at IS NULL
    `,
    [hashToken(rawToken)]
  );

  return Number(result.rowCount ?? 0) > 0;
}
