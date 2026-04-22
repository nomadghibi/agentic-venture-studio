import {
  createSignal as createSignalRecord,
  listSignalsForOpportunity as listSignalsForOpportunityRecords
} from "@avs/db";
import type { SignalCreateInput } from "@avs/types";

export async function createSignal(input: SignalCreateInput) {
  return createSignalRecord(input);
}

export async function listSignalsForOpportunity(opportunityId: string) {
  return listSignalsForOpportunityRecords(opportunityId);
}
