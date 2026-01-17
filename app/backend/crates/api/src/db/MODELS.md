# Database Models - Naming Conventions & Architecture

**Last Updated**: January 17, 2026  
**Status**: Active Reference Guide  
**Related Task**: BACK-005

---

## Overview

This document defines the naming conventions and architecture patterns used throughout the database models layer. Following these conventions ensures consistency, maintainability, and type safety across the codebase.

---

## Model Organization

### Directory Structure

```
src/db/
├── macros.rs                    # Shared macros (named_enum!, etc.)
├── MODELS.md                    # This file - conventions & patterns
├── mod.rs                       # Module exports
├── *_models.rs                  # Model definitions (grouped by feature)
├── *_repos.rs                   # Database operations (grouped by feature)
└── generated.rs                 # Auto-generated code (from schema.json)
```

### File Naming Pattern

- **Models**: `{feature}_models.rs` (e.g., `gamification_models.rs`, `focus_models.rs`)
  - Contains: Enums, database models, request types, response types
  - Import pattern: `use crate::db::{feature}_models::*;`

- **Repositories**: `{feature}_repos.rs` (e.g., `gamification_repos.rs`, `focus_repos.rs`)
  - Contains: Database queries, mutations, business logic
  - Import pattern: `use crate::db::{feature}_repos::*;`

---

## Struct Naming Conventions

### Database Models (structs that map to database tables)

**Pattern**: `{EntityName}` (no prefix/suffix)

```rust
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserProgress {        // Maps to users_progress table
    pub id: Uuid,
    pub user_id: Uuid,
    // ...
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct FocusSession {        // Maps to focus_sessions table
    pub id: Uuid,
    pub user_id: Uuid,
    // ...
}
```

**Derive Pattern**: All database models MUST use these 4 derives:
```rust
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
```

**Explanation**:
- `Debug`: Logging and debugging output
- `Clone`: Safe copying for API responses
- `FromRow`: sqlx automatic mapping from database rows
- `Serialize, Deserialize`: JSON serialization for API

### Request Types (API input)

**Pattern**: `{Action}{Entity}Request` or `Create/Update{Entity}Request`

```rust
#[derive(Debug, Deserialize)]
pub struct CreateFocusRequest {
    pub mode: String,
    pub duration_seconds: i32,
}

#[derive(Debug, Deserialize)]
pub struct UpdateQuestRequest {
    pub title: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AwardPointsRequest {
    pub event_type: String,
    pub amount: i32,
}
```

**Derive Pattern**: Request types typically derive `Debug, Deserialize` only:
```rust
#[derive(Debug, Deserialize)]
pub struct {Name}Request { ... }
```

### Response Types (API output)

**Pattern**: `{Entity}Response` or `{Action}{Entity}Response`

```rust
#[derive(Debug, Serialize)]
pub struct FocusSessionResponse {
    pub id: Uuid,
    pub status: String,
    pub xp_awarded: i32,
}

#[derive(Debug, Serialize)]
pub struct CreateFocusResponse {
    pub session: FocusSession,
    pub message: String,
}
```

**Derive Pattern**: Response types typically derive `Debug, Serialize` only:
```rust
#[derive(Debug, Serialize)]
pub struct {Name}Response { ... }
```

---

## Field Naming Conventions

### ID Fields

**Pattern**: `{entity}_id` suffix for foreign keys, `id` for primary keys

```rust
pub struct UserProgress {
    pub id: Uuid,                          // Primary key
    pub user_id: Uuid,                     // Foreign key to users
    pub skill_id: Option<Uuid>,            // Foreign key (optional)
}
```

**Rules**:
- Primary keys: Always named `id` (type: `Uuid`)
- Foreign keys: Always use `{entity}_id` pattern (type: `Uuid`)
- No abbreviations: `user_id` not `uid`, `quest_id` not `q_id`

### Timestamp Fields

**Pattern**: Field name ends with `_at`

