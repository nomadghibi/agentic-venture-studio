export interface AgentJob {
  name: string;
  entityType: string;
  entityId: string;
}

export async function queueAgentJob(job: AgentJob): Promise<{ accepted: true }> {
  void job;
  return { accepted: true };
}
