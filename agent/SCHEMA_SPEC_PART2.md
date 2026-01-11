# Database Schema Specification - Part 2

**Continuation of SCHEMA_SPEC_PART1.md**

---

# Migration 0008: Market

## market_items
Shop item catalog.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| key | TEXT | UNIQUE | NULL | Unique item key |
| name | TEXT | NOT NULL | | Display name |
| description | TEXT | | NULL | |
| category | TEXT | NOT NULL | | avatar/theme/boost/etc. |
| cost_coins | INTEGER | NOT NULL | | Price |
| rarity | TEXT | NOT NULL | 'common' | common/rare/epic/legendary |
| icon | TEXT | | NULL | Icon identifier |
| icon_url | TEXT | | NULL | Full icon URL |
| image_url | TEXT | | NULL | Preview image |
| is_global | BOOLEAN | NOT NULL | true | Available to all |
| is_available | BOOLEAN | NOT NULL | true | Can be purchased |
| is_active | BOOLEAN | NOT NULL | true | Visible in shop |
| is_consumable | BOOLEAN | NOT NULL | false | Single use |
| uses_per_purchase | INTEGER | | 1 | For consumables |
| total_stock | INTEGER | | NULL | Limited quantity |
| remaining_stock | INTEGER | | NULL | Current stock |
| available_from | TIMESTAMPTZ | | NULL | Start availability |
| available_until | TIMESTAMPTZ | | NULL | End availability |
| created_by_user_id | UUID | FK users(id) | NULL | Admin creator |
| sort_order | INTEGER | NOT NULL | 0 | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `market_items_category_idx` on (category)
- `market_items_available_idx` on (is_available, is_active)

---

## user_purchases
User purchase history.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| item_id | UUID | FK market_items(id) | | |
| cost_coins | INTEGER | NOT NULL | | Price paid |
| quantity | INTEGER | NOT NULL | 1 | |
| purchased_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| redeemed_at | TIMESTAMPTZ | | NULL | When used |
| uses_remaining | INTEGER | | NULL | For consumables |
| status | TEXT | NOT NULL | 'active' | active/used/refunded |
| refunded_at | TIMESTAMPTZ | | NULL | |
| refund_reason | TEXT | | NULL | |

**Indexes:**
- `user_purchases_user_idx` on (user_id)
- `user_purchases_item_idx` on (item_id)

---

## market_transactions
Coin transaction history.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| transaction_type | TEXT | NOT NULL | | purchase/reward/refund |
| coins_amount | INTEGER | NOT NULL | | +/- amount |
| item_id | UUID | FK market_items(id) | NULL | If purchase |
| reason | TEXT | | NULL | Description |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `market_transactions_user_idx` on (user_id)

---

## user_rewards
Claimable rewards.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| reward_type | TEXT | NOT NULL | | daily/achievement/quest |
| source_id | UUID | | NULL | Achievement/quest ID |
| coins_earned | INTEGER | NOT NULL | 0 | |
| xp_earned | INTEGER | NOT NULL | 0 | |
| claimed | BOOLEAN | NOT NULL | false | |
| claimed_at | TIMESTAMPTZ | | NULL | |
| expires_at | TIMESTAMPTZ | | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `user_rewards_user_claimed_idx` on (user_id, claimed)

---

## market_recommendations
AI-generated item suggestions.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| item_id | UUID | FK market_items(id) CASCADE | | |
| score | REAL | NOT NULL | | Relevance 0-1 |
| reason | TEXT | | NULL | Why recommended |
| computed_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `market_recommendations_user_idx` on (user_id)

---

# Migration 0009: Books

## books
User's book library.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| title | TEXT | NOT NULL | | |
| author | TEXT | | NULL | |
| total_pages | INTEGER | | NULL | |
| current_page | INTEGER | NOT NULL | 0 | |
| status | TEXT | NOT NULL | 'to_read' | to_read/reading/completed |
| started_at | TIMESTAMPTZ | | NULL | |
| completed_at | TIMESTAMPTZ | | NULL | |
| rating | INTEGER | | NULL | 1-5 |
| notes | TEXT | | NULL | |
| cover_url | TEXT | | NULL | Cover image |
| isbn | TEXT | | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `books_user_status_idx` on (user_id, status)

