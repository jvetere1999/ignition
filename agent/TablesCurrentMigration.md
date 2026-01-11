# Tables in Current Migrations

**Generated:** January 10, 2026  
**Source:** `app/database/migrations/`

---

## Overview

This document catalogs all tables created by migrations, organized by migration file.

**Total Migrations:** 21  
**Total Unique Tables:** ~75 (accounting for drops/recreates)

---

## Migration 0001: Auth Substrate

**File:** `0001_auth_substrate.sql`  
**Tables Created:** 11

| Table | Columns |
|-------|---------|
| `users` | id, name, email, email_verified, image, role, approved, age_verified, tos_accepted, tos_accepted_at, tos_version, last_activity_at, created_at, updated_at |
| `accounts` | id, user_id, type, provider, provider_account_id, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, created_at, updated_at |
| `sessions` | id, user_id, token, expires_at, created_at, last_activity_at, user_agent, ip_address, rotated_from |
| `verification_tokens` | identifier, token, expires, created_at |
| `authenticators` | id, user_id, credential_id, provider_account_id, credential_public_key, counter, credential_device_type, credential_backed_up, transports, created_at |
| `roles` | id, name, description, parent_role_id, created_at |
| `entitlements` | id, name, description, resource, action, created_at |
| `role_entitlements` | role_id, entitlement_id, created_at |
| `user_roles` | user_id, role_id, granted_by, granted_at, expires_at |
| `audit_log` | id, user_id, session_id, event_type, resource_type, resource_id, action, status, details, ip_address, user_agent, request_id, created_at |
| `activity_events` | id, user_id, event_type, category, metadata, xp_earned, coins_earned, created_at |

---

## Migration 0002: Gamification Substrate

**File:** `0002_gamification_substrate.sql`  
**Tables Created:** 8

| Table | Columns |
|-------|---------|
| `skill_definitions` | id, key, name, description, category, icon, max_level, stars_per_level, sort_order, created_at |
| `user_skills` | id, user_id, skill_key, current_stars, current_level, created_at, updated_at |
| `achievement_definitions` | id, key, name, description, category, icon, trigger_type, trigger_config, reward_coins, reward_xp, is_hidden, sort_order, created_at |
| `user_achievements` | id, user_id, achievement_key, earned_at, notified |
| `user_progress` | id, user_id, total_xp, current_level, xp_to_next_level, total_skill_stars, created_at, updated_at |
| `user_wallet` | id, user_id, coins, total_earned, total_spent, created_at, updated_at |
| `points_ledger` | id, user_id, event_type, event_id, coins, xp, skill_stars, skill_key, reason, idempotency_key, created_at |
| `user_streaks` | id, user_id, streak_type, current_streak, longest_streak, last_activity_date, created_at, updated_at |

---

## Migration 0003: Focus Substrate

**File:** `0003_focus_substrate.sql`  
**Tables Created:** 2

| Table | Columns |
|-------|---------|
| `focus_sessions` | id, user_id, mode, duration_seconds, started_at, completed_at, abandoned_at, expires_at, paused_at, paused_remaining_seconds, status, xp_awarded, coins_awarded, task_id, task_title, created_at |
| `focus_pause_state` | id, user_id, session_id, mode, time_remaining_seconds, paused_at, created_at, updated_at |

---

## Migration 0004: Habits & Goals Substrate

**File:** `0004_habits_goals_substrate.sql`  
**Tables Created:** 4

| Table | Columns |
|-------|---------|
| `habits` | id, user_id, name, description, frequency, target_count, custom_days, icon, color, is_active, current_streak, longest_streak, last_completed_at, sort_order, created_at, updated_at |
| `habit_completions` | id, habit_id, user_id, completed_at, completed_date, notes |
| `goals` | id, user_id, title, description, category, target_date, started_at, completed_at, status, progress, priority, sort_order, created_at, updated_at |
| `goal_milestones` | id, goal_id, title, description, is_completed, completed_at, sort_order |

---

