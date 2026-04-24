-- Allow artifacts to store content inline (no external storage required for generated text).
-- storage_uri defaults to 'inline' for agent-generated artifacts.

ALTER TABLE artifacts
  ADD COLUMN IF NOT EXISTS content TEXT,
  ALTER COLUMN storage_uri SET DEFAULT 'inline';
