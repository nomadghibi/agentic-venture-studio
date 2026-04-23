import type { FastifyReply, FastifyRequest } from "fastify";
import { listUsersInWorkspace, updateUserRole } from "@avs/db";
import { UpdateUserRoleInputSchema } from "@avs/types";
import { z } from "zod";

const UserIdParamsSchema = z.object({ id: z.string().uuid() });

export async function listWorkspaceUsersHandler(request: FastifyRequest, reply: FastifyReply) {
  const users = await listUsersInWorkspace(request.auth.workspaceId);
  return reply.send({ data: users });
}

export async function updateUserRoleHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsResult = UserIdParamsSchema.safeParse(request.params);
  if (!paramsResult.success) {
    return reply.code(400).send({
      error: { code: "bad_request", message: "Invalid user ID." }
    });
  }

  const bodyResult = UpdateUserRoleInputSchema.safeParse(request.body);
  if (!bodyResult.success) {
    return reply.code(400).send({
      error: { code: "bad_request", message: bodyResult.error.issues[0]?.message ?? "Invalid role." }
    });
  }

  const { id } = paramsResult.data;
  const { role } = bodyResult.data;

  if (id === request.auth.id) {
    return reply.code(400).send({
      error: { code: "bad_request", message: "You cannot change your own role." }
    });
  }

  const updated = await updateUserRole(id, role);
  if (!updated) {
    return reply.code(404).send({
      error: { code: "not_found", message: "User not found." }
    });
  }

  return reply.send({ data: { ok: true } });
}
