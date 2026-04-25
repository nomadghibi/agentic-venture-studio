# /agent-eval

Run an agent against one or more test inputs and evaluate output quality. Use this to safely iterate on prompts and catch regressions before deploying.

## Usage

```
/agent-eval <agent-name> [--input <inline-json>] [--fixture <fixture-file>] [--baseline]
```

- `<agent-name>`: `discovery` | `validation` | `feasibility` | `monetization` | `prd` | `architecture`
- `--input <json>`: inline test input as a JSON string
- `--fixture <path>`: path to a JSON file with an array of test inputs
- `--baseline`: save current outputs as the baseline snapshot to diff against in future runs
- With no `--input` or `--fixture`, look for fixtures at `packages/agents/src/fixtures/<agent-name>.json`

## Steps

### 1. Resolve inputs

Check for fixtures at `packages/agents/src/fixtures/<agent-name>.json`. Format is an array:
```json
[
  { "label": "strong signal", "input": { ...AgentInput fields... } },
  { "label": "weak signal",   "input": { ...AgentInput fields... } }
]
```
If the fixture file does not exist, create it with a single placeholder entry matching the agent's Input interface and tell the user to fill it in before re-running.

If `--input` is provided, use it as a single-item array with label `"inline"`.

### 2. Write a runner script

Write `_tmp_agent_eval.ts` at the repo root:

```ts
import "dotenv/config";
import { runAgent, <AgentName>Agent } from "./packages/agents/src/index.js";

const inputs = <paste the inputs array>;

for (const { label, input } of inputs) {
  console.log(`\n=== ${label} ===`);
  try {
    const result = await runAgent(<agentName>Agent, input, { correlationId: label });
    console.log(JSON.stringify({ label, confidence: result.confidence, needsEscalation: result.needsEscalation, output: result.output }, null, 2));
  } catch (err) {
    console.error(`FAILED: ${label}`, err);
  }
}
process.exit(0);
```

Agent import map (from `packages/agents/src/index.ts`):
- discovery → `discoveryAgent`
- validation → `validationAgent`
- feasibility → `feasibilityAgent`
- monetization → `monetizationAgent`
- prd → `prdAgent`
- architecture → `architectureAgent`

### 3. Execute

```bash
npx tsx --tsconfig apps/api/tsconfig.json _tmp_agent_eval.ts
```

### 4. Display results for each input

For each fixture:
```
=== <label> ===
Confidence:       82%  ✓  (threshold: 55%)
Needs escalation: No
Recommendation:   advance

Output fields:
  problemStatement  "SMB owners miss after-hours inbound calls..."
  targetBuyer       "HVAC business owner"
  painIntensity     high
  evidenceStrength  strong
```

Flag inputs where:
- `confidence < 0.55` → escalation risk
- `recommendation` is `reject` or `reconsider` — note whether that's expected
- Any output field is null/undefined

### 5. Baseline diff (if `--baseline` not set and baseline exists)

Load `packages/agents/src/fixtures/<agent-name>.baseline.json` and for each matching label, show what changed:
- Confidence: `0.71 → 0.82` (+11pp)
- Recommendation changed: `monitor → advance`
- New output field values that differ

### 6. Save baseline (if `--baseline` flag)

Write current outputs to `packages/agents/src/fixtures/<agent-name>.baseline.json`.

### 7. Cleanup

Delete `_tmp_agent_eval.ts`.

## Notes

- This skill calls the real Anthropic API — each run costs tokens. Keep fixture sets small (3-5 inputs per agent).
- Do not commit `.baseline.json` files automatically — let the user decide.
