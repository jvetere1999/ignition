# NEW ISSUES - Discovery & Solution Selection

**Generated**: 2026-01-11  
**Updated**: 2026-01-11 22:32 (Added critical production errors)  
**Status**: DISCOVERY COMPLETE + URGENT PRODUCTION ISSUES  
**Purpose**: Document new issues, analysis, and provide solution selection framework

---

## 🚨 CRITICAL PRODUCTION ERRORS (FROM LOGS)

**Context**: User experiencing frozen loading screen + multiple 500 errors  
**Time**: 2026-01-11 22:32:00 UTC  
**User**: jvetere1999@gmail.com (session: 844aa337...)

### ERROR 1: Date Type Casting Still Broken (CRITICAL)
**Location**: Multiple endpoints  
**Error**: `operator does not exist: date = text`  
**Status**: ❌ PREVIOUS FIX INCOMPLETE OR NOT DEPLOYED

**Evidence from logs**:
```
22:32:01 "error.message":"error returned from database: operator does not exist: date = text"
22:32:02 "error.message":"error returned from database: operator does not exist: date = text"
```

**Analysis**:
- We supposedly fixed this in sync.rs and today.rs
- Logs show it's STILL happening (2 instances at 22:32:01 and 22:32:02)
- Either:
  - Fix wasn't deployed (backend not redeployed?)
  - There are additional instances we missed
  - Bind parameter is wrong type (passing String instead of NaiveDate)

---

### ERROR 2: habits.archived Column Missing (CRITICAL)
**Location**: `today.rs` line 390  
**Error**: `column h.archived does not exist`  
**Status**: ❌ SCHEMA MISMATCH - New Discovery

**Evidence from logs**:
```
22:32:01 "error.message":"error returned from database: column h.archived does not exist"
```

**Code Location**:
```rust
// app/backend/crates/api/src/routes/today.rs:390
SELECT COUNT(*) FROM habits h
WHERE h.user_id = $1 AND h.archived = false
```

**Schema Analysis**:
- **Migration 0001_schema.sql**: habits table has NO `archived` column
- **Schema.json v2.0.0**: habits table has NO `archived` column (confirmed)
- **Backend code**: Queries `h.archived = false` ❌

**Confirmed fields in habits table**:
```json
["color", "created_at", "current_streak", "custom_days", "description",
 "frequency", "icon", "id", "is_active", "last_completed_at",
 "longest_streak", "name", "sort_order", "target_count", "updated_at", "user_id"]
```

**Root Cause**: Backend code uses old schema field `archived`, but schema v2.0.0 uses `is_active` instead.

**Fix Required**: Change `h.archived = false` → `h.is_active = true`

---

### ERROR 3: Unknown 500 Error (396ms response)
**Location**: Unknown endpoint  
**Status**: ❌ NO ERROR MESSAGE, JUST 500

**Evidence from logs**:
```
22:32:01 {"level":"ERROR","message":"response failed","classification":"Status code: 500 Internal Server Error","latency":"396 ms"}
```

---

## ISSUE 6: Zen Browser Transparency Not Working (HIGH)

### Current State
**Location**: Frontend CSS/styling  
**Browser**: Zen Browser (Firefox-based) with Zen-Nebula theme v3.3  
**Status**: Low transparency support

### Evidence
- User reports transparency issues with Zen-Nebula theme
- GitHub package: https://github.com/JustAdumbPrsn/Zen-Nebula/releases/tag/v3.3
- Likely CSS variable conflicts or backdrop-filter issues

### Root Cause
**TYPE**: Browser-Specific CSS Compatibility

Zen Browser uses custom CSS for transparency effects:
1. Zen-Nebula theme modifies window transparency
2. Our app likely uses opaque backgrounds or missing backdrop-filter
3. CSS variables may conflict with Zen's custom properties

### Impact
- **SEVERITY**: HIGH - Affects Zen Browser users (growing user base)
- **SCOPE**: All Zen Browser users with transparency themes
- **USER EXPERIENCE**: App appears opaque when theme expects transparency
- **BUSINESS IMPACT**: Poor experience for Firefox/Zen users

