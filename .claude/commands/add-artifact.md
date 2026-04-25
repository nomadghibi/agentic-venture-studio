# /add-artifact

Generate a founder-deliverable artifact for an opportunity. These are the documents founders actually pay for: PRD, architecture doc, MVP roadmap, feasibility report, monetization plan, build plan.

The skill handles three states transparently:
- **Wired** (`prd`, `architecture`, `monetization`): runs the existing workflow, saves + displays
- **Gap** (`feasibility-report`): agent and workflow exist but output is never persisted as an artifact — fixes the workflow before generating
- **Missing** (`mvp-roadmap`, `build-plan`): scaffolds full infrastructure (content type → agent → workflow) then generates

## Usage

```
/add-artifact <type> --opportunity-id <id> --workspace-id <id> [--regenerate] [--export]
```

**Types:** `prd` | `architecture` | `monetization` | `feasibility-report` | `mvp-roadmap` | `build-plan`

- `--regenerate`: re-run the workflow even if an artifact already exists (bumps version)
- `--export`: write the artifact as a polished markdown file to `artifacts/<opportunity-slug>/<type>.md`
- With no `--opportunity-id`, list recent opportunities and ask which to use

---

## Step 0 — Resolve opportunity

If `--opportunity-id` is missing, query:
```sql
SELECT id, title, current_stage, overall_score FROM opportunities ORDER BY updated_at DESC LIMIT 15
```
Present the list. If `--workspace-id` is also missing, look it up: `SELECT workspace_id FROM opportunities WHERE id = $1`.

---

## Step 1 — Check infrastructure state

For the requested type, determine which of these three states applies:

| Type | State | Agent file | Workflow file | Persists to artifacts? |
|---|---|---|---|---|
| `prd` | Wired | `prd-agent.ts` | `prd-workflow.ts` | ✓ |
| `architecture` | Wired | `architecture-agent.ts` | `architecture-workflow.ts` | ✓ |
| `monetization` | Wired | `monetization-agent.ts` | `monetization-workflow.ts` | ✓ |
| `feasibility-report` | Gap | `feasibility-agent.ts` | `feasibility-workflow.ts` | ✗ (scores only) |
| `mvp-roadmap` | Missing | — | — | — |
| `build-plan` | Missing | — | — | — |

Check by reading the relevant files. If a file doesn't exist at the expected path, treat it as Missing.

---

## Step 2A — Fix Gap: `feasibility-report`

The `feasibility-workflow.ts` runs the agent and updates scores but never calls `upsertOpportunityArtifact`. Fix this:

In `apps/api/src/workflows/feasibility-workflow.ts`:
1. Add `upsertOpportunityArtifact` to the import from `@avs/db`
2. After the `createWorkflowEvent` call, add:
   ```ts
   await upsertOpportunityArtifact(
     input.opportunityId,
     input.workspaceId,
     "feasibility-report",
     `Feasibility Report: ${opportunity.title}`,
     JSON.stringify(result.output)
   );
   ```
3. Rebuild: `pnpm --filter @avs/api typecheck`

No new agent or content type is needed — `FeasibilityOutput` from `feasibility-agent.ts` is the content.

---

## Step 2B — Scaffold Missing: `mvp-roadmap`

### `packages/types/src/entities/artifact.ts` — add content type

```ts
export const MvpRoadmapSprintSchema = z.object({
  sprint: z.number(),
  goal: z.string(),
  features: z.array(z.string()),
  deliverable: z.string()
});

export const MvpRoadmapContentSchema = z.object({
  rationale: z.string(),
  totalDuration: z.string(),
  sprints: z.array(MvpRoadmapSprintSchema),
  milestones: z.array(z.object({ name: z.string(), week: z.number(), deliverable: z.string() })),
  launchCriteria: z.array(z.string()),
  resourceRequirements: z.string(),
  confidence: z.number(),
  recommendation: z.string()
});

export type MvpRoadmapSprint = z.infer<typeof MvpRoadmapSprintSchema>;
export type MvpRoadmapContent = z.infer<typeof MvpRoadmapContentSchema>;
```

### `packages/agents/src/prompts/mvp-roadmap.ts`

```ts
export const mvpRoadmapPrompt = `
Role: MVP Roadmap Agent
Objective: Translate a validated opportunity into a concrete, week-by-week build roadmap founders can execute.
Constraints:
- Ground the timeline in the feasibility assessment and PRD scope.
- Never pad timelines — assume a capable 1-2 person team.
- Every sprint must have a runnable deliverable.
- Return typed output.
- Escalate when confidence is low.
`;
```

### `packages/agents/src/agents/mvp-roadmap-agent.ts`

Follow the exact pattern of `prd-agent.ts`. Input interface:
```ts
export interface MvpRoadmapInput {
  opportunityId: string;
  title: string;
  problemStatement: string;
  targetBuyer: string;
  industry: string;
  estimatedTimeline?: string;    // from feasibility agent
  buildComplexity?: string;       // from feasibility agent
  coreFeatures?: string[];        // from PRD
  mvpScope?: string;              // from PRD
  signalExcerpts: string[];
}
```