```rust
pub struct FocusSession {
    pub started_at: DateTime<Utc>,         // Action occurred at this time
    pub completed_at: Option<DateTime<Utc>>, // Optional end time
    pub expires_at: Option<DateTime<Utc>>, // Optional expiration time
    pub created_at: DateTime<Utc>,         // Record creation time
    pub updated_at: DateTime<Utc>,         // Record update time
}
```

**Standard Timestamp Fields**:
- `created_at`: When record was created (always set)
- `updated_at`: When record was last modified (always set)
- `started_at`: When action began (action-specific)
- `completed_at`: When action finished (optional)
- `expires_at`: When record/session expires (optional)
- `paused_at`: When action was paused (optional)
- `resumed_at`: When action resumed (optional)
- `locked_at`: When resource was locked (optional)

**Type**: Always `DateTime<Utc>` (never `NaiveDateTime`, never `i64`)

**Immutable Defaults** (set at creation, never changed):
```rust
pub created_at: DateTime<Utc>,
```

**Mutable Fields** (updated on modification):
```rust
pub updated_at: DateTime<Utc>,  // Updated on every change
```

### Boolean Fields

**Naming Patterns** (use consistently within a domain):

**Pattern A**: `is_{state}` (for boolean state)
```rust
pub struct VaultLock {
    pub is_locked: bool,
    pub is_active: bool,
    pub is_archived: bool,
}
```

**Pattern B**: `{action}_enabled` (for feature toggles)
```rust
pub struct UserSettings {
    pub notifications_enabled: bool,
    pub analytics_enabled: bool,
}
```

**Rule**: Pick one pattern per feature and use consistently.

### Numeric Fields

**XP/Points**: Use `i64` for large accumulating values

```rust
pub struct UserProgress {
    pub total_xp: i64,           // Can reach millions
    pub current_level: i32,      // Usually 1-100 range
}
```

**Durations**: Use `i32` for seconds (up to 24+ days range)

```rust
pub struct FocusSession {
    pub duration_seconds: i32,           // 25 min = 1500 sec
    pub time_remaining_seconds: i32,
}
```

**Counts**: Use `i32` for counts/quantities

```rust
pub struct Achievement {
    pub target_count: i32,               // How many times to earn
}
```

### String Fields

**Enums Stored as TEXT**: Use `String` for enum values

```rust
pub struct FocusSession {
    pub status: String,          // Stores: "active", "paused", "completed"
    pub mode: String,            // Stores: "focus", "break", "long_break"
}
```

**Reasons/Names/Descriptions**: Use `String`

```rust
pub struct VaultLock {
    pub reason: String,          // Why vault was locked
    pub note: Option<String>,    // Optional additional note
}
```

**JSON Data**: Use `sqlx::types::JsonValue` or serde_json

```rust
pub struct AchievementRule {
    pub trigger_config: serde_json::Value,  // Flexible JSON storage
}
```

---

## Enum Conventions

### Using the `named_enum!` Macro

The `named_enum!` macro automatically generates string conversion implementations:

**Usage**:
```rust
named_enum!(FocusStatus {
    Active => "active",
    Paused => "paused",
    Completed => "completed",
    Abandoned => "abandoned",
    Expired => "expired"
});
```

**What This Generates**:
- `FocusStatus` enum with variants
- `as_str()` method: `FocusStatus::Active.as_str()` → `"active"`
- `FromStr` trait: `"active".parse::<FocusStatus>()?` → `FocusStatus::Active`
- `Display` trait: `format!("{}", FocusStatus::Active)` → `"active"`
- `Serialize` support: Serializes as `"active"` (not `Active`)
- `Deserialize` support: Deserializes from `"active"` strings

**Benefits**:
- ✅ Compile-time type safety for status values
- ✅ String representation always matches enum (no sync bugs)
- ✅ Automatic JSON serialization/deserialization
- ✅ 78% boilerplate reduction vs manual impl blocks

### Enum Storage in Database

