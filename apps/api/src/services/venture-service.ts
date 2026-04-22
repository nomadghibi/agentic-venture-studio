import type { Venture } from "@avs/types";
import {
  getVentureById as getVentureRecord,
  listVentures as listVentureRecords
} from "@avs/db";

export async function listVentures(): Promise<Venture[]> {
  return listVentureRecords();
}

export async function getVenture(id: string): Promise<Venture | null> {
  return getVentureRecord(id);
}
