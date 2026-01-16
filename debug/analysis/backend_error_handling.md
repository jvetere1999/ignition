# BACKEND ERROR HANDLING ANALYSIS

**Component**: Error Handling & Responses  
**File**: `app/backend/crates/api/src/error.rs` (195 lines)

**Total Lines Analyzed**: 195 lines  
**Issues Identified**: 14  
**Effort Estimate**: 3.5-4 hours  

**Issue Breakdown**:
- 3 Common Operations (consolidate patterns)
- 4 Cleanups (improve consistency)
- 2 Documentation improvements
- 2 Deprecations (legacy error variants)
- 3 Linting and structure improvements

**Critical Findings**: 1 concern - inconsistent error logging detail (some errors log details, others don't)

---

## ISSUE CATEGORY: COMMON OPERATIONS (3 issues, 1.5 hours)

### OP-1: Repeated Error Type to HTTP Status Mapping
**Location**: `error.rs:90-165`  
**Pattern**: Match block maps AppError variants to (StatusCode, error_type_string, message_string)

```rust
// Lines 90-165: 16 match arms doing similar conversions
let (status, error_type, message) = match &self {
    AppError::NotFound(msg) => (StatusCode::NOT_FOUND, "not_found", msg.clone()),
    AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, "unauthorized", msg.clone()),
    AppError::Forbidden => (StatusCode::FORBIDDEN, "forbidden", "Forbidden".to_string()),
    // ... 13 more arms with similar structure
};
```

**Issue**: 
1. Each error variant REQUIRES manual match arm in IntoResponse impl
2. Adding new error variant forces changes to IntoResponse impl
3. Status codes and strings scattered across large match block
4. No single place to change all error type strings

**Solution**: Create trait or method that encapsulates error metadata.

```rust
impl AppError {
    /// Get (StatusCode, error_type_string, message_string) for response
    fn response_metadata(&self) -> (StatusCode, &'static str, String) {
        match self {
            Self::NotFound(msg) => (StatusCode::NOT_FOUND, "not_found", msg.clone()),
            Self::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, "unauthorized", msg.clone()),
            // ... rest of mapping
        }
    }
}

// In IntoResponse:
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_type, message) = self.response_metadata();
        
        let body = ErrorResponse {
            error: error_type.to_string(),
            message,
            code: None,
        };

        (status, Json(body)).into_response()
    }
}
```

**Impact**: Centralizes all status code mappings, easier to add new error types.  
**Effort**: 0.5 hours (extract method, verify tests)

---

### OP-2: Redundant Error String Conversions
**Location**: `error.rs:90-130`  
**Pattern**: Many match arms convert &str to String unnecessarily

```rust
AppError::Forbidden => (StatusCode::FORBIDDEN, "forbidden", "Forbidden".to_string()),
AppError::CsrfViolation => (..., "csrf_violation", "CSRF validation failed".to_string()),
AppError::InvalidOrigin => (..., "invalid_origin", "Invalid origin".to_string()),
AppError::SessionExpired => (..., "session_expired", "Session has expired".to_string()),
```

**Issue**: Calling `.to_string()` on string literals creates allocations unnecessarily. String is owned, could be `String` or just &'static str.

**Solution**: Use &'static str for static messages, only convert when message is dynamic.

```rust
impl AppError {
    fn response_metadata(&self) -> (StatusCode, &'static str, String) {
        match self {
            Self::NotFound(msg) => (StatusCode::NOT_FOUND, "not_found", msg.clone()),
            Self::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, "unauthorized", msg.clone()),
            // Dynamic cases: message comes from variant
            
            Self::Forbidden => (StatusCode::FORBIDDEN, "forbidden", "Forbidden"),  // Note: &'static str
            Self::CsrfViolation => (StatusCode::FORBIDDEN, "csrf_violation", "CSRF validation failed"),
            // ... static cases as &'static str
        }
    }
}

// But return type needs adjustment:
fn response_metadata(&self) -> (StatusCode, &'static str, std::borrow::Cow<'static, str>) {
    // Use Cow to handle both static and dynamic strings
}
```

**Impact**: Reduces string allocations for common error paths.  
**Effort**: 0.5 hours (change string types, verify return type)

---

### OP-3: Error Logging Implementation Inconsistency
**Location**: `error.rs:110-185`  
**Pattern**: Some error variants log details, others don't

```rust
// Line 110: Logs details
AppError::OAuthError(msg) => {
    tracing::error!("OAuth error: {}", msg);
    (StatusCode::BAD_REQUEST, "oauth_error", msg.clone())
}

// Line 117: No logging before match
AppError::Database(e) => {
    tracing::error!(error.type = "database", error.message = %e, "Database error (legacy)");
    (StatusCode::INTERNAL_SERVER_ERROR, "database_error", "Database error".to_string())
}

// Line 150: No logging at all (relies on handler)
AppError::SessionExpired => (StatusCode::UNAUTHORIZED, "session_expired", "...")

// Line 160: Different logging format
AppError::Config(msg) => {
    tracing::error!(error.type = "config", error.message = %msg, "Configuration error");
    (StatusCode::INTERNAL_SERVER_ERROR, "config_error", "...")
}
```

**Issue**: 
1. Some errors log (OAuthError, Database, Config)
2. Some don't (SessionExpired, NotFound, Unauthorized)
3. Logging format inconsistent (some use structured fields, some don't)
4. Makes observability gaps hard to spot

**Solution**: Consistent logging for all error variants or explicit skip with comment.

```rust
impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        // Log all errors consistently
        self.log_error();
        
        let (status, error_type, message) = self.response_metadata();
        // ...
    }
}

impl AppError {
    fn log_error(&self) {
        match self {
            Self::NotFound(msg) => {
                tracing::warn!(error.type = "not_found", error.message = %msg, "Resource not found");
            }
            Self::Unauthorized(msg) => {
                tracing::warn!(error.type = "unauthorized", error.message = %msg, "Unauthorized access");
            }
            Self::Database(msg) => {
                tracing::error!(error.type = "database", error.message = %msg, "Database error");
            }
            // ... all variants with consistent format
        }
    }
}
```

**Impact**: Uniform error observability, easier to trace issues in logs.  
**Effort**: 0.5 hours (centralize logging method, update all match arms)

---

## ISSUE CATEGORY: CLEANUPS (4 issues, 1.5 hours)

### CLEANUP-1: DatabaseWithContext Never Used
**Location**: `error.rs:44-51`  
**Code**:
```rust
/// Enhanced database error with context for better observability
#[error("Database error in {operation} on {table}: {message}")]
DatabaseWithContext {
    operation: String,
    table: String,
    message: String,
    user_id: Option<Uuid>,
    entity_id: Option<Uuid>,
},
```

**Issue**: Variant defined but never constructed. All database errors use legacy `Database(String)` variant.

**Search Results**: No calls to `AppError::DatabaseWithContext { ... }` in codebase.

**Solution**: Either:
1. **Remove** DatabaseWithContext (dead code), or
2. **Migrate** all database errors to use DatabaseWithContext with context

**Recommended**: Migrate to DatabaseWithContext to enable better observability.

```rust
// Before:
AppError::Database(e.to_string())

// After:
AppError::DatabaseWithContext {
    operation: "fetch_user".to_string(),
    table: "users".to_string(),
    message: e.to_string(),
    user_id: Some(user_id),
    entity_id: None,
}
```

**Impact**: Better error context in logs, helps debugging production issues.  
**Effort**: 1 hour (audit all Database errors, migrate 30-50 call sites)

---

### CLEANUP-2: Error Type Strings Not Centralized
**Location**: `error.rs:93-165`  
**Pattern**: Error type strings like "not_found", "unauthorized", "csrf_violation" scattered in match arms

```rust
AppError::NotFound(msg) => (StatusCode::NOT_FOUND, "not_found", msg.clone()),
AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, "unauthorized", msg.clone()),
AppError::CsrfViolation => (StatusCode::FORBIDDEN, "csrf_violation", "CSRF validation failed".to_string()),
```

**Issue**: 
1. Error type strings hardcoded in match block
2. If frontend expects `"not-found"` but backend sends `"not_found"`, hard to fix
3. No validation that error types are consistent
4. Difficult to locate all uses of a specific error type string

**Solution**: Create error type enum or constants.

```rust
pub mod error_types {
    pub const NOT_FOUND: &str = "not_found";
    pub const UNAUTHORIZED: &str = "unauthorized";
    pub const FORBIDDEN: &str = "forbidden";
    pub const CSRF_VIOLATION: &str = "csrf_violation";
    pub const INVALID_ORIGIN: &str = "invalid_origin";
    pub const BAD_REQUEST: &str = "bad_request";
    pub const VALIDATION_ERROR: &str = "validation_error";
    pub const OAUTH_ERROR: &str = "oauth_error";
    pub const SESSION_EXPIRED: &str = "session_expired";
    pub const DATABASE_ERROR: &str = "database_error";
    pub const INTERNAL_ERROR: &str = "internal_error";
    pub const CONFIG_ERROR: &str = "config_error";
    pub const STORAGE_ERROR: &str = "storage_error";
}

// Usage:
AppError::NotFound(msg) => (StatusCode::NOT_FOUND, error_types::NOT_FOUND, msg.clone()),
```

**Impact**: Single source of truth for error type strings, easier to maintain API contract.  
**Effort**: 0.5 hours (create constants, update match arms)

---

### CLEANUP-3: Dead Code Attribute Suppression
**Location**: `error.rs:16`  
**Code**:
```rust
#[derive(Debug, thiserror::Error)]
#[allow(dead_code)]
pub enum AppError {
    // ...
}
```

**Issue**: `#[allow(dead_code)]` on entire enum suggests some variants are unused. Which ones? Better to list them specifically or justify why all are needed.

**Solution**: Either:
1. Remove `#[allow(dead_code)]` and fix actual dead code warnings, or
2. Document which variants are kept for future use/backward compat

```rust
/// Application error type
///
/// ## Deprecated Variants
/// - `OAuthError` - Kept for backward compatibility, prefer specific OAuth errors
/// - `Config` - Rarely used, prefer specific config errors with context
///
/// ## Future Variants
/// - Additional variants will be added for new error types
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    // ...
}
```

**Impact**: Clearer intent, helps maintainers understand which variants are active.  
**Effort**: 0.25 hours (run clippy, audit actual dead code, document)

---

### CLEANUP-4: No AppError Constructor Helpers
**Location**: Throughout error.rs  
**Pattern**: Creating errors requires manual enum construction

```rust
// Caller must write full enum variant:
Err(AppError::Database(format!("Query failed: {}", e)))
Err(AppError::Internal("Something went wrong".to_string()))
Err(AppError::BadRequest("Invalid input".to_string()))
```

**Issue**: 
1. Verbose construction with required `.to_string()` conversions
2. No consistency in message formatting
3. Easy to forget `.to_string()` and get compile error

**Solution**: Add impl methods for common cases.

```rust
impl AppError {
    pub fn not_found(msg: impl Into<String>) -> Self {
        AppError::NotFound(msg.into())
    }

    pub fn unauthorized(msg: impl Into<String>) -> Self {
        AppError::Unauthorized(msg.into())
    }

    pub fn bad_request(msg: impl Into<String>) -> Self {
        AppError::BadRequest(msg.into())
    }

    pub fn internal(msg: impl Into<String>) -> Self {
        AppError::Internal(msg.into())
    }

    pub fn database(msg: impl Into<String>) -> Self {
        AppError::Database(msg.into())
    }

    pub fn database_with_context(
        operation: impl Into<String>,
        table: impl Into<String>,
        message: impl Into<String>,
        user_id: Option<Uuid>,
    ) -> Self {
        AppError::DatabaseWithContext {
            operation: operation.into(),
            table: table.into(),
            message: message.into(),
            user_id,
            entity_id: None,
        }
    }
}

// Usage becomes:
Err(AppError::not_found("User not found"))
Err(AppError::database_with_context("fetch_user", "users", e.to_string(), Some(user_id)))
```

**Impact**: More ergonomic error construction, less verbose code.  
**Effort**: 0.25 hours (add methods, update 50+ call sites gradually)

---

## ISSUE CATEGORY: DOCUMENTATION (2 issues, 1 hour)

### DOC-1: Missing Error Handling Best Practices Guide
**Location**: `error.rs` top level  
**Issue**: No documentation about when to use each error variant or how to choose the right one.

**Solution**: Add module-level documentation with decision tree.

```rust
//! Error types and handling
//!
//! # Error Type Selection
//!
//! Choose the appropriate error variant based on the situation:
//!
//! ## Client Errors (4xx responses)
//! - `NotFound` - Resource doesn't exist (404)
//! - `Unauthorized` - User not authenticated or session expired (401)
//! - `Forbidden` - User lacks permission (403)
//! - `BadRequest` - Request format/validation error (400)
//! - `Validation` - Validation error with details (422)
//!
//! ## Server Errors (5xx responses)
//! - `Database` - Database query failed, user doesn't need details
//! - `DatabaseWithContext` - Database error with operation/table context (for observability)
//! - `Internal` - Unexpected error, likely a bug
//! - `Config` - Configuration/startup error
//! - `Storage` - R2 or file storage error
//!
//! ## Security Errors
//! - `CsrfViolation` - CSRF token mismatch
//! - `InvalidOrigin` - Request from disallowed origin
//! - `OAuthError` - OAuth provider error
//!
//! # Decision Tree
//!
//! ```text
//! Is the request invalid?
//! ├─ Yes: Is it a validation issue? → Validation(details)
//! ├─ Yes: Otherwise → BadRequest(reason)
//! └─ No: Continue...
//!
//! Is it a permission issue?
//! ├─ Not authenticated? → Unauthorized(reason)
//! ├─ Authenticated but no access? → Forbidden
//! └─ No: Continue...
//!
//! Is the resource missing?
//! └─ Yes: NotFound(what_was_missing)
//!
//! Is it our bug?
//! ├─ Database issue? → DatabaseWithContext(...)
//! ├─ Config issue? → Config(reason)
//! └─ Unknown: → Internal(reason)
//! ```
//!
//! # Usage Examples
//!
//! ```ignore
//! // User not found
//! let user = users_repo.get_by_id(id)
//!     .await?
//!     .ok_or(AppError::not_found(format!("User {} not found", id)))?;
//!
//! // Validation error
//! if req.email.is_empty() {
//!     return Err(AppError::bad_request("Email is required"));
//! }
//!
//! // Permission denied
//! if user.id != resource.owner_id {
//!     return Err(AppError::Forbidden);
//! }
//!
//! // Database error with context
//! users_repo.create(user)
//!     .await
//!     .map_err(|e| AppError::database_with_context(
//!         "insert",
//!         "users",
//!         e.to_string(),
//!         None
//!     ))?;
//! ```
```

**Impact**: Helps developers choose correct error types consistently.  
**Effort**: 0.5 hours (write decision tree and examples)

---

### DOC-2: Missing StatusCode to Error Variant Mapping Table
**Location**: `error.rs` documentation  
**Issue**: No clear mapping of which HTTP status codes map to which error variants.

**Solution**: Add documentation table.

```rust
//! # HTTP Status Code Mapping
//!
//! | HTTP Status | Error Variant | Use Case |
//! |---|---|---|
//! | 400 Bad Request | BadRequest | Request syntax/format invalid |
//! | 401 Unauthorized | Unauthorized | Auth required or invalid |
//! | 403 Forbidden | Forbidden, CsrfViolation, InvalidOrigin | Permission denied, CSRF, Origin mismatch |
//! | 404 Not Found | NotFound | Resource doesn't exist |
//! | 422 Unprocessable Entity | Validation | Request validation failed |
//! | 500 Internal Server Error | Internal, Database, Config, Storage | Server error |
//!
//! Note: SessionExpired maps to 401 Unauthorized (same as Unauthorized variant)
```

**Impact**: Clear reference for API documentation and consistency.  
**Effort**: 0.5 hours (create mapping table)

---

## ISSUE CATEGORY: DEPRECATIONS (2 issues, 0.75 hours)

### DEPR-1: Legacy Database Error Variant
**Location**: `error.rs:36-38`  
**Code**:
```rust
#[error("Database error: {0}")]
Database(String),
```

**Issue**: `DatabaseWithContext` exists for better observability, but `Database` still widely used. Code should migrate to use enhanced variant.

**Solution**: Mark Database as deprecated and provide migration path.

```rust
#[deprecated(
    since = "0.2.0",
    note = "Use DatabaseWithContext for better error context and observability"
)]
#[error("Database error: {0}")]
Database(String),