---

## 🔧 URGENT SOLUTION OPTIONS - Production Errors

### URGENT FIX 1: habits.archived Column Error

**OPTION A: Fix Query to Use is_active (Recommended)**
**Effort**: 15 minutes  
**Risk**: NONE - Simple column name change

**Steps**:
1. Update `today.rs` line 390: `h.archived = false` → `h.is_active = true`
2. Search for all other `archived` references in habits queries
3. Compile: `cargo check --bin ignition-api`
4. Deploy: `flyctl deploy`

**Code Change**:
```rust
// OLD (WRONG):
WHERE h.user_id = $1 AND h.archived = false

// NEW (CORRECT):
WHERE h.user_id = $1 AND h.is_active = true
```

**OPTION B: Add archived Column to Schema**
**Effort**: 1 hour  
**Risk**: MEDIUM - Migration complexity

**Cons**: Schema.json is authoritative, should fix code not schema. NOT RECOMMENDED.

---

### URGENT FIX 2: Date Casting Error

**OPTION A: Verify Deployment Status (Immediate)**
**Effort**: 10 minutes  
**Risk**: NONE

**Steps**:
1. Check Fly.io deployment: `flyctl releases --app ignition-api`
2. Verify last deploy timestamp matches our commit time
3. If not deployed: `cd app/backend && flyctl deploy`
4. If deployed: Search for additional instances we missed

**OPTION B: Find All Date Comparisons**
**Effort**: 1 hour  
**Risk**: LOW

**Steps**:
1. Grep for all `date = $` patterns in routes/
2. Verify each has `::date` cast
3. Check bind parameter types (should be NaiveDate, not String)
4. May be passing String when should pass NaiveDate

---

## 🔧 SOLUTION OPTIONS - Zen Browser Transparency

### OPTION A: Add Transparency CSS Support (Recommended)
**Effort**: 2-3 hours  
**Risk**: LOW

**Steps**:
1. Add CSS custom properties for transparency:
   ```css
   @supports (-moz-appearance: none) {
     :root {
       --app-bg-opacity: 0.95;
       --panel-bg-opacity: 0.9;
     }
   }
   ```
2. Use `backdrop-filter: blur(10px)` on main containers
3. Replace solid backgrounds with `rgba()` values using CSS variables
4. Test with Zen-Nebula theme

**Files to Modify**:
- `app/frontend/src/app/globals.css`
- `app/frontend/src/components/shell/AppShell.module.css`
- Components with solid backgrounds

**Pros**:
- Better visual integration with Zen themes
- Improves aesthetics for all transparency themes
- Modern CSS feature

**Cons**:
- Need to test across browsers
- May affect performance on older devices

---

### OPTION B: Zen Browser Detection + Custom Styles
**Effort**: 1 hour  
**Risk**: LOW

**Steps**:
1. Detect Zen Browser via user agent
2. Apply `.zen-browser` class to body
3. Add Zen-specific CSS rules

**Pros**: Isolated changes  
**Cons**: User agent detection fragile

---

### OPTION C: Document Issue Only
**Effort**: 15 minutes  
**Risk**: NONE

**Steps**: Add note to README about Zen Browser transparency

**Pros**: No code changes  
**Cons**: Doesn't fix issue

---

## 👤 YOUR SELECTION - Production Errors

**habits.archived Fix**: Option _____ (A recommended)  
**Date Casting Fix**: Option _____ (A to check deployment first)  
**Zen Browser**: Option _____ (A for full support)

**Reason**: _________  

---

## IMMEDIATE ACTION REQUIRED

### Critical Path (Next 30 minutes):

1. **FIX habits.archived** (10 min) ⚠️ BLOCKING PRODUCTION
   - Change `h.archived = false` to `h.is_active = true` in today.rs
   - Search for other `archived` references
   - Compile + test locally

2. **VERIFY DEPLOYMENT** (5 min)
   - Check if previous date fixes were deployed
   - `flyctl releases --app ignition-api`

