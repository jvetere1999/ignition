# Tables Referenced in Backend Code

**Generated:** January 10, 2026  
**Source:** `app/backend/crates/api/src/`

---

## Overview

This document catalogs all database tables referenced by the Rust backend, organized by repository file.

**Total Unique Tables Referenced:** 67

---

## Tables by Repository File

### `db/repos.rs` (Auth Core)

| Table | Operations | Notes |
|-------|------------|-------|
| `users` | SELECT, INSERT, UPDATE | Core user CRUD |
| `accounts` | SELECT, INSERT, UPSERT | OAuth account linking |
| `sessions` | SELECT, INSERT, UPDATE, DELETE | Session management |
| `audit_log` | INSERT | Audit trail |
| `user_roles` | SELECT, INSERT | RBAC assignment |
| `roles` | SELECT | RBAC definitions |

---

### `db/admin_repos.rs` (Admin Operations)

| Table | Operations | Notes |
|-------|------------|-------|
| `users` | SELECT, UPDATE, DELETE | User management |
| `activity_events` | DELETE | Data cleanup |
| `user_progress` | DELETE | Cascade delete |
| `focus_sessions` | DELETE | Cascade delete |
| `calendar_events` | DELETE | Cascade delete |
| `user_quest_progress` | DELETE | Cascade delete |
| `habit_logs` | DELETE | Cascade delete |
| `habits` | DELETE | Cascade delete |
| `goal_milestones` | DELETE | Cascade delete |
| `goals` | DELETE | Cascade delete |
| `books` | DELETE | Cascade delete |
| `reading_sessions` | DELETE | Cascade delete |
| `feedback` | DELETE | Cascade delete |
| `ideas` | DELETE | Cascade delete |
| `user_onboarding_responses` | DELETE | Cascade delete |
| `user_onboarding_state` | DELETE | Cascade delete |
| `user_settings` | DELETE | Cascade delete |
| `points_ledger` | DELETE | Cascade delete |
| `user_wallet` | DELETE | Cascade delete |
| `sessions` | DELETE | Cascade delete |
| `accounts` | DELETE | Cascade delete |
| `exercises` | SELECT (COUNT) | Stats |
| `quests` | SELECT, INSERT, UPDATE, DELETE | Quest admin |
| `universal_quests` | SELECT (COUNT) | Stats |
| `market_items` | SELECT (COUNT) | Stats |
| `user_achievements` | SELECT (COUNT) | Stats |
| `audit_log` | SELECT | Audit viewing |

---

### `db/gamification_repos.rs`

| Table | Operations | Notes |
|-------|------------|-------|
| `user_progress` | SELECT, INSERT, UPDATE | XP/level tracking |
| `points_ledger` | SELECT, INSERT | Transaction history |
| `user_wallet` | SELECT, INSERT, UPDATE | Coin balance |
| `user_streaks` | SELECT, INSERT, UPDATE | Streak tracking |
| `achievement_definitions` | SELECT | Achievement catalog |
| `user_achievements` | SELECT, INSERT | Earned achievements |

---

### `db/focus_repos.rs`

| Table | Operations | Notes |
|-------|------------|-------|
| `focus_sessions` | SELECT, INSERT, UPDATE | Focus session CRUD |
| `focus_pause_state` | SELECT, INSERT, DELETE | Pause state sync |
| `focus_libraries` | SELECT, INSERT, DELETE | Music libraries |
| `focus_library_tracks` | DELETE | Cascade with library |

---

### `db/habits_goals_repos.rs`

| Table | Operations | Notes |
|-------|------------|-------|
| `habits` | SELECT, INSERT, UPDATE | Habit CRUD |
| `habit_logs` | SELECT, INSERT | Completion logging |
| `goals` | SELECT, INSERT, UPDATE | Goal CRUD |
| `goal_milestones` | SELECT, INSERT, UPDATE | Milestone CRUD |

---

### `db/quests_repos.rs`

| Table | Operations | Notes |
|-------|------------|-------|
| `user_quests` | SELECT, INSERT, UPDATE | User quest CRUD |

---

