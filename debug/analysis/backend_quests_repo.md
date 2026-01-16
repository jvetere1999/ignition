# Analysis #5: Backend Quests Repository (`quests_repos.rs`)

**File**: `app/backend/crates/api/src/db/quests_repos.rs`  
**Size**: 317 lines  
**Repository Classes**: 1 (QuestsRepo)  
**Total Methods**: 8  
**Status**: ANALYZED - MEDIUM IMPACT FOCUSED DESIGN  
**Date**: 2026-01-15

---

## EXECUTIVE SUMMARY

This file implements a single repository class for quest system operations. While significantly smaller and more focused than habits_repo, it exhibits several optimization opportunities:

1. **Dynamic Query Building** (String formatting antipattern)
2. **Status String Hardcoding** (Repeated 'active', 'completed', 'abandoned', 'expired')
3. **Missing Documentation** (No doc comments on any public methods)
4. **Streak Logic Duplication** (Appears in both quests and habits, not DRY)
5. **Magic Numbers in Rewards** (Difficulty-to-reward mapping hardcoded)

**Estimated Cleanup Effort**: ~6.5 hours

**Key Difference from HabitsRepo**: Uses `QUEST_COLUMNS` constant (good pattern!) but undermines it with string formatting in queries.

---

## SECTION 1: COMMON OPERATIONS TO EXTRACT

### OP-1: Dynamic Query Building with format! (Lines 30-68, 75-81, 95-120)

**CRITICAL ISSUE**: Uses `format!()` for SQL queries - antipattern that defeats SQLx compile-time checking.

**Current Pattern** (appears 8+ times):
```rust
let query = format!(
    r#"INSERT INTO user_quests
       (user_id, title, description, category, difficulty, xp_reward, coin_reward,
        target, is_repeatable, repeat_frequency, status, is_active, progress, streak_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', true, 0, 0)
       RETURNING {}"#,
    QUEST_COLUMNS
);

let quest = sqlx::query_as::<_, Quest>(&query)
    .bind(user_id)
    // ... bindings
    .fetch_one(pool)
    .await?;
```

**Problems**:
1. ❌ String concatenation defeats SQLx compile-time safety
2. ❌ Query is generated at runtime (performance cost)
3. ❌ If QUEST_COLUMNS has typos, panics at runtime
4. ❌ Makes queries harder to reason about
5. ❌ Could be target for SQL injection if not careful

**Solution: Remove format!() entirely**

```rust
// Instead of using QUEST_COLUMNS constant, just list columns:
pub async fn create(
    pool: &PgPool,
    user_id: Uuid,
    req: &CreateQuestRequest,
) -> Result<Quest, AppError> {
    let (default_xp, default_coins) = Self::reward_for_difficulty(&req.difficulty);
    let xp = req.xp_reward.unwrap_or(default_xp);
    let coins = req.coin_reward.unwrap_or(default_coins);
    let target = req.target.unwrap_or(1);

    let quest = sqlx::query_as::<_, Quest>(
        r#"INSERT INTO user_quests
           (user_id, title, description, category, difficulty, xp_reward, coin_reward,
            target, is_repeatable, repeat_frequency, status, is_active, progress, streak_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', true, 0, 0)
           RETURNING id, user_id, source_quest_id, title, description, category, difficulty,
                     xp_reward, coin_reward, status, progress, target, is_active, is_repeatable,
                     repeat_frequency, accepted_at, completed_at, claimed_at, expires_at,
                     last_completed_date, streak_count, created_at, updated_at"#,
    )
    .bind(user_id)
    .bind(&req.title)
    .bind(&req.description)
    .bind(&req.category)
    .bind(&req.difficulty)
    .bind(xp)
    .bind(coins)
    .bind(target)
    .bind(req.is_repeatable.unwrap_or(false))
    .bind(&req.repeat_frequency)
    .fetch_one(pool)
    .await?;

    Ok(quest)
}
```

