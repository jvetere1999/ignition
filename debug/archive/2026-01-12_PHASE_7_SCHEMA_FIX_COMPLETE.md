# Phase 7: Schema Mismatch Root Cause & Fix - COMPLETE ✅

**Date**: 2026-01-12 07:26 UTC  
**Status**: ✅ **READY FOR PUSH**  
**Issue**: Column "theme" does not exist (500 errors on all sync endpoints)  
**Resolution**: Schema mismatch in user_settings table - FIXED

---

## Issue Discovery

### Symptoms
- `/api/sync/poll` returning 500 every 30s
- `/api/onboarding` returning 500
- `/api/today` returning 500
- App stuck on loading screen
- Backend logs: `error returned from database: column "theme" does not exist`

### Investigation Path
1. Checked Fly.io logs → found exact error: `column "theme" does not exist`
2. Searched backend code → found fetch_progress() querying user_settings.theme
3. Checked database schema → verified table exists but schema mismatch
4. Examined schema.json → found user_settings has only key-value structure (id, user_id, key, value, created_at, updated_at)
5. Compared to backend code expectations → 10+ specific columns required

---

## Root Cause

### Backend Expected Schema (platform_repos.rs lines 1490, 1549, 1554):
```rust
SELECT id, user_id, notifications_enabled, email_notifications,
       push_notifications, theme, timezone, locale, profile_public,
       show_activity, soft_landing_until, daily_reminder_time,
       created_at, updated_at
FROM user_settings
WHERE user_id = $1
```

### Actual Database Schema (old):
```
id (UUID)
user_id (UUID)
key (TEXT)
value (JSONB)
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)
```

### Mismatch:
- Backend expects relational columns: notifications_enabled, email_notifications, push_notifications, **theme**, timezone, locale, profile_public, show_activity, daily_reminder_time, soft_landing_until
- Database had JSONB key-value store with only key, value fields
- Theme column completely missing → query fails with 500 error

---

## Solution

### Step 1: Updated Schema Definitions

**Two schema.json files needed updating**:

1. `/Users/Shared/passion-os-next/schema.json` (root)
   - Lines 5893-5950: Corrected user_settings definition

2. `/Users/Shared/passion-os-next/tools/schema-generator/schema.json` (generator source)
   - Lines 5959-6050: Same correction

**Corrected Structure**:
```json
{
  "user_settings": {
    "fields": {
      "id": "UUID PRIMARY KEY",
      "user_id": "UUID NOT NULL UNIQUE",
      "notifications_enabled": "BOOLEAN NOT NULL",
      "email_notifications": "BOOLEAN NOT NULL", 
      "push_notifications": "BOOLEAN NOT NULL",
      "theme": "TEXT NOT NULL",
      "timezone": "TEXT NULLABLE",
      "locale": "TEXT NOT NULL",
      "profile_public": "BOOLEAN NOT NULL",
      "show_activity": "BOOLEAN NOT NULL",
      "daily_reminder_time": "TEXT NULLABLE",
      "soft_landing_until": "TIMESTAMPTZ NULLABLE",
      "created_at": "TIMESTAMPTZ DEFAULT NOW()",
      "updated_at": "TIMESTAMPTZ DEFAULT NOW()"
    }
  }
}
```

### Step 2: Regenerated All Files

Ran: `python3 tools/schema-generator/generate_all.py`

Generated files:
- ✅ `app/backend/migrations/0001_schema.sql` (lines 616-631)
  ```sql
  CREATE TABLE user_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      notifications_enabled BOOLEAN NOT NULL,
      email_notifications BOOLEAN NOT NULL,
      push_notifications BOOLEAN NOT NULL,
      theme TEXT NOT NULL,
      timezone TEXT,
      locale TEXT NOT NULL,
      profile_public BOOLEAN NOT NULL,
      show_activity BOOLEAN NOT NULL,
      daily_reminder_time TEXT,
      soft_landing_until TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ```