3. **REDEPLOY BACKEND** (10 min)
   - `cd app/backend && flyctl deploy`
   - Wait for deployment
   - Monitor logs

4. **VERIFY FIX** (5 min)
   - Load app in browser
   - Check logs for 500 errors
   - Confirm loading screen completes

---

## IMPLEMENTATION PRIORITY MATRIX (UPDATED)

| Issue | Severity | User Impact | Effort | Recommended Priority |
|-------|----------|-------------|--------|---------------------|
| **habits.archived Error** | **CRITICAL** | **HIGH** | **15m** | **P0** (Blocking Production) |
| **Date Casting Verification** | **CRITICAL** | **HIGH** | **10m-1h** | **P0** (Blocking Production) |
| Session Termination | CRITICAL | HIGH | 3-4h | **P1** (Security) |
| Plan My Day | CRITICAL | HIGH | 4-6h | **P2** (Core Feature) |
| Zen Browser Transparency | HIGH | MEDIUM | 2-3h | **P3** (UX Enhancement) |
| Onboarding | HIGH | MEDIUM | 2-3h | **P4** (First-run UX) |
| Focus Library | HIGH | MEDIUM | 6-8h | **P5** (Enhancement) |
| Focus Persistence | MEDIUM | LOW | 2h | **P6** (Optimization) |

---

## EXECUTION ORDER (UPDATED - EMERGENCY MODE)

**IMMEDIATE (Next 30 minutes) 🚨**
1. Fix habits.archived → is_active (P0)
2. Verify date casting deployment status (P0)
3. Redeploy backend
4. Test in production

**Phase 1: Security + Critical Bugs** (After immediate fixes, 1 day)
5. Session Termination (P1) - OPTION A
6. Plan My Day (P2) - OPTION A or B

**Phase 2: UX Improvements** (1 day)
7. Zen Browser Transparency (P3) - OPTION A
8. Onboarding (P4) - OPTION A or B
9. Focus Persistence (P6) - OPTION A

**Phase 3: Enhancements** (2 days)
10. Focus Library (P5) - OPTION A or B

---

## ISSUE 1: Onboarding Modal Not Rendering (CRITICAL)

### Current State
**Location**: `app/frontend/src/components/onboarding/OnboardingProvider.tsx` line 61-63  
**Status**: DISABLED - Intentionally commented out during migration

### Evidence
```tsx
// TODO: The OnboardingModal component needs to be updated to work with
// the new API response format. For now, we'll skip rendering it.
// The modal expects: initialState, flow (with steps array), userId
// The API returns: state, flow (without steps), current_step, all_steps
console.log("Onboarding needed but modal temporarily disabled during migration");
return null;
```

### Root Cause
**TYPE**: API Contract Mismatch (Migration Incomplete)

Backend moved from D1 (frontend) to Postgres (backend), but:
1. **Old Modal Expects**:
   - `initialState`: UserOnboardingState
   - `flow`: OnboardingFlow with nested `steps` array
   - `userId`: string

2. **New API Returns**:
   - `state`: OnboardingState (flat)
   - `flow`: OnboardingFlow WITHOUT steps array
   - `current_step`: OnboardingStep (single)
   - `all_steps`: OnboardingStepSummary[] (separate array)

### Impact
- **SEVERITY**: HIGH - New users can't complete onboarding
- **SCOPE**: All new users, feature selection disabled
- **USER EXPERIENCE**: Users see no onboarding, miss feature customization
- **BUSINESS IMPACT**: Poor first-run experience, reduced engagement

### Dependencies
- ✅ Backend API working (returns data)
- ✅ OnboardingModal component exists
- ❌ Modal props don't match API response

---

## 🔧 SOLUTION OPTIONS - Onboarding

### OPTION A: Update Modal Props (Recommended)
**Effort**: 2-3 hours  
**Risk**: LOW - Type changes only

**Steps**:
1. Update `OnboardingModalProps` interface to match new API
2. Change `flow` prop to not expect nested `steps`
3. Add `current_step` and `all_steps` props
4. Update modal rendering logic to use `all_steps` array
5. Update step navigation to use `current_step`

