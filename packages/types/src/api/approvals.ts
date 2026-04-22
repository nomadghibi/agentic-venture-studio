import { z } from "zod";
import { ApprovalReviewInputSchema, ApprovalSchema } from "../entities/approval.js";

export const ReviewApprovalRequestSchema = ApprovalReviewInputSchema;

export const ReviewApprovalResponseSchema = z.object({
  data: ApprovalSchema
});

export const ListOpportunityApprovalsResponseSchema = z.object({
  data: z.array(ApprovalSchema)
});