- ✅ `app/backend/crates/api/src/db/generated.rs` (lines 707-721)
  ```rust
  pub struct UserSettings {
      pub id: Uuid,
      pub user_id: Uuid,
      pub notifications_enabled: bool,
      pub email_notifications: bool,
      pub push_notifications: bool,
      pub theme: String,
      pub timezone: Option<String>,
      pub locale: String,
      pub profile_public: bool,
      pub show_activity: bool,
      pub daily_reminder_time: Option<String>,
      pub soft_landing_until: Option<chrono::DateTime<chrono::Utc>>,
      pub created_at: chrono::DateTime<chrono::Utc>,
      pub updated_at: chrono::DateTime<chrono::Utc>,
  }
  ```

- ✅ `app/frontend/src/lib/generated_types.ts`
  ```typescript
  export interface UserSettings {
      id: string;
      user_id: string;
      notifications_enabled: boolean;
      email_notifications: boolean;
      push_notifications: boolean;
      theme: string;
      timezone: string | null;
      locale: string;
      profile_public: boolean;
      show_activity: boolean;
      daily_reminder_time: string | null;
      soft_landing_until: string | null;
      created_at: string;
      updated_at: string;
  }
  ```

### Step 3: Validated All Changes

```
✅ cargo check --bin ignition-api
   Result: 0 errors, 218 warnings (pre-existing)
   Duration: 4.06s

✅ npm run lint (frontend)
   Result: 0 errors, pre-existing warnings only
   Duration: 3s
```

---

## Impact When Deployed

When code is pushed to GitHub:

1. **GitHub Actions Workflow**:
   - Runs wipe-and-rebuild-neon job
   - Drops old neon database
   - Creates fresh database from 0001_schema.sql
   - user_settings table now has all 13 columns including theme

2. **Backend Deployment**:
   - Deploys updated generated.rs with correct UserSettings struct
   - All database queries now match schema
   - `/api/sync/poll` → fetch_progress() query now succeeds (theme column exists)
   - `/api/onboarding` → query succeeds
   - `/api/today` → query succeeds

3. **Frontend/Admin Auto-Deploy**:
   - New generated_types.ts with UserSettings interface
   - Type-safe API calls to updated backend

4. **Expected Result**:
   - All 500 "column theme does not exist" errors resolve
   - App loads successfully after login
   - SyncState polling works (30s cycle)
   - Users can set theme preference

---

## Files Modified Summary

| File | Lines | Change | Status |
|------|-------|--------|--------|
| schema.json | 5893-5950 | Corrected user_settings definition | ✅ |
| tools/schema-generator/schema.json | 5959-6050 | Same correction | ✅ |
| app/backend/migrations/0001_schema.sql | 616-631 | Generated correct CREATE TABLE | ✅ |
| app/backend/crates/api/src/db/generated.rs | 707-721 | Generated UserSettings struct | ✅ |
| app/frontend/src/lib/generated_types.ts | (varies) | Generated UserSettings interface | ✅ |

---

## Next Steps

1. **User Action**: `git push origin production`
2. **GitHub Actions**: Automatically rebuilds database and deploys
3. **Validation**: Check production endpoints respond
4. **Monitoring**: App should load without 500 errors

---

## Lessons Learned

1. **Schema Definition Mismatch**: Backend code and schema.json had different designs
   - schema.json had JSONB key-value (flexible but wrong)
   - Backend expected relational columns (correct, specific)
   - Root cause: Two conflicting schema sources

2. **Two Schema Sources**: Found both `/schema.json` and `/tools/schema-generator/schema.json`
   - Generator reads from tools/schema-generator version
   - Both needed updating
   - Created single-source-of-truth issue

3. **Schema Validation**: Database query logs are the source of truth
   - Error "column theme does not exist" immediately identified problem
   - Traced to schema.json definition
   - Fixed at source, regenerated all derivatives

---

## Archive Entry

- **Session**: Phase 7 Production Error Debugging
- **Duration**: ~60 minutes from issue discovery to fix
- **Root Cause**: Schema definition JSONB vs relational mismatch
- **Resolution**: Corrected schema.json and regenerated all files
- **Validation**: 0 errors in all builds and checks
- **Status**: Ready for deployment

