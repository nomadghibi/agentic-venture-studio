import { z } from "zod";
import { UserRoleValues } from "../enums/roles.js";

export const AuthUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  role: z.enum(UserRoleValues),
  email: z.string().email().optional(),
  workspaceId: z.string().min(1),
  sessionToken: z.string().min(1)
});

export type AuthUser = z.infer<typeof AuthUserSchema>;
