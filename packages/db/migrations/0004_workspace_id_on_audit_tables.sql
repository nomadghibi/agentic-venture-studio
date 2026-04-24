-- Add workspace_id to decision_records and workflow_events so they can be
-- queried by workspace without joining through opportunities.

ALTER TABLE decision_records
  ADD COLUMN IF NOT EXISTS workspace_id TEXT REFERENCES workspaces(id);

ALTER TABLE workflow_events
  ADD COLUMN IF NOT EXISTS workspace_id TEXT REFERENCES workspaces(id);

-- Backfill from the linked opportunity on each table.
UPDATE decision_records dr
SET workspace_id = o.workspace_id
FROM opportunities o
WHERE dr.entity_type = 'opportunity'
  AND dr.entity_id = o.id
  AND dr.workspace_id IS NULL;

UPDATE workflow_events we
SET workspace_id = o.workspace_id
FROM opportunities o
WHERE we.entity_type = 'opportunity'
  AND we.entity_id = o.id
  AND we.workspace_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_decision_records_workspace_id ON decision_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workflow_events_workspace_id  ON workflow_events(workspace_id);
