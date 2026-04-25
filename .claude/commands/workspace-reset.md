# /workspace-reset

Drop all data for a workspace and re-seed it with a realistic fixture set covering all pipeline stages. Use this before demos or to reset a cluttered dev workspace.

## Usage

```
/workspace-reset [--workspace-id <id>] [--dev]
```

- `--workspace-id <id>`: reset a specific workspace by ID
- `--dev`: shorthand to reset the seed workspace (`ws-dev-founder`) defined in `packages/db/src/seed/seed.ts`
- With no args: list available workspaces and ask which to reset

**This is destructive.** Always confirm with the user before running any DELETE statements.

## Steps

### 1. Identify the workspace

If no args: query `SELECT id, name, slug FROM workspaces ORDER BY created_at DESC` and present the list. Ask the user to confirm which workspace to reset.

If `--dev`: use workspace ID `ws-dev-founder`.

### 2. Show what will be deleted

Before deleting anything, run a summary query:
```sql
SELECT
  (SELECT COUNT(*) FROM opportunities WHERE workspace_id = $1) AS opportunities,
  (SELECT COUNT(*) FROM signals s
   JOIN opportunity_signal_links osl ON osl.signal_id = s.id
   JOIN opportunities o ON o.id = osl.opportunity_id
   WHERE o.workspace_id = $1) AS signals,
  (SELECT COUNT(*) FROM approvals WHERE entity_id IN (
     SELECT id FROM opportunities WHERE workspace_id = $1)) AS approvals,
  (SELECT COUNT(*) FROM ventures WHERE workspace_id = $1) AS ventures,
  (SELECT COUNT(*) FROM workflow_events WHERE workspace_id = $1) AS workflow_events
```

Present the counts and say explicitly: "This will permanently delete all the above records for workspace `<name>`. Type YES to continue." Wait for confirmation.

### 3. Delete in dependency order

Write a tsx script `_tmp_workspace_reset.ts`:

```ts
import "dotenv/config";
import { db } from "./packages/db/src/client.js";

const workspaceId = "<id>";

const client = await db.connect();
try {
  await client.query("BEGIN");

  // 1. workflow_events (references opportunity entity_id)
  await client.query(`DELETE FROM workflow_events WHERE workspace_id = $1`, [workspaceId]);

  // 2. decision_records
  await client.query(`DELETE FROM decision_records WHERE workspace_id = $1`, [workspaceId]);

  // 3. approvals
  await client.query(`DELETE FROM approvals WHERE entity_id IN (
    SELECT id FROM opportunities WHERE workspace_id = $1)`, [workspaceId]);

  // 4. agent_runs
  await client.query(`DELETE FROM agent_runs WHERE entity_id IN (
    SELECT id FROM opportunities WHERE workspace_id = $1)`, [workspaceId]);

  // 5. opportunity_signal_links + signals (signals have no workspace_id — delete orphans)
  await client.query(`DELETE FROM opportunity_signal_links WHERE opportunity_id IN (
    SELECT id FROM opportunities WHERE workspace_id = $1)`, [workspaceId]);

  // 6. artifacts
  await client.query(`DELETE FROM artifacts WHERE opportunity_id IN (
    SELECT id FROM opportunities WHERE workspace_id = $1)`, [workspaceId]);

  // 7. ventures
  await client.query(`DELETE FROM ventures WHERE workspace_id = $1`, [workspaceId]);

  // 8. opportunities
  await client.query(`DELETE FROM opportunities WHERE workspace_id = $1`, [workspaceId]);

  await client.query("COMMIT");
  console.log("Workspace cleared.");
} catch (err) {
  await client.query("ROLLBACK");
  throw err;
} finally {
  client.release();
  await db.end();
}
```

Run: `npx tsx --tsconfig apps/api/tsconfig.json _tmp_workspace_reset.ts`

### 4. Re-seed

After successful deletion, run the standard seed:

```bash
pnpm --filter @avs/db db:seed
```

If `--workspace-id` was a custom workspace (not the dev seed workspace), the standard seed won't cover it. In that case, tell the user the workspace is cleared and ask what seed data they want inserted, then create a custom seed script inline.

### 5. Report

```
Workspace reset: Founder Validation Desk (ws-dev-founder)

Deleted:
  2 opportunities
  3 signals
  1 approval
  1 venture
  4 workflow events

Re-seeded with:
  2 opportunities (AI Front Desk for HVAC @ validation, Missed-call Recovery for Roofers @ feasibility)
  1 signal
  1 approval (build_approval, pending)
  1 venture (HVAC Front Desk AI, live)

Login: founder@agentic.local / FounderPass!2026
```

### 6. Cleanup

Delete `_tmp_workspace_reset.ts`.

## Notes

- Orphaned signals (linked to no opportunities in any workspace) are not cleaned up by this skill — that's intentional to avoid accidentally deleting shared signals.
- The `schema_migrations` table is never touched.
