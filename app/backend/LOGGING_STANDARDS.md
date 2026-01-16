# Logging Standards & Best Practices

**Date**: January 15, 2026  
**Status**: ACTIVE  
**Applies To**: All Rust code in `app/backend/crates/api/src/`

## Table of Contents
1. [Log Levels](#log-levels)
2. [Structured Logging](#structured-logging)
3. [Field Naming Conventions](#field-naming-conventions)
4. [Request ID Tracking](#request-id-tracking)
5. [Performance Guidelines](#performance-guidelines)
6. [Common Scenarios](#common-scenarios)

---

## Log Levels

Use the following levels consistently across the entire codebase:

### TRACE (Level 0)
**Purpose**: Ultra-detailed diagnostic information (rarely used)

**When to use**:
- Entry/exit of internal helper functions
- Variable value inspection in complex algorithms
- Detailed state transitions in state machines

**Example**:
```rust
tracing::trace!(
    input = ?value,
    "Processing item in batch operation"
);
```

**Considerations**: Performance impact if enabled; rarely needed in production

---

### DEBUG (Level 1)
**Purpose**: Diagnostic information useful for troubleshooting

**When to use**:
- Development and testing scenarios
- Request/response details (request ID, timing)
- Feature flag states
- Configuration values (non-sensitive)
- Retry attempts
- Middleware operations

**Example**:
```rust
tracing::debug!(
    request_id = %req_id,
    path = %req.uri(),
    method = %req.method(),
    "Incoming request"
);

tracing::debug!(
    csrf_token = "***",
    "CSRF validation check"
);
```

**Note**: Safe to enable in development; typically disabled in production

---

### INFO (Level 2)
**Purpose**: General operational information - things that should normally happen

**When to use**:
- Server startup/shutdown
- Feature enabled/disabled (as expected)
- Successful completion of important operations
- Configuration accepted
- Optional features initialized
- Deployment/environment info

**Example**:
```rust
tracing::info!(
    listen_addr = %config.server.listen_addr,
    "Server listening"
);

tracing::info!(
    user_id = %user_id,
    "User authenticated successfully"
);

tracing::info!(
    feature = "storage_client",
    "Feature disabled - R2 not configured"
);
```

**Rule**: Every request should generate ~1 INFO log at completion

---

### WARN (Level 3)
**Purpose**: Warning conditions - something unexpected but recoverable

**When to use**:
- Optional feature failed to initialize (with fallback)
- Configuration value missing (using sensible default)
- Retry happening due to transient failure
- Deprecated API usage
- Performance degradation detected
- Data inconsistency detected
- Request rejected (invalid input)

**Example**:
```rust
tracing::warn!(
    error = %err,
    "Storage client failed to initialize - using fallback"
);

tracing::warn!(
    retry_count = retries,
    backoff_ms = backoff.as_millis(),
    "Retrying request after transient failure"
);

tracing::warn!(
    request_id = %req_id,
    "Invalid request: missing required field"
);
```

**Rule**: Warn if an operation degraded but the system continues functioning

---

### ERROR (Level 4)
**Purpose**: Error conditions - something that should not happen

**When to use**:
- Required configuration missing
- Database connection failed
- Unexpected business logic error
- Data corruption detected
- Authorization failure (actual error)
- Unhandled exceptions

**Example**:
```rust
tracing::error!(
    error = %err,
    "Database connection failed"
);

tracing::error!(
    user_id = %user_id,
    error_type = "AchievementAlreadyUnlocked",
    "Unexpected state: achievement already unlocked"
);

tracing::error!(
    request_id = %req_id,
    path = %req.uri(),
    "Internal server error"
);
```

**Rule**: Every ERROR should have a root cause and be actionable

---

## Structured Logging

Always use **structured fields** instead of string interpolation:

### ✅ CORRECT - Structured
```rust
tracing::info!(
    user_id = %user_id,
    habit_id = %habit_id,
    xp_awarded = 100,
    streak_bonus = true,
    "Habit completed successfully"
);

tracing::error!(
    error = %err,
    error_type = "DatabaseError",
    operation = "create_user",
    "Operation failed"
);
```

### ❌ WRONG - String Interpolation
```rust
tracing::info!("User {} completed habit {}, awarded 100 XP", user_id, habit_id);
tracing::error!("Operation failed: {}", err);
```

**Why**: Structured fields are
- Searchable in log aggregation systems (ELK, Datadog, etc.)
- Parseable for alerts and dashboards
- Include type information
- More performant (lazy evaluation)

---

## Field Naming Conventions

Use these standardized field names:

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `request_id` | UUID | `%req_id` | Propagated via middleware |
| `user_id` | UUID | `%user_id` | Never `user` or `user_uuid` |
| `habit_id` | UUID | `%habit_id` | Domain-specific IDs |
| `quest_id` | UUID | `%quest_id` | Follows: `{domain}_id` |
| `error` | Display | `%err` | Error type and message |
| `error_type` | String | `"DatabaseError"` | Enum or category |
| `operation` | String | `"create_habit"` | Action being performed |
| `status_code` | u16 | `200` | HTTP status |
| `duration_ms` | u128 | `45` | Operation timing |
| `count` | i32 | `5` | Numeric counters |
| `retry_count` | u32 | `3` | Number of retries |
| `feature` | String | `"storage_client"` | Feature name |

### Naming Rules

1. **Use snake_case** for all field names
2. **Domain-specific**: Use `habit_id`, `quest_id`, not generic `id`
3. **Type-safe**: Use `%` for Display, `?` for Debug, bare for numbers
4. **Consistent**: Same field name across all logs for searchability

### Example

```rust
tracing::info!(
    request_id = %req_id,
    user_id = %user_id,
    habit_id = %habit_id,
    status_code = 200,
    duration_ms = elapsed.as_millis() as u128,
    "Request completed"
);
```

---

## Request ID Tracking

Every request must have a `request_id` for tracing:

### Middleware Implementation

```rust
// middleware/request_id.rs
pub async fn request_id_middleware(
    mut req: Request,
    next: Next,
) -> Response {
    let request_id = Uuid::new_v4();
    
    // Store in request extensions for use in handlers
    req.extensions_mut().insert(request_id);
    
    // Log request entry
    tracing::debug!(
        request_id = %request_id,
        method = %req.method(),
        path = %req.uri(),
        "Request started"
    );
    
    let response = next.run(req).await;
    
    // Log request completion
    tracing::info!(
        request_id = %request_id,
        status = response.status().as_u16(),
        "Request completed"
    );
    
    response
}
```

### Usage in Handlers

```rust
// In any route handler
use axum::Extension;

async fn create_habit(
    Extension(request_id): Extension<Uuid>,
    Json(req): Json<CreateHabitRequest>,
) -> Result<Json<HabitResponse>> {
    tracing::info!(
        request_id = %request_id,
        name = req.name,
        "Creating habit"
    );
    
    // ... handler logic ...
    
    tracing::info!(
        request_id = %request_id,
        habit_id = %habit.id,
        "Habit created successfully"
    );
    
    Ok(Json(response))
}
```

**Rule**: Every internal operation should include `request_id` for end-to-end tracing

---

## Performance Guidelines

### ❌ DO NOT LOG
- In hot paths (request handlers for every request - use DEBUG instead)
- In loops processing large datasets
- Sensitive data (passwords, tokens, email addresses)
- Raw query results (log operation summary instead)

### ✅ DO LOG
- Request entry/exit (INFO level)
- Error conditions (ERROR/WARN)
- Feature initialization (INFO)
- Significant state changes (INFO)
- Performance anomalies (WARN)

### Example: Hot Path

```rust
// ❌ WRONG - INFO in loop
async fn process_batch(items: Vec<Item>) -> Result<()> {
    for item in items {
        tracing::info!("Processing item {}", item.id);  // TOO MUCH
        process_item(item).await?;
    }
    Ok(())
}

// ✅ CORRECT - Single summary log
async fn process_batch(items: Vec<Item>) -> Result<()> {
    let count = items.len();
    for item in items {
        process_item(item).await?;
    }
    tracing::info!(count, "Batch processing completed");
    Ok(())
}
```

---

## Common Scenarios

### Database Operation

```rust
// Connection failure (ERROR - required)
tracing::error!(
    error = %err,
    operation = "connect_database",
    "Failed to establish database connection"
);

// Query execution (DEBUG - diagnostic)
tracing::debug!(
    query = "SELECT * FROM habits WHERE user_id = $1",
    request_id = %req_id,
    "Executing query"
);

// Query completed (INFO - operational)
tracing::info!(
    operation = "fetch_habits",
    count = 5,
    duration_ms = elapsed.as_millis() as u128,
    "Query completed"
);
```

### Authentication

```rust
// Invalid credentials (WARN - handled)
tracing::warn!(
    email = %email,
    attempt = 3,
    "Authentication failed: invalid credentials"
);

// Auth success (DEBUG - diagnostic)
tracing::debug!(
    user_id = %user_id,
    provider = "google",
    "User authenticated"
);

// Session started (INFO - operational)
tracing::info!(
    user_id = %user_id,
    session_id = %session.id,
    "User session created"
);
```

### Feature Initialization

```rust
// Optional feature not available (WARN - expected)
tracing::warn!(
    feature = "storage_client",
    reason = "R2 credentials not configured",
    "Feature disabled - using fallback"
);

// Feature initialized (INFO - operational)
tracing::info!(
    feature = "storage_client",
    endpoint = config.storage.endpoint,
    "Feature initialized"
);

// Feature enabled by config (INFO - operational)
tracing::info!(
    feature = "oauth_google",
    status = "enabled",
    "Feature ready"
);
```

### Error Handling

```rust
// Expected error from user input (WARN)
tracing::warn!(
    error_type = "ValidationError",
    field = "email",
    reason = "Invalid email format",
    "Request validation failed"
);

// Unexpected system error (ERROR)
tracing::error!(
    error = %err,
    error_type = "UnexpectedDatabaseState",
    operation = "fetch_user",
    "System error occurred"
);

// Retrying on failure (DEBUG)
tracing::debug!(
    retry_count = attempt,
    error = %err,
    backoff_ms = backoff_duration.as_millis(),
    "Retrying operation"
);
```

---

## Validation Checklist

Before committing code with logging:

- [ ] All log levels follow convention (ERROR for failures, WARN for degradation, INFO for operations)
- [ ] Structured fields used (no string interpolation)
- [ ] Field names use standardized names (user_id, not user; habit_id, not id)
- [ ] No sensitive data logged (passwords, tokens, full email addresses)
- [ ] request_id included in relevant logs
- [ ] No excessive logging in hot paths
- [ ] Error context preserved (use `%err`, not just `{:?}`)
- [ ] Startup configuration logged (which features enabled)

---

## Implementation Timeline

- **Phase 1**: Define standards (COMPLETE - this document)
- **Phase 2**: Audit existing logs for consistency
- **Phase 3**: Fix log level violations
- **Phase 4**: Standardize field names
- **Phase 5**: Add request ID tracking middleware
