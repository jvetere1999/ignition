-- Migration 0010: Fitness
-- Tables: exercises, workouts, workout_sections, workout_exercises, 
--         workout_sessions, exercise_sets, personal_records,
--         training_programs, program_weeks, program_workouts

-- =============================================================================
-- EXERCISES
-- =============================================================================
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    muscle_groups TEXT[],
    equipment TEXT[],
    difficulty TEXT DEFAULT 'intermediate',
    instructions TEXT,
    tips TEXT,
    video_url TEXT,
    is_compound BOOLEAN NOT NULL DEFAULT false,
    is_custom BOOLEAN NOT NULL DEFAULT false,
    is_builtin BOOLEAN NOT NULL DEFAULT true,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX exercises_category_idx ON exercises(category);
CREATE INDEX exercises_user_idx ON exercises(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX exercises_builtin_idx ON exercises(is_builtin) WHERE is_builtin = true;
CREATE INDEX exercises_key_idx ON exercises(key) WHERE key IS NOT NULL;

-- =============================================================================
-- WORKOUTS
-- =============================================================================
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    estimated_duration INTEGER,
    difficulty TEXT DEFAULT 'intermediate',
    category TEXT,
    is_template BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX workouts_user_idx ON workouts(user_id);
CREATE INDEX workouts_template_idx ON workouts(is_template) WHERE is_template = true;

CREATE TRIGGER update_workouts_updated_at
    BEFORE UPDATE ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- WORKOUT_SECTIONS
-- =============================================================================
CREATE TABLE workout_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    section_type TEXT DEFAULT 'main',
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX workout_sections_workout_idx ON workout_sections(workout_id);

-- =============================================================================
-- WORKOUT_EXERCISES
-- =============================================================================
CREATE TABLE workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    section_id UUID REFERENCES workout_sections(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    sets INTEGER,
    reps INTEGER,
    weight REAL,
    duration INTEGER,
    rest_seconds INTEGER DEFAULT 60,
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX workout_exercises_workout_idx ON workout_exercises(workout_id);
CREATE INDEX workout_exercises_section_idx ON workout_exercises(section_id);

-- =============================================================================
-- WORKOUT_SESSIONS
-- =============================================================================
CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES workouts(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    coins_awarded INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX workout_sessions_user_idx ON workout_sessions(user_id);
CREATE INDEX workout_sessions_workout_idx ON workout_sessions(workout_id);
CREATE INDEX workout_sessions_started_idx ON workout_sessions(started_at DESC);

-- =============================================================================
-- EXERCISE_SETS
-- =============================================================================
CREATE TABLE exercise_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    set_number INTEGER NOT NULL,
    reps INTEGER,
    weight REAL,
    duration INTEGER,
    is_warmup BOOLEAN NOT NULL DEFAULT false,
    is_dropset BOOLEAN NOT NULL DEFAULT false,
    rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
    notes TEXT,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX exercise_sets_session_idx ON exercise_sets(session_id);
CREATE INDEX exercise_sets_exercise_idx ON exercise_sets(exercise_id);

-- =============================================================================
-- PERSONAL_RECORDS
-- =============================================================================
CREATE TABLE personal_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    record_type TEXT NOT NULL,
    value REAL NOT NULL,
    reps INTEGER,
    achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    exercise_set_id UUID REFERENCES exercise_sets(id),
    previous_value REAL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX personal_records_user_exercise_idx ON personal_records(user_id, exercise_id);
CREATE INDEX personal_records_type_idx ON personal_records(record_type);

-- =============================================================================
-- TRAINING_PROGRAMS
-- =============================================================================
CREATE TABLE training_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER NOT NULL,
    goal TEXT,
    difficulty TEXT DEFAULT 'intermediate',
    is_active BOOLEAN NOT NULL DEFAULT false,
    current_week INTEGER NOT NULL DEFAULT 1,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX training_programs_user_idx ON training_programs(user_id);
CREATE INDEX training_programs_active_idx ON training_programs(is_active) WHERE is_active = true;

CREATE TRIGGER update_training_programs_updated_at
    BEFORE UPDATE ON training_programs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PROGRAM_WEEKS
-- =============================================================================
CREATE TABLE program_weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    name TEXT,
    is_deload BOOLEAN NOT NULL DEFAULT false,
    notes TEXT
);

CREATE INDEX program_weeks_program_idx ON program_weeks(program_id, week_number);

-- =============================================================================
-- PROGRAM_WORKOUTS
-- =============================================================================
CREATE TABLE program_workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_week_id UUID NOT NULL REFERENCES program_weeks(id) ON DELETE CASCADE,
    workout_id UUID NOT NULL REFERENCES workouts(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    order_index INTEGER NOT NULL DEFAULT 0,
    intensity_modifier REAL NOT NULL DEFAULT 1.0
);

CREATE INDEX program_workouts_week_idx ON program_workouts(program_week_id);
CREATE INDEX program_workouts_workout_idx ON program_workouts(workout_id);
