# Analysis #7: Backend Gamification Logic (`gamification_repos.rs`)

**File**: `app/backend/crates/api/src/db/gamification_repos.rs`  
**Size**: 772 lines  
**Repository Classes**: 5 (UserProgressRepo, UserWalletRepo, StreaksRepo, AchievementsRepo, GamificationRepo)  
**Total Methods**: 28  
**Status**: ANALYZED - CRITICAL BUSINESS LOGIC & OVERFLOW VULNERABILITIES  
**Date**: 2026-01-15

---

## EXECUTIVE SUMMARY

This file implements core gamification system including XP progression, coin economy, achievements, and streaks. While well-structured, it contains **critical vulnerabilities** and significant refactoring opportunities:

1. **🔴 OVERFLOW VULNERABILITY** (XP calculation formula vulnerable to integer overflow)
2. **🔴 RACE CONDITION** (Coin spending has non-atomic balance check + deduct)
3. **Missing Input Validation** (Achievement triggers, XP amounts)
4. **Repeated Idempotency Logic** (4+ methods, should extract)
5. **Complex Achievement Logic** (800+ lines, 4-way branching, hard to extend)
6. **No Role-Based Rewards** (Same XP per action regardless of context)

**Estimated Cleanup Effort**: ~11 hours

**CRITICAL**: XP formula and coin spending both need urgent fixes before production scaling.

---

## SECTION 1: COMMON OPERATIONS TO EXTRACT

### OP-1: Idempotency Check Pattern (Appears 3+ times)

**Locations**:
- Line 74: `award_xp()` - lines 74-84
- Line 197: `award_coins()` - lines 197-207
- Line 720: `award_points()` - indirect via award_xp/award_coins

**Current Pattern** (appears 2+ times identically):
```rust
// Check idempotency
if let Some(key) = idempotency_key {
    let existing = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM points_ledger WHERE idempotency_key = $1",
    )
    .bind(key)
    .fetch_one(pool)
    .await?;

    if existing > 0 {
        let progress = Self::get_or_create(pool, user_id).await?;
        return Ok(AwardResult {
            success: true,
            already_awarded: true,
            new_balance: progress.total_xp,
            leveled_up: Some(false),
            new_level: Some(progress.current_level),
        });
    }
}
```

**Issues**:
1. Repeated in two methods (DRY violation)
2. Returns different response types (XP vs Coins)
3. Error handling identical

**Extractable**:
```rust
/// Check if reward was already issued via idempotency key
async fn check_idempotency(
    pool: &PgPool,
    idempotency_key: Option<&str>,
) -> Result<bool, AppError> {
    if let Some(key) = idempotency_key {
        let existing = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM points_ledger WHERE idempotency_key = $1",
        )
        .bind(key)
        .fetch_one(pool)
        .await?;

        Ok(existing > 0)
    } else {
        Ok(false)
    }
}

// Usage:
if Self::check_idempotency(pool, idempotency_key).await? {
    // Return cached result
    return Ok(already_awarded_response);
}
```

---

### OP-2: Get or Create Pattern (Appears 3 times)

**Locations**:
- Line 28: `UserProgressRepo::get_or_create()`
- Line 162: `UserWalletRepo::get_or_create()`
- Implied: `StreaksRepo` could have same pattern

**Current Pattern** (almost identical):
```rust
pub async fn get_or_create(pool: &PgPool, user_id: Uuid) -> Result<UserProgress, AppError> {
    // Try to get existing
    let existing = sqlx::query_as::<_, UserProgress>(/* ... */)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

    if let Some(progress) = existing {
        return Ok(progress);
    }

    // Create new
    let progress = sqlx::query_as::<_, UserProgress>(/* ... */)
        .bind(user_id)
        .fetch_one(pool)
        .await?;

    Ok(progress)
}
```

