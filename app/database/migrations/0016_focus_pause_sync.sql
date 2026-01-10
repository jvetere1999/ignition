-- Migration: 0016_focus_pause_sync
-- Purpose: Ensure focus_pause_state table exists with proper structure for server sync
-- Context: Migrate from localStorage (focus_paused_state) to server-sourced state

BEGIN;

-- Create/update focus_pause_state table if not exists
CREATE TABLE IF NOT EXISTS focus_pause_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES focus_sessions(id) ON DELETE CASCADE,
  is_paused BOOLEAN NOT NULL DEFAULT FALSE,
  paused_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- One pause state per session
  UNIQUE(session_id)
);

-- Index for fast lookups by user + active session
CREATE INDEX IF NOT EXISTS idx_focus_pause_user_paused
  ON focus_pause_state(user_id, is_paused)
  WHERE is_paused = TRUE;

-- Index for active sessions
CREATE INDEX IF NOT EXISTS idx_focus_pause_active
  ON focus_pause_state(user_id, session_id);

COMMIT;
