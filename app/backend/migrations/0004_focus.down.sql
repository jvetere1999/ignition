-- Down migration for 0004_focus.sql

DROP TRIGGER IF EXISTS update_focus_libraries_updated_at ON focus_libraries;
DROP TRIGGER IF EXISTS update_focus_pause_state_updated_at ON focus_pause_state;

DROP TABLE IF EXISTS focus_library_tracks;
DROP TABLE IF EXISTS focus_libraries;
DROP TABLE IF EXISTS focus_pause_state;
DROP TABLE IF EXISTS focus_sessions;
