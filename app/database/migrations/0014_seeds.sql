-- Migration 0014: Additional Seeds
-- Extended seed data for exercises, learn content, and more

-- =============================================================================
-- EXERCISE LIBRARY SEEDS
-- =============================================================================
INSERT INTO exercises (key, name, description, muscle_groups, equipment, difficulty, category, instructions, tips, is_compound) VALUES
-- Compound Movements
('barbell_squat', 'Barbell Back Squat', 'Fundamental lower body compound movement', ARRAY['quadriceps', 'glutes', 'hamstrings', 'core'], ARRAY['barbell', 'squat_rack'], 'intermediate', 'strength', 
 '["Position bar on upper back", "Feet shoulder-width apart", "Descend by breaking at hips and knees", "Keep chest up and core braced", "Drive through heels to stand"]',
 '["Keep knees tracking over toes", "Maintain neutral spine", "Breathe: inhale down, exhale up"]', true),
 
('conventional_deadlift', 'Conventional Deadlift', 'Full body pulling movement from the floor', ARRAY['hamstrings', 'glutes', 'back', 'core', 'forearms'], ARRAY['barbell'], 'intermediate', 'strength',
 '["Stand with feet hip-width apart", "Grip bar just outside legs", "Brace core and flatten back", "Drive through legs while pulling bar close to body", "Lock out at top"]',
 '["Keep bar close to shins", "Dont round lower back", "Think pushing floor away"]', true),

('barbell_bench_press', 'Barbell Bench Press', 'Upper body horizontal push', ARRAY['chest', 'shoulders', 'triceps'], ARRAY['barbell', 'bench'], 'intermediate', 'strength',
 '["Lie on bench with eyes under bar", "Grip slightly wider than shoulder width", "Unrack and lower to mid-chest", "Press up and slightly back"]',
 '["Maintain slight arch", "Keep shoulder blades pinched", "Drive feet into floor"]', true),

('barbell_row', 'Barbell Row', 'Upper body horizontal pull', ARRAY['back', 'biceps', 'rear_delts'], ARRAY['barbell'], 'intermediate', 'strength',
 '["Hinge at hips with slight knee bend", "Grip bar shoulder width", "Pull bar to lower chest/upper abs", "Lower with control"]',
 '["Keep core tight", "Squeeze shoulder blades at top", "Avoid using momentum"]', true),

('overhead_press', 'Overhead Press', 'Vertical pressing movement', ARRAY['shoulders', 'triceps', 'core'], ARRAY['barbell'], 'intermediate', 'strength',
 '["Start with bar at shoulders", "Grip just outside shoulder width", "Press straight up", "Lock out overhead"]',
 '["Squeeze glutes for stability", "Move head back then forward as bar passes", "Full lockout at top"]', true),

('pull_up', 'Pull-Up', 'Vertical pulling bodyweight movement', ARRAY['back', 'biceps', 'forearms'], ARRAY['pull_up_bar'], 'intermediate', 'strength',
 '["Hang with arms extended", "Pull until chin clears bar", "Lower with control"]',
 '["Initiate with scapular depression", "Keep core engaged", "Avoid kipping unless intended"]', true),

-- Isolation Movements
('dumbbell_curl', 'Dumbbell Bicep Curl', 'Bicep isolation exercise', ARRAY['biceps'], ARRAY['dumbbell'], 'beginner', 'strength',
 '["Stand with dumbbells at sides", "Curl weights keeping elbows fixed", "Lower with control"]',
 '["Avoid swinging", "Supinate at top for peak contraction"]', false),

('tricep_pushdown', 'Tricep Pushdown', 'Tricep isolation using cable', ARRAY['triceps'], ARRAY['cable'], 'beginner', 'strength',
 '["Stand facing cable machine", "Grip bar/rope with elbows at sides", "Push down until arms straight", "Return with control"]',
 '["Keep elbows pinned to sides", "Squeeze at bottom"]', false),

('lateral_raise', 'Lateral Raise', 'Side delt isolation', ARRAY['shoulders'], ARRAY['dumbbell'], 'beginner', 'strength',
 '["Stand with dumbbells at sides", "Raise arms out to sides to shoulder height", "Lower with control"]',
 '["Slight bend in elbows", "Lead with pinkies for better activation"]', false),

('leg_curl', 'Lying Leg Curl', 'Hamstring isolation', ARRAY['hamstrings'], ARRAY['machine'], 'beginner', 'strength',
 '["Lie face down on machine", "Curl heels toward glutes", "Lower with control"]',
 '["Avoid lifting hips", "Squeeze at top"]', false),

('leg_extension', 'Leg Extension', 'Quadricep isolation', ARRAY['quadriceps'], ARRAY['machine'], 'beginner', 'strength',
 '["Sit in machine with back against pad", "Extend legs until straight", "Lower with control"]',
 '["Dont lock out aggressively", "Control the negative"]', false),

