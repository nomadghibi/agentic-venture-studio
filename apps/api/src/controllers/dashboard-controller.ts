import type { FastifyReply, FastifyRequest } from "fastify";
import { fetchDashboardSummary } from "../services/dashboard-service.js";

export async function getDashboardSummary(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const data = await fetchDashboardSummary(request.auth.workspaceId);
  return reply.send({ data });
}
