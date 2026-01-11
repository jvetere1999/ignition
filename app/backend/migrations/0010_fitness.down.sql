-- Down migration for 0010_fitness.sql

DROP TRIGGER IF EXISTS update_training_programs_updated_at ON training_programs;
DROP TRIGGER IF EXISTS update_workouts_updated_at ON workouts;

DROP TABLE IF EXISTS program_workouts;
DROP TABLE IF EXISTS program_weeks;
DROP TABLE IF EXISTS training_programs;
DROP TABLE IF EXISTS personal_records;
DROP TABLE IF EXISTS exercise_sets;
DROP TABLE IF EXISTS workout_sessions;
DROP TABLE IF EXISTS workout_exercises;
DROP TABLE IF EXISTS workout_sections;
DROP TABLE IF EXISTS workouts;
DROP TABLE IF EXISTS exercises;