-- Cardio/Conditioning
('rowing_machine', 'Rowing Machine', 'Full body cardio exercise', ARRAY['back', 'legs', 'core', 'arms'], ARRAY['rowing_machine'], 'beginner', 'cardio',
 '["Start with legs bent and arms extended", "Drive with legs first", "Pull handle to chest as legs extend", "Return in reverse order"]',
 '["Legs-back-arms sequence", "Maintain tall posture"]', true),

('battle_ropes', 'Battle Ropes', 'Conditioning and endurance', ARRAY['shoulders', 'core', 'arms'], ARRAY['battle_ropes'], 'intermediate', 'cardio',
 '["Hold rope ends in each hand", "Create waves by alternating arms", "Maintain athletic stance"]',
 '["Stay low", "Keep core braced", "Breathe rhythmically"]', false),

-- Core
('plank', 'Plank', 'Isometric core hold', ARRAY['core'], ARRAY[]::TEXT[], 'beginner', 'core',
 '["Position on forearms and toes", "Keep body in straight line", "Hold position"]',
 '["Squeeze glutes", "Dont let hips sag or pike", "Breathe normally"]', false),

('hanging_leg_raise', 'Hanging Leg Raise', 'Lower ab focused movement', ARRAY['core'], ARRAY['pull_up_bar'], 'intermediate', 'core',
 '["Hang from bar with arms extended", "Raise legs to parallel or higher", "Lower with control"]',
 '["Minimize swing", "Posterior pelvic tilt at top"]', false);

-- =============================================================================
-- LEARN LESSON SEEDS
-- =============================================================================
INSERT INTO learn_lessons (topic_id, key, title, description, difficulty, xp_reward, coin_reward, sort_order) 
SELECT t.id, 'intervals_intro', 'Introduction to Intervals', 'Learn the basics of musical intervals', 'beginner', 50, 10, 1
FROM learn_topics t WHERE t.key = 'music_theory';

INSERT INTO learn_lessons (topic_id, key, title, description, difficulty, xp_reward, coin_reward, sort_order)
SELECT t.id, 'scales_major', 'Major Scales', 'Understanding major scale construction', 'beginner', 75, 15, 2
FROM learn_topics t WHERE t.key = 'music_theory';

INSERT INTO learn_lessons (topic_id, key, title, description, difficulty, xp_reward, coin_reward, sort_order)
SELECT t.id, 'scales_minor', 'Minor Scales', 'Natural, harmonic, and melodic minor', 'beginner', 75, 15, 3
FROM learn_topics t WHERE t.key = 'music_theory';

INSERT INTO learn_lessons (topic_id, key, title, description, difficulty, xp_reward, coin_reward, sort_order)
SELECT t.id, 'chords_triads', 'Triads and Basic Chords', 'Building major, minor, and diminished triads', 'beginner', 100, 20, 4
FROM learn_topics t WHERE t.key = 'music_theory';

INSERT INTO learn_lessons (topic_id, key, title, description, difficulty, xp_reward, coin_reward, sort_order)
SELECT t.id, 'ear_intervals', 'Interval Recognition', 'Train your ear to identify intervals', 'beginner', 50, 10, 1
FROM learn_topics t WHERE t.key = 'ear_training';

INSERT INTO learn_lessons (topic_id, key, title, description, difficulty, xp_reward, coin_reward, sort_order)
SELECT t.id, 'eq_fundamentals', 'EQ Fundamentals', 'Understanding equalization basics', 'beginner', 75, 15, 1
FROM learn_topics t WHERE t.key = 'mixing';

INSERT INTO learn_lessons (topic_id, key, title, description, difficulty, xp_reward, coin_reward, sort_order)
SELECT t.id, 'compression_basics', 'Compression Basics', 'Learn how compressors work', 'beginner', 100, 20, 2
FROM learn_topics t WHERE t.key = 'mixing';

-- =============================================================================
-- LEARN DRILL SEEDS
-- =============================================================================
INSERT INTO learn_drills (topic_id, key, title, drill_type, config_json, difficulty, xp_reward, sort_order)
SELECT t.id, 'interval_id_easy', 'Easy Interval Identification', 'audio_quiz', 
       '{"intervals": ["unison", "major_2nd", "major_3rd", "perfect_4th", "perfect_5th"], "rounds": 10}'::jsonb,
       'beginner', 25, 1
FROM learn_topics t WHERE t.key = 'ear_training';

INSERT INTO learn_drills (topic_id, key, title, drill_type, config_json, difficulty, xp_reward, sort_order)
SELECT t.id, 'interval_id_medium', 'Intermediate Interval Identification', 'audio_quiz',
       '{"intervals": ["minor_2nd", "major_2nd", "minor_3rd", "major_3rd", "perfect_4th", "tritone", "perfect_5th", "minor_6th", "major_6th"], "rounds": 15}'::jsonb,
       'intermediate', 50, 2
