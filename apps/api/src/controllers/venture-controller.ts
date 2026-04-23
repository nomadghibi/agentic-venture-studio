import type { FastifyReply, FastifyRequest } from "fastify";
import { getVenture as getVentureRecord, listVentures as listVentureRecords } from "../services/venture-service.js";
import { z } from "zod";

const VentureIdParamsSchema = z.object({
  id: z.string().uuid()
});

export async function listVentures(request: FastifyRequest, reply: FastifyReply) {
  const data = await listVentureRecords(request.auth.workspaceId);
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
