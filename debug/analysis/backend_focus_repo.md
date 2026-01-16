# Analysis #6: Backend Focus Repository (`focus_repos.rs`)

**File**: `app/backend/crates/api/src/db/focus_repos.rs`  
**Size**: 692 lines  
**Repository Classes**: 3 (FocusSessionRepo, FocusPauseRepo, FocusLibraryRepo)  
**Total Methods**: 21  
**Status**: ANALYZED - COMPLEX STATE MANAGEMENT & DESIGN DEBT  
**Date**: 2026-01-15

---

## EXECUTIVE SUMMARY

This file implements complex focus/Pomodoro session management with pause state and music library features. It exhibits significant design and architectural issues:

1. **State Machine Complexity** (5+ status values, unclear transitions)
2. **Distributed State Management** (Session + PauseState tables, manual sync)
3. **Missing Pause Duration Calculation** (Time remaining estimate inaccurate)
4. **Hard Delete Anti-pattern** (Cascade deletes without audit trail)
5. **Repetitive Query Patterns** (9+ similar SELECT queries)
6. **Incomplete Library Implementation** (r2_key field abandoned mid-development)

**Estimated Cleanup Effort**: ~9.5 hours

**Key Issue**: Pause/Resume logic relies on manual time calculation that can drift over multiple pause cycles.

---

## SECTION 1: COMMON OPERATIONS TO EXTRACT

### OP-1: Repeated Full Column SELECT (9 instances)

**Locations** (all return FocusSession):
- Line 48: `start_session()` - explicit columns
- Line 68: `get_session()` - explicit columns
- Line 90: `get_active_session()` - explicit columns
- Line 145: `complete_session()` - explicit columns
- Line 196: `abandon_session()` - explicit columns
- Line 405: `resume_session()` - explicit columns

**Current Pattern**:
```rust
let session = sqlx::query_as::<_, FocusSession>(
    r#"SELECT id, user_id, mode, duration_seconds, started_at, completed_at,
              abandoned_at, expires_at, paused_at, paused_remaining_seconds,
              status, xp_awarded, coins_awarded, task_id, task_title, created_at
       FROM focus_sessions WHERE ..."#,
)
.bind(...)
.fetch_...
.await?;
```

**Issues**:
1. Identical column list repeated 6+ times
2. Error-prone (easy to miss a column)
3. No documentation of why these specific columns

**Extractable Constant**:
```rust
const FOCUS_SESSION_COLUMNS: &str = r#"id, user_id, mode, duration_seconds, started_at, 
    completed_at, abandoned_at, expires_at, paused_at, paused_remaining_seconds,
    status, xp_awarded, coins_awarded, task_id, task_title, created_at"#;

// Then use in queries:
let session = sqlx::query_as::<_, FocusSession>(
    &format!(
        "SELECT {} FROM focus_sessions WHERE id = $1 AND user_id = $2",
        FOCUS_SESSION_COLUMNS
    )
)
```

**Or Better**: Use `SELECT *` if all columns are needed:
```rust
let session = sqlx::query_as::<_, FocusSession>(
    "SELECT * FROM focus_sessions WHERE id = $1 AND user_id = $2"
)
```

---

### OP-2: Pause State Cleanup (Repeated 3 times)

**Locations**:
- Line 43: `start_session()` - DELETE pause_state
- Line 158: `complete_session()` - DELETE pause_state
- Line 225: `abandon_session()` - DELETE pause_state

**Current Pattern**:
```rust
sqlx::query("DELETE FROM focus_pause_state WHERE user_id = $1")
    .bind(user_id)
    .execute(pool)
    .await?;
```

**Extractable**:
```rust
impl FocusSessionRepo {
    async fn clear_pause_state_for_user(pool: &PgPool, user_id: Uuid) -> Result<(), AppError> {
        sqlx::query("DELETE FROM focus_pause_state WHERE user_id = $1")
            .bind(user_id)
            .execute(pool)
            .await?;
        Ok(())
    }

    // Usage:
    pub async fn start_session(...) -> Result<FocusSession, AppError> {
        Self::clear_pause_state_for_user(pool, user_id).await?;
        // ...
    }
}
```

