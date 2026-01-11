-- Down migration for 0014_seeds.sql
-- This removes seeded data only, not tables

-- Remove additional market items
DELETE FROM market_items WHERE key IN (
    'focus_skin_forest', 'focus_skin_ocean', 'workout_badge_iron',
    'xp_boost_small', 'xp_boost_large', 'coin_boost_small'
);

-- Remove additional quests
DELETE FROM universal_quests WHERE key IN (
    'first_focus_30', 'focus_streak_3', 'complete_5_lessons', 'perfect_drill_score',
    'workout_variety', 'habit_master_week', 'early_bird', 'night_owl'
);

-- Remove learn drills
DELETE FROM learn_drills WHERE key IN (
    'interval_id_easy', 'interval_id_medium', 'chord_quality', 'freq_guess'
);

-- Remove learn lessons
DELETE FROM learn_lessons WHERE key IN (
    'intervals_intro', 'scales_major', 'scales_minor', 'chords_triads',
    'ear_intervals', 'eq_fundamentals', 'compression_basics'
);

-- Remove exercises
DELETE FROM exercises WHERE key IN (
    'barbell_squat', 'conventional_deadlift', 'barbell_bench_press', 'barbell_row',
    'overhead_press', 'pull_up', 'dumbbell_curl', 'tricep_pushdown', 'lateral_raise',
    'leg_curl', 'leg_extension', 'rowing_machine', 'battle_ropes', 'plank', 'hanging_leg_raise'
);