---

## reading_sessions
Reading activity log.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| book_id | UUID | FK books(id) CASCADE | | |
| user_id | UUID | FK users(id) CASCADE | | |
| pages_read | INTEGER | NOT NULL | 0 | |
| start_page | INTEGER | | NULL | |
| end_page | INTEGER | | NULL | |
| duration_minutes | INTEGER | | NULL | |
| started_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| notes | TEXT | | NULL | |
| xp_awarded | INTEGER | NOT NULL | 0 | |
| coins_awarded | INTEGER | NOT NULL | 0 | |

**Indexes:**
- `reading_sessions_book_idx` on (book_id)
- `reading_sessions_user_idx` on (user_id)

---

# Migration 0010: Fitness

## exercises
Exercise library.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| name | TEXT | NOT NULL | | |
| description | TEXT | | NULL | |
| category | TEXT | NOT NULL | | strength/cardio/flexibility |
| muscle_groups | TEXT[] | | NULL | Primary muscles |
| equipment | TEXT[] | | NULL | Required equipment |
| instructions | TEXT | | NULL | How to perform |
| video_url | TEXT | | NULL | Demo video |
| is_custom | BOOLEAN | NOT NULL | false | User-created |
| is_builtin | BOOLEAN | NOT NULL | true | System exercise |
| user_id | UUID | FK users(id) CASCADE | NULL | Creator if custom |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `exercises_category_idx` on (category)
- `exercises_user_idx` on (user_id) WHERE user_id IS NOT NULL

---

## workouts
Workout templates.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| name | TEXT | NOT NULL | | |
| description | TEXT | | NULL | |
| estimated_duration | INTEGER | | NULL | Minutes |
| difficulty | TEXT | | 'intermediate' | beginner/intermediate/advanced |
| category | TEXT | | NULL | |
| is_template | BOOLEAN | NOT NULL | false | Reusable template |
| is_public | BOOLEAN | NOT NULL | false | Shareable |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## workout_sections
Workout sections (warmup, main, cooldown).

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| workout_id | UUID | FK workouts(id) CASCADE | | |
| name | TEXT | NOT NULL | | Section name |
| section_type | TEXT | | 'main' | warmup/main/cooldown |
| sort_order | INTEGER | NOT NULL | 0 | |

---

## workout_exercises
Exercises in a workout.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| workout_id | UUID | FK workouts(id) CASCADE | | |
| section_id | UUID | FK workout_sections(id) CASCADE | NULL | |
| exercise_id | UUID | FK exercises(id) | | |
| sets | INTEGER | | NULL | Target sets |
| reps | INTEGER | | NULL | Target reps |
| weight | REAL | | NULL | Target weight |
| duration | INTEGER | | NULL | Duration in seconds |
| rest_seconds | INTEGER | | 60 | Rest between sets |
| notes | TEXT | | NULL | |
| sort_order | INTEGER | NOT NULL | 0 | |

**Indexes:**
- `workout_exercises_workout_idx` on (workout_id)

---

## workout_sessions
Active workout sessions.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| workout_id | UUID | FK workouts(id) | NULL | Based on template |
| started_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| completed_at | TIMESTAMPTZ | | NULL | |
| duration_seconds | INTEGER | | NULL | Actual duration |
| notes | TEXT | | NULL | |
| rating | INTEGER | | NULL | 1-5 |
| xp_awarded | INTEGER | NOT NULL | 0 | |
| coins_awarded | INTEGER | NOT NULL | 0 | |

**Indexes:**
- `workout_sessions_user_idx` on (user_id)

---

## exercise_sets
Logged exercise sets.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| session_id | UUID | FK workout_sessions(id) CASCADE | | |
| exercise_id | UUID | FK exercises(id) | | |
| set_number | INTEGER | NOT NULL | | |
| reps | INTEGER | | NULL | Actual reps |
| weight | REAL | | NULL | Actual weight |
| duration | INTEGER | | NULL | For timed exercises |
| is_warmup | BOOLEAN | NOT NULL | false | |
| is_dropset | BOOLEAN | NOT NULL | false | |
| rpe | INTEGER | | NULL | Rate of Perceived Exertion 1-10 |
| notes | TEXT | | NULL | |
| completed_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `exercise_sets_session_idx` on (session_id)

