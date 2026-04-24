import type { FastifyReply, FastifyRequest } from "fastify";
import { getVenture as getVentureRecord, listVentures as listVentureRecords } from "../services/venture-service.js";
import { z } from "zod";

const VentureIdParamsSchema = z.object({
  id: z.string().uuid()
});

const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0)
});

export async function listVentures(request: FastifyRequest, reply: FastifyReply) {
  const { limit, offset } = PaginationQuerySchema.parse(request.query);
  const data = await listVentureRecords(request.auth.workspaceId, limit, offset);
  return reply.send({ data });
}

export async function getVenture(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const params = VentureIdParamsSchema.parse(request.params);
  const data = await getVentureRecord(params.id, request.auth.workspaceId);

  if (!data) {
    return reply.code(404).send({
      error: {
        code: "not_found",
        message: "Venture not found"
      }
    });
  }

  return reply.send({ data });
}