// Migration guide:
// Before: AppError::Database(e.to_string())
// After: AppError::database_with_context("operation", "table", e.to_string(), user_id)
```

**Impact**: Encourages migration to better error handling.  
**Effort**: 0.25 hours (add deprecation, write migration guide)

---

### DEPR-2: OAuth Error Not Decomposed
**Location**: `error.rs:40-41`  
**Code**:
```rust
#[error("OAuth error: {0}")]
OAuthError(String),
```

**Issue**: Generic OAuthError catches too many cases. Should distinguish:
- OAuth provider unavailable
- Invalid OAuth credentials
- Token refresh failed
- Authorization code invalid

**Solution**: Create specific OAuth error variants or move to separate error type.

```rust
pub enum OAuthErrorKind {
    ProviderUnavailable,
    InvalidCredentials,
    TokenRefreshFailed,
    InvalidAuthCode,
    MissingScope(String),
}

// Or split into:
#[error("OAuth provider unavailable: {0}")]
OAuthProviderUnavailable(String),

#[error("OAuth credentials invalid: {0}")]
OAuthCredentialsInvalid(String),

#[error("OAuth token refresh failed: {0}")]
OAuthTokenRefreshFailed(String),
```

**Impact**: Better error differentiation for OAuth flow debugging.  
**Effort**: 0.25 hours (decompose variant or create sub-types)

---

## ISSUE CATEGORY: LINTING & STRUCTURE (3 issues, 0.5 hours)

### LINT-1: Inconsistent Error Message Capitalization
**Location**: `error.rs:90-165`  
**Pattern**:
```rust
"Forbidden".to_string(),  // Capitalized
"CSRF validation failed".to_string(),  // Title case
"Invalid origin".to_string(),  // Lowercase
"Session has expired".to_string(),  // Sentence case
"Database error".to_string(),  // Lowercase
```

**Issue**: Inconsistent capitalization makes error responses look unprofessional.

**Solution**: Standardize on lowercase or sentence case for all messages.

```rust
"forbidden"  // Lowercase
"CSRF validation failed"  // Keep acronym uppercase
"invalid origin"  // Lowercase
"session has expired"  // Lowercase
"database error"  // Lowercase
```

**Impact**: Consistent API responses.  
**Effort**: 0.1 hours

---

### LINT-2: From Trait Implementations Could Be More Complete
**Location**: `error.rs:62-79`  
**Code**:
```rust
impl From<sqlx::Error> for AppError { ... }
impl From<anyhow::Error> for AppError { ... }
impl From<url::ParseError> for AppError { ... }
```

**Issue**: Missing From impls for common error types:
- `std::io::Error` - File I/O errors
- `uuid::Error` - UUID parsing errors
- `serde_json::Error` - JSON serialization
- `chrono::ParseError` - Date parsing

**Solution**: Add missing From implementations.

```rust
impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Internal(format!("IO error: {}", e))
    }
}