**Rules**:
- Status enums stored as TEXT: `#[sqlx(type_name = "text")]`
- Variant names: Always `snake_case` in database
- Fallback: If unknown value in database, use `FromStr` error handling

**Example**:
```rust
named_enum!(QuestStatus {
    Available => "available",
    Accepted => "accepted",
    InProgress => "in_progress",
    Completed => "completed"
});

// In database: stored as "in_progress" (snake_case, lowercase)
// In code: accessed as QuestStatus::InProgress
```

### When to Create Enums

**Create enum for**:
- ✅ Fixed set of status values (Quest, Habit, Achievement states)
- ✅ Fixed set of mode values (Focus, Break, Session types)
- ✅ Type-safe operations (cannot accidentally use wrong string)
- ✅ Values stored in database multiple times

**Use String instead for**:
- ❌ User-generated content (descriptions, names, reasons)
- ❌ External API responses (may change)
- ❌ Flexible/extensible data (custom fields)
- ❌ Large sets of unique values

---

## Model Relationships

### One-to-Many Relationships

**Pattern**: Foreign key field named `{parent_entity}_id`

```rust
// Parent
pub struct User {
    pub id: Uuid,
}

// Child
pub struct FocusSession {
    pub id: Uuid,
    pub user_id: Uuid,         // ← Foreign key to User
}
```

**Queries**:
```rust
// Find all sessions for a user
sqlx::query_as::<_, FocusSession>(
    "SELECT * FROM focus_sessions WHERE user_id = $1"
)
    .bind(user_id)
    .fetch_all(pool)
    .await
```

### Many-to-Many Relationships

**Pattern**: Separate junction table with foreign keys

```rust
// Users <-> Achievements (many-to-many)

pub struct User {
    pub id: Uuid,
}

pub struct Achievement {
    pub id: Uuid,
}

pub struct UserAchievement {   // Junction table
    pub id: Uuid,
    pub user_id: Uuid,         // Foreign key to User
    pub achievement_id: Uuid,  // Foreign key to Achievement
    pub unlocked_at: DateTime<Utc>,
}
```

### Optional References

**Pattern**: Use `Option<Uuid>` for optional foreign keys

```rust
pub struct FocusSession {
    pub id: Uuid,
    pub user_id: Uuid,         // Required reference
    pub task_id: Option<Uuid>, // Optional reference
}
```

---

## Validation Patterns

### Input Validation

**Rules**:
1. Validate in route handlers BEFORE calling repos
2. Return `AppError::BadRequest` for invalid input
3. Use type system (enums) to prevent invalid values

**Example**:
```rust
// Route handler (routes/focus.rs)
async fn create_session(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateFocusRequest>,
) -> AppResult<Json<FocusSessionResponse>> {
    // Validate mode is valid
    let _: FocusMode = req.mode.parse()
        .map_err(|_| AppError::BadRequest("Invalid focus mode".to_string()))?;
    
    // Validate duration
    if req.duration_seconds < 60 {
        return Err(AppError::BadRequest("Duration must be >= 60 seconds".to_string()));
    }
    
    // Call repo with validated data
    let session = focus_repos::create_session(&state.pool, &user_id, &req).await?;
    Ok(Json(session))
}
```

### Default Values

**Pattern**: Use `#[serde(default = "function_name")]` for optional fields with defaults

```rust
pub struct CreateFocusRequest {
    #[serde(default = "default_focus_mode")]
    pub mode: String,
    
    #[serde(default = "default_duration")]
    pub duration_seconds: i32,
    
    pub task_id: Option<Uuid>,  // No default, truly optional
}

fn default_focus_mode() -> String {
    "focus".to_string()
}

fn default_duration() -> i32 {
    1500  // 25 minutes
}
```

---

## Documentation Requirements

### Enum Variants

Each enum variant MUST be documented:

