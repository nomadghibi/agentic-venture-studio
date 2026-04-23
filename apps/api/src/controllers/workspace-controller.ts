import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { CreateWorkspaceInputSchema } from "@avs/types";
import {
  WorkspaceAccessError,
  createWorkspaceAndSelect,
  listWorkspaces,
  selectWorkspace
} from "../services/workspace-service.js";

const WorkspaceIdParamsSchema = z.object({
  id: z.string().min(1)
});

function publicSession<T extends { sessionToken: string }>(session: T) {
  const { sessionToken: _sessionToken, ...rest } = session;
  return rest;
}

export async function listWorkspaceOptions(request: FastifyRequest, reply: FastifyReply) {
  const workspaces = await listWorkspaces(request.auth.id);

  return reply.send({
    data: {
      workspaces,
      currentWorkspaceId: request.auth.workspaceId
    }
  });
}

export async function createWorkspace(request: FastifyRequest, reply: FastifyReply) {
  const payload = CreateWorkspaceInputSchema.parse(request.body);

  try {
    const session = await createWorkspaceAndSelect(
      request.auth.id,
      payload.name,
      request.auth.sessionToken
    );

    const workspaces = await listWorkspaces(request.auth.id);

    return reply.code(201).send({
      data: {
        session: publicSession(session),
        workspaces,
        currentWorkspaceId: session.workspace.id
      }
    });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return reply.code(403).send({
        error: {
          code: "workspace_access_denied",
          message: error.message
        }
      });
    }

    throw error;
  }
}

export async function selectWorkspaceById(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const params = WorkspaceIdParamsSchema.parse(request.params);

  try {
    const session = await selectWorkspace(
      request.auth.id,
      params.id,
      request.auth.sessionToken
    );

    const workspaces = await listWorkspaces(request.auth.id);

    return reply.send({
      data: {
        session: publicSession(session),
        workspaces,
        currentWorkspaceId: session.workspace.id
      }
    });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return reply.code(404).send({
        error: {
          code: "workspace_not_found",
          message: error.message
        }
      });
    }

    throw error;
  }
}