**Benefit**: 
- Full SQLx compile-time checking
- No runtime query generation
- Queries are visible and easy to audit

**Locations with format!()** (8 instances):
- Line 55: CREATE query
- Line 76: GET_BY_ID query
- Line 101: LIST query (with status filter)
- Line 110: LIST query (without filter)
- Line 154: UPDATE for accept_quest
- Line 196: UPDATE for complete_quest
- Line 231: UPDATE for update_progress
- Line 262: UPDATE for abandon_quest

---

### OP-2: Difficulty-to-Reward Mapping (Lines 38-45)

**Current Pattern** (hardcoded match):
```rust
let (default_xp, default_coins) = match req.difficulty.as_str() {
    "starter" => (10, 5),
    "easy" => (25, 10),
    "medium" => (50, 25),
    "hard" => (100, 50),
    "epic" => (250, 100),
    _ => (10, 5),
};
```

**Issues**:
1. Appears only once (good!)
2. But hardcoded values with no documentation
3. Should be constants or config

**Extractable**:
```rust
/// Quest difficulty levels and their default rewards
pub struct DifficultyRewards {
    pub xp: i32,
    pub coins: i32,
}

impl QuestsRepo {
    fn reward_for_difficulty(difficulty: &str) -> (i32, i32) {
        let reward = match difficulty {
            "starter" => DifficultyRewards { xp: 10, coins: 5 },
            "easy" => DifficultyRewards { xp: 25, coins: 10 },
            "medium" => DifficultyRewards { xp: 50, coins: 25 },
            "hard" => DifficultyRewards { xp: 100, coins: 50 },
            "epic" => DifficultyRewards { xp: 250, coins: 100 },
            _ => DifficultyRewards { xp: 10, coins: 5 },
        };
        (reward.xp, reward.coins)
    }
}
```

**Better Yet**: Move to database as lookup table:
```sql
CREATE TABLE quest_difficulty_rewards (
    difficulty VARCHAR(20) PRIMARY KEY,
    xp_reward INT NOT NULL,
    coin_reward INT NOT NULL
);

INSERT INTO quest_difficulty_rewards VALUES
    ('starter', 10, 5),
    ('easy', 25, 10),
    ('medium', 50, 25),
    ('hard', 100, 50),
    ('epic', 250, 100);
```

Then query:
```rust
let (default_xp, default_coins) = sqlx::query_as::<_, (i32, i32)>(
    "SELECT xp_reward, coin_reward FROM quest_difficulty_rewards WHERE difficulty = $1"
)
.bind(&req.difficulty)
.fetch_one(pool)
.await
.unwrap_or((10, 5));
```

---

### OP-3: Streak Calculation (Lines 184-192)

**Current Pattern**:
```rust
let new_streak = if quest.is_repeatable {
    let yesterday = today.pred_opt().unwrap_or(today);
    match quest.last_completed_date {
        None => 1,
        Some(last) if last == yesterday => quest.streak_count + 1,
        Some(_) => 1,
    }
} else {
    0
};
```

**Issue**: Identical to HabitsRepo::complete_habit() streak logic (lines 289-298 in habits_goals_repos.rs)

**Extractable**: Create shared utility function in `db/mod.rs`:
```rust
/// Calculate streak for repeatable events
pub fn calculate_streak(
    last_completion: Option<chrono::NaiveDate>,
    today: chrono::NaiveDate,
    current_streak: i32,
) -> i32 {
    match last_completion {
        None => 1,
        Some(last) if last == today.pred() => current_streak + 1,
        Some(_) => 1,
    }
}

// Usage in both files:
let new_streak = if is_repeatable {
    calculate_streak(last_completed_date, today, streak_count)
} else {
    0
};
```

---

### OP-4: Quest Status Validation Pattern (Lines 126-133, 170-177, 215-222)

