import { getAnthropicClient, DEFAULT_MODEL } from "../llm/client.js";
import { prdGenerationPrompt } from "../prompts/prd.js";
import type { AgentDefinition } from "../runtime/agent-runtime.js";
import type { PrdContent } from "@avs/types";

export interface PrdInput {
  opportunityId: string;
  title: string;
  problemStatement: string;
  targetBuyer: string;
  industry: string;
  stage: string;
  painScore: number;
  overallScore: number;
  signalExcerpts: string[];
}

export type { PrdContent as PrdOutput };

const PRIORITY_VALUES = ["must-have", "should-have", "nice-to-have"] as const;

export const prdAgent: AgentDefinition<PrdInput, PrdContent> = {
  name: "prd-generator",
  version: "1.0.0",

  async execute(input) {
    const client = getAnthropicClient();

    const signalBlock =
      input.signalExcerpts.length > 0
        ? `\nMarket Signal Evidence:\n${input.signalExcerpts.map((e, i) => `${i + 1}. ${e}`).join("\n")}`
        : "\nMarket Signal Evidence: (no signals captured yet — use reasonable inference)";

    const userMessage = [
      `Opportunity ID: ${input.opportunityId}`,
      `Title: ${input.title}`,
      `Problem Statement: ${input.problemStatement}`,
      `Target Buyer: ${input.targetBuyer}`,
      `Industry: ${input.industry}`,
      `Current Stage: ${input.stage}`,
      `Pain Score: ${input.painScore}/100`,
      `Overall Validation Score: ${input.overallScore}/100`,
      signalBlock
    ].join("\n");

    const response = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system: prdGenerationPrompt,
      tools: [
        {
          name: "write_prd",
          description: "Write the complete Product Requirements Document as structured data",
          input_schema: {
            type: "object" as const,
            properties: {
              executiveSummary: {
                type: "string",
                description: "2-3 sentence summary of what this product is, who it's for, and why it will win"
              },
              problemStatement: {
                type: "string",
                description: "The specific, painful problem being solved — grounded in the signal evidence"
              },
              targetUsers: {
                type: "string",
                description: "Precise description of the primary user: role, company size, context, and what their day looks like without this product"
              },
              coreFeatures: {
                type: "array",
                description: "MVP features ranked by necessity. Max 6 features.",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: {
                      type: "string",
                      description: "What it does and why it matters — one concrete sentence"
                    },
                    priority: {
                      type: "string",
                      enum: PRIORITY_VALUES as unknown as string[]
                    }
                  },
                  required: ["name", "description", "priority"]
                }
              },
              mvpScope: {
                type: "string",
                description: "What the MVP includes — the minimum surface area to test the core hypothesis"
              },
              outOfScope: {
                type: "string",
                description: "What is explicitly NOT in the MVP and why — prevents scope creep"
              },
              successMetrics: {
                type: "array",
                items: { type: "string" },
                description: "3-5 measurable metrics that prove the product is working. Be specific (e.g. '60% of users complete a second validation run within 7 days')."
              },
              monetizationModel: {
                type: "string",
                description: "Pricing strategy, tier logic, and the buyer's likely budget based on evidence"
              },
              openQuestions: {
                type: "array",
                items: { type: "string" },
                description: "3-5 real unknowns that must be resolved before or during build — not generic concerns"
              }
            },
            required: [
              "executiveSummary",
              "problemStatement",
              "targetUsers",
              "coreFeatures",
              "mvpScope",
              "outOfScope",
              "successMetrics",
              "monetizationModel",
              "openQuestions"
            ]
          }
        }
      ],
      tool_choice: { type: "any" },
      messages: [{ role: "user", content: userMessage }]
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("PRD agent did not return structured output");
    }

    return toolUse.input as PrdContent;
  }
};