### `db/platform_repos.rs`

| Table | Operations | Notes |
|-------|------------|-------|
| `calendar_events` | SELECT, INSERT, UPDATE, DELETE | Calendar CRUD |
| `daily_plans` | SELECT, INSERT, UPSERT | Daily planning |
| `habits` | SELECT | For plan generation |
| `universal_quests` | SELECT | For plan generation |
| `feedback` | SELECT, INSERT | Feedback CRUD |
| `infobase_entries` | SELECT, INSERT, UPDATE, DELETE | Infobase CRUD |
| `ideas` | SELECT, INSERT, UPDATE, DELETE | Ideas CRUD |
| `onboarding_flows` | SELECT | Flow definitions |
| `onboarding_steps` | SELECT | Step definitions |
| `user_onboarding_state` | SELECT, INSERT, UPDATE | User progress |
| `user_onboarding_responses` | SELECT, INSERT, UPSERT | Step responses |
| `user_settings` | SELECT, INSERT, UPSERT | Settings CRUD |
| `users` | DELETE | Account deletion |

---

### `db/market_repos.rs`

| Table | Operations | Notes |
|-------|------------|-------|
| `market_items` | SELECT, UPDATE | Item catalog |
| `user_wallet` | SELECT, UPDATE | Balance management |
| `user_purchases` | SELECT, INSERT | Purchase history |

---

### `routes/db/market_repos.rs` (Market Routes)

| Table | Operations | Notes |
|-------|------------|-------|
| `market_items` | SELECT | Item listing |
| `user_wallet` | SELECT, INSERT, UPDATE | Wallet ops |
| `user_market_purchases` | SELECT, INSERT | Extended purchases |
| `market_transactions` | INSERT | Transaction log |
| `user_rewards` | SELECT | Reward claims |
| `market_recommendations` | SELECT | AI recommendations |

---

### `db/exercise_repos.rs`

| Table | Operations | Notes |
|-------|------------|-------|
| `exercises` | SELECT, INSERT, DELETE | Exercise library |
| `workouts` | SELECT, INSERT, DELETE | Workout templates |
| `workout_exercises` | SELECT | Exercise details |
| `workout_sessions` | SELECT, INSERT, UPDATE | Active sessions |
| `exercise_sets` | SELECT, INSERT | Set logging |
| `training_programs` | SELECT, INSERT, UPDATE | Programs |

---

### `db/books_repos.rs`

| Table | Operations | Notes |
|-------|------------|-------|
| `books` | SELECT, INSERT, UPDATE, DELETE | Book CRUD |
| `reading_sessions` | SELECT, INSERT | Reading log |

---

### `db/learn_repos.rs`

| Table | Operations | Notes |
|-------|------------|-------|
| `learn_topics` | SELECT | Topic catalog |
| `learn_lessons` | SELECT | Lesson catalog |
| `learn_drills` | SELECT | Drill catalog |
| `user_lesson_progress` | SELECT, INSERT, UPSERT | Lesson progress |
| `user_drill_stats` | SELECT, INSERT, UPSERT | Drill stats |

---

### `db/reference_repos.rs`

| Table | Operations | Notes |
|-------|------------|-------|
| `reference_tracks` | SELECT, INSERT, UPDATE, DELETE | Track CRUD |
| `track_analyses` | SELECT, INSERT, UPDATE | Analysis CRUD |
| `track_annotations` | SELECT, INSERT, UPDATE, DELETE | Annotation CRUD |
| `track_regions` | SELECT, INSERT, UPDATE, DELETE | Region CRUD |

---

### `db/frames_repos.rs`

| Table | Operations | Notes |
|-------|------------|-------|
| `analysis_frame_manifests` | SELECT, INSERT, DELETE | Frame manifest |
| `analysis_frame_data` | SELECT, INSERT | Binary frame data |
| `analysis_events` | SELECT | Analysis events |

---

### `db/listening_repos.rs`

| Table | Operations | Notes |
|-------|------------|-------|
| `listening_prompt_templates` | SELECT, INSERT, UPDATE, DELETE | Template CRUD |
| `listening_prompt_presets` | SELECT, INSERT, UPDATE, DELETE | Preset CRUD |

