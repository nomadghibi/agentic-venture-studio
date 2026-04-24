import { getAnthropicClient, DEFAULT_MODEL } from "../llm/client.js";
import { feasibilityPrompt } from "../prompts/feasibility.js";
import type { AgentDefinition, AgentContext } from "../runtime/agent-runtime.js";

export interface FeasibilityInput {
  opportunityId: string;
  title: string;
  problemStatement: string;
  targetBuyer: string;
  industry: string;
  signalExcerpts: string[];
  mvpScope?: string;
  coreFeatures?: string[];
}

export interface FeasibilityOutput {
  buildComplexity: "low" | "medium" | "high";
  teamRequirements: string;
  estimatedTimeline: string;
  keyRisks: string[];
  technicalDependencies: string[];
  feasibilityScore: number;
  confidence: number;
  recommendation: "proceed" | "de-risk" | "reconsider";
  rationale: string;
}

export const feasibilityAgent: AgentDefinition<FeasibilityInput, FeasibilityOutput> = {
  name: "feasibility-assessment",
  version: "1.0.0",

  async execute(input: FeasibilityInput, _context: AgentContext): Promise<FeasibilityOutput> {
    const client = getAnthropicClient();

    const lines = [
      `Opportunity ID: ${input.opportunityId}`,
      `Title: ${input.title}`,
      `Problem Statement: ${input.problemStatement}`,
      `Target Buyer: ${input.targetBuyer}`,
      `Industry: ${input.industry}`
    ];

    if (input.mvpScope) lines.push(`MVP Scope: ${input.mvpScope}`);
    if (input.coreFeatures && input.coreFeatures.length > 0) {
      lines.push(`Core Features:\n${input.coreFeatures.map((f, i) => `${i + 1}. ${f}`).join("\n")}`);
    }

    if (input.signalExcerpts.length > 0) {
      lines.push(`\nSignal Evidence:\n${input.signalExcerpts.map((e, i) => `${i + 1}. ${e}`).join("\n")}`);
    } else {
      lines.push("\nSignal Evidence: (none available)");
    }

    const response = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      system: feasibilityPrompt,
      tools: [
        {
          name: "report_feasibility",
          description: "Report the structured feasibility assessment",
          input_schema: {
            type: "object" as const,
            properties: {
              buildComplexity: {
                type: "string",
                enum: ["low", "medium", "high"],
                description: "Overall technical complexity of the MVP"
              },
              teamRequirements: {
                type: "string",
                description: "Minimum team composition needed (e.g. '1 full-stack + 1 designer')"
              },
              estimatedTimeline: {
                type: "string",
                description: "Realistic timeline to a shippable MVP (e.g. '10-14 weeks')"
              },
              keyRisks: {
                type: "array",
                items: { type: "string" },
                description: "Top 3-5 risks that could block or delay the build"
              },
              technicalDependencies: {
                type: "array",
                items: { type: "string" },
                description: "External services, APIs, or platforms this product depends on"
              },
              feasibilityScore: {
                type: "number",
                description: "0-100 score: 100 = trivially feasible, 0 = essentially impossible"
              },
              confidence: {
                type: "number",
                description: "0-1 confidence in this assessment given available information"
              },
              recommendation: {
                type: "string",
                enum: ["proceed", "de-risk", "reconsider"],
                description: "proceed = build now, de-risk = address blockers first, reconsider = fundamental feasibility issues"
              },
              rationale: {
                type: "string",
                description: "2-3 sentence explanation of the recommendation"
              }
            },
            required: [
              "buildComplexity",
              "teamRequirements",
              "estimatedTimeline",
              "keyRisks",
              "technicalDependencies",
              "feasibilityScore",
              "confidence",
              "recommendation",
              "rationale"
            ]
          }
        }
      ],
      tool_choice: { type: "any" },
      messages: [{ role: "user", content: lines.join("\n") }]
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Feasibility agent did not return a structured result");
    }

    return toolUse.input as FeasibilityOutput;
  }
};
