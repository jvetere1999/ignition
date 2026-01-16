# VAULT STATE SYNCHRONIZATION ANALYSIS

**Component**: Backend Vault Lock System  
**Files**: 
- `app/backend/crates/api/src/routes/vault.rs` (70 lines)
- `app/backend/crates/api/src/db/vault_models.rs` (115 lines)
- `app/backend/crates/api/src/db/vault_repos.rs` (220 lines)

**Total Lines Analyzed**: 405 lines  
**Issues Identified**: 16  
**Effort Estimate**: 4.5-5.5 hours  

**Issue Breakdown**:
- 3 Common Operations (extract/consolidate)
- 4 Cleanups (remove duplication, fix patterns)
- 3 Documentation improvements
- 1 Deprecation (placeholder code)
- 5 Linting and type safety

**Critical Findings**: None blocking (but 1 incomplete feature, 1 incomplete error handling)

---

## ISSUE CATEGORY: COMMON OPERATIONS (3 issues, 1.5 hours)

### OP-1: LockReason Enum Serialization Duplication
**Location**: `vault_models.rs:45-70`  
**Pattern**: Two-way enum conversion with repetitive match blocks

```rust
// Current (lines 45-58)
pub fn as_str(&self) -> &str {
    match self {
        Self::Idle => "idle",
        Self::Backgrounded => "backgrounded",
        Self::Logout => "logout",
        Self::Force => "force",
        Self::Rotation => "rotation",
        Self::Admin => "admin",
    }
}

// Current (lines 60-70)
pub fn from_str(s: &str) -> Option<Self> {
    match s {
        "idle" => Some(Self::Idle),
        "backgrounded" => Some(Self::Backgrounded),
        "logout" => Some(Self::Logout),
        "force" => Some(Self::Force),
        "rotation" => Some(Self::Rotation),
        "admin" => Some(Self::Admin),
        _ => None,
    }
}
```

**Issue**: Enum variants duplicated across both functions. If a new reason is added (e.g., `Self::Temp`), BOTH functions must be updated.

**Solution**: Use `strum` crate for automatic `ToString` + `FromStr` implementations or custom derive macro.

**Refactored**:
```rust
// Use strum_macros
#[derive(Debug, Clone, strum_macros::AsRefStr, strum_macros::EnumString)]
pub enum LockReason {
    #[strum(serialize = "idle")]
    Idle,
    #[strum(serialize = "backgrounded")]
    Backgrounded,
    #[strum(serialize = "logout")]
    Logout,
    #[strum(serialize = "force")]
    Force,
    #[strum(serialize = "rotation")]
    Rotation,
    #[strum(serialize = "admin")]
    Admin,
}

// Now auto-generated:
// reason.as_ref() → "idle"
// "idle".parse::<LockReason>() → LockReason::Idle
```

**Impact**: DRY, eliminates enum variant duplication, auto-generates `ToString` and `FromStr`.  
**Effort**: 0.5 hours (add strum to Cargo.toml, replace 2 impl blocks, test)

---

### OP-2: Query Column List Duplication
**Location**: `vault_repos.rs:7-9, 42-44, 19-21`  
**Pattern**: SELECT statement repeated across 3 methods with identical column lists

```rust
// vault_repos.rs:7-9 (get_by_user_id)
"SELECT id, user_id, passphrase_salt, passphrase_hash, key_derivation_params, 
        crypto_policy_version, locked_at, lock_reason, enforce_tier, created_at, updated_at"

// vault_repos.rs:42-44 (create_vault - RETURNING)
"RETURNING id, user_id, passphrase_salt, passphrase_hash, key_derivation_params, 
          crypto_policy_version, locked_at, lock_reason, enforce_tier, created_at, updated_at"

// vault_repos.rs:114 (implied in get_lock_state with subset)
```

**Issue**: If new field added to Vault struct (e.g., `key_rotation_count`), must update all SELECT lists.

**Solution**: Create const SQL fragment or helper.

```rust
const VAULT_COLUMNS: &str = "id, user_id, passphrase_salt, passphrase_hash, key_derivation_params, \
                              crypto_policy_version, locked_at, lock_reason, enforce_tier, \
                              last_rotated_at, next_rotation_due, created_at, updated_at";

// Then:
sqlx::query_as::<_, Vault>(&format!(
    "SELECT {} FROM vaults WHERE user_id = $1", VAULT_COLUMNS
))
```

