import { z } from "zod";
import { UserRoleValues } from "../enums/roles.js";

export const AuthUserSchema = z.object({
  id: z.string().min(1),
  role: z.enum(UserRoleValues),
  email: z.string().email().optional()
});

export type AuthUser = z.infer<typeof AuthUserSchema>;
