# Database Schema Specification

**Created:** January 10, 2026  
**Version:** 2.0  
**Purpose:** Definitive column-level specification for all tables

---

## Conventions

### Data Types
- **UUID**: Primary keys and foreign keys
- **TIMESTAMPTZ**: All timestamps (timezone-aware)
- **TEXT**: Variable-length strings (no VARCHAR limits)
- **JSONB**: Structured data, arrays, configuration
- **INTEGER**: Counts, levels, numeric values
- **BOOLEAN**: Flags

### Naming
- Primary keys: `id`
- Foreign keys: `<table>_id` (e.g., `user_id`)
- Timestamps: `created_at`, `updated_at`, `completed_at`, etc.
- Booleans: `is_*` prefix (e.g., `is_active`)

### Constraints
- All user-scoped tables have `user_id` with FK to `users(id)`
- `ON DELETE CASCADE` for dependent/log tables
- `ON DELETE RESTRICT` for core content

---

# Migration 0001: Auth

## users
Core user identity table.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| name | TEXT | | NULL | Display name |
| email | TEXT | UNIQUE NOT NULL | | Login email |
| email_verified | TIMESTAMPTZ | | NULL | When verified |
| image | TEXT | | NULL | Avatar URL |
| role | TEXT | NOT NULL | 'user' | Legacy role field |
| approved | BOOLEAN | NOT NULL | false | Account approved |
| age_verified | BOOLEAN | NOT NULL | false | Age check passed |
| tos_accepted | BOOLEAN | NOT NULL | false | Terms accepted |
| tos_accepted_at | TIMESTAMPTZ | | NULL | When ToS accepted |
| tos_version | TEXT | | NULL | Version accepted |
| last_activity_at | TIMESTAMPTZ | | NULL | Last active |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `users_email_idx` UNIQUE on (email)

---

## accounts
OAuth provider account links.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| type | TEXT | NOT NULL | | Account type |
| provider | TEXT | NOT NULL | | OAuth provider |
| provider_account_id | TEXT | NOT NULL | | Provider's user ID |
| refresh_token | TEXT | | NULL | OAuth refresh |
| access_token | TEXT | | NULL | OAuth access |
| expires_at | BIGINT | | NULL | Token expiry |
| token_type | TEXT | | NULL | |
| scope | TEXT | | NULL | |
| id_token | TEXT | | NULL | OIDC ID token |
| session_state | TEXT | | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `accounts_user_id_idx` on (user_id)
- `accounts_provider_account_idx` UNIQUE on (provider, provider_account_id)

---

## sessions
Active user sessions.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| token | TEXT | UNIQUE NOT NULL | | Session token hash |
| expires_at | TIMESTAMPTZ | NOT NULL | | Session expiry |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| last_activity_at | TIMESTAMPTZ | | NOW() | |
| user_agent | TEXT | | NULL | Browser/client |
| ip_address | TEXT | | NULL | Client IP |
| rotated_from | UUID | | NULL | Previous session ID |

**Indexes:**
- `sessions_token_idx` UNIQUE on (token)
- `sessions_user_id_idx` on (user_id)
- `sessions_expires_at_idx` on (expires_at)

---

## verification_tokens
Email verification/magic link tokens.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| identifier | TEXT | NOT NULL | | Email address |
| token | TEXT | UNIQUE NOT NULL | | Verification token |
| expires | TIMESTAMPTZ | NOT NULL | | Token expiry |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `verification_tokens_token_idx` UNIQUE on (token)
- PK on (identifier, token)

---

## authenticators
WebAuthn/Passkey credentials.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| credential_id | TEXT | UNIQUE NOT NULL | | WebAuthn credential ID |
| provider_account_id | TEXT | NOT NULL | | Provider ref |
| credential_public_key | TEXT | NOT NULL | | Public key |
| counter | BIGINT | NOT NULL | 0 | Sign counter |
| credential_device_type | TEXT | NOT NULL | | platform/cross-platform |
| credential_backed_up | BOOLEAN | NOT NULL | false | Cloud backed up |
| transports | TEXT[] | | NULL | usb/ble/nfc/internal |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `authenticators_credential_id_idx` UNIQUE on (credential_id)
- `authenticators_user_id_idx` on (user_id)

