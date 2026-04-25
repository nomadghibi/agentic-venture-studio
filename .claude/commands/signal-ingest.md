# /signal-ingest

Create a test signal in the database and immediately run the discovery workflow on it. Replaces the 5-step manual process of using the UI to test a new signal type.

## Usage

```
/signal-ingest --content "<text>" [--source-type <type>] [--source-title "<title>"] [--source-url <url>] [--opportunity-id <id>] [--workspace-id <id>]
```

- `--content` (required): The signal text — the content excerpt that the discovery agent will analyze
- `--source-type` (default: `manual`): `reddit` | `twitter` | `linkedin` | `email` | `survey` | `manual` | `hacker_news`
- `--opportunity-id`: if provided, links the signal to an existing opportunity and updates its scores
- `--workspace-id`: required if `--opportunity-id` is given

If `$ARGUMENTS` is just plain text (no flags), treat the whole string as `--content`.

## Steps

### 1. Create the signal

Write and run a tsx script that calls `createSignal` from `@avs/db`:

```ts
import "dotenv/config";
import { createSignal } from "./packages/db/src/index.js";

const result = await createSignal({
  sourceType: "<source-type>",
  contentExcerpt: "<content>",
  sourceTitle: "<title or undefined>",
  sourceUrl: "<url or undefined>",
  opportunityId: "<opportunity-id or undefined>"
});

console.log(JSON.stringify(result, null, 2));
process.exit(0);
```

Run with: `npx tsx --tsconfig apps/api/tsconfig.json _tmp_signal_ingest.ts`

Show the created signal ID.

### 2. Run discovery

Using the signal ID from step 1, run the discovery workflow exactly as `/run-workflow discovery` does:

```ts
import "dotenv/config";
import { runDiscoveryWorkflow } from "./apps/api/src/workflows/discovery-workflow.js";

const result = await runDiscoveryWorkflow({
  signalId: "<signal-id>",
  opportunityId: "<opportunity-id or undefined>",
  workspaceId: "<workspace-id or undefined>"
});

console.log(JSON.stringify(result, null, 2));
process.exit(0);
```

### 3. Display results

```
Signal created: <uuid>
Source: <source-type>
Excerpt: "<first 80 chars>..."

Discovery Result
────────────────────────────────────
Status:           completed
Confidence:       78%
Needs escalation: No

Problem:          <problemStatement>
Target buyer:     <targetBuyer>
Pain intensity:   high
Evidence:         moderate
Recommendation:   advance
```

If `--opportunity-id` was given, also show which scores were updated and the new `overallScore`.

### 4. Cleanup

Delete both temp scripts.

## Notes

- The signal is written to the real database — use this against your dev/local DB only.
- If you want to test without linking to an opportunity, omit `--opportunity-id`. The signal is still created and run through discovery; scores just aren't updated anywhere.
