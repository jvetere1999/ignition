# backend_sync_polls Code Cleanup Analysis

**Analyzed**: 2026-01-15 12:15 UTC  
**Component**: `app/backend/crates/api/src/routes/sync.rs` (542 lines)  
**Status**: COMPLETE  
**Lines Analyzed**: 542  
**Findings**: 12 issues identified  

---

## 1. COMMON OPERATIONS TO EXTRACT

### Operation: Badge Count Query Pattern
- **Location**: Lines 406-457
- **Current Pattern**: Four identical functions with nearly identical structure:
  ```rust
  async fn fetch_unread_inbox_count(pool: &PgPool, user_id: Uuid) -> Result<i32, AppError> {
      let count = sqlx::query_scalar::<_, i64>(
          "SELECT COUNT(*) FROM inbox_items WHERE user_id = $1 AND is_processed = false"
      )
      .bind(user_id)
      .fetch_one(pool)
      .await
      .map_err(|e| AppError::Database(e.to_string()))?;
      Ok(count as i32)
  }
  ```
  Same pattern in: `fetch_active_quests_count` (411-418), `fetch_pending_habits_count` (424-444), `fetch_overdue_items_count` (446-465)

- **Extraction**: Create generic function:
  ```rust
  /// Generic count query - reduces code duplication for badge counts
  async fn fetch_count(
      pool: &PgPool,
      query: &str,
      user_id: Uuid,
  ) -> Result<i32, AppError> {
      let count = sqlx::query_scalar::<_, i64>(query)
          .bind(user_id)
          .fetch_one(pool)
          .await
          .map_err(|e| AppError::Database(e.to_string()))?;
      Ok(count as i32)
  }
  ```
  Usage:
  ```rust
  async fn fetch_active_quests_count(pool: &PgPool, user_id: Uuid) -> Result<i32, AppError> {
      fetch_count(pool, "SELECT COUNT(*) FROM user_quests WHERE user_id = $1 AND status = 'accepted'", user_id).await
  }
  ```

- **Impact**: Used in 4 places (fetch_unread_inbox_count, fetch_active_quests_count, fetch_overdue_items_count, potentially others), saves ~80 lines of code
- **Priority**: HIGH
- **Effort**: 1.5 hours (extraction + refactoring + testing)

### Operation: XP Calculation Logic
- **Location**: Lines 264-272 (fetch_progress)
- **Current Pattern**: XP level calculations done inline:
  ```rust
  let xp_for_current_level = calculate_xp_for_level(level);
  let xp_for_next_level = calculate_xp_for_level(level + 1);
  let xp_in_current_level = total_xp - xp_for_current_level;
  let xp_needed_for_level = xp_for_next_level - xp_for_current_level;
  let xp_progress_percent = if xp_needed_for_level > 0 {
      (xp_in_current_level as f32 / xp_needed_for_level as f32 * 100.0).min(100.0)
  } else {
      0.0
  };
  ```

- **Extraction**: Create function `calculate_xp_progress()`:
  ```rust
  fn calculate_xp_progress(total_xp: i32, level: i32) -> (i64, i64, f32) {
      let xp_for_current = calculate_xp_for_level(level);
      let xp_for_next = calculate_xp_for_level(level + 1);
      let xp_in_current = total_xp - xp_for_current;
      let xp_needed = xp_for_next - xp_for_current;
      let percent = if xp_needed > 0 {
          (xp_in_current as f32 / xp_needed as f32 * 100.0).min(100.0)
      } else {
          0.0
      };
      (xp_in_current as i64, (xp_needed - xp_in_current) as i64, percent)
  }
  ```

- **Impact**: Used in 1 place, but makes testing easier and makes assumptions clearer
- **Priority**: MEDIUM
- **Effort**: 1 hour (extraction + unit test)