---

## personal_records
Personal bests.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| exercise_id | UUID | FK exercises(id) | | |
| record_type | TEXT | NOT NULL | | weight/reps/volume/duration |
| value | REAL | NOT NULL | | Record value |
| reps | INTEGER | | NULL | At what reps (for weight) |
| achieved_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| exercise_set_id | UUID | FK exercise_sets(id) | NULL | Source set |
| previous_value | REAL | | NULL | Previous record |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `personal_records_user_exercise_idx` on (user_id, exercise_id, record_type)

---

## training_programs
Multi-week training programs.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| name | TEXT | NOT NULL | | |
| description | TEXT | | NULL | |
| duration_weeks | INTEGER | NOT NULL | | |
| goal | TEXT | | NULL | strength/hypertrophy/etc. |
| difficulty | TEXT | | 'intermediate' | |
| is_active | BOOLEAN | NOT NULL | false | Currently running |
| current_week | INTEGER | NOT NULL | 1 | |
| started_at | TIMESTAMPTZ | | NULL | |
| completed_at | TIMESTAMPTZ | | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## program_weeks
Weeks in a training program.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| program_id | UUID | FK training_programs(id) CASCADE | | |
| week_number | INTEGER | NOT NULL | | |
| name | TEXT | | NULL | e.g., "Volume Week" |
| is_deload | BOOLEAN | NOT NULL | false | Deload week |
| notes | TEXT | | NULL | |

**Indexes:**
- `program_weeks_program_idx` on (program_id, week_number)

---

## program_workouts
Workouts scheduled in program weeks.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| program_week_id | UUID | FK program_weeks(id) CASCADE | | |
| workout_id | UUID | FK workouts(id) | | |
| day_of_week | INTEGER | NOT NULL | | 0=Sunday, 6=Saturday |
| order_index | INTEGER | NOT NULL | 0 | For multiple per day |
| intensity_modifier | REAL | NOT NULL | 1.0 | Scale weights |

---

# Migration 0011: Learn

## learn_topics
Learning topic categories.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| key | TEXT | UNIQUE NOT NULL | | topic_key |
| name | TEXT | NOT NULL | | Display name |
| description | TEXT | | NULL | |
| category | TEXT | NOT NULL | | theory/practice/etc. |
| icon | TEXT | | NULL | |
| color | TEXT | | NULL | Theme color |
| sort_order | INTEGER | NOT NULL | 0 | |
| is_active | BOOLEAN | NOT NULL | true | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## learn_lessons
Individual lessons.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| topic_id | UUID | FK learn_topics(id) CASCADE | | |
| key | TEXT | UNIQUE NOT NULL | | lesson_key |
| title | TEXT | NOT NULL | | |
| description | TEXT | | NULL | |
| content_markdown | TEXT | | NULL | Lesson content |
| duration_minutes | INTEGER | | NULL | Estimated time |
| difficulty | TEXT | NOT NULL | 'beginner' | |
| quiz_json | JSONB | | NULL | Quiz questions |
| xp_reward | INTEGER | NOT NULL | 0 | |
| coin_reward | INTEGER | NOT NULL | 0 | |
| skill_key | TEXT | | NULL | Skill that benefits |
| skill_star_reward | INTEGER | NOT NULL | 0 | |
| audio_r2_key | TEXT | | NULL | Audio version |
| video_url | TEXT | | NULL | Video content |
| sort_order | INTEGER | NOT NULL | 0 | |
| is_active | BOOLEAN | NOT NULL | true | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## learn_drills
Practice drills/exercises.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| topic_id | UUID | FK learn_topics(id) CASCADE | | |
| key | TEXT | UNIQUE NOT NULL | | drill_key |
| title | TEXT | NOT NULL | | |
| description | TEXT | | NULL | |
| drill_type | TEXT | NOT NULL | | quiz/flashcard/practice |
| config_json | JSONB | NOT NULL | | Drill configuration |
| difficulty | TEXT | NOT NULL | 'beginner' | |
| duration_seconds | INTEGER | | NULL | Time limit |
| xp_reward | INTEGER | NOT NULL | 0 | |
| sort_order | INTEGER | NOT NULL | 0 | |
| is_active | BOOLEAN | NOT NULL | true | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## user_lesson_progress
User lesson completion status.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| lesson_id | UUID | FK learn_lessons(id) CASCADE | | |
| status | TEXT | NOT NULL | 'not_started' | not_started/in_progress/completed |
| started_at | TIMESTAMPTZ | | NULL | |
| completed_at | TIMESTAMPTZ | | NULL | |
| quiz_score | INTEGER | | NULL | 0-100 |
| attempts | INTEGER | NOT NULL | 0 | |

