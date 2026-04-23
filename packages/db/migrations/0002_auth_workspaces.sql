CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_memberships (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash TEXT,
    ADD COLUMN IF NOT EXISTS default_workspace_id TEXT REFERENCES workspaces(id);

ALTER TABLE opportunities
    ADD COLUMN IF NOT EXISTS workspace_id TEXT REFERENCES workspaces(id);

ALTER TABLE ventures
    ADD COLUMN IF NOT EXISTS workspace_id TEXT REFERENCES workspaces(id);

INSERT INTO workspaces (id, name, slug, owner_user_id)
SELECT
    'ws-' || md5(u.id || '-default') AS id,
    CONCAT(COALESCE(NULLIF(TRIM(u.name), ''), 'Founder'), '''s Workspace') AS name,
    LOWER(REGEXP_REPLACE(COALESCE(NULLIF(TRIM(u.name), ''), 'founder'), '[^a-zA-Z0-9]+', '-', 'g'))
      || '-' || SUBSTRING(md5(u.id) FOR 6) AS slug,
    u.id AS owner_user_id
FROM users u
LEFT JOIN workspaces existing ON existing.owner_user_id = u.id
WHERE existing.id IS NULL;

INSERT INTO workspace_memberships (id, workspace_id, user_id, role)
SELECT
    'wm-' || md5(w.id || ':' || w.owner_user_id) AS id,
    w.id,
    w.owner_user_id,
    'owner'
FROM workspaces w
ON CONFLICT (workspace_id, user_id) DO NOTHING;

UPDATE users u
SET default_workspace_id = w.id
FROM workspaces w
WHERE w.owner_user_id = u.id
  AND u.default_workspace_id IS NULL;

UPDATE opportunities o
SET workspace_id = owner.default_workspace_id
FROM users owner
WHERE o.workspace_id IS NULL
  AND owner.id = o.owner_id
  AND owner.default_workspace_id IS NOT NULL;

UPDATE opportunities o
SET workspace_id = creator.default_workspace_id
FROM users creator
WHERE o.workspace_id IS NULL
  AND creator.id = o.created_by
  AND creator.default_workspace_id IS NOT NULL;

UPDATE opportunities o
SET workspace_id = fallback_workspace.id
FROM LATERAL (
  SELECT id
  FROM workspaces
  ORDER BY created_at ASC
  LIMIT 1
) fallback_workspace
WHERE o.workspace_id IS NULL;

UPDATE ventures v
SET workspace_id = o.workspace_id
FROM opportunities o
WHERE v.workspace_id IS NULL
  AND o.id = v.opportunity_id;

ALTER TABLE opportunities
    ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE ventures
    ALTER COLUMN workspace_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workspaces_owner_user_id ON workspaces(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_memberships_user_id ON workspace_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_opportunities_workspace_id ON opportunities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ventures_workspace_id ON ventures(workspace_id);
