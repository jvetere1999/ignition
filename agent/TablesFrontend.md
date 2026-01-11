# Tables Referenced in Frontend Code

**Generated:** January 10, 2026  
**Source:** `app/frontend/src/`

---

## Overview

This document catalogs all database tables referenced by the frontend, inferred from API client calls.

**Total API Client Modules:** 23  
**Total Unique Endpoints:** ~149  
**Total Inferred Tables:** ~50+

---

## API Clients by Module

### 1. Sync API (`lib/api/sync.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/sync/full` | user_progress, quests, habits, focus_sessions, daily_plans |
| GET | `/sync/progress` | user_progress, user_wallet |
| GET | `/sync/quests` | quests, habits, inbox_items |
| GET | `/sync/focus` | focus_sessions |
| GET | `/sync/plans` | daily_plans |

---

### 2. User API (`lib/api/user.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/user/settings` | user_settings |
| PUT | `/user/settings` | user_settings |
| DELETE | `/user/account` | users (cascade all) |
| GET | `/user/export` | users, all user data |

---

### 3. Books API (`lib/api/books.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/books` | books |
| GET | `/books/{id}` | books |
| GET | `/books/status/{status}` | books |
| POST | `/books` | books |
| PUT | `/books/{id}` | books |
| DELETE | `/books/{id}` | books |
| GET | `/books/{id}/sessions` | books, reading_sessions |
| GET | `/books/reading/recent` | reading_sessions |
| POST | `/books/{id}/sessions` | reading_sessions, user_progress |

---

### 4. Habits API (`lib/api/habits.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/habits` | habits, habit_completions |
| POST | `/habits` | habits |
| POST | `/habits/{id}/complete` | habit_completions, user_progress |

---

### 5. Goals API (`lib/api/goals.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/goals` | goals |
| GET | `/goals/active` | goals |
| GET | `/goals/{id}` | goals, goal_milestones |
| POST | `/goals` | goals |
| POST | `/goals/{id}/milestones` | goal_milestones |
| POST | `/goals/{id}/milestones/{mid}/complete` | goal_milestones, user_progress |

---

### 6. Quests API (`lib/api/quests.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/quests` | quests |
| GET | `/quests/available` | quests |
| GET | `/quests/active` | quests |
| POST | `/quests` | quests |
| POST | `/quests/{id}/accept` | quests |
| POST | `/quests/{id}/complete` | quests, user_progress |
| POST | `/quests/{id}/claim` | quests |

---

### 7. Focus API (`lib/api/focus.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| POST | `/focus/start` | focus_sessions |
| GET | `/focus/current` | focus_sessions, focus_pause_state |
| GET | `/focus/history` | focus_sessions |
| GET | `/focus/stats` | focus_sessions |
| POST | `/focus/complete` | focus_sessions, user_progress |
| POST | `/focus/abandon` | focus_sessions |
| GET | `/focus/pause` | focus_pause_state |
| POST | `/focus/pause` | focus_pause_state |
| DELETE | `/focus/pause` | focus_pause_state, focus_sessions |

---

### 8. Focus Libraries API (`lib/api/focusLibraries.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/focus/libraries` | focus_libraries |
| GET | `/focus/libraries/{id}` | focus_libraries |
| POST | `/focus/libraries` | focus_libraries |
| DELETE | `/focus/libraries/{id}` | focus_libraries |
| POST | `/focus/libraries/{id}/favorite` | focus_libraries |

---

### 9. Market API (`lib/api/market.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/market` | market_items, user_wallet, user_purchases |
| GET | `/market/items` | market_items |
| GET | `/market/items/{id}` | market_items |
| GET | `/market/featured` | market_items |
| POST | `/market/purchase` | user_purchases, user_wallet |
| POST | `/market/redeem` | user_purchases |
| GET | `/market/purchases` | user_purchases |
| GET | `/market/wallet` | user_wallet |

---

### 10. Inbox API (`lib/api/inbox.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/inbox` | inbox_items |
| GET | `/inbox/{id}` | inbox_items |
| POST | `/inbox` | inbox_items |
| PUT | `/inbox/{id}` | inbox_items |
| DELETE | `/inbox/{id}` | inbox_items |

---

### 11. Daily Plan API (`lib/api/dailyPlan.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/plan/daily` | daily_plans |
| GET | `/plan/daily/{date}` | daily_plans |
| POST | `/plan/daily/generate` | daily_plans |
| POST | `/plan/daily/update` | daily_plans |
| POST | `/plan/daily/complete_item` | daily_plans |

---

### 12. Today API (`lib/api/today.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/today` | users, daily_plans, focus_sessions, user_settings, onboarding_state |

---