```rust
named_enum!(FocusStatus {
    /// Session is currently active (user is focusing)
    Active => "active",
    
    /// Session is paused (user took a break)
    Paused => "paused",
    
    /// Session completed normally
    Completed => "completed",
    
    /// User abandoned the session early
    Abandoned => "abandoned",
    
    /// Session expired without completion
    Expired => "expired"
});
```

### Struct Fields

Document non-obvious fields:

```rust
pub struct UserProgress {
    /// Primary key (UUID)
    pub id: Uuid,
    
    /// Reference to user
    pub user_id: Uuid,
    
    /// Total XP accumulated (uses i64 to prevent overflow at high levels)
    pub total_xp: i64,
    
    /// Current level (typically 1-100)
    pub current_level: i32,
    
    /// XP required to reach next level (i64 for future-proofing)
    pub xp_to_next_level: i64,
}
```

### Complex Types

Document type choices:

```rust
/// Achievement trigger configuration
/// Stored as JSON to support multiple trigger types:
/// - CountBased: { "event_type": "quest_completed", "target_count": 5 }
/// - Milestone: { "milestone_type": "level_10", "milestone_value": 10 }
/// - Unlock: { "dependency_key": "early_bird" }
/// - Streak: { "streak_type": "daily", "days_required": 7 }
pub trigger_config: serde_json::Value,
```

---

## Code Organization within Files

### Pattern: {feature}_models.rs

```rust
//! {Feature} models
//!
//! Models for {feature description}.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use crate::named_enum;

// ============================================================================
// ENUMS (Type-Safe statuses and modes)
// ============================================================================

named_enum!(StatusEnum { /* ... */ });
named_enum!(ModeEnum { /* ... */ });

// ============================================================================
// DATABASE MODELS (Structs that map to tables)
// ============================================================================

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct DatabaseModel { /* ... */ }

// ============================================================================
// API REQUEST TYPES (Input from client)
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct CreateRequest { /* ... */ }

#[derive(Debug, Deserialize)]
pub struct UpdateRequest { /* ... */ }

// ============================================================================
// API RESPONSE TYPES (Output to client)
// ============================================================================

#[derive(Debug, Serialize)]
pub struct Response { /* ... */ }
```

### Pattern: {feature}_repos.rs

```rust
//! {Feature} database operations
//!
//! Database queries and mutations for {feature}.

use sqlx::SqlitePool;
use uuid::Uuid;
use crate::db::{models::*, error::AppError};

/// Create {entity}
pub async fn create_entity(
    pool: &SqlitePool,
    user_id: &Uuid,
    req: &CreateRequest,
) -> Result<Entity, AppError> {
    // Implementation
}

/// Get {entity} by ID
pub async fn get_entity(
    pool: &SqlitePool,
    id: &Uuid,
) -> Result<Option<Entity>, AppError> {
    // Implementation
}
```

---

## Common Mistakes to Avoid

### ❌ Don't: Inconsistent naming

```rust
// BAD: Inconsistent ID naming
pub struct UserProgress {
    pub user_id: Uuid,          // ✓ Correct format
    pub progressId: Uuid,       // ✗ Wrong (camelCase)
    pub user_lvl_id: Uuid,      // ✗ Wrong (abbreviated)
}
```

### ✅ Do: Consistent naming

```rust
// GOOD: Consistent ID naming
pub struct UserProgress {
    pub user_id: Uuid,
    pub progress_id: Uuid,      // Not "progressId" or "prog_id"
    pub user_level_id: Uuid,    // Full name, no abbreviations
}
```

---

### ❌ Don't: Boolean naming inconsistency

```rust
// BAD: Mixed boolean patterns
pub struct User {
    pub is_active: bool,        // ✓ Pattern A
    pub notifications_enabled: bool,  // ✓ Pattern B
    pub admin: bool,            // ✗ No pattern (ambiguous)
    pub archived: bool,         // ✗ No pattern
}
```

### ✅ Do: Pick one pattern, use consistently