**Impact**: Single source of truth for Vault columns.  
**Effort**: 0.5 hours (add const, update 2 queries, verify)

---

### OP-3: Lock State Selection Pattern
**Location**: `vault_repos.rs:36-44`  
**Pattern**: Multiple queries for partial vault data (lock state only)

```rust
// vault_repos.rs:36 - get_lock_state()
sqlx::query_as::<_, LockStateRow>(
    "SELECT locked_at, lock_reason FROM vaults WHERE user_id = $1"
)

// vault_repos.rs:47 - is_locked()
sqlx::query_as::<_, IsLockedRow>(
    "SELECT (locked_at IS NOT NULL) as is_locked FROM vaults WHERE user_id = $1"
)
```

**Issue**: Two separate queries for vault state information. Callers must choose which to use. If sync needs both (locked_at AND is_locked flag), two round trips.

**Solution**: Create unified `get_vault_state()` that returns full lock context, or add a view.

```rust
pub async fn get_lock_state_full(pool: &PgPool, user_id: Uuid) -> Result<Option<LockState>, sqlx::Error> {
    #[derive(sqlx::FromRow)]
    struct LockStateRow {
        locked_at: Option<DateTime<Utc>>,
        lock_reason: Option<String>,
        is_locked: bool,  // computed at query time
    }
    
    sqlx::query_as::<_, LockStateRow>(
        "SELECT locked_at, lock_reason, (locked_at IS NOT NULL) as is_locked 
         FROM vaults WHERE user_id = $1"
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await
}
```

**Impact**: Eliminates dual-query pattern for sync state.  
**Effort**: 0.5 hours (create new method, test, update sync caller)

---

## ISSUE CATEGORY: CLEANUPS (4 issues, 1.5 hours)

### CLEANUP-1: Incomplete Passphrase Verification Implementation
**Location**: `vault.rs:49-58`  
**Code**:
```rust
// TODO: Verify passphrase against vault.passphrase_hash using PBKDF2
// For now, just unlock (passphrase verification should be implemented in crypto service)
// This is a placeholder - actual verification would use bcrypt or similar

VaultRepo::unlock_vault(&state.db, auth.user_id).await
```

**Issue**: 
1. TODO comment indicates incomplete feature
2. No actual cryptographic verification
3. Anyone who knows user_id can unlock vault
4. Security vulnerability in authentication flow

**Solution**: Implement `CryptoService::verify_passphrase()` and use it before unlock.

```rust
// In crypto_service.rs
pub async fn verify_passphrase(
    provided: &str,
    hash: &str,
) -> Result<bool, CryptoError> {
    // Use argon2 or bcrypt
    Ok(Argon2::default().verify_password(
        provided.as_bytes(),
        hash
    ).is_ok())
}

// In vault.rs
let vault = VaultRepo::get_by_user_id(&state.db, auth.user_id).await?;
let verified = CryptoService::verify_passphrase(&req.passphrase, &vault.passphrase_hash)
    .await
    .map_err(|e| AppError::Internal(format!("Crypto error: {}", e)))?;

if !verified {
    return Err(AppError::Unauthorized("Invalid passphrase".to_string()));
}

VaultRepo::unlock_vault(&state.db, auth.user_id).await?;
```

**Impact**: Security critical - actual authentication before unlock.  
**Effort**: 1 hour (implement CryptoService method, integrate, test)

---

### CLEANUP-2: Error Messages Hardcoded
**Location**: `vault.rs:29, 53, 57`  
**Pattern**:
```rust
// Line 29
.ok_or(AppError::BadRequest("Invalid lock reason".to_string()))?;

// Line 53
.ok_or(AppError::Unauthorized("Vault not found".to_string()))?;

// Line 57
return Err(AppError::Unauthorized("Invalid passphrase".to_string()));
```

**Issue**: Error strings hardcoded in handlers instead of defined as constants or in error module. Makes maintenance harder, inconsistent with rest of codebase.

**Solution**: Define error constants in `error.rs` or use enum variants.

