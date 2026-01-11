-- Migration 0003: Gamification
-- Progress, wallet, streaks, achievements, and skills
-- Tables: skill_definitions, user_skills, achievement_definitions, user_achievements,
--         user_progress, user_wallet, points_ledger, user_streaks

-- =============================================================================
-- SKILL_DEFINITIONS
-- =============================================================================
CREATE TABLE skill_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    max_level INTEGER NOT NULL DEFAULT 100,
    stars_per_level INTEGER NOT NULL DEFAULT 10,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default skills
INSERT INTO skill_definitions (key, name, description, category, icon, color, sort_order) VALUES
    ('focus', 'Focus', 'Master your attention and deep work', 'mental', 'brain', '#6366f1', 1),
    ('discipline', 'Discipline', 'Build consistency and follow through', 'mental', 'target', '#8b5cf6', 2),
    ('knowledge', 'Knowledge', 'Expand your understanding', 'academic', 'book-open', '#3b82f6', 3),
    ('fitness', 'Fitness', 'Strengthen your body', 'physical', 'dumbbell', '#10b981', 4),
    ('creativity', 'Creativity', 'Express and innovate', 'creative', 'palette', '#f59e0b', 5),
    ('wellness', 'Wellness', 'Nurture your wellbeing', 'health', 'heart', '#ec4899', 6);

-- =============================================================================
-- USER_SKILLS
-- =============================================================================
CREATE TABLE user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_key TEXT NOT NULL,
    current_stars INTEGER NOT NULL DEFAULT 0,
    current_level INTEGER NOT NULL DEFAULT 1,
    total_stars INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, skill_key)
);

CREATE INDEX user_skills_user_idx ON user_skills(user_id);

CREATE TRIGGER update_user_skills_updated_at
    BEFORE UPDATE ON user_skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ACHIEVEMENT_DEFINITIONS
-- =============================================================================
CREATE TABLE achievement_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    icon TEXT,
    trigger_type TEXT NOT NULL,
    trigger_config JSONB NOT NULL DEFAULT '{}',
    reward_coins INTEGER NOT NULL DEFAULT 0,
    reward_xp INTEGER NOT NULL DEFAULT 0,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed some achievements
INSERT INTO achievement_definitions (key, name, description, category, trigger_type, trigger_config, reward_coins, reward_xp, sort_order) VALUES
    ('first_focus', 'First Focus', 'Complete your first focus session', 'focus', 'event', '{"event": "focus_complete", "count": 1}', 50, 100, 1),
    ('focus_master', 'Focus Master', 'Complete 100 focus sessions', 'focus', 'threshold', '{"event": "focus_complete", "count": 100}', 500, 1000, 2),
    ('streak_7', 'Week Warrior', 'Maintain a 7-day streak', 'streak', 'threshold', '{"streak_type": "daily", "count": 7}', 100, 200, 3),
    ('streak_30', 'Monthly Master', 'Maintain a 30-day streak', 'streak', 'threshold', '{"streak_type": "daily", "count": 30}', 500, 1000, 4),
    ('first_habit', 'Habit Starter', 'Complete a habit for the first time', 'habit', 'event', '{"event": "habit_complete", "count": 1}', 25, 50, 5),
    ('level_10', 'Rising Star', 'Reach level 10', 'progress', 'threshold', '{"field": "current_level", "value": 10}', 200, 500, 6),
    ('level_25', 'Champion', 'Reach level 25', 'progress', 'threshold', '{"field": "current_level", "value": 25}', 500, 1000, 7),
    ('first_book', 'Bookworm', 'Finish reading your first book', 'books', 'event', '{"event": "book_complete", "count": 1}', 100, 200, 8),
    ('first_workout', 'Gym Starter', 'Complete your first workout', 'fitness', 'event', '{"event": "workout_complete", "count": 1}', 50, 100, 9),
    ('quest_complete_10', 'Quest Hunter', 'Complete 10 quests', 'quests', 'threshold', '{"event": "quest_complete", "count": 10}', 200, 400, 10);

-- =============================================================================
-- USER_ACHIEVEMENTS
-- =============================================================================
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_key TEXT NOT NULL,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notified BOOLEAN NOT NULL DEFAULT false,
    UNIQUE(user_id, achievement_key)
);

CREATE INDEX user_achievements_user_idx ON user_achievements(user_id);

-- =============================================================================
-- USER_PROGRESS
-- =============================================================================
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_xp INTEGER NOT NULL DEFAULT 0,
    current_level INTEGER NOT NULL DEFAULT 1,
    xp_to_next_level INTEGER NOT NULL DEFAULT 100,
    total_skill_stars INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- USER_WALLET
-- =============================================================================
CREATE TABLE user_wallet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coins INTEGER NOT NULL DEFAULT 0,
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_spent INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_user_wallet_updated_at
    BEFORE UPDATE ON user_wallet
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- POINTS_LEDGER
-- =============================================================================
CREATE TABLE points_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_id UUID,
    coins INTEGER NOT NULL DEFAULT 0,
    xp INTEGER NOT NULL DEFAULT 0,
    skill_stars INTEGER DEFAULT 0,
    skill_key TEXT,
    reason TEXT,
    idempotency_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX points_ledger_user_id_idx ON points_ledger(user_id);
CREATE INDEX points_ledger_created_at_idx ON points_ledger(created_at DESC);
CREATE UNIQUE INDEX points_ledger_idempotency_idx 
    ON points_ledger(user_id, idempotency_key) 
    WHERE idempotency_key IS NOT NULL;

-- =============================================================================
-- USER_STREAKS
-- =============================================================================
CREATE TABLE user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    streak_type TEXT NOT NULL,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, streak_type)
);

CREATE INDEX user_streaks_user_idx ON user_streaks(user_id);

CREATE TRIGGER update_user_streaks_updated_at
    BEFORE UPDATE ON user_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- HELPER FUNCTION: Initialize gamification for new user
-- =============================================================================
CREATE OR REPLACE FUNCTION initialize_user_gamification()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user_progress
    INSERT INTO user_progress (user_id) VALUES (NEW.id);
    
    -- Create user_wallet
    INSERT INTO user_wallet (user_id) VALUES (NEW.id);
    
    -- Initialize all skills
    INSERT INTO user_skills (user_id, skill_key)
    SELECT NEW.id, key FROM skill_definitions;
    
    -- Initialize daily streak
    INSERT INTO user_streaks (user_id, streak_type) VALUES (NEW.id, 'daily');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER initialize_user_gamification_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_gamification();