### 13. Calendar API (`lib/api/calendar.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/calendar` | calendar_events |
| GET | `/calendar/range` | calendar_events |
| GET | `/calendar/{id}` | calendar_events |
| POST | `/calendar` | calendar_events |
| PUT | `/calendar/{id}` | calendar_events |
| DELETE | `/calendar/{id}` | calendar_events |

---

### 14. Onboarding API (`lib/api/onboarding.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/onboarding` | onboarding_flows, onboarding_steps, user_onboarding_state |
| POST | `/onboarding/start` | user_onboarding_state |
| POST | `/onboarding/step` | user_onboarding_state, user_onboarding_responses |
| POST | `/onboarding/complete` | user_onboarding_state |
| POST | `/onboarding/skip` | user_onboarding_state |

---

### 15. Exercise API (`lib/api/exercise.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/exercise` | exercises |
| POST | `/exercise` | exercises |
| GET | `/exercise/{id}` | exercises |
| DELETE | `/exercise/{id}` | exercises |
| POST | `/exercise/custom` | exercises |
| GET | `/workouts` | workouts, workout_sections, workout_exercises |
| POST | `/workouts` | workouts |
| GET | `/workouts/{id}` | workouts |
| DELETE | `/workouts/{id}` | workouts |
| GET | `/workouts/sessions` | workout_sessions |
| POST | `/workouts/sessions` | workout_sessions |
| GET | `/workouts/sessions/{id}` | workout_sessions |
| POST | `/workouts/sessions/{id}/set` | exercise_sets, personal_records |
| POST | `/workouts/sessions/{id}/complete` | workout_sessions, user_progress |
| GET | `/training/programs` | training_programs |
| POST | `/training/programs` | training_programs |
| GET | `/training/programs/{id}` | training_programs |
| POST | `/training/programs/{id}/start` | training_programs |

---

### 16. Learn API (`lib/api/learn.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/learn` | learn_topics, learn_lessons, user_lesson_progress |
| GET | `/learn/progress` | user_lesson_progress, user_drill_stats |
| GET | `/learn/topics/{id}` | learn_lessons, learn_drills |
| GET | `/learn/topics` | learn_topics |
| GET | `/learn/lessons` | learn_lessons |
| GET | `/learn/drills` | learn_drills |
| GET | `/learn/lessons/{id}` | learn_lessons |
| POST | `/learn/lessons/{id}/start` | user_lesson_progress |
| POST | `/learn/lessons/{id}/complete` | user_lesson_progress, user_progress |
| POST | `/learn/drills/{id}/submit` | user_drill_stats, user_progress |

---

### 17. Ideas API (`lib/api/ideas.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/ideas` | ideas |
| GET | `/ideas/{id}` | ideas |
| POST | `/ideas` | ideas |
| PUT | `/ideas/{id}` | ideas |
| DELETE | `/ideas/{id}` | ideas |

---

### 18. Infobase API (`lib/api/infobase.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/infobase` | infobase_entries |
| GET | `/infobase/categories` | infobase_entries |
| GET | `/infobase/{id}` | infobase_entries |
| POST | `/infobase` | infobase_entries |
| PUT | `/infobase/{id}` | infobase_entries |
| DELETE | `/infobase/{id}` | infobase_entries |

---

### 19. Feedback API (`lib/api/feedback.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/feedback` | feedback |
| POST | `/feedback` | feedback |

---

### 20. References API (`lib/api/references.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/references` | user_references |
| GET | `/references/{id}` | user_references |
| POST | `/references` | user_references |
| PUT | `/references/{id}` | user_references |
| DELETE | `/references/{id}` | user_references |

---

### 21. Reference Tracks API (`lib/api/referenceTracks.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/reference/tracks` | reference_tracks |
| GET | `/reference/tracks/library` | reference_tracks, users |
| GET | `/reference/tracks/{id}` | reference_tracks |
| POST | `/reference/tracks` | reference_tracks |
| PATCH | `/reference/tracks/{id}` | reference_tracks |
| DELETE | `/reference/tracks/{id}` | reference_tracks |
| POST | `/reference/upload/init` | reference_tracks (+ R2) |
| GET | `/reference/tracks/{id}/stream` | reference_tracks |
| GET | `/reference/tracks/{id}/analysis` | track_analyses |
| POST | `/reference/tracks/{id}/analysis` | track_analyses |
| GET | `/reference/annotations` | track_annotations |
| GET | `/reference/annotations/{id}` | track_annotations |
| POST | `/reference/annotations` | track_annotations |
| PATCH | `/reference/annotations/{id}` | track_annotations |
| DELETE | `/reference/annotations/{id}` | track_annotations |
| GET | `/reference/regions` | track_regions |
| GET | `/reference/regions/{id}` | track_regions |
| POST | `/reference/regions` | track_regions |
| PATCH | `/reference/regions/{id}` | track_regions |
| DELETE | `/reference/regions/{id}` | track_regions |

---

