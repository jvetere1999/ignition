-- Adds vault lock audit events and rotation timestamps

ALTER TABLE vaults
  ADD COLUMN IF NOT EXISTS last_rotated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_rotation_due TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS vault_lock_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  locked_at TIMESTAMPTZ,
  lock_reason TEXT,
  device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_lock_events_vault_id
  ON vault_lock_events (vault_id);

CREATE INDEX IF NOT EXISTS idx_vault_lock_events_created_at
  ON vault_lock_events (created_at DESC);