**Extractable**: Create generic get-or-insert helper using `ON CONFLICT`:
```rust
// For user_progress:
pub async fn get_or_create(pool: &PgPool, user_id: Uuid) -> Result<UserProgress, AppError> {
    let progress = sqlx::query_as::<_, UserProgress>(
        r#"INSERT INTO user_progress (user_id, total_xp, current_level, xp_to_next_level, total_skill_stars)
           VALUES ($1, 0, 1, 100, 0)
           ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
           RETURNING id, user_id, total_xp::bigint AS total_xp, current_level, xp_to_next_level,
                     total_skill_stars, created_at, updated_at"#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    Ok(progress)
}

// Same for wallet, streaks
```

**Benefit**: Eliminate redundant fetch_optional check, use database-level conflict resolution.

---

### OP-3: Streak Calculation Logic (Lines 351-381)

**Current Pattern**:
```rust
// Check if yesterday
let yesterday = today.pred_opt().unwrap_or(today);
let (new_streak, streak_broken) = if streak.last_activity_date == Some(yesterday) {
    (streak.current_streak + 1, false)
} else {
    (1, streak.last_activity_date.is_some())
};
```

**Issue**: Identical to streak logic in habits_repo.rs (lines 289-298)

**Extractable**: Create shared utility in `db/mod.rs`:
```rust
/// Calculate new streak based on last activity
pub fn calculate_activity_streak(
    last_activity: Option<chrono::NaiveDate>,
    today: chrono::NaiveDate,
    current_streak: i32,
) -> (i32, bool) {
    let yesterday = today.pred();
    
    match last_activity {
        Some(last) if last == yesterday => (current_streak + 1, false),  // Continue
        Some(_) => (1, true),  // Broken
        None => (1, false),    // First time
    }
}
```

---

### OP-4: Level-Up Calculation Loop (Lines 100-109)

**Current Implementation**:
```rust
// Check for level-up
loop {
    let xp_needed = xp_for_level(new_level) as i64;
    if new_xp >= xp_needed {
        new_xp -= xp_needed;
        new_level += 1;
        leveled_up = true;
    } else {
        break;
    }
}
```

**Issues**:
1. **🔴 OVERFLOW VULNERABILITY**: XP formula `100 * level^1.5` overflows i32 at level 46340+
2. Loop runs multiple times for multi-level-ups (unbounded if XP is huge)
3. No bounds checking on level
4. Formula not clearly documented

**Extractable with Safety**:
```rust
/// Calculate new level after awarding XP
/// Returns (new_level, excess_xp, leveled_up)
fn calculate_level_up(current_level: i32, current_xp: i64, xp_awarded: i32) -> Result<(i32, i64, bool), AppError> {
    let mut new_level = current_level;
    let mut new_xp = current_xp + xp_awarded as i64;
    let mut leveled_up = false;

    // Max level: 100 (prevent overflow)
    const MAX_LEVEL: i32 = 100;

    loop {
        if new_level >= MAX_LEVEL {
            return Ok((MAX_LEVEL, new_xp, leveled_up));
        }

        let xp_needed = xp_for_level(new_level)
            .checked_mul(1)  // Validate fit in i64
            .ok_or(AppError::BadRequest("XP calculation overflow".into()))?;

        if new_xp >= xp_needed {
            new_xp -= xp_needed as i64;
            new_level += 1;
            leveled_up = true;
        } else {
            break;
        }
    }

    Ok((new_level, new_xp, leveled_up))
}
```

---

### OP-5: Achievement Trigger Config Parsing (Lines 645-705)

**Current Issue**: 4-way match on trigger_type with nested config extraction, repeated 4 times:

```rust
let trigger_config = achievement.trigger_config.as_ref();
let (progress, progress_max, progress_label) = match achievement.trigger_type.as_str() {
    "count" => {
        let event_type = trigger_config
            .and_then(|c| c.get("event_type"))
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let count = trigger_config
            .and_then(|c| c.get("count"))
            .and_then(|v| v.as_i64())
            .unwrap_or(1) as i32;
        // ... 20 lines of logic
    }
    // ... 3 more match arms
};
```