**Indexes:**
- `user_lesson_progress_user_lesson_idx` UNIQUE on (user_id, lesson_id)

---

## user_drill_stats
User drill performance stats.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| drill_id | UUID | FK learn_drills(id) CASCADE | | |
| total_attempts | INTEGER | NOT NULL | 0 | |
| correct_answers | INTEGER | NOT NULL | 0 | |
| best_score | INTEGER | NOT NULL | 0 | |
| average_score | REAL | NOT NULL | 0 | |
| current_streak | INTEGER | NOT NULL | 0 | Correct in a row |
| best_streak | INTEGER | NOT NULL | 0 | |
| last_attempt_at | TIMESTAMPTZ | | NULL | |
| total_time_seconds | INTEGER | NOT NULL | 0 | |

**Indexes:**
- `user_drill_stats_user_drill_idx` UNIQUE on (user_id, drill_id)

---

# Migration 0012: Reference & Analysis

## reference_tracks
Audio reference tracks.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| name | TEXT | NOT NULL | | Track name |
| description | TEXT | | NULL | |
| r2_key | TEXT | NOT NULL | | R2 storage key |
| file_size_bytes | BIGINT | NOT NULL | | |
| mime_type | TEXT | NOT NULL | | audio/mpeg, etc. |
| duration_seconds | REAL | | NULL | |
| artist | TEXT | | NULL | |
| album | TEXT | | NULL | |
| genre | TEXT | | NULL | |
| bpm | REAL | | NULL | Beats per minute |
| key_signature | TEXT | | NULL | Musical key |
| tags | TEXT[] | | NULL | |
| status | TEXT | NOT NULL | 'processing' | processing/ready/error |
| error_message | TEXT | | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `reference_tracks_user_idx` on (user_id)
- `reference_tracks_status_idx` on (status)

---

## track_analyses
Analysis runs on tracks.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| track_id | UUID | FK reference_tracks(id) CASCADE | | |
| analysis_type | TEXT | NOT NULL | | spectral/rhythm/etc. |
| version | TEXT | NOT NULL | | Analyzer version |
| status | TEXT | NOT NULL | 'pending' | pending/running/completed/error |
| started_at | TIMESTAMPTZ | | NULL | |
| completed_at | TIMESTAMPTZ | | NULL | |
| error_message | TEXT | | NULL | |
| summary | JSONB | | NULL | Quick access stats |
| manifest | JSONB | | NULL | Frame manifest |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `track_analyses_track_idx` on (track_id)

---