### 22. Frames API (`lib/api/referenceTracks.ts` - framesApi)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/frames/manifest/{id}` | analysis_frame_manifests |
| GET | `/frames/data/{id}` | analysis_frame_data |
| GET | `/frames/analysis/{id}/chunks/{idx}` | analysis_frame_data |
| GET | `/frames/events/{id}` | analysis_events |

---

### 23. Analysis Cache (`lib/api/analysisCache.ts`)

| Method | Endpoint | Inferred Table(s) |
|--------|----------|-------------------|
| GET | `/analysis/cache` | track_analyses |
| POST | `/analysis/cache` | track_analyses |

---

## Tables Referenced Summary

### Auth Tables (from API responses)

| Table | API Sources |
|-------|-------------|
| `users` | sync, user, today |
| `sessions` | auth (implicit) |

### Gamification Tables

| Table | API Sources |
|-------|-------------|
| `user_progress` | sync, today |
| `user_wallet` | market, sync |
| `user_streaks` | sync (streak data) |

### Focus Tables

| Table | API Sources |
|-------|-------------|
| `focus_sessions` | focus, today, sync |
| `focus_pause_state` | focus |
| `focus_libraries` | focusLibraries |
| `focus_library_tracks` | focusLibraries |

### Habits & Goals Tables

| Table | API Sources |
|-------|-------------|
| `habits` | habits, sync |
| `habit_completions` | habits |
| `goals` | goals |
| `goal_milestones` | goals |

### Quests Tables

| Table | API Sources |
|-------|-------------|
| `quests` / `user_quests` | quests, sync |
| `universal_quests` | quests |
| `user_quest_progress` | quests |

### Planning Tables

| Table | API Sources |
|-------|-------------|
| `daily_plans` | dailyPlan, today, sync |
| `calendar_events` | calendar |

### Market Tables

| Table | API Sources |
|-------|-------------|
| `market_items` | market |
| `user_wallet` | market |
| `user_purchases` | market |

### Reference/Audio Tables

| Table | API Sources |
|-------|-------------|
| `reference_tracks` | referenceTracks |
| `track_analyses` | referenceTracks, analysisCache |
| `track_annotations` | referenceTracks |
| `track_regions` | referenceTracks |
| `analysis_frame_manifests` | frames |
| `analysis_frame_data` | frames |
| `analysis_events` | frames |

### Learning Tables

| Table | API Sources |
|-------|-------------|
| `learn_topics` | learn |
| `learn_lessons` | learn |
| `learn_drills` | learn |
| `user_lesson_progress` | learn |
| `user_drill_stats` | learn |

### Fitness Tables

| Table | API Sources |
|-------|-------------|
| `exercises` | exercise |
| `workouts` | exercise |
| `workout_sections` | exercise |
| `workout_exercises` | exercise |
| `workout_sessions` | exercise |
| `exercise_sets` | exercise |
| `personal_records` | exercise |
| `training_programs` | exercise |

### Books Tables

| Table | API Sources |
|-------|-------------|
| `books` | books |
| `reading_sessions` | books |

### Platform Tables

| Table | API Sources |
|-------|-------------|
| `feedback` | feedback |
| `ideas` | ideas |
| `infobase_entries` | infobase |
| `onboarding_flows` | onboarding |
| `onboarding_steps` | onboarding |
| `user_onboarding_state` | onboarding |
| `user_onboarding_responses` | onboarding |

### User Data Tables

| Table | API Sources |
|-------|-------------|
| `user_settings` | user, sync |
| `inbox_items` | inbox |
| `user_references` | references |

---

## Frontend Files Examined

| File | Endpoint Count |
|------|----------------|
| `lib/api/base.ts` | 0 (base client) |
| `lib/api/sync.ts` | 5 |
| `lib/api/user.ts` | 4 |
| `lib/api/books.ts` | 9 |
| `lib/api/habits.ts` | 3 |
| `lib/api/goals.ts` | 5 |
| `lib/api/quests.ts` | 7 |
| `lib/api/focus.ts` | 9 |
| `lib/api/focusLibraries.ts` | 5 |
| `lib/api/market.ts` | 8 |
| `lib/api/inbox.ts` | 5 |
| `lib/api/dailyPlan.ts` | 5 |
| `lib/api/today.ts` | 1 |
| `lib/api/calendar.ts` | 6 |
| `lib/api/onboarding.ts` | 5 |
| `lib/api/exercise.ts` | 18 |
| `lib/api/learn.ts` | 10 |
| `lib/api/ideas.ts` | 5 |
| `lib/api/infobase.ts` | 6 |
| `lib/api/feedback.ts` | 2 |
| `lib/api/references.ts` | 5 |
| `lib/api/referenceTracks.ts` | 22 |
| `lib/api/analysisCache.ts` | 2 |

**Total:** ~149 endpoints
