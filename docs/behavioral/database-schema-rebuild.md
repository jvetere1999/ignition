# Database Schema Rebuild & Target State

**Date:** 2026-01-10
**Status:** SPECIFICATION
**Source:** `agent/Behaviroal.md`

## End-state database layout after the rebuild process (target schema)

This is the **optimized “clean migration set” end-state** implied by your current inventories + rebuild plan: **~59 active tables**, conflicts resolved, naming standardized, unused tables removed.   

---

# 1) Global rules for the new schema

### Naming + consistency

* User-scoped tables: `user_*` only when the entity is “user-owned but not purely an event/log” (ex: `user_quests`, `user_settings`, `user_references`). 
* Canonical names chosen by the rebuild plan:

  * `habit_completions` (not `habit_logs`)
  * `inbox_items` (not `user_inbox`)
  * `user_quests` (not `quests`)   

### Multi-tenancy boundary

* **Every user-owned row has `user_id` with FK → `users(id)`**.
* Prefer `ON DELETE CASCADE` only for “pure dependents” (logs, sessions, join tables). Keep core content tables conservative.

### Determinism + auditability

* All “feed/Today” ordering must be driven by stored `sort_order` + stable tie-breaker (`created_at`, `id`) and never by unordered JSON iteration.
* All write-side side effects that must project elsewhere should get an **outbox** (see Section 6).

---

# 2) Migration file layout (what the repo will look like)

Your rebuild plan targets **13 migrations total** (12 domain migrations + seeds). 

```
0001_auth.sql
0002_gamification.sql
0003_focus.sql
0004_habits_goals.sql
0005_quests.sql
0006_planning.sql
0007_market.sql
0008_books.sql
0009_fitness.sql
0010_learn.sql
0011_reference.sql
0012_platform.sql
0013_seeds.sql
```

---

# 3) Domain-by-domain final schema (tables + key relationships)

Below is the “full scope layout” of the **target end-state** after the rebuild, grouped by domain, with the **intended FK graph**.

## A) Auth + RBAC + security audit (0001_auth.sql)

**Tables**

* `users`
* `accounts` → FK `accounts.user_id -> users.id`
* `sessions` → FK `sessions.user_id -> users.id`
* `roles`
* `user_roles` → FK `user_roles.user_id -> users.id`, FK `user_roles.role_id -> roles.id`
* `audit_log` → FK `audit_log.user_id -> users.id` (optional `session_id -> sessions.id`)

**Removed in rebuild**

* `verification_tokens`, `authenticators`, `entitlements`, `role_entitlements`  

## B) Gamification (0002_gamification.sql)

**Tables**

* `user_progress` → FK `user_progress.user_id -> users.id`
* `user_wallet` → FK `user_wallet.user_id -> users.id`

  * **Chosen wallet schema:** `coins`, `total_earned`, `total_spent` (resolves 0002 vs 0017 conflict)   
* `points_ledger` → FK `points_ledger.user_id -> users.id`

  * include `idempotency_key` unique per user (or globally), since you already model it that way 
* `user_streaks` → FK `user_streaks.user_id -> users.id`
* `achievement_definitions`
* `user_achievements` → FK `user_achievements.user_id -> users.id`

  * `achievement_key` or `achievement_id` (choose one and standardize)

**Removed in rebuild**

* `skill_definitions`, `user_skills`  

## C) Focus (0003_focus.sql)

**Tables**

* `focus_sessions` → FK `focus_sessions.user_id -> users.id`
* `focus_pause_state` → FK `focus_pause_state.user_id -> users.id`, FK `focus_pause_state.session_id -> focus_sessions.id`

  * **Chosen schema:** `is_paused`, `paused_at`, `resumed_at` (use the 0016 model)  
* `focus_libraries` → FK `focus_libraries.user_id -> users.id`
* `focus_library_tracks` → FK `focus_library_tracks.library_id -> focus_libraries.id`

