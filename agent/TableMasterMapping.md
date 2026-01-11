# Master Table Mapping: Docs → Migrations → Backend → Frontend

**Generated:** January 10, 2026  
**Purpose:** Unified view of all database tables across all layers

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **Documented Tables** | 11 |
| **Migration Tables** | ~75 |
| **Backend Tables Referenced** | 67 |
| **Frontend Tables Inferred** | 50+ |
| **Documentation Debt** | 64 tables |
| **Naming Conflicts** | 5 |
| **Schema Conflicts** | 3 |

---

## Complete Table Matrix

### Legend
- ✅ = Present and consistent
- ⚠️ = Present with issues
- ❌ = Missing
- 📋 = Planned but not implemented
- 🔄 = Conflicting definitions

---

## 1. Auth Substrate (Migration 0001)

| Table | Docs | Migration | Backend | Frontend | Status |
|-------|------|-----------|---------|----------|--------|
| `users` | ✅ | ✅ | ✅ | ✅ | ✅ Healthy |
| `accounts` | ✅ | ✅ | ✅ | ✅ (implicit) | ✅ Healthy |
| `sessions` | ✅ | ✅ | ✅ | ✅ (implicit) | ✅ Healthy |
| `verification_tokens` | ✅ | ✅ | ❌ | ❌ | ⚠️ Unused |
| `authenticators` | ✅ | ✅ | ❌ | ❌ | ⚠️ Unused (WebAuthn not impl) |
| `roles` | ✅ | ✅ | ✅ | ❌ | ✅ Backend-only |
| `entitlements` | ✅ | ✅ | ❌ | ❌ | ⚠️ Unused |
| `role_entitlements` | ✅ | ✅ | ❌ | ❌ | ⚠️ Unused |
| `user_roles` | ✅ | ✅ | ✅ | ❌ | ✅ Backend-only |
| `audit_log` | ✅ | ✅ | ✅ | ❌ | ✅ Backend-only |
| `activity_events` | ✅ | ✅ | ✅ | ❌ | ✅ Backend-only |

---

## 2. Gamification Substrate (Migration 0002)

| Table | Docs | Migration | Backend | Frontend | Status |
|-------|------|-----------|---------|----------|--------|
| `skill_definitions` | ❌ | ✅ | ❌ | ❌ | ⚠️ Unused |
| `user_skills` | 📋 | ✅ | ❌ | ❌ | ⚠️ Unused |
| `achievement_definitions` | 📋 | ✅ | ✅ | ❌ | ✅ Backend-only |
| `user_achievements` | 📋 | ✅ | ✅ | ❌ | ✅ Backend-only |
| `user_progress` | 📋 | ✅ | ✅ | ✅ | ✅ Healthy |
| `user_wallet` | 📋 | 🔄 0002+0017 | ✅ | ✅ | ⚠️ **Schema conflict** |
| `points_ledger` | 📋 | ✅ | ✅ | ❌ | ✅ Backend-only |
| `user_streaks` | 📋 | ✅ | ✅ | ✅ | ✅ Healthy |

---

## 3. Focus Substrate (Migration 0003 + 0016)

| Table | Docs | Migration | Backend | Frontend | Status |
|-------|------|-----------|---------|----------|--------|
| `focus_sessions` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `focus_pause_state` | ❌ | 🔄 0003→0016 | ✅ | ✅ | ⚠️ **Schema changed** |

---

## 4. Habits & Goals Substrate (Migration 0004)

| Table | Docs | Migration | Backend | Frontend | Status |
|-------|------|-----------|---------|----------|--------|
| `habits` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `habit_completions` | ❌ | ✅ | ⚠️ `habit_logs` | ✅ | ⚠️ **Naming mismatch** |
| `goals` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `goal_milestones` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |

---

## 5. Quests Substrate (Migration 0005)

| Table | Docs | Migration | Backend | Frontend | Status |
|-------|------|-----------|---------|----------|--------|
| `universal_quests` | 📋 | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `user_quest_progress` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `user_quests` | 📋 `quests` | ✅ | ✅ | ⚠️ `quests` | ⚠️ **Naming mismatch** |

---

## 6. Planning Substrate (Migration 0006)

| Table | Docs | Migration | Backend | Frontend | Status |
|-------|------|-----------|---------|----------|--------|
| `calendar_events` | 📋 | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `daily_plans` | 📋 | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `plan_templates` | ❌ | ✅ | ❌ | ❌ | ⚠️ Unused |

---

## 7. Market Substrate (Migration 0007 → 0017)