FROM learn_topics t WHERE t.key = 'ear_training';

INSERT INTO learn_drills (topic_id, key, title, drill_type, config_json, difficulty, xp_reward, sort_order)
SELECT t.id, 'chord_quality', 'Chord Quality Recognition', 'audio_quiz',
       '{"chords": ["major", "minor", "diminished", "augmented"], "rounds": 10}'::jsonb,
       'beginner', 30, 3
FROM learn_topics t WHERE t.key = 'ear_training';

INSERT INTO learn_drills (topic_id, key, title, drill_type, config_json, difficulty, xp_reward, sort_order)
SELECT t.id, 'freq_guess', 'Frequency Guessing Game', 'frequency_match',
       '{"frequencies": [100, 250, 500, 1000, 2000, 4000, 8000], "tolerance_percent": 20, "rounds": 8}'::jsonb,
       'intermediate', 40, 1
FROM learn_topics t WHERE t.key = 'mixing';

-- =============================================================================
-- ADDITIONAL QUEST SEEDS
-- =============================================================================
INSERT INTO universal_quests (key, name, description, quest_type, category, requirements, xp_reward, coin_reward, skill_key, skill_star_reward, is_recurring, recurrence_period) VALUES
('first_focus_30', 'Deep Focus Initiate', 'Complete your first 30-minute focus session', 'milestone', 'focus', 
 '{"type": "focus_duration", "duration_minutes": 30}'::jsonb, 100, 25, 'focus', 1, false, NULL),
 
('focus_streak_3', 'Focus Streak', 'Complete focus sessions 3 days in a row', 'streak', 'focus',
 '{"type": "streak", "days": 3, "activity": "focus_session"}'::jsonb, 150, 40, 'focus', 1, false, NULL),

('complete_5_lessons', 'Knowledge Seeker', 'Complete 5 learning lessons', 'milestone', 'learn',
 '{"type": "lesson_count", "count": 5}'::jsonb, 200, 50, 'knowledge', 2, false, NULL),

('perfect_drill_score', 'Perfect Ear', 'Get a perfect score on any ear training drill', 'achievement', 'learn',
 '{"type": "drill_perfect", "min_rounds": 10}'::jsonb, 300, 75, 'knowledge', 3, false, NULL),

('workout_variety', 'Variety Pack', 'Complete 5 different types of workouts', 'milestone', 'fitness',
 '{"type": "workout_variety", "count": 5}'::jsonb, 200, 50, 'fitness', 2, false, NULL),

('habit_master_week', 'Habit Master', 'Complete all habits for 7 consecutive days', 'streak', 'habits',
 '{"type": "all_habits_streak", "days": 7}'::jsonb, 500, 100, 'discipline', 3, false, NULL),

('early_bird', 'Early Bird', 'Complete a morning focus session before 7 AM', 'achievement', 'focus',
 '{"type": "time_based", "before_hour": 7, "activity": "focus_session"}'::jsonb, 100, 25, 'discipline', 1, true, 'weekly'),

('night_owl', 'Night Owl', 'Complete a late-night focus session after 11 PM', 'achievement', 'focus',
 '{"type": "time_based", "after_hour": 23, "activity": "focus_session"}'::jsonb, 100, 25, 'discipline', 1, true, 'weekly');

-- =============================================================================
-- ADDITIONAL MARKET ITEMS
-- =============================================================================
-- Columns available: key, name, description, category, cost_coins, rarity, icon, icon_url, image_url, 
--                   is_global, is_available, is_active, is_consumable, uses_per_purchase, 
--                   total_stock, remaining_stock, available_from, available_until, sort_order
INSERT INTO market_items (key, name, description, category, cost_coins, rarity, icon, is_active, sort_order) VALUES
('focus_skin_forest', 'Forest Focus Theme', 'Serene forest-themed focus interface', 'theme', 200, 'common', 'forest', true, 20),
('focus_skin_ocean', 'Ocean Depths Theme', 'Deep ocean blue focus interface', 'theme', 200, 'common', 'ocean', true, 21),
('workout_badge_iron', 'Iron Warrior Badge', 'Display badge for completing 50 workouts', 'badge', 300, 'rare', 'iron_warrior', true, 30),
('xp_boost_small', 'Minor XP Boost', '10% XP boost for 24 hours', 'boost', 50, 'common', 'sparkle', true, 40),
('xp_boost_large', 'Major XP Boost', '25% XP boost for 24 hours', 'boost', 150, 'rare', 'lightning', true, 41),
('coin_boost_small', 'Minor Coin Boost', '10% coin boost for 24 hours', 'boost', 75, 'common', 'coins', true, 42);