**Pros**:
- Preserves existing modal logic
- Clean separation of data vs UI
- Easy to test

**Cons**:
- Requires modal refactor
- May need to update multiple render functions

---

### OPTION B: Transform API Response
**Effort**: 1 hour  
**Risk**: MEDIUM - Data transformation complexity

**Steps**:
1. Keep modal props unchanged
2. In OnboardingProvider, transform API response:
   ```tsx
   const transformedFlow = {
     ...onboarding.flow,
     steps: onboarding.all_steps
   };
   ```
3. Pass transformed data to modal

**Pros**:
- Quick fix
- No modal changes
- Maintains backwards compatibility

**Cons**:
- Hacky solution
- Duplicates data structure
- Doesn't follow new API design

---

### OPTION C: Rewrite Modal for New API
**Effort**: 4-6 hours  
**Risk**: MEDIUM - Full rewrite

**Steps**:
1. Redesign modal to consume flat API structure
2. Fetch steps on demand instead of nested
3. Update state management
4. Rewrite navigation logic

**Pros**:
- Future-proof design
- Better performance (no nested data)
- Cleaner architecture

**Cons**:
- Time-consuming
- Higher risk of regressions
- Requires extensive testing

---

## 👤 YOUR SELECTION - Onboarding

**Preferred Option**: _________  
**Reason**: _________  
**Acceptable Alternatives**: _________

---

## ISSUE 2: Plan My Day Broken (CRITICAL)

### Current State
**Location**: Backend `DailyPlanRepo::generate()` implementation  
**Status**: INCOMPLETE - Generate function returns empty plans

### Evidence
```rust
// app/backend/crates/api/src/db/platform_repos.rs:398
pub async fn generate(
    pool: &PgPool,
    user_id: Uuid,
    date: NaiveDate,
) -> Result<DailyPlanResponse, AppError> {
    let mut items: Vec<PlanItem> = vec![];
    // TODO: Actually generate items from:
    // - Active quests
    // - Scheduled workouts
    // - Due habits
    // - Learning items
    
    // Currently returns empty plan
```

### Root Cause
**TYPE**: Feature Not Implemented

Backend migration moved endpoint but didn't implement generation logic:
1. Old D1 version had generation logic
2. New Postgres backend has skeleton only
3. No queries to fetch active quests/habits/workouts
4. Returns empty `items` array

### Impact
- **SEVERITY**: CRITICAL - Core feature broken
- **SCOPE**: All users trying to generate daily plan
- **USER EXPERIENCE**: "Plan My Day" button does nothing useful
- **BUSINESS IMPACT**: Key workflow broken, reduces daily engagement

### Data Sources Needed
From schema.json v2.0.0:
- `quests` table: WHERE `status = 'active'` AND `user_id = ?`
- `habit_instances` table: WHERE `date = ?` AND `status = 'pending'`
- `workouts` table: WHERE scheduled for date (calendar integration)
- `learning_items` table: WHERE due/recommended for date

---

## 🔧 SOLUTION OPTIONS - Plan My Day

### OPTION A: Implement Full Generation Logic (Recommended)
**Effort**: 4-6 hours  
**Risk**: MEDIUM - Multiple table queries

**Steps**:
1. Query active quests (limit 3)
2. Query pending habits for date
3. Query scheduled workouts (calendar_events)
4. Query recommended learning items
5. Add default focus session item
6. Build PlanItem array with priorities
7. Insert into `daily_plans.items` JSONB

**Pros**:
- Complete feature
- Follows product spec
- Supports all plan sources

**Cons**:
- Requires multiple queries
- Complex priority logic
- Needs transaction handling

---

### OPTION B: Simplified Generation (Quick Fix)
**Effort**: 2-3 hours  
**Risk**: LOW - Limited scope

**Steps**:
1. Query only active quests (top 3)
2. Add default focus session
3. Return simple 4-item plan
4. Skip habits/workouts/learning for now