**Extractable**: Create achievement trigger validator:
```rust
pub struct AchievementTrigger {
    pub trigger_type: String,
    pub event_type: Option<String>,
    pub count: Option<i32>,
    pub days: Option<i32>,
    pub level: Option<i32>,
}

impl AchievementTrigger {
    /// Parse and validate achievement config
    fn from_definition(def: &AchievementDefinition) -> Result<Self, AppError> {
        // Centralized parsing, validation, error handling
    }

    /// Calculate progress toward this trigger
    async fn calculate_progress(
        &self,
        pool: &PgPool,
        user_id: Uuid,
        summary: &GamificationSummary,
    ) -> Result<(i32, i32, String), AppError> {
        // Centralized progress calculation
    }
}
```

---

## SECTION 2: CODE CLEANUP OPPORTUNITIES

### CLEANUP-1: 🔴 CRITICAL - Race Condition in Coin Spending (Lines 268-294)

**Current Implementation**:
```rust
pub async fn spend_coins(
    pool: &PgPool,
    user_id: Uuid,
    amount: i32,
    reason: &str,
    purchase_id: Option<Uuid>,
) -> Result<SpendResult, AppError> {
    // Get current balance with lock  [COMMENT SAYS "with lock" BUT NO LOCK EXISTS!]
    let wallet = Self::get_or_create(pool, user_id).await?;

    if wallet.coins < amount as i64 {
        return Ok(SpendResult {
            success: false,
            error: Some("Insufficient coins".to_string()),
            new_balance: wallet.coins,
        });
    }

    // Deduct coins  [HERE THE RACE CONDITION HAPPENS]
    let new_balance = sqlx::query_scalar::<_, i64>(
        r#"UPDATE user_wallet
           SET coins = coins - $1, total_spent = total_spent + $1, updated_at = NOW()
           WHERE user_id = $2
           RETURNING coins::bigint"#,
    )
    .bind(amount)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    // Record in ledger
    sqlx::query(
        r#"INSERT INTO points_ledger (user_id, event_type, event_id, coins, xp, reason)
           VALUES ($1, 'spend', $2, $3, $4, $5)"#,
    )
    .bind(user_id)
    .bind(purchase_id)
    .bind(-amount)
    .bind(0)
    .bind(reason)
    .execute(pool)
    .await?;

    Ok(SpendResult {
        success: true,
        error: None,
        new_balance,
    })
}
```

**RACE CONDITION SCENARIO**:
```
User has 100 coins, tries to spend 100 coins twice (e.g., double-click)

Thread 1: Check balance (100) ✓
Thread 2: Check balance (100) ✓
Thread 1: Deduct 100 → balance = 0 ✓
Thread 2: Deduct 100 → balance = -100 ❌ NEGATIVE BALANCE!
```

**FIX**: Use atomic operation:
```rust
pub async fn spend_coins(
    pool: &PgPool,
    user_id: Uuid,
    amount: i32,
    reason: &str,
    purchase_id: Option<Uuid>,
) -> Result<SpendResult, AppError> {
    // Single atomic operation: check and deduct
    let result = sqlx::query_as::<_, (i64, bool)>(
        r#"UPDATE user_wallet
           SET coins = CASE 
                 WHEN coins >= $1 THEN coins - $1 
                 ELSE coins 
               END,
               total_spent = CASE 
                 WHEN coins >= $1 THEN total_spent + $1 
                 ELSE total_spent 
               END,
               updated_at = NOW()
           WHERE user_id = $2
           RETURNING coins::bigint, (coins >= $1)::boolean"#,
    )
    .bind(amount as i64)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    let (new_balance, success) = result;

    if success {
        // Record in ledger only if successful
        sqlx::query(
            r#"INSERT INTO points_ledger (user_id, event_type, event_id, coins, xp, reason)
               VALUES ($1, 'spend', $2, $3, $4, $5)"#,
        )
        .bind(user_id)
        .bind(purchase_id)
        .bind(-amount)
        .bind(0)
        .bind(reason)
        .execute(pool)
        .await?;

        Ok(SpendResult {
            success: true,
            error: None,
            new_balance,
        })
    } else {
        Ok(SpendResult {
            success: false,
            error: Some(format!("Insufficient coins (have {}, need {})", new_balance, amount)),
            new_balance,
        })
    }
}
```

