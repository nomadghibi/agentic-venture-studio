import { getAnthropicClient, DEFAULT_MODEL } from "../llm/client.js";
import { architectureGenerationPrompt } from "../prompts/architecture.js";
import type { AgentDefinition } from "../runtime/agent-runtime.js";
import type { ArchitectureContent } from "@avs/types";

export interface ArchitectureInput {
  opportunityId: string;
  title: string;
  problemStatement: string;
  targetBuyer: string;
  industry: string;
  mvpScope?: string;
  coreFeatures?: string[];
  signalExcerpts: string[];
}

export type { ArchitectureContent as ArchitectureOutput };

export const architectureAgent: AgentDefinition<ArchitectureInput, ArchitectureContent> = {
  name: "architecture-generator",
  version: "1.0.0",

  async execute(input) {
    const client = getAnthropicClient();

    const featuresBlock =
      input.coreFeatures && input.coreFeatures.length > 0
        ? `\nCore Features (from PRD):\n${input.coreFeatures.map((f, i) => `${i + 1}. ${f}`).join("\n")}`
        : "";

    const signalBlock =
      input.signalExcerpts.length > 0
        ? `\nMarket Signal Evidence:\n${input.signalExcerpts.map((e, i) => `${i + 1}. ${e}`).join("\n")}`
        : "";

    const userMessage = [
      `Opportunity ID: ${input.opportunityId}`,
      `Product: ${input.title}`,
      `Problem: ${input.problemStatement}`,
      `Target Buyer: ${input.targetBuyer}`,
      `Industry: ${input.industry}`,
      input.mvpScope ? `MVP Scope: ${input.mvpScope}` : null,
      featuresBlock,
      signalBlock
    ]
      .filter(Boolean)
      .join("\n");

    const response = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system: architectureGenerationPrompt,
      tools: [
        {
          name: "write_architecture",
          description: "Write the complete technical architecture as structured data",
          input_schema: {
            type: "object" as const,
            properties: {
              systemOverview: {
                type: "string",
                description: "2-3 sentences describing the system design and its key architectural decisions"
              },
              techStack: {
                type: "array",
                description: "Technology choices by layer. Include: frontend, backend, database, auth, hosting, and any key third-party services.",
                items: {
                  type: "object",
                  properties: {
                    layer: { type: "string" },
                    technology: { type: "string" },
                    rationale: { type: "string", description: "Why this specific choice over obvious alternatives" }
                  },
                  required: ["layer", "technology", "rationale"]
                }
              },
              dataModel: {
                type: "array",
                description: "Core domain entities. Max 8. Only what the MVP truly needs.",
                items: {
                  type: "object",
                  properties: {
                    entity: { type: "string" },
                    keyFields: { type: "string", description: "Comma-separated key fields and types" },
                    relationships: { type: "string", description: "How this entity relates to others" }
                  },
                  required: ["entity", "keyFields", "relationships"]
                }
              },
              apiSurface: {
                type: "array",
                description: "MVP API routes only. Max 12.",
                items: {
                  type: "object",
                  properties: {
                    method: { type: "string", enum: ["GET", "POST", "PATCH", "PUT", "DELETE"] },
                    path: { type: "string" },
                    purpose: { type: "string" }
                  },
                  required: ["method", "path", "purpose"]
                }
              },
              deploymentApproach: {
                type: "string",
                description: "Hosting strategy, CI/CD approach, and estimated monthly infra cost at launch"
              },
              buildOrder: {
                type: "array",
                items: { type: "string" },
                description: "Sequenced build milestones — each step must produce something runnable or testable. 5-8 steps."
              },
              estimatedBuildTime: {
                type: "string",
                description: "Realistic estimate for 1-2 engineers to reach a launchable MVP (e.g. '6-8 weeks')"
              },
              technicalRisks: {
                type: "array",
                items: { type: "string" },
                description: "3-5 specific technical risks with mitigation notes"
              }
            },
            required: [
              "systemOverview",
              "techStack",
              "dataModel",
              "apiSurface",
              "deploymentApproach",
              "buildOrder",
              "estimatedBuildTime",
              "technicalRisks"
            ]
          }
        }
      ],
      tool_choice: { type: "any" },
      messages: [{ role: "user", content: userMessage }]
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Architecture agent did not return structured output");
    }

    return toolUse.input as ArchitectureContent;
  }
};
