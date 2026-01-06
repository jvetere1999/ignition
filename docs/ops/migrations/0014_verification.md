# Migration 0014 Verification: Performance Indexes

**Migration:** 0014_add_performance_indexes  
**Date:** January 5, 2026  
**Status:** PENDING

---

## Purpose

Add database indexes to optimize high-frequency queries introduced in Phases 1-2 of the Today Starter Engine.

## Indexes Added

| Index Name | Table | Columns | Used By |
|------------|-------|---------|---------|
| `idx_daily_plans_user_date` | daily_plans | user_id, plan_date | `getDailyPlanSummary()` |
| `idx_activity_events_user_created` | activity_events | user_id, created_at | `getDynamicUIData()`, `isFirstDay()` |
| `idx_activity_events_user_type` | activity_events | user_id, event_type | `getQuickPicks()` |
| `idx_focus_sessions_user_status` | focus_sessions | user_id, status | `hasFocusActive()` |
| `idx_user_streaks_user` | user_streaks | user_id | `hasActiveStreak()` |

---

## Verification Steps

### Local

```bash
# Apply migration locally
wrangler d1 execute passion_os --local --file=migrations/0014_add_performance_indexes.sql > .tmp/migration-0014-local.log 2>&1

# Verify indexes exist
wrangler d1 execute passion_os --local --command "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name;" > .tmp/verify-indexes-local.log 2>&1
```

**Expected indexes (should include all new ones):**
- idx_activity_events_user_created
- idx_activity_events_user_type
- idx_daily_plans_user_date
- idx_focus_sessions_user_status
- idx_user_streaks_user

### Preview

```bash
# Apply migration to preview
wrangler d1 execute passion_os --remote --env preview --file=migrations/0014_add_performance_indexes.sql > .tmp/migration-0014-preview.log 2>&1

# Verify indexes exist
wrangler d1 execute passion_os --remote --env preview --command "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name;" > .tmp/verify-indexes-preview.log 2>&1
```

### Production

```bash
# Apply migration to production
wrangler d1 execute passion_os --remote --file=migrations/0014_add_performance_indexes.sql > .tmp/migration-0014-prod.log 2>&1

# Verify indexes exist
wrangler d1 execute passion_os --remote --command "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name;" > .tmp/verify-indexes-prod.log 2>&1
```

---

## Rollback

If indexes cause issues (unlikely), they can be dropped:

```sql
DROP INDEX IF EXISTS idx_daily_plans_user_date;
DROP INDEX IF EXISTS idx_activity_events_user_created;
DROP INDEX IF EXISTS idx_activity_events_user_type;
DROP INDEX IF EXISTS idx_focus_sessions_user_status;
DROP INDEX IF EXISTS idx_user_streaks_user;
```

---

## Post-Migration Validation

1. App boots without errors
2. Today page loads
3. Daily plan generation works
4. Focus session creation works
5. No console errors related to queries

---

## Status Log

| Environment | Applied | Verified | Date | Notes |
|-------------|---------|----------|------|-------|
| Local | YES | YES | 2026-01-05 | 5 indexes created successfully |
| Preview | PENDING | PENDING | - | - |
| Production | PENDING | PENDING | - | - |

