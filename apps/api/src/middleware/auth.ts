import type { AuthUser, UserRole } from "@avs/types";
import type { FastifyReply, FastifyRequest } from "fastify";
import { UserRoleValues } from "@avs/types";
import { env } from "../config/env.js";

function parseRole(input: string | undefined): UserRole | null {
  if (!input) {
    return null;
  }

  return UserRoleValues.find((value) => value === input) ?? null;
}

function resolveAuthUser(request: FastifyRequest): AuthUser | null {
  const userIdHeader = request.headers["x-user-id"];
  const roleHeader = request.headers["x-user-role"];
  const emailHeader = request.headers["x-user-email"];

  const userId =
    typeof userIdHeader === "string" && userIdHeader.trim().length > 0
      ? userIdHeader
      : env.DEFAULT_USER_ID;

  const role = parseRole(
    typeof roleHeader === "string" && roleHeader.trim().length > 0
      ? roleHeader
      : env.DEFAULT_USER_ROLE
  );

  if (!role) {
    return null;
  }

  const email =
    typeof emailHeader === "string" && emailHeader.includes("@")
      ? emailHeader
      : env.DEFAULT_USER_EMAIL;

  return {
    id: userId,
    role,
    email
  };
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const user = resolveAuthUser(request);

  if (!user) {
    return reply.code(401).send({
      error: {
        code: "unauthorized",
        message: "Authentication headers are invalid"
      }
    });
  }

  request.auth = user;
  return;
}

export function requireRole(allowedRoles: UserRole[]) {
  return async function roleGuard(request: FastifyRequest, reply: FastifyReply) {
    const role = request.auth?.role;

    if (!role || !allowedRoles.includes(role)) {
      return reply.code(403).send({
        error: {
          code: "forbidden",
          message: "You do not have permission to perform this action"
        }
      });
    }

    return;
  };
}