---

### `services/oauth.rs`

| Table | Operations | Notes |
|-------|------------|-------|
| `oauth_states` | INSERT, DELETE | CSRF tokens |

---

### `db/inbox_repos.rs`

| Table | Operations | Notes |
|-------|------------|-------|
| `user_inbox` | SELECT, INSERT, UPDATE, DELETE | Inbox CRUD |

---

### `db/user_references_repos.rs`

| Table | Operations | Notes |
|-------|------------|-------|
| `user_references` | SELECT, INSERT, UPDATE, DELETE | References CRUD |

---

### `db/user_settings_repos.rs`

| Table | Operations | Notes |
|-------|------------|-------|
| `user_settings` | SELECT, INSERT, UPSERT | Settings CRUD |

---

## Route Handlers to Table Mappings

| Route File | API Path | Tables Used |
|------------|----------|-------------|
| `routes/auth.rs` | `/api/auth/*` | users, accounts, sessions, oauth_states |
| `routes/focus.rs` | `/api/focus/*` | focus_sessions, focus_pause_state, focus_libraries |
| `routes/quests.rs` | `/api/quests/*` | user_quests, universal_quests |
| `routes/habits.rs` | `/api/habits/*` | habits, habit_logs |
| `routes/goals.rs` | `/api/goals/*` | goals, goal_milestones |
| `routes/calendar.rs` | `/api/calendar/*` | calendar_events |
| `routes/daily.rs` | `/api/plan/*` | daily_plans, habits, universal_quests |
| `routes/exercise.rs` | `/api/exercise/*`, `/api/workouts/*` | exercises, workouts, workout_sessions, exercise_sets, training_programs |
| `routes/market.rs` | `/api/market/*` | market_items, user_wallet, user_purchases, market_transactions |
| `routes/reference.rs` | `/api/reference/*` | reference_tracks, track_analyses, track_annotations, track_regions |
| `routes/user_references.rs` | `/api/references/*` | user_references |
| `routes/frames.rs` | `/api/frames/*` | analysis_frame_manifests, analysis_frame_data, analysis_events |
| `routes/learn.rs` | `/api/learn/*` | learn_topics, learn_lessons, learn_drills, user_lesson_progress, user_drill_stats |
| `routes/user.rs` | `/api/user/*` | users, user_settings |
| `routes/onboarding.rs` | `/api/onboarding/*` | onboarding_flows, onboarding_steps, user_onboarding_state, user_onboarding_responses |
| `routes/infobase.rs` | `/api/infobase/*` | infobase_entries |
| `routes/ideas.rs` | `/api/ideas/*` | ideas |
| `routes/feedback.rs` | `/api/feedback/*` | feedback |
| `routes/books.rs` | `/api/books/*` | books, reading_sessions |
| `routes/gamification.rs` | `/api/gamification/*` | user_progress, user_wallet, user_streaks, achievement_definitions, user_achievements, points_ledger |
| `routes/inbox.rs` | `/api/inbox/*` | user_inbox |
| `routes/today.rs` | `/api/today` | users, user_progress, focus_sessions, daily_plans, inbox_items, user_quests, habit_completions, user_wallet |
| `routes/sync.rs` | `/api/sync/*` | focus_sessions, user_progress, users, user_settings, habits, habit_logs, user_quest_progress, inbox_items |
| `routes/settings.rs` | `/api/settings/*` | user_settings |
| `routes/admin.rs` | `/api/admin/*` | users, sessions, all tables (dynamic) |
| `routes/listening.rs` | `/api/listening/*` | listening_prompt_templates, listening_prompt_presets |

---

## Table Operation Matrix

### CRUD Operations by Table

