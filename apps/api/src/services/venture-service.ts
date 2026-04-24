import type { Venture } from "@avs/types";
import {
  getVentureById as getVentureRecord,
  listVentures as listVentureRecords
} from "@avs/db";

export async function listVentures(
  workspaceId: string,
  limit?: number,
  offset?: number
): Promise<Venture[]> {
  return listVentureRecords(workspaceId, limit, offset);
}

export async function getVenture(id: string, workspaceId: string): Promise<Venture | null> {
  return getVentureRecord(id, workspaceId);
}
