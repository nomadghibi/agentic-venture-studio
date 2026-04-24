import { z } from "zod";
import { UserProfileSchema } from "../entities/user.js";
import { WorkspaceSchema } from "../entities/workspace.js";

export const AuthLoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

export const AuthRegisterInputSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  workspaceName: z.string().min(2).max(80).optional(),
  inviteCode: z.string().optional()
});

export const AuthSessionSchema = z.object({
  user: UserProfileSchema,
  workspace: WorkspaceSchema
});

export const ForgotPasswordInputSchema = z.object({
  email: z.string().email()
});

export const ResetPasswordInputSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128)
});

export type AuthLoginInput = z.infer<typeof AuthLoginInputSchema>;
export type AuthRegisterInput = z.infer<typeof AuthRegisterInputSchema>;
export type AuthSession = z.infer<typeof AuthSessionSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;