**Repeated Pattern** (appears 3+ times):
```rust
if quest.status != "active" {
    return Err(AppError::BadRequest(format!(
        "Quest cannot be accepted (status: {})",
        quest.status
    )));
}
```

**Extractable**:
```rust
/// Validate quest can transition to target status
fn validate_status_transition(current: &str, target: &str) -> Result<(), AppError> {
    // Define valid state transitions
    let valid_transitions = match target {
        "accepted" => ["active"].as_slice(),
        "completed" => ["active", "accepted"].as_slice(),
        "abandoned" => ["active", "accepted"].as_slice(),
        _ => return Err(AppError::BadRequest(format!("Invalid status: {}", target))),
    };

    if !valid_transitions.contains(&current) {
        return Err(AppError::BadRequest(format!(
            "Cannot transition from {} to {} status",
            current, target
        )));
    }
    Ok(())
}

// Usage:
Self::validate_status_transition(&quest.status, "accepted")?;
```

---

## SECTION 2: CODE CLEANUP OPPORTUNITIES

### CLEANUP-1: Magic Status Strings (6+ occurrences)

**Locations**:
- Line 58: `'active'` in INSERT
- Line 126: `"active"` in validation
- Line 154: `'accepted'` in UPDATE
- Line 178: `"accepted"` in validation
- Line 170: `"completed"`, `"abandoned"`, `"expired"` check
- Line 196: `'completed'` in UPDATE
- Line 262: `'abandoned'` in UPDATE

**Better**: Create enum in quests_models.rs:
```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "quest_status", rename_all = "lowercase")]
pub enum QuestStatus {
    Active,
    Accepted,
    Completed,
    Abandoned,
    Expired,
}

impl std::fmt::Display for QuestStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            Self::Active => write!(f, "active"),
            Self::Accepted => write!(f, "accepted"),
            Self::Completed => write!(f, "completed"),
            Self::Abandoned => write!(f, "abandoned"),
            Self::Expired => write!(f, "expired"),
        }
    }
}

// Then in repo:
let new_status = if quest.is_repeatable {
    QuestStatus::Accepted
} else {
    quest.status
};
```

---

### CLEANUP-2: Unvalidated Clamping (Line 225)

**Current** (silent clipping):
```rust
let clamped_progress = progress.clamp(0, quest.target);
```

**Issue**:
- User requested progress=150 for target=100
- Code silently clamps to 100
- No feedback to user that input was rejected

**Better**:
```rust
let clamped_progress = if progress < 0 || progress > quest.target {
    return Err(AppError::BadRequest(format!(
        "Progress {} out of range [0, {}]",
        progress, quest.target
    )));
} else {
    progress
};
```

---

### CLEANUP-3: Inconsistent Error Messages

**Issue**: Error messages vary in style:
- Line 127: `"Quest cannot be accepted (status: {})"`
- Line 172: `"Quest cannot be completed (status: {})"`
- Line 216: `"Quest progress cannot be updated (status: {})"`
- Line 244: `"Quest cannot be abandoned (status: {})"`

**Better**: Standardize format:
```rust
// Helper:
fn invalid_status_error(action: &str, current: &str) -> AppError {
    AppError::BadRequest(format!(
        "Cannot {} quest (current status: {})",
        action, current
    ))
}

// Usage:
return Err(Self::invalid_status_error("accept", &quest.status));
```

---

### CLEANUP-4: Idempotency Key Generation (Line 208)

**Current**:
```rust
let idempotency_key = format!("quest_complete_{}_{}", quest_id, today);
```

**Issue**: Same pattern as habits_repo, should use shared utility function (see OP-4 in habits_repo analysis)

---

### CLEANUP-5: Missing Into Conversion (Line 119)

**Current** (manual conversion):
```rust
Ok(QuestsListResponse {
    quests: quests.into_iter().map(|q| q.into()).collect(),
    total,
})
```

**Issue**: Uses `.into()` but could be more explicit

