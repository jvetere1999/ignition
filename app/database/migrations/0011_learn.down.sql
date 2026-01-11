-- Down migration for 0011_learn.sql

DROP TABLE IF EXISTS user_drill_stats;
DROP TABLE IF EXISTS user_lesson_progress;
DROP TABLE IF EXISTS learn_drills;
DROP TABLE IF EXISTS learn_lessons;
DROP TABLE IF EXISTS learn_topics;