## Migration 0005: Quests Substrate

**File:** `0005_quests_substrate.sql`  
**Tables Created:** 3

| Table | Columns |
|-------|---------|
| `universal_quests` | id, title, description, type, xp_reward, coin_reward, target, target_type, target_config, skill_key, is_active, created_by, sort_order, created_at, updated_at |
| `user_quest_progress` | id, user_id, quest_id, status, progress, accepted_at, completed_at, claimed_at, last_reset_at, times_completed, created_at, updated_at |
| `user_quests` | id, user_id, title, description, category, difficulty, xp_reward, coin_reward, status, is_active, is_universal, source_quest_id, accepted_at, completed_at, expires_at, is_repeatable, repeat_frequency, last_completed_date, streak_count, created_at, updated_at |

---

## Migration 0006: Planning Substrate

**File:** `0006_planning_substrate.sql`  
**Tables Created:** 3

| Table | Columns |
|-------|---------|
| `calendar_events` | id, user_id, title, description, event_type, start_time, end_time, all_day, timezone, location, workout_id, habit_id, goal_id, recurrence_rule, recurrence_end, parent_event_id, color, reminder_minutes, metadata, created_at, updated_at |
| `daily_plans` | id, user_id, date, items, notes, created_at, updated_at |
| `plan_templates` | id, user_id, name, description, items, is_public, category, use_count, created_at, updated_at |

---

## Migration 0007: Market Substrate (Initial)

**File:** `0007_market_substrate.sql`  
**Tables Created:** 2 (⚠️ Overwritten by 0017)

| Table | Columns |
|-------|---------|
| `market_items` | id, key, name, description, category, cost_coins, icon, image_url, is_global, is_available, is_active, is_consumable, uses_per_purchase, total_stock, remaining_stock, created_by_user_id, sort_order, created_at, updated_at |
| `user_purchases` | id, user_id, item_id, cost_coins, quantity, purchased_at, redeemed_at, uses_remaining, status, refunded_at, refund_reason |

---

## Migration 0008: Reference Tracks Substrate

**File:** `0008_reference_tracks_substrate.sql`  
**Tables Created:** 5

| Table | Columns |
|-------|---------|
| `reference_tracks` | id, user_id, name, description, r2_key, file_size_bytes, mime_type, duration_seconds, artist, album, genre, bpm, key_signature, tags, status, error_message, created_at, updated_at |
| `track_analyses` | id, track_id, analysis_type, version, status, started_at, completed_at, error_message, summary, manifest, created_at, updated_at |
| `analysis_frame_chunks` | id, analysis_id, chunk_index, start_time_ms, end_time_ms, frames, created_at |
| `track_annotations` | id, track_id, user_id, start_time_ms, end_time_ms, title, content, category, color, is_private, created_at, updated_at |
| `track_regions` | id, track_id, user_id, start_time_ms, end_time_ms, name, description, section_type, color, display_order, created_at, updated_at |

---

## Migration 0009: Analysis Frames (Binary Storage)

**File:** `0009_analysis_frames_bytea.sql`  
**Tables Created:** 3

| Table | Columns |
|-------|---------|
| `analysis_frame_manifests` | id, analysis_id, manifest_version, hop_ms, frame_count, duration_ms, sample_rate, bands, bytes_per_frame, frame_layout, events, fingerprint, analyzer_version, chunk_size_frames, total_chunks, created_at |
| `analysis_frame_data` | id, manifest_id, chunk_index, start_frame, end_frame, start_time_ms, end_time_ms, frame_data, frame_count, compressed, compression_type, created_at |
| `analysis_events` | id, analysis_id, time_ms, duration_ms, event_type, event_data, confidence, created_at |

---

## Migration 0010: Listening Prompt Templates

**File:** `0010_listening_prompt_templates.sql`  
**Tables Created:** 2

| Table | Columns |
|-------|---------|
| `listening_prompt_templates` | id, name, description, category, difficulty, prompt_text, hints, expected_observations, tags, display_order, is_active, created_by, created_at, updated_at |
| `listening_prompt_presets` | id, name, description, template_id, preset_type, config, is_active, created_by, created_at, updated_at |