impl From<uuid::Error> for AppError {
    fn from(e: uuid::Error) -> Self {
        AppError::BadRequest(format!("Invalid UUID: {}", e))
    }
}

impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        AppError::BadRequest(format!("JSON error: {}", e))
    }
}

impl From<chrono::ParseError> for AppError {
    fn from(e: chrono::ParseError) -> Self {
        AppError::BadRequest(format!("Date parse error: {}", e))
    }
}
```

**Impact**: More ergonomic error handling with ? operator.  
**Effort**: 0.2 hours

---

### LINT-3: Response Body Serialization Could Use Custom Serializer
**Location**: `error.rs:81-88`  
**Code**:
```rust
#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
}
```

**Issue**: 
1. `code` field defined but never set (always None)
2. Should either populate code or remove field
3. No consistency with other response types

**Solution**: Either populate code field or remove it.

```rust
// Option A: Use error type as code
#[derive(Serialize)]
pub struct ErrorResponse {
    pub code: String,  // "not_found", "unauthorized", etc.
    pub message: String,
}

// Option B: Keep but populate from error variant
pub struct ErrorResponse {
    pub error: String,  // Type string
    pub code: String,   // Numeric code if needed
    pub message: String,
}
```

**Impact**: Cleaner response format, no unused fields.  
**Effort**: 0.2 hours

---

## CROSS-CUTTING PATTERNS

### Pattern #1: Error Constants Should Be Module-Level
**Affected Files**: error.rs + all handlers  
**Pattern**: Error type strings scattered across codebase.  
**Consolidation Opportunity**: Create `error::types` module with all constants.

```rust
// error/types.rs
pub mod types {
    pub const NOT_FOUND: &str = "not_found";
    pub const UNAUTHORIZED: &str = "unauthorized";
    // ... all types
}