### Operation: Count Query with Complex Joins
- **Location**: Lines 424-444 (fetch_pending_habits_count)
- **Current Pattern**: NOT EXISTS subquery is slow at scale:
  ```rust
  async fn fetch_pending_habits_count(pool: &PgPool, user_id: Uuid) -> Result<i32, AppError> {
      let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
      let count = sqlx::query_scalar::<_, i64>(
          r#"SELECT COUNT(*) FROM habits h
             WHERE h.user_id = $1 AND h.is_active = true
             AND NOT EXISTS (SELECT 1 FROM habit_completions hc 
                             WHERE hc.habit_id = h.id AND hc.completed_date = $2::date)"#
      )
      .bind(user_id)
      .bind(&today)
      .fetch_one(pool)
      .await
      .map_err(|e| AppError::Database(e.to_string()))?;
      Ok(count as i32)
  }
  ```

- **Extraction**: Create generic `fetch_count_with_date()` for date-based queries:
  ```rust
  async fn fetch_count_with_date(
      pool: &PgPool,
      query: &str,
      user_id: Uuid,
      date: &str,
  ) -> Result<i32, AppError> {
      let count = sqlx::query_scalar::<_, i64>(query)
          .bind(user_id)
          .bind(date)
          .fetch_one(pool)
          .await
          .map_err(|e| AppError::Database(e.to_string()))?;
      Ok(count as i32)
  }
  ```

- **Impact**: Used in 2 places (fetch_pending_habits_count, fetch_overdue_items_count uses different bindings but same pattern), saves ~40 lines
- **Priority**: MEDIUM
- **Effort**: 1 hour

---

## 2. CODE CLEANUP OPPORTUNITIES

### Issue: Redundant TOS Check Location
- **Location**: Lines 153-155 (poll_all function)
- **Current**:
  ```rust
  // TOS acceptance check
  if !user.tos_accepted {
      return Err(AppError::Forbidden);
  }
  ```
- **Better**: This check should be in middleware (auth.rs), not in every endpoint
- **Why**: Prevents wasteful database queries if TOS not accepted. Currently fetches all sync data (6 queries) BEFORE checking TOS.
- **Effort**: 2 hours (move to middleware + audit all endpoints)
- **Risk**: MEDIUM (need to test all TOS gate behavior)

### Issue: Date Formatting Inconsistency
- **Location**: Lines 305-306 (fetch_plan_status)
- **Current**:
  ```rust
  let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
  ```
- **Also in**: Lines 430 (fetch_pending_habits_count)
- **Better**: Create const or utility function for date format:
  ```rust
  const DATE_FORMAT: &str = "%Y-%m-%d";
  
  fn today_date_string() -> String {
      chrono::Utc::now().format(DATE_FORMAT).to_string()
  }
  ```
- **Why**: Date formatting is repeated, easier to maintain if timezone/format changes
- **Effort**: 30 minutes
- **Risk**: LOW

### Issue: Verbose Error Handling
- **Location**: Lines 252-255 (fetch_progress), and ~20 other locations
- **Current**:
  ```rust
  .await
  .map_err(|e| AppError::Database(e.to_string()))?;
  ```
- **Better**: Create a macro or trait extension:
  ```rust
  // In error.rs or separate module
  trait QueryError<T> {
      fn context(self, msg: &str) -> Result<T, AppError>;
  }
  
  impl<T> QueryError<T> for sqlx::error::Error {
      fn context(self, msg: &str) -> Result<T, AppError> {
          Err(AppError::Database(format!("{}: {}", msg, self)))
      }
  }
  ```
  Usage:
  ```rust
  .await.context("fetch_progress")?;
  ```
- **Why**: Reduces boilerplate, adds context info for debugging
- **Effort**: 3 hours (implement trait + update all callsites in sync.rs)
- **Risk**: MEDIUM (global change, need careful testing)

### Issue: Unnecessary `unwrap_or_default()` in Focus Status
- **Location**: Lines 299-300 (fetch_focus_status)
- **Current**:
  ```rust
  active_session: active_session.map(|s| serde_json::to_value(s).unwrap_or(serde_json::Value::Null)),
  pause_state: pause_state.map(|p| serde_json::to_value(p).unwrap_or(serde_json::Value::Null)),
  ```
- **Better**: 
  ```rust
  active_session: active_session.and_then(|s| serde_json::to_value(s).ok()),
  pause_state: pause_state.and_then(|p| serde_json::to_value(p).ok()),
  ```
