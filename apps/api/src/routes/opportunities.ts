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
import {
  generatePrd, getPrd,
  generateArchitecture, getArchitecture,
  generateMonetization, getMonetization,
  generateFeasibility, getFeasibility,
  generateMvpRoadmap, getMvpRoadmap,
  generateBuildPlan, getBuildPlan
} from "../controllers/prd-controller.js";
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
  app.post(
    "/opportunities/:id/architecture",
    { preHandler: [requireAuth, requireRole(opportunityWriteRoles)] },
    generateArchitecture
  );
  app.get("/opportunities/:id/architecture", { preHandler: [requireAuth] }, getArchitecture);
  app.post(
    "/opportunities/:id/monetization",
    { preHandler: [requireAuth, requireRole(opportunityWriteRoles)] },
    generateMonetization
  );
  app.get("/opportunities/:id/monetization", { preHandler: [requireAuth] }, getMonetization);
  app.post(
    "/opportunities/:id/feasibility",
    { preHandler: [requireAuth, requireRole(opportunityWriteRoles)] },
    generateFeasibility
  );
  app.get("/opportunities/:id/feasibility", { preHandler: [requireAuth] }, getFeasibility);
  app.post(
    "/opportunities/:id/mvp-roadmap",
    { preHandler: [requireAuth, requireRole(opportunityWriteRoles)] },
    generateMvpRoadmap
  );
  app.get("/opportunities/:id/mvp-roadmap", { preHandler: [requireAuth] }, getMvpRoadmap);
  app.post(
    "/opportunities/:id/build-plan",
    { preHandler: [requireAuth, requireRole(opportunityWriteRoles)] },
    generateBuildPlan
  );
  app.get("/opportunities/:id/build-plan", { preHandler: [requireAuth] }, getBuildPlan);
}
