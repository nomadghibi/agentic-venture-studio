import {
  createSignal as createSignalRecord,
  getOpportunityById,
  listSignalsForOpportunity as listSignalsForOpportunityRecords
} from "@avs/db";
import type { SignalCreateInput } from "@avs/types";

export class SignalScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SignalScopeError";
  }
}

export async function createSignal(input: SignalCreateInput, workspaceId: string) {
  if (input.opportunityId) {
    const exists = await getOpportunityById(input.opportunityId, workspaceId);
    if (!exists) {
      throw new SignalScopeError("Cannot attach signal to opportunity outside this workspace");
    }
  }

  return createSignalRecord(input);
}

export async function listSignalsForOpportunity(opportunityId: string, workspaceId: string) {
  const exists = await getOpportunityById(opportunityId, workspaceId);
  if (!exists) {
    throw new SignalScopeError("Opportunity not found in workspace");
  }

  return listSignalsForOpportunityRecords(opportunityId, workspaceId);
}
