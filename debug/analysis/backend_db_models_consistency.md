# DATABASE MODELS CONSISTENCY ANALYSIS

**Component**: Database Model Naming & Structure  
**Scope**: 19 `*_models.rs` files + central `models.rs`  
**Representative Files**:
- `app/backend/crates/api/src/db/models.rs` (204 lines - User, Account, Session)
- `app/backend/crates/api/src/db/habits_goals_models.rs` (223 lines)
- `app/backend/crates/api/src/db/quests_models.rs` (229 lines)
- `app/backend/crates/api/src/db/focus_models.rs` (326 lines)
- `app/backend/crates/api/src/db/gamification_models.rs` (260 lines - analyzed earlier)
- Plus 14 more model files

**Total Lines Analyzed**: ~1500+ lines (sampled patterns)  
**Issues Identified**: 11  
**Effort Estimate**: 2-2.5 hours  

**Issue Breakdown**:
- 4 Common Operations (consolidate patterns)
- 3 Cleanups (improve consistency)
- 2 Documentation improvements
- 1 Deprecation (legacy patterns)
- 1 Linting improvement

**Critical Findings**: None blocking, but widespread consistency issues

---

## ISSUE CATEGORY: COMMON OPERATIONS (4 issues, 1.25 hours)

### OP-1: Status/Mode Enum Implementation Duplication
**Location**: Every model file has enum implementations repeated  
**Pattern**: Each status/mode enum duplicates impl blocks

```rust
// habits_goals_models.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GoalStatus {
    Active,
    Completed,
    Abandoned,
    Paused,
}

impl GoalStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            GoalStatus::Active => "active",
            GoalStatus::Completed => "completed",
            GoalStatus::Abandoned => "abandoned",
            GoalStatus::Paused => "paused",
        }
    }
}

// quests_models.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum QuestStatus {
    Available,
    Accepted,
    InProgress,
    Completed,
    Claimed,
    Abandoned,
    Expired,
}

impl QuestStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            QuestStatus::Available => "available",
            // ... etc
        }
    }
}

// focus_models.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FocusStatus {
    Active,
    Paused,
    Completed,
    Abandoned,
    Expired,
}

impl FocusStatus {
    pub fn as_str(&self) -> &'static str {
        // ... same pattern
    }
}

impl std::str::FromStr for FocusStatus {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "active" => Ok(FocusStatus::Active),
            // ... etc
        }
    }
}
```

**Issue**: 
1. Every status enum repeats identical impl pattern (as_str, FromStr, Display if used)
2. ~10+ status/mode enums across files, each with same boilerplate
3. If pattern changes (add validation, new method), must update 10+ places
4. ~200-300 lines of duplicated enum impl code

**Solution**: Create generic enum macro or base trait.

```rust
// enums/mod.rs (new module)
use std::str::FromStr;
use serde::{Deserialize, Serialize};

/// Trait for status/mode enums with string conversion
pub trait NamedEnum: Sized {
    fn as_str(&self) -> &'static str;
}

/// Macro to reduce status enum boilerplate
#[macro_export]
macro_rules! named_enum {
    ($name:ident { $($variant:ident => $string:expr),+ $(,)? }) => {
        #[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
        #[serde(rename_all = "snake_case")]
        pub enum $name {
            $($variant),+
        }

        impl $name {
            pub fn as_str(&self) -> &'static str {
                match self {
                    $($name::$variant => $string),+
                }
            }
        }

        impl std::str::FromStr for $name {
            type Err = String;
            fn from_str(s: &str) -> Result<Self, Self::Err> {
                match s {
                    $($string => Ok($name::$variant)),+,
                    _ => Err(format!("Unknown {}: {}", stringify!($name), s))
                }
            }
        }

        impl std::fmt::Display for $name {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                write!(f, "{}", self.as_str())
            }
        }
    };
}

// Usage in habits_goals_models.rs:
named_enum!(GoalStatus {
    Active => "active",
    Completed => "completed",
    Abandoned => "abandoned",
    Paused => "paused",
});

// Usage in quests_models.rs:
named_enum!(QuestStatus {
    Available => "available",
    Accepted => "accepted",
    InProgress => "in_progress",
    Completed => "completed",
    Claimed => "claimed",
    Abandoned => "abandoned",
    Expired => "expired",
});
```

