import { evaluateConfidence } from "../evaluators/confidence.js";

export interface AgentContext {
  correlationId: string;
  opportunityId?: string;
}

export interface AgentExecutionResult<TOutput> {
  output: TOutput;
  confidence: number;
  needsEscalation: boolean;
}

export interface AgentDefinition<TInput, TOutput> {
  name: string;
  version: string;
  execute(input: TInput, context: AgentContext): Promise<TOutput>;
}

export async function runAgent<TInput, TOutput>(
  definition: AgentDefinition<TInput, TOutput>,
  input: TInput,
  context: AgentContext
): Promise<AgentExecutionResult<TOutput>> {
  const output = await definition.execute(input, context);
  const confidence = evaluateConfidence(output);

  return {
    output,
    confidence,
    needsEscalation: confidence < 0.55
  };
}
