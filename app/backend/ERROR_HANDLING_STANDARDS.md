# ERROR HANDLING STANDARDS

**Version**: 1.0  
**Last Updated**: January 15, 2026  
**Status**: Active Standard  
**Authority**: Backend Error Type System  

---

## OVERVIEW

This document defines error handling patterns for the Passion OS backend. All error creation, logging, and response mapping follows these standards to ensure consistency and maintainability.

---

## ERROR TYPE CONSTANTS

All error response types are defined in `error::error_types` module. Always use these constants instead of hardcoding error type strings:

```rust
use crate::error::error_types::*;

// ✅ CORRECT - Using constants
let error_type = NOT_FOUND;

// ❌ WRONG - Hardcoded string
let error_type = "not_found";
```

### Available Error Types

| Constant | HTTP Status | Use Case |
|----------|-------------|----------|
| `NOT_FOUND` | 404 | Resource does not exist |
| `UNAUTHORIZED` | 401 | Authentication required (no credentials) |
| `FORBIDDEN` | 403 | Access denied (authenticated but no permission) |
| `CSRF_VIOLATION` | 403 | CSRF token validation failed |
| `INVALID_ORIGIN` | 403 | Origin header validation failed |
| `BAD_REQUEST` | 400 | Client error, invalid input |
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `OAUTH_ERROR` | 400 | OAuth/auth provider error |
| `SESSION_EXPIRED` | 401 | Session timeout or invalid session |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `CONFIG_ERROR` | 500 | Configuration/startup error |
| `STORAGE_ERROR` | 500 | R2/storage operation failed |

---

## ERROR CONSTRUCTION

Use constructor helper methods for ergonomic, consistent error creation:

### Simple Errors (with message)

```rust
// NotFound, Unauthorized, BadRequest, Validation, etc.
Err(AppError::not_found("User not found"))
Err(AppError::unauthorized("Invalid credentials"))
Err(AppError::bad_request("Missing required field: email"))
Err(AppError::validation("Email format invalid"))
Err(AppError::oauth_error("Google OAuth failed"))
Err(AppError::internal("Unexpected error"))
Err(AppError::config("DATABASE_URL not set"))
Err(AppError::storage("Failed to upload file"))
```

### Forbidden (no message required)

```rust
// Forbidden is static, no message
Err(AppError::forbidden())
```

### Database Errors (with context)

```rust
// Legacy simple format - use only for simple cases
Err(AppError::database("Query failed"))

// Recommended: Use detailed context
Err(AppError::database_with_context(
    "fetch_user",
    "users",
    format!("Query failed: {}", e),
    Some(user_id),
))

// With entity ID (for tracking specific record issues)
Err(AppError::database_with_entity(
    "update_habit",
    "habits",
    format!("Constraint violation: {}", e),
    Some(user_id),
    Some(habit_id),
))
```

### Constructor Examples in Code

```rust
// In a handler
pub async fn get_user(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<User, AppError> {
    sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::not_found("User not found"))
}

// In a repository
pub async fn update_quest(
    pool: &PgPool,
    user_id: Uuid,
    quest_id: Uuid,
    status: &str,
) -> Result<Quest, AppError> {
    sqlx::query_as::<_, Quest>(
        "UPDATE quests SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *"
    )
    .bind(status)
    .bind(quest_id)
    .bind(user_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| AppError::database_with_context(
        "update_quest",
        "quests",
        e.to_string(),
        Some(user_id),
    ))?
    .ok_or_else(|| AppError::not_found(format!("Quest {} not found", quest_id)))
}

// Validation
pub fn validate_email(email: &str) -> Result<(), AppError> {
    if !email.contains('@') {
        return Err(AppError::validation("Email must contain @"));
    }
    Ok(())
}
```

---

## ERROR RESPONSE FORMAT

All errors are serialized to this standard JSON format:

```json
{
  "error": "error_type",
  "message": "Human-readable error message"
}
```

### Examples

**Not Found**:
```json
{
  "error": "not_found",
  "message": "User not found"
}
```

**Validation Error**:
```json
{
  "error": "validation_error",
  "message": "Email format invalid"
}
```

**Database Error**:
```json
{
  "error": "database_error",
  "message": "Database error in update_quest on quests"
}
```

---

## ERROR LOGGING

### Logging Levels

| Error Type | Level | Reason |
|-----------|-------|--------|
| `NOT_FOUND` | **WARN** | Client issue (requested missing resource) |
| `UNAUTHORIZED` | **WARN** | Auth failure (expected during normal usage) |
| `FORBIDDEN` | **INFO** | Auth check (normal for access denied) |
| `BAD_REQUEST` | **WARN** | Client error (malformed input) |
| `VALIDATION_ERROR` | **WARN** | Client error (invalid data) |
| `SESSION_EXPIRED` | **INFO** | Normal lifecycle event |
| `DATABASE_ERROR` | **ERROR** | Server issue (data layer failure) |
| `OAUTH_ERROR` | **ERROR** | External service issue |
| `INTERNAL_ERROR` | **ERROR** | Unexpected server error |
| `CONFIG_ERROR` | **ERROR** | Startup/configuration issue |
| `STORAGE_ERROR` | **ERROR** | External service issue (R2) |
| `CSRF_VIOLATION` | **WARN** | Security check (expected for attacks) |
| `INVALID_ORIGIN` | **WARN** | Security check (expected for attacks) |