```rust
// GOOD: Consistent boolean naming (Pattern A: is_{state})
pub struct User {
    pub is_active: bool,
    pub is_admin: bool,         // Consistent
    pub is_archived: bool,      // Consistent
}

// OR: Consistent boolean naming (Pattern B: {action}_enabled)
pub struct User {
    pub notifications_enabled: bool,
    pub analytics_enabled: bool,
    pub admin_features_enabled: bool,  // Consistent
}
```

---

### ❌ Don't: Wrong timestamp types

```rust
// BAD: Using wrong types for timestamps
pub struct Event {
    pub created_timestamp: i64,          // ✗ i64 loses type safety
    pub updated_date: chrono::NaiveDate, // ✗ NaiveDate loses timezone
    pub finished: String,                // ✗ String is untyped
}
```

### ✅ Do: Always use DateTime<Utc>

```rust
// GOOD: Proper timestamp typing
pub struct Event {
    pub created_at: DateTime<Utc>,       // ✓ Type-safe
    pub updated_at: DateTime<Utc>,       // ✓ Type-safe
    pub finished_at: DateTime<Utc>,      // ✓ Consistent naming
}
```

---

### ❌ Don't: Numeric type overflow

```rust
// BAD: Using i32 for accumulating values
pub struct UserProgress {
    pub total_xp: i32,  // ✗ Overflows at 2.1B XP
}
```

### ✅ Do: Use i64 for accumulating values

```rust
// GOOD: Safe numeric types
pub struct UserProgress {
    pub total_xp: i64,          // ✓ Safe up to 9 quintillion
    pub current_level: i32,     // ✓ Level usually capped
}
```

---

## Validation Checklist

Before creating a new model file, ensure:

- [ ] File named `{feature}_models.rs` (all lowercase, underscores)
- [ ] All database structs have: `#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]`
- [ ] All ID fields named `{entity}_id` or `id`
- [ ] All timestamps named with `_at` suffix and typed `DateTime<Utc>`
- [ ] All enums use `named_enum!` macro
- [ ] All request types named `{Action}{Entity}Request` and derived `Debug, Deserialize`
- [ ] All response types named `{Entity}Response` and derived `Debug, Serialize`
- [ ] Boolean fields use consistent naming pattern within feature (is_state OR _enabled)
- [ ] Large numeric values use i64, counts use i32
- [ ] All enum variants documented with `///` comments
- [ ] Complex types documented explaining their structure
- [ ] Foreign keys use `Option<Uuid>` for optional references
- [ ] Default values specified with `#[serde(default = "function")]`

---

## Quick Reference

| Pattern | Example | Reason |
|---------|---------|--------|
| Primary Key | `id: Uuid` | Unique identifier |
| Foreign Key | `user_id: Uuid` | Relationship to parent |
| Timestamp | `created_at: DateTime<Utc>` | Type-safe, timezone-aware |
| Status | `status: String` (enum variant) | Type-safe enum via `named_enum!` |
| Boolean | `is_active: bool` | Consistent naming pattern |
| Counts | `count: i32` | Typical range 1-2B |
| Accumulation | `total_xp: i64` | Prevent overflow |
| Flex JSON | `config: serde_json::Value` | Extensible storage |
| Request | `CreateFocusRequest` | Input type |
| Response | `FocusSessionResponse` | Output type |

---

## Related Documentation

- **Macros**: See `macros.rs` for `named_enum!` macro definition
- **Schema**: See `schema.json` for database table definitions
- **Generated Code**: See `generated.rs` for auto-generated types
- **Repositories**: See `*_repos.rs` for query patterns

---

## Summary

✅ **Follow these conventions to**:
- Maintain consistency across 20+ model files
- Enable automatic code generation and migrations
- Prevent type-safety bugs
- Make code reviews and maintenance easier
- Reduce boilerplate via macros (78% reduction for enums)

❓ **Questions or ambiguities?** Refer to existing models in:
- `gamification_models.rs` - Complex enums and relationships
- `focus_models.rs` - named_enum! usage examples
- `vault_models.rs` - Timestamp patterns

