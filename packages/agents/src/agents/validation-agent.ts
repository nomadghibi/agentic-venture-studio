import { getAnthropicClient, DEFAULT_MODEL } from "../llm/client.js";
import { problemValidationPrompt } from "../prompts/problem-validation.js";
import type { AgentDefinition } from "../runtime/agent-runtime.js";

export interface ValidationInput {
  opportunityId: string;
  title: string;
  description?: string;
  stage: string;
  signalExcerpts: string[];
}

export interface ValidationOutput {
  urgency: "low" | "medium" | "high";
  frequency: "rare" | "occasional" | "frequent";
  buyerClarity: "unclear" | "partial" | "clear";
  contradictions: string[];
  confidence: number;
  decision: "advance" | "monitor" | "reject";
  rationale: string;
}

export const validationAgent: AgentDefinition<ValidationInput, ValidationOutput> = {
  name: "problem-validation",
  version: "1.0.0",

  async execute(input) {
    const client = getAnthropicClient();

    const excerptBlock =
      input.signalExcerpts.length > 0
        ? `\nSignal Evidence:\n${input.signalExcerpts.map((e, i) => `${i + 1}. ${e}`).join("\n")}`
        : "\nSignal Evidence: (none available)";

    const userMessage = [
      `Opportunity ID: ${input.opportunityId}`,
      `Title: ${input.title}`,
      input.description ? `Description: ${input.description}` : null,
      `Current Stage: ${input.stage}`,
      excerptBlock
    ]
      .filter(Boolean)
      .join("\n");

    const response = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      system: problemValidationPrompt,
      tools: [
        {
          name: "report_validation",
          description: "Report the structured problem validation decision",
          input_schema: {
            type: "object" as const,
            properties: {
              urgency: {
                type: "string",
                enum: ["low", "medium", "high"],
                description: "How urgently buyers need a solution"
              },
              frequency: {
                type: "string",
                enum: ["rare", "occasional", "frequent"],
                description: "How often buyers encounter this problem"
              },
              buyerClarity: {
                type: "string",
                enum: ["unclear", "partial", "clear"],
                description: "How clearly the buyer persona is identified in signals"
              },
              contradictions: {
                type: "array",
                items: { type: "string" },
                description: "List of contradictory evidence found in signals"
              },
              confidence: {
                type: "number",
                description: "0-1 confidence that this is a validated real problem"
              },
              decision: {
                type: "string",
                enum: ["advance", "monitor", "reject"],
                description: "Recommended next action for this opportunity"
              },
              rationale: {
                type: "string",
                description: "Short reasoning for the decision"
              }
            },
            required: [
              "urgency",
              "frequency",
              "buyerClarity",
              "contradictions",
              "confidence",
              "decision",
              "rationale"
            ]
          }
        }
      ],
      tool_choice: { type: "any" },
      messages: [{ role: "user", content: userMessage }]
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Validation agent did not return a structured result");
    }

    return toolUse.input as ValidationOutput;
  }
};