## D) Habits + Goals (0004_habits_goals.sql)

**Tables**

* `habits` → FK `habits.user_id -> users.id`
* `habit_completions` → FK `habit_completions.habit_id -> habits.id`, FK `habit_completions.user_id -> users.id`
* `goals` → FK `goals.user_id -> users.id`
* `goal_milestones` → FK `goal_milestones.goal_id -> goals.id`

**Standardization**

* Enforce the rename alignment: backend had `habit_logs` in places; rebuild makes `habit_completions` canonical.  

## E) Quests (0005_quests.sql)

**Tables**

* `universal_quests`
* `user_quests` → FK `user_quests.user_id -> users.id` (optionally FK `source_quest_id -> universal_quests.id`)
* `user_quest_progress` → FK `user_quest_progress.user_id -> users.id`, FK `user_quest_progress.quest_id -> universal_quests.id`

**Standardization**

* Frontend/Docs used `quests`; migrations/backend use `user_quests`. End-state should expose “quests” at API level but store as `user_quests`.   

## F) Planning (0006_planning.sql)

**Tables**

* `calendar_events` → FK `calendar_events.user_id -> users.id`
* `daily_plans` → FK `daily_plans.user_id -> users.id`

  * Strongly recommend unique `(user_id, date)` for determinism

**Removed**

* `plan_templates`  

## G) Market (0007_market.sql)

**Tables**

* `market_items`
* `user_purchases` → FK `user_purchases.user_id -> users.id`, FK `user_purchases.item_id -> market_items.id`
* `market_transactions` → FK `market_transactions.user_id -> users.id`

**Conflict resolution**

* `market_items`: “merge best of both” (keep availability window + rarity)  
* Consolidations/removals:

  * remove `user_market_purchases` (dup)
  * remove `user_rewards` (fold into `points_ledger`)
  * remove `market_recommendations`   

## H) Books (0008_books.sql)

**Tables**

* `books` → FK `books.user_id -> users.id`
* `reading_sessions` → FK `reading_sessions.user_id -> users.id`, FK `reading_sessions.book_id -> books.id`

## I) Fitness (0009_fitness.sql)

Your rebuild plan condenses fitness down to **6 tables** (dropping partial “program scheduling” tables).  

**Tables**

* `exercises` (optionally FK `user_id -> users.id` for custom exercises)
* `workouts` → FK `workouts.user_id -> users.id`
* `workout_exercises` → FK `workout_exercises.workout_id -> workouts.id`, FK `workout_exercises.exercise_id -> exercises.id`
* `workout_sessions` → FK `workout_sessions.user_id -> users.id`, FK `workout_sessions.workout_id -> workouts.id`
* `exercise_sets` → FK `exercise_sets.session_id -> workout_sessions.id`, FK `exercise_sets.exercise_id -> exercises.id`
* `training_programs` → FK `training_programs.user_id -> users.id`

**Removed**

* `workout_sections`, `personal_records`, `program_weeks`, `program_workouts` (per rebuild plan final count)   

## J) Learn (0010_learn.sql)

**Tables**

* `learn_topics`
* `learn_lessons` → FK `learn_lessons.topic_id -> learn_topics.id`
* `learn_drills` → FK `learn_drills.topic_id -> learn_topics.id`
* `user_lesson_progress` → FK `user_lesson_progress.user_id -> users.id`, FK `...lesson_id -> learn_lessons.id`
* `user_drill_stats` → FK `user_drill_stats.user_id -> users.id`, FK `...drill_id -> learn_drills.id`

## K) Reference + analysis + listening (0011_reference.sql)

Your current migrations include both “reference tracks” and “analysis frames” + “listening prompts”. 

**Tables**

* `reference_tracks` → FK `reference_tracks.user_id -> users.id`
* `track_analyses` → FK `track_analyses.track_id -> reference_tracks.id`
* `track_annotations` → FK `track_annotations.track_id -> reference_tracks.id`, FK `...user_id -> users.id`
