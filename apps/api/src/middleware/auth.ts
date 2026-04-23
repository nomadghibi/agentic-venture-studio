import type { AuthUser, UserRole } from "@avs/types";
import type { FastifyReply, FastifyRequest } from "fastify";
import { UserRoleValues } from "@avs/types";
import { getSessionByToken } from "@avs/db";
import { env } from "../config/env.js";
import { parseCookieHeader } from "../utils/session-cookie.js";

function parseRole(input: string | undefined): UserRole | null {
  if (!input) {
    return null;
  }

  return UserRoleValues.find((value) => value === input) ?? null;
}

function resolveSessionToken(request: FastifyRequest): string | null {
  const authorizationHeader = request.headers.authorization;
  if (typeof authorizationHeader === "string") {
    const [scheme, token] = authorizationHeader.split(" ");
    if (scheme?.toLowerCase() === "bearer" && token) {
      return token;
    }
  }

  const sessionHeader = request.headers["x-session-token"];
  if (typeof sessionHeader === "string" && sessionHeader.trim().length > 0) {
    return sessionHeader.trim();
  }

  const cookies = parseCookieHeader(request.headers.cookie);
  const cookieToken = cookies[env.SESSION_COOKIE_NAME];

  if (typeof cookieToken === "string" && cookieToken.trim().length > 0) {
    return cookieToken.trim();
  }

  return null;
}

async function resolveAuthUser(request: FastifyRequest): Promise<AuthUser | null> {
  const sessionToken = resolveSessionToken(request);

  if (!sessionToken) {
    return null;
  }

  const session = await getSessionByToken(sessionToken);
  if (!session) {
    return null;
  }

  const role = parseRole(session.user.role);
  if (!role) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    role,
    email: session.user.email,
    workspaceId: session.workspace.id,
    sessionToken
  };
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const user = await resolveAuthUser(request);

  if (!user) {
    return reply.code(401).send({
      error: {
        code: "unauthorized",
        message: "Authentication required"
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