**Pros**:
- Quick to implement
- Low risk
- Core value delivered (quests + focus)

**Cons**:
- Incomplete feature
- Missing habits/workouts
- Not full product vision

---

### OPTION C: Manual Plan Entry Only
**Effort**: 0 hours  
**Risk**: NONE - Feature disabled

**Steps**:
1. Remove "Generate" button from UI
2. Force users to manually add items
3. Document as "manual planning mode"

**Pros**:
- No backend work
- No risk of bugs

**Cons**:
- Poor UX
- Defeats purpose of feature
- Users expect generation

---

## 👤 YOUR SELECTION - Plan My Day

**Preferred Option**: _________  
**Reason**: _________  
**Acceptable Alternatives**: _________

---

## ISSUE 3: Focus State Not Persisted Across Frontend/Backend (MEDIUM)

### Current State
**Location**: Sync endpoint returns focus status, but frontend doesn't persist  
**Status**: WORKING BUT INCOMPLETE - Data flows but not cached

### Evidence
Backend (`sync.rs`):
```rust
async fn fetch_focus_status(pool: &PgPool, user_id: Uuid) -> Result<FocusStatusData, AppError> {
    // Queries focus_sessions table
    // Returns: has_active_session, mode, time_remaining, expires_at
}
```

Frontend (`SyncStateContext.tsx`):
- **ISSUE**: Focus data comes in sync response but isn't stored in context
- No `focus` field in sync state
- Components query `/api/focus` directly instead of using sync cache

### Root Cause
**TYPE**: Incomplete Integration

Sync response includes focus data, but:
1. Frontend sync context doesn't have focus state field
2. Focus components bypass sync state (make direct API calls)
3. No memory persistence for focus session across page reloads
4. Duplicate queries (sync + component-level)

### Impact
- **SEVERITY**: MEDIUM - Feature works but inefficient
- **SCOPE**: Focus timer users
- **USER EXPERIENCE**: Extra API calls, potential flicker on reload
- **BUSINESS IMPACT**: Minor - increased server load

---

## 🔧 SOLUTION OPTIONS - Focus Persistence

### OPTION A: Add to Sync State (Recommended)
**Effort**: 2 hours  
**Risk**: LOW - Additive change

**Steps**:
1. Add `focus: FocusStatusData | null` to SyncStateContext
2. Update `fetchPollData()` to set focus state
3. Update FocusIndicator to use `useSyncState()` instead of direct fetch
4. Update focus timer page to check sync state first

**Pros**:
- Single source of truth
- Reduces API calls
- Consistent with other sync data (badges, plan, user)

**Cons**:
- Need to update multiple components
- Sync interval (30s) might be too slow for timer

---

### OPTION B: Keep Separate + Add LocalStorage
**Effort**: 1 hour  
**Risk**: LOW - Simple addition

**Steps**:
1. Add localStorage cache for focus session
2. Components check localStorage first
3. Fall back to API if stale
4. Update on focus start/end/pause

**Pros**:
- Quick fix
- Real-time updates
- No sync dependency

**Cons**:
- Duplicates data (sync + localStorage)
- Manual cache invalidation
- Not aligned with memory-only architecture

---

### OPTION C: Increase Sync Frequency for Focus
**Effort**: 30 minutes  
**Risk**: MEDIUM - Performance impact

**Steps**:
1. When focus session active, reduce sync interval from 30s to 5s
2. Reset to 30s when session ends
3. Use conditional polling logic

**Pros**:
- Stays in sync state
- Real-time enough for timer
- No localStorage

**Cons**:
- Increased server load during focus
- Complex polling logic
- May affect other sync data freshness

---

## 👤 YOUR SELECTION - Focus Persistence

**Preferred Option**: _________  
**Reason**: _________  
**Acceptable Alternatives**: _________

---

## ISSUE 4: Create Focus Library Broken (HIGH)

### Current State
**Location**: Focus library creation flow  
**Status**: BACKEND WORKING, FRONTEND STORAGE ISSUES

