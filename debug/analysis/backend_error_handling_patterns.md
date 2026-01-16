# BACKEND ERROR HANDLING PATTERNS ANALYSIS

**Component**: Backend Rust error handling and Result wrapping  
**Scope**: Error types, recovery patterns, logging consistency  
**Key Files**: error.rs (216 lines), routes/*.rs, services/*.rs, db/*_repos.rs  
**Representative Files Analyzed**: 5 core files  

**Issues Identified**: 8  
**Effort Estimate**: 1.5-2 hours  

**Issue Breakdown**:
- 2 Error type coverage issues (missing variants, inconsistent handling)
- 2 Error context loss issues (wrapping, conversion)
- 2 Logging inconsistencies (levels, structure)
- 1 Result type usage issue (AppResult vs Result<T, E>)
- 1 Error recovery issue (retry patterns missing)

**Critical Findings**: Error handling working but could be more structured

---

## ISSUE CATEGORY: ERROR TYPE COVERAGE (2 issues, 0.5 hours)

### ERR-1: Missing Error Variants for Common Failure Cases
**Location**: `error.rs` enum variants  
**Current Enum**:

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Unauthorized: {0}")]
    Unauthorized(String),
    
    #[error("Forbidden")]
    Forbidden,
    
    #[error("CSRF violation")]
    CsrfViolation,
    
    #[error("Invalid origin")]
    InvalidOrigin,
    
    #[error("Bad request: {0}")]
    BadRequest(String),
    
    #[error("Validation error: {0}")]
    Validation(String),
    
    #[error("OAuth error: {0}")]
    OAuthError(String),
    
    #[error("Session expired")]
    SessionExpired,
    
    #[error("Database error: {0}")]
    Database(String),
    
    #[error("Database error in {operation} on {table}: {message}")]
    DatabaseWithContext { ... },
    
    #[error("Internal error: {0}")]
    Internal(String),
    
    #[error("Configuration error: {0}")]
    Config(String),
    
    #[error("Storage error: {0}")]
    Storage(String),
}
```

**Issues Identified**:
1. **Missing: Timeout variant** - queries can timeout, needs explicit error
2. **Missing: RateLimit variant** - OAuth or API rate limits
3. **Missing: Serialization variant** - JSON/serialization failures
4. **Missing: NotImplemented variant** - stub features return 500 with Internal instead of 501
5. **Missing: Conflict variant** - unique constraint violations, duplicate entries
6. **Missing: PayloadTooLarge variant** - file upload size limits

**Evidence from Code**:
```rust
// In routes/quests.rs - generic error handling
async fn list_quests(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<ListQuestsQuery>,
) -> Result<Json<QuestsListWrapper>, AppError> {
    let result = QuestsRepo::list(&state.db, user.id, query.status.as_deref()).await?;
    // Generic AppError with no specific status code handling for different cases
}

// If query times out: returns 500 Internal via Database variant
// If constraint violation: returns 500 Internal via Database variant
// Should return: 504 Gateway Timeout, 409 Conflict
```

**Solution**: Add missing error variants.

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    // ... existing variants ...
    
    /// Request timeout (query took too long)
    #[error("Request timeout: {0}")]
    Timeout(String),
    
    /// Rate limit exceeded
    #[error("Rate limit exceeded: {0}")]
    RateLimit(String),
    
    /// Serialization/deserialization error
    #[error("Serialization error: {0}")]
    Serialization(String),
    
    /// Feature not yet implemented (returns 501)
    #[error("Not implemented: {0}")]
    NotImplemented(String),
    
    /// Conflict with existing resource (duplicate key, etc.)
    #[error("Conflict: {0}")]
    Conflict(String),
    
    /// Request payload too large
    #[error("Payload too large: {0}")]
    PayloadTooLarge(String),
}

// Update IntoResponse to handle new variants
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_type, message) = match &self {
            // ... existing matches ...
            
            AppError::Timeout(msg) => (
                StatusCode::GATEWAY_TIMEOUT,
                "timeout",
                msg.clone(),
            ),
            AppError::RateLimit(msg) => (
                StatusCode::TOO_MANY_REQUESTS,
                "rate_limit",
                msg.clone(),
            ),
            AppError::Serialization(msg) => (
                StatusCode::BAD_REQUEST,
                "serialization_error",
                msg.clone(),
            ),
            AppError::NotImplemented(msg) => (
                StatusCode::NOT_IMPLEMENTED,
                "not_implemented",
                msg.clone(),
            ),
            AppError::Conflict(msg) => (
                StatusCode::CONFLICT,
                "conflict",
                msg.clone(),
            ),
            AppError::PayloadTooLarge(msg) => (
                StatusCode::PAYLOAD_TOO_LARGE,
                "payload_too_large",
                msg.clone(),
            ),
        };
        // ... rest of implementation ...
    }
}

// Add From implementations for auto-conversion
impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        AppError::Serialization(e.to_string())
    }
}

impl From<tokio::time::error::Elapsed> for AppError {
    fn from(e: tokio::time::error::Elapsed) -> Self {
        AppError::Timeout(e.to_string())
    }
}
```

**Impact**: More specific error responses, better client handling.  
**Effort**: 0.25 hours

---

### ERR-2: Inconsistent HTTP Status Codes in Error Handling
**Location**: Various handlers mixing implicit and explicit status codes  
**Pattern**:

```rust
// routes/quests.rs - Using AppError which maps to StatusCode
async fn list_quests(...) -> Result<Json<QuestsListWrapper>, AppError> {
    // Any error becomes generic 500 or mapped StatusCode
    QuestsRepo::list(...).await?  // Could be NotFound, Database, etc.
}

// Routes don't explicitly handle different error types
// AppError::NotFound → 404 ✓
// AppError::Unauthorized → 401 ✓
// AppError::Database → 500 ✓
// AppError::Validation → 422 ✓

// BUT: Some handlers don't know which error is expected
// No documentation of "this endpoint returns 404 if not found"
```

**Issue**:
1. Error mappings implicit in AppError::IntoResponse
2. Handlers don't document which errors they can return
3. No way to know from handler signature what HTTP status codes are possible
4. If error variant added, status code buried in IntoResponse match

**Solution**: Document error responses and consider error-specific handlers.

```rust
// Option A: Document in route handlers
/// GET /quests/{id}
/// 
/// Returns:
/// - 200 OK with quest
/// - 404 NOT FOUND if quest doesn't exist
/// - 401 UNAUTHORIZED if not authenticated
/// - 500 INTERNAL SERVER ERROR on database failure
async fn get_quest(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Path(quest_id): Path<Uuid>,
) -> Result<Json<QuestResponseWrapper>, AppError> {
    let quest = QuestsRepo::get_by_id(&state.db, quest_id, user.id)
        .await?
        .ok_or_else(|| AppError::NotFound("Quest not found".into()))?;
    
    Ok(Json(QuestResponseWrapper { quest }))
}

// Option B: Create error response middleware documentation
// See docs/ERROR_RESPONSES.md for complete mapping of AppError variants to HTTP status codes
```

**Impact**: Clearer API documentation, easier client integration.  
**Effort**: 0.2 hours

---

## ISSUE CATEGORY: ERROR CONTEXT LOSS (2 issues, 0.4 hours)

### CTX-1: Limited Error Context Preservation in Database Operations
**Location**: db/*_repos.rs files, database error conversions  
**Pattern**:

```rust
// habits_goals_repos.rs
pub async fn create(
    pool: &PgPool,
    user_id: Uuid,
    req: &CreateHabitRequest,
) -> Result<Habit, AppError> {
    let habit = sqlx::query_as::<_, Habit>(
        r#"INSERT INTO habits (...) VALUES ($1, $2, ...) RETURNING ..."#,
    )
    .bind(user_id)
    .bind(&req.name)
    .bind(&req.description)
    // ...
    .fetch_one(pool)
    .await?;  // Error is converted to AppError::Database with just error message
    
    Ok(habit)
}

// When error occurs:
// 1. SQLx returns: PgError { code: "23505", message: "duplicate key value..." }
// 2. Converted to: AppError::Database("duplicate key value...")
// 3. Log shows: error type: database, message: duplicate key value...
// 4. LOST: operation name, table name, input values for debugging
```

**Issue**:
1. Error context lost during sqlx → AppError conversion
2. No tracking of which operation failed (create, update, delete)
3. No tracking of which table caused error
4. Input values not logged (privacy: don't log sensitive data)
5. DatabaseWithContext variant exists but rarely used

**Solution**: Use DatabaseWithContext variant systematically.

```rust
// habits_goals_repos.rs - IMPROVED
use crate::db::core::QueryContext;

pub async fn create(
    pool: &PgPool,
    user_id: Uuid,
    req: &CreateHabitRequest,
) -> Result<Habit, AppError> {
    let ctx = QueryContext::new("create", "habits")
        .with_user(user_id);
    
    let habit = sqlx::query_as::<_, Habit>(
        r#"INSERT INTO habits (...) VALUES ($1, $2, ...) RETURNING ..."#,
    )
    .bind(user_id)
    .bind(&req.name)
    .bind(&req.description)
    .fetch_one(pool)
    .await
    .map_err(|e| AppError::DatabaseWithContext {
        operation: ctx.operation.to_string(),
        table: ctx.table.to_string(),
        message: e.to_string(),
        user_id: ctx.user_id,
        entity_id: None,
    })?;
    
    Ok(habit)
}

// Now error logs include:
// operation: create
// table: habits
// user_id: <uuid>
// message: duplicate key value violates unique constraint "habits_pkey"
```

**Alternative**: Create helper method to reduce boilerplate.

```rust
// db/core.rs (new method)
impl QueryContext {
    /// Convert SQLx error to AppError with context
    pub fn to_app_error(self, e: sqlx::Error) -> AppError {
        AppError::DatabaseWithContext {
            operation: self.operation.to_string(),
            table: self.table.to_string(),
            message: e.to_string(),
            user_id: self.user_id,
            entity_id: self.entity_id,
        }
    }
}

// Usage:
let ctx = QueryContext::new("create", "habits").with_user(user_id);
let habit = sqlx::query_as::<_, Habit>(...)
    .fetch_one(pool)
    .await
    .map_err(|e| ctx.to_app_error(e))?;
```

**Impact**: Better debugging, easier to trace database failures.  
**Effort**: 0.25 hours

---

### CTX-2: Missing Error Source Chain in From Implementations
**Location**: error.rs From implementations  
**Current Code**:

```rust
impl From<sqlx::Error> for AppError {
    fn from(e: sqlx::Error) -> Self {
        AppError::Database(e.to_string())  // Lost sqlx::Error details
    }
}

impl From<anyhow::Error> for AppError {
    fn from(e: anyhow::Error) -> Self {
        AppError::Internal(e.to_string())  // Lost error chain
    }
}
```

**Issue**:
1. Calling .to_string() loses error type information
2. Error chains (cause/source) not preserved
3. Structured logging can't extract error hierarchy
4. Debugging harder without full context

**Solution**: Preserve error context using thiserror source field.

```rust
// Option A: Add source field to variants that warrant it
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(String),
    
    #[error("Database error in {operation} on {table}: {message}")]
    DatabaseWithContext {
        operation: String,
        table: String,
        message: String,
        user_id: Option<Uuid>,
        entity_id: Option<Uuid>,
        #[source]  // Preserve original sqlx::Error as source
        source: Option<Box<dyn std::error::Error + Send + Sync>>,
    },
    
    #[error("Internal error: {0}")]
    Internal(String),
    // ...
}

// Option B: Keep simplicity but log source chain
impl From<sqlx::Error> for AppError {
    fn from(e: sqlx::Error) -> Self {
        // Log the full error chain before converting
        tracing::debug!(
            error.type = "sqlx",
            error.source = %e,
            "SQLx error occurred"
        );
        AppError::Database(e.to_string())
    }
}

impl From<anyhow::Error> for AppError {
    fn from(e: anyhow::Error) -> Self {
        // Log full chain
        tracing::debug!(
            error.type = "anyhow",
            error.source = %e,
            error.chain = %e.chain().collect::<Vec<_>>().join(" → "),
            "Anyhow error occurred"
        );
        AppError::Internal(e.to_string())
    }
}
```

**Impact**: Better error diagnostics through logging.  
**Effort**: 0.15 hours

---

## ISSUE CATEGORY: LOGGING INCONSISTENCY (2 issues, 0.4 hours)

### LOG-1: Inconsistent Log Levels for Different Error Scenarios
**Location**: error.rs IntoResponse match arms  
**Pattern**:

```rust
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_type, message) = match &self {
            AppError::NotFound(_) => (...),  // No logging

            AppError::Unauthorized(_) => (...),  // No logging

            AppError::OAuthError(msg) => {
                tracing::error!("OAuth error: {}", msg);  // ERROR level
                (StatusCode::BAD_REQUEST, "oauth_error", msg.clone())
            }

            AppError::SessionExpired => (...),  // No logging

            AppError::Database(e) => {
                tracing::error!(  // Always ERROR level
                    error.type = "database",
                    error.message = %e,
                    "Database error (legacy)"
                );
                (StatusCode::INTERNAL_SERVER_ERROR, "database_error", ...)
            }

            AppError::DatabaseWithContext { ... } => {
                tracing::error!(  // Always ERROR level
                    error.type = "database",
                    db.operation = %operation,
                    // ... more fields
                    "Database query failed"
                );
                (StatusCode::INTERNAL_SERVER_ERROR, "database_error", ...)
            }

            AppError::Internal(e) => {
                tracing::error!(  // Always ERROR level
                    error.type = "internal",
                    error.message = %e,
                    "Internal error"
                );
                (StatusCode::INTERNAL_SERVER_ERROR, "internal_error", ...)
            }

            AppError::Config(msg) => {
                tracing::error!(  // Always ERROR level
                    error.type = "config",
                    error.message = %msg,
                    "Configuration error"
                );
                (StatusCode::INTERNAL_SERVER_ERROR, "config_error", ...)
            }

            AppError::Storage(e) => {
                tracing::error!(  // Always ERROR level
                    error.type = "storage",
                    error.message = %e,
                    "Storage error"
                );
                (StatusCode::INTERNAL_SERVER_ERROR, "storage_error", ...)
            }
        };
        // ...
    }
}
```

**Issues**:
1. **Inconsistent logging**: Some errors logged, some not (NotFound, Unauthorized, SessionExpired not logged)
2. **Wrong log levels**: 404 NotFound is normal, shouldn't be ERROR
3. **Missing log context**: Some errors missing structured fields
4. **Over-logging**: Every Database error → ERROR level, but could be user error (validation)

**Solution**: Use appropriate log levels based on severity.

```rust
// Error severity hierarchy:
// - WARN: Client errors (4xx) - NotFound, BadRequest, Validation
// - ERROR: Server errors (5xx) - Database, Internal, Config, Storage
// - DEBUG: Auth errors (401, 403) - expected security events
// - TRACE: CSRF, InvalidOrigin - common security checks

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_type, message) = match &self {
            AppError::NotFound(msg) => {
                tracing::debug!(msg, "Resource not found");  // WARN level
                (StatusCode::NOT_FOUND, "not_found", msg.clone())
            }

            AppError::Unauthorized(msg) => {
                tracing::debug!(msg, "Unauthorized request");  // DEBUG level
                (StatusCode::UNAUTHORIZED, "unauthorized", msg.clone())
            }

            AppError::Forbidden => {
                tracing::debug!("Forbidden request");  // DEBUG level
                (StatusCode::FORBIDDEN, "forbidden", "Forbidden".to_string())
            }

            AppError::CsrfViolation => {
                tracing::trace!("CSRF violation detected");  // TRACE level
                (StatusCode::FORBIDDEN, "csrf_violation", ...)
            }

            AppError::InvalidOrigin => {
                tracing::trace!("Invalid origin");  // TRACE level
                (StatusCode::FORBIDDEN, "invalid_origin", ...)
            }

            AppError::BadRequest(msg) => {
                tracing::warn!(msg, "Bad request");  // WARN level
                (StatusCode::BAD_REQUEST, "bad_request", msg.clone())
            }

            AppError::Validation(msg) => {
                tracing::warn!(msg, "Validation error");  // WARN level
                (StatusCode::UNPROCESSABLE_ENTITY, "validation_error", msg.clone())
            }

            AppError::OAuthError(msg) => {
                tracing::warn!(msg, "OAuth error");  // WARN level
                (StatusCode::BAD_REQUEST, "oauth_error", msg.clone())
            }

            AppError::SessionExpired => {
                tracing::debug!("Session expired");  // DEBUG level
                (StatusCode::UNAUTHORIZED, "session_expired", ...)
            }

            AppError::Database(e) => {
                tracing::error!(
                    error.type = "database",
                    error.message = %e,
                    "Database error (legacy)"
                );
                (StatusCode::INTERNAL_SERVER_ERROR, "database_error", ...)
            }

            // ... rest (ERROR level for 5xx errors) ...
        };
        (status, Json(body)).into_response()
    }
}
```

**Impact**: Better observability, clearer signal-to-noise in logs.  
**Effort**: 0.25 hours

---

### LOG-2: Missing Error Context in Request/Response Middleware
**Location**: Handlers don't log request context before error  
**Pattern**:

```rust
// routes/quests.rs
async fn list_quests(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<ListQuestsQuery>,
) -> Result<Json<QuestsListWrapper>, AppError> {
    // No logging of request received
    let result = QuestsRepo::list(&state.db, user.id, query.status.as_deref()).await?;
    // If error occurs, no context about request parameters
    Ok(Json(QuestsListWrapper { quests: result.quests, total: result.total }))
}

// Log output if error:
// error: Database error: ...
// (no context about which user, what filters, etc.)
```

**Issue**:
1. Request parameters not logged before operation
2. If error occurs, hard to reproduce (what was the request?)
3. No trace of request → error flow
4. User context available but not logged systematically

**Solution**: Add structured logging at handler entry.

```rust
async fn list_quests(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<ListQuestsQuery>,
) -> Result<Json<QuestsListWrapper>, AppError> {
    tracing::debug!(
        user_id = %user.id,
        status_filter = ?query.status,
        "Getting quest list"
    );
    
    let result = QuestsRepo::list(&state.db, user.id, query.status.as_deref()).await?;
    
    tracing::info!(
        user_id = %user.id,
        quest_count = result.quests.len(),
        "Quest list retrieved"
    );
    
    Ok(Json(QuestsListWrapper { quests: result.quests, total: result.total }))
}

// Alternative: Middleware for automatic request logging
// (recommended for consistency)
```

**Impact**: Better debugging, easier to trace request → error flows.  
**Effort**: 0.15 hours

---

## ISSUE CATEGORY: RESULT TYPE USAGE (1 issue, 0.25 hours)

### RES-1: Inconsistent Use of AppResult Type Alias
**Location**: Various handlers and functions  
**Pattern**:

```rust
// Some files use AppResult
pub type AppResult<T> = Result<T, AppError>;

// Some functions use AppResult
pub async fn create(pool: &PgPool, req: &CreateHabitRequest) -> AppResult<Habit> {
    // ...
}

// Some use explicit Result<T, AppError>
pub async fn list(pool: &PgPool, user_id: Uuid) -> Result<QuestsListResponse, AppError> {
    // ...
}

// Some use Result<T, E> where E varies
async fn get_by_id(...) -> Result<Option<Habit>, AppError> {  // ✓ uses AppError
async fn run_migrations(...) -> Result<usize, sqlx::migrate::MigrateError> {  // ✗ uses sqlx error
```

**Issue**:
1. AppResult alias defined but not consistently used
2. Some functions use Result<T, AppError>, some use Result<T, E> with different E
3. Inconsistency makes codebase harder to read
4. New developers don't know which pattern to follow

**Solution**: Use AppResult consistently.

```rust
// error.rs - already defined
pub type AppResult<T> = Result<T, AppError>;

// Update all function signatures:
// BEFORE:
pub async fn create(pool: &PgPool, req: &CreateHabitRequest) -> Result<Habit, AppError>
// AFTER:
pub async fn create(pool: &PgPool, req: &CreateHabitRequest) -> AppResult<Habit>

// BEFORE:
pub async fn list(pool: &PgPool, user_id: Uuid) -> Result<QuestsListResponse, AppError>
// AFTER:
pub async fn list(pool: &PgPool, user_id: Uuid) -> AppResult<QuestsListResponse>

// EXCEPTION: Functions that return other error types must be converted
// BEFORE:
async fn run_migrations(db: &PgPool) -> Result<usize, sqlx::migrate::MigrateError>
// AFTER:
async fn run_migrations(db: &PgPool) -> AppResult<usize>  // Convert MigrateError to AppError
```

**Impact**: Consistent, concise function signatures.  
**Effort**: 0.25 hours

---

## ISSUE CATEGORY: ERROR RECOVERY (1 issue, 0.3 hours)

### REC-1: Missing Retry Patterns for Transient Failures
**Location**: Database operations, OAuth calls  
**Pattern**:

```rust
// habits_goals_repos.rs - No retry
pub async fn create(pool: &PgPool, user_id: Uuid, req: &CreateHabitRequest) -> AppResult<Habit> {
    let habit = sqlx::query_as::<_, Habit>(...)
        .fetch_one(pool)
        .await?;  // Fails immediately on transient error
    
    Ok(habit)
}

// services/oauth.rs - No retry
pub fn new(config: &OAuthProviderConfig, redirect_uri: &str) -> Result<Self, AppError> {
    // HTTP call to OAuth provider
    // No retry on timeout or transient network error
}
```

**Issue**:
1. No retry logic for transient failures (network timeout, connection pool exhaustion)
2. Single transient failure → user sees error instead of automatic retry
3. Database connection pool exhaustion causes immediate failure
4. OAuth calls not retried

**Solution**: Add configurable retry patterns (optional enhancement).

```rust
// Option A: Retry macro for database operations
#[macro_export]
macro_rules! retry_query {
    ($expr:expr, $max_retries:expr) => {{
        let mut attempt = 0;
        loop {
            match $expr.await {
                Ok(result) => break Ok(result),
                Err(e) if attempt < $max_retries => {
                    attempt += 1;
                    tracing::warn!(
                        attempt,
                        max_retries = $max_retries,
                        "Query failed, retrying..."
                    );
                    tokio::time::sleep(tokio::time::Duration::from_millis(100 * attempt as u64)).await;
                    continue;
                }
                Err(e) => break Err(e),
            }
        }
    }};
}

// Usage:
let habit = retry_query!(
    sqlx::query_as::<_, Habit>(...).fetch_one(pool),
    3  // max 3 attempts
)
.await?;

// Option B: Backoff library (backoff crate)
use backoff::ExponentialBackoff;

pub async fn create(pool: &PgPool, user_id: Uuid, req: &CreateHabitRequest) -> AppResult<Habit> {
    let backoff = ExponentialBackoff::default();
    backoff::future::retry(backoff, || async {
        sqlx::query_as::<_, Habit>(...)
            .fetch_one(pool)
            .await
            .map_err(|e| backoff::Error::transient(AppError::Database(e.to_string())))
    })
    .await
}
```

**Impact**: More resilient to transient failures.  
**Effort**: 0.3 hours (optional, depends on reliability requirements)

---

## IMPLEMENTATION ROADMAP

### Phase 1: Add Missing Error Variants (0.25 hours)
- [ ] Add Timeout, RateLimit, Serialization, NotImplemented, Conflict, PayloadTooLarge
- [ ] Update IntoResponse to handle new variants
- [ ] Add From implementations for auto-conversion

### Phase 2: Fix Error Context (0.25 hours)
- [ ] Update database operations to use DatabaseWithContext
- [ ] Create helper method in QueryContext for error conversion
- [ ] Add source chain preservation in From implementations

### Phase 3: Fix Logging (0.4 hours)
- [ ] Update error.rs to use appropriate log levels (WARN for 4xx, ERROR for 5xx)
- [ ] Add request context logging to handlers
- [ ] Add debug logging at handler entry/exit

### Phase 4: Standardize Result Types (0.25 hours)
- [ ] Replace all Result<T, AppError> with AppResult<T>
- [ ] Ensure consistency across all function signatures

### Phase 5: Documentation (0.2 hours)
- [ ] Document error response codes for each endpoint
- [ ] Create ERROR_RESPONSES.md with full mapping
- [ ] Document which errors each route can return

### Phase 6: Optional - Add Retry Logic (0.3 hours)
- [ ] Implement backoff for transient failures (optional)
- [ ] Test retry behavior

---

## VALIDATION CHECKLIST

### Error Coverage
- [ ] All common failure scenarios have specific variants
- [ ] Each variant maps to appropriate HTTP status code
- [ ] 4xx for client errors, 5xx for server errors, 3xx for redirects
- [ ] No 500 for user-caused errors (validation, not found)

### Error Context
- [ ] Database errors include operation, table, user_id
- [ ] Error chains preserved through From implementations
- [ ] Request context logged systematically

### Logging
- [ ] Log levels appropriate: TRACE < DEBUG < WARN < ERROR
- [ ] Client errors (4xx) → WARN or DEBUG level
- [ ] Server errors (5xx) → ERROR level
- [ ] Each log includes structured fields

### Result Types
- [ ] All functions returning AppError use AppResult<T>
- [ ] No mixing of Result<T, AppError> and AppResult<T>
- [ ] Consistent signatures across codebase

### Documentation
- [ ] Each endpoint documents possible error responses
- [ ] ERROR_RESPONSES.md complete and up-to-date
- [ ] Error variant documentation clear

---

## SUMMARY

Backend error handling is **functional but could be more structured**:

**Highest Priority**: Add missing error variants (Timeout, Conflict, NotImplemented, etc.) for better HTTP status codes.

**Important**: Preserve error context through database operations using DatabaseWithContext.

**Quality**: Use appropriate log levels (DEBUG for client errors, ERROR for server errors).

**Quick Wins**:
- Add 6 missing error variants (0.25 hours)
- Update logging to use appropriate levels (0.25 hours)
- Standardize on AppResult<T> type alias (0.25 hours)

**Total Effort**: 1.5-2 hours to improve error handling consistency.

**ROI**:
- Better HTTP status codes: clients can differentiate error types
- Clearer debugging: error context preserved through stack
- Observability: log levels match severity, easier to monitor
- Consistency: AppResult<T> everywhere makes code more readable
