-- Rollback: 0016_focus_pause_sync

BEGIN;

DROP INDEX IF EXISTS idx_focus_pause_active;
DROP INDEX IF EXISTS idx_focus_pause_user_paused;
DROP TABLE IF EXISTS focus_pause_state;

COMMIT;
