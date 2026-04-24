import type { UserRole } from "@avs/types";
import type { FastifyInstance } from "fastify";
import {
  createOpportunity,
  decideOpportunity,
  getOpportunity,
  getOpportunityTimeline,
  scoreOpportunity,
  transitionOpportunityStage,
  listOpportunities
} from "../controllers/opportunity-controller.js";
import { generatePrd, getPrd } from "../controllers/prd-controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const opportunityWriteRoles: UserRole[] = [
  "founder",
  "product_lead",
  "research_reviewer",
  "technical_architect",
  "admin"
];

const opportunityDecisionRoles: UserRole[] = [
  "founder",
  "finance_reviewer",
  "admin"
];

export async function registerOpportunityRoutes(app: FastifyInstance) {
  app.get("/opportunities", { preHandler: [requireAuth] }, listOpportunities);
  app.get("/opportunities/:id", { preHandler: [requireAuth] }, getOpportunity);
  app.get("/opportunities/:id/timeline", { preHandler: [requireAuth] }, getOpportunityTimeline);
  app.post(
    "/opportunities",
    { preHandler: [requireAuth, requireRole(opportunityWriteRoles)] },
    createOpportunity
  );
  app.patch(
    "/opportunities/:id/score",
    { preHandler: [requireAuth, requireRole(opportunityWriteRoles)] },
    scoreOpportunity
  );
  app.patch(
    "/opportunities/:id/stage",
    { preHandler: [requireAuth, requireRole(opportunityWriteRoles)] },
    transitionOpportunityStage
  );
  app.post(
    "/opportunities/:id/decision",
    { preHandler: [requireAuth, requireRole(opportunityDecisionRoles)] },
    decideOpportunity
  );
  app.post(
    "/opportunities/:id/prd",
    { preHandler: [requireAuth, requireRole(opportunityWriteRoles)] },
    generatePrd
  );
  app.get("/opportunities/:id/prd", { preHandler: [requireAuth] }, getPrd);
}
