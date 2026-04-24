import type { FastifyInstance } from "fastify";
import {
  forgotPasswordHandler,
  login,
  logout,
  me,
  register,
  resetPasswordHandler
} from "../controllers/auth-controller.js";
import { requireAuth } from "../middleware/auth.js";

const HOUR_MS = 60 * 60 * 1000;
const FIFTEEN_MIN_MS = 15 * 60 * 1000;

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post(
    "/auth/register",
    { config: { rateLimit: { max: 5, timeWindow: HOUR_MS } } },
    register
  );

  app.post(
    "/auth/login",
    { config: { rateLimit: { max: 10, timeWindow: FIFTEEN_MIN_MS } } },
    login
  );

  app.get("/auth/me", { preHandler: [requireAuth] }, me);

  app.post("/auth/logout", { preHandler: [requireAuth] }, logout);

  app.post(
    "/auth/forgot-password",
    { config: { rateLimit: { max: 5, timeWindow: HOUR_MS } } },
    forgotPasswordHandler
  );

  app.post(
    "/auth/reset-password",
    { config: { rateLimit: { max: 10, timeWindow: FIFTEEN_MIN_MS } } },
    resetPasswordHandler
  );
}