**Better**: Implement `From<Quest> for QuestResponse`:
```rust
// In quests_models.rs
impl From<Quest> for QuestResponse {
    fn from(q: Quest) -> Self {
        Self {
            // ... field mapping
        }
    }
}

// Then:
Ok(QuestsListResponse {
    quests: quests.into_iter().map(Into::into).collect(),
    total,
})
```

---

## SECTION 3: MISSING DOCUMENTATION

### DOC-1: All Public Methods (8 methods, 0 doc comments)

**Missing docs**:
- Line 30: `create()` - How are defaults calculated?
- Line 68: `get_by_id()` - No explanation
- Line 84: `list()` - Status filter behavior?
- Line 122: `accept_quest()` - Valid transitions?
- Line 165: `complete_quest()` - Side effects?
- Line 206: `update_progress()` - When called?
- Line 239: `abandon_quest()` - Final status?

**Example Fix**:
```rust
/// Accept a quest (transition: active → accepted)
///
/// # Valid Transitions
/// - Only 'active' status can be accepted
/// - Once accepted, quest tracks progress
///
/// # Side Effects
/// - Updates quest.status to 'accepted'
/// - Sets quest.accepted_at timestamp
/// - Does NOT award XP (awarded on completion)
///
/// # Returns
/// - Updated Quest with status='accepted'
/// - AppError::BadRequest if quest is not in 'active' status
/// - AppError::NotFound if quest doesn't exist
///
/// # Example
/// ```
/// let quest = QuestsRepo::accept_quest(pool, quest_id, user_id).await?;
/// assert_eq!(quest.status, "accepted");
/// ```
pub async fn accept_quest(
    pool: &PgPool,
    quest_id: Uuid,
    user_id: Uuid,
) -> Result<Quest, AppError> {
    // ...
}
```

---

### DOC-2: Status State Machine

**Missing**: Diagram/documentation of valid status transitions

**Should Include**:
```rust
/// # Quest Status Lifecycle
///
/// ```text
/// ┌──────────┐
/// │  active  │ (quest available, not yet accepted)
/// └──────┬───┘
///        │
///        ├─→ accepted (player accepted, tracking progress)
///        │      │
///        │      ├─→ completed (all progress done, XP awarded)
///        │      │
///        │      └─→ abandoned (player quit)
///        │
///        └─→ expired (due date passed, auto-removed)
///
/// Valid transitions:
/// - active → accepted: via accept_quest()
/// - active → abandoned: via abandon_quest()
/// - accepted → completed: via complete_quest()
/// - accepted → abandoned: via abandon_quest()
/// - Any → expired: via scheduler (not in this repo)
///
/// Invalid transitions:
/// - completed → anything (terminal state)
/// - abandoned → anything (terminal state)
/// - accepted → active (no downgrade)
/// ```
```

---

### DOC-3: Repeatable Quest Logic

**Missing**: Explanation of repeatable flag and streak behavior

```rust
/// # Repeatable Quests
///
/// Repeatable quests can be completed multiple times and track streaks.
///
/// ## Streak Calculation
/// - First completion: streak = 1
/// - Completion after yesterday: streak += 1
/// - Gap > 1 day: streak resets to 1
///
/// ## Reward Behavior
/// - Same XP/coins awarded each completion
/// - Idempotency key includes date: prevents double-rewards
/// - Multiple completions same day return cached result
///
/// ## Example
/// - Day 1: complete → streak=1
/// - Day 2: complete → streak=2 (consecutive)
/// - Day 3: skip
/// - Day 4: complete → streak=1 (streak broken)
```

---

## SECTION 4: DEPRECATION CANDIDATES

### DEP-1: QUEST_COLUMNS Constant (Line 14)

**Current Usage**: Passed to `format!()` macro

**Issue**: Constant is undermined by format! antipattern

**Recommendation**: Remove constant, embed column names in queries directly (see OP-1)

**Note**: If retained despite format! refactoring, could serve as schema documentation. Otherwise, delete.

---

## SECTION 5: LINT ERRORS & WARNINGS

### LINT-1: format! Used for SQL (8+ instances)

**Severity**: 🔴 CRITICAL

**Issue**: All queries use `format!()` instead of static strings

**Impact**:
- No compile-time SQL validation
- Runtime performance cost
- Security risk if not careful

**Fix**: Remove all format!() calls (see OP-1)

---

### LINT-2: String Comparisons for Status (10+ instances)

**Issue**:
```rust
if quest.status != "active" { // string comparison
```

**Better**: Use enum comparisons (see CLEANUP-1)

---

### LINT-3: Inconsistent Error Context

**Issue**:
```rust
// Line 132
"Quest cannot be accepted (status: {})"

// Line 177
"Quest cannot be completed (status: {})"

// Line 221
"Quest progress cannot be updated (status: {})"

// Line 246
"Quest cannot be abandoned (status: {})"
```

**Fix**: Use consistent template (see CLEANUP-3)

---

### LINT-4: pred_opt() Could Panic (Line 187)

**Issue**:
```rust
let yesterday = today.pred_opt().unwrap_or(today);
```

If `pred_opt()` returns None, defaults to `today` (wrong semantics)

**Better**:
```rust
let yesterday = today.pred();  // Always valid for valid dates
```

---

### LINT-5: Missing Input Validation

**Issue**: No validation on:
- `req.title` - could be empty string
- `req.description` - could be null
- `req.category` - could be invalid
- `req.difficulty` - could be unknown (handled with _, but should validate)
- `progress` - checked with clamp, but no feedback

**Fix**: Add validation layer:
```rust
pub async fn create(
    pool: &PgPool,
    user_id: Uuid,
    req: &CreateQuestRequest,
) -> Result<Quest, AppError> {
    // Validate input
    if req.title.trim().is_empty() {
        return Err(AppError::BadRequest("Quest title cannot be empty".into()));
    }
    
    if !["starter", "easy", "medium", "hard", "epic"].contains(&req.difficulty.as_str()) {
        return Err(AppError::BadRequest(format!("Invalid difficulty: {}", req.difficulty)));
    }
    
    // ... continue
}
```

---

### LINT-6: Unused Query Performance

**Issue**: Every `get_by_id()` and status check calls database

**Optimization**: Cache quest status in-memory if frequently checked:
```rust
// Could batch prefetch quests to reduce round-trips
pub async fn get_multiple_by_id(
    pool: &PgPool,
    user_id: Uuid,
    quest_ids: &[Uuid],
) -> Result<HashMap<Uuid, Quest>, AppError> {
    let quests = sqlx::query_as::<_, Quest>(
        r#"SELECT ... FROM user_quests 
           WHERE user_id = $1 AND id = ANY($2)"#,
    )
    .bind(user_id)
    .bind(quest_ids)
    .fetch_all(pool)
    .await?;
    
    Ok(quests.into_iter().map(|q| (q.id, q)).collect())
}
```

---

## SUMMARY TABLE

| Category | Count | Examples | Impact |
|---|---|---|---|
| **Common Operations** | 4 | Dynamic queries, rewards, streaks, status validation | HIGH (4-5 hours) |
| **Code Cleanup** | 5 | Magic strings, unvalidated input, error messages | HIGH (3-4 hours) |
| **Documentation** | 3 | All methods, state machine, repeatable logic | MEDIUM (2-3 hours) |
| **Deprecations** | 1 | QUEST_COLUMNS constant | LOW (0.5 hours) |
| **Lint Issues** | 6 | format! queries, string comparisons, validation | HIGH (2-3 hours) |
| **TOTAL** | **19 ISSUES** | **Across 317 lines** | **6.5 hours effort** |

---

## KEY FINDINGS

### 🔴 CRITICAL
1. **format!() SQL Queries** (8 instances): Defeats SQLx compile-time checking, runtime generation cost
2. **String-based Status Values**: No type safety, error-prone comparisons

### 🟡 HIGH
3. **Duplicate Streak Logic**: Identical to habits_repo, should be extracted to shared utility
4. **Missing All Documentation**: No doc comments on any public methods
5. **Magic Numbers in Rewards**: Difficulty-to-reward mapping hardcoded, should be in database

### 🟢 MEDIUM
6. **No Input Validation**: Title, category, difficulty not validated
7. **Inconsistent Error Messages**: Style varies across methods
8. **Silent Input Clamping**: Progress clamping without user feedback

---

## IMPLEMENTATION ROADMAP

### Phase 1: Remove format!() from Queries (2 hours)
1. Replace all 8 format!() calls with static query strings
2. Embed full column list in each query
3. Validate SQLx compiles with full type checking
4. Test all methods execute correctly

### Phase 2: Extract Common Operations (1.5 hours)
1. Create `calculate_streak()` utility in `db/mod.rs`
2. Create `validate_status_transition()` function
3. Extract `reward_for_difficulty()` as reusable function
4. Extract idempotency key generation helper

### Phase 3: Type Safety (1 hour)
1. Create `QuestStatus` enum
2. Replace all string comparisons with enum
3. Update database schema with CHECK constraint
4. Update all queries to use enum binding

### Phase 4: Input Validation (0.75 hours)
1. Add validation for title (non-empty)
2. Add validation for difficulty (enum check)
3. Add validation for progress (with error feedback)
4. Add validation for category

### Phase 5: Documentation (1 hour)
1. Add `///` comments to all 8 methods
2. Document state machine transitions
3. Document repeatable quest behavior
4. Add usage examples

### Phase 6: Linting (0.25 hours)
1. Fix pred_opt() usage
2. Standardize error messages
3. Add clippy lint fixes

---

## VALIDATION CHECKLIST

After implementing cleanups:

- [ ] All format!() calls removed (0 remaining)
- [ ] QuestStatus enum created and used throughout
- [ ] All 8 methods have doc comments
- [ ] State machine transitions documented
- [ ] Input validation added (title, difficulty, progress)
- [ ] Error messages consistent
- [ ] Streak calculation extracted to shared utility
- [ ] Difficulty rewards moved to database or constant
- [ ] Idempotency key generation uses shared utility
- [ ] cargo check passes with 0 errors
- [ ] Clippy lints addressed

---

## COMPARISON TO HabitsRepo

| Aspect | QuestsRepo | HabitsRepo | Note |
|---|---|---|---|
| Lines | 317 | 686 | Half the size, more focused |
| Methods | 8 | 12 | Fewer operations needed |
| Complexity | Medium | High | N+1 joins vs format! queries |
| Main Issue | format!() queries | Monolithic design | Different problem classes |
| Reusability | Low (status strings) | Medium (mapping duplicated) | Both need common utilities |

---

## NEXT STEPS

1. **Review with team**: format!() refactoring is critical path item
2. **Prioritize Phase 1**: Remove format!() first (enables compile-time checking)
3. **Share status enum** with habits_repo for consistency
4. **Extract shared utilities** to `db/mod.rs` (calculate_streak, etc.)
5. **Test thoroughly**: Status transitions are state machine, easy to break

---

## EFFORT ESTIMATION

**Per-task breakdown**:
- Remove format!() (8 queries): 60 minutes (careful refactoring)
- Extract common operations: 90 minutes
- Type safety enum: 60 minutes
- Input validation: 45 minutes
- Documentation: 60 minutes
- Linting: 15 minutes

**Total: ~6.5 hours** (assumes no major redesign)

**Optional Enhancements** (not included in estimate):
- Move difficulty rewards to database lookup table: +30 minutes
- Add batch quest operations: +60 minutes
- Add caching layer: +120 minutes