Output: `MvpRoadmapContent`. Tool name: `write_mvp_roadmap`. Include all schema fields from `MvpRoadmapContentSchema` in the tool input_schema. Use `thinking: { type: "adaptive" }` and `max_tokens: 4096`.

### `apps/api/src/workflows/mvp-roadmap-workflow.ts`

Pattern: read opportunity + signals + PRD artifact + feasibility artifact in `Promise.all`, pass context to agent, call `upsertOpportunityArtifact(..., "mvp-roadmap", ...)`, emit `createWorkflowEvent` with `eventType: "mvp_roadmap_generated"`.

Pull `estimatedTimeline` and `buildComplexity` from the feasibility artifact if it exists (JSON.parse the content, guard with try/catch).

### Export from `packages/agents/src/index.ts`

```ts
export { mvpRoadmapAgent } from "./agents/mvp-roadmap-agent.js";
export type { MvpRoadmapInput, MvpRoadmapContent } from "./agents/mvp-roadmap-agent.js";
```

---

## Step 2C — Scaffold Missing: `build-plan`

### `packages/types/src/entities/artifact.ts` — add content type

```ts
export const BuildPhaseSchema = z.object({
  phase: z.number(),
  name: z.string(),
  duration: z.string(),
  objectives: z.array(z.string()),
  tasks: z.array(z.string()),
  exitCriteria: z.string()
});

export const BuildPlanContentSchema = z.object({
  overview: z.string(),
  phases: z.array(BuildPhaseSchema),
  teamRoles: z.array(z.object({ role: z.string(), responsibilities: z.string(), hoursPerWeek: z.number() })),
  externalDependencies: z.array(z.string()),
  riskMitigation: z.array(z.object({ risk: z.string(), mitigation: z.string() })),
  definitionOfDone: z.string(),
  totalBudgetEstimate: z.string(),
  confidence: z.number(),
  recommendation: z.string()
});

export type BuildPhase = z.infer<typeof BuildPhaseSchema>;
export type BuildPlanContent = z.infer<typeof BuildPlanContentSchema>;
```

### `packages/agents/src/prompts/build-plan.ts`

```ts
export const buildPlanPrompt = `
Role: Build Plan Agent
Objective: Produce a phase-by-phase execution plan with clear exit criteria, team roles, and budget estimates.
Constraints:
- Ground every phase in the architecture and MVP roadmap artifacts if available.
- Be specific about tasks — no vague milestones.
- Budget estimates must reference real tooling costs.
- Return typed output.
- Escalate when confidence is low.
`;
```

### `packages/agents/src/agents/build-plan-agent.ts`

Input interface:
```ts
export interface BuildPlanInput {
  opportunityId: string;
  title: string;
  problemStatement: string;
  targetBuyer: string;
  industry: string;
  buildOrder?: string[];          // from architecture
  techStack?: string[];           // from architecture (layer: technology pairs)
  estimatedBuildTime?: string;    // from architecture
  sprints?: string[];             // from mvp-roadmap (sprint goal summaries)
  signalExcerpts: string[];
}
```

Output: `BuildPlanContent`. Tool name: `write_build_plan`. Use `thinking: { type: "adaptive" }` and `max_tokens: 4096`.

### `apps/api/src/workflows/build-plan-workflow.ts`

Read opportunity + signals + architecture artifact + mvp-roadmap artifact in `Promise.all`. Pass `buildOrder` and `techStack` from architecture, and sprint goal summaries from mvp-roadmap. Call `upsertOpportunityArtifact(..., "build-plan", ...)`. Emit `createWorkflowEvent` with `eventType: "build_plan_generated"`.

---

## Step 3 — Generate the artifact

After scaffolding (if needed), run:
- For `prd`: `runPrdWorkflow`
- For `architecture`: `runArchitectureWorkflow`
- For `monetization`: `runMonetizationWorkflow`
- For `feasibility-report`: `runFeasibilityWorkflow`
- For `mvp-roadmap`: `runMvpRoadmapWorkflow`
- For `build-plan`: `runBuildPlanWorkflow`

Write and execute a tsx runner script (same pattern as `/run-workflow`). After it completes, fetch the artifact:

```ts
const artifact = await getLatestOpportunityArtifact(opportunityId, workspaceId, "<type>");
```

If `--regenerate` was not passed and an artifact already exists (check before running), display the existing artifact and ask the user if they want to regenerate.

---

## Step 4 — Display

Render each artifact type with its full content:

### `prd`
```
━━━━━━━━━━━━━━━━━━━━━━━━
  PRD: <title>  v<version>
━━━━━━━━━━━━━━━━━━━━━━━━
Executive Summary
  <executiveSummary>

Problem
  <problemStatement>

Target Users
  <targetUsers>

Core Features
  ● [must-have]    <name>: <description>
  ● [must-have]    ...
  ○ [should-have]  ...
  ○ [nice-to-have] ...

MVP Scope
  <mvpScope>

Out of Scope
  <outOfScope>

Success Metrics
  1. <metric>
  2. ...

Monetization
  <monetizationModel>

Open Questions
  ? <question>
  ? ...
```

