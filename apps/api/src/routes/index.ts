import type { FastifyInstance } from "fastify";
import { registerApprovalRoutes } from "./approvals.js";
import { registerDashboardRoutes } from "./dashboard.js";
import { registerHealthRoutes } from "./health.js";
import { registerOpportunityRoutes } from "./opportunities.js";
import { registerSignalRoutes } from "./signals.js";

export async function registerRoutes(app: FastifyInstance) {
  await registerHealthRoutes(app);
  await registerDashboardRoutes(app);
  await registerOpportunityRoutes(app);
  await registerApprovalRoutes(app);
  await registerSignalRoutes(app);
}
