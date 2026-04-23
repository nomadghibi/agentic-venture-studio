import type { FastifyReply, FastifyRequest } from "fastify";
import { IngestSignalRequestSchema } from "@avs/types";
import {
  SignalScopeError,
  createSignal,
  listSignalsForOpportunity
} from "../services/signal-service.js";
import { z } from "zod";

type PostgresError = Error & { code?: string };

function isForeignKeyViolation(error: unknown): error is PostgresError {
  return typeof error === "object" && error !== null && "code" in error && (error as PostgresError).code === "23503";
}

const OpportunityIdParamsSchema = z.object({
  id: z.string().uuid()
});

export async function ingestSignal(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const payload = IngestSignalRequestSchema.parse(request.body);

  try {
    const { signal, link } = await createSignal(payload, request.auth.workspaceId);
    return reply.code(202).send({
      data: {
        ...signal,
        queued: true,
        ...(link ? { link } : {})
      }
    });
  } catch (error) {
    if (error instanceof SignalScopeError) {
      return reply.code(404).send({
        error: {
          code: "opportunity_not_found",
          message: error.message
        }
      });
    }

    if (isForeignKeyViolation(error)) {
      return reply.code(404).send({
        error: {
          code: "opportunity_not_found",
          message: "Cannot attach signal to unknown opportunity"
        }
      });
    }

    throw error;
  }
}

export async function listOpportunitySignals(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const params = OpportunityIdParamsSchema.parse(request.params);
  try {
    const data = await listSignalsForOpportunity(params.id, request.auth.workspaceId);
    return reply.send({ data });
  } catch (error) {
    if (error instanceof SignalScopeError) {
      return reply.code(404).send({
        error: {
          code: "opportunity_not_found",
          message: error.message
        }
      });
    }

    throw error;
  }
}
