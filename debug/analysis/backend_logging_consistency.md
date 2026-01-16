# BACKEND LOGGING CONSISTENCY ANALYSIS

**Component**: Backend structured logging patterns  
**Scope**: tracing usage, log level consistency, structured field usage  
**Key Files**: main.rs, error.rs, state.rs, services/*.rs, middleware/*.rs  
**Representative Files Analyzed**: 6 core files  

**Issues Identified**: 8  
**Effort Estimate**: 1.5-2 hours  

**Issue Breakdown**:
- 3 Log level inconsistency issues (wrong severity level usage)
- 2 Structured field issues (missing context, inconsistent names)
- 1 Format consistency issue (unstructured vs structured)
- 1 Filter configuration issue
- 1 Performance issue (logging in loops)

**Critical Findings**: Logging setup good, but execution inconsistent

---

## ISSUE CATEGORY: LOG LEVEL INCONSISTENCY (3 issues, 0.6 hours)

### LOG-1: Inconsistent Log Levels for Similar Operations
**Location**: Various files using tracing  
**Examples**:

```rust
// state.rs - Log level inconsistency
pub async fn new(config: &AppConfig) -> anyhow::Result<Self> {
    let db_url = &config.database.url;
    tracing::info!("DATABASE_URL received: {} chars", db_url.len());  // INFO
    
    if db_url.is_empty() || db_url == "postgres://localhost/ignition" {
        tracing::error!("DATABASE_URL not set or using fallback: {}", db_url);  // ERROR
        return Err(anyhow::anyhow!("DATABASE_URL environment variable not configured"));
    }
    
    let redacted_url = ...;
    tracing::info!("Connecting to database: {}", redacted_url);  // INFO
    
    let db = PgPoolOptions::new(...)
        .connect(&config.database.url)
        .await
        .map_err(|e| {
            tracing::error!("Failed to connect to database: {}", e);  // ERROR
            tracing::error!("DATABASE_URL (redacted): {}", redacted_url);  // ERROR
            e
        })?;
    
    tracing::info!("Database connection pool created");  // INFO
    
    // More INFO logs...
    match StorageClient::new(&config.storage).await {
        Ok(client) => {
            tracing::info!("Storage client initialized");  // INFO
            Some(client)
        }
        Err(e) => {
            tracing::warn!("Storage client not available: {}", e);  // WARN ← Different from ERROR above!
            None
        }
    }
    
    tracing::info!("Storage not configured");  // INFO
}

// middleware/csrf.rs - Different log level for similar situation
tracing::debug!("CSRF check skipped - dev mode enabled on localhost");  // DEBUG ← vs INFO above

// services/oauth.rs - Different log levels for similar scenarios
tracing::info!("Google OAuth credentials not configured. Google login disabled.");  // INFO
tracing::warn!("Google OAuth setup failed: {}. Google login disabled.", e);  // WARN
tracing::info!("Azure OAuth tenant_id is empty. Azure login disabled.");  // INFO (same as above!)
tracing::warn!("Azure OAuth setup failed: {}. Azure login disabled.", e);  // WARN
tracing::info!("Azure OAuth tenant_id not configured. Azure login disabled.");  // INFO (again!)
```

**Issue**:
1. Same situation logged at different levels
2. "Optional feature not available" sometimes INFO, sometimes WARN
3. "Setup failed" sometimes WARN, sometimes ERROR
4. Configuration missing sometimes INFO, sometimes ERROR
5. No clear convention for what level each scenario deserves

**Log Level Convention** (standard):
```
TRACE  - Very detailed diagnostic info (rarely needed)
DEBUG  - Diagnostic info for development/troubleshooting
INFO   - General operational events (server started, requests served)
WARN   - Warning conditions (missing optional config, fallback used, retry happening)
ERROR  - Error conditions (fatal failures, data loss risk)
```

**Solution**: Establish log level convention and apply consistently.

```rust
// Convention for common scenarios:
// Optional feature not available: WARN (or INFO if truly optional)
// Configuration missing: ERROR if required, WARN if optional
// Feature disabled due to config: INFO (informational, working as expected)
// Connection failed: ERROR (unexpected failure)
// Retry happening: DEBUG or WARN depending on severity
// Dev bypass active: DEBUG (development-only)

// state.rs - CORRECTED
pub async fn new(config: &AppConfig) -> anyhow::Result<Self> {
    let db_url = &config.database.url;
    tracing::debug!("DATABASE_URL length: {} chars", db_url.len());  // DEBUG (diagnostic)
    
    if db_url.is_empty() || db_url == "postgres://localhost/ignition" {
        tracing::error!("DATABASE_URL not configured: using fallback");  // ERROR (required)
        return Err(anyhow::anyhow!("DATABASE_URL environment variable not configured"));
    }
    
    let redacted_url = ...;
    tracing::info!("Connecting to database: {}", redacted_url);  // INFO (operational)
    
    let db = PgPoolOptions::new(...)
        .connect(&config.database.url)
        .await
        .map_err(|e| {
            tracing::error!(  // ERROR (unexpected)
                error = %e,
                "Failed to connect to database"
            );
            e
        })?;
    
    tracing::info!("Database connection established");  // INFO (operational)
    
    // Storage client setup
    let storage = if config.storage.endpoint.is_some() {
        match StorageClient::new(&config.storage).await {
            Ok(client) => {
                tracing::debug!("Storage client initialized successfully");  // DEBUG (detailed)
                Some(client)
            }
            Err(e) => {
                tracing::warn!(  // WARN (optional feature failed)
                    error = %e,
                    "Storage client initialization failed - feature disabled"
                );
                None
            }
        }
    } else {
        tracing::info!("Storage not configured - feature disabled");  // INFO (informational)
        None
    };
}

// middleware/csrf.rs - CONSISTENT with convention
if host.starts_with("localhost") || host.starts_with("127.0.0.1") {
    tracing::debug!("CSRF check skipped in dev mode");  // DEBUG (development feature)
    return Ok(next.run(req).await);
}

// services/oauth.rs - CONSISTENT with convention
if config.google.is_none() {
    tracing::info!("Google OAuth not configured - feature disabled");  // INFO
    // Don't create google provider
} else {
    match GoogleOAuthProvider::new(&config.google.unwrap()) {
        Ok(provider) => {
            tracing::debug!("Google OAuth provider initialized");  // DEBUG
        }
        Err(e) => {
            tracing::warn!(  // WARN (optional feature failed)
                error = %e,
                "Google OAuth initialization failed - feature disabled"
            );
        }
    }
}
```

**Impact**: Consistent log levels make filtering and alerting easier.  
**Effort**: 0.25 hours

---

### LOG-2: Request Entry/Exit Not Logged Systematically
**Location**: Route handlers missing request logging  
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
    // No logging of response
    Ok(Json(QuestsListWrapper { quests: result.quests, total: result.total }))
}

// Result: If error occurs, no trace of:
// - Which user made request
// - What query parameters were used
// - How long operation took
// - Success/failure
```

**Issue**:
1. No request entry logging
2. No response exit logging
3. No timing/duration logging
4. No request ID for tracing across logs
5. Makes debugging harder

**Solution**: Add request/response logging to handlers.

```rust
// Option A: Manual logging in each handler
async fn list_quests(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<ListQuestsQuery>,
) -> Result<Json<QuestsListWrapper>, AppError> {
    let start = std::time::Instant::now();
    tracing::info!(
        user_id = %user.id,
        status_filter = ?query.status,
        "Listing quests"
    );
    
    let result = QuestsRepo::list(&state.db, user.id, query.status.as_deref()).await?;
    
    tracing::info!(
        user_id = %user.id,
        quest_count = result.quests.len(),
        duration_ms = start.elapsed().as_millis(),
        "Quests listed successfully"
    );
    
    Ok(Json(QuestsListWrapper { quests: result.quests, total: result.total }))
}

// Option B: Middleware for automatic logging (recommended)
// app/backend/crates/api/src/middleware/logging.rs (new file)
use axum::{
    body::Body,
    extract::Request,
    middleware::Next,
    response::Response,
};
use std::time::Instant;

pub async fn request_logging_middleware(
    mut req: Request,
    next: Next,
) -> Response {
    let method = req.method().clone();
    let uri = req.uri().clone();
    let start = Instant::now();
    
    tracing::info!(
        method = %method,
        uri = %uri,
        "Incoming request"
    );
    
    let response = next.run(req).await;
    let duration = start.elapsed();
    
    tracing::info!(
        method = %method,
        uri = %uri,
        status = response.status().as_u16(),
        duration_ms = duration.as_millis(),
        "Request completed"
    );
    
    response
}

// Usage in main.rs:
let app: Router<Arc<AppState>> = Router::new()
    .layer(axum::middleware::from_fn(request_logging_middleware))
    // ... rest of router
```

**Impact**: Better request tracing, easier to debug issues.  
**Effort**: 0.25 hours

---

### LOG-3: Missing Error Correlation IDs
**Location**: Error logging doesn't include request context  
**Pattern**:

```rust
// If database error occurs:
tracing::error!(
    error.type = "database",
    db.operation = %operation,
    db.table = %table,
    error.message = %message,
    "Database query failed"
);

// But no way to correlate this error to the original request
// Next log is from different request, hard to trace flow
```

**Issue**:
1. No request ID across log entries
2. Hard to trace single request through logs
3. Multiple concurrent requests create log noise

**Solution**: Add request ID via middleware (optional enhancement, useful for production).

```rust
// Option A: Generate request ID in middleware
use uuid::Uuid;
use tower_http::request_id::MakeRequestUuid;

let app = Router::new()
    .layer(SetRequestIdLayer::new(
        MakeRequestUuid::new(),  // or custom ID generator
    ))
    // ... rest of router

// Option B: Extract and log in handlers (simpler)
// (already done via Extension<User> pattern, add user_id to all logs)

// Current pattern already includes user_id in most logs, which is good:
tracing::info!(
    user_id = %user.id,  // ✓ Good for user-scoped requests
    status_filter = ?query.status,
    "Listing quests"
);

// To improve, also add operation type:
tracing::info!(
    user_id = %user.id,
    operation = "list_quests",
    status_filter = ?query.status,
    "Request started"
);
```

**Impact**: Better distributed tracing and debugging.  
**Effort**: 0.1 hours (just add operation field)

---

## ISSUE CATEGORY: STRUCTURED FIELD INCONSISTENCY (2 issues, 0.4 hours)

### STRUCT-1: Inconsistent Field Names in Structured Logs
**Location**: Various files using different field naming conventions  
**Examples**:

```rust
// error.rs - Uses some conventions:
tracing::error!(
    error.type = "database",  // "error.type"
    error.message = %e,       // "error.message"
    "Database error (legacy)"
);

tracing::error!(
    error.type = "database",
    db.operation = %operation,  // "db.operation"
    db.table = %table,          // "db.table"
    db.user_id = ?user_id,      // "db.user_id"
    db.entity_id = ?entity_id,  // "db.entity_id"
    error.message = %message,
    "Database query failed"
);

// state.rs - Uses different conventions:
tracing::error!("Failed to connect to database: {}", e);  // NO structured fields!
tracing::error!("DATABASE_URL (redacted): {}", redacted_url);  // NO structured fields!

// services/auth.rs - Uses yet different:
tracing::warn!(
    "Session rotation expected but none configured"  // Message only, no fields
);

tracing::warn!(
    // ... (presumably uses some fields but not shown)
    "User account link declined"
);

// middleware/csrf.rs - Different again:
tracing::warn!(
    origin = %origin,  // Field name: "origin" (no prefix)
    expected = %expected,  // Field name: "expected"
    "CSRF token mismatch"
);
```

**Issue**:
1. Field names inconsistent: `error.type` vs `origin` vs `operation`
2. Some logs structured, some are just strings
3. Nested names inconsistent: `db.operation` vs `operation` vs `db_operation`
4. Makes querying logs harder (unsure what field names to use)

**Solution**: Establish structured field naming convention.

```rust
// Naming Convention for Structured Fields:
//
// Category.Subcategory format for related fields:
// - error.type (e.g., "database", "oauth", "validation")
// - error.message (the error message)
// - db.operation (create, read, update, delete)
// - db.table (table name)
// - db.user_id (affected user)
// - db.entity_id (affected entity)
// - auth.user_id (authenticated user)
// - auth.provider (oauth provider)
// - http.method (GET, POST, etc.)
// - http.uri (request path)
// - http.status (response status code)
// - duration_ms (operation duration in milliseconds)
// - operation (general operation name if single-category)

// APPLY CONSISTENTLY:

// error.rs - STANDARDIZED
tracing::error!(
    error.type = "database",
    db.operation = %operation,
    db.table = %table,
    db.user_id = ?user_id,
    error.message = %message,
    "Database query failed"
);

// state.rs - STANDARDIZED (add structured fields)
tracing::error!(
    error.type = "config",
    error.message = "DATABASE_URL not configured",
    "Database configuration missing"
);

let db = PgPoolOptions::new(...)
    .connect(&config.database.url)
    .await
    .map_err(|e| {
        tracing::error!(
            error.type = "connection",
            error.message = %e,
            "Failed to connect to database"
        );
        e
    })?;

// middleware/csrf.rs - STANDARDIZED
tracing::warn!(
    error.type = "csrf",
    http.origin = %origin,
    expected_origin = %expected,
    "CSRF token mismatch"
);

// services/auth.rs - STANDARDIZED
tracing::warn!(
    operation = "session_rotation",
    error.message = "No session configured for rotation",
    "Session rotation skipped"
);
```

**Impact**: Consistent logging structure, easier to query and aggregate logs.  
**Effort**: 0.2 hours

---

### STRUCT-2: Missing Important Context Fields in Logs
**Location**: Logs throughout codebase  
**Example**:

```rust
// routes/quests.rs - Missing user context in potential errors
async fn list_quests(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<ListQuestsQuery>,
) -> Result<Json<QuestsListWrapper>, AppError> {
    // User context available but not in logs
    let result = QuestsRepo::list(&state.db, user.id, query.status.as_deref()).await?;
    Ok(Json(QuestsListWrapper { quests: result.quests, total: result.total }))
}

// If error occurs, no log shows:
// - user.id (which user tried to list quests?)
// - user.email (for support requests)
// - operation timing (how long did it take?)
// - request parameters (what filters did they use?)

// routes/reference.rs - Some context missing
tracing::warn!("Failed to delete R2 object {}: {}", track.r2_key, e);
// Missing:
// - user_id (who initiated delete?)
// - operation name
// - error type (network, auth, not found?)
```

**Issue**:
1. User context not logged in handlers
2. Operation timing not tracked
3. Request parameters not logged
4. Makes debugging harder

**Solution**: Add context fields to handler logs.

```rust
// routes/quests.rs - WITH FULL CONTEXT
async fn list_quests(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<User>,
    Query(query): Query<ListQuestsQuery>,
) -> Result<Json<QuestsListWrapper>, AppError> {
    let start = Instant::now();
    
    tracing::debug!(
        auth.user_id = %user.id,
        operation = "list_quests",
        status_filter = ?query.status,
        "Request started"
    );
    
    let result = QuestsRepo::list(&state.db, user.id, query.status.as_deref())
        .await
        .map_err(|e| {
            tracing::warn!(
                auth.user_id = %user.id,
                operation = "list_quests",
                error.type = "database",
                error.message = %e,
                duration_ms = start.elapsed().as_millis(),
                "Operation failed"
            );
            e
        })?;
    
    tracing::info!(
        auth.user_id = %user.id,
        operation = "list_quests",
        quest_count = result.quests.len(),
        duration_ms = start.elapsed().as_millis(),
        "Operation completed"
    );
    
    Ok(Json(QuestsListWrapper { quests: result.quests, total: result.total }))
}

// routes/reference.rs - WITH FULL CONTEXT
tracing::warn!(
    auth.user_id = %user.id,
    operation = "delete_reference",
    storage.key = %track.r2_key,
    error.type = "storage",
    error.message = %e,
    "Failed to delete storage object"
);
```

**Impact**: Better debugging with complete context.  
**Effort**: 0.2 hours

---

## ISSUE CATEGORY: FORMAT CONSISTENCY (1 issue, 0.25 hours)

### FMT-1: Mix of Structured and Unstructured Logging
**Location**: Various files  
**Pattern**:

```rust
// Structured (good):
tracing::error!(
    error.type = "database",
    db.operation = %operation,
    db.table = %table,
    error.message = %message,
    "Database query failed"
);

// Semi-structured (ok):
tracing::error!("Failed to connect to database: {}", e);

// Unstructured (bad):
tracing::warn!("{}", "=".repeat(60));  // Visual separator - not structured!

// No context fields (bad):
tracing::debug!("CSRF check skipped - dev mode enabled on localhost");
// Should be:
tracing::debug!(
    mode = "dev",
    host = %host,
    "CSRF check skipped"
);
```

**Issue**:
1. Some logs are fully structured (queryable)
2. Some are semi-structured (message + interpolation)
3. Some are completely unstructured
4. Visual separators in logs (==== lines)
5. Inconsistent makes aggregation harder

**Solution**: Standardize on structured logging.

```rust
// Rust tracing best practice:
// - Always use structured fields when available
// - Message for human-readable summary
// - Fields for searchable/filterable context

// BEFORE (unstructured):
tracing::error!("OAuth error: {}", msg);

// AFTER (structured):
tracing::error!(
    operation = "oauth_authenticate",
    error.type = "oauth",
    error.message = %msg,
    "OAuth authentication failed"
);

// BEFORE (visual separator - anti-pattern):
tracing::warn!("{}", "=".repeat(60));

// AFTER (use spans for grouping):
let span = tracing::info_span!(
    "startup",
    component = "server"
);
let _guard = span.enter();
tracing::info!("Server starting");
// ... more operations within span
tracing::info!("Server ready");  // All logs in span have context
```

**Impact**: Consistent, queryable logging for better observability.  
**Effort**: 0.25 hours

---

## ISSUE CATEGORY: CONFIGURATION (1 issue, 0.2 hours)

### CONF-1: Missing Log Filter Configuration Documentation
**Location**: main.rs logging setup  
**Current Code**:

```rust
// main.rs
tracing_subscriber::registry()
    .with(
        tracing_subscriber::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "ignition_api=debug,tower_http=debug".into()),
    )
    .with(tracing_subscriber::fmt::layer().json())
    .init();
```

**Issue**:
1. Default filter hardcoded to "ignition_api=debug"
2. No documentation of what logs appear at each level
3. Changing filters requires code change + redeploy
4. tower_http logs included but purpose not documented

**Solution**: Document and make configurable.

```rust
// main.rs - IMPROVED
// Load filter from env var with documented default
let default_filter = std::env::var("RUST_LOG")
    .unwrap_or_else(|_| {
        // Default filter for all environments:
        // ignition_api = debug (our app logs)
        // tower_http = debug (HTTP middleware logs)
        // sqlx = warn (avoid chatty query logs)
        "ignition_api=debug,tower_http=debug,sqlx=warn".into()
    });

tracing_subscriber::registry()
    .with(
        tracing_subscriber::EnvFilter::new(default_filter)
    )
    .with(tracing_subscriber::fmt::layer().json())
    .init();

// Create docs/LOGGING.md documenting filter options:
/*
# Logging Configuration

## Log Levels

- **TRACE**: Very detailed diagnostic info (rarely needed)
- **DEBUG**: Development/troubleshooting logs
- **INFO**: Operational events (startup, requests)
- **WARN**: Warning conditions (optional features disabled)
- **ERROR**: Errors (unexpected failures)

## Environment Variable: RUST_LOG

Set `RUST_LOG` to configure log filtering:

```bash
# Production (minimal logging)
RUST_LOG=ignition_api=info,tower_http=info,sqlx=warn

# Development (detailed logging)
RUST_LOG=ignition_api=debug,tower_http=debug,sqlx=debug

# Debugging specific module
RUST_LOG=ignition_api::db::habits_goals_repos=trace

# All details
RUST_LOG=trace
```

## Output Format

Logs are output as JSON for easy parsing by log aggregation systems:

```json
{
  "timestamp": "2026-01-15T10:30:45Z",
  "level": "INFO",
  "fields": {
    "message": "Request completed",
    "auth.user_id": "12345-uuid",
    "http.status": 200,
    "duration_ms": 125
  },
  "target": "ignition_api::routes"
}
```
*/
```

**Impact**: Easier log configuration in production.  
**Effort**: 0.2 hours

---

## ISSUE CATEGORY: PERFORMANCE (1 issue, 0.15 hours)

### PERF-1: Potential Expensive Operations in Logs
**Location**: routes/admin.rs or other files with string formatting  
**Pattern**:

```rust
// routes/admin.rs
tracing::warn!("{}", "=".repeat(60));  // Creates string for every log call!

