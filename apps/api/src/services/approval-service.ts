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
  opportunityId: string
): Promise<Approval[] | null> {
  const existing = await getOpportunityById(opportunityId);
  if (!existing) {
    return null;
  }

  return listApprovalsForOpportunityRecords(opportunityId);
}

export async function reviewApproval(
  approvalId: string,
  input: ApprovalReviewInput,
  reviewerId?: string
): Promise<Approval | null> {
  const existing = await getApprovalById(approvalId);
  if (!existing) {
    return null;
  }

  if (existing.status !== "pending") {
    throw new ApprovalReviewError("Only pending approvals can be reviewed");
  }

  return reviewApprovalRecord(approvalId, input, reviewerId);
}
