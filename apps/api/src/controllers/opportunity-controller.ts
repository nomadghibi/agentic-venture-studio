import type { FastifyReply, FastifyRequest } from "fastify";
import {
  CreateOpportunityDecisionRequestSchema,
  OpportunityCreateInputSchema,
  UpdateOpportunityScoresRequestSchema,
  UpdateOpportunityStageRequestSchema
} from "@avs/types";
import {
  createOpportunity as createOpportunityRecord,
  decideOpportunity as decideOpportunityRecord,
  getOpportunity as getOpportunityRecord,
  listOpportunityTimeline as listOpportunityTimelineRecords,
  listOpportunities as listOpportunityRecords,
  scoreOpportunity as scoreOpportunityRecord,
  DecisionError,
  StageTransitionError,
  transitionOpportunityStage as transitionOpportunityStageRecord
} from "../services/opportunity-service.js";
import { z } from "zod";

const OpportunityIdParamsSchema = z.object({
  id: z.string().uuid()
});

export async function listOpportunities(request: FastifyRequest, reply: FastifyReply) {
  const data = await listOpportunityRecords(request.auth.workspaceId);
  return reply.send({ data });
}

export async function getOpportunity(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const params = OpportunityIdParamsSchema.parse(request.params);
  const record = await getOpportunityRecord(params.id, request.auth.workspaceId);

  if (!record) {
    return reply.code(404).send({
      error: {
        code: "not_found",
        message: "Opportunity not found"
      }
    });
  }

  return reply.send({ data: record });
}

export async function createOpportunity(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const payload = OpportunityCreateInputSchema.parse(request.body);
  const data = await createOpportunityRecord(
    payload,
    request.auth.workspaceId,
    request.auth.id
  );
  return reply.code(201).send({ data });
}

export async function scoreOpportunity(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const params = OpportunityIdParamsSchema.parse(request.params);
  const payload = UpdateOpportunityScoresRequestSchema.parse(request.body);
  const data = await scoreOpportunityRecord(
    params.id,
    payload,
    request.auth.workspaceId,
    request.auth.id
  );

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

export async function transitionOpportunityStage(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const params = OpportunityIdParamsSchema.parse(request.params);
  const payload = UpdateOpportunityStageRequestSchema.parse(request.body);

  try {
    const data = await transitionOpportunityStageRecord(
      params.id,
      payload,
      request.auth.workspaceId,
      request.auth.id
    );

    if (!data) {
      return reply.code(404).send({
        error: {
          code: "not_found",
          message: "Opportunity not found"
        }
      });
    }

    return reply.send({ data });
  } catch (error) {
    if (error instanceof StageTransitionError) {
      return reply.code(409).send({
        error: {
          code: "invalid_stage_transition",
          message: error.message
        }
      });
    }

    throw error;
  }
}

export async function decideOpportunity(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const params = OpportunityIdParamsSchema.parse(request.params);
  const payload = CreateOpportunityDecisionRequestSchema.parse(request.body);
  try {
    const data = await decideOpportunityRecord(
      params.id,
      payload,
      request.auth.workspaceId,
      request.auth.id
    );

    if (!data) {
      return reply.code(404).send({
        error: {
          code: "not_found",
          message: "Opportunity not found"
        }
      });
    }

    return reply.send({ data });
  } catch (error) {
    if (error instanceof DecisionError) {
      return reply.code(409).send({
        error: {
          code: "invalid_decision",
          message: error.message
        }
      });
    }

    throw error;
  }
}

export async function getOpportunityTimeline(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const params = OpportunityIdParamsSchema.parse(request.params);
  const data = await listOpportunityTimelineRecords(params.id, request.auth.workspaceId);

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
