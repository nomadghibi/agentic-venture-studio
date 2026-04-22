import type { FastifyReply, FastifyRequest } from "fastify";
import { ReviewApprovalRequestSchema } from "@avs/types";
import {
  ApprovalReviewError,
  listApprovalsForOpportunity as listApprovalsForOpportunityRecord,
  reviewApproval as reviewApprovalRecord
} from "../services/approval-service.js";
import { z } from "zod";

const OpportunityIdParamsSchema = z.object({
  id: z.string().uuid()
});

const ApprovalIdParamsSchema = z.object({
  id: z.string().uuid()
});

export async function listOpportunityApprovals(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const params = OpportunityIdParamsSchema.parse(request.params);
  const data = await listApprovalsForOpportunityRecord(params.id);

  if (!data) {
    return reply.code(404).send({
      error: {
        code: "not_found",
        message: "Opportunity not found"
      }
    });
  }

  return reply.send({ data });
}

export async function reviewApproval(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const params = ApprovalIdParamsSchema.parse(request.params);
  const payload = ReviewApprovalRequestSchema.parse(request.body);

  try {
    const data = await reviewApprovalRecord(params.id, payload, request.auth?.id);
    if (!data) {
      return reply.code(404).send({
        error: {
          code: "not_found",
          message: "Approval not found"
        }
      });
    }

    return reply.send({ data });
  } catch (error) {
    if (error instanceof ApprovalReviewError) {
      return reply.code(409).send({
        error: {
          code: "invalid_approval_review",
          message: error.message
        }
      });
    }

    throw error;
  }
}
