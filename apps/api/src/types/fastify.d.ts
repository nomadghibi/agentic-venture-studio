import type { AuthUser } from "@avs/types";

declare module "fastify" {
  interface FastifyRequest {
    auth: AuthUser;
  }
}