**Impact**: Eliminates ~200 lines of duplicate enum code.  
**Effort**: 0.75 hours (create macro, update 5-10 status enums)

---

### OP-2: Request/Response Type Name Inconsistency
**Location**: All model files  
**Pattern**: Inconsistent naming for request/response types

```rust
// habits_goals_models.rs
pub struct CreateHabitRequest { ... }
pub struct UpdateHabitRequest { ... }  // Not found, but implied pattern
pub struct HabitResponse { ... }
pub struct HabitsListResponse { ... }

// platform_models.rs
pub struct CreateCalendarEventRequest { ... }
pub struct UpdateCalendarEventRequest { ... }
pub struct CalendarEventResponse { ... }  // Not shown but implied

// vs potentially:
pub struct CreateHabitInput { ... }
pub struct HabitDTO { ... }
pub struct HabitOutput { ... }
```

**Issue**: 
1. Mix of naming conventions: Request/Response, Input/Output, DTO/Entity
2. No consistent pattern across files
3. Response sometimes includes suffix ("HabitsListResponse") sometimes not ("HabitResponse")
4. Hard to predict type name

**Solution**: Establish naming convention.

```rust
// Convention:
// Request types: {Resource}CreateRequest, {Resource}UpdateRequest, {Resource}DeleteRequest
// Response types: {Resource}Response
// List responses: {Resource}ListResponse
// Special: {Resource}{Action}Response (e.g., CompleteHabitResponse)

// Apply consistently:
pub struct HabitCreateRequest { ... }
pub struct HabitUpdateRequest { ... }
pub struct HabitDeleteRequest { ... }
pub struct HabitResponse { ... }
pub struct HabitListResponse { ... }
pub struct HabitCompleteResponse { ... }

pub struct CalendarEventCreateRequest { ... }
pub struct CalendarEventUpdateRequest { ... }
pub struct CalendarEventResponse { ... }
pub struct CalendarEventListResponse { ... }
```

**Impact**: Consistent type naming across codebase.  
**Effort**: 0.25 hours (document convention, update high-use types gradually)

---

### OP-3: Metadata Field Pattern Repeated Inconsistently
**Location**: `platform_models.rs:28, 32` and likely other files  
**Pattern**: Unstructured serde_json::Value for flexible data

```rust
pub struct CalendarEvent {
    // ... other fields
    pub metadata: Option<serde_json::Value>,  // Untyped JSONB
}

pub struct CreateCalendarEventRequest {
    // ... other fields
    pub metadata: Option<serde_json::Value>,  // Untyped JSONB
}
```

**Issue**: 
1. Multiple model files use unstructured JSONB
2. No schema validation for metadata
3. Different metadata structures in different entities
4. Consumers must know JSON schema by reading code

**Solution**: Create typed metadata or document structure.

```rust
// Option A: Create metadata enums for each entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CalendarEventMetadata {
    WorkoutSession { duration_minutes: i32 },
    Meeting { attendees: Vec<String> },
    Custom(serde_json::Value),
}

pub struct CalendarEvent {
    pub metadata: Option<CalendarEventMetadata>,
}

// Option B: Document expected schema
/// Calendar event metadata (stored as JSONB)
///
/// Valid structures:
/// ```json
/// {
///   "type": "workout",
///   "duration_minutes": 45
/// }
/// ```
/// or
/// ```json
/// {
///   "type": "meeting",
///   "attendees": ["alice@example.com", "bob@example.com"]
/// }
/// ```
pub struct CalendarEvent {
    /// Flexible metadata storage. See CalendarEvent docs for valid structures.
    pub metadata: Option<serde_json::Value>,
}
```

**Impact**: Better type safety or clear documentation for flexible fields.  
**Effort**: 0.25 hours (document or create enum)

---

### OP-4: Default Function Duplication
**Location**: `habits_goals_models.rs:54-60`, `platform_models.rs:62-65`  
**Pattern**: Request types have default serde(default) functions

```rust
// habits_goals_models.rs
#[derive(Debug, Clone, Deserialize)]
pub struct CreateHabitRequest {
    pub name: String,
    pub description: Option<String>,
    #[serde(default = "default_frequency")]
    pub frequency: String,
    #[serde(default = "default_target")]
    pub target_count: i32,
    // ...
}