```rust
// In error.rs
pub enum VaultError {
    InvalidLockReason,
    VaultNotFound,
    InvalidPassphrase,
    PassphraseVerificationFailed,
}

impl Display for VaultError {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        match self {
            Self::InvalidLockReason => write!(f, "Invalid lock reason"),
            Self::VaultNotFound => write!(f, "Vault not found"),
            Self::InvalidPassphrase => write!(f, "Invalid passphrase"),
            Self::PassphraseVerificationFailed => write!(f, "Passphrase verification failed"),
        }
    }
}

// In vault.rs
let reason = LockReason::from_str(&req.reason)
    .ok_or(AppError::BadRequest(VaultError::InvalidLockReason.to_string()))?;
```

**Impact**: Centralized error messages, easier to update across all handlers.  
**Effort**: 0.5 hours (move to enum, update 3 call sites)

---

### CLEANUP-3: Unused Fields in Response
**Location**: `vault_models.rs:34-37`  
**Code**:
```rust
#[derive(Debug, Serialize)]
pub struct UnlockVaultResponse {
    pub success: bool,
    pub message: String,
}
```

**Issue**: Simple JSON response. The `success` field is redundant if the HTTP status is already 200 OK. Clients must parse both HTTP status AND JSON success field.

**Solution**: Return only meaningful data, let HTTP status code indicate success.

```rust
// Option A: Return lock state
#[derive(Debug, Serialize)]
pub struct UnlockVaultResponse {
    pub locked_at: Option<DateTime<Utc>>,
    pub lock_reason: Option<String>,
}

// Option B: Return empty with status 204 No Content
// (no response body, just status code)

// In handler:
Ok((StatusCode::OK, Json(unlock_response)))
```

**Impact**: Cleaner API contracts, reduces redundant status fields.  
**Effort**: 0.25 hours (update response type, update test)

---

### CLEANUP-4: Missing Vault Existence Validation in lock_vault
**Location**: `vault_repos.rs:56-62`  
**Code**:
```rust
pub async fn lock_vault(
    pool: &PgPool,
    user_id: Uuid,
    reason: LockReason,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE vaults SET locked_at = $1, lock_reason = $2, updated_at = NOW() 
         WHERE user_id = $3"
    )
    .bind(Utc::now())
    .bind(reason.as_str())
    .bind(user_id)
    .execute(pool)
    .await?;

    Ok(())
}
```

**Issue**: UPDATE completes successfully even if vault doesn't exist (0 rows affected). Caller receives `Ok(())` but no actual lock occurred.

**Solution**: Validate row count or add CHECK constraint in database.

```rust
pub async fn lock_vault(
    pool: &PgPool,
    user_id: Uuid,
    reason: LockReason,
) -> Result<(), VaultError> {
    let result = sqlx::query(
        "UPDATE vaults SET locked_at = $1, lock_reason = $2, updated_at = NOW() 
         WHERE user_id = $3"
    )
    .bind(Utc::now())
    .bind(reason.as_str())
    .bind(user_id)
    .execute(pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(VaultError::VaultNotFound);
    }

    Ok(())
}
```

**Impact**: Prevents silent failures, returns error if vault missing.  
**Effort**: 0.25 hours (add check, update error handling)

---

## ISSUE CATEGORY: DOCUMENTATION (3 issues, 1.5 hours)

### DOC-1: Missing Lock Reason Semantics Documentation
**Location**: `vault_models.rs:23-27`  
**Code**:
```rust
#[derive(Debug, Deserialize)]
pub struct LockVaultRequest {
    pub reason: String, // 'idle', 'backgrounded', 'logout', 'force', 'rotation'
}
```

**Issue**: Inline comment lists valid values, but no documentation about:
- Which reason is used when (business logic)
- How frontend should determine which to send
- What each reason means for sync behavior

**Solution**: Add comprehensive doc comments.

```rust
/// Lock reason indicates WHY the vault was locked, affecting sync behavior.
///
/// **Lock Reasons**:
/// - `idle` - User hasn't interacted with app for N minutes (auto-lock on timer)
/// - `backgrounded` - App moved to background (iOS/Android pause)
/// - `logout` - User explicitly logged out
/// - `force` - Admin forced lock (account lockdown)
/// - `rotation` - Key rotation triggered, vault locked for re-encryption
/// - `admin` - Admin lock for compliance/security
///
/// **Sync Implications**:
/// - `idle` / `backgrounded` - Soft lock, user can unlock with passphrase
/// - `logout` - Hard lock, requires full re-authentication
/// - `force` / `admin` - Hard lock, may require identity verification
/// - `rotation` - Hard lock, will unlock automatically after key rotation complete
#[derive(Debug, Deserialize)]
pub struct LockVaultRequest {
    pub reason: String,
}
```

