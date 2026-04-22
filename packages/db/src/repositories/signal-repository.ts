import type { OpportunitySignalLink, Signal, SignalCreateInput } from "@avs/types";
import type { PoolClient } from "pg";
import { db } from "../client.js";

type SignalRow = {
  id: string;
  source_type: string;
  source_url: string | null;
  source_title: string | null;
  content_excerpt: string;
  created_at: string;
};

type OpportunitySignalLinkRow = {
  signal_id: string;
  opportunity_id: string;
  relevance_score: number | string | null;
  is_primary_evidence: boolean;
};

type SignalWithLinkRow = SignalRow & OpportunitySignalLinkRow;

type CreatedSignalResult = {
  signal: Signal;
  link?: OpportunitySignalLink;
};

function mapSignal(row: SignalRow): Signal {
  return {
    id: row.id,
    sourceType: row.source_type,
    ...(row.source_url ? { sourceUrl: row.source_url } : {}),
    ...(row.source_title ? { sourceTitle: row.source_title } : {}),
    contentExcerpt: row.content_excerpt,
    createdAt: row.created_at
  };
}

function mapLink(row: OpportunitySignalLinkRow): OpportunitySignalLink {
  return {
    signalId: row.signal_id,
    opportunityId: row.opportunity_id,
    ...(row.relevance_score == null
      ? {}
      : { relevanceScore: Number(row.relevance_score) }),
    isPrimaryEvidence: row.is_primary_evidence
  };
}

async function insertSignal(client: PoolClient, input: SignalCreateInput): Promise<Signal> {
  const result = await client.query<SignalRow>(
    `
      INSERT INTO signals (
        id,
        source_type,
        source_url,
        source_title,
        content_excerpt,
        captured_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING
        id,
        source_type,
        source_url,
        source_title,
        content_excerpt,
        created_at::text AS created_at
    `,
    [
      crypto.randomUUID(),
      input.sourceType,
      input.sourceUrl ?? null,
      input.sourceTitle ?? null,
      input.contentExcerpt
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to create signal");
  }

  return mapSignal(row);
}

async function insertSignalLink(
  client: PoolClient,
  signalId: string,
  input: SignalCreateInput
): Promise<OpportunitySignalLink> {
  const result = await client.query<OpportunitySignalLinkRow>(
    `
      INSERT INTO opportunity_signal_links (
        id,
        opportunity_id,
        signal_id,
        relevance_score,
        is_primary_evidence
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING signal_id, opportunity_id, relevance_score, is_primary_evidence
    `,
    [
      crypto.randomUUID(),
      input.opportunityId,
      signalId,
      input.relevanceScore ?? null,
      input.isPrimaryEvidence ?? false
    ]
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to link signal to opportunity");
  }

  return mapLink(row);
}

export async function createSignal(input: SignalCreateInput): Promise<CreatedSignalResult> {
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const signal = await insertSignal(client, input);

    let link: OpportunitySignalLink | undefined;
    if (input.opportunityId) {
      link = await insertSignalLink(client, signal.id, input);
    }

    await client.query("COMMIT");
    return link ? { signal, link } : { signal };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export type SignalWithLink = Signal & {
  relevanceScore?: number;
  isPrimaryEvidence: boolean;
};

export async function listSignalsForOpportunity(opportunityId: string): Promise<SignalWithLink[]> {
  const result = await db.query<SignalWithLinkRow>(
    `
      SELECT
        s.id,
        s.source_type,
        s.source_url,
        s.source_title,
        s.content_excerpt,
        s.created_at::text AS created_at,
        osl.signal_id,
        osl.opportunity_id,
        osl.relevance_score,
        osl.is_primary_evidence
      FROM opportunity_signal_links osl
      JOIN signals s ON s.id = osl.signal_id
      WHERE osl.opportunity_id = $1
      ORDER BY osl.created_at DESC
    `,
    [opportunityId]
  );

  return result.rows.map((row) => ({
    ...mapSignal(row),
    ...(row.relevance_score == null
      ? {}
      : { relevanceScore: Number(row.relevance_score) }),
    isPrimaryEvidence: row.is_primary_evidence
  }));
}
