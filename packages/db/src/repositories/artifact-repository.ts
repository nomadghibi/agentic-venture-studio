import { db } from "../client.js";

type ArtifactRow = {
  id: string;
  artifact_type: string;
  title: string;
  version: number;
  status: string;
  content: string | null;
  created_at: string;
};

export type ArtifactRecord = {
  id: string;
  artifactType: string;
  title: string;
  version: number;
  status: string;
  content: string | null;
  createdAt: string;
};

function mapArtifact(row: ArtifactRow): ArtifactRecord {
  return {
    id: row.id,
    artifactType: row.artifact_type,
    title: row.title,
    version: row.version,
    status: row.status,
    content: row.content,
    createdAt: row.created_at
  };
}

export async function upsertOpportunityArtifact(
  opportunityId: string,
  workspaceId: string,
  artifactType: string,
  title: string,
  content: string
): Promise<string> {
  const existing = await db.query<{ version: number }>(
    `SELECT a.version FROM artifacts a
     JOIN opportunities o ON o.id = a.opportunity_id
     WHERE a.opportunity_id = $1 AND o.workspace_id = $2 AND a.artifact_type = $3
     ORDER BY a.version DESC LIMIT 1`,
    [opportunityId, workspaceId, artifactType]
  );

  const nextVersion = existing.rows[0] ? existing.rows[0].version + 1 : 1;
  const id = crypto.randomUUID();

  await db.query(
    `INSERT INTO artifacts
       (id, opportunity_id, artifact_type, title, version, storage_uri, content, status)
     VALUES ($1, $2, $3, $4, $5, 'inline', $6, 'published')`,
    [id, opportunityId, artifactType, title, nextVersion, content]
  );

  return id;
}

export async function getLatestOpportunityArtifact(
  opportunityId: string,
  workspaceId: string,
  artifactType: string
): Promise<ArtifactRecord | null> {
  const result = await db.query<ArtifactRow>(
    `SELECT a.id, a.artifact_type, a.title, a.version, a.status, a.content,
            a.created_at::text AS created_at
     FROM artifacts a
     JOIN opportunities o ON o.id = a.opportunity_id
     WHERE a.opportunity_id = $1 AND o.workspace_id = $2
       AND a.artifact_type = $3 AND a.content IS NOT NULL
     ORDER BY a.version DESC LIMIT 1`,
    [opportunityId, workspaceId, artifactType]
  );

  return result.rows[0] ? mapArtifact(result.rows[0]) : null;
}