---

### OP-3: Reward Calculation by Mode (Lines 124-132)

**Current Pattern**:
```rust
let (xp, coins) = match session.mode.as_str() {
    "focus" => {
        let xp = std::cmp::max(5, session.duration_seconds / 60);
        let coins = std::cmp::max(2, session.duration_seconds / 300);
        (xp, coins)
    }
    "break" => (2, 0),
    "long_break" => (3, 1),
    _ => (0, 0),
};
```

**Issues**:
1. Magic numbers (5, 2, 300, etc.) without explanation
2. Formula embedded in match arm, hard to test
3. Appears only once (good!) but XP formula could overflow

**Extractable**:
```rust
/// Calculate XP and coins for completing a focus session
fn calculate_session_rewards(mode: &str, duration_seconds: i32) -> (i32, i32) {
    match mode {
        "focus" => {
            // XP: 5 base + 1 per minute (at least 5)
            let xp = std::cmp::max(5, duration_seconds / 60);
            // Coins: 1 per 5 minutes (at least 2)
            let coins = std::cmp::max(2, duration_seconds / 300);
            (xp, coins)
        }
        "break" => (2, 0),       // Short break: 2 XP, no coins
        "long_break" => (3, 1),  // Long break: 3 XP, 1 coin
        _ => (0, 0),              // Unknown mode: no reward
    }
}

// Then call:
let (xp, coins) = Self::calculate_session_rewards(&session.mode, session.duration_seconds);
```

**Better Yet**: Move to database or config if rewards change frequently.

---

### OP-4: Time Remaining Calculation (Lines 366-370)

**Current Pattern**:
```rust
let time_remaining = session
    .expires_at
    .map(|exp| (exp - Utc::now()).num_seconds().max(0) as i32)
    .unwrap_or(session.duration_seconds);
```

**Issues**:
1. Appears in pause_session logic
2. Could be used in other places (e.g., client-side countdown)
3. Time drift on multiple pause/resume cycles

**Extractable**:
```rust
/// Calculate remaining time for a focus session
fn time_remaining_seconds(expires_at: Option<chrono::DateTime<Utc>>, 
                         duration_seconds: i32) -> i32 {
    expires_at
        .map(|exp| ((exp - Utc::now()).num_seconds() as i32).max(0))
        .unwrap_or(duration_seconds)
}

// Usage:
let time_remaining = Self::time_remaining_seconds(session.expires_at, session.duration_seconds);
```

---

### OP-5: Focus Library Track Casting (Lines 671, 685)

**Current Pattern** (appears 2+ times):
```rust
let tracks = sqlx::query_as::<_, FocusLibraryTrack>(
    r#"SELECT t.id, t.library_id, t.track_id, t.track_title, t.track_url, 
              CAST(NULL AS TEXT) as r2_key, t.duration_seconds, t.added_at
       FROM focus_library_tracks t
       JOIN focus_libraries l ON t.library_id = l.id
       WHERE ...
```

**Issue**: `CAST(NULL AS TEXT) as r2_key` indicates incomplete implementation

**Problem**: r2_key field exists in model but is abandoned in implementation
- Line 607: `_r2_key: Option<&str>` (unused parameter)
- Line 671: `CAST(NULL AS TEXT)` (always null)
- Indicates mid-development abandonment

**Decision Needed**: Either:
1. Remove r2_key field entirely (if not used)
2. Implement R2 file upload support properly
3. Document why it's unused

---

## SECTION 2: CODE CLEANUP OPPORTUNITIES

### CLEANUP-1: Status String Hardcoding (8+ instances)

**Locations**:
- Line 33: `'abandoned'` in update
- Line 54: `'active'` in insert
- Line 104: `'active', 'paused'` in where clause
- Line 112: `"active"` in validation
- Line 145: `'completed'` in update
- Line 196: `'abandoned'` in update
- Line 210: `"active"` in validation

**Issues**:
1. No type safety
2. Easy to typo
3. Hard to find all status values
4. Invalid transitions not prevented

