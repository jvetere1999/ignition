-- Down migration for 0006_quests.sql

DROP TRIGGER IF EXISTS update_user_quest_progress_updated_at ON user_quest_progress;
DROP TRIGGER IF EXISTS update_user_quests_updated_at ON user_quests;
DROP TRIGGER IF EXISTS update_universal_quests_updated_at ON universal_quests;

DROP TABLE IF EXISTS user_quest_progress;
DROP TABLE IF EXISTS user_quests;
DROP TABLE IF EXISTS universal_quests;
