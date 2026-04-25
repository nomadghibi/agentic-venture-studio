# /add-workflow

Scaffold a complete new AI agent workflow end-to-end: prompt, agent definition, workflow orchestrator, and wiring into the opportunity service stage trigger.

## Usage

```
/add-workflow <workflow-name> [--stage <stage>]
```

- `<workflow-name>`: kebab-case name, e.g. `go-to-market`, `competitive-analysis`
- `--stage <stage>`: the `OpportunityStage` that triggers this workflow automatically (optional — leave out if it's manually triggered only)

## What gets created

Given `workflow-name = go-to-market` and `--stage monetization` (example):

### 1. `packages/agents/src/prompts/go-to-market.ts`

```ts
export const goToMarketPrompt = `
Role: Go-To-Market Strategy Agent
Objective: <fill in — what does this agent analyze or produce?>
Constraints:
- Use evidence before conclusion.
- Never fabricate market evidence.
- Return typed output.
- Escalate when confidence is low.
`;
```

### 2. `packages/agents/src/agents/go-to-market-agent.ts`

Follow the exact pattern used by existing agents (e.g. `feasibility-agent.ts`):
- Export `GoToMarketInput` interface
- Export `GoToMarketOutput` interface — include a `confidence: number` field (0-1) so `evaluateConfidence` works correctly
- Export `const goToMarketAgent: AgentDefinition<GoToMarketInput, GoToMarketOutput>`
- Use `thinking: { type: "adaptive" }` and a single `report_go_to_market` tool with all output fields in the schema
- Model: `DEFAULT_MODEL` from `../llm/client.js`

### 3. `apps/api/src/workflows/go-to-market-workflow.ts`

Follow the exact pattern of `validation-workflow.ts`:
- Export `GoToMarketWorkflowInput` with `opportunityId` and `workspaceId`
- Fetch the opportunity via `getOpportunityById`
- Fetch linked signals via `listSignalsForOpportunity`
- Call `runAgent(goToMarketAgent, input, { correlationId: opportunityId, opportunityId })`
- Call `createWorkflowEvent` with `eventType: "opportunity_go_to_market_analyzed"` and key output fields in the payload
- Return `{ status: "completed", confidence, needsEscalation, output }`

### 4. Wire into `apps/api/src/services/opportunity-service.ts`

If `--stage` was given:
- Add import: `import { runGoToMarketWorkflow } from "../workflows/go-to-market-workflow.js";`
- In `transitionOpportunityStage`, add after the existing stage trigger blocks:
  ```ts
  if (input.nextStage === "<stage>") {
    void runGoToMarketWorkflow({ opportunityId: id, workspaceId }).catch((err: unknown) => {
      console.error("[go-to-market-workflow] error for opportunity", id, err);
    });
  }
  ```

### 5. Export from `packages/agents/src/index.ts`

Add:
```ts
export { goToMarketAgent } from "./agents/go-to-market-agent.js";
export type { GoToMarketInput, GoToMarketOutput } from "./agents/go-to-market-agent.js";
```

## After scaffolding

1. Run `pnpm --filter @avs/agents build` to confirm no TypeScript errors.
2. Show the user the list of created/modified files.
3. Remind them to fill in:
   - The prompt body in `prompts/go-to-market.ts`
   - The Input/Output interface fields in the agent file
   - The tool schema properties to match the Output interface

## Naming conventions

| workflow-name | PascalCase prefix | camelCase prefix | file prefix |
|---|---|---|---|
| go-to-market | GoToMarket | goToMarket | go-to-market |
| competitive-analysis | CompetitiveAnalysis | competitiveAnalysis | competitive-analysis |

Apply consistently across all generated identifiers.