### `architecture`
```
━━━━━━━━━━━━━━━━━━━━━━━━
  Architecture: <title>  v<version>
━━━━━━━━━━━━━━━━━━━━━━━━
System Overview
  <systemOverview>

Tech Stack
  Frontend   React / Next.js   <rationale>
  Backend    Fastify           <rationale>
  ...

Data Model
  <entity>   <keyFields>   <relationships>
  ...

API Surface
  GET  /api/v1/...   <purpose>
  POST /api/v1/...   <purpose>
  ...

Deployment
  <deploymentApproach>

Build Order
  1. <step>
  2. ...

Timeline: <estimatedBuildTime>

Technical Risks
  ⚠ <risk>
  ...
```

### `monetization`
```
━━━━━━━━━━━━━━━━━━━━━━━━
  Monetization Plan: <title>  v<version>
━━━━━━━━━━━━━━━━━━━━━━━━
Model:        <primaryModel>
Price:        <suggestedPrice>
Rationale:    <pricingRationale>
Lead metric:  <revenueLeadIndicator>
Year 1 est:   <year1RevenueEstimate>
Confidence:   <confidence%>

Alternative Models
  • <model>
  • ...

Anti-Patterns to Avoid
  ✗ <antiPattern>
  ...

Recommendation
  <recommendation>
```

### `feasibility-report`
```
━━━━━━━━━━━━━━━━━━━━━━━━
  Feasibility Report: <title>  v<version>
━━━━━━━━━━━━━━━━━━━━━━━━
Complexity:     <buildComplexity>
Timeline:       <estimatedTimeline>
Team needed:    <teamRequirements>
Score:          <feasibilityScore>/100
Confidence:     <confidence%>
Recommendation: <recommendation>

Key Risks
  ⚠ <risk>
  ...

Technical Dependencies
  → <dependency>
  ...

Rationale
  <rationale>
```

### `mvp-roadmap`
```
━━━━━━━━━━━━━━━━━━━━━━━━
  MVP Roadmap: <title>  v<version>
━━━━━━━━━━━━━━━━━━━━━━━━
Total Duration: <totalDuration>
Resources:      <resourceRequirements>

Sprint Plan
  Sprint 1  Goal: <goal>
            Features: <features joined by ", ">
            Deliverable: <deliverable>
  Sprint 2  ...

Milestones
  Week <n>  <name>: <deliverable>
  ...

Launch Criteria
  ✓ <criterion>
  ...

Recommendation
  <recommendation>
```

### `build-plan`
```
━━━━━━━━━━━━━━━━━━━━━━━━
  Build Plan: <title>  v<version>
━━━━━━━━━━━━━━━━━━━━━━━━
Overview: <overview>
Budget:   <totalBudgetEstimate>

Phases
  Phase 1: <name> (<duration>)
    Objectives: <objectives>
    Exit criteria: <exitCriteria>
  ...

Team
  <role>  <hoursPerWeek>h/wk  <responsibilities>
  ...

External Dependencies
  → <dependency>

Risk Mitigation
  ⚠ <risk>  →  <mitigation>

Definition of Done
  <definitionOfDone>
```

---

## Step 5 — Export (if `--export`)

Create directory `artifacts/<opportunity-slug>/` where slug = title lowercased, spaces to hyphens.

Write `artifacts/<slug>/<type>.md` with the artifact rendered as clean, shareable markdown. Structure it as a proper document a founder would send to an investor or engineering team — use `##` headers, formatted tables for tech stack / API surface / team, and include the opportunity title, generation date, and overall score in a header block.

---

## After completion

Show:
```
Artifact: <type>  v<version>
Opportunity: <title>
Confidence: <n>%
<if exported>: Exported to artifacts/<slug>/<type>.md
```

If this is the first artifact generated for the opportunity, suggest the recommended generation order:
```
Recommended order for this opportunity:
  1. /add-artifact prd           ← defines what to build
  2. /add-artifact feasibility-report ← validates it's buildable
  3. /add-artifact monetization  ← defines how to charge
  4. /add-artifact architecture  ← defines how to build it
  5. /add-artifact mvp-roadmap   ← defines the sprint plan
  6. /add-artifact build-plan    ← produces the execution contract
```

---

## Notes

- The architecture agent reads the PRD artifact to extract `coreFeatures` and `mvpScope`. Run `prd` first or the architecture will have less context.
- The build plan agent reads both architecture and mvp-roadmap. It's last in the chain for a reason.
- `upsertOpportunityArtifact` auto-increments version — re-running always creates a new version, never overwrites.
- Rebuild order after scaffolding: `pnpm --filter @avs/types build && pnpm --filter @avs/agents build && pnpm --filter @avs/api typecheck`