**Solution**: Create enum:
```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "focus_session_status", rename_all = "lowercase")]
pub enum FocusSessionStatus {
    Active,
    Paused,
    Completed,
    Abandoned,
}

impl std::fmt::Display for FocusSessionStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            Self::Active => write!(f, "active"),
            Self::Paused => write!(f, "paused"),
            Self::Completed => write!(f, "completed"),
            Self::Abandoned => write!(f, "abandoned"),
        }
    }
}
```

---

### CLEANUP-2: Unclear Duration Calculation (Lines 366-370, 403-405)

**Current Issue**: `paused_remaining_seconds` field name misleading

**Current Code**:
```rust
let time_remaining = session
    .expires_at
    .map(|exp| (exp - Utc::now()).num_seconds().max(0) as i32)
    .unwrap_or(session.duration_seconds);

// Later, stored as:
sqlx::query(
    r#"UPDATE focus_sessions
       SET status = 'paused', paused_at = NOW(), paused_remaining_seconds = $1
```

**Problem**: Multiple sources of truth for remaining time:
- `expires_at` - absolute expiry timestamp
- `paused_remaining_seconds` - cached value at pause time
- `duration_seconds` - original duration
- Fallback: `unwrap_or(session.duration_seconds)` - wrong!

**Better Design**:
```rust
// Store only essential state:
pub struct FocusSession {
    pub id: Uuid,
    pub user_id: Uuid,
    pub duration_seconds: i32,     // Original duration requested
    pub started_at: DateTime<Utc>,  // When session started
    pub expires_at: DateTime<Utc>,  // When session expires (absolute, includes pauses!)
    pub status: String,             // active, paused, completed, abandoned
    // Remove: paused_remaining_seconds (calculated on the fly)
}

// Calculate remaining on-demand:
fn time_remaining(session: &FocusSession) -> i32 {
    ((session.expires_at - Utc::now()).num_seconds() as i32).max(0)
}

// When pausing: extend expiry by NOT resetting it
// Current logic is broken: resume sets new expires_at, losing prior elapsed time on multiple pauses
```

---

### CLEANUP-3: Unvalidated Query with SELECT * (Line 555)

**Current Issue** (high risk):
```rust
let library = sqlx::query_as::<_, FocusLibrary>(
    "SELECT * FROM focus_libraries WHERE id = $1 AND user_id = $2",
)
```

**Problems**:
1. No compile-time verification of columns
2. If schema changes, silently breaks
3. No documentation of which columns are needed

**Better**:
```rust
const LIBRARY_COLUMNS: &str = 
    "id, user_id, name, description, library_type, is_favorite, tracks_count, created_at, updated_at";

let library = sqlx::query_as::<_, FocusLibrary>(
    &format!("SELECT {} FROM focus_libraries WHERE id = $1 AND user_id = $2", LIBRARY_COLUMNS)
)
```

---

### CLEANUP-4: Unvalidated Duration in add_track (Line 603)

**Current**:
```rust
pub async fn add_track(
    pool: &PgPool,
    user_id: Uuid,
    library_id: Uuid,
    track_title: &str,
    track_url: Option<&str>,
    _r2_key: Option<&str>,     // ← Unused!
    duration_seconds: Option<i32>,
) -> Result<FocusLibraryTrack, AppError> {
```

**Issues**:
1. `track_title` not validated (could be empty)
2. `track_url` not validated (could be malformed)
3. `duration_seconds` not validated (could be negative)
4. `_r2_key` parameter prefixed with `_`, indicating unused

**Better**:
```rust
pub async fn add_track(
    pool: &PgPool,
    user_id: Uuid,
    library_id: Uuid,
    req: &AddTrackRequest,  // Move to request struct
) -> Result<FocusLibraryTrack, AppError> {
    // Validate input
    if req.track_title.trim().is_empty() {
        return Err(AppError::BadRequest("Track title cannot be empty".into()));
    }
    
    if let Some(duration) = req.duration_seconds {
        if duration <= 0 {
            return Err(AppError::BadRequest("Duration must be positive".into()));
        }
    }
    
    // Process...
}
```

---

### CLEANUP-5: Cascade Delete Without Audit (Lines 636-649)

