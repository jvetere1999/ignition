-- Migration 0013: Platform
-- Tables: feedback, ideas, infobase_entries, onboarding_flows, onboarding_steps,
--         user_onboarding_state, user_onboarding_responses, user_interests,
--         user_settings, inbox_items, user_references, feature_flags

-- =============================================================================
-- FEEDBACK
-- =============================================================================
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    feedback_type TEXT NOT NULL,
    category TEXT,
    title TEXT,
    content TEXT NOT NULL,
    rating INTEGER,
    page_url TEXT,
    user_agent TEXT,
    metadata JSONB,
    status TEXT NOT NULL DEFAULT 'new',
    response TEXT,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX feedback_user_idx ON feedback(user_id);
CREATE INDEX feedback_type_idx ON feedback(feedback_type);
CREATE INDEX feedback_status_idx ON feedback(status);

-- =============================================================================
-- IDEAS
-- =============================================================================
CREATE TABLE ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT[],
    status TEXT NOT NULL DEFAULT 'new',
    priority INTEGER NOT NULL DEFAULT 0,
    related_track_id UUID REFERENCES reference_tracks(id) ON DELETE SET NULL,
    audio_r2_key TEXT,
    attachments JSONB,
    metadata JSONB,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ideas_user_idx ON ideas(user_id);
CREATE INDEX ideas_category_idx ON ideas(category);
CREATE INDEX ideas_status_idx ON ideas(status);

-- =============================================================================
-- INFOBASE_ENTRIES
-- =============================================================================
CREATE TABLE infobase_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content_markdown TEXT,
    summary TEXT,
    tags TEXT[],
    source_url TEXT,
    source_type TEXT,
    related_topic_id UUID REFERENCES learn_topics(id) ON DELETE SET NULL,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX infobase_entries_user_idx ON infobase_entries(user_id);
CREATE INDEX infobase_entries_type_idx ON infobase_entries(entry_type);
CREATE INDEX infobase_entries_tags_idx ON infobase_entries USING GIN(tags);

-- =============================================================================
-- ONBOARDING_FLOWS
-- =============================================================================
CREATE TABLE onboarding_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    target_audience TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed onboarding flows
INSERT INTO onboarding_flows (key, name, description, target_audience, sort_order) VALUES
    ('new_user', 'New User Onboarding', 'Welcome flow for new users', 'all', 1),
    ('producer', 'Music Producer Path', 'Tailored for music producers', 'producer', 2),
    ('musician', 'Musician Path', 'Tailored for instrumentalists', 'musician', 3),
    ('learner', 'Music Learner Path', 'Tailored for music students', 'learner', 4);

-- =============================================================================
-- ONBOARDING_STEPS
-- =============================================================================
CREATE TABLE onboarding_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flow_id UUID NOT NULL REFERENCES onboarding_flows(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    step_type TEXT NOT NULL,
    config_json JSONB,
    requires_response BOOLEAN NOT NULL DEFAULT false,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_skippable BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(flow_id, key)
);

CREATE INDEX onboarding_steps_flow_idx ON onboarding_steps(flow_id);

-- =============================================================================
-- USER_ONBOARDING_STATE
-- =============================================================================
CREATE TABLE user_onboarding_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    flow_id UUID NOT NULL REFERENCES onboarding_flows(id) ON DELETE CASCADE,
    current_step_id UUID REFERENCES onboarding_steps(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'in_progress',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    skipped_steps UUID[],
    UNIQUE(user_id, flow_id)
);

CREATE INDEX user_onboarding_state_user_idx ON user_onboarding_state(user_id);

-- =============================================================================
-- USER_ONBOARDING_RESPONSES
-- =============================================================================
CREATE TABLE user_onboarding_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES onboarding_steps(id) ON DELETE CASCADE,
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, step_id)
);

CREATE INDEX user_onboarding_responses_user_idx ON user_onboarding_responses(user_id);

-- =============================================================================
-- USER_INTERESTS (DEC-009: IMPLEMENT)
-- =============================================================================
CREATE TABLE user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interest_type TEXT NOT NULL,
    interest_key TEXT NOT NULL,
    interest_value TEXT,
    score REAL NOT NULL DEFAULT 1.0,
    source TEXT NOT NULL DEFAULT 'explicit',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, interest_type, interest_key)
);

CREATE INDEX user_interests_user_idx ON user_interests(user_id);
CREATE INDEX user_interests_type_idx ON user_interests(interest_type);

-- =============================================================================
-- USER_SETTINGS
-- =============================================================================
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'dark',
    language TEXT NOT NULL DEFAULT 'en',
    timezone TEXT NOT NULL DEFAULT 'UTC',
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    email_notifications JSONB,
    push_notifications JSONB,
    privacy_settings JSONB,
    display_settings JSONB,
    focus_settings JSONB,
    workout_settings JSONB,
    sync_settings JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX user_settings_user_idx ON user_settings(user_id);

-- =============================================================================
-- INBOX_ITEMS
-- =============================================================================
CREATE TABLE inbox_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    action_url TEXT,
    action_data JSONB,
    priority INTEGER NOT NULL DEFAULT 0,
    is_read BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX inbox_items_user_idx ON inbox_items(user_id);
CREATE INDEX inbox_items_type_idx ON inbox_items(item_type);
CREATE INDEX inbox_items_read_idx ON inbox_items(is_read);
CREATE INDEX inbox_items_created_idx ON inbox_items(created_at DESC);

-- =============================================================================
-- USER_REFERENCES
-- =============================================================================
-- Junction table for user-curated reference track collections
CREATE TABLE user_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES reference_tracks(id) ON DELETE CASCADE,
    collection_name TEXT,
    notes TEXT,
    tags TEXT[],
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, track_id, collection_name)
);

CREATE INDEX user_references_user_idx ON user_references(user_id);
CREATE INDEX user_references_track_idx ON user_references(track_id);

-- =============================================================================
-- FEATURE_FLAGS (DEC-010: DEFER - table only, no code)
-- =============================================================================
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    rollout_percentage INTEGER NOT NULL DEFAULT 0,
    user_whitelist UUID[],
    user_blacklist UUID[],
    config JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed some initial feature flags (all disabled per DEC-010)
INSERT INTO feature_flags (key, name, description, is_enabled, rollout_percentage) VALUES
    ('ai_recommendations', 'AI Recommendations', 'Enable AI-powered recommendations', false, 0),
    ('social_features', 'Social Features', 'Enable social/community features', false, 0),
    ('advanced_analytics', 'Advanced Analytics', 'Enable advanced user analytics', false, 0),
    ('beta_features', 'Beta Features', 'Enable experimental beta features', false, 0);