### Structured Logging Pattern

All errors are logged with structured fields for searchability:

```rust
// In error.rs IntoResponse impl, each error logs consistently:

tracing::error!(
    error.type = "database",
    db.operation = %operation,
    db.table = %table,
    user_id = ?user_id,
    error.message = %message,
    "Database operation failed"
);
```

### Required Fields by Error Type

| Error Type | Fields | Purpose |
|-----------|--------|---------|
| Database | `error.type`, `db.operation`, `db.table`, `error.message` | Audit trail for data failures |
| OAuth | `error.type`, `provider`, `error.message` | Auth debugging |
| Config | `error.type`, `error.message` | Startup debugging |
| NotFound | `error.type` (optional) | Not logged (client issue) |
| BadRequest | `error.type` (optional) | Not logged (client issue) |

---

## COMMON PATTERNS

### Pattern 1: Resource Not Found

```rust
// Handler or repository
let user = sqlx::query_as::<_, User>(...)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::not_found("User not found"))?;
```

### Pattern 2: Validation

```rust
// Validate input
if email.is_empty() {
    return Err(AppError::validation("Email cannot be empty"));
}

if !email.contains('@') {
    return Err(AppError::validation("Email must contain @"));
}
```

### Pattern 3: Database with Context

```rust
// When database error occurs, include operation context
let result = sqlx::query(...)
    .execute(pool)
    .await
    .map_err(|e| AppError::database_with_context(
        "insert_habit",
        "habits",
        e.to_string(),
        Some(user_id),
    ))?;
```

### Pattern 4: OAuth/External Service

```rust
// External service failures
let token = fetch_google_token(code)
    .await
    .map_err(|e| AppError::oauth_error(format!("Google OAuth failed: {}", e)))?;
```

### Pattern 5: Permission Check

```rust
// Authorization failures
if !user.is_admin {
    return Err(AppError::forbidden());
}
```

---

## CODE REVIEW CHECKLIST

When reviewing error handling:

- [ ] **Error Constructor**: Uses helper method (`.not_found()`, etc.), not enum variant
- [ ] **Error Type**: Uses `error_types::*` constant, not hardcoded string
- [ ] **Error Message**: Includes helpful context (what resource, why it failed)
- [ ] **Database Errors**: Use `database_with_context()` when possible
- [ ] **Logging Level**: Appropriate level (ERROR for 5xx, WARN for 4xx)
- [ ] **Structured Fields**: Includes operation, table, user_id when relevant
- [ ] **User Visibility**: Public errors don't leak internal details
- [ ] **Testing**: Error cases tested with expected error types/messages

---

## MIGRATION GUIDE

When refactoring old error handling:

### Before (Hardcoded)
```rust
Err(AppError::NotFound("User not found".to_string()))
```

### After (Using Helpers)
```rust
Err(AppError::not_found("User not found"))
```

### Before (Hardcoded Error Type String)
```rust
let error_type = "not_found";  // Hardcoded
```

### After (Using Constant)
```rust
use crate::error::error_types::NOT_FOUND;
let error_type = NOT_FOUND;
```

### Before (Legacy Database Error)
```rust
Err(AppError::Database(format!("Query failed: {}", e)))
```

### After (Contextualized)
```rust
Err(AppError::database_with_context(
    "fetch_user",
    "users",
    e.to_string(),
    Some(user_id),
))
```

---

## FREQUENTLY ASKED QUESTIONS

**Q: When should I use `database()` vs `database_with_context()`?**  
A: Use `database_with_context()` for database errors in handlers and repositories. Use `database()` only for simple cases where context isn't available (rare).

**Q: Should I log in the handler OR in the error IntoResponse?**  
A: Log in the error IntoResponse. That's where we have the full error context and can use structured fields consistently.

**Q: Can I create custom error variants?**  
A: Avoid it. Add to the AppError enum only for fundamentally new error types. Most cases fit existing variants with different messages.

**Q: What if I need to pass sensitive data in an error?**  
A: Never. The error message is sent to clients. Use `message` for public info, `tracing::error!()` structured fields for logging sensitive data.

**Q: How do I handle multiple errors?**  
A: Return the first error that prevents continuation. For validation, collect all errors and return in the message: `"Validation errors: email missing, password too short"`.

---

## RELATED DOCUMENTATION

- [LOGGING_STANDARDS.md](LOGGING_STANDARDS.md) - Log level and structured field conventions
- [IMPORT_CONVENTIONS.md](IMPORT_CONVENTIONS.md) - Import organization for error handling code
- `app/backend/crates/api/src/error.rs` - Error type definitions and IntoResponse impl
