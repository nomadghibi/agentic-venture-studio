import type { FastifyInstance } from "fastify";
import { getVenture, listVentures } from "../controllers/venture-controller.js";
import { requireAuth } from "../middleware/auth.js";

export async function registerVentureRoutes(app: FastifyInstance) {
  app.get("/ventures", { preHandler: [requireAuth] }, listVentures);
  app.get("/ventures/:id", { preHandler: [requireAuth] }, getVenture);
}
