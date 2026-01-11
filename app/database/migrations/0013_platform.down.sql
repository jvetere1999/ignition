-- Down migration for 0013_platform.sql

DROP TABLE IF EXISTS feature_flags;
DROP TABLE IF EXISTS user_references;
DROP TABLE IF EXISTS inbox_items;
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS user_interests;
DROP TABLE IF EXISTS user_onboarding_responses;
DROP TABLE IF EXISTS user_onboarding_state;
DROP TABLE IF EXISTS onboarding_steps;
DROP TABLE IF EXISTS onboarding_flows;
DROP TABLE IF EXISTS infobase_entries;
DROP TABLE IF EXISTS ideas;
DROP TABLE IF EXISTS feedback;
