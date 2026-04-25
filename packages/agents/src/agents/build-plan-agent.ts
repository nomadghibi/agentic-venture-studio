import { getAnthropicClient, DEFAULT_MODEL } from "../llm/client.js";
import { buildPlanPrompt } from "../prompts/build-plan.js";
import type { AgentDefinition, AgentContext } from "../runtime/agent-runtime.js";
import type { BuildPlanContent } from "@avs/types";

export interface BuildPlanInput {
  opportunityId: string;
  title: string;
  problemStatement: string;
  targetBuyer: string;
  industry: string;
  signalExcerpts: string[];
  // From architecture artifact
  techStack?: Array<{ layer: string; technology: string; rationale: string }>;
  deploymentApproach?: string;
  buildOrder?: string[];
  estimatedBuildTime?: string;
  technicalRisks?: string[];
  // From mvp-roadmap artifact
  totalDuration?: string;
  sprintGoals?: string[];
  launchCriteria?: string[];
  resourceRequirements?: string;
  // From prd artifact
  mvpScope?: string;
  outOfScope?: string;
  coreFeatures?: string[];
  // From feasibility artifact
  buildComplexity?: string;
  teamRequirements?: string;
}

export type { BuildPlanContent as BuildPlanOutput };

export const buildPlanAgent: AgentDefinition<BuildPlanInput, BuildPlanContent> = {
  name: "build-plan-generator",
  version: "1.0.0",

  async execute(input: BuildPlanInput, _context: AgentContext): Promise<BuildPlanContent> {
    const client = getAnthropicClient();

    const lines = [
      `Opportunity ID: ${input.opportunityId}`,
      `Product: ${input.title}`,
      `Problem: ${input.problemStatement}`,
      `Target Buyer: ${input.targetBuyer}`,
      `Industry: ${input.industry}`
    ];

    if (input.buildComplexity) lines.push(`Build Complexity: ${input.buildComplexity}`);
    if (input.teamRequirements) lines.push(`Team Requirements: ${input.teamRequirements}`);
    if (input.estimatedBuildTime) lines.push(`Estimated Build Time: ${input.estimatedBuildTime}`);
    if (input.totalDuration) lines.push(`Roadmap Duration: ${input.totalDuration}`);
    if (input.deploymentApproach) lines.push(`Deployment Approach: ${input.deploymentApproach}`);

    if (input.mvpScope) lines.push(`\nMVP Scope:\n${input.mvpScope}`);
    if (input.outOfScope) lines.push(`\nOut of Scope:\n${input.outOfScope}`);

    if (input.coreFeatures && input.coreFeatures.length > 0) {
      lines.push(`\nCore Features:\n${input.coreFeatures.map((f, i) => `${i + 1}. ${f}`).join("\n")}`);
    }

    if (input.techStack && input.techStack.length > 0) {
      lines.push(
        `\nTech Stack:\n${input.techStack.map((t) => `- ${t.layer}: ${t.technology} — ${t.rationale}`).join("\n")}`
      );
    }

    if (input.buildOrder && input.buildOrder.length > 0) {
      lines.push(`\nBuild Order:\n${input.buildOrder.map((step, i) => `${i + 1}. ${step}`).join("\n")}`);
    }

    if (input.technicalRisks && input.technicalRisks.length > 0) {
      lines.push(`\nTechnical Risks:\n${input.technicalRisks.map((r, i) => `${i + 1}. ${r}`).join("\n")}`);
    }

    if (input.sprintGoals && input.sprintGoals.length > 0) {
      lines.push(`\nSprint Goals:\n${input.sprintGoals.map((g, i) => `Sprint ${i + 1}: ${g}`).join("\n")}`);
    }

    if (input.launchCriteria && input.launchCriteria.length > 0) {
      lines.push(
        `\nLaunch Criteria:\n${input.launchCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}`
      );
    }

    if (input.resourceRequirements) {
      lines.push(`\nResource Requirements:\n${input.resourceRequirements}`);
    }

    if (input.signalExcerpts.length > 0) {
      lines.push(
        `\nMarket Signals:\n${input.signalExcerpts.map((e, i) => `${i + 1}. ${e}`).join("\n")}`
      );
    }

    const response = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 6000,
      thinking: { type: "adaptive" },
      system: buildPlanPrompt,
      tools: [
        {
          name: "write_build_plan",
          description: "Write the complete engineering build plan as structured data",
          input_schema: {
            type: "object" as const,
            properties: {
              overview: {
                type: "string",
                description: "2-3 sentences summarizing what is being built, for whom, and the team executing it"
              },
              phases: {
                type: "array",
                description: "Sequential build phases. Each phase ends when a specific observable condition is true.",
                items: {
                  type: "object",
                  properties: {
                    phase: { type: "number", description: "Phase number starting at 1" },
                    name: {
                      type: "string",
                      description: "Descriptive phase name naming the capability built, e.g. 'Core call loop (end-to-end)'"
                    },
                    duration: {
                      type: "string",
                      description: "Duration of this phase, e.g. '2 weeks' or '10 days'"
                    },
                    objectives: {
                      type: "array",
                      items: { type: "string" },
                      description: "Outcomes (what becomes possible) achieved in this phase, not activities"
                    },
                    tasks: {
                      type: "array",
                      items: { type: "string" },
                      description: "Specific engineering tasks, each concrete enough to pick up immediately (2-4 hour units)"
                    },
                    exitCriteria: {
                      type: "string",
                      description: "The specific observable condition that must be true before calling this phase done"
                    }
                  },
                  required: ["phase", "name", "duration", "objectives", "tasks", "exitCriteria"]
                }
              },
              teamRoles: {
                type: "array",
                description: "Specific roles with weekly hour commitments. Name actual roles, not headcounts.",
                items: {
                  type: "object",
                  properties: {
                    role: { type: "string", description: "Specific role title, e.g. 'Full-stack engineer (lead)'" },
                    responsibilities: {
                      type: "string",
                      description: "What this person owns across the full build"
                    },
                    hoursPerWeek: {
                      type: "number",
                      description: "Weekly hours this role contributes"
                    }
                  },
                  required: ["role", "responsibilities", "hoursPerWeek"]
                }
              },
              externalDependencies: {
                type: "array",
                items: { type: "string" },
                description: "Third-party services, approvals, or external teams required, each with lead time. Format: 'Service: action needed + lead time'"
              },
              riskMitigation: {
                type: "array",
                description: "Specific risks with concrete fallback actions — not concerns, not monitoring, actual actions.",
                items: {
                  type: "object",
                  properties: {
                    risk: { type: "string", description: "Specific risk that could derail the build" },
                    mitigation: {
                      type: "string",
                      description: "The concrete fallback action the team takes if this risk materializes"
                    }
                  },
                  required: ["risk", "mitigation"]
                }
              },
              definitionOfDone: {
                type: "string",
                description: "One paragraph: the internal engineering sign-off — what the team validates before considering the build phase complete and flipping the switch for paid customers"
              },
              totalBudgetEstimate: {
                type: "string",
                description: "Infrastructure + labor breakdown with math shown. Infrastructure priced at actual service rates. Labor at market rate for the skill level required."
              },
              confidence: {
                type: "number",
                description: "0-1 confidence this plan is executable with the stated team, timeline, and budget"
              },
              recommendation: {
                type: "string",
                description: "One concrete action the founder should take this week to unblock the build"
              }
            },
            required: [
              "overview",
              "phases",
              "teamRoles",
              "externalDependencies",
              "riskMitigation",
              "definitionOfDone",
              "totalBudgetEstimate",
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
      throw new Error("Build plan agent did not return structured output");
    }

    return toolUse.input as BuildPlanContent;
  }
};
