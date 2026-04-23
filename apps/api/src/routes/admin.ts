import type { FastifyInstance } from "fastify";
import { listWorkspaceUsersHandler, updateUserRoleHandler } from "../controllers/admin-controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export async function registerAdminRoutes(app: FastifyInstance) {
  app.get("/admin/users", { preHandler: [requireAuth, requireRole(["admin"])] }, listWorkspaceUsersHandler);
  app.patch(
    "/admin/users/:id/role",
    { preHandler: [requireAuth, requireRole(["admin"])] },
    updateUserRoleHandler
  );
}