// Potential issues:
// - String allocation in logging path
// - If log level filters this out, wasted work
// - Repeated in loop could be expensive
```

**Issue**:
1. Visual separators create string allocations
2. Expensive operations in log messages (format!, repeat, etc.)
3. Can impact performance if logging is in hot path

**Solution**: Avoid expensive operations in log arguments.

```rust
// BEFORE (expensive):
tracing::warn!("{}", "=".repeat(60));

// AFTER (better):
tracing::warn!("Server startup complete");
// Or use once at startup only:
eprintln!("{}", "=".repeat(60));  // Direct to stderr once, not through tracing

// If logging expensive data, guard with level check:
// BEFORE (expensive if filtered out):
tracing::debug!("Query result: {:?}", expensive_debug_format(&result));

// AFTER (conditional, avoid work if filtered):
if tracing::enabled!(tracing::Level::DEBUG) {
    tracing::debug!("Query result: {:?}", expensive_debug_format(&result));
}
```

**Impact**: Better logging performance, no unnecessary allocations.  
**Effort**: 0.15 hours

---

## IMPLEMENTATION ROADMAP

### Phase 1: Standardize Log Levels (0.25 hours)
- [ ] Create LOGGING.md with level conventions
- [ ] Update log levels to match conventions
- [ ] INFO for operational events
- [ ] WARN for optional features not available
- [ ] ERROR for unexpected failures
- [ ] DEBUG for diagnostic info

### Phase 2: Add Request Logging (0.25 hours)
- [ ] Add INFO logs for request start/end
- [ ] Include user_id in all logs
- [ ] Add operation name to all logs
- [ ] Add duration_ms to completion logs

### Phase 3: Standardize Field Names (0.2 hours)
- [ ] Document field naming convention
- [ ] Update all structured logs to use standard names
- [ ] Use error.type, db.table, auth.user_id, http.status, etc.
- [ ] Add missing context fields

### Phase 4: Fix Format Issues (0.25 hours)
- [ ] Replace unstructured logs with structured version
- [ ] Remove visual separators from tracing
- [ ] Ensure all logs have message + fields

### Phase 5: Configuration (0.2 hours)
- [ ] Make RUST_LOG configurable
- [ ] Create LOGGING.md documentation
- [ ] Add log filter to README

### Phase 6: Performance Review (0.15 hours)
- [ ] Check for expensive operations in log paths
- [ ] Add level guards for expensive operations
- [ ] Benchmark if needed

---

## VALIDATION CHECKLIST

### Log Levels
- [ ] TRACE/DEBUG for diagnostic info
- [ ] INFO for operational events
- [ ] WARN for degraded state (optional features disabled)
- [ ] ERROR for unexpected failures
- [ ] Consistent across similar scenarios

### Structured Logging
- [ ] All logs use structured fields where possible
- [ ] Field names follow convention (error.type, db.table, etc.)
- [ ] User context in all handler logs
- [ ] Operation name in all business logic logs
- [ ] Duration in async operations

### Context
- [ ] Request entry/exit logged
- [ ] User ID in all user-scoped operations
- [ ] Operation name documented
- [ ] Error types specified (database, oauth, etc.)

### Configuration
- [ ] RUST_LOG environment variable respected
- [ ] Default filter appropriate for environment
- [ ] Documentation explains log levels and filters

### Performance
- [ ] No expensive operations in log arguments
- [ ] No string allocations for conditional logs
- [ ] No logging in tight loops without guards

---

## SUMMARY

Backend logging is **generally good but has consistency issues**:

**Highest Priority**: Standardize log levels and add request context logging.

**Important**: Standardize field names in structured logs for easier querying.

**Quality**: Remove unstructured logs and visual separators, use spans instead.

**Quick Wins**:
- Document log level conventions (0.25 hours)
- Add request entry/exit logging to handlers (0.25 hours)
- Standardize field names (0.2 hours)
- Create LOGGING.md documentation (0.2 hours)

**Total Effort**: 1.5-2 hours to improve consistency.

**ROI**:
- Consistent log levels: easier to filter and alert
- Structured fields: logs become queryable and aggregatable
- Context fields: easier debugging with full request context
- Configuration: RUST_LOG env var for flexible log filtering
- Performance: no unnecessary allocations in log paths