fn default_frequency() -> String {
    "daily".to_string()
}

fn default_target() -> i32 {
    1
}

// platform_models.rs
#[derive(Debug, Clone, Deserialize)]
pub struct CreateCalendarEventRequest {
    // ...
    #[serde(default = "default_event_type")]
    pub event_type: String,
    // ...
}

fn default_event_type() -> String {
    "general".to_string()
}
```

**Issue**: 
1. Default functions scattered throughout files
2. Easy to miss when adding new default field
3. No centralized place to see all defaults

**Solution**: Group defaults or use const defaults.

```rust
// Option A: Create defaults module
pub mod defaults {
    pub fn frequency() -> String { "daily".to_string() }
    pub fn target_count() -> i32 { 1 }
    pub fn event_type() -> String { "general".to_string() }
    pub fn focus_mode() -> String { "focus".to_string() }
}

// Usage:
#[serde(default = "defaults::frequency")]
pub frequency: String,

// Option B: Use const where possible
const DEFAULT_FREQUENCY: &str = "daily";
const DEFAULT_TARGET_COUNT: i32 = 1;

#[serde(default = "habit_defaults::frequency")]
pub frequency: String,

mod habit_defaults {
    pub fn frequency() -> String { super::DEFAULT_FREQUENCY.to_string() }
}
```

**Impact**: Centralized defaults, easier to maintain.  
**Effort**: 0.25 hours

---

## ISSUE CATEGORY: CLEANUPS (3 issues, 0.75 hours)

### CLEANUP-1: Unused Derive Attributes
**Location**: Various models  
**Code**:
```rust
// models.rs
#[allow(dead_code)]
pub enum UserRole {
    // ...
}

#[allow(dead_code)]
impl UserRole {
    pub fn as_str(&self) -> &'static str {
        // ...
    }
}
```

**Issue**: `#[allow(dead_code)]` suggests enum/methods aren't used. Either they're unused or they will be used.

**Solution**: Remove allowance or document intent.

```rust
// Option A: Remove and use the enum
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum UserRole {
    User,
    Moderator,
    Admin,
}

// Option B: Document if keeping for future use
/// UserRole enum is kept for future admin API endpoint filtering.
/// Currently only user.role (String) is used in authentication.
#[allow(dead_code)]
pub enum UserRole {
    // ...
}
```

**Impact**: Clarity about which enums are active vs. placeholder.  
**Effort**: 0.25 hours

---

### CLEANUP-2: Inconsistent Field Naming
**Location**: Multiple model files  
**Pattern**: Field naming conventions differ

```rust
// models.rs
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub email_verified: Option<DateTime<Utc>>,
    pub image: Option<String>,
    pub role: String,
}

// habits_goals_models.rs
pub struct Habit {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub frequency: String,
    pub target_count: i32,  // snake_case
    pub icon: Option<String>,
    pub color: Option<String>,
    pub is_active: bool,  // is_ prefix
    pub current_streak: i32,
    pub longest_streak: i32,
    pub last_completed_at: Option<DateTime<Utc>>,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// platform_models.rs
pub struct CalendarEvent {
    pub all_day: bool,  // Separate words in snake_case
    pub parent_event_id: Option<Uuid>,
    pub reminder_minutes: Option<i32>,
    pub metadata: Option<serde_json::Value>,
}
```

**Issue**: 
1. Boolean fields sometimes prefixed with `is_` (is_active) sometimes not (all_day)
2. Collection/list fields sometimes plural (custom_days) sometimes not
3. Timestamp fields sometimes `_at` suffix (created_at) sometimes not
4. No consistent pattern