// Usage everywhere:
.map_err(|_| AppError::not_found("user"))?
```

**Impact**: Single source of truth for all error type strings.  
**Effort**: 1.5 hours (create module, migrate 100+ uses across codebase)

---

### Pattern #2: Database Errors Should Always Include Operation Context
**Affected Files**: habits_repos.rs, focus_repos.rs, quests_repos.rs, etc.  
**Pattern**: Database errors created without context.  
**Current**: `AppError::Database(e.to_string())`  
**Better**: `AppError::database_with_context("list_habits", "habits", e.to_string(), Some(user_id))`

**Impact**: Better observability across all database operations.  
**Effort**: 3-4 hours (migrate 100+ database error sites)

---

## IMPLEMENTATION ROADMAP

### Phase 1: Error Type Constants (0.5 hours)
- [ ] Create `error::types` module with all type strings
- [ ] Update match arms to use constants
- [ ] Run tests to verify

### Phase 2: Constructor Helpers (0.5 hours)
- [ ] Add impl methods (not_found, unauthorized, etc.)
- [ ] Update high-frequency call sites
- [ ] Reduce .to_string() boilerplate

### Phase 3: Consistent Logging (0.75 hours)
- [ ] Add log_error() method
- [ ] Update IntoResponse to call logging
- [ ] Ensure all errors logged consistently

### Phase 4: Database Error Migration (1 hour)
- [ ] Audit all Database(e.to_string()) calls
- [ ] Migrate to database_with_context where user_id available
- [ ] Update tests

### Phase 5: From Trait Completeness (0.25 hours)
- [ ] Add From impls for std::io::Error, uuid::Error, etc.
- [ ] Test with ? operator

### Phase 6: Documentation (0.75 hours)
- [ ] Add error selection decision tree
- [ ] Add status code mapping table
- [ ] Add usage examples

### Phase 7: Code Quality (0.5 hours)
- [ ] Standardize message capitalization
- [ ] Remove dead_code allowance or document
- [ ] Clean up unused code fields

---

## VALIDATION CHECKLIST

### Consistency
- [ ] All error type strings defined in single module
- [ ] All errors logged with consistent format
- [ ] All error variants have IntoResponse impl
- [ ] Status codes match HTTP spec

### Observability
- [ ] All database errors use DatabaseWithContext (when possible)
- [ ] All errors logged with appropriate level (warn/error)
- [ ] User context included where applicable
- [ ] Operation context included for database errors

### API Contract
- [ ] Error response format consistent
- [ ] Error type strings documented
- [ ] Status codes documented
- [ ] Examples provided for each error type

### Code Quality
- [ ] No dead code (or explicitly documented as retained)
- [ ] No hardcoded strings (use constants)
- [ ] No duplicate error type definitions
- [ ] All From impls covered

---

## SUMMARY

The error handling system is well-structured with centralized `IntoResponse` impl, but has **consistency and completeness issues**:

**Highest Priority**: Migrate to `database_with_context` for better observability, centralize error type strings in constants module.

**Quick Wins**: Add constructor helpers (0.5h), consistent logging (0.75h), From trait completeness (0.25h).

**Documentation**: Add decision tree and status mapping table (1 hour).

**Total Effort**: 3.5-4 hours to complete all improvements and consistency enhancements.