- **Why**: `serde_json::to_value()` rarely fails for serializable types; using `and_then()` is more idiomatic and clearer intent
- **Effort**: 15 minutes
- **Risk**: LOW

### Issue: String Time Formatting in ETag Generation
- **Location**: Line 163 (poll_all)
- **Current**:
  ```rust
  let server_time = chrono::Utc::now().to_rfc3339();
  ```
- **Better**: Use ISO 8601 constant or document why RFC3339 is chosen
- **Why**: RFC3339 vs ISO8601 difference is subtle; document choice or standardize
- **Effort**: 15 minutes (add comment)
- **Risk**: LOW

### Issue: Response Builder Error Handling
- **Location**: Lines 172-176 (poll_all)
- **Current**:
  ```rust
  Ok(Response::builder()
      .status(StatusCode::OK)
      .header(header::CONTENT_TYPE, "application/json")
      .header(header::ETAG, format!("\"{}\"", etag))
      .header(header::CACHE_CONTROL, "private, max-age=10")
      .body(axum::body::Body::from(body))
      .map_err(|e| AppError::Internal(e.to_string()))?)
  ```
- **Better**: Extract response building to helper function:
  ```rust
  fn build_poll_response(body: String, etag: &str) -> Result<Response, AppError> {
      Response::builder()
          .status(StatusCode::OK)
          .header(header::CONTENT_TYPE, "application/json")
          .header(header::ETAG, format!("\"{}\"", etag))
          .header(header::CACHE_CONTROL, "private, max-age=10")
          .body(axum::body::Body::from(body))
          .map_err(|e| AppError::Internal(e.to_string()))
  }
  ```
- **Why**: Makes Response construction testable, reusable if needed elsewhere
- **Effort**: 1 hour
- **Risk**: LOW

---

## 3. MISSING COMMENTS/DOCUMENTATION

### Location 1: fetch_progress calculation logic (Lines 260-280)
- **Current**: No explanation of XP level formula
- **Needs**: Document the XP calculation formula and assumptions:
  ```rust
  /// Calculates user's progression toward next level.
  /// 
  /// Uses formula: total_xp_needed(level) = 100 * level^1.5
  /// This means levels get progressively harder to achieve.
  /// 
  /// Example: Level 1 = 100 XP, Level 2 = 282 XP, Level 3 = 519 XP
  fn calculate_xp_for_level(level: i32) -> i32 {
  ```
- **Type**: DOCSTRING
- **Effort**: 15 minutes

### Location 2: ETag generation (Lines 501-515)
- **Current**: Comments on what is hashed but not WHY some fields included/excluded
- **Needs**: Clarify hashing strategy:
  ```rust
  /// Generates ETag from response content.
  ///
  /// IMPORTANT: This hash is used to optimize 30-second polling.
  /// Only fields that impact UI are included (e.g., progress.coins, badges counts).
  /// Fields like full FocusSession data are NOT included to allow payload changes
  /// without breaking ETags.
  ///
  /// Fields hashed:
  /// - progress: level, coins (streak_days excluded - always changing)
  /// - badges: all counts (unread_inbox, active_quests, etc)
  /// - focus: presence of active_session/pause_state (not full data)
  /// - plan: completed, total (percent calculated client-side)
  /// - user: all fields except tos_accepted (never changes after initial acceptance)
  fn generate_etag(
  ```
- **Type**: DOCSTRING
- **Effort**: 20 minutes

### Location 3: Plan status JSONB parsing (Lines 310-335)
- **Current**: Comments on structure but no validation docstring
- **Needs**: Document expected item structure and failure modes:
  ```rust
  /// Parses daily plan items from JSONB storage.
  ///
  /// Expected item structure: { "completed": bool, "title": string, ... }
  ///
  /// Note: Items without "completed" field are IGNORED in stats (not errors).
  /// This allows gradual schema evolution without migrations.
  ///
  /// If items JSON is invalid, returns empty array (assumes no plan).
  async fn fetch_plan_status(
  ```
- **Type**: DOCSTRING
- **Effort**: 15 minutes