---

## oauth_states
CSRF protection for OAuth flows.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| state | TEXT | UNIQUE NOT NULL | | Random state value |
| provider | TEXT | NOT NULL | | OAuth provider |
| redirect_uri | TEXT | | NULL | Post-auth redirect |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| expires_at | TIMESTAMPTZ | NOT NULL | | State expiry |

**Indexes:**
- `oauth_states_state_idx` UNIQUE on (state)

---

# Migration 0002: RBAC

## roles
Role definitions.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| name | TEXT | UNIQUE NOT NULL | | Role name |
| description | TEXT | | NULL | |
| parent_role_id | UUID | FK roles(id) | NULL | Role inheritance |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## entitlements
Granular permission definitions.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| name | TEXT | UNIQUE NOT NULL | | e.g., "manage_users" |
| description | TEXT | | NULL | |
| resource | TEXT | NOT NULL | | Resource type |
| action | TEXT | NOT NULL | | create/read/update/delete |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## role_entitlements
Role to entitlement mapping.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| role_id | UUID | FK roles(id) CASCADE | | |
| entitlement_id | UUID | FK entitlements(id) CASCADE | | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**PK:** (role_id, entitlement_id)

---

## user_roles
User to role assignment.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| user_id | UUID | FK users(id) CASCADE | | |
| role_id | UUID | FK roles(id) CASCADE | | |
| granted_by | UUID | FK users(id) | NULL | Who granted |
| granted_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| expires_at | TIMESTAMPTZ | | NULL | Role expiry |

**PK:** (user_id, role_id)

---

## audit_log
Security audit trail.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) | NULL | Actor |
| session_id | UUID | FK sessions(id) | NULL | |
| event_type | TEXT | NOT NULL | | login/logout/action |
| resource_type | TEXT | | NULL | Affected resource type |
| resource_id | UUID | | NULL | Affected resource ID |
| action | TEXT | | NULL | CRUD action |
| status | TEXT | NOT NULL | | success/failure |
| details | JSONB | | NULL | Extra context |
| ip_address | TEXT | | NULL | |
| user_agent | TEXT | | NULL | |
| request_id | TEXT | | NULL | Trace ID |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `audit_log_user_id_idx` on (user_id)
- `audit_log_created_at_idx` on (created_at DESC)
- `audit_log_event_type_idx` on (event_type)

---

## activity_events
User activity events for gamification.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| event_type | TEXT | NOT NULL | | focus_complete, habit_done, etc. |
| category | TEXT | | NULL | Event category |
| metadata | JSONB | | NULL | Event-specific data |
| xp_earned | INTEGER | | 0 | XP from this event |
| coins_earned | INTEGER | | 0 | Coins from this event |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `activity_events_user_id_idx` on (user_id)
- `activity_events_created_at_idx` on (created_at DESC)

---

# Migration 0003: Gamification

## skill_definitions
Skill tree definitions.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| key | TEXT | UNIQUE NOT NULL | | focus, discipline, etc. |
| name | TEXT | NOT NULL | | Display name |
| description | TEXT | | NULL | |
| category | TEXT | NOT NULL | | mental/physical/creative |
| icon | TEXT | | NULL | Icon identifier |
| max_level | INTEGER | NOT NULL | 100 | |
| stars_per_level | INTEGER | NOT NULL | 10 | Stars needed per level |
| sort_order | INTEGER | NOT NULL | 0 | Display order |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## user_skills
User skill progress.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| skill_key | TEXT | NOT NULL | | FK to skill_definitions.key |
| current_stars | INTEGER | NOT NULL | 0 | Stars in current level |
| current_level | INTEGER | NOT NULL | 1 | Current skill level |
| total_stars | INTEGER | NOT NULL | 0 | All-time stars earned |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `user_skills_user_skill_idx` UNIQUE on (user_id, skill_key)

