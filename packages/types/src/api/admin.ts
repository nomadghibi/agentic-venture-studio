import { z } from "zod";
import { UserRoleValues } from "../enums/roles.js";

export const UpdateUserRoleInputSchema = z.object({
  role: z.enum(UserRoleValues)
});

export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleInputSchema>;