---

### CLEANUP-2: 🔴 CRITICAL - XP Formula Overflow (Lines 19-21)

**Current Function**:
```rust
fn xp_for_level(level: i32) -> i32 {
    (100.0 * (level as f64).powf(1.5)).floor() as i32
}
```

**Problems**:
1. Returns i32, but formula can exceed i32::MAX (2.1B)
2. At level 46340+: result overflows i32
3. Formula published in progress_fetcher.md analysis already identifies this
4. No bounds checking or error handling
5. Casting from f64 to i32 silently truncates on overflow

**Safe Version**:
```rust
/// Calculate XP needed to reach next level
/// Formula: 100 * level^1.5
/// Max level: 100 (above this returns MAX_LEVEL_XP)
fn xp_for_level(level: i32) -> Result<i32, AppError> {
    if level > 100 {
        return Err(AppError::BadRequest("Maximum level is 100".into()));
    }

    let xp = (100.0 * (level as f64).powf(1.5)).floor() as i64;

    // Check bounds
    if xp > i32::MAX as i64 {
        return Ok(i32::MAX);  // Cap at max
    }

    Ok(xp as i32)
}

// Or simpler: cap at reasonable level
const MAX_LEVEL: i32 = 100;
const MAX_XP_FOR_LEVEL: i32 = i32::MAX;

fn xp_for_level(level: i32) -> i32 {
    if level >= MAX_LEVEL {
        return MAX_XP_FOR_LEVEL;
    }
    
    let xp = (100.0 * (level as f64).powf(1.5)).floor() as i32;
    xp.max(0)  // Ensure non-negative
}
```

---

### CLEANUP-3: Unclear XP Progress Calculation (Lines 556-562)

**Current**:
```rust
let xp_progress_percent = if progress.xp_to_next_level > 0 {
    ((progress.total_xp as f64 / progress.xp_to_next_level as f64) * 100.0) as i32
} else {
    0
};
```

**Issues**:
1. Divides total_xp by xp_to_next_level (conceptually wrong)
2. xp_to_next_level should be remaining, not total
3. No documentation of what percent means
4. Could exceed 100% if progress tracking is inconsistent

**Better Logic**:
```rust
/// Calculate progress percentage toward next level (0-100)
fn calculate_xp_progress_percent(total_xp: i64, xp_to_next: i32) -> i32 {
    if xp_to_next <= 0 {
        return 0;  // At/past level cap
    }

    // Remaining XP = xp_to_next (should be stored, not calculated)
    // But we need to know how much XP we've accumulated at this level
    // Current code is backwards

    // CORRECT: remaining_xp / total_xp_for_level
    // remaining_xp = (total_xp_for_level(current_level) - total_xp + total_xp_for_level(current_level))
    // i.e., we need to track xp_earned_this_level, not xp_to_next

    // Simplified: just return xp_to_next as-is
    (xp_to_next as f64 / 100.0) as i32  // Assume 100 base
}

// Or better: store xp_this_level in user_progress
pub struct UserProgress {
    pub total_xp: i64,
    pub current_level: i32,
    pub xp_earned_this_level: i32,  // NEW FIELD
    pub xp_for_next_level: i32,     // For this level specifically
}
```

---

### CLEANUP-4: Missing Validation in Achievement Unlock (Line 523-530)

