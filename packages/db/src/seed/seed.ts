import { randomBytes, scryptSync } from "node:crypto";
import { db } from "../client.js";

const ids = {
  founder: "dev-founder",
  reviewer: "dev-product-lead",
  founderWorkspace: "ws-dev-founder",
  reviewerWorkspace: "ws-dev-product-lead",
  opportunityA: "11111111-1111-4111-8111-111111111111",
  opportunityB: "22222222-2222-4222-8222-222222222222",
  signalA: "33333333-3333-4333-8333-333333333333",
  approvalA: "44444444-4444-4444-8444-444444444444",
  ventureA: "55555555-5555-4555-8555-555555555555",
  runA: "66666666-6666-4666-8666-666666666666"
} as const;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

async function seed() {
  const founderPasswordHash = hashPassword("FounderPass!2026");
  const reviewerPasswordHash = hashPassword("ReviewerPass!2026");
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    await client.query(
    `
      INSERT INTO users (id, name, email, role, status, password_hash)
      VALUES
        ($1, 'Dev Founder', 'founder@agentic.local', 'founder', 'active', $3),
        ($2, 'Dev Product Lead', 'product@agentic.local', 'product_lead', 'active', $4)
      ON CONFLICT (id) DO UPDATE SET
        password_hash = COALESCE(users.password_hash, EXCLUDED.password_hash),
        updated_at = NOW()
    `,
    [ids.founder, ids.reviewer, founderPasswordHash, reviewerPasswordHash]
  );

    await client.query(
    `
      INSERT INTO workspaces (id, name, slug, owner_user_id)
      VALUES
        ($1, 'Founder Validation Desk', 'founder-validation-desk', $3),
        ($2, 'Product Review Desk', 'product-review-desk', $4)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        updated_at = NOW()
    `,
    [ids.founderWorkspace, ids.reviewerWorkspace, ids.founder, ids.reviewer]
  );

    await client.query(
    `
      INSERT INTO workspace_memberships (id, workspace_id, user_id, role)
      VALUES
        ('wm-dev-founder-owner', $1, $3, 'owner'),
        ('wm-dev-reviewer-owner', $2, $4, 'owner')
      ON CONFLICT (workspace_id, user_id) DO NOTHING
    `,
    [ids.founderWorkspace, ids.reviewerWorkspace, ids.founder, ids.reviewer]
  );

    await client.query(
    `
      UPDATE users
      SET default_workspace_id = CASE
        WHEN id = $1 THEN $3
        WHEN id = $2 THEN $4
        ELSE default_workspace_id
      END
      WHERE id IN ($1, $2)
    `,
    [ids.founder, ids.reviewer, ids.founderWorkspace, ids.reviewerWorkspace]
  );

    await client.query(
    `
      INSERT INTO opportunities (
        id,
        workspace_id,
        title,
        problem_statement,
        target_buyer,
        industry,
        status,
        current_stage,
        overall_score,
        confidence_level,
        created_by,
        owner_id
      )
      VALUES
        (
          $1,
          $5,
          'AI Front Desk for HVAC',
          'HVAC businesses miss after-hours leads and lose revenue.',
          'HVAC business owner',
          'home_services',
          'active',
          'validation',
          81.3,
          'high',
          $3,
          $3
        ),
        (
          $2,
          $6,
          'Missed-call Recovery for Roofers',
          'Roofing contractors fail to follow up on inbound calls quickly.',
          'Roofing business owner',
          'home_services',
          'active',
          'feasibility',
          76.4,
          'medium',
          $4,
          $4
        )
      ON CONFLICT (id) DO UPDATE SET
        workspace_id = EXCLUDED.workspace_id,
        overall_score = EXCLUDED.overall_score,
        current_stage = EXCLUDED.current_stage,
        updated_at = NOW()
    `,
    [
      ids.opportunityA,
      ids.opportunityB,
      ids.founder,
      ids.reviewer,
      ids.founderWorkspace,
      ids.reviewerWorkspace
    ]
  );

    await client.query(
    `
      INSERT INTO signals (
        id,
        source_type,
        source_url,
        source_title,
        content_excerpt,
        captured_at
      )
      VALUES (
        $1,
        'reddit',
        'https://reddit.com/r/hvac',
        'Missed call pain discussion',
        'We lose calls after 6pm and callbacks happen too late.',
        NOW()
      )
      ON CONFLICT (id) DO NOTHING
    `,
    [ids.signalA]
  );

    await client.query(
    `
      INSERT INTO opportunity_signal_links (
        id,
        opportunity_id,
        signal_id,
        relevance_score,
        is_primary_evidence
      )
      VALUES ($1, $2, $3, 0.91, true)
      ON CONFLICT (id) DO NOTHING
    `,
    ["77777777-7777-4777-8777-777777777777", ids.opportunityA, ids.signalA]
  );

    await client.query(
    `
      INSERT INTO approvals (
        id,
        entity_type,
        entity_id,
        approval_type,
        status,
        requested_by
      )
      VALUES ($1, 'opportunity', $2, 'build_approval', 'pending', $3)
      ON CONFLICT (id) DO NOTHING
    `,
    [ids.approvalA, ids.opportunityA, ids.founder]
  );

    await client.query(
    `
      INSERT INTO ventures (
        id,
        workspace_id,
        opportunity_id,
        name,
        tagline,
        business_model,
        target_market,
        stage,
        owner_id
      )
      VALUES (
        $1,
        $4,
        $2,
        'HVAC Front Desk AI',
        'Never miss a booked job',
        'subscription',
        'SMB HVAC',
        'live',
        $3
      )
      ON CONFLICT (id) DO UPDATE SET
        workspace_id = EXCLUDED.workspace_id,
        stage = EXCLUDED.stage,
        updated_at = NOW()
    `,
    [ids.ventureA, ids.opportunityA, ids.founder, ids.founderWorkspace]
  );

    await client.query(
    `
      INSERT INTO agent_runs (
        id,
        agent_name,
        entity_type,
        entity_id,
        status,
        confidence_level,
        started_at,
        completed_at
      )
      VALUES (
        $1,
        'Problem Validation Agent',
        'opportunity',
        $2,
        'completed',
        'low',
        NOW() - INTERVAL '5 minutes',
        NOW() - INTERVAL '4 minutes'
      )
      ON CONFLICT (id) DO NOTHING
    `,
    [ids.runA, ids.opportunityB]
  );

    await client.query("COMMIT");
    console.log("Seed complete.");
    console.log("Founder login: founder@agentic.local / FounderPass!2026");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await db.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
