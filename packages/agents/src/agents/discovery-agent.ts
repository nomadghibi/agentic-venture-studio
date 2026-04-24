import { getAnthropicClient, DEFAULT_MODEL } from "../llm/client.js";
import { opportunityDiscoveryPrompt } from "../prompts/opportunity-discovery.js";
import type { AgentDefinition } from "../runtime/agent-runtime.js";

export interface DiscoveryInput {
  signalId: string;
  sourceType: string;
  sourceTitle?: string;
  sourceUrl?: string;
  contentExcerpt: string;
}

export interface DiscoveryOutput {
  problemStatement: string;
  targetBuyer: string;
  painIntensity: "low" | "medium" | "high";
  evidenceStrength: "weak" | "moderate" | "strong";
  confidence: number;
  recommendation: "advance" | "monitor" | "reject";
}

export const discoveryAgent: AgentDefinition<DiscoveryInput, DiscoveryOutput> = {
  name: "opportunity-discovery",
  version: "1.0.0",

  async execute(input) {
    const client = getAnthropicClient();

    const lines = [
      `Signal ID: ${input.signalId}`,
      `Source Type: ${input.sourceType}`,
      input.sourceTitle ? `Source Title: ${input.sourceTitle}` : null,
      input.sourceUrl ? `Source URL: ${input.sourceUrl}` : null,
      `Content:\n${input.contentExcerpt}`
    ].filter(Boolean) as string[];

    const response = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      system: opportunityDiscoveryPrompt,
      tools: [
        {
          name: "report_discovery",
          description: "Report the structured opportunity discovery analysis",
          input_schema: {
            type: "object" as const,
            properties: {
              problemStatement: {
                type: "string",
                description: "One sentence describing the core business problem observed"
              },
              targetBuyer: {
                type: "string",
                description: "Who experiences this problem (role, company type, or segment)"
              },
              painIntensity: {
                type: "string",
                enum: ["low", "medium", "high"],
                description: "How severe is the pain based on signal evidence"
              },
              evidenceStrength: {
                type: "string",
                enum: ["weak", "moderate", "strong"],
                description: "Quality and quantity of evidence in this signal"
              },
              confidence: {
                type: "number",
                description: "0-1 confidence that this signal indicates a real monetizable opportunity"
              },
              recommendation: {
                type: "string",
                enum: ["advance", "monitor", "reject"],
                description: "Suggested next action for this signal"
              }
            },
            required: [
              "problemStatement",
              "targetBuyer",
              "painIntensity",
              "evidenceStrength",
              "confidence",
              "recommendation"
            ]
          }
        }
      ],
      tool_choice: { type: "any" },
      messages: [{ role: "user", content: lines.join("\n") }]
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Discovery agent did not return a structured result");
    }

    return toolUse.input as DiscoveryOutput;
  }
};
