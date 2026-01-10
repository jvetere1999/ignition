-- Migration: 0018_remove_localStorage_guardrails
-- Purpose: Enable DISABLE_MASS_LOCAL_PERSISTENCE flag enforcement
-- Context: All critical data now on server; localStorage only for cosmetic UI state

BEGIN;

-- Create feature flag table if not exists (for storage deprecation tracking)
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name VARCHAR(255) NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert storage-related flag
INSERT INTO feature_flags (flag_name, enabled, description)
VALUES (
  'DISABLE_MASS_LOCAL_PERSISTENCE',
  TRUE,
  'Forbid localStorage for behavior-affecting data; allow cosmetic only (theme, UI state)'
)
ON CONFLICT (flag_name) DO UPDATE
SET enabled = TRUE;

COMMIT;
