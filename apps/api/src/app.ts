import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
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

  // CSRF: reject state-mutating requests that carry an unrecognised Origin header.
  // Requests with no Origin (curl, server-to-server) are allowed through.
  app.addHook("onRequest", async (request, reply) => {
    const method = request.method.toUpperCase();
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return;
    const origin = request.headers.origin;
    if (origin && !allowedOrigins.has(origin)) {
      return reply.code(403).send({
        error: { code: "csrf_rejected", message: "Cross-origin request blocked" }
      });
    }
  });

  app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: "1 minute",
    errorResponseBuilder(_request, context) {
      return {
        error: {
          code: "rate_limit_exceeded",
          message: `Too many requests. Please wait ${Math.ceil(context.ttl / 1000)} seconds before retrying.`
        }
      };
    }
  });

  app.register(registerRoutes, { prefix: "/api/v1" });

  return app;
}
