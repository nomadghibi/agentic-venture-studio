import { z } from "zod";

export const CreateWorkspaceInputSchema = z.object({
  name: z.string().min(2).max(80)
});

export const SelectWorkspaceInputSchema = z.object({
  workspaceId: z.string().min(1)
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceInputSchema>;
export type SelectWorkspaceInput = z.infer<typeof SelectWorkspaceInputSchema>;