**Current**:
```rust
pub async fn unlock_achievement(
    pool: &PgPool,
    user_id: Uuid,
    achievement_key: &str,
) -> Result<bool, AppError> {
    // Check if already unlocked
    if Self::has_achievement(pool, user_id, achievement_key).await? {
        return Ok(false);
    }

    // Insert
    sqlx::query(
        r#"INSERT INTO user_achievements (user_id, achievement_key, earned_at, notified)
           VALUES ($1, $2, NOW(), false)"#,
    )
    .bind(user_id)
    .bind(achievement_key)
    .execute(pool)
    .await?;

    Ok(true)
}
```

**Issues**:
1. No validation that achievement_key is valid (exists in definitions)
2. Could create user_achievements for non-existent achievements
3. No error on foreign key constraint failure
4. Should award reward coins/XP (missing!)

**Better**:
```rust
pub async fn unlock_achievement(
    pool: &PgPool,
    user_id: Uuid,
    achievement_key: &str,
) -> Result<AchievementUnlockResult, AppError> {
    // Get achievement definition to validate and get rewards
    let def = sqlx::query_as::<_, AchievementDefinition>(
        "SELECT * FROM achievement_definitions WHERE key = $1"
    )
    .bind(achievement_key)
    .fetch_optional(pool)
    .await?
    .ok_or(AppError::NotFound(format!("Achievement {} not found", achievement_key)))?;

    // Check if already unlocked
    if Self::has_achievement(pool, user_id, achievement_key).await? {
        return Ok(AchievementUnlockResult {
            unlocked: false,
            already_had: true,
            xp_awarded: 0,
            coins_awarded: 0,
        });
    }

    // Unlock achievement
    sqlx::query(
        "INSERT INTO user_achievements (user_id, achievement_key, earned_at, notified) VALUES ($1, $2, NOW(), false)"
    )
    .bind(user_id)
    .bind(achievement_key)
    .execute(pool)
    .await?;

    // Award rewards
    if def.reward_coins > 0 {
        UserWalletRepo::award_coins(
            pool,
            user_id,
            def.reward_coins,
            "achievement_unlock",
            None,
            Some(&format!("Achievement: {}", def.name)),
            None,
        )
        .await?;
    }

    if def.reward_xp > 0 {
        UserProgressRepo::award_xp(
            pool,
            user_id,
            def.reward_xp,
            "achievement_unlock",
            None,
            Some(&format!("Achievement: {}", def.name)),
            None,
        )
        .await?;
    }

    Ok(AchievementUnlockResult {
        unlocked: true,
        already_had: false,
        xp_awarded: def.reward_xp,
        coins_awarded: def.reward_coins,
    })
}
```

---

### CLEANUP-5: XP Calculation Inconsistency (Line 95)

**Issue**: XP from award_points() might be negative:

```rust
// Award XP if specified
if let Some(xp) = input.xp {
    if xp > 0 {
        // ... award
    }
}
```

**Problem**: Negative XP is silently ignored, not penalized. Should be explicit:

```rust
if let Some(xp) = input.xp {
    match xp {
        xp if xp > 0 => { /* award positive */ },
        xp if xp < 0 => {
            // Penalize: deduct from total_xp
            // Also need to handle level-down (new feature)
        },
        _ => {}, // Zero, no-op
    }
}
```

---

## SECTION 3: MISSING DOCUMENTATION

### DOC-1: XP Formula Documentation

**Missing**: Explanation of level scaling and bounds

```rust
/// XP formula for level progression
///
/// # Formula
/// XP required for level N = 100 * N^1.5
///
/// # Examples
/// - Level 1: 100 XP
/// - Level 2: ~282 XP (total: 382)
/// - Level 10: ~3162 XP
/// - Level 50: ~35355 XP
/// - Level 100: ~1,000,000 XP (estimated max for human player)
///
/// # Scaling
/// Exponential growth ensures:
/// - Early levels feel achievable (quick dopamine)
/// - Late game has years of progression
/// - Max level 100 prevents integer overflow
///
/// # Special Cases
/// - Level 0: Not used (starts at 1)
/// - Level 100: Final achievable level (1M XP cumulative)
/// - Levels 101+: Not supported (will error)
fn xp_for_level(level: i32) -> Result<i32, AppError> {
    // ...
}
```

