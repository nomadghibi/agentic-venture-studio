import type { AgentDefinition } from "../runtime/agent-runtime.js";

export class AgentRegistry {
  private readonly byName = new Map<string, AgentDefinition<unknown, unknown>>();

  register<TInput, TOutput>(definition: AgentDefinition<TInput, TOutput>) {
    this.byName.set(definition.name, definition as AgentDefinition<unknown, unknown>);
  }

  get<TInput, TOutput>(name: string): AgentDefinition<TInput, TOutput> {
    const found = this.byName.get(name);

    if (!found) {
      throw new Error(`Agent not registered: ${name}`);
    }

    return found as AgentDefinition<TInput, TOutput>;
  }
}
