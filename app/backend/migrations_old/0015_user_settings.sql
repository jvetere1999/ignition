-- Migration: 0015_user_settings
-- Purpose: Create user_settings table for server-side settings (theme, accessibility, UI prefs)
-- Context: Part of stateless/memoryless sync initiative (D1 deprecated, PostgreSQL only)

BEGIN;

-- Create user_settings table (user-scoped key-value pairs)
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL DEFAULT 'null'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraint: one value per user per key
  UNIQUE(user_id, key)
);

-- Index for fast lookups by user_id
CREATE INDEX idx_user_settings_user_id 
  ON user_settings(user_id);

-- Index for admin queries (all settings for a user)
CREATE INDEX idx_user_settings_user_key 
  ON user_settings(user_id, key);

COMMIT;