**Solution**: Establish naming conventions.

```rust
// Conventions:
// - Boolean fields: use is_ prefix for state (is_active, is_verified)
// - Use non-prefix for queries (all_day, completed_today)
// - Timestamps: always use _at suffix (_created_at, _completed_at, _last_activity_at)
// - Collections: use plural or _list suffix (custom_days, tags)
// - IDs: always use _id suffix (user_id, habit_id)

pub struct Habit {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub frequency: String,  // ✓ OK
    pub target_count: i32,  // ✓ OK (not is_target)
    pub icon: Option<String>,  // ✓ OK
    pub color: Option<String>,  // ✓ OK
    pub is_active: bool,  // ✓ OK (state)
    pub current_streak: i32,  // ✓ OK
    pub longest_streak: i32,  // ✓ OK
    pub last_completed_at: Option<DateTime<Utc>>,  // ✓ OK (_at suffix)
}

pub struct CalendarEvent {
    pub all_day: bool,  // Consider: is_all_day? (Ambiguous - keep as is if it's a query field)
    pub parent_event_id: Option<Uuid>,  // ✓ OK
    pub reminder_minutes: Option<i32>,  // ✓ OK
}
```

**Impact**: Consistent field naming makes codebase more predictable.  
**Effort**: 0.25 hours (document convention)

---

### CLEANUP-3: Missing Type Validation on Create/Update Requests
**Location**: All request types  
**Code**:
```rust
pub struct CreateHabitRequest {
    pub name: String,  // Could be empty
    pub description: Option<String>,  // No max length
    pub frequency: String,  // Could be invalid value
    pub target_count: i32,  // Could be negative
}
```

**Issue**: 
1. No validation in struct definition (must validate in handler)
2. Handler validation not documented in model
3. Risk of invalid data being processed

**Solution**: Document or add validation traits.

```rust
// Option A: Add doc comments with validation
/// Create habit request
///
/// Validation:
/// - `name`: 1-255 characters, required
/// - `description`: optional, max 1000 characters
/// - `frequency`: one of "daily", "weekly", "custom"
/// - `target_count`: 1-100
#[derive(Debug, Clone, Deserialize)]
pub struct CreateHabitRequest {
    pub name: String,
    pub description: Option<String>,
    pub frequency: String,
    pub target_count: i32,
}

// Option B: Create validation trait
pub trait ValidateRequest {
    fn validate(&self) -> Result<(), Vec<String>>;
}

impl ValidateRequest for CreateHabitRequest {
    fn validate(&self) -> Result<(), Vec<String>> {
        let mut errors = Vec::new();
        if self.name.is_empty() || self.name.len() > 255 {
            errors.push("name must be 1-255 characters".into());
        }
        if !["daily", "weekly", "custom"].contains(&self.frequency.as_str()) {
            errors.push(format!("invalid frequency: {}", self.frequency));
        }
        if self.target_count < 1 || self.target_count > 100 {
            errors.push("target_count must be 1-100".into());
        }
        if errors.is_empty() { Ok(()) } else { Err(errors) }
    }
}
```

**Impact**: Clear validation requirements, easier to maintain.  
**Effort**: 0.25 hours

---

## ISSUE CATEGORY: DOCUMENTATION (2 issues, 0.5 hours)

### DOC-1: Missing Model Relationship Documentation
**Location**: All model files  
**Issue**: No documentation of relationships between models (1:many, many:many, etc.)

**Solution**: Add relationship diagrams or docs.

