# /opportunity-inspect

Pull a complete dossier for an opportunity: all 8 dimension scores, current stage, workflow event timeline, pending approvals, linked signals, and linked venture. Use this to debug a stuck opportunity or review how an agent scored it.

## Usage

```
/opportunity-inspect <opportunity-id> [--workspace-id <id>]
```

If `--workspace-id` is omitted, look it up from the DB: `SELECT workspace_id FROM opportunities WHERE id = $1`.

If no ID is given, list recent opportunities: `SELECT id, title, current_stage, overall_score, workspace_id FROM opportunities ORDER BY updated_at DESC LIMIT 15`.

## Steps

Write and run a tsx script `_tmp_inspect.ts` at the repo root that runs all queries in parallel using `Promise.all`:

```ts
import "dotenv/config";
import { db } from "./packages/db/src/client.js";

const id = "<opportunity-id>";
const workspaceId = "<workspace-id>";

const [opp, events, approvals, signals, venture] = await Promise.all([
  // opportunity
  db.query(`SELECT * FROM opportunities WHERE id = $1 AND workspace_id = $2`, [id, workspaceId]),
  // workflow events
  db.query(`SELECT event_type, stage_from, stage_to, payload, triggered_by, created_at
            FROM workflow_events WHERE entity_id = $1 ORDER BY created_at DESC LIMIT 30`, [id]),
  // approvals
  db.query(`SELECT approval_type, status, review_notes, requested_at, reviewed_at
            FROM approvals WHERE entity_id = $1 ORDER BY requested_at DESC`, [id]),
  // signals
  db.query(`SELECT s.id, s.source_type, LEFT(s.content_excerpt, 80) AS excerpt,
                   osl.relevance_score, osl.is_primary_evidence
            FROM opportunity_signal_links osl
            JOIN signals s ON s.id = osl.signal_id
            WHERE osl.opportunity_id = $1
            ORDER BY osl.is_primary_evidence DESC, osl.relevance_score DESC NULLS LAST`, [id]),
  // venture
  db.query(`SELECT id, name, tagline, stage FROM ventures WHERE opportunity_id = $1`, [id])
]);

console.log(JSON.stringify({ opp: opp.rows[0], events: events.rows, approvals: approvals.rows, signals: signals.rows, venture: venture.rows[0] ?? null }, null, 2));
await db.end();
```

Run: `npx tsx --tsconfig apps/api/tsconfig.json _tmp_inspect.ts`

## Display format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Opportunity: AI Front Desk for HVAC
  ID: 11111111-...
  Stage: validation  |  Status: active  |  Confidence: high
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scores (overall: 81.3)
  Pain            ████████░░  82
  Frequency       ██████░░░░  55
  Buyer Clarity   ████████░░  80
  WTP             ██████░░░░  55
  Feasibility     ░░░░░░░░░░   0  ← not yet scored
  Distribution    ░░░░░░░░░░   0
  Strategic Fit   ░░░░░░░░░░   0
  Portfolio Value ░░░░░░░░░░   0

Signals (2)
  ● [primary]  reddit  0.91  "We lose calls after 6pm and callbacks happe..."
  ○            manual  —     "Owner mentioned they tried a voicemail servi..."

Approvals
  build_approval   PENDING   requested 2026-04-20

Workflow Events (most recent first)
  2026-04-21  opportunity_stage_transition   discovery → validation
  2026-04-20  opportunity_agent_validated    decision=advance  confidence=0.78
  2026-04-18  opportunity_scored             overallScore=81.3  source=discovery_agent

Linked Venture
  HVAC Front Desk AI  (stage: live)  id: 55555555-...
```

Use ASCII bar charts for scores (10-char bar, each char = 10 points).
Mark unscored dimensions (score = 0 with no workflow event) clearly so it's obvious vs. a genuine score of 0.

## Cleanup

Delete `_tmp_inspect.ts` after running.