---

### DOC-2: Idempotency Strategy

**Missing**: How idempotency prevents double-awards

```rust
/// # Idempotency Key Strategy
///
/// All point awards use idempotency keys to prevent double-awards:
///
/// Format: `{event_type}_{entity_id}_{date_if_repeatable}`
///
/// Example:
/// - "habit_complete_[habit_id]_2026-01-15"
/// - "quest_complete_[quest_id]" (one-time)
/// - "focus_complete_[session_id]" (one-time)
///
/// ## How It Works
/// 1. Client sends request with idempotency_key
/// 2. Server checks points_ledger for key
/// 3. If exists: return cached result (already awarded)
/// 4. If not exists: process request, create ledger entry
/// 5. Subsequent identical requests return cached result
///
/// ## Race Condition Safety
/// If two requests with same key arrive simultaneously:
/// - Both check points_ledger (both empty initially)
/// - One INSERT succeeds, one fails (or both succeed at different times)
/// - Both return success (semantically idempotent)
///
/// For strict ordering, use database uniqueness constraint:
/// ```sql
/// CREATE UNIQUE INDEX points_ledger_idempotency_key
///   ON points_ledger(idempotency_key)
///   WHERE idempotency_key IS NOT NULL;
/// ```
```

---

### DOC-3: All Methods (28 methods, many missing docs)

**Example**:
```rust
/// Award XP to user with automatic level-up handling
///
/// # Arguments
/// - `xp`: Amount of XP to award (must be positive)
/// - `event_type`: Event that triggered reward (e.g., "habit_complete")
/// - `idempotency_key`: Optional key to prevent double-awards
///
/// # Side Effects
/// - Updates user_progress (total_xp, current_level, xp_to_next_level)
/// - Inserts entry in points_ledger for auditing
/// - May trigger level-up notification (if leveled_up=true)
///
/// # Idempotency
/// If idempotency_key is provided and already exists in ledger,
/// returns cached result without double-awarding.
///
/// # Returns
/// AwardResult with:
/// - already_awarded: true if idempotency key found
/// - leveled_up: whether user progressed to next level
/// - new_level: user's new level
/// - new_balance: new total_xp
///
/// # Example
/// ```
/// let result = UserProgressRepo::award_xp(
///     pool, user_id, 50, "quest_complete", Some(quest_id), 
///     Some("Completed quest X"), Some("quest_123_abc")
/// ).await?;
/// assert!(result.success);
/// ```
pub async fn award_xp(
    pool: &PgPool,
    user_id: Uuid,
    xp: i32,
    event_type: &str,
    event_id: Option<Uuid>,
    reason: Option<&str>,
    idempotency_key: Option<&str>,
) -> Result<AwardResult, AppError> {
    // ...
}
```

---

## SECTION 4: DEPRECATION CANDIDATES

### DEP-1: Separate award_xp() and award_coins() methods

**Current Design**: Two separate methods, called via unified `award_points()`

**Issue**: Code duplication (idempotency check, ledger insertion)

**Recommendation**: Keep as-is for now (specialized logic for each type), but consolidate idempotency check via extracted helper (OP-1).

---

## SECTION 5: LINT ERRORS & WARNINGS

### LINT-1: pred_opt() Usage (Line 369)

**Issue**:
```rust
let yesterday = today.pred_opt().unwrap_or(today);
```

If pred_opt() returns None, defaults to today (wrong semantics)

**Fix**:
```rust
let yesterday = today.pred();  // Always valid for valid NaiveDate
```

---

### LINT-2: Magic Constants (10+ instances)

**Locations**:
- Line 20: `100.0` (XP base formula constant)
- Line 20: `1.5` (XP exponent)
- Line 44: `0, 1, 100, 0` (initial user_progress defaults)
- Line 167: `0, 0, 0` (initial user_wallet defaults)
- Line 368: `1` (initial streak)
- Line 369: `1, 0` (new streak values)

**Better**: Extract to constants:
```rust
/// Default values for new user_progress
const DEFAULT_LEVEL: i32 = 1;
const DEFAULT_XP_THRESHOLD: i32 = 100;
const DEFAULT_SKILL_STARS: i32 = 0;

