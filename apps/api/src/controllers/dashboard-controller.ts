import type { FastifyReply, FastifyRequest } from "fastify";
import { fetchDashboardSummary } from "../services/dashboard-service.js";

export async function getDashboardSummary(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const data = await fetchDashboardSummary();
  return reply.send({ data });
}
