import type { Approval, ApprovalReviewInput } from "@avs/types";
import {
  getApprovalById,
  getOpportunityById,
  listApprovalsForOpportunity as listApprovalsForOpportunityRecords,
  reviewApproval as reviewApprovalRecord
} from "@avs/db";

export class ApprovalReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApprovalReviewError";
  }
}

export async function listApprovalsForOpportunity(
  opportunityId: string,
  workspaceId: string
): Promise<Approval[] | null> {
  const existing = await getOpportunityById(opportunityId, workspaceId);
  if (!existing) {
    return null;
  }

  return listApprovalsForOpportunityRecords(opportunityId, workspaceId);
}

export async function reviewApproval(
  approvalId: string,
  input: ApprovalReviewInput,
  workspaceId: string,
  reviewerId?: string
): Promise<Approval | null> {
  const existing = await getApprovalById(approvalId, workspaceId);
  if (!existing) {
    return null;
  }

  if (existing.status !== "pending") {
    throw new ApprovalReviewError("Only pending approvals can be reviewed");
  }

  return reviewApprovalRecord(approvalId, input, workspaceId, reviewerId);
}
