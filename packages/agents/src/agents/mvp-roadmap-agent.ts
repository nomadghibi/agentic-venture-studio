import { getAnthropicClient, DEFAULT_MODEL } from "../llm/client.js";
import { mvpRoadmapPrompt } from "../prompts/mvp-roadmap.js";
import type { AgentDefinition, AgentContext } from "../runtime/agent-runtime.js";
import type { MvpRoadmapContent } from "@avs/types";

export interface MvpRoadmapInput {
  opportunityId: string;
  title: string;
  problemStatement: string;
  targetBuyer: string;
  industry: string;
  signalExcerpts: string[];
  coreFeatures?: string[];
  mvpScope?: string;
  outOfScope?: string;
  estimatedTimeline?: string;
  buildComplexity?: string;
  teamRequirements?: string;
}

export type { MvpRoadmapContent as MvpRoadmapOutput };

export const mvpRoadmapAgent: AgentDefinition<MvpRoadmapInput, MvpRoadmapContent> = {
  name: "mvp-roadmap-planner",
  version: "1.0.0",

  async execute(input: MvpRoadmapInput, _context: AgentContext): Promise<MvpRoadmapContent> {
    const client = getAnthropicClient();

    const lines = [
      `Opportunity ID: ${input.opportunityId}`,
      `Product: ${input.title}`,
      `Problem: ${input.problemStatement}`,
      `Target Buyer: ${input.targetBuyer}`,
      `Industry: ${input.industry}`
    ];

    if (input.estimatedTimeline) lines.push(`Feasibility Timeline: ${input.estimatedTimeline}`);
    if (input.buildComplexity) lines.push(`Build Complexity: ${input.buildComplexity}`);
    if (input.teamRequirements) lines.push(`Team Requirements: ${input.teamRequirements}`);
    if (input.mvpScope) lines.push(`\nMVP Scope:\n${input.mvpScope}`);
    if (input.outOfScope) lines.push(`\nOut of Scope:\n${input.outOfScope}`);
    if (input.coreFeatures && input.coreFeatures.length > 0) {
      lines.push(`\nCore Features:\n${input.coreFeatures.map((f, i) => `${i + 1}. ${f}`).join("\n")}`);
    }
    if (input.signalExcerpts.length > 0) {
      lines.push(`\nMarket Signals:\n${input.signalExcerpts.map((e, i) => `${i + 1}. ${e}`).join("\n")}`);
    }

    const response = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system: mvpRoadmapPrompt,
      tools: [
        {
          name: "write_mvp_roadmap",
          description: "Write the complete MVP roadmap as structured data",
          input_schema: {
            type: "object" as const,
            properties: {
              rationale: {
                type: "string",
                description: "Why this sprint sequence validates the core hypothesis. Name the hypothesis explicitly and explain what the first 2-3 sprints are proving."
              },
              totalDuration: {
                type: "string",
                description: "Total time from sprint 1 to launch-ready, e.g. '12 weeks' or '3 months'"
              },
              sprints: {
                type: "array",
                description: "Week-by-week sprints. Each sprint goal must describe a user-visible outcome.",
                items: {
                  type: "object",
                  properties: {
                    sprint: { type: "number", description: "Sprint number starting at 1" },
                    goal: { type: "string", description: "User-visible outcome achieved by end of sprint. Never an internal engineering task." },
                    features: { type: "array", items: { type: "string" }, description: "Specific features or capabilities built in this sprint" },
                    deliverable: { type: "string", description: "The specific artifact or interaction that proves this sprint is done" }
                  },
                  required: ["sprint", "goal", "features", "deliverable"]
                }
              },
              milestones: {
                type: "array",
                description: "3-5 milestones marking when the product crosses a threshold. Named after what becomes possible, not what was built.",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "What becomes possible at this milestone, e.g. 'First external demo possible'" },
                    week: { type: "number", description: "Which week this milestone is reached" },
                    deliverable: { type: "string", description: "The specific thing that exists or works at this milestone" }
                  },
                  required: ["name", "week", "deliverable"]
                }
              },
              launchCriteria: {
                type: "array",
                items: { type: "string" },
                description: "3-5 binary yes/no conditions that must be true before charging the first customer. Each must be testable."
              },
              resourceRequirements: {
                type: "string",
                description: "Specific roles with weekly hour commitments. Flag any non-engineer work that will block sprints."
              },
              confidence: {
                type: "number",
                description: "0-1 confidence this roadmap is achievable with the stated team and timeline"
              },
              recommendation: {
                type: "string",
                description: "One concrete action the founder should take this week to start executing this roadmap"
              }
            },
            required: [
              "rationale",
              "totalDuration",
              "sprints",
              "milestones",
              "launchCriteria",
              "resourceRequirements",
              "confidence",
              "recommendation"
            ]
          }
        }
      ],
      tool_choice: { type: "any" },
      messages: [{ role: "user", content: lines.join("\n") }]
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("MVP roadmap agent did not return structured output");
    }

    return toolUse.input as MvpRoadmapContent;
  }
};
