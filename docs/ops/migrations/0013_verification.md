# Migration 0013 Verification

**Migration:** `0013_add_users_last_activity.sql`
**Date Applied:** January 4, 2026
**Status:** VERIFIED

---

## Migration Purpose

Adds `last_activity_at` column to `users` table for efficient gap-based reduced mode detection.

---

## Local Environment

### Migration Applied

```
Date: 2026-01-04
Command: wrangler d1 migrations apply passion_os --local
Result: 4 commands executed successfully
Status: APPLIED
```

### Column Verification

```sql
PRAGMA table_info(users);
```

**Result:**
```json
{
  "cid": 19,
  "name": "last_activity_at",
  "type": "TEXT",
  "notnull": 0,
  "dflt_value": "null",
  "pk": 0
}
```

**Status:** COLUMN EXISTS

### Index Verification

```sql
SELECT name FROM sqlite_master WHERE type='index' AND name='idx_users_last_activity';
```

**Result:**
```json
{
  "results": [
    { "name": "idx_users_last_activity" }
  ],
  "success": true
}
```

**Status:** INDEX EXISTS

---

## Preview Environment

**Status:** PENDING

To apply:
```bash
wrangler d1 migrations apply passion_os --env preview --remote
```

---

## Production Environment

**Status:** PENDING

To apply:
```bash
wrangler d1 migrations apply passion_os --remote
```

---

## Backfill Verification

The migration includes a backfill query:
```sql
UPDATE users
SET last_activity_at = (
    SELECT MAX(created_at)
    FROM activity_events
    WHERE activity_events.user_id = users.id
)
WHERE EXISTS (
    SELECT 1 FROM activity_events WHERE activity_events.user_id = users.id
);
```

**Local backfill status:** Executed as part of migration (users with activity_events have last_activity_at populated).

---

## Rollback Plan

SQLite does not support DROP COLUMN directly. Rollback options:

1. **Ignore column:** Stop updating and using `last_activity_at`. Code gracefully handles null values.
2. **Full table rebuild:** Only if absolutely necessary (expensive).

---

## Validation Commands

```bash
# Verify column exists
wrangler d1 execute passion_os --local --command "PRAGMA table_info(users);" | grep last_activity_at

# Verify index exists  
wrangler d1 execute passion_os --local --command "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_users_last_activity';"

# Test query
wrangler d1 execute passion_os --local --command "SELECT id, last_activity_at FROM users LIMIT 5;"
```

---

## Sign-off

- [x] Local migration applied
- [x] Column exists
- [x] Index exists
- [ ] Preview migration applied
- [ ] Production migration applied
- [ ] App boot verified
- [ ] Auth flow unaffected

