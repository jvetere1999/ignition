-- Down migration for 0007_planning.sql

DROP TRIGGER IF EXISTS update_plan_templates_updated_at ON plan_templates;
DROP TRIGGER IF EXISTS update_daily_plans_updated_at ON daily_plans;
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;

DROP TABLE IF EXISTS plan_templates;
DROP TABLE IF EXISTS daily_plans;
DROP TABLE IF EXISTS calendar_events;
