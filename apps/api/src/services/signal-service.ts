import {
  createSignal as createSignalRecord,
  getOpportunityById,
  listSignalsForOpportunity as listSignalsForOpportunityRecords
} from "@avs/db";
import type { SignalCreateInput } from "@avs/types";
import { runDiscoveryWorkflow } from "../workflows/discovery-workflow.js";

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

  const result = await createSignalRecord(input);

  // Fire-and-forget: run discovery workflow without blocking the response
  void runDiscoveryWorkflow({
    signalId: result.signal.id,
    ...(input.opportunityId ? { opportunityId: input.opportunityId, workspaceId } : {})
  }).catch((err: unknown) => {
    console.error("[discovery-workflow] error for signal", result.signal.id, err);
  });

  return result;
}

export async function listSignalsForOpportunity(opportunityId: string, workspaceId: string) {
  const exists = await getOpportunityById(opportunityId, workspaceId);
  if (!exists) {
    throw new SignalScopeError("Opportunity not found in workspace");
  }

  return listSignalsForOpportunityRecords(opportunityId, workspaceId);
}