## track_annotations
User annotations on tracks.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| track_id | UUID | FK reference_tracks(id) CASCADE | | |
| user_id | UUID | FK users(id) CASCADE | | |
| start_time_ms | INTEGER | NOT NULL | | |
| end_time_ms | INTEGER | | NULL | |
| title | TEXT | NOT NULL | | |
| content | TEXT | | NULL | |
| category | TEXT | | NULL | |
| color | TEXT | | NULL | |
| is_private | BOOLEAN | NOT NULL | true | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## track_regions
Named regions/sections.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| track_id | UUID | FK reference_tracks(id) CASCADE | | |
| user_id | UUID | FK users(id) CASCADE | | |
| start_time_ms | INTEGER | NOT NULL | | |
| end_time_ms | INTEGER | NOT NULL | | |
| name | TEXT | NOT NULL | | |
| description | TEXT | | NULL | |
| section_type | TEXT | | NULL | intro/verse/chorus/etc. |
| color | TEXT | | NULL | |
| display_order | INTEGER | NOT NULL | 0 | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## analysis_frame_manifests
Frame data manifest.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| analysis_id | UUID | FK track_analyses(id) CASCADE | | |
| manifest_version | INTEGER | NOT NULL | 1 | |
| hop_ms | INTEGER | NOT NULL | | Hop size in ms |
| frame_count | INTEGER | NOT NULL | | Total frames |
| duration_ms | INTEGER | NOT NULL | | |
| sample_rate | INTEGER | NOT NULL | | Audio sample rate |
| bands | INTEGER | NOT NULL | | Frequency bands |
| bytes_per_frame | INTEGER | NOT NULL | | |
| frame_layout | JSONB | NOT NULL | | Field definitions |
| events | JSONB | | NULL | Detected events |
| fingerprint | TEXT | | NULL | Content hash |
| analyzer_version | TEXT | NOT NULL | | |
| chunk_size_frames | INTEGER | NOT NULL | | Frames per chunk |
| total_chunks | INTEGER | NOT NULL | | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## analysis_frame_data
Binary frame chunks.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| manifest_id | UUID | FK analysis_frame_manifests(id) CASCADE | | |
| chunk_index | INTEGER | NOT NULL | | |
| start_frame | INTEGER | NOT NULL | | |
| end_frame | INTEGER | NOT NULL | | |
| start_time_ms | INTEGER | NOT NULL | | |
| end_time_ms | INTEGER | NOT NULL | | |
| frame_data | BYTEA | NOT NULL | | Binary data |
| frame_count | INTEGER | NOT NULL | | |
| compressed | BOOLEAN | NOT NULL | false | |
| compression_type | TEXT | | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `analysis_frame_data_manifest_chunk_idx` UNIQUE on (manifest_id, chunk_index)

---

## analysis_events
Detected events in analysis.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| analysis_id | UUID | FK track_analyses(id) CASCADE | | |
| time_ms | INTEGER | NOT NULL | | Event time |
| duration_ms | INTEGER | | NULL | |
| event_type | TEXT | NOT NULL | | beat/downbeat/section/etc. |
| event_data | JSONB | | NULL | Event details |
| confidence | REAL | | NULL | 0-1 |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `analysis_events_analysis_time_idx` on (analysis_id, time_ms)

---

## listening_prompt_templates
Listening exercise templates.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| name | TEXT | NOT NULL | | |
| description | TEXT | | NULL | |
| category | TEXT | NOT NULL | | |
| difficulty | TEXT | NOT NULL | 'beginner' | |
| prompt_text | TEXT | NOT NULL | | Main prompt |
| hints | JSONB | | NULL | Hint array |
| expected_observations | JSONB | | NULL | What to look for |
| tags | TEXT[] | | NULL | |
| display_order | INTEGER | NOT NULL | 0 | |
| is_active | BOOLEAN | NOT NULL | true | |
| created_by | UUID | FK users(id) | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## listening_prompt_presets
Preset configurations for prompts.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| name | TEXT | NOT NULL | | |
| description | TEXT | | NULL | |
| template_id | UUID | FK listening_prompt_templates(id) CASCADE | | |
| preset_type | TEXT | NOT NULL | | |
| config | JSONB | NOT NULL | | Preset configuration |
| is_active | BOOLEAN | NOT NULL | true | |
| created_by | UUID | FK users(id) | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

# Migration 0013: Platform