---

## Migration 0011: Fitness Substrate

**File:** `0011_fitness_substrate.sql`  
**Tables Created:** 10

| Table | Columns |
|-------|---------|
| `exercises` | id, name, description, category, muscle_groups, equipment, is_custom, is_builtin, user_id, created_at |
| `workouts` | id, user_id, name, description, estimated_duration, is_template, created_at, updated_at |
| `workout_sections` | id, workout_id, name, sort_order |
| `workout_exercises` | id, workout_id, section_id, exercise_id, sets, reps, weight, duration, rest_seconds, notes, sort_order |
| `workout_sessions` | id, user_id, workout_id, started_at, completed_at, notes, rating, xp_awarded, coins_awarded |
| `exercise_sets` | id, session_id, exercise_id, set_number, reps, weight, duration, is_warmup, is_dropset, rpe, notes, completed_at |
| `personal_records` | id, user_id, exercise_id, record_type, value, reps, achieved_at, exercise_set_id, previous_value, created_at |
| `training_programs` | id, user_id, name, description, duration_weeks, goal, difficulty, is_active, started_at, completed_at, created_at, updated_at |
| `program_weeks` | id, program_id, week_number, name, is_deload, notes |
| `program_workouts` | id, program_week_id, workout_id, day_of_week, order_index, intensity_modifier |

---

## Migration 0012: Books Substrate

**File:** `0012_books_substrate.sql`  
**Tables Created:** 2

| Table | Columns |
|-------|---------|
| `books` | id, user_id, title, author, total_pages, current_page, status, started_at, completed_at, rating, notes, cover_blob_id, created_at, updated_at |
| `reading_sessions` | id, book_id, user_id, pages_read, duration_minutes, started_at, notes, xp_awarded, coins_awarded |

---

## Migration 0013: Learn Substrate

**File:** `0013_learn_substrate.sql`  
**Tables Created:** 5

| Table | Columns |
|-------|---------|
| `learn_topics` | id, key, name, description, category, icon, sort_order, created_at |
| `learn_lessons` | id, topic_id, key, title, description, content_markdown, duration_minutes, difficulty, quiz_json, xp_reward, coin_reward, skill_key, skill_star_reward, audio_r2_key, sort_order, created_at |
| `learn_drills` | id, topic_id, key, title, description, drill_type, config_json, difficulty, duration_seconds, xp_reward, sort_order, created_at |
| `user_lesson_progress` | id, user_id, lesson_id, status, started_at, completed_at, quiz_score, attempts |
| `user_drill_stats` | id, user_id, drill_id, total_attempts, correct_answers, best_score, average_score, current_streak, best_streak, last_attempt_at, total_time_seconds |

---

## Migration 0014: Platform Substrate

**File:** `0014_platform_substrate.sql`  
**Tables Created:** 8

| Table | Columns |
|-------|---------|
| `feedback` | id, user_id, feedback_type, title, description, status, priority, admin_response, resolved_at, metadata, created_at, updated_at |
| `infobase_entries` | id, user_id, title, content, category, tags, created_at, updated_at |
| `ideas` | id, user_id, title, content, category, tags, is_pinned, created_at, updated_at |
| `onboarding_flows` | id, name, description, is_active, total_steps, created_at, updated_at |
| `onboarding_steps` | id, flow_id, step_order, step_type, title, description, target_selector, target_route, fallback_content, options, allows_multiple, required, action_type, action_config, created_at, updated_at |
| `user_onboarding_state` | id, user_id, flow_id, current_step_id, status, can_resume, started_at, completed_at, skipped_at, created_at, updated_at |
| `user_onboarding_responses` | id, user_id, step_id, response, created_at |
| `user_interests` | id, user_id, interest_key, interest_label, created_at |

---

## Migration 0015: User Settings

**File:** `0015_user_settings.sql`  
**Tables Created:** 1

