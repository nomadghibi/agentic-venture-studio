import cors from "@fastify/cors";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { registerRoutes } from "./routes/index.js";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: env.WEB_URL,
    credentials: true
  });

  app.register(registerRoutes, { prefix: "/api/v1" });

  return app;
}