**Current**:
```rust
pub async fn delete(
    pool: &PgPool,
    user_id: Uuid,
    library_id: Uuid,
) -> Result<(), AppError> {
    // First delete all tracks
    sqlx::query("DELETE FROM focus_library_tracks WHERE library_id = $1")
        .bind(library_id)
        .execute(pool)
        .await?;

    // Then delete library
    let result = sqlx::query(
        "DELETE FROM focus_libraries WHERE id = $1 AND user_id = $2",
    )
    .bind(library_id)
    .bind(user_id)
    .execute(pool)
    .await?;
```

**Problems**:
1. Hard delete with no recovery
2. No audit trail of deletion
3. No notification to user
4. Could lose data if user accidentally deletes

**Better**: Soft delete:
```rust
pub async fn delete(
    pool: &PgPool,
    user_id: Uuid,
    library_id: Uuid,
) -> Result<(), AppError> {
    // Soft delete: mark as inactive
    let result = sqlx::query(
        r#"UPDATE focus_libraries 
           SET is_active = false, updated_at = NOW()
           WHERE id = $1 AND user_id = $2"#,
    )
    .bind(library_id)
    .bind(user_id)
    .execute(pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Library not found".into()));
    }

    // Audit log
    sqlx::query(
        r#"INSERT INTO audit_log (user_id, entity_type, entity_id, action, created_at)
           VALUES ($1, 'focus_library', $2, 'delete', NOW())"#,
    )
    .bind(user_id)
    .bind(library_id)
    .execute(pool)
    .await?;

    Ok(())
}
```

---

### CLEANUP-6: Inconsistent Error Messages

**Issue**: Error context varies:
- Line 114: `"Session cannot be completed (status: {})"`
- Line 218: `"Session cannot be abandoned (status: {})"`
- Line 554: `"Library not found".into()`
- Line 647: `"Library not found".into()`
- Line 651: `"Track not found".into()`

**Better**: Standardize with helper:
```rust
fn invalid_status_error(action: &str, current: &str) -> AppError {
    AppError::BadRequest(format!(
        "Cannot {} focus session (status: {})",
        action, current
    ))
}

fn not_found_error(entity: &str) -> AppError {
    AppError::NotFound(format!("{} not found", entity))
}
```

---

## SECTION 3: MISSING DOCUMENTATION

### DOC-1: State Machine Diagram (All methods)

**Missing**: Visual documentation of valid status transitions

```rust
/// # Focus Session Status Lifecycle
///
/// ```text
/// ┌─────────┐
/// │ active  │ (running, user focused)
/// └────┬────┘
///      │
///      ├─→ paused (user paused, time frozen)
///      │      │
///      │      └─→ active (user resumed)
///      │
///      ├─→ completed (user finished, XP awarded)
///      │
///      └─→ abandoned (user quit early, no XP)
///
/// Valid transitions:
/// - active → paused: via pause_session()
/// - active → completed: via complete_session()
/// - active → abandoned: via abandon_session()
/// - paused → active: via resume_session()
/// - paused → abandoned: via abandon_session()
///
/// Invalid transitions:
/// - completed → anything (terminal)
/// - abandoned → anything (terminal)
/// - paused → completed (must resume first)
/// ```
```

---

### DOC-2: All Public Methods (21 methods, missing docs)

**Example**:
```rust
/// Pause an active focus session
///
/// # Behavior
/// - Freezes elapsed time at `paused_remaining_seconds`
/// - Creates/updates FocusPauseState record
/// - Session can be resumed later with remaining time
/// - Multiple pause/resume cycles supported
///
/// # Time Tracking
/// - On pause: remaining time = `expires_at - now()`
/// - On resume: expiry extended by `paused_remaining_seconds`
/// - WARNING: Multiple pause cycles can accumulate drift
///
/// # Side Effects
/// - Updates focus_sessions.status = 'paused'
/// - Creates or updates focus_pause_state record
/// - Sets paused_at timestamp
///
/// # Example
/// ```
/// let pause = FocusPauseRepo::pause_session(pool, user_id).await?;
/// assert_eq!(pause.is_paused, true);
/// ```
pub async fn pause_session(pool: &PgPool, user_id: Uuid) -> Result<FocusPauseState, AppError> {
    // ...
}
```

---

### DOC-3: Pause/Resume Time Drift Warning

**Critical**: Document known issue with pause/resume logic

```rust
/// # Known Issues - Time Drift in Pause/Resume
///
/// Current implementation has potential time drift issue:
///
/// **Scenario**: User pauses, resumes, pauses again
///
/// **What Happens**:
/// 1. Start session: expires_at = now + 25 min = 10:25
/// 2. Pause at 10:05 (20 min remaining)
/// 3. Resume: new expires_at = now + 20 min = 10:35 ✓ Correct
/// 4. User does work, pauses again at 10:30 (5 min remaining)
/// 5. Resume: new expires_at = now + paused_remaining_seconds (WRONG!)
///
/// **Root Cause**: `paused_remaining_seconds` is stale by 5 minutes
/// **Impact**: Session expires sooner than expected on multiple pause cycles
///
/// **Solution**: Store absolute `expires_at` only, calculate remaining on-demand
/// **Effort**: ~3 hours refactoring
```

---

## SECTION 4: DEPRECATION CANDIDATES

### DEP-1: FocusPauseRepo (Separate table)

**Issue**: Pause state duplicates information in FocusSession

**Current Design**:
```
focus_sessions table:
- id, user_id, session_id, mode, status, paused_at, paused_remaining_seconds, ...

