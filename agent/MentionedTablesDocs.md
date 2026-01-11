# Tables Mentioned in Documentation

**Generated:** January 10, 2026  
**Source:** `app/database/schema.md`, `docs/behavioral/`, `docs/technical/`

---

## Overview

This document catalogs all database tables mentioned in official documentation, organized by substrate layer.

---

## 1. Auth Substrate (Documented in schema.md)

| Table | Status | Description |
|-------|--------|-------------|
| `users` | ✅ Documented | Core user identity |
| `accounts` | ✅ Documented | OAuth provider links |
| `sessions` | ✅ Documented | Active user sessions |
| `verification_tokens` | ✅ Documented | Email/magic link tokens |
| `authenticators` | ✅ Documented | WebAuthn/Passkey credentials |
| `roles` | ✅ Documented | RBAC role definitions |
| `entitlements` | ✅ Documented | Granular permissions |
| `role_entitlements` | ✅ Documented | Role-to-entitlement mapping |
| `user_roles` | ✅ Documented | User-to-role mapping |
| `audit_log` | ✅ Documented | Security audit log |
| `activity_events` | ✅ Documented | User activity events (gamification) |

---

## 2. Gamification Substrate (Planned - schema.md)

| Table | Status | Description |
|-------|--------|-------------|
| `user_wallet` | 📋 Planned | User coin balance |
| `user_progress` | 📋 Planned | XP, level, progression |
| `user_skills` | 📋 Planned | Skill levels/stars |
| `achievements` | 📋 Planned | Achievement definitions |
| `points_ledger` | 📋 Planned | Transaction history |
| `streaks` | 📋 Planned | User streaks |

---

## 3. Content Substrate (Planned - schema.md)

| Table | Status | Description |
|-------|--------|-------------|
| `quests` | 📋 Planned | Quest definitions |
| `universal_quests` | 📋 Planned | System-wide quests |
| `exercises` | 📋 Planned | Exercise library |
| `workouts` | 📋 Planned | Workout templates |
| `learn_*` | 📋 Planned | Learning system tables |

---

## 4. User Data Substrate (Planned - schema.md)

| Table | Status | Description |
|-------|--------|-------------|
| `user_settings` | 📋 Planned | User preferences |
| `user_interests` | 📋 Planned | Interest selections |
| `daily_plans` | 📋 Planned | Daily planning |
| `calendar_events` | 📋 Planned | Calendar integration |

---

## 5. Market Substrate (Planned - schema.md)

| Table | Status | Description |
|-------|--------|-------------|
| `market_items` | 📋 Planned | Shop items |
| `user_purchases` | 📋 Planned | Purchase history |

---

## 6. Reference Substrate (Planned - schema.md)

| Table | Status | Description |
|-------|--------|-------------|
| `reference_tracks` | 📋 Planned | Audio reference files |
| `track_analysis_cache` | 📋 Planned | Analysis caching |

---

## Documentation References

### schema.md - Fully Documented Tables

These 11 tables have complete column definitions in `app/database/schema.md`:

1. `users`
2. `accounts`
3. `sessions`
4. `verification_tokens`
5. `authenticators`
6. `roles`
7. `entitlements`
8. `role_entitlements`
9. `user_roles`
10. `audit_log`
11. `activity_events`

### Views Documented

- `user_with_roles` - Convenience view for auth checks
- `user_session_count` - Active session count per user

### Functions Documented

- `cleanup_expired_sessions()` - Remove expired sessions
- `cleanup_expired_tokens()` - Remove expired verification tokens

---

## Gap Analysis

| Category | Documented | Actually Implemented |
|----------|------------|---------------------|
| Auth | 11 tables | 11 tables ✅ |
| Gamification | 6 tables (planned) | 8 tables |
| Focus | 0 tables | 2 tables |
| Habits/Goals | 0 tables | 4 tables |
| Quests | 2 tables (planned) | 3 tables |
| Planning | 2 tables (planned) | 3 tables |
| Market | 2 tables (planned) | 6 tables |
| Reference | 2 tables (planned) | 5 tables |
| Analysis | 0 tables | 3 tables |
| Listening | 0 tables | 2 tables |
| Fitness | 0 tables | 10 tables |
| Books | 0 tables | 2 tables |
| Learn | 0 tables | 5 tables |
| Platform | 0 tables | 8 tables |
| Settings | 0 tables | 1 table |
| Other | 0 tables | 5 tables |

**Total documented:** 11 tables  
**Total implemented:** ~75 tables  
**Documentation debt:** 64 tables undocumented

---

## Recommendations

1. **Update schema.md** to reflect all 21 migrations
2. **Add substrate sections** for Focus, Fitness, Books, Learn
3. **Document column schemas** for all tables
4. **Add relationship diagrams** showing FK connections
