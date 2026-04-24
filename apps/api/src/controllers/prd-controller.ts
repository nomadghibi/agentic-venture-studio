import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { getOpportunityById, getLatestOpportunityArtifact } from "@avs/db";
import { runPrdWorkflow } from "../workflows/prd-workflow.js";

const ParamsSchema = z.object({ id: z.string().uuid() });

export async function generatePrd(request: FastifyRequest, reply: FastifyReply) {
  const { id } = ParamsSchema.parse(request.params);
  const { workspaceId } = request.auth;

  const opportunity = await getOpportunityById(id, workspaceId);
  if (!opportunity) {
    return reply.code(404).send({
      error: { code: "not_found", message: "Opportunity not found" }
    });
  }

  void runPrdWorkflow({ opportunityId: id, workspaceId }).catch((err: unknown) => {
    console.error("[prd-workflow] error for opportunity", id, err);
  });

  return reply.code(202).send({ data: { queued: true, opportunityId: id } });
}

export async function getPrd(request: FastifyRequest, reply: FastifyReply) {
  const { id } = ParamsSchema.parse(request.params);
  const { workspaceId } = request.auth;

  const opportunity = await getOpportunityById(id, workspaceId);
  if (!opportunity) {
    return reply.code(404).send({
      error: { code: "not_found", message: "Opportunity not found" }
    });
  }

  const artifact = await getLatestOpportunityArtifact(id, workspaceId, "prd");
  if (!artifact || !artifact.content) {
    return reply.code(404).send({
      error: { code: "not_found", message: "No PRD generated yet" }
    });
  }

  return reply.send({
    data: {
      id: artifact.id,
      version: artifact.version,
      createdAt: artifact.createdAt,
      content: JSON.parse(artifact.content)
    }
  });
}