---

## achievement_definitions
Achievement catalog.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| key | TEXT | UNIQUE NOT NULL | | first_focus, streak_7, etc. |
| name | TEXT | NOT NULL | | Display name |
| description | TEXT | | NULL | |
| category | TEXT | NOT NULL | | focus/habit/streak/etc. |
| icon | TEXT | | NULL | |
| trigger_type | TEXT | NOT NULL | | event/threshold/compound |
| trigger_config | JSONB | NOT NULL | | Trigger parameters |
| reward_coins | INTEGER | NOT NULL | 0 | |
| reward_xp | INTEGER | NOT NULL | 0 | |
| is_hidden | BOOLEAN | NOT NULL | false | Secret achievement |
| sort_order | INTEGER | NOT NULL | 0 | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## user_achievements
Earned achievements.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| achievement_key | TEXT | NOT NULL | | FK to achievement_definitions.key |
| earned_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| notified | BOOLEAN | NOT NULL | false | User saw notification |

**Indexes:**
- `user_achievements_user_key_idx` UNIQUE on (user_id, achievement_key)

---

## user_progress
User XP and level.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE UNIQUE | | One per user |
| total_xp | INTEGER | NOT NULL | 0 | Lifetime XP |
| current_level | INTEGER | NOT NULL | 1 | Current level |
| xp_to_next_level | INTEGER | NOT NULL | 100 | XP needed for next |
| total_skill_stars | INTEGER | NOT NULL | 0 | All skill stars |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## user_wallet
User coin balance.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE UNIQUE | | One per user |
| coins | INTEGER | NOT NULL | 0 | Current balance |
| total_earned | INTEGER | NOT NULL | 0 | Lifetime earnings |
| total_spent | INTEGER | NOT NULL | 0 | Lifetime spending |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## points_ledger
Transaction history for coins/XP.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| event_type | TEXT | NOT NULL | | focus/habit/purchase/etc. |
| event_id | UUID | | NULL | Reference to source |
| coins | INTEGER | NOT NULL | 0 | Coins +/- |
| xp | INTEGER | NOT NULL | 0 | XP earned |
| skill_stars | INTEGER | | 0 | Skill stars earned |
| skill_key | TEXT | | NULL | Which skill |
| reason | TEXT | | NULL | Human description |
| idempotency_key | TEXT | | NULL | Prevent duplicates |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `points_ledger_user_id_idx` on (user_id)
- `points_ledger_idempotency_idx` UNIQUE on (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL

---

## user_streaks
Streak tracking.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| streak_type | TEXT | NOT NULL | | daily/focus/habit |
| current_streak | INTEGER | NOT NULL | 0 | Current count |
| longest_streak | INTEGER | NOT NULL | 0 | Personal best |
| last_activity_date | DATE | | NULL | Last active date |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `user_streaks_user_type_idx` UNIQUE on (user_id, streak_type)

---

# Migration 0004: Focus

## focus_sessions
Focus timer sessions.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| mode | TEXT | NOT NULL | | work/short_break/long_break |
| duration_seconds | INTEGER | NOT NULL | | Planned duration |
| started_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| completed_at | TIMESTAMPTZ | | NULL | If completed |
| abandoned_at | TIMESTAMPTZ | | NULL | If abandoned |
| expires_at | TIMESTAMPTZ | | NULL | When session times out |
| status | TEXT | NOT NULL | 'active' | active/completed/abandoned |
| xp_awarded | INTEGER | NOT NULL | 0 | XP earned |
| coins_awarded | INTEGER | NOT NULL | 0 | Coins earned |
| task_id | UUID | | NULL | Optional linked task |
| task_title | TEXT | | NULL | Task description |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `focus_sessions_user_id_idx` on (user_id)
- `focus_sessions_status_idx` on (status) WHERE status = 'active'

---

## focus_pause_state
Cross-device pause sync.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| session_id | UUID | FK focus_sessions(id) CASCADE | | |
| is_paused | BOOLEAN | NOT NULL | false | Currently paused |
| time_remaining_seconds | INTEGER | | NULL | Time left when paused |
| paused_at | TIMESTAMPTZ | | NULL | When paused |
| resumed_at | TIMESTAMPTZ | | NULL | When resumed |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `focus_pause_state_session_idx` UNIQUE on (session_id)

---

## focus_libraries
Music/sound libraries.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| name | TEXT | NOT NULL | | Library name |
| description | TEXT | | NULL | |
| library_type | TEXT | NOT NULL | 'playlist' | playlist/album/custom |
| tracks_count | INTEGER | NOT NULL | 0 | |
| is_favorite | BOOLEAN | NOT NULL | false | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## focus_library_tracks
Tracks in a library.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| library_id | UUID | FK focus_libraries(id) CASCADE | | |
| track_id | TEXT | | NULL | External track ID |
| track_title | TEXT | NOT NULL | | |
| track_url | TEXT | | NULL | |
| duration_seconds | INTEGER | | NULL | |
| sort_order | INTEGER | NOT NULL | 0 | |
| added_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

# Migration 0005: Habits & Goals

## habits
User habits.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| name | TEXT | NOT NULL | | |
| description | TEXT | | NULL | |
| frequency | TEXT | NOT NULL | 'daily' | daily/weekly/custom |
| target_count | INTEGER | NOT NULL | 1 | Times per period |
| custom_days | INTEGER[] | | NULL | [0-6] for custom |
| icon | TEXT | | NULL | |
| color | TEXT | | NULL | Hex color |
| is_active | BOOLEAN | NOT NULL | true | |
| current_streak | INTEGER | NOT NULL | 0 | |
| longest_streak | INTEGER | NOT NULL | 0 | |
| last_completed_at | TIMESTAMPTZ | | NULL | |
| sort_order | INTEGER | NOT NULL | 0 | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## habit_completions
Habit completion log.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| habit_id | UUID | FK habits(id) CASCADE | | |
| user_id | UUID | FK users(id) CASCADE | | |
| completed_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| completed_date | DATE | NOT NULL | | For daily grouping |
| notes | TEXT | | NULL | |

**Indexes:**
- `habit_completions_habit_date_idx` on (habit_id, completed_date)

---

## goals
User goals.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| title | TEXT | NOT NULL | | |
| description | TEXT | | NULL | |
| category | TEXT | | NULL | |
| target_date | DATE | | NULL | |
| started_at | TIMESTAMPTZ | | NULL | |
| completed_at | TIMESTAMPTZ | | NULL | |
| status | TEXT | NOT NULL | 'active' | active/completed/paused |
| progress | INTEGER | NOT NULL | 0 | 0-100 |
| priority | INTEGER | NOT NULL | 0 | |
| sort_order | INTEGER | NOT NULL | 0 | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## goal_milestones
Goal milestones.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| goal_id | UUID | FK goals(id) CASCADE | | |
| title | TEXT | NOT NULL | | |
| description | TEXT | | NULL | |
| is_completed | BOOLEAN | NOT NULL | false | |
| completed_at | TIMESTAMPTZ | | NULL | |
| sort_order | INTEGER | NOT NULL | 0 | |

---

# Migration 0006: Quests

## universal_quests
System-defined quests available to all users.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| title | TEXT | NOT NULL | | |
| description | TEXT | | NULL | |
| type | TEXT | NOT NULL | | daily/weekly/monthly/one_time |
| xp_reward | INTEGER | NOT NULL | 0 | |
| coin_reward | INTEGER | NOT NULL | 0 | |
| target | INTEGER | NOT NULL | 1 | Target count |
| target_type | TEXT | NOT NULL | | focus_minutes/habits/etc. |
| target_config | JSONB | | NULL | Extra conditions |
| skill_key | TEXT | | NULL | Skill that benefits |
| is_active | BOOLEAN | NOT NULL | true | |
| created_by | UUID | FK users(id) | NULL | Admin who created |
| sort_order | INTEGER | NOT NULL | 0 | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## user_quests
User's active quests (copies from universal or custom).

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| source_quest_id | UUID | FK universal_quests(id) | NULL | If from universal |
| title | TEXT | NOT NULL | | |
| description | TEXT | | NULL | |
| category | TEXT | | NULL | |
| difficulty | TEXT | | 'normal' | easy/normal/hard |
| xp_reward | INTEGER | NOT NULL | 0 | |
| coin_reward | INTEGER | NOT NULL | 0 | |
| status | TEXT | NOT NULL | 'active' | active/completed/claimed |
| progress | INTEGER | NOT NULL | 0 | Current progress |
| target | INTEGER | NOT NULL | 1 | Target to complete |
| is_active | BOOLEAN | NOT NULL | true | |
| is_repeatable | BOOLEAN | NOT NULL | false | |
| repeat_frequency | TEXT | | NULL | daily/weekly |
| accepted_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| completed_at | TIMESTAMPTZ | | NULL | |
| claimed_at | TIMESTAMPTZ | | NULL | Rewards claimed |
| expires_at | TIMESTAMPTZ | | NULL | |
| last_completed_date | DATE | | NULL | For repeatables |
| streak_count | INTEGER | NOT NULL | 0 | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

## user_quest_progress
Progress tracking for universal quests.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| quest_id | UUID | FK universal_quests(id) CASCADE | | |
| status | TEXT | NOT NULL | 'active' | |
| progress | INTEGER | NOT NULL | 0 | |
| accepted_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| completed_at | TIMESTAMPTZ | | NULL | |
| claimed_at | TIMESTAMPTZ | | NULL | |
| last_reset_at | TIMESTAMPTZ | | NULL | For daily/weekly |
| times_completed | INTEGER | NOT NULL | 0 | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `user_quest_progress_user_quest_idx` UNIQUE on (user_id, quest_id)

---

# Migration 0007: Planning

## calendar_events
Calendar entries.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| title | TEXT | NOT NULL | | |
| description | TEXT | | NULL | |
| event_type | TEXT | NOT NULL | 'event' | event/focus/workout/etc. |
| start_time | TIMESTAMPTZ | NOT NULL | | |
| end_time | TIMESTAMPTZ | | NULL | |
| all_day | BOOLEAN | NOT NULL | false | |
| timezone | TEXT | | 'UTC' | |
| location | TEXT | | NULL | |
| workout_id | UUID | | NULL | Linked workout |
| habit_id | UUID | | NULL | Linked habit |
| goal_id | UUID | | NULL | Linked goal |
| recurrence_rule | TEXT | | NULL | RRULE string |
| recurrence_end | DATE | | NULL | |
| parent_event_id | UUID | FK calendar_events(id) | NULL | For recurrence instances |
| color | TEXT | | NULL | |
| reminder_minutes | INTEGER | | NULL | |
| metadata | JSONB | | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `calendar_events_user_time_idx` on (user_id, start_time)

---

## daily_plans
Daily planning data.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| date | DATE | NOT NULL | | |
| items | JSONB | NOT NULL | '[]' | Plan items array |
| notes | TEXT | | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

**Indexes:**
- `daily_plans_user_date_idx` UNIQUE on (user_id, date)

---

## plan_templates
Reusable plan templates.

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PK | gen_random_uuid() | |
| user_id | UUID | FK users(id) CASCADE | | |
| name | TEXT | NOT NULL | | |
| description | TEXT | | NULL | |
| items | JSONB | NOT NULL | '[]' | Template items |
| is_public | BOOLEAN | NOT NULL | false | Shareable |
| category | TEXT | | NULL | |
| use_count | INTEGER | NOT NULL | 0 | Times used |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

---

*(Continued in Part 2 - Markets, Books, Fitness, Learn, Reference, Platform)*
