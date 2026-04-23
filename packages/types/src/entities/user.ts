import { z } from "zod";
import { UserRoleValues } from "../enums/roles.js";

export const UserProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(UserRoleValues)
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
