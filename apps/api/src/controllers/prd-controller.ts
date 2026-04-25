import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { getOpportunityById, getLatestOpportunityArtifact } from "@avs/db";
import { runPrdWorkflow } from "../workflows/prd-workflow.js";
import { runArchitectureWorkflow } from "../workflows/architecture-workflow.js";
import { runMonetizationWorkflow } from "../workflows/monetization-workflow.js";
import { runFeasibilityWorkflow } from "../workflows/feasibility-workflow.js";
import { runMvpRoadmapWorkflow } from "../workflows/mvp-roadmap-workflow.js";
import { runBuildPlanWorkflow } from "../workflows/build-plan-workflow.js";

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

export async function generateArchitecture(request: FastifyRequest, reply: FastifyReply) {
  const { id } = ParamsSchema.parse(request.params);
  const { workspaceId } = request.auth;

  const opportunity = await getOpportunityById(id, workspaceId);
  if (!opportunity) {
    return reply.code(404).send({
      error: { code: "not_found", message: "Opportunity not found" }
    });
  }

  void runArchitectureWorkflow({ opportunityId: id, workspaceId }).catch((err: unknown) => {
    console.error("[architecture-workflow] error for opportunity", id, err);
  });

  return reply.code(202).send({ data: { queued: true, opportunityId: id } });
}

export async function getArchitecture(request: FastifyRequest, reply: FastifyReply) {
  const { id } = ParamsSchema.parse(request.params);
  const { workspaceId } = request.auth;

  const opportunity = await getOpportunityById(id, workspaceId);
  if (!opportunity) {
    return reply.code(404).send({
      error: { code: "not_found", message: "Opportunity not found" }
    });
  }

  const artifact = await getLatestOpportunityArtifact(id, workspaceId, "architecture");
  if (!artifact?.content) {
    return reply.code(404).send({
      error: { code: "not_found", message: "No architecture generated yet" }
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

export async function generateMonetization(request: FastifyRequest, reply: FastifyReply) {
  const { id } = ParamsSchema.parse(request.params);
  const { workspaceId } = request.auth;

  const opportunity = await getOpportunityById(id, workspaceId);
  if (!opportunity) {
    return reply.code(404).send({
      error: { code: "not_found", message: "Opportunity not found" }
    });
  }

  void runMonetizationWorkflow({ opportunityId: id, workspaceId }).catch((err: unknown) => {
    console.error("[monetization-workflow] error for opportunity", id, err);
  });

  return reply.code(202).send({ data: { queued: true, opportunityId: id } });
}

export async function getMonetization(request: FastifyRequest, reply: FastifyReply) {
  const { id } = ParamsSchema.parse(request.params);
  const { workspaceId } = request.auth;

  const opportunity = await getOpportunityById(id, workspaceId);
  if (!opportunity) {
    return reply.code(404).send({
      error: { code: "not_found", message: "Opportunity not found" }
    });
  }

  const artifact = await getLatestOpportunityArtifact(id, workspaceId, "monetization");
  if (!artifact?.content) {
    return reply.code(404).send({
      error: { code: "not_found", message: "No monetization strategy generated yet" }
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

export async function generateFeasibility(request: FastifyRequest, reply: FastifyReply) {
  const { id } = ParamsSchema.parse(request.params);
  const { workspaceId } = request.auth;

  const opportunity = await getOpportunityById(id, workspaceId);
  if (!opportunity) {
    return reply.code(404).send({
      error: { code: "not_found", message: "Opportunity not found" }
    });
  }

  void runFeasibilityWorkflow({ opportunityId: id, workspaceId }).catch((err: unknown) => {
    console.error("[feasibility-workflow] error for opportunity", id, err);
  });

  return reply.code(202).send({ data: { queued: true, opportunityId: id } });
}

export async function getFeasibility(request: FastifyRequest, reply: FastifyReply) {
  const { id } = ParamsSchema.parse(request.params);
  const { workspaceId } = request.auth;

  const opportunity = await getOpportunityById(id, workspaceId);
  if (!opportunity) {
    return reply.code(404).send({
      error: { code: "not_found", message: "Opportunity not found" }
    });
  }

  const artifact = await getLatestOpportunityArtifact(id, workspaceId, "feasibility-report");
  if (!artifact?.content) {
    return reply.code(404).send({
      error: { code: "not_found", message: "No feasibility report generated yet" }
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

export async function generateMvpRoadmap(request: FastifyRequest, reply: FastifyReply) {
  const { id } = ParamsSchema.parse(request.params);
  const { workspaceId } = request.auth;

  const opportunity = await getOpportunityById(id, workspaceId);
  if (!opportunity) {
    return reply.code(404).send({
      error: { code: "not_found", message: "Opportunity not found" }
    });
  }

  void runMvpRoadmapWorkflow({ opportunityId: id, workspaceId }).catch((err: unknown) => {
    console.error("[mvp-roadmap-workflow] error for opportunity", id, err);
  });

  return reply.code(202).send({ data: { queued: true, opportunityId: id } });
}

export async function getMvpRoadmap(request: FastifyRequest, reply: FastifyReply) {
  const { id } = ParamsSchema.parse(request.params);
  const { workspaceId } = request.auth;

  const opportunity = await getOpportunityById(id, workspaceId);
  if (!opportunity) {
    return reply.code(404).send({
      error: { code: "not_found", message: "Opportunity not found" }
    });
  }

  const artifact = await getLatestOpportunityArtifact(id, workspaceId, "mvp-roadmap");
  if (!artifact?.content) {
    return reply.code(404).send({
      error: { code: "not_found", message: "No MVP roadmap generated yet" }
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

export async function generateBuildPlan(request: FastifyRequest, reply: FastifyReply) {
  const { id } = ParamsSchema.parse(request.params);
  const { workspaceId } = request.auth;

  const opportunity = await getOpportunityById(id, workspaceId);
  if (!opportunity) {
    return reply.code(404).send({
      error: { code: "not_found", message: "Opportunity not found" }
    });
  }

  void runBuildPlanWorkflow({ opportunityId: id, workspaceId }).catch((err: unknown) => {
    console.error("[build-plan-workflow] error for opportunity", id, err);
  });

  return reply.code(202).send({ data: { queued: true, opportunityId: id } });
}

export async function getBuildPlan(request: FastifyRequest, reply: FastifyReply) {
  const { id } = ParamsSchema.parse(request.params);
  const { workspaceId } = request.auth;

  const opportunity = await getOpportunityById(id, workspaceId);
  if (!opportunity) {
    return reply.code(404).send({
      error: { code: "not_found", message: "Opportunity not found" }
    });
  }

  const artifact = await getLatestOpportunityArtifact(id, workspaceId, "build-plan");
  if (!artifact?.content) {
    return reply.code(404).send({
      error: { code: "not_found", message: "No build plan generated yet" }
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