### Evidence
Backend API works:
```typescript
// POST /api/focus/libraries
export async function createFocusLibrary(
  name: string,
  description?: string,
  libraryType: string = 'custom'
): Promise<FocusLibrary>
```

Frontend issue (from FocusTracks.tsx line 95):
```tsx
// DEPRECATED: localStorage-based library creation (2026-01-10)
// This should use backend API: POST /api/focus/libraries
// TODO: Implement track storage in focus libraries
setFocusLibrary(null); // Placeholder until backend track support
```

### Root Cause
**TYPE**: Migration Incomplete + Storage Gap

1. **Backend**: focus_libraries table exists, CRUD works
2. **Backend**: focus_library_tracks table exists but no track file storage
3. **Frontend**: Audio files stored in IndexedDB (client-side)
4. **Gap**: No R2 storage integration for tracks

Architecture mismatch:
- Reference library: Stores audio blobs in IndexedDB (client-side only)
- Focus library: Expects backend storage (R2) but only has metadata tables

### Impact
- **SEVERITY**: HIGH - Feature appears broken
- **SCOPE**: Users trying to add focus music
- **USER EXPERIENCE**: Can create library but can't add tracks
- **BUSINESS IMPACT**: Focus feature incomplete

---

## 🔧 SOLUTION OPTIONS - Create Focus Library

### OPTION A: Add R2 Track Upload (Recommended)
**Effort**: 6-8 hours  
**Risk**: MEDIUM - New R2 integration

**Steps**:
1. Create presigned URL endpoint for R2 uploads
2. Upload audio file to R2 from frontend
3. Store R2 key in `focus_library_tracks.track_url`
4. Add track download/streaming endpoint
5. Update frontend to use R2 URLs instead of IndexedDB

**Pros**:
- Proper backend storage
- Tracks sync across devices
- Scalable solution
- Aligns with architecture

**Cons**:
- Significant implementation time
- R2 costs for storage
- Need streaming infrastructure

---

### OPTION B: Use Reference Library Paradigm
**Effort**: 2 hours  
**Risk**: LOW - Reuse existing code

**Steps**:
1. Keep audio files in IndexedDB (client-side)
2. Store only metadata in backend (library name, track titles)
3. Frontend manages audio blobs like ReferenceLibrary
4. Sync metadata via backend, blobs stay local

**Pros**:
- Quick implementation
- Reuses reference library code
- No R2 costs
- Offline-capable

**Cons**:
- Tracks don't sync across devices
- Duplicates storage approach
- Not scalable long-term

---

### OPTION C: YouTube/External Links Only
**Effort**: 1 hour  
**Risk**: LOW - Minimal change

**Steps**:
1. Don't upload audio files
2. Store only YouTube URLs or external links
3. Use iframe/embed for playback
4. Backend stores URLs only

**Pros**:
- Simplest solution
- No storage costs
- Large music library access

**Cons**:
- Requires internet
- YouTube ToS issues
- No offline support
- Limited control

---

## 👤 YOUR SELECTION - Create Focus Library

**Preferred Option**: _________  
**Reason**: _________  
**Acceptable Alternatives**: _________

---

## ISSUE 5: Session Termination on Invalid Sync (CRITICAL - SECURITY)

### Current State
**Location**: Auth session validation  
**Status**: PARTIAL - Backend validates, frontend doesn't clear on 401

### Evidence
Backend auth middleware (`auth.rs`):
- Returns 401 when session invalid
- Doesn't send invalidation signal

Frontend (`AuthProvider.tsx`):
- Has `signOut()` function
- Uses cookies for auth
- No automatic wipeout on 401

### Root Cause
**TYPE**: Missing Security Feature

When backend session expires or is deleted:
1. Sync endpoint returns 401
2. Frontend catches error but doesn't react
3. User sees error state but session persists in memory
4. Stale data remains in sync state context
5. No localStorage/IndexedDB cleanup

**Security Risk**: Deleted backend session leaves frontend data exposed