### Location 4: Vault lock error handling (Lines 487-495)
- **Current**: Comment on "not an error" but doesn't explain why
- **Needs**: Explain vault absence behavior:
  ```rust
  /// Fetch vault lock state for cross-device sync.
  ///
  /// Returns Ok(None) if vault doesn't exist yet (not an error).
  /// This allows new users to not have a vault until first use.
  /// 
  /// If VaultRepo query fails, still returns Ok(None) rather than propagating
  /// error to prevent blocking poll if vault service has issues.
  async fn fetch_vault_lock_state(
  ```
- **Type**: DOCSTRING
- **Effort**: 10 minutes

### Location 5: Individual endpoint deprecation (Lines 187-204)
- **Current**: No comments explaining when to use individual vs /poll
- **Needs**: Add module-level comment:
  ```rust
  /// Individual fetch endpoints (/progress, /badges, /focus-status, /plan-status).
  ///
  /// These are maintained for backward compatibility and targeted polling,
  /// but /poll endpoint is preferred for new clients.
  ///
  /// Deprecation note: Consider removing these in v2 if no external clients depend on them.
  /// Currently used by: [internal UI polling only]
  ```
- **Type**: MODULE_COMMENT
- **Effort**: 10 minutes

---

## 4. DEPRECATION CANDIDATES

### Code: get_session endpoint
- **Location**: Lines 533-542
- **Current**:
  ```rust
  async fn get_session(
      Extension(user): Extension<crate::middleware::auth::AuthContext>,
  ) -> Json<serde_json::Value> {
      Json(serde_json::json!({
          "session": {
              "user_id": user.user_id,
              "authenticated": true,
              "created_at": chrono::Utc::now().to_rfc3339(),
          }
      }))
  }
  ```
- **Reason**: 
  1. Only exposes `user_id` and `authenticated` - these are already in `user` field of `/poll`
  2. `created_at` is always "now" (meaningless after first request)
  3. If client wants session info, `/poll` returns more useful data (user email, name, theme, etc)
- **Alternative**: Use `/api/sync/poll` response's `user` object instead
- **Users**: Need to grep for `/sync/session` usage in frontend
- **Action**: DEPRECATE with warning comment, remove in v2
- **Effort**: 30 minutes (add deprecation comment, verify no clients use it)

### Code: Individual endpoints (get_progress, get_badges, get_focus_status, get_plan_status)
- **Location**: Lines 187-204
- **Current**: Four endpoints that each fetch one data type
- **Reason**: 
  1. `/poll` endpoint returns all 4 in single request
  2. Individual endpoints duplicate code (same logic, just one field)
  3. 30s polling design means these would be called 2880x/day/user vs 288x with `/poll`
  4. No indication these are used by external clients
- **Alternative**: Use `/api/sync/poll` which returns all in one request
- **Users**: Verify frontend doesn't use `/api/sync/progress`, `/api/sync/badges`, etc
- **Action**: DEPRECATE (add comments noting deprecation), document usage, remove in v2
- **Effort**: 1 hour (grep frontend for usage, add deprecation notices)

---

## 5. LINT ERRORS & WARNINGS

### Warning: Unused import in focus_status function
- **Location**: Lines 295-296
- **Current**:
  ```rust
  async fn fetch_focus_status(pool: &PgPool, user_id: Uuid) -> Result<FocusStatusData, AppError> {
      use crate::db::focus_repos::{FocusSessionRepo, FocusPauseRepo};
  ```
- **Issue**: Import inside function body is non-idiomatic (should be at top)
- **Fix**: Move import to top of file with other imports
  ```rust
  use crate::db::focus_repos::{FocusSessionRepo, FocusPauseRepo};
  ```
- **Effort**: 5 minutes

### Warning: Redundant `format!()` call
- **Location**: Line 171
- **Current**:
  ```rust
  .header(header::ETAG, format!("\"{}\"", etag))
  ```
- **Better**: 
  ```rust
  .header(header::ETAG, HeaderValue::from_str(&format!("\"{}\"", etag)).unwrap())
  ```
  OR define as constant if reused:
  ```rust
  let etag_header_value = format!("\"{}\"", etag);
  .header(header::ETAG, etag_header_value)
  ```
