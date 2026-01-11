-- Down migration for 0003_gamification.sql

DROP TRIGGER IF EXISTS initialize_user_gamification_trigger ON users;
DROP FUNCTION IF EXISTS initialize_user_gamification();

DROP TRIGGER IF EXISTS update_user_streaks_updated_at ON user_streaks;
DROP TRIGGER IF EXISTS update_user_wallet_updated_at ON user_wallet;
DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
DROP TRIGGER IF EXISTS update_user_skills_updated_at ON user_skills;

DROP TABLE IF EXISTS user_streaks;
DROP TABLE IF EXISTS points_ledger;
DROP TABLE IF EXISTS user_wallet;
DROP TABLE IF EXISTS user_progress;
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievement_definitions;
DROP TABLE IF EXISTS user_skills;
DROP TABLE IF EXISTS skill_definitions;
