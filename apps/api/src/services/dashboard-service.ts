import { getDashboardSummary } from "@avs/db";

export async function fetchDashboardSummary(workspaceId: string) {
  return getDashboardSummary(workspaceId);
}