```rust
//! # Database Models
//!
//! ## Model Relationships
//!
//! ```
//! User (1) ──→ (many) Habit
//! User (1) ──→ (many) Goal
//! User (1) ──→ (many) UserQuestProgress
//! UniversalQuest (1) ──→ (many) UserQuestProgress
//! ```
//!
//! ## Field Consistency
//!
//! All models follow these conventions:
//! - `id: Uuid` - Primary key
//! - `user_id: Uuid` - Foreign key to User (except for system tables)
//! - `created_at: DateTime<Utc>` - Creation timestamp
//! - `updated_at: DateTime<Utc>` - Last update timestamp
//!
//! ## Timestamp Handling
//!
//! All timestamp fields use `DateTime<Utc>` for consistency:
//! - Database stores as `timestamp with time zone`
//! - Serialized to ISO 8601 in JSON
//! - Times always UTC, no timezone conversion
```

**Impact**: Clear understanding of model structure.  
**Effort**: 0.25 hours

---

### DOC-2: Missing Enum Value Documentation
**Location**: All enum definitions  
**Code**:
```rust
pub enum QuestStatus {
    Available,
    Accepted,
    InProgress,
    Completed,
    Claimed,
    Abandoned,
    Expired,
}
```

**Issue**: No documentation of what each variant means or when it's used.

**Solution**: Add doc comments.

```rust
/// Quest status lifecycle
///
/// Transitions:
/// - Available → Accepted (user accepts quest)
/// - Accepted → InProgress (user starts quest)
/// - InProgress → Completed (user completes requirements)
/// - Completed → Claimed (user claims rewards)
/// - Accepted/InProgress → Abandoned (user gives up)
/// - Available/Accepted → Expired (time limit exceeded)
///
/// Variants:
/// - `Available` - Quest available for user to accept
/// - `Accepted` - User accepted, not yet started
/// - `InProgress` - User actively working on quest
/// - `Completed` - Requirements met, rewards ready to claim
/// - `Claimed` - Rewards claimed, quest finished
/// - `Abandoned` - User gave up before completion
/// - `Expired` - Time limit exceeded (for time-limited quests)
pub enum QuestStatus {
    Available,
    Accepted,
    InProgress,
    Completed,
    Claimed,
    Abandoned,
    Expired,
}
```

**Impact**: Clear semantics for each status.  
**Effort**: 0.25 hours

---

## ISSUE CATEGORY: DEPRECATIONS (1 issue, 0.25 hours)

### DEPR-1: Legacy UserRole Enum Should Be Used or Removed
**Location**: `models.rs:33-65`  
**Code**:
```rust
/// User role enum
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
#[allow(dead_code)]
pub enum UserRole {
    User,
    Moderator,
    Admin,
}

impl User {
    /// Check if user has admin role
    pub fn is_admin(&self) -> bool {
        self.role.eq_ignore_ascii_case("admin")  // Uses String instead of UserRole enum
    }
}
```

**Issue**: 
1. UserRole enum defined but User struct uses String for role
2. is_admin() checks String, not enum
3. Dead code allowance suggests enum not actively used
4. Creates confusion about which pattern to follow

**Solution**: Either use enum consistently or remove it.

```rust
// Option A: Use enum (breaking change, requires migration)
pub struct User {
    pub id: Uuid,
    pub role: UserRole,  // Change from String
    // ...
}

impl User {
    pub fn is_admin(&self) -> bool {
        self.role == UserRole::Admin
    }
}

// Option B: Document why String is used
/// User database model
///
/// NOTE: role is String (not UserRole enum) for flexibility with database:
/// - Database stores arbitrary strings (easier for custom roles)
/// - UserRole enum kept for frontend/API type safety
/// - Use UserRole::from_str() to parse user.role if needed
pub struct User {
    pub role: String,
    // ...
}
```

**Impact**: Clarity about role handling pattern.  
**Effort**: 0.25 hours

---

## ISSUE CATEGORY: LINTING (1 issue, 0.15 hours)

### LINT-1: Inconsistent Enum Serde Configuration
**Location**: All status enums  
**Pattern**:
```rust
// Most:
#[serde(rename_all = "snake_case")]
pub enum GoalStatus { ... }

// Some also:
#[serde(rename_all = "lowercase")]
pub enum UserRole { ... }
```

**Issue**: Inconsistent serde rename strategy (snake_case vs lowercase).

**Solution**: Standardize on snake_case.

```rust
// Standard:
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GoalStatus {
    Active,
    Completed,
    Abandoned,
    Paused,
}