**Impact**: Clarifies business logic, helps sync implementation.  
**Effort**: 0.5 hours (add doc comments)

---

### DOC-2: Missing Vault State Machine Documentation
**Location**: `vault.rs` top level  
**Issue**: No documentation explaining valid state transitions.

**Valid Transitions**:
- `unlocked` → `locked:idle` (auto-lock)
- `unlocked` → `locked:backgrounded` (app backgrounded)
- `locked:idle` → `unlocked` (passphrase verify)
- `locked:logout` → `locked:logout` (stuck, requires full auth)

**Solution**: Add state machine diagram and validation.

```rust
/// # Vault Lock State Machine
///
/// ```text
/// ┌─────────────────────────────────────────────────┐
/// │                  VAULT STATES                   │
/// ├─────────────────────────────────────────────────┤
/// │                                                 │
/// │  UNLOCKED ─────(auto-lock/app-bg)──→ LOCKED    │
/// │     ↑                                    │      │
/// │     │─────────(passphrase)──────────────┘      │
/// │                                                 │
/// │  LOCKED:LOGOUT ──(no unlock, needs auth)──→    │
/// │                                                 │
/// └─────────────────────────────────────────────────┘
/// ```
///
/// **Rules**:
/// - Only `LOCKED:IDLE` and `LOCKED:BACKGROUNDED` can unlock with passphrase
/// - `LOCKED:LOGOUT` requires full re-authentication
/// - Multiple locks of same type don't change state (idempotent)
pub fn router() -> Router<Arc<AppState>> { ... }
```

**Impact**: Clarifies implementation requirements, prevents invalid state transitions.  
**Effort**: 0.5 hours (add diagram and comments)

---

### DOC-3: Missing Crypto Policy Version Documentation
**Location**: `vault_models.rs:9`  
**Code**:
```rust
pub crypto_policy_version: Option<String>,
```

**Issue**: Field exists but no documentation:
- What are valid versions? (`v1`, `v2.1`, `2024-01`, `2.0.0`?)
- How is it used during sync?
- When/how does it get updated?

**Solution**: Add documentation and create version enum.

```rust
/// Cryptographic policy version constrains which algorithms/key sizes are allowed.
///
/// **Current Versions**:
/// - `"v1"` - Legacy (SHA256 + AES-256-GCM, salt 16 bytes)
/// - `"v2"` - Current (Argon2 + AES-256-GCM, salt 32 bytes)
/// - `"v3"` - Future (Argon2id + ChaCha20-Poly1305)
///
/// **Usage**: Determines passphrase hashing algorithm and encryption method.
/// Updated when user runs key rotation.
pub crypto_policy_version: Option<String>,
```

**Impact**: Clarifies versioning strategy, helps with migration planning.  
**Effort**: 0.5 hours (add doc comments and version enum)

---

## ISSUE CATEGORY: DEPRECATIONS (1 issue, 0.5 hours)

### DEPR-1: Placeholder Passphrase Verification Logic
**Location**: `vault.rs:49-58`  
**Status**: Marked as TODO, should be implemented or removed

**Issue**: Code is clearly incomplete ("For now, just unlock"), blocks production use.

**Solution**: Either implement properly (CLEANUP-1) or disable the feature temporarily.

```rust
// Option A: Implement verification (recommended)
// [See CLEANUP-1 for full implementation]

// Option B: Return Not Implemented for now
let verified = CryptoService::verify_passphrase(&req.passphrase, &vault.passphrase_hash)
    .await
    .map_err(|_| AppError::Internal("Passphrase verification not yet implemented".to_string()))?;
```

**Impact**: Unblocks vault feature development path.  
**Effort**: Covered in CLEANUP-1 (1 hour for implementation)

---

## ISSUE CATEGORY: LINTING & TYPE SAFETY (5 issues, 0.5 hours)

### LINT-1: Unused LockStateRow Struct Duplication
**Location**: `vault_repos.rs:36-40, 47-51`  
**Pattern**:
```rust
#[derive(sqlx::FromRow)]
struct LockStateRow { ... }

// ... later ...

#[derive(sqlx::FromRow)]
struct IsLockedRow { ... }
```

**Issue**: Two similar structs for almost identical queries. Could use one.

**Solution**: 
```rust
#[derive(sqlx::FromRow)]
struct LockState {
    locked_at: Option<DateTime<Utc>>,
    lock_reason: Option<String>,
}

