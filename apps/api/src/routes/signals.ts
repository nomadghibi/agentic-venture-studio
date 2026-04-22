import type { UserRole } from "@avs/types";
import type { FastifyInstance } from "fastify";
import {
  ingestSignal,
  listOpportunitySignals
} from "../controllers/signal-controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const signalWriteRoles: UserRole[] = [
  "founder",
  "product_lead",
  "research_reviewer",
  "admin"
];

export async function registerSignalRoutes(app: FastifyInstance) {
  app.post(
    "/signals",
    { preHandler: [requireAuth, requireRole(signalWriteRoles)] },
    ingestSignal
  );
  app.get(
    "/opportunities/:id/signals",
    { preHandler: [requireAuth] },
    listOpportunitySignals
  );
}
