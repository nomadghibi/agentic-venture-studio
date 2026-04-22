import { z } from "zod";

export const ApprovalStatusValues = ["pending", "approved", "rejected"] as const;

export const ApprovalSchema = z.object({
  id: z.string().uuid(),
  entityType: z.string().min(1),
  entityId: z.string().uuid(),
  approvalType: z.string().min(1),
  status: z.enum(ApprovalStatusValues),
  requestedBy: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewNotes: z.string().optional(),
  requestedAt: z.string(),
  reviewedAt: z.string().optional()
});

export const ApprovalReviewInputSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNotes: z.string().max(1000).optional()
});

export type Approval = z.infer<typeof ApprovalSchema>;
export type ApprovalReviewInput = z.infer<typeof ApprovalReviewInputSchema>;
