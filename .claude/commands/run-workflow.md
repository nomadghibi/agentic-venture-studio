# /run-workflow

Manually trigger an AVS AI workflow against real DB data and display the full structured output. Use this for testing agent behavior without going through the UI.

## Usage

```
/run-workflow <workflow> [--signal-id <id>] [--opportunity-id <id>] [--workspace-id <id>]
```

**Workflows:** `discovery` | `validation` | `feasibility` | `monetization` | `prd` | `architecture`

- `discovery` requires `--signal-id`. Optionally takes `--opportunity-id` and `--workspace-id` to update scores.
- All others require `--opportunity-id` and `--workspace-id`.

## Steps

1. **Parse the args** from `$ARGUMENTS`. Extract workflow name and any `--flag value` pairs. If required args are missing, query the DB to show available records:
   - For signal-id: `SELECT id, source_type, LEFT(content_excerpt, 60) FROM signals ORDER BY created_at DESC LIMIT 10`
   - For opportunity-id: `SELECT id, title, current_stage, workspace_id FROM opportunities ORDER BY created_at DESC LIMIT 10`
   Run these queries via `pnpm --filter @avs/db db:migrate 2>/dev/null; psql $DATABASE_URL -c "<query>"` or by writing a small tsx script that uses the `@avs/db` client.

2. **Write a runner script** to `_tmp_run_workflow.ts` at the repo root with this structure:

   ```ts
   import "dotenv/config";
   // import the appropriate workflow function
   import { runXxxWorkflow } from "./apps/api/src/workflows/xxx-workflow.js";

   const result = await runXxxWorkflow({ /* parsed args */ });
   console.log(JSON.stringify(result, null, 2));
   process.exit(0);
   ```

   Import path mapping:
   - discovery → `./apps/api/src/workflows/discovery-workflow.js` → `runDiscoveryWorkflow`
   - validation → `./apps/api/src/workflows/validation-workflow.js` → `runValidationWorkflow`
   - feasibility → `./apps/api/src/workflows/feasibility-workflow.js` → `runFeasibilityWorkflow`
   - monetization → `./apps/api/src/workflows/monetization-workflow.js` → `runMonetizationWorkflow`
   - prd → `./apps/api/src/workflows/prd-workflow.js` → `runPrdWorkflow`
   - architecture → `./apps/api/src/workflows/architecture-workflow.js` → `runArchitectureWorkflow`

   Load `.env` from the repo root — the config in `apps/api/src/config/env.ts` checks both `process.cwd()/.env` and `../../.env` so running from root picks it up automatically.

3. **Execute** the script:
   ```bash
   cd /path/to/repo && npx tsx --tsconfig apps/api/tsconfig.json _tmp_run_workflow.ts
   ```

4. **Display the output** in a readable format:
   - `status`: completed / skipped
   - `confidence`: formatted as percentage (e.g. `0.82 → 82%`)
   - `needsEscalation`: flag clearly if true
   - All output fields from the agent, labelled and formatted (not raw JSON)

5. **Delete the temp file** after execution.

6. If the workflow fails, show the full error and suggest likely causes (missing env var, record not found, agent API error).