| Table | Docs | Migration | Backend | Frontend | Status |
|-------|------|-----------|---------|----------|--------|
| `market_items` | 📋 | 🔄 0007→0017 | ✅ | ✅ | ⚠️ **Schema changed** |
| `user_purchases` | 📋 | ✅ 0007 | ✅ | ✅ | ⚠️ **See 0017** |
| `user_market_purchases` | ❌ | ✅ 0017 | ✅ | ❌ | ⚠️ **Duplicate of above?** |
| `market_transactions` | ❌ | ✅ 0017 | ✅ | ❌ | ⚠️ **Needs docs** |
| `user_rewards` | ❌ | ✅ 0017 | ✅ | ❌ | ⚠️ **Needs docs** |
| `market_recommendations` | ❌ | ✅ 0017 | ✅ | ❌ | ⚠️ **Needs docs** |

---

## 8. Reference Tracks Substrate (Migration 0008)

| Table | Docs | Migration | Backend | Frontend | Status |
|-------|------|-----------|---------|----------|--------|
| `reference_tracks` | 📋 | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `track_analyses` | 📋 | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `analysis_frame_chunks` | ❌ | ✅ | ❌ | ❌ | ⚠️ Superseded by 0009? |
| `track_annotations` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `track_regions` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |

---

## 9. Analysis Frames Binary (Migration 0009)

| Table | Docs | Migration | Backend | Frontend | Status |
|-------|------|-----------|---------|----------|--------|
| `analysis_frame_manifests` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `analysis_frame_data` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `analysis_events` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |

---

## 10. Listening Prompts (Migration 0010)

| Table | Docs | Migration | Backend | Frontend | Status |
|-------|------|-----------|---------|----------|--------|
| `listening_prompt_templates` | ❌ | ✅ | ✅ | ❌ | ⚠️ **Needs frontend** |
| `listening_prompt_presets` | ❌ | ✅ | ✅ | ❌ | ⚠️ **Needs frontend** |

---

## 11. Fitness Substrate (Migration 0011)

| Table | Docs | Migration | Backend | Frontend | Status |
|-------|------|-----------|---------|----------|--------|
| `exercises` | 📋 | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `workouts` | 📋 | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `workout_sections` | ❌ | ✅ | ❌ | ✅ | ⚠️ Backend missing? |
| `workout_exercises` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `workout_sessions` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `exercise_sets` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `personal_records` | ❌ | ✅ | ❌ | ✅ | ⚠️ Backend missing? |
| `training_programs` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `program_weeks` | ❌ | ✅ | ❌ | ❌ | ⚠️ Unused |
| `program_workouts` | ❌ | ✅ | ❌ | ❌ | ⚠️ Unused |

---

## 12. Books Substrate (Migration 0012)

| Table | Docs | Migration | Backend | Frontend | Status |
|-------|------|-----------|---------|----------|--------|
| `books` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `reading_sessions` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |

---

## 13. Learn Substrate (Migration 0013)

| Table | Docs | Migration | Backend | Frontend | Status |
|-------|------|-----------|---------|----------|--------|
| `learn_topics` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `learn_lessons` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `learn_drills` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `user_lesson_progress` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `user_drill_stats` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |

---

## 14. Platform Substrate (Migration 0014)

| Table | Docs | Migration | Backend | Frontend | Status |
|-------|------|-----------|---------|----------|--------|
| `feedback` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `infobase_entries` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `ideas` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `onboarding_flows` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `onboarding_steps` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `user_onboarding_state` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `user_onboarding_responses` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |
| `user_interests` | ❌ | ✅ | ❌ | ❌ | ⚠️ Unused |

---

## 15. User Settings (Migration 0015)

| Table | Docs | Migration | Backend | Frontend | Status |
|-------|------|-----------|---------|----------|--------|
| `user_settings` | ❌ | ✅ | ✅ | ✅ | ⚠️ **Needs docs** |

---

## 16-21. Additional Migrations

| Table | Migration | Backend | Frontend | Status |
|-------|-----------|---------|----------|--------|
| `focus_pause_state` | 0016 (fix) | ✅ | ✅ | ⚠️ Schema v2 |
| `market_items` | 0017 (fix) | ✅ | ✅ | ⚠️ Schema v2 |
| `user_wallet` | 0017 (conflict) | ✅ | ✅ | ❌ **Schema conflict** |
| `feature_flags` | 0018 | ❌ | ❌ | ⚠️ Unused |
| `inbox_items` | 0019 | ⚠️ `user_inbox` | ✅ | ⚠️ **Naming mismatch** |
| `focus_libraries` | 0020 | ✅ | ✅ | ✅ Healthy |
| `focus_library_tracks` | 0020 | ✅ | ✅ | ✅ Healthy |
| `user_references` | 0021 | ✅ | ✅ | ✅ Healthy |

---

## Critical Issues

### 🔴 Schema Conflicts (Must Fix)

