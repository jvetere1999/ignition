-- Migration 0011: Learn
-- Tables: learn_topics, learn_lessons, learn_drills, user_lesson_progress, user_drill_stats

-- =============================================================================
-- LEARN_TOPICS
-- =============================================================================
CREATE TABLE learn_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed learning topics
INSERT INTO learn_topics (key, name, description, category, icon, color, sort_order) VALUES
    ('music_theory', 'Music Theory', 'Fundamentals of music theory and composition', 'theory', 'music', '#8b5cf6', 1),
    ('ear_training', 'Ear Training', 'Develop your musical ear', 'practice', 'ear', '#3b82f6', 2),
    ('production', 'Music Production', 'Learn production techniques', 'production', 'sliders', '#10b981', 3),
    ('mixing', 'Mixing & Mastering', 'Professional mixing techniques', 'production', 'volume', '#f59e0b', 4),
    ('sound_design', 'Sound Design', 'Create unique sounds', 'production', 'waveform', '#ec4899', 5);

-- =============================================================================
-- LEARN_LESSONS
-- =============================================================================
CREATE TABLE learn_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES learn_topics(id) ON DELETE CASCADE,
    key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content_markdown TEXT,
    duration_minutes INTEGER,
    difficulty TEXT NOT NULL DEFAULT 'beginner',
    quiz_json JSONB,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    coin_reward INTEGER NOT NULL DEFAULT 0,
    skill_key TEXT,
    skill_star_reward INTEGER NOT NULL DEFAULT 0,
    audio_r2_key TEXT,
    video_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX learn_lessons_topic_idx ON learn_lessons(topic_id);
CREATE INDEX learn_lessons_difficulty_idx ON learn_lessons(difficulty);

-- =============================================================================
-- LEARN_DRILLS
-- =============================================================================
CREATE TABLE learn_drills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES learn_topics(id) ON DELETE CASCADE,
    key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    drill_type TEXT NOT NULL,
    config_json JSONB NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'beginner',
    duration_seconds INTEGER,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX learn_drills_topic_idx ON learn_drills(topic_id);
CREATE INDEX learn_drills_type_idx ON learn_drills(drill_type);

-- =============================================================================
-- USER_LESSON_PROGRESS
-- =============================================================================
CREATE TABLE user_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES learn_lessons(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    quiz_score INTEGER,
    attempts INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX user_lesson_progress_user_idx ON user_lesson_progress(user_id);
CREATE INDEX user_lesson_progress_status_idx ON user_lesson_progress(status);

-- =============================================================================
-- USER_DRILL_STATS
-- =============================================================================
CREATE TABLE user_drill_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    drill_id UUID NOT NULL REFERENCES learn_drills(id) ON DELETE CASCADE,
    total_attempts INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    best_score INTEGER NOT NULL DEFAULT 0,
    average_score REAL NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    total_time_seconds INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user_id, drill_id)
);

CREATE INDEX user_drill_stats_user_idx ON user_drill_stats(user_id);