| Table | Columns |
|-------|---------|
| `user_settings` | id, user_id, key, value, updated_at, created_at |

---

## Migration 0016: Focus Pause Sync (Fix)

**File:** `0016_focus_pause_sync.sql`  
**Tables Created:** 1 (Replaces 0003 version)

| Table | Columns |
|-------|---------|
| `focus_pause_state` | id, user_id, session_id, is_paused, paused_at, resumed_at, updated_at, created_at |

⚠️ **Note:** This DROP/CREATE replaces the version from 0003

---

## Migration 0017: Market Extended

**File:** `0017_market_extended.sql`  
**Tables Created:** 6 (Replaces 0007)

| Table | Columns |
|-------|---------|
| `market_items` | id, name, description, cost_coins, category, rarity, icon_url, available, available_from, available_until, created_at, updated_at |
| `user_wallet` | id, user_id, total_coins, earned_coins, spent_coins, updated_at, created_at |
| `user_rewards` | id, user_id, reward_type, coins_earned, claimed, claimed_at, created_at |
| `user_market_purchases` | id, user_id, item_id, quantity, cost_paid_coins, purchased_at |
| `market_transactions` | id, user_id, transaction_type, coins_amount, reason, created_at |
| `market_recommendations` | id, user_id, item_id, score, reason, computed_at |

⚠️ **Note:** This migration DROPs and replaces market tables from 0007 and conflicts with `user_wallet` from 0002

---

## Migration 0018: Feature Flags

**File:** `0018_remove_localStorage_guardrails.sql`  
**Tables Created:** 1

| Table | Columns |
|-------|---------|
| `feature_flags` | id, flag_name, enabled, description, created_at, updated_at |

---

## Migration 0019: User Inbox

**File:** `0019_user_inbox_tables.sql`  
**Tables Created:** 1

| Table | Columns |
|-------|---------|
| `inbox_items` | id, user_id, title, description, tags, created_at, updated_at |

---

## Migration 0020: Focus Music Libraries

**File:** `0020_focus_music_libraries.sql`  
**Tables Created:** 2

| Table | Columns |
|-------|---------|
| `focus_libraries` | id, user_id, name, description, library_type, tracks_count, is_favorite, created_at, updated_at |
| `focus_library_tracks` | id, library_id, track_id, track_title, track_url, duration_seconds, added_at |

---

## Migration 0021: User References Library

**File:** `0021_user_references_library.sql`  
**Tables Created:** 1

| Table | Columns |
|-------|---------|
| `user_references` | id, user_id, title, content, url, category, tags, is_pinned, is_archived, created_at, updated_at |

---

## Summary Statistics

| Migration | Tables Created |
|-----------|----------------|
| 0001 | 11 |
| 0002 | 8 |
| 0003 | 2 |
| 0004 | 4 |
| 0005 | 3 |
| 0006 | 3 |
| 0007 | 2 (overwritten) |
| 0008 | 5 |
| 0009 | 3 |
| 0010 | 2 |
| 0011 | 10 |
| 0012 | 2 |
| 0013 | 5 |
| 0014 | 8 |
| 0015 | 1 |
| 0016 | 1 (replaces 0003) |
| 0017 | 6 (replaces 0007) |
| 0018 | 1 |
| 0019 | 1 |
| 0020 | 2 |
| 0021 | 1 |

---

## Known Issues

### Table Conflicts

1. **`user_wallet`** - Defined in 0002, redefined in 0017 with different schema
2. **`focus_pause_state`** - Defined in 0003, replaced in 0016 with different schema
3. **`market_items`** - Defined in 0007, replaced in 0017 with different schema
4. **`user_purchases`** - Defined in 0007, renamed to `user_market_purchases` in 0017

### Missing DROP Statements

Some migrations may fail on re-run due to missing `DROP TABLE IF EXISTS` statements.

### Index Naming Issues

- Migration 0005 had index names targeting `quests` instead of `user_quests` (fixed)
