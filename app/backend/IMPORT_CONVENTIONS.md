# Import Conventions & Module Visibility Guide

**Date**: January 15, 2026  
**Status**: ACTIVE  
**Applies To**: All Rust files in `app/backend/crates/api/src/`

## Table of Contents
1. [Import Organization Standard](#import-organization-standard)
2. [Module Visibility Rules](#module-visibility-rules)
3. [Re-export Patterns](#re-export-patterns)
4. [Wildcard Import Policy](#wildcard-import-policy)

---

## Import Organization Standard

All Rust files MUST follow this import grouping and ordering convention:

### Standard Pattern

```rust
// Group 1: Standard Library (std)
// - std and std::* modules
// - Alphabetically ordered within group
use std::sync::Arc;
use std::time::Instant;

// Group 2: External Crates
// - All non-std, non-crate imports
// - Alphabetically ordered
// - Multi-line imports with alphabetical sub-ordering
use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
    routing::{delete, get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

// Group 3: Internal Crate Imports
// - use crate::* imports only
// - Alphabetically ordered
// - Deepest paths come first (db::repos before db)
use crate::db::gamification_repos::UserProgressRepo;
use crate::db::habits_goals_models::{CreateHabitRequest, Habit};
use crate::db::habits_goals_repos::HabitsRepo;
use crate::error::AppError;
use crate::state::AppState;

// Group 4: Relative/Super Imports
// - use super::* and use self::*
// - Alphabetically ordered
// - Use only when necessary (usually in mod.rs files)
use super::models::*;
use self::helpers::*;
```

### Key Rules

1. **Four Groups**: Always maintain these four import groups in order
2. **Blank Lines**: One blank line between each group
3. **Alphabetical Ordering**: Within each group, sort alphabetically
4. **Multi-line Imports**: Items within curly braces must be alphabetically ordered
5. **No Mixing**: Never mix groups (e.g., std after crate imports is wrong)
6. **No Duplicate Groups**: If a crate appears in Group 4, don't import it again in Group 3

### Examples

#### ❌ WRONG - Groups mixed and unordered

```rust
use crate::error::AppError;
use std::sync::Arc;
use serde::Serialize;
use crate::db::repos::UserRepo;
use chrono::Utc;
```

#### ✅ CORRECT - Proper grouping and ordering

```rust
use std::sync::Arc;

use chrono::Utc;
use serde::Serialize;

use crate::db::repos::UserRepo;
use crate::error::AppError;
```

---

## Module Visibility Rules

### Public Module Declaration (mod.rs)

```rust
//! Module documentation
//!
//! Describe what this module contains

// PUBLIC: Required external APIs
pub mod models;  // Database entity structs
pub mod repos;   // Repository pattern implementations

// PRIVATE: Internal implementations
mod helpers;
mod validators;

// RE-EXPORTS: Convenience re-exports for API consumers
pub use models::{User, Habit, Quest};
pub use repos::{UserRepo, HabitsRepo};
```

**Rules**:
- All public modules MUST be declared with `pub mod`
- Private implementation modules use `mod` (no `pub`)
- Re-exports MUST come after module declarations
- Re-exports SHOULD only expose commonly-used types

### Example: db/mod.rs Structure

```rust
//! Database module - models and repositories

// PUBLIC MODULES
pub mod core;      // DB utilities and observability
pub mod macros;    // Code generation macros
pub mod admin_models;
pub mod admin_repos;
// ... other models and repos ...

// PRIVATE MODULES (future)
// None currently

// RE-EXPORTS: Convenience for route handlers
pub use core::QueryContext;
pub use admin_models::AdminUser;
pub use admin_repos::AdminRepo;
```

---

## Re-export Patterns

### When to Use Re-exports

**✅ DO RE-EXPORT**:
- Types frequently imported in route handlers
- Core abstractions (User, Habit, Goal, etc.)
- Commonly-used repository traits
- Public error types

**❌ DON'T RE-EXPORT**:
- Internal helper types
- Database implementation details (SQL query types)
- Temporary/draft types
- Trait internals (only expose the trait itself)

### Re-export Example

```rust
// db/mod.rs - RE-EXPORTS
pub use core::QueryContext;
pub use habits_goals_models::{Habit, Goal};
pub use habits_goals_repos::{HabitsRepo, GoalsRepo};

// Usage in routes/habits.rs
use crate::db::{Habit, HabitsRepo, QueryContext};
// Instead of:
use crate::db::habits_goals_models::Habit;
use crate::db::habits_goals_repos::HabitsRepo;
use crate::db::core::QueryContext;
```

---

## Wildcard Import Policy

### Wildcard Import Rules

**❌ NEVER USE WILDCARDS for**:
- Modules with many exports (db/*, routes/*)
- External crates (use axum::*, use serde::*)
- In public library code (violates discoverability)

**✅ OK TO USE WILDCARDS for**:
- Test modules: `use super::*;` (acceptable, limited scope)
- Macro-generated code (if needed)
- Internal implementation details (private modules only)

### Wildcard Violations (Current)

These patterns MUST be changed:

```rust
// ❌ BAD - In quests_models.rs
use crate::db::quests_models::*;

// ✅ GOOD - Explicit imports
use crate::db::quests_models::{Quest, QuestStatus, QuestDifficulty};
```

---

## Validation & Enforcement

### Automated Checks

```bash
# Check import ordering (after rustfmt update)
cargo fmt -- --check

# Clippy will flag some import issues
cargo clippy --all-targets -- -W clippy::wildcard_imports
```

### Code Review Checklist

When reviewing code, ensure:
- [ ] Imports follow four-group pattern
- [ ] Groups are separated by blank lines
- [ ] Within-group items are alphabetically ordered
- [ ] No wildcard imports (except tests)
- [ ] No duplicate imports across groups
- [ ] Module visibility is correct (pub/private)
- [ ] Re-exports are at end of mod.rs file

### Manual Format Verification

Run this before committing:

```bash
# In app/backend/
cargo fmt --all
cargo clippy --all-targets
```

---

## Migration Guide (For Existing Code)

### Step 1: Identify All Import Blocks
```bash
grep -n "^use " app/backend/crates/api/src/**/*.rs | head -50
```

### Step 2: Reorganize by Hand or Tool
For each file:
1. Group imports into four categories
2. Alphabetically sort each group
3. Add blank line between groups
4. Remove any wildcard imports

### Step 3: Validate
```bash
cargo fmt --all
cargo check --bin ignition-api
```

---

## Examples by Module

### routes/habits.rs (Route Handler)

```rust
use std::sync::Arc;

use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    routing::{delete, get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::db::{Habit, HabitsRepo};
use crate::error::AppError;
use crate::state::AppState;

// Handler implementations...
```

### db/core.rs (Database Utilities)

```rust
use chrono::Utc;
use sqlx::{Executor, PgPool, Row};
use uuid::Uuid;

use crate::error::AppError;

// Implementation...
```

### tests/fixtures.rs (Test Fixtures)

```rust
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::gamification_repos::UserProgressRepo;
use crate::db::habits_goals_models::CreateHabitRequest;
use crate::db::habits_goals_repos::HabitsRepo;

// Fixtures...
```

---

## FAQ

**Q: What about conditional imports (`#[cfg(...)]`)?**  
A: Keep them with the main import group they belong to, with a comment:

```rust
use std::sync::Arc;

use serde::Serialize;
#[cfg(test)]
use serde::Deserialize;  // Only in tests
```

**Q: Should I use `use crate::db::{Habit, HabitsRepo};` or two separate use statements?**  
A: Prefer grouping in a single `use` statement with curly braces for readability.

**Q: What about glob imports in tests?**  
A: Acceptable. Tests are allowed to use `use super::*;` for brevity.

**Q: Can I re-export in non-mod.rs files?**  
A: Discouraged. Keep re-exports in `mod.rs` files only.

---

## Implementation Timeline

- **Phase 1**: Define conventions (COMPLETE - this document)
- **Phase 2**: Refactor high-impact files (db/mod.rs, routes/mod.rs, etc.)
- **Phase 3**: Automated linting via rustfmt/clippy
- **Phase 4**: Code review enforcement
