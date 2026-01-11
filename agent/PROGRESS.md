# Progress

## Current Phase: SCHEMA REBUILD

### Completed
- [x] Analyzed all 5 mapping files (table-mapping-*.md)
- [x] Created COMPREHENSIVE_REBUILD_PLAN.md
- [x] Created DECISIONS_REQUIRED.md with 12 decisions
- [x] Created SCHEMA_SPEC_PART1.md and SCHEMA_SPEC_PART2.md
- [x] User filled all 12 decisions
- [x] Moved old migrations to app/database/migrations_old/
- [x] Created 14 migration files with up/down pairs

### Migrations Created
| # | File | Tables |
|---|------|--------|
| 0001 | auth.sql | users, accounts, sessions, oauth_states (4) |
| 0002 | rbac.sql | roles, user_roles, audit_log, activity_events (4 + view) |
| 0003 | gamification.sql | skill_definitions, user_skills, achievement_definitions, user_achievements, user_progress, user_wallet, points_ledger, user_streaks (8 + triggers + seeds) |
| 0004 | focus.sql | focus_sessions, focus_pause_state, focus_libraries, focus_library_tracks (4) |
| 0005 | habits_goals.sql | habits, habit_completions, goals, goal_milestones (4) |
| 0006 | quests.sql | universal_quests, user_quests, user_quest_progress (3 + seeds) |
| 0007 | planning.sql | calendar_events, daily_plans, plan_templates (3) |
| 0008 | market.sql | market_items, user_purchases, market_transactions, user_rewards, market_recommendations (5 + seeds) |
| 0009 | books.sql | books, reading_sessions (2) |
| 0010 | fitness.sql | exercises, workouts, workout_sections, workout_exercises, workout_sessions, exercise_sets, personal_records, training_programs, program_weeks, program_workouts (10) |
| 0011 | learn.sql | learn_topics, learn_lessons, learn_drills, user_lesson_progress, user_drill_stats (5 + seeds) |
| 0012 | reference.sql | reference_tracks, track_analyses, track_annotations, track_regions, analysis_frame_manifests, analysis_frame_data, analysis_events, listening_prompt_templates, listening_prompt_presets (9 + seeds) |
| 0013 | platform.sql | feedback, ideas, infobase_entries, onboarding_flows, onboarding_steps, user_onboarding_state, user_onboarding_responses, user_interests, user_settings, inbox_items, user_references, feature_flags (12 + seeds) |
| 0014 | seeds.sql | Additional seed data for exercises, lessons, drills, quests, market items |

**Total: ~73 tables** (down from 79 after applying decisions)

### In Progress
- [ ] Apply migrations to database
- [ ] Fix backend naming mismatches (habit_logs → habit_completions, user_inbox → inbox_items)
- [ ] Add missing backend implementations
- [ ] Add missing frontend implementations
- [ ] Run full validation

### Decisions Applied
| ID | Decision | Action |
|----|----------|--------|
| DEC-001 | Email Verification | KILLED - removed verification_tokens |
| DEC-002 | WebAuthn | KILLED - removed authenticators |
| DEC-003 | Full RBAC | KILLED - removed entitlements, role_entitlements |
| DEC-004 | Skills System | IMPLEMENTED |
| DEC-005 | Plan Templates | IMPLEMENTED |
| DEC-006 | User Rewards | IMPLEMENTED (kept separate) |
| DEC-007 | AI Recommendations | IMPLEMENTED (market_recommendations table) |
| DEC-008 | Program Scheduling | IMPLEMENTED (program_weeks, program_workouts) |
| DEC-009 | User Interests | IMPLEMENTED |
| DEC-010 | Feature Flags | DEFERRED (table only, no code) |
| DEC-011 | Duplicate Purchases | MERGED into single user_purchases |
| DEC-012 | Legacy Frames | REMOVED analysis_frame_chunks |

## Previous Work Log
- Summarized extensive log errors tracing back to missing DB tables.
- Synced `app/database/migrations` to `app/backend/migrations`.
- `sqlx` CLI not found. Checking for in-app migration logic.
