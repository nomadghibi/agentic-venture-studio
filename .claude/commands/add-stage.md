# /add-stage

Add a new stage to the opportunity pipeline. Updates every location that must stay in sync: type enum, stage order map, approval gate config, transition guard, and a DB migration for the enum value.

## Usage

```
/add-stage <stage-name> --after <existing-stage> [--approval-type <type>]
```

- `<stage-name>`: lowercase kebab or snake, e.g. `pricing-review` or `pricing_review` (normalized to snake_case for DB, camelCase for TS)
- `--after <stage>`: which existing stage this new stage comes after in the linear flow. Must be one of the current `linearFlow` values in `opportunity-logic.ts`.
- `--approval-type <type>`: if this stage should trigger an approval request, the approval type string (e.g. `pricing_approval`). Omit for no approval gate.

## Files to update

### 1. `packages/types/src/enums/opportunity.ts`

Add the new stage to `OpportunityStageValues` in the correct position (after `--after`):

```ts
export const OpportunityStageValues = [
  "discovery",
  "validation",
  // ... existing stages in order ...
  "<new-stage>",  // add here
  // ... rest ...
] as const;
```

### 2. `apps/api/src/services/opportunity-logic.ts`

a) Add the new stage to `linearFlow` in the same position:
```ts
const linearFlow: OpportunityStage[] = [
  "discovery",
  "validation",
  // ...
  "<new-stage>",  // add after --after value
  // ...
];
```

b) If `--approval-type` was given, add to `approvalTypeForStage`:
```ts
if (stage === "<new-stage>") return "<approval-type>";
```

No changes needed to `assertAllowedStageTransition` — it derives allowed transitions from `stageOrder` automatically.

### 3. DB migration

Create a new migration using the `/db-migrate` logic (but inline — don't call that skill recursively):

Find the next migration number, create `packages/db/migrations/<NNNN>_add_<stage_name>_stage.sql`:

```sql
-- Migration: <NNNN>_add_<stage_name>_stage.sql
-- Adds '<new-stage>' to the opportunity_stage enum and inserts it into the linearFlow position.

ALTER TYPE opportunity_stage ADD VALUE IF NOT EXISTS '<new-stage>' AFTER '<after-stage>';
```

**Important:** PostgreSQL `ALTER TYPE ... ADD VALUE` cannot run inside a transaction block. The migration runner uses plain `db.query(sql)` per file without wrapping in a transaction, so this is safe as-is. Do NOT wrap in `BEGIN/COMMIT`.

Then apply the migration: `pnpm --filter @avs/db db:migrate`

### 4. Rebuild packages

```bash
pnpm --filter @avs/types build
pnpm --filter @avs/db build
pnpm --filter @avs/agents build
pnpm --filter @avs/api typecheck
```

Stop and report any TypeScript errors before continuing.

## After completion

Show a summary:
```
New stage: <stage-name>
Inserted after: <after-stage>
Approval gate: <type or "none">

Files changed:
  packages/types/src/enums/opportunity.ts
  apps/api/src/services/opportunity-logic.ts
  packages/db/migrations/<NNNN>_add_<stage_name>_stage.sql (applied)

Next steps:
  - If this stage should trigger an AI workflow, run /add-workflow <name> --stage <stage-name>
  - Update the frontend stage display in apps/web/src/features/workspace/WorkspaceMvpControl.tsx if needed
```

## Safety notes

- Check that `--after` is a valid existing stage before making any changes. If not found in `linearFlow`, abort and list valid options.
- `ALTER TYPE ... ADD VALUE` is not transactional in PostgreSQL — it cannot be rolled back. Confirm with the user before running the migration if any destructive operation would occur.
