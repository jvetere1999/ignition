-- Migration 0006: Quests
-- Tables: universal_quests, user_quests, user_quest_progress

-- =============================================================================
-- UNIVERSAL_QUESTS (System-defined quests)
-- =============================================================================
CREATE TABLE universal_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    quest_type TEXT NOT NULL,
    category TEXT,
    requirements JSONB,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    coin_reward INTEGER NOT NULL DEFAULT 0,
    skill_key TEXT,
    skill_star_reward INTEGER NOT NULL DEFAULT 0,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurrence_period TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX universal_quests_type_idx ON universal_quests(quest_type);
CREATE INDEX universal_quests_category_idx ON universal_quests(category);
CREATE INDEX universal_quests_active_idx ON universal_quests(is_active) WHERE is_active = true;
CREATE INDEX universal_quests_key_idx ON universal_quests(key) WHERE key IS NOT NULL;

CREATE TRIGGER update_universal_quests_updated_at
    BEFORE UPDATE ON universal_quests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed some universal quests
INSERT INTO universal_quests (key, name, description, quest_type, category, requirements, xp_reward, coin_reward, skill_key, skill_star_reward, sort_order) VALUES
    ('daily_focus', 'Daily Focus', 'Complete 25 minutes of focused work', 'daily', 'focus', '{"type": "focus_minutes", "target": 25}'::jsonb, 50, 25, 'focus', 1, 1),
    ('habit_builder', 'Habit Builder', 'Complete 3 habits today', 'daily', 'habits', '{"type": "habits_completed", "target": 3}'::jsonb, 30, 15, 'discipline', 1, 2),
    ('weekly_reader', 'Weekly Reader', 'Read for 60 minutes this week', 'weekly', 'books', '{"type": "reading_minutes", "target": 60}'::jsonb, 100, 50, 'knowledge', 1, 3),
    ('workout_warrior', 'Workout Warrior', 'Complete 3 workouts this week', 'weekly', 'fitness', '{"type": "workouts_completed", "target": 3}'::jsonb, 150, 75, 'fitness', 1, 4),
    ('deep_focus', 'Deep Focus', 'Complete a 50-minute focus session', 'daily', 'focus', '{"type": "focus_session_minutes", "target": 50}'::jsonb, 75, 40, 'focus', 1, 5),
    ('monthly_master', 'Monthly Master', 'Maintain a 30-day streak', 'monthly', 'general', '{"type": "streak_days", "target": 30}'::jsonb, 500, 250, 'discipline', 3, 6);

-- =============================================================================
-- USER_QUESTS (User's active/completed quests)
-- =============================================================================
CREATE TABLE user_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_quest_id UUID REFERENCES universal_quests(id),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    difficulty TEXT DEFAULT 'normal',
    xp_reward INTEGER NOT NULL DEFAULT 0,
    coin_reward INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    progress INTEGER NOT NULL DEFAULT 0,
    target INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_repeatable BOOLEAN NOT NULL DEFAULT false,
    repeat_frequency TEXT,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    last_completed_date DATE,
    streak_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX user_quests_user_id_idx ON user_quests(user_id);
CREATE INDEX user_quests_status_idx ON user_quests(user_id, status);
CREATE INDEX user_quests_source_idx ON user_quests(source_quest_id);

CREATE TRIGGER update_user_quests_updated_at
    BEFORE UPDATE ON user_quests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- USER_QUEST_PROGRESS (Progress tracking for universal quests)
-- =============================================================================
CREATE TABLE user_quest_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES universal_quests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    progress INTEGER NOT NULL DEFAULT 0,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    last_reset_at TIMESTAMPTZ,
    times_completed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, quest_id)
);

CREATE INDEX user_quest_progress_user_idx ON user_quest_progress(user_id);

CREATE TRIGGER update_user_quest_progress_updated_at
    BEFORE UPDATE ON user_quest_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
