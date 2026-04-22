export type AgentTool<TInput = unknown, TOutput = unknown> = {
  name: string;
  run(input: TInput): Promise<TOutput>;
};

export class ToolRegistry {
  private readonly tools = new Map<string, AgentTool>();

  register(tool: AgentTool) {
    this.tools.set(tool.name, tool);
  }

  get(name: string): AgentTool {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new Error(`Tool not registered: ${name}`);
    }

    return tool;
  }
}