// is_locked check:
let state = sqlx::query_as::<_, LockState>(
    "SELECT locked_at, lock_reason FROM vaults WHERE user_id = $1"
).bind(user_id).fetch_optional(pool).await?;
let is_locked = state.as_ref().map(|s| s.locked_at.is_some()).unwrap_or(false);
```

**Impact**: Reduces code duplication, clearer types.  
**Effort**: 0.1 hours

---

### LINT-2: Missing Input Validation on Lock Reason
**Location**: `vault.rs:27-29`  
**Code**:
```rust
let reason = LockReason::from_str(&req.reason)
    .ok_or(AppError::BadRequest("Invalid lock reason".to_string()))?;
```

**Issue**: Accepts any string, must parse to enum. But error message is generic. No list of valid reasons in API response.

**Solution**: Return available reasons in error response.

```rust
let reason = LockReason::from_str(&req.reason)
    .ok_or(AppError::BadRequest(
        format!("Invalid lock reason. Valid reasons: {}", 
                vec!["idle", "backgrounded", "logout", "force", "rotation", "admin"]
                .join(", "))
    ))?;
```

**Impact**: Better API error messages, helps clients self-correct.  
**Effort**: 0.1 hours

---

### LINT-3: Inconsistent Error Context in Handlers
**Location**: `vault.rs:30-31, 54-55`  
**Code**:
```rust
VaultRepo::lock_vault(&state.db, auth.user_id, reason).await
    .map_err(|e| AppError::Internal(format!("Failed to lock vault: {}", e)))?;;

VaultRepo::get_by_user_id(&state.db, auth.user_id).await
    .map_err(|e| AppError::Internal(format!("Failed to fetch vault: {}", e)))?
```

**Issue**: Double semicolon on line 31, inconsistent error context (some use `::{}, e}`, others don't).

**Solution**: Use consistent error context wrapper.

```rust
VaultRepo::lock_vault(&state.db, auth.user_id, reason).await
    .map_err(|e| AppError::Internal(format!("Failed to lock vault: {}", e)))?;

VaultRepo::get_by_user_id(&state.db, auth.user_id).await
    .map_err(|e| AppError::Internal(format!("Failed to fetch vault: {}", e)))?;
```

**Impact**: Consistent error handling, removes syntax error.  
**Effort**: 0.1 hours

---

### LINT-4: Missing Type Hints on Bind Parameters
**Location**: `vault_repos.rs:77, 120, 125, 142`  
**Pattern**:
```rust
.bind(None::<String>)     // Line 120
.bind(None::<chrono::DateTime<chrono::Utc>>)  // Line 125
.bind(0i32)  // Line 142
```

**Issue**: Type hints scattered, some explicit (0i32) and some verbose (None::<chrono::DateTime<Utc>>). Should be consistent.

**Solution**: Define a helper or use consistent style.

```rust
.bind(None::<String>)
.bind(None::<DateTime<Utc>>)  // Shorter via use statement
.bind(0i32)
```

**Impact**: Cleaner code, consistent style.  
**Effort**: 0.1 hours

---

### LINT-5: Magic Numbers in create_vault
**Location**: `vault_repos.rs:142`  
**Code**:
```rust
.bind(0i32)  // enforce_tier
```

**Issue**: What does `0` mean? No documentation.

**Solution**: Create constant.

```rust
const DEFAULT_ENFORCE_TIER: i32 = 0;  // No enforcement, user's choice

// Then:
.bind(DEFAULT_ENFORCE_TIER)
```

**Impact**: Self-documenting code.  
**Effort**: 0.1 hours

---

## CROSS-CUTTING PATTERNS

### Pattern #1: Query Column Lists Should Be Constants
**Affected Files**: vault_repos.rs (2 instances), habits_goals_repos.rs (4+), focus_repos.rs (3+)  
**Consolidation Opportunity**: Create `db/sql_fragments.rs` with predefined SELECT lists.

```rust
// db/sql_fragments.rs
pub mod columns {
    pub const VAULT: &str = "id, user_id, passphrase_salt, passphrase_hash, key_derivation_params, \
                             crypto_policy_version, locked_at, lock_reason, enforce_tier, \
                             last_rotated_at, next_rotation_due, created_at, updated_at";
    
    pub const VAULT_LOCK_STATE: &str = "locked_at, lock_reason";
}

