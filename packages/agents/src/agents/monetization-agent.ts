import { getAnthropicClient, DEFAULT_MODEL } from "../llm/client.js";
import { monetizationPrompt } from "../prompts/monetization.js";
import type { AgentDefinition, AgentContext } from "../runtime/agent-runtime.js";

export interface MonetizationInput {
  opportunityId: string;
  title: string;
  problemStatement: string;
  targetBuyer: string;
  industry: string;
  signalExcerpts: string[];
  mvpScope?: string;
  feasibilityScore?: number;
}

export interface MonetizationOutput {
  primaryModel: "subscription" | "usage_based" | "one_time" | "marketplace" | "freemium" | "enterprise_license";
  suggestedPrice: string;
  pricingRationale: string;
  revenueLeadIndicator: string;
  alternativeModels: string[];
  antiPatterns: string[];
  year1RevenueEstimate: string;
  confidence: number;
  recommendation: string;
}

export const monetizationAgent: AgentDefinition<MonetizationInput, MonetizationOutput> = {
  name: "monetization-strategist",
  version: "1.0.0",

  async execute(input: MonetizationInput, _context: AgentContext): Promise<MonetizationOutput> {
    const client = getAnthropicClient();

    const lines = [
      `Opportunity ID: ${input.opportunityId}`,
      `Product: ${input.title}`,
      `Problem: ${input.problemStatement}`,
      `Target Buyer: ${input.targetBuyer}`,
      `Industry: ${input.industry}`
    ];

    if (input.mvpScope) lines.push(`MVP Scope: ${input.mvpScope}`);
    if (input.feasibilityScore != null) {
      lines.push(`Feasibility Score: ${input.feasibilityScore}/100`);
    }

    if (input.signalExcerpts.length > 0) {
      lines.push(`\nMarket Signals:\n${input.signalExcerpts.map((e, i) => `${i + 1}. ${e}`).join("\n")}`);
    } else {
      lines.push("\nMarket Signals: (none available)");
    }

    const response = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      system: monetizationPrompt,
      tools: [
        {
          name: "report_monetization",
          description: "Report the structured monetization strategy",
          input_schema: {
            type: "object" as const,
            properties: {
              primaryModel: {
                type: "string",
                enum: ["subscription", "usage_based", "one_time", "marketplace", "freemium", "enterprise_license"],
                description: "The recommended primary monetization model"
              },
              suggestedPrice: {
                type: "string",
                description: "Specific price point with billing cadence (e.g. '$49/month per seat', '$299 one-time')"
              },
              pricingRationale: {
                type: "string",
                description: "Why this price point — reference comparable products or buyer budget signals"
              },
              revenueLeadIndicator: {
                type: "string",
                description: "The single metric that predicts whether revenue will grow (e.g. 'weekly active users who create 3+ reports')"
              },
              alternativeModels: {
                type: "array",
                items: { type: "string" },
                description: "2-3 alternative monetization approaches worth testing later"
              },
              antiPatterns: {
                type: "array",
                items: { type: "string" },
                description: "Monetization approaches to avoid for this specific product and buyer"
              },
              year1RevenueEstimate: {
                type: "string",
                description: "Rough year-1 revenue estimate with assumptions (e.g. '$180k ARR assuming 50 customers at $299/mo')"
              },
              confidence: {
                type: "number",
                description: "0-1 confidence in this strategy given available market signal"
              },
              recommendation: {
                type: "string",
                description: "2-3 sentence concrete next step to validate this model (e.g. 'Run 5 sales calls this week with $X price...')"
              }
            },
            required: [
              "primaryModel",
              "suggestedPrice",
              "pricingRationale",
              "revenueLeadIndicator",
              "alternativeModels",
              "antiPatterns",
              "year1RevenueEstimate",
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
      throw new Error("Monetization agent did not return a structured result");
    }

    return toolUse.input as MonetizationOutput;
  }
};
