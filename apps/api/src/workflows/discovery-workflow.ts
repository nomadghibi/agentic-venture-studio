export interface DiscoveryWorkflowInput {
  signalId: string;
}

export async function runDiscoveryWorkflow(_input: DiscoveryWorkflowInput) {
  return {
    status: "queued"
  };
}
