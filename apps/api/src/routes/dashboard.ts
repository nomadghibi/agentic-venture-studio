import type { FastifyInstance } from "fastify";
import { getDashboardSummary } from "../controllers/dashboard-controller.js";
import { requireAuth } from "../middleware/auth.js";

export async function registerDashboardRoutes(app: FastifyInstance) {
  app.get("/dashboard/summary", { preHandler: [requireAuth] }, getDashboardSummary);
}