| Table | Create | Read | Update | Delete |
|-------|--------|------|--------|--------|
| `users` | ✅ | ✅ | ✅ | ✅ |
| `accounts` | ✅ | ✅ | ✅ | ✅ |
| `sessions` | ✅ | ✅ | ✅ | ✅ |
| `audit_log` | ✅ | ✅ | ❌ | ❌ |
| `roles` | ❌ | ✅ | ❌ | ❌ |
| `user_roles` | ✅ | ✅ | ❌ | ❌ |
| `user_progress` | ✅ | ✅ | ✅ | ✅ |
| `user_wallet` | ✅ | ✅ | ✅ | ✅ |
| `points_ledger` | ✅ | ✅ | ❌ | ✅ |
| `user_streaks` | ✅ | ✅ | ✅ | ❌ |
| `achievement_definitions` | ❌ | ✅ | ❌ | ❌ |
| `user_achievements` | ✅ | ✅ | ❌ | ❌ |
| `focus_sessions` | ✅ | ✅ | ✅ | ✅ |
| `focus_pause_state` | ✅ | ✅ | ❌ | ✅ |
| `focus_libraries` | ✅ | ✅ | ❌ | ✅ |
| `habits` | ✅ | ✅ | ✅ | ✅ |
| `habit_logs` | ✅ | ✅ | ❌ | ✅ |
| `goals` | ✅ | ✅ | ✅ | ✅ |
| `goal_milestones` | ✅ | ✅ | ✅ | ✅ |
| `user_quests` | ✅ | ✅ | ✅ | ❌ |
| `universal_quests` | ✅ | ✅ | ✅ | ✅ |
| `calendar_events` | ✅ | ✅ | ✅ | ✅ |
| `daily_plans` | ✅ | ✅ | ✅ | ❌ |
| `market_items` | ❌ | ✅ | ✅ | ❌ |
| `user_purchases` | ✅ | ✅ | ❌ | ❌ |
| `market_transactions` | ✅ | ❌ | ❌ | ❌ |
| `books` | ✅ | ✅ | ✅ | ✅ |
| `reading_sessions` | ✅ | ✅ | ❌ | ✅ |
| `exercises` | ✅ | ✅ | ❌ | ✅ |
| `workouts` | ✅ | ✅ | ❌ | ✅ |
| `workout_sessions` | ✅ | ✅ | ✅ | ❌ |
| `exercise_sets` | ✅ | ✅ | ❌ | ❌ |
| `training_programs` | ✅ | ✅ | ✅ | ❌ |
| `reference_tracks` | ✅ | ✅ | ✅ | ✅ |
| `track_analyses` | ✅ | ✅ | ✅ | ❌ |
| `track_annotations` | ✅ | ✅ | ✅ | ✅ |
| `track_regions` | ✅ | ✅ | ✅ | ✅ |
| `learn_topics` | ❌ | ✅ | ❌ | ❌ |
| `learn_lessons` | ❌ | ✅ | ❌ | ❌ |
| `learn_drills` | ❌ | ✅ | ❌ | ❌ |
| `user_lesson_progress` | ✅ | ✅ | ✅ | ❌ |
| `user_drill_stats` | ✅ | ✅ | ✅ | ❌ |
| `feedback` | ✅ | ✅ | ❌ | ✅ |
| `ideas` | ✅ | ✅ | ✅ | ✅ |
| `infobase_entries` | ✅ | ✅ | ✅ | ✅ |
| `user_settings` | ✅ | ✅ | ✅ | ✅ |
| `inbox_items` | ✅ | ✅ | ✅ | ✅ |
| `user_references` | ✅ | ✅ | ✅ | ✅ |

---

## Naming Inconsistencies Found

| Issue | Tables Involved | Notes |
|-------|-----------------|-------|
| Plural/Singular | `user_inbox` vs `inbox_items` | Two different tables or naming conflict? |
| Prefixing | `user_quests` vs `quests` | Backend uses `user_quests`, some refs use `quests` |
| Market tables | `user_purchases` vs `user_market_purchases` | Two separate migrations created similar tables |
| Habit logs | `habit_logs` vs `habit_completions` | Migration uses `habit_completions`, backend uses both |

---

## System Tables

| Table | Purpose |
|-------|---------|
| `_sqlx_migrations` | SQLx migration tracking |
| `oauth_states` | Temporary CSRF state storage |