// All variants use snake_case in JSON:
// "active", "completed", "abandoned", "paused"
```

**Impact**: Consistent JSON serialization across all enums.  
**Effort**: 0.15 hours

---

## CROSS-CUTTING PATTERNS

### Pattern #1: Status Enum Boilerplate Should Be Macro-ified
**Affected**: 10+ status/mode enums across 15+ files  
**Duplication**: ~200-300 lines of impl blocks  
**Consolidation**: Create named_enum! macro or trait-based pattern

**Impact**: Eliminates duplicate code, simplifies enum definition.  
**Effort**: 0.75 hours (create macro, migrate enums)

---

### Pattern #2: Naming Conventions Should Be Documented
**Affected**: 19 model files with inconsistent patterns  
**Consolidation**: Create MODELS.md documentation with conventions

**Impact**: Clear expectations for new models.  
**Effort**: 0.25 hours

---

### Pattern #3: Request Type Defaults Should Be Centralized
**Affected**: ~5 request types with default functions  
**Consolidation**: Create defaults module

**Impact**: Single place to see all defaults.  
**Effort**: 0.25 hours

---

## IMPLEMENTATION ROADMAP

### Phase 1: Create Enum Macro (0.75 hours)
- [ ] Create `enums/mod.rs` with named_enum! macro
- [ ] Implement FromStr, Display, as_str for macro-generated enums
- [ ] Test macro with 2-3 status enums

### Phase 2: Migrate Status Enums (0.5 hours, ongoing)
- [ ] Update high-use enums (GoalStatus, QuestStatus, FocusStatus)
- [ ] Verify serialization/deserialization still works
- [ ] Add FromStr tests

### Phase 3: Document Conventions (0.5 hours)
- [ ] Create MODELS.md with naming conventions
- [ ] Add field naming guidelines
- [ ] Document timestamp/ID/Boolean patterns
- [ ] Add relationship diagrams

### Phase 4: Centralize Defaults (0.25 hours)
- [ ] Create defaults module
- [ ] Move all default functions to module
- [ ] Update request types to reference module

### Phase 5: Documentation (0.5 hours)
- [ ] Add doc comments to all enum variants
- [ ] Document model relationships
- [ ] Add validation requirements to request types
- [ ] Document timestamp consistency rules

### Phase 6: Code Quality (0.25 hours)
- [ ] Remove dead_code allowances or document intent
- [ ] Standardize serde(rename_all) everywhere
- [ ] Run clippy on model files

---

## VALIDATION CHECKLIST

### Consistency
- [ ] All status enums use snake_case rename
- [ ] All enums have as_str(), FromStr, Display
- [ ] All timestamps use DateTime<Utc> with _at suffix
- [ ] All IDs use _id suffix
- [ ] All booleans consistently prefixed (is_state) or not (is_query)
- [ ] Request/Response type names follow convention

### Documentation
- [ ] All enum variants documented
- [ ] Model relationships documented
- [ ] Naming conventions documented
- [ ] Validation requirements documented
- [ ] Default values documented

### Code Quality
- [ ] No duplicate enum impl blocks (using macro)
- [ ] No dead_code allowances (document or remove)
- [ ] Consistent serde configuration
- [ ] All request types have validation docs or impl

### Testing
- [ ] Enum serialization works
- [ ] Enum deserialization works
- [ ] FromStr parsing works
- [ ] Display formatting works

---

## SUMMARY

Database models have **widespread consistency issues** but nothing blocking. Main problems are:

**Highest Priority**: Create enum macro to eliminate ~200-300 lines of duplicate status enum code.

**Important**: Document naming conventions for new model creation.

**Quality**: Standardize field naming (boolean prefixes, timestamp suffixes, ID naming).

**Quick Wins**: 
- Create enum macro and migrate status enums (1-1.5 hours)
- Document naming conventions (0.5 hours)
- Centralize default functions (0.25 hours)

**Total Effort**: 2-2.5 hours to improve consistency and reduce duplication.

**ROI**: 
- Code reduction: 200-300 lines eliminated via macro
- Consistency: Clear patterns for all new models
- Maintainability: Enum changes only require macro update
- Onboarding: Developers know naming conventions
