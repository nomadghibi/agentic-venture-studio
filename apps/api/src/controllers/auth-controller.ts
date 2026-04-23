import type { FastifyReply, FastifyRequest } from "fastify";
import {
  AuthConflictError,
  AuthCredentialsError,
  loginFounder,
  logoutSession,
  readSession,
  registerFounder
} from "../services/auth-service.js";
import { AuthLoginInputSchema, AuthRegisterInputSchema } from "@avs/types";
import { clearSessionCookie, serializeSessionCookie } from "../utils/session-cookie.js";
import { env } from "../config/env.js";

const sessionMaxAgeSeconds = env.SESSION_TTL_DAYS * 24 * 60 * 60;

function publicSession<T extends { sessionToken: string }>(session: T) {
  const { sessionToken: _sessionToken, ...rest } = session;
  return rest;
}

function setSessionCookie(reply: FastifyReply, token: string) {
  reply.header(
    "set-cookie",
    serializeSessionCookie({
      cookieName: env.SESSION_COOKIE_NAME,
      token,
      maxAgeSeconds: sessionMaxAgeSeconds,
      secure: env.NODE_ENV === "production"
    })
  );
}

function clearCookie(reply: FastifyReply) {
  reply.header(
    "set-cookie",
    clearSessionCookie({
      cookieName: env.SESSION_COOKIE_NAME,
      secure: env.NODE_ENV === "production"
    })
  );
}

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const payload = AuthRegisterInputSchema.parse(request.body);

  try {
    const result = await registerFounder(payload, env.SESSION_TTL_DAYS);
    setSessionCookie(reply, result.token);
    return reply.code(201).send({ data: publicSession(result.session) });
  } catch (error) {
    if (error instanceof AuthConflictError) {
      return reply.code(409).send({
        error: {
          code: "email_conflict",
          message: error.message
        }
      });
    }

    throw error;
  }
}

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const payload = AuthLoginInputSchema.parse(request.body);

  try {
    const result = await loginFounder(payload, env.SESSION_TTL_DAYS);
    setSessionCookie(reply, result.token);
    return reply.send({ data: publicSession(result.session) });
  } catch (error) {
    if (error instanceof AuthCredentialsError) {
      return reply.code(401).send({
        error: {
          code: "invalid_credentials",
          message: error.message
        }
      });
    }

    throw error;
  }
}

export async function me(request: FastifyRequest, reply: FastifyReply) {
  const data = await readSession(request.auth.sessionToken);

  if (!data) {
    clearCookie(reply);
    return reply.code(401).send({
      error: {
        code: "session_not_found",
        message: "Session is no longer valid"
      }
    });
  }

  return reply.send({ data: publicSession(data) });
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  await logoutSession(request.auth.sessionToken);
  clearCookie(reply);

  return reply.send({
    data: {
      ok: true
    }
  });
}
