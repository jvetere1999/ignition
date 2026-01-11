# Comprehensive Database & API Rebuild Plan

**Created:** January 10, 2026  
**Status:** PLANNING  
**Goal:** End-to-end implementation with full DB → Backend → Frontend sync

---

## Executive Summary

This plan covers the complete rebuild of the database schema with proper synchronization across all layers:
- **Database**: Clean migration set with all tables properly structured
- **Backend**: Rust models and repos fully aligned with DB schema
- **Frontend**: API clients fully aligned with backend endpoints
- **Seed Data**: Proper initialization data for all reference tables

### Key Principles

1. **NO table removals** without explicit decision documentation
2. **Full sync validation**: Every table must have DB → BE → FE path documented
3. **Ambiguous items**: Documented in `DECISIONS_REQUIRED.md`
4. **Schema conflicts**: Resolved with clear rationale

---

## Part 1: Complete Table Inventory (75 Tables)

### Layer Coverage Matrix

| # | Table | Migration | Backend Model | Backend Repo | Frontend API | Sync Status |
|---|-------|-----------|---------------|--------------|--------------|-------------|
| **AUTH DOMAIN** |
| 1 | `users` | 0001 | ✅ `models.rs` | ✅ `repos.rs` | ✅ `user.ts` | ✅ COMPLETE |
| 2 | `accounts` | 0001 | ✅ `models.rs` | ✅ `repos.rs` | ⚙️ implicit | ✅ COMPLETE |
| 3 | `sessions` | 0001 | ✅ `models.rs` | ✅ `repos.rs` | ⚙️ implicit | ✅ COMPLETE |
| 4 | `verification_tokens` | 0001 | ❌ MISSING | ❌ MISSING | ❌ MISSING | ⚠️ **DECISION** |
| 5 | `authenticators` | 0001 | ❌ MISSING | ❌ MISSING | ❌ MISSING | ⚠️ **DECISION** |
| 6 | `roles` | 0001 | ✅ `models.rs` | ✅ `repos.rs` | ❌ backend-only | ✅ COMPLETE |
| 7 | `entitlements` | 0001 | ❌ MISSING | ❌ MISSING | ❌ MISSING | ⚠️ **DECISION** |
| 8 | `role_entitlements` | 0001 | ❌ MISSING | ❌ MISSING | ❌ MISSING | ⚠️ **DECISION** |
| 9 | `user_roles` | 0001 | ✅ `models.rs` | ✅ `repos.rs` | ❌ backend-only | ✅ COMPLETE |
| 10 | `audit_log` | 0001 | ✅ `models.rs` | ✅ `repos.rs` | ❌ admin-only | ✅ COMPLETE |
| 11 | `activity_events` | 0001 | ✅ `models.rs` | ✅ `admin_repos.rs` | ❌ backend-only | ✅ COMPLETE |
| 12 | `oauth_states` | (runtime) | ✅ `oauth_models.rs` | ✅ `oauth_repos.rs` | ❌ backend-only | ✅ COMPLETE |
| **GAMIFICATION DOMAIN** |
| 13 | `skill_definitions` | 0002 | ❌ MISSING | ❌ MISSING | ❌ MISSING | ⚠️ **DECISION** |
| 14 | `user_skills` | 0002 | ❌ MISSING | ❌ MISSING | ❌ MISSING | ⚠️ **DECISION** |
| 15 | `achievement_definitions` | 0002 | ✅ `gamification_models.rs` | ✅ `gamification_repos.rs` | ❌ backend-only | ⚠️ NEEDS FE |
| 16 | `user_achievements` | 0002 | ✅ `gamification_models.rs` | ✅ `gamification_repos.rs` | ❌ MISSING | ⚠️ NEEDS FE |
| 17 | `user_progress` | 0002 | ✅ `gamification_models.rs` | ✅ `gamification_repos.rs` | ✅ `sync.ts` | ✅ COMPLETE |
| 18 | `user_wallet` | 0002/0017 | ✅ `gamification_models.rs` | ✅ `gamification_repos.rs` | ✅ `market.ts` | ⚠️ **SCHEMA CONFLICT** |
| 19 | `points_ledger` | 0002 | ✅ `gamification_models.rs` | ✅ `gamification_repos.rs` | ❌ backend-only | ✅ COMPLETE |
| 20 | `user_streaks` | 0002 | ✅ `gamification_models.rs` | ✅ `gamification_repos.rs` | ✅ `sync.ts` | ✅ COMPLETE |
| **FOCUS DOMAIN** |
| 21 | `focus_sessions` | 0003 | ✅ `focus_models.rs` | ✅ `focus_repos.rs` | ✅ `focus.ts` | ✅ COMPLETE |
| 22 | `focus_pause_state` | 0003/0016 | ✅ `focus_models.rs` | ✅ `focus_repos.rs` | ✅ `focus.ts` | ⚠️ **SCHEMA CONFLICT** |
| 23 | `focus_libraries` | 0020 | ✅ `focus_models.rs` | ✅ `focus_repos.rs` | ✅ `focus-libraries.ts` | ✅ COMPLETE |
| 24 | `focus_library_tracks` | 0020 | ✅ `focus_models.rs` | ✅ `focus_repos.rs` | ✅ `focus-libraries.ts` | ✅ COMPLETE |
| **HABITS & GOALS DOMAIN** |
| 25 | `habits` | 0004 | ✅ `habits_goals_models.rs` | ✅ `habits_goals_repos.rs` | ✅ `habits.ts` | ✅ COMPLETE |
| 26 | `habit_completions` | 0004 | ✅ `habits_goals_models.rs` | ⚠️ uses `habit_logs` | ✅ `habits.ts` | ⚠️ **NAMING** |
| 27 | `goals` | 0004 | ✅ `habits_goals_models.rs` | ✅ `habits_goals_repos.rs` | ✅ `goals.ts` | ✅ COMPLETE |
| 28 | `goal_milestones` | 0004 | ✅ `habits_goals_models.rs` | ✅ `habits_goals_repos.rs` | ✅ `goals.ts` | ✅ COMPLETE |
| **QUESTS DOMAIN** |
| 29 | `universal_quests` | 0005 | ✅ `quests_models.rs` | ✅ `quests_repos.rs` | ✅ `quests.ts` | ✅ COMPLETE |
| 30 | `user_quest_progress` | 0005 | ✅ `quests_models.rs` | ✅ `quests_repos.rs` | ✅ `quests.ts` | ✅ COMPLETE |
| 31 | `user_quests` | 0005 | ✅ `quests_models.rs` | ✅ `quests_repos.rs` | ⚠️ uses `quests` | ⚠️ **NAMING** |
| **PLANNING DOMAIN** |
| 32 | `calendar_events` | 0006 | ✅ `platform_models.rs` | ✅ `platform_repos.rs` | ✅ `calendar.ts` | ✅ COMPLETE |
| 33 | `daily_plans` | 0006 | ✅ `platform_models.rs` | ✅ `platform_repos.rs` | ✅ `daily-plan.ts` | ✅ COMPLETE |
| 34 | `plan_templates` | 0006 | ❌ MISSING | ❌ MISSING | ❌ MISSING | ⚠️ **DECISION** |
| **MARKET DOMAIN** |
| 35 | `market_items` | 0007/0017 | ✅ `market_models.rs` | ✅ `market_repos.rs` | ✅ `market.ts` | ⚠️ **SCHEMA CONFLICT** |
| 36 | `user_purchases` | 0007 | ✅ `market_models.rs` | ✅ `market_repos.rs` | ✅ `market.ts` | ✅ COMPLETE |
| 37 | `user_market_purchases` | 0017 | ✅ `market_models.rs` | ✅ `market_repos.rs` | ❌ MISSING | ⚠️ **DUPLICATE?** |
| 38 | `market_transactions` | 0017 | ✅ `market_models.rs` | ✅ `market_repos.rs` | ❌ MISSING | ⚠️ NEEDS FE |
| 39 | `user_rewards` | 0017 | ✅ `market_models.rs` | ✅ `market_repos.rs` | ❌ MISSING | ⚠️ **DECISION** |
| 40 | `market_recommendations` | 0017 | ✅ `market_models.rs` | ✅ `market_repos.rs` | ❌ MISSING | ⚠️ **DECISION** |
| **REFERENCE TRACKS DOMAIN** |
| 41 | `reference_tracks` | 0008 | ✅ `reference_models.rs` | ✅ `reference_repos.rs` | ✅ `reference-tracks.ts` | ✅ COMPLETE |
| 42 | `track_analyses` | 0008 | ✅ `reference_models.rs` | ✅ `reference_repos.rs` | ✅ `reference-tracks.ts` | ✅ COMPLETE |
| 43 | `analysis_frame_chunks` | 0008 | ❌ SUPERSEDED | ❌ SUPERSEDED | ❌ SUPERSEDED | ⚠️ **REMOVE** |
| 44 | `track_annotations` | 0008 | ✅ `reference_models.rs` | ✅ `reference_repos.rs` | ✅ `reference-tracks.ts` | ✅ COMPLETE |
| 45 | `track_regions` | 0008 | ✅ `reference_models.rs` | ✅ `reference_repos.rs` | ✅ `reference-tracks.ts` | ✅ COMPLETE |
| **ANALYSIS FRAMES DOMAIN** |
| 46 | `analysis_frame_manifests` | 0009 | ✅ `frames_models.rs` | ✅ `frames_repos.rs` | ✅ (via reference) | ✅ COMPLETE |
| 47 | `analysis_frame_data` | 0009 | ✅ `frames_models.rs` | ✅ `frames_repos.rs` | ✅ (via reference) | ✅ COMPLETE |
| 48 | `analysis_events` | 0009 | ✅ `frames_models.rs` | ✅ `frames_repos.rs` | ✅ (via reference) | ✅ COMPLETE |
| **LISTENING PROMPTS DOMAIN** |
| 49 | `listening_prompt_templates` | 0010 | ✅ `template_models.rs` | ✅ `template_repos.rs` | ❌ MISSING | ⚠️ NEEDS FE |
| 50 | `listening_prompt_presets` | 0010 | ✅ `template_models.rs` | ✅ `template_repos.rs` | ❌ MISSING | ⚠️ NEEDS FE |
| **FITNESS DOMAIN** |
| 51 | `exercises` | 0011 | ✅ `exercise_models.rs` | ✅ `exercise_repos.rs` | ✅ `exercise.ts` | ✅ COMPLETE |
| 52 | `workouts` | 0011 | ✅ `exercise_models.rs` | ✅ `exercise_repos.rs` | ✅ `exercise.ts` | ✅ COMPLETE |
| 53 | `workout_sections` | 0011 | ❌ MISSING | ❌ MISSING | ✅ `exercise.ts` | ⚠️ NEEDS BE |
| 54 | `workout_exercises` | 0011 | ✅ `exercise_models.rs` | ✅ `exercise_repos.rs` | ✅ `exercise.ts` | ✅ COMPLETE |
| 55 | `workout_sessions` | 0011 | ✅ `exercise_models.rs` | ✅ `exercise_repos.rs` | ✅ `exercise.ts` | ✅ COMPLETE |
| 56 | `exercise_sets` | 0011 | ✅ `exercise_models.rs` | ✅ `exercise_repos.rs` | ✅ `exercise.ts` | ✅ COMPLETE |
| 57 | `personal_records` | 0011 | ❌ MISSING | ❌ MISSING | ✅ `exercise.ts` | ⚠️ NEEDS BE |
| 58 | `training_programs` | 0011 | ✅ `exercise_models.rs` | ✅ `exercise_repos.rs` | ✅ `exercise.ts` | ✅ COMPLETE |
| 59 | `program_weeks` | 0011 | ❌ MISSING | ❌ MISSING | ❌ MISSING | ⚠️ **DECISION** |
| 60 | `program_workouts` | 0011 | ❌ MISSING | ❌ MISSING | ❌ MISSING | ⚠️ **DECISION** |
| **BOOKS DOMAIN** |
| 61 | `books` | 0012 | ✅ `books_models.rs` | ✅ `books_repos.rs` | ✅ `books.ts` | ✅ COMPLETE |
| 62 | `reading_sessions` | 0012 | ✅ `books_models.rs` | ✅ `books_repos.rs` | ✅ `books.ts` | ✅ COMPLETE |
| **LEARN DOMAIN** |
| 63 | `learn_topics` | 0013 | ✅ `learn_models.rs` | ✅ `learn_repos.rs` | ✅ `learn.ts` | ✅ COMPLETE |
| 64 | `learn_lessons` | 0013 | ✅ `learn_models.rs` | ✅ `learn_repos.rs` | ✅ `learn.ts` | ✅ COMPLETE |
| 65 | `learn_drills` | 0013 | ✅ `learn_models.rs` | ✅ `learn_repos.rs` | ✅ `learn.ts` | ✅ COMPLETE |
| 66 | `user_lesson_progress` | 0013 | ✅ `learn_models.rs` | ✅ `learn_repos.rs` | ✅ `learn.ts` | ✅ COMPLETE |
| 67 | `user_drill_stats` | 0013 | ✅ `learn_models.rs` | ✅ `learn_repos.rs` | ✅ `learn.ts` | ✅ COMPLETE |
| **PLATFORM DOMAIN** |
| 68 | `feedback` | 0014 | ✅ `platform_models.rs` | ✅ `platform_repos.rs` | ✅ `feedback.ts` | ✅ COMPLETE |
| 69 | `infobase_entries` | 0014 | ✅ `platform_models.rs` | ✅ `platform_repos.rs` | ✅ `infobase.ts` | ✅ COMPLETE |
| 70 | `ideas` | 0014 | ✅ `platform_models.rs` | ✅ `platform_repos.rs` | ✅ `ideas.ts` | ✅ COMPLETE |
| 71 | `onboarding_flows` | 0014 | ✅ `platform_models.rs` | ✅ `platform_repos.rs` | ✅ `onboarding.ts` | ✅ COMPLETE |
| 72 | `onboarding_steps` | 0014 | ✅ `platform_models.rs` | ✅ `platform_repos.rs` | ✅ `onboarding.ts` | ✅ COMPLETE |
| 73 | `user_onboarding_state` | 0014 | ✅ `platform_models.rs` | ✅ `platform_repos.rs` | ✅ `onboarding.ts` | ✅ COMPLETE |
| 74 | `user_onboarding_responses` | 0014 | ✅ `platform_models.rs` | ✅ `platform_repos.rs` | ✅ `onboarding.ts` | ✅ COMPLETE |
| 75 | `user_interests` | 0014 | ❌ MISSING | ❌ MISSING | ❌ MISSING | ⚠️ **DECISION** |
| **SETTINGS DOMAIN** |
| 76 | `user_settings` | 0015 | ✅ `platform_models.rs` | ✅ `platform_repos.rs` | ✅ `user.ts` | ✅ COMPLETE |
| **FEATURE FLAGS** |
| 77 | `feature_flags` | 0018 | ❌ MISSING | ❌ MISSING | ❌ MISSING | ⚠️ **DECISION** |
| **INBOX DOMAIN** |
| 78 | `inbox_items` | 0019 | ✅ `inbox_models.rs` | ⚠️ uses `user_inbox` | ✅ `inbox.ts` | ⚠️ **NAMING** |
| **USER REFERENCES DOMAIN** |
| 79 | `user_references` | 0021 | ✅ `references_models.rs` | ✅ `references_repos.rs` | ✅ `references.ts` | ✅ COMPLETE |