### Impact
- **SEVERITY**: CRITICAL - Data leakage risk
- **SCOPE**: All users with expired sessions
- **USER EXPERIENCE**: Confusing error states
- **SECURITY IMPACT**: Stale data accessible after logout/session revoke

---

## 🔧 SOLUTION OPTIONS - Session Termination

### OPTION A: Centralized 401 Handler (Recommended)
**Effort**: 3-4 hours  
**Risk**: LOW - Standard pattern

**Steps**:
1. Create global `apiClient` wrapper with interceptor
2. Check all responses for 401
3. On 401:
   - Call `clearAllClientData()` function
   - Clear sync state context
   - Clear localStorage (if any session data)
   - Clear IndexedDB (optional - audio is device-specific)
   - Call `signOut()` to clear cookies
   - Redirect to login with `?session_expired=true`
4. Add toast: "Your session has expired"

**Pros**:
- Centralized logic (one place)
- Catches all 401s automatically
- Clean separation of concerns
- Standard security pattern

**Cons**:
- Need to wrap all API calls
- Risk of breaking existing fetch calls

---

### OPTION B: Per-Hook Validation
**Effort**: 6-8 hours  
**Risk**: HIGH - Easy to miss hooks

**Steps**:
1. Update each API hook (useSync, useAuth, etc.)
2. Add 401 check in each error handler
3. Call cleanup + redirect
4. Duplicate logic across hooks

**Pros**:
- Granular control
- No global interceptor

**Cons**:
- Repetitive code
- Easy to forget hooks
- Maintenance nightmare
- Inconsistent behavior

---

### OPTION C: Sync Endpoint Only
**Effort**: 1 hour  
**Risk**: MEDIUM - Incomplete coverage

**Steps**:
1. Add 401 handler only in `SyncStateContext`
2. Since sync polls every 30s, catches expired sessions eventually
3. Cleanup + redirect on sync 401

**Pros**:
- Quick fix
- Covers most cases (sync is frequent)

**Cons**:
- Doesn't catch 401 from other endpoints
- 30s delay before cleanup
- Incomplete solution

---

## 👤 YOUR SELECTION - Session Termination

**Preferred Option**: _________  
**Reason**: _________  
**Acceptable Alternatives**: _________

---

## IMPLEMENTATION PRIORITY MATRIX

| Issue | Severity | User Impact | Effort | Recommended Priority |
|-------|----------|-------------|--------|---------------------|
| Session Termination | CRITICAL | HIGH | 3-4h | **P0** (Security) |
| Plan My Day | CRITICAL | HIGH | 4-6h | **P1** (Core Feature) |
| Onboarding | HIGH | MEDIUM | 2-3h | **P2** (First-run UX) |
| Focus Library | HIGH | MEDIUM | 6-8h | **P3** (Enhancement) |
| Focus Persistence | MEDIUM | LOW | 2h | **P4** (Optimization) |

---

## EXECUTION ORDER (Recommended)

**Phase 1: Security + Critical Bugs** (1 day)
1. Session Termination (P0) - OPTION A
2. Plan My Day (P1) - OPTION A or B

**Phase 2: UX Improvements** (1 day)
3. Onboarding (P2) - OPTION A or B
4. Focus Persistence (P4) - OPTION A

**Phase 3: Enhancements** (2 days)
5. Focus Library (P3) - OPTION A or B

---

## 📋 FINAL SELECTION SUMMARY

**YOUR SELECTIONS**:

1. **Onboarding**: Option _____ (Reason: _______)
2. **Plan My Day**: Option _____ (Reason: _______)
3. **Focus Persistence**: Option _____ (Reason: _______)
4. **Focus Library**: Option _____ (Reason: _______)
5. **Session Termination**: Option _____ (Reason: _______)

**Execution Order**: _____________________

**Timeline**: _____________________

**Blockers**: _____________________

---

## NOTES

- All options include lint/test requirements per copilot-instructions.md
- Schema.json v2.0.0 remains authoritative for all data models
- Backend compilation must pass before frontend changes
- Frontend lint must pass before commit
- Git commit message must include detailed changelog