focus_pause_state table:
- id, user_id, session_id, mode, is_paused, time_remaining_seconds, paused_at, ...
```

**Better Design**: Single table with denormalized state:
```sql
CREATE TABLE focus_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    status ENUM ('active', 'paused', 'completed', 'abandoned'),
    started_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,  -- Absolute expiry (includes pauses)
    paused_at TIMESTAMP,             -- When paused, NULL if active
    -- Remove: paused_remaining_seconds (calculate on-demand)
);
```

**Benefits**:
- Single source of truth
- No manual sync needed
- Simpler code (remove FocusPauseRepo entirely)
- No time drift issue

---

### DEP-2: r2_key Field (Lines 607, 612, 671, 685)

**Issue**: Parameter and field exist but are never used

**Current**:
```rust
pub async fn add_track(
    pool: &PgPool,
    user_id: Uuid,
    library_id: Uuid,
    track_title: &str,
    track_url: Option<&str>,
    _r2_key: Option<&str>,  // ← Unused, prefixed with _
    duration_seconds: Option<i32>,
) -> Result<FocusLibraryTrack, AppError> {
```

**Decision**:
1. If R2 uploads not needed: Remove parameter and r2_key field
2. If R2 uploads needed: Implement properly (add logic, tests, docs)

**Recommendation**: Remove (not used anywhere, incomplete feature)

---

## SECTION 5: LINT ERRORS & WARNINGS

### LINT-1: Unused Parameter (Line 607)

**Issue**: `_r2_key` prefixed with underscore, indicating intentionally unused

```rust
_r2_key: Option<&str>,
```

**Fix**: Remove parameter entirely

---

### LINT-2: CAST(NULL AS TEXT) Anti-pattern (Lines 671, 685)

**Issue**: Casting NULL for compatibility is a code smell

```rust
CAST(NULL AS TEXT) as r2_key,
```

**Indicates**: Incomplete implementation or schema mismatch

**Fix**: Either implement r2_key or remove field

---

### LINT-3: Magic Constants Without Documentation

**Locations**:
- Line 127: `5` (minimum XP for focus)
- Line 128: `60` (seconds per minute, XP calculation)
- Line 129: `2` (minimum coins for focus)
- Line 130: `300` (seconds per 5 minutes, coins calculation)
- Line 131: `2` (break XP)
- Line 132: `3` (long break XP)
- Line 133: `1` (long break coins)
- Line 37: `Duration::seconds((req.duration_seconds * 2) as i64)` (2x buffer)

**Better**: Extract to constants with docs:
```rust
/// Reward calculation constants
const FOCUS_XP_MIN: i32 = 5;                    // Minimum XP for focus session
const FOCUS_XP_PER_MINUTE: i32 = 1;             // 1 XP per minute focused
const FOCUS_COINS_MIN: i32 = 2;                 // Minimum coins for focus
const FOCUS_COINS_PER_MINUTES_5: i32 = 1;       // 1 coin per 5 minutes (300 seconds)
const BREAK_XP: i32 = 2;                        // XP for short break
const LONG_BREAK_XP: i32 = 3;                   // XP for long break
const LONG_BREAK_COINS: i32 = 1;                // Coins for long break
const SESSION_EXPIRY_BUFFER: i32 = 2;           // 2x duration as safety buffer
```

---

### LINT-4: Inconsistent Return Types

**Issue**:
- `list()` returns `FocusSessionsListResponse` (with pagination)
- `list_tracks()` returns `Vec<FocusLibraryTrack>` (no pagination)

**Better**: Standardize:
```rust
// Option A: Both return responses with pagination
pub async fn list_tracks(
    pool: &PgPool,
    user_id: Uuid,
    library_id: Uuid,
    page: i64,
    page_size: i64,
) -> Result<FocusTracksListResponse, AppError> {
    // ...
}

// Option B: Both return vecs if small result sets
pub async fn list_sessions(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<FocusSessionResponse>, AppError> {
    // ...
}
```

---

### LINT-5: Time Calculation Inconsistency

**Issue**: Two ways to handle optional expires_at:
- Line 371: `unwrap_or(session.duration_seconds)` - fallback to original duration (WRONG!)
- Line 403: Map before unwrap (Correct)

**Better**: Consistent approach:
```rust
fn time_remaining_seconds(expires_at: DateTime<Utc>) -> i32 {
    ((expires_at - Utc::now()).num_seconds() as i32).max(0)
}

// Always ensure expires_at is set:
assert!(session.expires_at.is_some(), "Session expiry must be set");
```

---

### LINT-6: Multiple N+1 Queries

**Issue**: List operations fetch data then count separately
- Line 341-355: `list_sessions()` fetches sessions + separate COUNT query
- Line 457-481: `list()` fetches libraries + separate COUNT query

**Better**: Single query with window function:
```rust
pub async fn list_sessions(
    pool: &PgPool,
    user_id: Uuid,
    page: i64,
    page_size: i64,
) -> Result<FocusSessionsListResponse, AppError> {
    let offset = (page - 1) * page_size;

    let (sessions, total): (Vec<FocusSession>, i64) = sqlx::query_as(
        r#"SELECT 
             f.*,
             COUNT(*) OVER() as total
           FROM focus_sessions f
           WHERE f.user_id = $1
           ORDER BY f.started_at DESC
           LIMIT $2 OFFSET $3"#,
    )
    .bind(user_id)
    .bind(page_size)
    .bind(offset)
    .fetch_all(pool)
    .await?
    .into_iter()
    .fold((Vec::new(), 0), |(mut sessions, _), row| {
        // Parse row
    });

    Ok(FocusSessionsListResponse { sessions, total, page, page_size })
}
```

---

## SUMMARY TABLE

| Category | Count | Examples | Impact |
|---|---|---|---|
| **Common Operations** | 5 | Column lists, state cleanup, rewards, time calc | MEDIUM (3-4 hours) |
| **Code Cleanup** | 6 | Magic strings, unclear durations, hard deletes | HIGH (4-5 hours) |
| **Documentation** | 3 | State machine, all methods, time drift warning | MEDIUM (2-3 hours) |
| **Deprecations** | 2 | PauseRepo table duplication, r2_key field | MEDIUM (2-3 hours) |
| **Lint Issues** | 6 | Unused params, magic numbers, N+1 queries | MEDIUM (2-3 hours) |
| **TOTAL** | **22 ISSUES** | **Across 692 lines** | **9.5 hours effort** |

---

## KEY FINDINGS

### 🔴 CRITICAL
1. **Time Drift in Pause/Resume** (Line 403-405): Multiple pause cycles cause expiry to shift unpredictably
2. **Distributed State Management**: Session + PauseState tables cause sync issues
3. **SELECT \* with No Validation**: High risk for schema changes breaking code silently

### 🟡 HIGH
4. **Status String Hardcoding** (8 instances): No type safety, easy to typo
5. **Incomplete r2_key Feature** (4 locations): Unused parameter, NULL casts indicate abandonment
6. **N+1 Queries** (Lines 341-355, 457-481): Separate COUNT queries instead of window functions
7. **No Input Validation** (track_title, duration_seconds)

### 🟢 MEDIUM
8. **Missing All Documentation** (21 methods): State machine diagram needed
9. **Cascade Deletes Without Audit**: Focus library deletion is hard delete, no recovery
10. **Magic Constants**: XP and coin formulas hardcoded with no explanation

---

## IMPLEMENTATION ROADMAP

### Phase 1: Fix Pause/Resume Logic (2.5 hours)
1. Redesign to single expires_at with no time drift
2. Remove paused_remaining_seconds field
3. Calculate time_remaining on-demand
4. Add integration tests for multiple pause cycles
5. Test time accuracy over extended pauses

### Phase 2: Type Safety (1.5 hours)
1. Create FocusSessionStatus enum
2. Replace all string comparisons with enum
3. Update database with CHECK constraint
4. Update all queries to use enum binding

### Phase 3: Extract Constants (1 hour)
1. Define reward calculation constants
2. Add documentation for formulas
3. Create time calculation utility functions
4. Extract session expiry buffer constant

### Phase 4: Code Cleanup (2 hours)
1. Remove unused r2_key parameter
2. Remove r2_key field (if not implementing R2)
3. Implement input validation (track title, duration)
4. Standardize error messages
5. Add soft delete for libraries

### Phase 5: N+1 Optimization (1 hour)
1. Replace separate COUNT with window functions
2. Test performance with large datasets
3. Update pagination helpers

### Phase 6: Documentation (1.5 hours)
1. Add `///` comments to all 21 methods
2. Document state machine transitions
3. Add time drift warning
4. Add usage examples

---

## VALIDATION CHECKLIST

After implementing cleanups:

- [ ] Time drift in pause/resume fixed (unit tests)
- [ ] FocusSessionStatus enum created and used
- [ ] All 22 magic constants extracted
- [ ] All 21 methods documented
- [ ] Input validation added (title, duration, URL)
- [ ] Soft delete for libraries (with audit log)
- [ ] N+1 COUNT queries removed
- [ ] r2_key field decision made (keep or remove)
- [ ] Error messages standardized
- [ ] cargo check passes with 0 errors
- [ ] Clippy lints addressed

---

## COMPARISON WITH OTHER REPOS

| Aspect | Focus | Habits | Quests |
|---|---|---|---|
| Size | 692L | 686L | 317L |
| Complexity | High (state machine) | High (N+1) | Medium (format!) |
| Main Issue | Time drift | Monolithic | Dynamic SQL |
| Methods | 21 | 12 | 8 |
| Tables | 2 (sessions + pause) | 2+ (habits + completions) | 1 (user_quests) |

---

## ARCHITECTURAL RECOMMENDATION

**Current**:
```
focus_sessions (main)
focus_pause_state (redundant)
focus_libraries
focus_library_tracks
```

**Recommended**:
```
focus_sessions (with status, expires_at, paused_at)
focus_libraries (with is_active for soft deletes)
focus_library_tracks
// Remove: focus_pause_state table entirely
```

**Rationale**: Consolidate pause state into main session table. Calculate remaining time on-demand.

---

## EFFORT ESTIMATION

**Per-task breakdown**:
- Fix pause/resume logic: 150 minutes (complex temporal logic)
- Type safety enum: 90 minutes
- Extract constants: 60 minutes
- Code cleanup: 120 minutes
- N+1 optimization: 60 minutes
- Documentation: 90 minutes
- Testing: 60 minutes

**Total: ~9.5 hours** (includes comprehensive testing)

**Optional Enhancements** (not included):
- Implement R2 file upload: +120 minutes
- Add session analytics (heatmaps): +180 minutes
- Add focus streak tracking: +90 minutes