---

## Part 2: Schema Conflicts to Resolve

### CONFLICT-1: `user_wallet` (0002 vs 0017)

**0002 Schema:**
```sql
CREATE TABLE user_wallet (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    coins INTEGER NOT NULL DEFAULT 0,
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_spent INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**0017 Schema:**
```sql
CREATE TABLE user_wallet (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    total_coins INTEGER NOT NULL DEFAULT 0,
    earned_coins INTEGER NOT NULL DEFAULT 0,
    spent_coins INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RESOLUTION:** Use 0002 naming (`coins`, `total_earned`, `total_spent`) - more intuitive

### CONFLICT-2: `focus_pause_state` (0003 vs 0016)

**0003 Schema:**
```sql
CREATE TABLE focus_pause_state (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    session_id UUID NOT NULL,
    mode VARCHAR(20) NOT NULL,
    time_remaining_seconds INTEGER NOT NULL,
    paused_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**0016 Schema:**
```sql
CREATE TABLE focus_pause_state (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    session_id UUID NOT NULL,
    is_paused BOOLEAN NOT NULL DEFAULT false,
    paused_at TIMESTAMPTZ,
    resumed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RESOLUTION:** Use 0016 style - simpler boolean flag approach, merge `time_remaining_seconds` from 0003

### CONFLICT-3: `market_items` (0007 vs 0017)

**0007 Schema (more fields):**
```sql
key, name, description, category, cost_coins, icon, image_url,
is_global, is_available, is_active, is_consumable,
uses_per_purchase, total_stock, remaining_stock,
created_by_user_id, sort_order
```

**0017 Schema (simpler):**
```sql
name, description, cost_coins, category, rarity,
icon_url, available, available_from, available_until
```

**RESOLUTION:** Merge both - keep 0007 stock management + 0017 availability windows

---

## Part 3: Naming Inconsistencies

| Current Name | Canonical Name | Affected Files |
|--------------|----------------|----------------|
| `habit_logs` | `habit_completions` | `habits_goals_repos.rs`, `admin_repos.rs` |
| `user_inbox` | `inbox_items` | `inbox_repos.rs` |
| `quests` (FE) | `user_quests` (DB) | `quests.ts` API naming |
| `user_purchases` | Keep both | `user_purchases` (0007) vs `user_market_purchases` (0017) |

---

## Part 4: Decision Required Tables

The following tables exist in migrations but have NO backend/frontend implementation. 
Decision needed: **IMPLEMENT** or **REMOVE**

| Table | Purpose | Recommendation |
|-------|---------|----------------|
| `verification_tokens` | Email verification | IMPLEMENT if email verification planned |
| `authenticators` | WebAuthn/Passkeys | IMPLEMENT if WebAuthn planned |
| `entitlements` | Granular permissions | KEEP - future RBAC expansion |
| `role_entitlements` | Role-permission mapping | KEEP - future RBAC expansion |
| `skill_definitions` | Skill tree system | **IMPLEMENT** - matches gamification goals |
| `user_skills` | User skill progress | **IMPLEMENT** - matches gamification goals |
| `plan_templates` | Reusable plan templates | IMPLEMENT if templates planned |
| `user_rewards` | Reward claims | CONSOLIDATE with `points_ledger` |
| `market_recommendations` | AI-driven suggestions | DEFER - future AI feature |
| `program_weeks` | Training program weeks | IMPLEMENT for full fitness support |
| `program_workouts` | Workout scheduling | IMPLEMENT for full fitness support |
| `user_interests` | User interest tags | IMPLEMENT for personalization |
| `feature_flags` | Feature toggles | IMPLEMENT for feature management |

---

## Part 5: Implementation Gaps (Needs BE or FE)

### Backend Missing → Frontend Exists

| Table | Frontend Expects | Action |
|-------|------------------|--------|
| `workout_sections` | `exercise.ts` references | ADD to `exercise_models.rs` + `exercise_repos.rs` |
| `personal_records` | `exercise.ts` references | ADD to `exercise_models.rs` + `exercise_repos.rs` |

### Backend Exists → Frontend Missing

| Table | Backend Has | Action |
|-------|-------------|--------|
| `user_achievements` | Full CRUD | ADD to frontend (achievement display) |
| `listening_prompt_templates` | Full CRUD | ADD to frontend (listening feature) |
| `listening_prompt_presets` | Full CRUD | ADD to frontend (listening feature) |
| `market_transactions` | INSERT | ADD to frontend (transaction history) |

---

## Part 6: Migration File Plan (Clean Structure)

### New Migration Structure: 14 Files

```
0001_auth.sql               -- Core identity + OAuth
0002_rbac.sql               -- Roles, entitlements, user_roles  
0003_gamification.sql       -- Progress, wallet, streaks, achievements, skills
0004_focus.sql              -- Sessions, pause state, libraries
0005_habits_goals.sql       -- Habits, completions, goals, milestones
0006_quests.sql             -- Universal quests, user quests, progress
0007_planning.sql           -- Calendar, daily plans, templates
0008_market.sql             -- Items, purchases, transactions, rewards
0009_books.sql              -- Books, reading sessions
0010_fitness.sql            -- Exercises, workouts, programs (FULL)
0011_learn.sql              -- Topics, lessons, drills, progress
0012_reference.sql          -- Tracks, analyses, frames, annotations
0013_platform.sql           -- Feedback, ideas, infobase, onboarding, settings
0014_seeds.sql              -- Seed data for all reference tables
```

### Table Count by Migration

| Migration | Tables | Notes |
|-----------|--------|-------|
| 0001_auth | 6 | users, accounts, sessions, verification_tokens, authenticators, oauth_states |
| 0002_rbac | 5 | roles, entitlements, role_entitlements, user_roles, audit_log, activity_events |
| 0003_gamification | 8 | skill_definitions, user_skills, achievement_definitions, user_achievements, user_progress, user_wallet, points_ledger, user_streaks |
| 0004_focus | 4 | focus_sessions, focus_pause_state, focus_libraries, focus_library_tracks |
| 0005_habits_goals | 4 | habits, habit_completions, goals, goal_milestones |
| 0006_quests | 3 | universal_quests, user_quests, user_quest_progress |
| 0007_planning | 3 | calendar_events, daily_plans, plan_templates |
| 0008_market | 6 | market_items, user_purchases, user_market_purchases, market_transactions, user_rewards, market_recommendations |
| 0009_books | 2 | books, reading_sessions |
| 0010_fitness | 10 | exercises, workouts, workout_sections, workout_exercises, workout_sessions, exercise_sets, personal_records, training_programs, program_weeks, program_workouts |
| 0011_learn | 5 | learn_topics, learn_lessons, learn_drills, user_lesson_progress, user_drill_stats |
| 0012_reference | 9 | reference_tracks, track_analyses, track_annotations, track_regions, analysis_frame_manifests, analysis_frame_data, analysis_events, listening_prompt_templates, listening_prompt_presets |
| 0013_platform | 11 | feedback, ideas, infobase_entries, onboarding_flows, onboarding_steps, user_onboarding_state, user_onboarding_responses, user_interests, user_settings, inbox_items, user_references, feature_flags |
| 0014_seeds | 0 | Seed data only |

**TOTAL: 76 Tables** (keeping all, resolving conflicts)

---

## Part 7: Seed Data Requirements

### Reference/Catalog Tables Needing Seeds

| Table | Seed Content |
|-------|--------------|
| `roles` | admin, user, moderator |
| `entitlements` | Basic permission set |
| `skill_definitions` | Focus, Discipline, Knowledge, Fitness, Creativity, Wellness |
| `achievement_definitions` | First focus, 7-day streak, level milestones, etc. |
| `universal_quests` | Daily, weekly, monthly system quests |
| `exercises` | Built-in exercise library (100+ exercises) |
| `learn_topics` | Core learning topics |
| `learn_lessons` | Initial lessons per topic |
| `learn_drills` | Initial drills per topic |
| `onboarding_flows` | Main onboarding flow |
| `onboarding_steps` | Steps for main flow |
| `listening_prompt_templates` | Core listening prompts |
| `market_items` | Initial shop items |

---

## Part 8: Execution Plan

### Phase 1: Database Rebuild
1. [x] Move old migrations to `migrations_old/`
2. [ ] Write 14 new migration files
3. [ ] Apply to clean database
4. [ ] Verify all tables created

### Phase 2: Backend Alignment
1. [ ] Fix naming: `habit_logs` → `habit_completions`
2. [ ] Fix naming: `user_inbox` → `inbox_items`
3. [ ] Add missing models: `workout_sections`, `personal_records`
4. [ ] Add missing repos for same
5. [ ] Add skill system: `skill_definitions`, `user_skills`
6. [ ] Verify all repos use correct table names

### Phase 3: Frontend Alignment
1. [ ] Add achievements display component
2. [ ] Add listening prompts feature
3. [ ] Add transaction history to market
4. [ ] Verify all API client table references

### Phase 4: Seed Data
1. [ ] Write skill_definitions seeds
2. [ ] Write achievement_definitions seeds
3. [ ] Write exercise seeds (from existing data)
4. [ ] Write learn content seeds
5. [ ] Write onboarding flow seeds
6. [ ] Write market items seeds

### Phase 5: Validation
1. [ ] Full backend compile
2. [ ] Full frontend build
3. [ ] E2E tests pass
4. [ ] Document final schema

---

## Part 9: Files to Create

### agent/DECISIONS_REQUIRED.md
Document all ⚠️ **DECISION** items from the matrix above

### agent/SCHEMA_SPEC.md
Full column-level specification for all 76 tables

### app/database/migrations/0001-0014
New migration files

---

## Next Steps

1. **Create DECISIONS_REQUIRED.md** with all items needing user input
2. **Start writing migration files** with resolved conflicts
3. **Document exact column specs** for each table