- **Why**: Document why quotes are needed (ETag format requires quotes)
- **Effort**: 10 minutes (add comment explaining ETag quote requirement)

### Warning: Multiple `Utc::now()` calls in same function
- **Location**: Lines 155, 163 (poll_all function)
- **Current**:
  ```rust
  // Line 155: Used in vault lock
  let now = chrono::Utc::now();  // In fetch_overdue_items_count
  // Line 163: Used for server_time
  let server_time = chrono::Utc::now().to_rfc3339();
  ```
- **Issue**: Multiple calls to `Utc::now()` in same poll cycle
- **Better**: Call once in poll_all, pass to subfunctions:
  ```rust
  let now = chrono::Utc::now();
  let (overdue_count, ...) = fetch_overdue_items_count(pool, user_id, now).await?;
  ```
- **Why**: Ensures consistent "now" across all calculations in single poll
- **Effort**: 1 hour (refactor, update function signatures)
- **Risk**: MEDIUM (functional change, need tests)

### Warning: Inconsistent error context
- **Location**: Lines 252-255, 408-410, 414-416, etc
- **Current**: Plain `AppError::Database(e.to_string())`
- **Issue**: No context about which query failed
- **Better**: Include function name:
  ```rust
  .map_err(|e| AppError::Database(format!("fetch_progress: {}", e)))?;
  ```
- **Why**: Easier to debug which query failed in production logs
- **Effort**: 30 minutes (update all error contexts in file)

### Warning: Type casting without documentation
- **Location**: Lines 255-256 (fetch_progress)
- **Current**:
  ```rust
  Ok(ProgressData {
      level,
      current_xp: xp_in_current_level as i64,  // Cast from i32
  ```
- **Issue**: Why is xp_in_current_level cast to i64?
- **Better**: Document or justify the cast:
  ```rust
  // XP stored as i64 in database to support large values (100M+ xp)
  current_xp: xp_in_current_level as i64,
  ```
- **Effort**: 10 minutes (add comments explaining type choices)

---

## SUMMARY

| Category | Count | Total Effort | Priority |
|----------|-------|--------------|----------|
| Common Operations to Extract | 3 | 3.5 hours | HIGH |
| Code Cleanup Opportunities | 6 | 7 hours | HIGH-MEDIUM |
| Missing Comments/Documentation | 5 | 1.25 hours | MEDIUM |
| Deprecation Candidates | 2 | 1.5 hours | MEDIUM |
| Lint Errors & Warnings | 6 | 2.25 hours | LOW-MEDIUM |

**Total Effort**: ~15 hours  
**Recommended Action**: PROCEED

---

## IMPLEMENTATION ROADMAP

### Phase 1: Quick Wins (2 hours) - LOW RISK
1. Move focus_repos import to top (5 min)
2. Add missing docstrings (1.25 hours)
3. Fix error context messages (30 min)

### Phase 2: Code Extraction (3.5 hours) - MEDIUM RISK
1. Extract `fetch_count()` generic function (1.5 hours)
2. Extract `calculate_xp_progress()` function (1 hour)
3. Extract response builder helper (1 hour)

### Phase 3: Cleanup & Refactoring (5.5 hours) - MEDIUM-HIGH RISK
1. Fix date formatting inconsistency (30 min)
2. Move TOS check to middleware (2 hours)
3. Refactor `Utc::now()` calls (1 hour)
4. Fix focus_status unwrap_or pattern (15 min)

### Phase 4: Deprecation (1.5 hours) - LOW RISK
1. Add deprecation notices to individual endpoints (30 min)
2. Verify no frontend usage (1 hour)

---

## NEXT STEPS

- [ ] Review findings with team
- [ ] Prioritize by effort/impact (recommend: Phase 1 → Phase 2 → Phase 4 → Phase 3)
- [ ] Start with docstring additions (quick, low-risk wins)
- [ ] Extract common operations (highest impact)
- [ ] Deprecate unused endpoints

---

## FILES AFFECTED

- `app/backend/crates/api/src/routes/sync.rs` (all changes)
- `app/backend/crates/api/src/error.rs` (if trait extension approach used)
- `app/backend/crates/api/src/middleware/auth.rs` (if TOS check moved)

