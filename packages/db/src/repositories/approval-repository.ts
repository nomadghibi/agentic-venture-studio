import type { Approval, ApprovalReviewInput } from "@avs/types";
import { db } from "../client.js";

type ApprovalRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  approval_type: string;
  status: Approval["status"];
  requested_by: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  requested_at: string;
  reviewed_at: string | null;
};

function mapApproval(row: ApprovalRow): Approval {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    approvalType: row.approval_type,
    status: row.status,
    ...(row.requested_by ? { requestedBy: row.requested_by } : {}),
    ...(row.reviewed_by ? { reviewedBy: row.reviewed_by } : {}),
    ...(row.review_notes ? { reviewNotes: row.review_notes } : {}),
    requestedAt: row.requested_at,
    ...(row.reviewed_at ? { reviewedAt: row.reviewed_at } : {})
  };
}

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

  const row = result.rows[0];
  return row?.id ?? null;
}

export async function listApprovalsForOpportunity(opportunityId: string): Promise<Approval[]> {
  const result = await db.query<ApprovalRow>(
    `
      SELECT
        id,
        entity_type,
        entity_id,
        approval_type,
        status,
        requested_by,
        reviewed_by,
        review_notes,
        requested_at::text AS requested_at,
        reviewed_at::text AS reviewed_at
      FROM approvals
      WHERE entity_type = 'opportunity' AND entity_id = $1
      ORDER BY requested_at DESC
    `,
    [opportunityId]
  );

  return result.rows.map((row) => mapApproval(row));
}

export async function countPendingApprovalsForOpportunity(opportunityId: string): Promise<number> {
  const result = await db.query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM approvals
      WHERE entity_type = 'opportunity' AND entity_id = $1 AND status = 'pending'
    `,
    [opportunityId]
  );

  const row = result.rows[0];
  return Number(row?.count ?? 0);
}

export async function createApprovalRequest(input: {
  opportunityId: string;
  approvalType: string;
  requestedBy?: string;
}): Promise<string> {
  const existing = await db.query<{ id: string }>(
    `
      SELECT id
      FROM approvals
      WHERE
        entity_type = 'opportunity'
        AND entity_id = $1
        AND approval_type = $2
        AND status = 'pending'
      LIMIT 1
    `,
    [input.opportunityId, input.approvalType]
  );

  const existingId = existing.rows[0]?.id;
  if (existingId) {
    return existingId;
  }

  const id = crypto.randomUUID();
  const requestedBy = await resolveExistingUserId(input.requestedBy);

  await db.query(
    `
      INSERT INTO approvals (
        id,
        entity_type,
        entity_id,
        approval_type,
        status,
        requested_by
      )
      VALUES ($1, 'opportunity', $2, $3, 'pending', $4)
    `,
    [id, input.opportunityId, input.approvalType, requestedBy]
  );

  return id;
}

export async function reviewApproval(
  approvalId: string,
  input: ApprovalReviewInput,
  reviewedBy?: string
): Promise<Approval | null> {
  const reviewerId = await resolveExistingUserId(reviewedBy);
  const result = await db.query<ApprovalRow>(
    `
      UPDATE approvals
      SET
        status = $2,
        reviewed_by = $3,
        review_notes = $4,
        reviewed_at = NOW()
      WHERE id = $1 AND status = 'pending'
      RETURNING
        id,
        entity_type,
        entity_id,
        approval_type,
        status,
        requested_by,
        reviewed_by,
        review_notes,
        requested_at::text AS requested_at,
        reviewed_at::text AS reviewed_at
    `,
    [approvalId, input.status, reviewerId, input.reviewNotes ?? null]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return mapApproval(row);
}

export async function getApprovalById(approvalId: string): Promise<Approval | null> {
  const result = await db.query<ApprovalRow>(
    `
      SELECT
        id,
        entity_type,
        entity_id,
        approval_type,
        status,
        requested_by,
        reviewed_by,
        review_notes,
        requested_at::text AS requested_at,
        reviewed_at::text AS reviewed_at
      FROM approvals
      WHERE id = $1
      LIMIT 1
    `,
    [approvalId]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return mapApproval(row);
}
