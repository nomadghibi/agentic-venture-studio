import type { FastifyInstance } from "fastify";
import { login, logout, me, register } from "../controllers/auth-controller.js";
import { requireAuth } from "../middleware/auth.js";

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/auth/register", register);
  app.post("/auth/login", login);
  app.get("/auth/me", { preHandler: [requireAuth] }, me);
  app.post("/auth/logout", { preHandler: [requireAuth] }, logout);
}
