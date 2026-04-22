import { db } from "../client.js";

const ids = {
  founder: "dev-founder",
  reviewer: "dev-product-lead",
  opportunityA: "11111111-1111-4111-8111-111111111111",
  opportunityB: "22222222-2222-4222-8222-222222222222",
  signalA: "33333333-3333-4333-8333-333333333333",
  approvalA: "44444444-4444-4444-8444-444444444444",
  ventureA: "55555555-5555-4555-8555-555555555555",
  runA: "66666666-6666-4666-8666-666666666666"
} as const;

async function seed() {
  await db.query("BEGIN");

  await db.query(
    `
      INSERT INTO users (id, name, email, role, status)
      VALUES
        ($1, 'Dev Founder', 'founder@agentic.local', 'founder', 'active'),
        ($2, 'Dev Product Lead', 'product@agentic.local', 'product_lead', 'active')
      ON CONFLICT (id) DO NOTHING
    `,
    [ids.founder, ids.reviewer]
  );

  await db.query(
    `
      INSERT INTO opportunities (
        id,
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
        overall_score = EXCLUDED.overall_score,
        current_stage = EXCLUDED.current_stage,
        updated_at = NOW()
    `,
    [ids.opportunityA, ids.opportunityB, ids.founder, ids.reviewer]
  );

  await db.query(
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

  await db.query(
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

  await db.query(
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

  await db.query(
    `
      INSERT INTO ventures (
        id,
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
        $2,
        'HVAC Front Desk AI',
        'Never miss a booked job',
        'subscription',
        'SMB HVAC',
        'live',
        $3
      )
      ON CONFLICT (id) DO NOTHING
    `,
    [ids.ventureA, ids.opportunityA, ids.founder]
  );

  await db.query(
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

  await db.query("COMMIT");
  await db.end();
  console.log("Seed complete.");
}

seed().catch((error) => {
  void db.query("ROLLBACK").catch(() => undefined);
  console.error(error);
  process.exit(1);
});