## feedback
User feedback submissions.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| feedback_type | TEXT | NOT NULL | | bug/feature/general |
| title | TEXT | NOT NULL | | |
| description | TEXT | NOT NULL | | |
| status | TEXT | NOT NULL | 'new' | new/reviewed/resolved |
| priority | TEXT | | 'normal' | low/normal/high/critical |
| admin_response | TEXT | | NULL | |
| resolved_at | TIMESTAMPTZ | | NULL | |
| metadata | JSONB | | NULL | Browser info, etc. |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## ideas
User idea submissions.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| title | TEXT | NOT NULL | | |
| content | TEXT | | NULL | |
| category | TEXT | | NULL | |
| tags | TEXT[] | | NULL | |
| is_pinned | BOOLEAN | NOT NULL | false | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## infobase_entries
Knowledge base entries.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| title | TEXT | NOT NULL | | |
| content | TEXT | NOT NULL | | |
| category | TEXT | | NULL | |
| tags | TEXT[] | | NULL | |
| is_pinned | BOOLEAN | NOT NULL | false | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## onboarding_flows
Onboarding flow definitions.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| name | TEXT | UNIQUE NOT NULL | | |
| description | TEXT | | NULL | |
| is_active | BOOLEAN | NOT NULL | true | |
| total_steps | INTEGER | NOT NULL | 0 | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## onboarding_steps
Steps in an onboarding flow.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| flow_id | UUID | FK onboarding_flows(id) CASCADE | | |
| step_order | INTEGER | NOT NULL | | |
| step_type | TEXT | NOT NULL | | welcome/question/tour/etc. |
| title | TEXT | NOT NULL | | |
| description | TEXT | | NULL | |
| target_selector | TEXT | | NULL | CSS selector for tour |
| target_route | TEXT | | NULL | Route for this step |
| fallback_content | TEXT | | NULL | |
| options | JSONB | | NULL | For question steps |
| allows_multiple | BOOLEAN | NOT NULL | false | Multi-select |
| required | BOOLEAN | NOT NULL | false | |
| action_type | TEXT | | NULL | |
| action_config | JSONB | | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## user_onboarding_state
User's onboarding progress.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| flow_id | UUID | FK onboarding_flows(id) CASCADE | | |
| current_step_id | UUID | FK onboarding_steps(id) | NULL | |
| status | TEXT | NOT NULL | 'pending' | pending/in_progress/completed/skipped |
| can_resume | BOOLEAN | NOT NULL | true | |
| started_at | TIMESTAMPTZ | | NULL | |
| completed_at | TIMESTAMPTZ | | NULL | |
| skipped_at | TIMESTAMPTZ | | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## user_onboarding_responses
User responses to onboarding questions.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| step_id | UUID | FK onboarding_steps(id) CASCADE | | |
| response | JSONB | NOT NULL | | Response data |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `user_onboarding_responses_user_step_idx` UNIQUE on (user_id, step_id)

---

## user_interests
User interest tags.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| interest_key | TEXT | NOT NULL | | Interest identifier |
| interest_label | TEXT | NOT NULL | | Display label |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `user_interests_user_key_idx` UNIQUE on (user_id, interest_key)

---

## user_settings
User preferences.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| key | TEXT | NOT NULL | | Setting key |
| value | JSONB | NOT NULL | | Setting value |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `user_settings_user_key_idx` UNIQUE on (user_id, key)

---

## inbox_items
User inbox/quick capture.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| title | TEXT | NOT NULL | | |
| description | TEXT | | NULL | |
| item_type | TEXT | NOT NULL | 'note' | note/task/idea |
| tags | TEXT[] | | NULL | |
| is_processed | BOOLEAN | NOT NULL | false | |
| processed_at | TIMESTAMPTZ | | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## user_references
User reference library.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| title | TEXT | NOT NULL | | |
| content | TEXT | | NULL | |
| url | TEXT | | NULL | External link |
| category | TEXT | | NULL | |
| tags | TEXT[] | | NULL | |
| is_pinned | BOOLEAN | NOT NULL | false | |
| is_archived | BOOLEAN | NOT NULL | false | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## feature_flags
Runtime feature toggles.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| flag_name | TEXT | UNIQUE NOT NULL | | |
| enabled | BOOLEAN | NOT NULL | false | |
| description | TEXT | | NULL | |
| metadata | JSONB | | NULL | Extra config |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

# Summary

**Total Tables: 79**

| Migration | Tables |
|-----------|--------|
| 0001_auth | 6 |
| 0002_rbac | 6 |
| 0003_gamification | 8 |
| 0004_focus | 4 |
| 0005_habits_goals | 4 |
| 0006_quests | 3 |
| 0007_planning | 3 |
| 0008_market | 5 |
| 0009_books | 2 |
| 0010_fitness | 10 |
| 0011_learn | 5 |
| 0012_reference | 9 |
| 0013_platform | 14 |
| **TOTAL** | **79** |
