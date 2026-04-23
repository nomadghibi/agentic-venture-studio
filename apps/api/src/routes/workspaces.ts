import type { FastifyInstance } from "fastify";
import {
  createWorkspace,
  listWorkspaceOptions,
  selectWorkspaceById
} from "../controllers/workspace-controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export async function registerWorkspaceRoutes(app: FastifyInstance) {
  app.get("/workspaces", { preHandler: [requireAuth] }, listWorkspaceOptions);
  app.post("/workspaces", { preHandler: [requireAuth, requireRole(["founder", "admin"])] }, createWorkspace);
  app.post(
    "/workspaces/:id/select",
    { preHandler: [requireAuth] },
    selectWorkspaceById
  );
}