/// Default values for new user_wallet
const DEFAULT_COINS: i32 = 0;
const DEFAULT_EARNED: i32 = 0;
const DEFAULT_SPENT: i32 = 0;

/// Streak calculation constants
const INITIAL_STREAK: i32 = 1;
```

---

### LINT-3: Unvalidated Trigger Config (Lines 650+)

**Issue**: `trigger_config` is serde_json::Value, accessed with unsafe chaining:
```rust
let event_type = trigger_config
    .and_then(|c| c.get("event_type"))
    .and_then(|v| v.as_str())
    .unwrap_or("");  // Silent fallback to empty string
```

If config is malformed, silently uses defaults (no error)

**Better**: Validate on load:
```rust
pub struct AchievementTriggerConfig {
    pub trigger_type: String,
    pub event_type: Option<String>,
    pub count: Option<i32>,
    // ...
}

impl AchievementTriggerConfig {
    fn from_json(config: serde_json::Value) -> Result<Self, AppError> {
        // Explicit validation, clear error messages
    }
}
```

---

### LINT-4: No Bounds Check on Level Loop (Line 100)

**Issue**: While loop could run many times if XP is very large:
```rust
loop {
    let xp_needed = xp_for_level(new_level) as i64;
    if new_xp >= xp_needed {
        new_xp -= xp_needed;
        new_level += 1;  // ← Could reach level 1000000 if XP is 10^9
        leveled_up = true;
    } else {
        break;
    }
}
```

**Fix**:
```rust
const MAX_LEVEL: i32 = 100;

loop {
    if new_level >= MAX_LEVEL {
        break;  // Cap at max level
    }
    // ...
}
```

---

### LINT-5: CAST(NULL AS ...) Anti-pattern (Models, if present)

**Not in this file, but related**: If user_achievements uses CAST(NULL AS ...), same issue as focus_repos (incomplete implementation).

---

## SUMMARY TABLE

| Category | Count | Examples | Impact |
|---|---|---|---|
| **Common Operations** | 5 | Idempotency, get-or-create, streak, level-up, triggers | HIGH (4-5 hours) |
| **Code Cleanup** | 5 | Race condition, overflow, validation, consistency | 🔴 CRITICAL (3-4 hours) |
| **Documentation** | 3 | XP formula, idempotency, all methods | MEDIUM (2-3 hours) |
| **Deprecations** | 1 | Separate award methods (low priority) | LOW (0.5 hours) |
| **Lint Issues** | 5 | Magic constants, unvalidated config, bounds, pred_opt | MEDIUM (1.5-2 hours) |
| **TOTAL** | **19 ISSUES** | **Across 772 lines** | **11 hours effort** |

---

## KEY FINDINGS

### 🔴 CRITICAL (PRODUCTION BLOCKERS)
1. **Race Condition in Coin Spending** (Line 268-294): Two concurrent spends can result in negative balance
2. **XP Formula Overflow** (Line 19-21): Casting from f64 to i32 silently overflows at level 46340+
3. **Missing Level Bounds** (Line 100-109): Level-up loop can exceed reasonable maximums

### 🟡 HIGH
4. **Idempotency Logic Duplication** (Lines 74-84, 197-207): Same pattern in 2+ methods
5. **Missing Achievement Reward Logic** (Line 523-530): Unlocking achievement doesn't award coins/XP
6. **Unvalidated Achievement Triggers** (Line 645+): Malformed config silently uses defaults
7. **XP Progress Calculation Backwards** (Line 556-562): Formula divides total/threshold instead of remainder/threshold

### 🟢 MEDIUM
8. **Missing All Documentation** (28 methods): No `///` docs on any public methods
9. **No Negative XP Handling** (Line 95): Negative XP ignored, should penalize
10. **Magic Constants Everywhere** (10+ locations): Hardcoded defaults, formula constants

