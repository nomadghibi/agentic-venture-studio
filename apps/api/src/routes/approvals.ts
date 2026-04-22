import type { UserRole } from "@avs/types";
import type { FastifyInstance } from "fastify";
import {
  listOpportunityApprovals,
  reviewApproval
} from "../controllers/approval-controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const approvalReviewRoles: UserRole[] = [
  "founder",
  "product_lead",
  "research_reviewer",
  "technical_architect",
  "finance_reviewer",
  "admin"
];

export async function registerApprovalRoutes(app: FastifyInstance) {
  app.get(
    "/opportunities/:id/approvals",
    { preHandler: [requireAuth] },
    listOpportunityApprovals
  );
  app.patch(
    "/approvals/:id/review",
    { preHandler: [requireAuth, requireRole(approvalReviewRoles)] },
    reviewApproval
  );
}