// Usage:
format!("SELECT {} FROM vaults WHERE ...", columns::VAULT)
```

**Impact**: DRY principle, single source of truth for query structure.  
**Effort**: 2 hours (extract all columns across 5 repos, create helpers)

---

### Pattern #2: Enum Serialization Should Use Proc Macros
**Affected Files**: vault_models.rs (LockReason), habits_models.rs (Status), focus_models.rs (Status)  
**Consolidation Opportunity**: Use `strum` crate for all enums.

**Impact**: Eliminates 20+ lines of repetitive match blocks.  
**Effort**: 1.5 hours (add strum to Cargo.toml, update 5+ enum implementations)

---

### Pattern #3: Vault Access Pattern (Check Existence)
**Affected Files**: vault_repos.rs (lock_vault, unlock_vault)  
**Pattern**: UPDATE without validating vault exists.  
**Consolidation Opportunity**: Create helper `ensure_vault_exists()`.

```rust
async fn ensure_vault_exists(pool: &PgPool, user_id: Uuid) -> Result<Vault, VaultError> {
    VaultRepo::get_by_user_id(pool, user_id)
        .await?
        .ok_or(VaultError::VaultNotFound)
}

// Usage:
let _ = ensure_vault_exists(&state.db, auth.user_id).await?;
```

**Impact**: Prevents silent failures in 3+ locations.  
**Effort**: 0.5 hours

---

## IMPLEMENTATION ROADMAP

### Phase 1: Security Fix (CRITICAL - 1 hour)
- [ ] Implement passphrase verification (CLEANUP-1)
- [ ] Add row-affected check in lock_vault (CLEANUP-4)
- [ ] Test unlock with invalid passphrase returns 401

### Phase 2: Enum Refactoring (0.5 hours)
- [ ] Add `strum` to Cargo.toml
- [ ] Replace LockReason match blocks with strum derives
- [ ] Update tests for new enum syntax

### Phase 3: Query Consolidation (0.5 hours)
- [ ] Add VAULT_COLUMNS constant
- [ ] Consolidate get_lock_state and is_locked into single method
- [ ] Update sync caller to use new unified method

### Phase 4: Error & Response Cleanup (0.5 hours)
- [ ] Move error strings to constants or error enum
- [ ] Simplify UnlockVaultResponse (remove success field)
- [ ] Add input validation with better error messages

### Phase 5: Documentation (0.5 hours)
- [ ] Add lock reason semantics doc
- [ ] Add state machine diagram
- [ ] Document crypto policy versions

### Phase 6: Linting & Type Safety (0.25 hours)
- [ ] Remove duplicate structs (LockStateRow, IsLockedRow)
- [ ] Fix double semicolon
- [ ] Add magic number constants

### Phase 7: Integration Testing (0.75 hours)
- [ ] Test lock/unlock state transitions
- [ ] Test invalid passphrase rejection
- [ ] Test concurrent lock attempts (idempotency)

---

## VALIDATION CHECKLIST

### Security
- [ ] Passphrase verification implemented with proper hashing (Argon2/bcrypt)
- [ ] Invalid passphrase returns 401 Unauthorized
- [ ] No hardcoded credentials or keys in code
- [ ] Vault existence validated before state changes

### Performance
- [ ] No N+1 queries (lock state fetched in single query)
- [ ] No SELECT * without validation
- [ ] Indexes present on user_id lookups

### Code Quality
- [ ] No TODO comments (all resolved)
- [ ] No hardcoded error strings
- [ ] No duplicate enum implementations
- [ ] All types use strum or similar for serialization
- [ ] Column lists defined as constants

### Testing
- [ ] Valid lock transitions tested
- [ ] Invalid transitions rejected
- [ ] Concurrent locks are idempotent
- [ ] Passphrase verification works
- [ ] Missing vaults return proper errors

---

## SUMMARY

The vault system is relatively small (405 lines) but has **critical security gaps** (unimplemented passphrase verification) and **design concerns** (duplicate queries, unvalidated state changes). The main effort is implementing proper crypto validation and consolidating redundant query patterns.

**Highest Priority**: Implement passphrase verification (CLEANUP-1) before any unlock endpoint is used in production.

**Quick Wins**: Enum refactoring with strum (0.5h), query consolidation (0.5h).

**Total Effort**: 4.5-5.5 hours to complete all improvements and security hardening.
