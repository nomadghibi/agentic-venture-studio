import cors from "@fastify/cors";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { registerRoutes } from "./routes/index.js";

function buildAllowedOrigins() {
  const origins = new Set<string>([env.WEB_URL]);

  try {
    const configured = new URL(env.WEB_URL);
    const port = configured.port || (configured.protocol === "https:" ? "443" : "80");
    origins.add(`${configured.protocol}//localhost:${port}`);
    origins.add(`${configured.protocol}//127.0.0.1:${port}`);
  } catch {
    // ignore malformed WEB_URL, base value still present in set
  }

  if (env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
    origins.add("http://localhost:3200");
    origins.add("http://127.0.0.1:3200");
  }

  return origins;
}

export function buildApp() {
  const app = Fastify({ logger: true });
  const allowedOrigins = buildAllowedOrigins();

  app.register(cors, {
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"), false);
    },
    credentials: true
  });

  app.register(registerRoutes, { prefix: "/api/v1" });

  return app;
}