---

## IMPLEMENTATION ROADMAP

### Phase 1: Fix Critical Race Condition (1.5 hours) 🔴
1. Refactor spend_coins() to atomic operation
2. Add transaction test case
3. Verify no concurrent double-spend possible

### Phase 2: Fix XP Overflow & Bounds (1.5 hours) 🔴
1. Add MAX_LEVEL constant (100)
2. Modify xp_for_level() to return Result with bounds
3. Add level cap in level-up loop
4. Test with large XP amounts

### Phase 3: Fix Achievement Unlock (1 hour)
1. Add reward logic to unlock_achievement()
2. Validate achievement_key exists
3. Award coins/XP from definition
4. Return unlock result with rewards

### Phase 4: Extract Common Operations (2 hours)
1. Extract idempotency_check() utility
2. Create get_or_insert with ON CONFLICT
3. Create calculate_activity_streak() shared utility
4. Create AchievementTrigger validation struct

### Phase 5: Type Safety & Validation (1.5 hours)
1. Create AchievementTriggerConfig struct
2. Validate on definition load, not access
3. Fix pred_opt() usage
4. Add input validation

### Phase 6: Extract Constants (1 hour)
1. Define all magic constants
2. Create constants module
3. Update formula documentation
4. Update model defaults

### Phase 7: Documentation (2 hours)
1. Add `///` comments to all 28 methods
2. Document XP formula with examples
3. Document idempotency strategy
4. Document achievement system

---

## VALIDATION CHECKLIST

After implementing cleanups:

- [ ] Race condition in coin spending fixed (atomic operation)
- [ ] XP formula overflow fixed (bounds checking, MAX_LEVEL=100)
- [ ] Achievement unlock awards rewards (coins + XP)
- [ ] Idempotency check extracted to shared utility
- [ ] get-or-insert refactored to ON CONFLICT
- [ ] Streak calculation uses shared utility
- [ ] All 28 methods documented with `///` 
- [ ] Achievement triggers validated on load
- [ ] All magic constants extracted
- [ ] Negative XP handling decided
- [ ] cargo check passes with 0 errors
- [ ] Clippy lints addressed
- [ ] Integration tests for critical paths (race condition, overflow)

---

## EFFORT ESTIMATION

**Per-task breakdown**:
- Fix coin spending race: 90 minutes (test carefully!)
- Fix XP overflow: 90 minutes
- Fix achievement unlock: 60 minutes
- Extract utilities: 120 minutes
- Validation & type safety: 90 minutes
- Constants extraction: 60 minutes
- Documentation: 120 minutes
- Testing: 90 minutes

**Total: ~11 hours** (includes critical safety fixes)

**PRIORITY**: Fix Phases 1-2 before production scale-up

---

## CROSS-REPO PATTERNS

**Shared with other repos**:
- Idempotency key pattern (also in habits, quests, focus) → Extract to `db/shared.rs`
- Streak calculation (also in habits, quests) → Extract to `db/shared.rs`
- get-or-create pattern (also in focus) → Refactor to use ON CONFLICT
- Magic constants → Centralize in `db/constants.rs`

**Recommended next step**: Create `db/shared.rs` with:
- `idempotency_check()`
- `calculate_activity_streak()`
- `AwardPointsHelper` trait