1. **`user_wallet`**
   - Defined in: 0002 with `coins, total_earned, total_spent`
   - Redefined in: 0017 with `total_coins, earned_coins, spent_coins`
   - **Impact:** Column name mismatches will cause runtime errors

2. **`focus_pause_state`**
   - Defined in: 0003 with `mode, time_remaining_seconds`
   - Replaced in: 0016 with `is_paused, paused_at, resumed_at`
   - **Impact:** Backend/frontend may expect different columns

3. **`market_items`**
   - Defined in: 0007 with `key, is_global, uses_per_purchase, total_stock`
   - Replaced in: 0017 with `rarity, available_from, available_until`
   - **Impact:** Column mismatches

---

### 🟠 Naming Inconsistencies (Should Fix)

| Issue | Tables | Resolution |
|-------|--------|------------|
| `habit_completions` vs `habit_logs` | Migration uses `habit_completions`, backend uses `habit_logs` | Align to one name |
| `quests` vs `user_quests` | Docs says `quests`, migration says `user_quests` | Update docs |
| `inbox_items` vs `user_inbox` | Migration uses `inbox_items`, backend uses `user_inbox` | Align to one name |
| `user_purchases` vs `user_market_purchases` | Both exist in migrations | Consolidate |

---

### 🟡 Unused Tables (Consider Removing)

| Table | Migration | Reason |
|-------|-----------|--------|
| `verification_tokens` | 0001 | No email verification implemented |
| `authenticators` | 0001 | No WebAuthn implemented |
| `entitlements` | 0001 | RBAC not fully implemented |
| `role_entitlements` | 0001 | RBAC not fully implemented |
| `skill_definitions` | 0002 | Skills feature not implemented |
| `user_skills` | 0002 | Skills feature not implemented |
| `plan_templates` | 0006 | Templates not implemented |
| `analysis_frame_chunks` | 0008 | Superseded by 0009 |
| `user_interests` | 0014 | Interest selection not implemented |
| `feature_flags` | 0018 | Feature flags not used |
| `program_weeks` | 0011 | Programs not fully implemented |
| `program_workouts` | 0011 | Programs not fully implemented |

---

## Recommended Migration Restructure

### Proposed Clean Migration Order

```
0001_auth.sql           → users, accounts, sessions, oauth_states
0002_rbac.sql           → roles, user_roles (simplified)
0003_gamification.sql   → user_progress, user_wallet, points_ledger, user_streaks
0004_achievements.sql   → achievement_definitions, user_achievements
0005_focus.sql          → focus_sessions, focus_pause_state, focus_libraries, focus_library_tracks
0006_habits.sql         → habits, habit_completions
0007_goals.sql          → goals, goal_milestones
0008_quests.sql         → universal_quests, user_quests, user_quest_progress
0009_planning.sql       → calendar_events, daily_plans
0010_market.sql         → market_items, user_purchases, market_transactions
0011_books.sql          → books, reading_sessions
0012_fitness.sql        → exercises, workouts, workout_exercises, workout_sessions, exercise_sets
0013_learn.sql          → learn_topics, learn_lessons, learn_drills, user_lesson_progress, user_drill_stats
0014_reference.sql      → reference_tracks, track_analyses, track_annotations, track_regions
0015_analysis.sql       → analysis_frame_manifests, analysis_frame_data, analysis_events
0016_listening.sql      → listening_prompt_templates, listening_prompt_presets
0017_platform.sql       → feedback, ideas, infobase_entries
0018_onboarding.sql     → onboarding_flows, onboarding_steps, user_onboarding_state, user_onboarding_responses
0019_settings.sql       → user_settings
0020_inbox.sql          → inbox_items
0021_references.sql     → user_references
0022_audit.sql          → audit_log, activity_events
```

### Tables to Remove

- `verification_tokens` (not implemented)
- `authenticators` (not implemented)
- `entitlements` (not needed without full RBAC)
- `role_entitlements` (not needed without full RBAC)
- `skill_definitions` (not implemented)
- `user_skills` (not implemented)
- `plan_templates` (not implemented)
- `analysis_frame_chunks` (superseded)
- `user_interests` (not implemented)
- `feature_flags` (not used)
- `program_weeks` (not implemented)
- `program_workouts` (not implemented)
- `user_rewards` (consolidate with points_ledger)
- `market_recommendations` (not implemented)

---

## Next Steps

1. **Resolve `user_wallet` conflict** - Choose one schema, update all references
2. **Standardize naming** - Pick `habit_completions` OR `habit_logs`, not both
3. **Create consolidated migrations** - Clean 20-file migration set
4. **Update schema.md** - Document all 50+ active tables
5. **Add foreign key diagram** - Visualize relationships
6. **Write seed data** - Proper test fixtures for all tables
