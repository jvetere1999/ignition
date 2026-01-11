-- Down migration for 0005_habits_goals.sql

DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
DROP TRIGGER IF EXISTS update_habits_updated_at ON habits;

DROP TABLE IF EXISTS goal_milestones;
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS habit_completions;
DROP TABLE IF EXISTS habits;
