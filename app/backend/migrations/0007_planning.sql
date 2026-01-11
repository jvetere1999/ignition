-- Migration 0007: Planning
-- Tables: calendar_events, daily_plans, plan_templates

-- =============================================================================
-- CALENDAR_EVENTS
-- =============================================================================
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL DEFAULT 'event',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    all_day BOOLEAN NOT NULL DEFAULT false,
    timezone TEXT DEFAULT 'UTC',
    location TEXT,
    workout_id UUID,
    habit_id UUID,
    goal_id UUID,
    recurrence_rule TEXT,
    recurrence_end DATE,
    parent_event_id UUID REFERENCES calendar_events(id),
    color TEXT,
    reminder_minutes INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX calendar_events_user_idx ON calendar_events(user_id);
CREATE INDEX calendar_events_user_time_idx ON calendar_events(user_id, start_time);
CREATE INDEX calendar_events_time_range_idx ON calendar_events(start_time, end_time);

CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- DAILY_PLANS
-- =============================================================================
CREATE TABLE daily_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX daily_plans_user_idx ON daily_plans(user_id);
CREATE INDEX daily_plans_user_date_idx ON daily_plans(user_id, date);

CREATE TRIGGER update_daily_plans_updated_at
    BEFORE UPDATE ON daily_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PLAN_TEMPLATES
-- =============================================================================
CREATE TABLE plan_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    items JSONB NOT NULL DEFAULT '[]',
    is_public BOOLEAN NOT NULL DEFAULT false,
    category TEXT,
    use_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX plan_templates_user_idx ON plan_templates(user_id);
CREATE INDEX plan_templates_public_idx ON plan_templates(is_public) WHERE is_public = true;

CREATE TRIGGER update_plan_templates_updated_at
    BEFORE UPDATE ON plan_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
