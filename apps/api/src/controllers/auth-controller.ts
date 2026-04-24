import type { FastifyReply, FastifyRequest } from "fastify";
import {
  AuthConflictError,
  AuthCredentialsError,
  AuthInviteCodeError,
  ResetTokenError,
  forgotPassword,
  loginFounder,
  logoutSession,
  readSession,
  registerFounder,
  resetPassword
} from "../services/auth-service.js";
import {
  AuthLoginInputSchema,
  AuthRegisterInputSchema,
  ForgotPasswordInputSchema,
  ResetPasswordInputSchema
} from "@avs/types";
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
    const result = await registerFounder(payload, env.SESSION_TTL_DAYS, env.BETA_INVITE_CODE);
    setSessionCookie(reply, result.token);
    return reply.code(201).send({ data: publicSession(result.session) });
  } catch (error) {
    if (error instanceof AuthInviteCodeError) {
      return reply.code(403).send({
        error: { code: "invalid_invite_code", message: error.message }
      });
    }

    if (error instanceof AuthConflictError) {
      return reply.code(409).send({
        error: { code: "email_conflict", message: error.message }
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

  return reply.send({ data: { ok: true } });
}

export async function forgotPasswordHandler(request: FastifyRequest, reply: FastifyReply) {
  const payload = ForgotPasswordInputSchema.parse(request.body);

  await forgotPassword(payload.email, env.WEB_URL, env.PASSWORD_RESET_TTL_MINUTES);

  // Always 200 regardless of whether email exists (prevents user enumeration).
  return reply.send({ data: { ok: true } });
}

export async function resetPasswordHandler(request: FastifyRequest, reply: FastifyReply) {
  const payload = ResetPasswordInputSchema.parse(request.body);

  try {
    await resetPassword(payload.token, payload.password);
    return reply.send({ data: { ok: true } });
  } catch (error) {
    if (error instanceof ResetTokenError) {
      return reply.code(400).send({
        error: { code: "invalid_reset_token", message: error.message }
      });
    }

    throw error;
  }
}
