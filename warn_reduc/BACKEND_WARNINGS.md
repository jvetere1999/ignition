# Backend Compiler Warnings Report

**Total Warnings:** 371  
**Build Status:** ✅ Compiles Successfully  
**Command:** `cargo check --bin ignition-api`

---

## Summary by Category

| Category | Count | Severity | Action |
|----------|-------|----------|--------|
| Unused Imports | 45+ | LOW | Auto-fixable with `cargo fix` |
| Unused Variables | 25+ | LOW | Auto-fixable with underscores |
| Dead Code | 80+ | LOW | Remove or mark with `#[allow(dead_code)]` |
| Unused Functions | 60+ | LOW | Remove or mark for future use |
| Unused Structs/Types | 30+ | LOW | Remove or mark for future use |
| Syntax/Style Issues | 3 | LOW | Fix manually |
| Deprecated APIs | 1 | MEDIUM | Update to new API |

---

## 1. UNUSED IMPORTS (Priority: HIGH - Quick Wins)

### Can be Auto-Fixed with `cargo fix --bin ignition-api --allow-dirty`

| File | Line | Import | Fix |
|------|------|--------|-----|
| [app/backend/crates/api/src/db/generated.rs](app/backend/crates/api/src/db/generated.rs#L26) | 26 | `DateTime`, `NaiveDate`, `Utc` | Remove unused chrono types |
| [app/backend/crates/api/src/db/mod.rs](app/backend/crates/api/src/db/mod.rs#L71) | 71 | `db_error`, `QueryContext` | Remove unused exports from `core::` |
| [app/backend/crates/api/src/routes/books.rs](app/backend/crates/api/src/routes/books.rs#L10) | 10 | `post` from routing | Remove unused HTTP method |
| [app/backend/crates/api/src/routes/crypto_policy.rs](app/backend/crates/api/src/routes/crypto_policy.rs#L12) | 12 | `CryptoPolicy` type | Remove unused model import |
| [app/backend/crates/api/src/routes/daw_projects.rs](app/backend/crates/api/src/routes/daw_projects.rs#L11) | 11 | `serde_json::json` macro | Remove unused JSON macro |
| [app/backend/crates/api/src/routes/focus.rs](app/backend/crates/api/src/routes/focus.rs#L22) | 22 | `BlobCategory` | Remove unused storage enum |
| [app/backend/crates/api/src/routes/goals.rs](app/backend/crates/api/src/routes/goals.rs#L9) | 9 | `delete` from routing | Remove unused HTTP method |
| [app/backend/crates/api/src/routes/habits.rs](app/backend/crates/api/src/routes/habits.rs#L17) | 17 | `HabitsListResponse` | Remove unused response type |
| [app/backend/crates/api/src/routes/privacy_modes.rs](app/backend/crates/api/src/routes/privacy_modes.rs#L5) | 5 | `crate::middleware::trust_boundary::*` | Remove wildcard import |
| [app/backend/crates/api/src/routes/settings.rs](app/backend/crates/api/src/routes/settings.rs#L8) | 8 | `patch` from routing | Remove unused HTTP method |
| [app/backend/crates/api/src/routes/vault.rs](app/backend/crates/api/src/routes/vault.rs#L7) | 7 | `crate::middleware::trust_boundary::*` | Remove wildcard import |
| [app/backend/crates/api/src/routes/vault_recovery.rs](app/backend/crates/api/src/routes/vault_recovery.rs#L11) | 11 | `middleware::trust_boundary::*` | Remove wildcard import |
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L4) | 4 | `DefaultBodyLimit`, `Multipart` | Remove unused axum extractors |
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L6) | 6 | `std::io::Write` | Remove unused stdlib trait |
| [app/backend/crates/api/src/services/mod.rs](app/backend/crates/api/src/services/mod.rs#L12) | 12 | `ChunkedUploadConfig`, `ChunkValidator` | Remove unused config types |
| [app/backend/crates/api/src/services/mod.rs](app/backend/crates/api/src/services/mod.rs#L14) | 14 | `R2Client`, `R2Config` | Remove unused storage client |
| [app/backend/crates/api/src/routes/auth.rs](app/backend/crates/api/src/routes/auth.rs#L7) | 7 | `std::str::FromStr` | Remove unused trait |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L6) | 6 | `Mac` from hmac (imported twice) | Remove duplicate import |

---

## 2. SYNTAX & STYLE ISSUES (Priority: MEDIUM - Manual Fixes)

### Unnecessary Parentheses
| File | Line | Issue | Fix |
|------|------|-------|-----|
| [app/backend/crates/api/src/routes/sync.rs](app/backend/crates/api/src/routes/sync.rs#L985) | 985 | `let percent = (calculation);` | Remove parentheses: `let percent = calculation;` |

**Current Code:**
```rust
let percent = (xp_in_current_level as f64 / xp_needed_for_level as f64 * 100.0);
```

**Suggested Fix:**
```rust
let percent = xp_in_current_level as f64 / xp_needed_for_level as f64 * 100.0;
```

---

### Redundant Trailing Semicolons
| File | Line | Issue | Fix |
|------|------|-------|-----|
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L153) | 153 | Double semicolon after `?` | Remove extra semicolon |
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L157) | 157 | Double semicolon after `?` | Remove extra semicolon |

**Current Code:**
```rust
.ok_or_else(|| AppError::BadRequest("Missing or invalid chunk_number".to_string()))?;;
```

**Suggested Fix:**
```rust
.ok_or_else(|| AppError::BadRequest("Missing or invalid chunk_number".to_string()))?;
```

---

## 3. UNUSED VARIABLES (Priority: MEDIUM - Prefix with underscore)

These should be prefixed with `_` if intentionally unused.

| File | Line | Variable | Usage | Fix |
|------|------|----------|-------|-----|
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L121) | 121 | `complete_file` | Never mutated | Remove `mut` keyword |
| [app/backend/crates/api/src/db/focus_repos.rs](app/backend/crates/api/src/db/focus_repos.rs#L418) | 418 | `streak_updated` | Computed but unused | Rename to `_streak_updated` |
| [app/backend/crates/api/src/db/privacy_modes_repos.rs](app/backend/crates/api/src/db/privacy_modes_repos.rs#L62) | 62 | `mode` | Pattern matched but unused | Rename to `_mode` |
| [app/backend/crates/api/src/db/privacy_modes_repos.rs](app/backend/crates/api/src/db/privacy_modes_repos.rs#L67) | 67 | `show` | Pattern matched but unused | Rename to `_show` |
| [app/backend/crates/api/src/db/privacy_modes_repos.rs](app/backend/crates/api/src/db/privacy_modes_repos.rs#L72) | 72 | `exclude` | Pattern matched but unused | Rename to `_exclude` |
| [app/backend/crates/api/src/db/privacy_modes_repos.rs](app/backend/crates/api/src/db/privacy_modes_repos.rs#L77) | 77 | `days` | Pattern matched but unused | Rename to `_days` |
| [app/backend/crates/api/src/db/search_repos.rs](app/backend/crates/api/src/db/search_repos.rs#L185) | 185 | `pool` | Function parameter unused | Rename to `_pool` |
| [app/backend/crates/api/src/db/search_repos.rs](app/backend/crates/api/src/db/search_repos.rs#L186) | 186 | `metadata` | Function parameter unused | Rename to `_metadata` |
| [app/backend/crates/api/src/db/search_repos.rs](app/backend/crates/api/src/db/search_repos.rs#L195) | 195 | `pool` | Function parameter unused | Rename to `_pool` |
| [app/backend/crates/api/src/error.rs](app/backend/crates/api/src/error.rs#L143) | 143 | `e` | Error pattern matched but unused | Rename to `_e` |
| [app/backend/crates/api/src/routes/daw_projects.rs](app/backend/crates/api/src/routes/daw_projects.rs#L164) | 164 | `req` | Request JSON extracted but unused | Rename to `_req` |
| [app/backend/crates/api/src/routes/search.rs](app/backend/crates/api/src/routes/search.rs#L128) | 128 | `content_count` | Query result unused | Rename to `_content_count` |
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L99) | 99 | `session_id` | Function parameter unused | Rename to `_session_id` |
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L100) | 100 | `chunk_number` | Function parameter unused | Rename to `_chunk_number` |
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L102) | 102 | `storage_path` | Function parameter unused | Rename to `_storage_path` |
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L117) | 117 | `session_id` | Function parameter unused | Rename to `_session_id` |
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L119) | 119 | `storage_path` | Function parameter unused | Rename to `_storage_path` |
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L123) | 123 | `chunk_num` | Loop variable unused | Rename to `_chunk_num` |
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L135) | 135 | `repo` | Function parameter unused | Rename to `_repo` |
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L136) | 136 | `session_id` | Function parameter unused | Rename to `_session_id` |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L170) | 170 | `bucket` | Function parameter unused | Rename to `_bucket` |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L171) | 171 | `region` | Function parameter unused | Rename to `_region` |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L402) | 402 | `session_id` | Function parameter unused | Rename to `_session_id` |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L412) | 412 | `storage_key` | Function parameter unused | Rename to `_storage_key` |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L418) | 418 | `session_id` | Function parameter unused | Rename to `_session_id` |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L425) | 425 | `storage_key` | Function parameter unused | Rename to `_storage_key` |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L433) | 433 | `storage_key` | Function parameter unused | Rename to `_storage_key` |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L434) | 434 | `part_etags` | Function parameter unused | Rename to `_part_etags` |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L446) | 446 | `storage_key` | Function parameter unused | Rename to `_storage_key` |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L447) | 447 | `content_type` | Function parameter unused | Rename to `_content_type` |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L458) | 458 | `storage_key` | Function parameter unused | Rename to `_storage_key` |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L459) | 459 | `upload_id` | Function parameter unused | Rename to `_upload_id` |

---

## 4. DEPRECATED APIs (Priority: HIGH - Update Required)

| File | Line | Deprecated | Reason | Replacement |
|------|------|-----------|--------|------------|
| [app/backend/crates/api/src/routes/sync.rs](app/backend/crates/api/src/routes/sync.rs#L1031) | 1031 | `VaultRepo::get_lock_state()` | Use unified query instead | `VaultRepo::get_vault_state_full()` |

**Current Code:**
```rust
match VaultRepo::get_lock_state(pool, user_id).await {
```

**Suggested Fix:**
```rust
match VaultRepo::get_vault_state_full(pool, user_id).await {
```

---

## 5. DEAD CODE / UNUSED STRUCTS (Priority: MEDIUM - Plan for Future)

These appear to be infrastructure or future features. Either remove or mark with `#[allow(dead_code)]`.

### Cache Module (Not Currently Used)
| File | Type | Name | Status |
|------|------|------|--------|
| [app/backend/crates/api/src/cache/mod.rs](app/backend/crates/api/src/cache/mod.rs#L12) | Struct | `CacheEntry` | Fields never read |
| [app/backend/crates/api/src/cache/mod.rs](app/backend/crates/api/src/cache/mod.rs#L19) | Method | `is_expired()` | Never called |
| [app/backend/crates/api/src/cache/mod.rs](app/backend/crates/api/src/cache/mod.rs#L32) | Struct | `QueryCache` | Field `cache` never read |
| [app/backend/crates/api/src/cache/mod.rs](app/backend/crates/api/src/cache/mod.rs#L46) | Method | `get()`, `set()`, `invalidate()` | 6+ methods never used |
| [app/backend/crates/api/src/cache/mod.rs](app/backend/crates/api/src/cache/mod.rs#L148) | Struct | `CacheStats` | Never constructed |

### Cache Helpers Module (Infrastructure)
| File | Type | Name | Status |
|------|------|------|--------|
| [app/backend/crates/api/src/cache/helpers.rs](app/backend/crates/api/src/cache/helpers.rs#L14) | Struct | `CacheConfig` | Never constructed |
| [app/backend/crates/api/src/cache/helpers.rs](app/backend/crates/api/src/cache/helpers.rs#L22) | Method | `new()`, `with_max_size()` | Never used |
| [app/backend/crates/api/src/cache/helpers.rs](app/backend/crates/api/src/cache/helpers.rs#L39) | Struct | `CacheKeyBuilder` | Never constructed |
| [app/backend/crates/api/src/cache/helpers.rs](app/backend/crates/api/src/cache/helpers.rs#L75) | Struct | `CacheEntryMetadata` | Never constructed |
| [app/backend/crates/api/src/cache/helpers.rs](app/backend/crates/api/src/cache/helpers.rs#L125) | Struct | `CacheInvalidationStrategy` | Never constructed |

**Recommendation:** The entire cache infrastructure appears undeployed. Consider:
- Either removing these modules entirely
- Or adding `#![allow(dead_code)]` to `cache/` modules and planning cache integration for Phase 7+

### Chunked Upload Service (Partially Implemented)
| File | Type | Name | Status |
|------|------|------|--------|
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L40) | Function | `validate_chunk()` | Never called |
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L79) | Function | `calculate_chunk_hash()` | Never called |
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L86) | Function | `verify_chunk_hash()` | Never called |
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L98) | Function | `write_chunk_to_storage()` | Never called |
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L116) | Function | `reconstruct_file_from_chunks()` | Never called |
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L134) | Function | `cleanup_upload_session()` | Never called |
| [app/backend/crates/api/src/services/chunked_upload.rs](app/backend/crates/api/src/services/chunked_upload.rs#L147) | Function | `validate_multipart_form()` | Never called |

**Recommendation:** These are placeholder functions. Either implement the DAW project upload feature or remove temporarily.

### R2 Storage Service (Not Integrated)
| File | Type | Name | Status |
|------|------|------|--------|
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L8) | Type Alias | `HmacSha256` | Never used |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L12) | Struct | `R2Config` | Never constructed |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L23) | Function | `from_env()` | Never called |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L41) | Struct | `R2FileMetadata` | Never constructed |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L50) | Struct | `PresignedDownloadUrl` | Never constructed |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L58) | Struct | `PresignedUploadUrl` | Never constructed |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L255) | Struct | `R2Client` | Never constructed |
| [app/backend/crates/api/src/services/r2_storage.rs](app/backend/crates/api/src/services/r2_storage.rs#L260+) | Methods | 15+ R2Client methods | Never called |

**Recommendation:** R2 storage is fully implemented but not integrated. Mark entire module as ready for Phase 7 storage integration.

### Audit System (Infrastructure Ready)
| File | Type | Name | Status |
|------|------|------|--------|
| [app/backend/crates/api/src/shared/audit.rs](app/backend/crates/api/src/shared/audit.rs#L92) | Struct | `AuditEvent` | Never constructed |
| [app/backend/crates/api/src/shared/audit.rs](app/backend/crates/api/src/shared/audit.rs#L115+) | Methods | 6+ builder methods | Never used |
| [app/backend/crates/api/src/shared/audit.rs](app/backend/crates/api/src/shared/audit.rs#L164) | Trait | `AuditSink` | Never implemented |
| [app/backend/crates/api/src/shared/audit.rs](app/backend/crates/api/src/shared/audit.rs#L173) | Struct | `PostgresAuditSink` | Never constructed |
| [app/backend/crates/api/src/shared/audit.rs](app/backend/crates/api/src/shared/audit.rs#L224) | Struct | `NoOpAuditSink` | Never constructed |
| [app/backend/crates/api/src/shared/audit.rs](app/backend/crates/api/src/shared/audit.rs#L236) | Struct | `LoggingAuditSink` | Never constructed |
| [app/backend/crates/api/src/shared/audit.rs](app/backend/crates/api/src/shared/audit.rs#L259) | Struct | `MultiAuditSink` | Never constructed |

**Recommendation:** Complete audit infrastructure is ready but not deployed. Integrate for compliance/logging Phase 7+.

### CSRF Protection (Infrastructure Ready)
| File | Type | Name | Status |
|------|------|------|--------|
| [app/backend/crates/api/src/shared/auth/csrf.rs](app/backend/crates/api/src/shared/auth/csrf.rs#L12) | Constant | `TOKEN_BYTES` | Never used |
| [app/backend/crates/api/src/shared/auth/csrf.rs](app/backend/crates/api/src/shared/auth/csrf.rs#L17) | Function | `generate_token()` | Never called |
| [app/backend/crates/api/src/shared/auth/csrf.rs](app/backend/crates/api/src/shared/auth/csrf.rs#L26) | Function | `verify_token()` | Never called |
| [app/backend/crates/api/src/shared/auth/csrf.rs](app/backend/crates/api/src/shared/auth/csrf.rs#L44) | Constant | `CSRF_HEADER` | Never used |
| [app/backend/crates/api/src/shared/auth/csrf.rs](app/backend/crates/api/src/shared/auth/csrf.rs#L50) | Function | `create_csrf_cookie()` | Never called |

**Recommendation:** CSRF protection is implemented but not enabled in middleware. Enable for security Phase 6+.

### Auth Extractors (Infrastructure Ready)
| File | Type | Name | Status |
|------|------|------|--------|
| [app/backend/crates/api/src/shared/auth/extractor.rs](app/backend/crates/api/src/shared/auth/extractor.rs#L28) | Struct | `Auth` | Never constructed |
| [app/backend/crates/api/src/shared/auth/extractor.rs](app/backend/crates/api/src/shared/auth/extractor.rs#L61+) | Methods | `is_admin()`, `has_entitlement()` | Never used |
| [app/backend/crates/api/src/shared/auth/extractor.rs](app/backend/crates/api/src/shared/auth/extractor.rs#L110) | Struct | `MaybeAuth` | Never constructed |

### Origin Validation (Infrastructure Ready)
| File | Type | Name | Status |
|------|------|------|--------|
| [app/backend/crates/api/src/shared/auth/origin.rs](app/backend/crates/api/src/shared/auth/origin.rs#L8) | Constant | `PRODUCTION_ORIGINS` | Never used |
| [app/backend/crates/api/src/shared/auth/origin.rs](app/backend/crates/api/src/shared/auth/origin.rs#L14) | Constant | `DEV_ORIGINS` | Never used |
| [app/backend/crates/api/src/shared/auth/origin.rs](app/backend/crates/api/src/shared/auth/origin.rs#L22+) | Functions | 7+ origin check functions | Never called |

### RBAC (Infrastructure Ready)
| File | Type | Name | Status |
|------|------|------|--------|
| [app/backend/crates/api/src/shared/auth/rbac.rs](app/backend/crates/api/src/shared/auth/rbac.rs#L19) | Function | `require_auth_guard()` | Never called |
| [app/backend/crates/api/src/shared/auth/rbac.rs](app/backend/crates/api/src/shared/auth/rbac.rs#L31) | Function | `require_admin_guard()` | Never called |
| [app/backend/crates/api/src/shared/auth/rbac.rs](app/backend/crates/api/src/shared/auth/rbac.rs#L49+) | Functions | 3+ entitlement guards | Never called |
| [app/backend/crates/api/src/shared/auth/rbac.rs](app/backend/crates/api/src/shared/auth/rbac.rs#L136) | Struct | `RbacPolicy` | Never constructed |

### Pagination (Infrastructure Ready)
| File | Type | Name | Status |
|------|------|------|--------|
| [app/backend/crates/api/src/shared/db/pagination.rs](app/backend/crates/api/src/shared/db/pagination.rs#L9) | Constant | `DEFAULT_PAGE_SIZE` | Never used |
| [app/backend/crates/api/src/shared/db/pagination.rs](app/backend/crates/api/src/shared/db/pagination.rs#L12) | Constant | `MAX_PAGE_SIZE` | Never used |
| [app/backend/crates/api/src/shared/db/pagination.rs](app/backend/crates/api/src/shared/db/pagination.rs#L16+) | Struct/Methods | 10+ pagination types | Never used |

### Transactions (Infrastructure Ready)
| File | Type | Name | Status |
|------|------|------|--------|
| [app/backend/crates/api/src/shared/db/tx.rs](app/backend/crates/api/src/shared/db/tx.rs#L10) | Struct | `Tx` | Never constructed |
| [app/backend/crates/api/src/shared/db/tx.rs](app/backend/crates/api/src/shared/db/tx.rs#L57) | Function | `with_transaction()` | Never called |
| [app/backend/crates/api/src/shared/db/tx.rs](app/backend/crates/api/src/shared/db/tx.rs#L85+) | Struct | `Savepoint` | Never constructed |

### HTTP Error Handling (Infrastructure Ready)
| File | Type | Name | Status |
|------|------|------|--------|
| [app/backend/crates/api/src/shared/http/errors.rs](app/backend/crates/api/src/shared/http/errors.rs#L16) | Struct | `ApiError` | Never constructed |
| [app/backend/crates/api/src/shared/http/errors.rs](app/backend/crates/api/src/shared/http/errors.rs#L43+) | Methods | 8+ error constructors | Never used |

### HTTP Response Builders (Infrastructure Ready)
| File | Type | Name | Status |
|------|------|------|--------|
| [app/backend/crates/api/src/shared/http/response.rs](app/backend/crates/api/src/shared/http/response.rs#L112) | Struct | `NoContent` | Never constructed |
| [app/backend/crates/api/src/shared/http/response.rs](app/backend/crates/api/src/shared/http/response.rs#L155+) | Functions | 3+ response builders | Never called |

### Validation Framework (Infrastructure Ready)
| File | Type | Name | Status |
|------|------|------|--------|
| [app/backend/crates/api/src/shared/http/validation.rs](app/backend/crates/api/src/shared/http/validation.rs#L11) | Struct | `Validator` | Never constructed |
| [app/backend/crates/api/src/shared/http/validation.rs](app/backend/crates/api/src/shared/http/validation.rs#L23+) | Methods | 15+ validation methods | Never used |

### Entity IDs (Generated by Macro)
| File | Type | Names | Status |
|------|------|-------|--------|
| [app/backend/crates/api/src/shared/ids.rs](app/backend/crates/api/src/shared/ids.rs#L142-157) | Type Aliases | 16+ ID types + structs | Never constructed |

**Recommendation:** These are from macro generation. Keep as infrastructure.

---

## 6. REMEDIATION PLAN

### Phase 1: Quick Wins (30 minutes)
1. Run `cargo fix --bin ignition-api --allow-dirty` to auto-fix:
   - Unused imports
   - Unused variable warnings
   - Parentheses issues

2. Manually remove trailing semicolons (3 instances)

3. Update deprecated API call in sync.rs line 1031

**Expected Result:** 50+ warnings eliminated

### Phase 2: Infrastructure Cleanup (1-2 hours)
1. Add `#![allow(dead_code)]` to entire cache module - not ready until Phase 7
2. Add `#![allow(dead_code)]` to entire audit module - not ready until Phase 7
3. Add `#![allow(dead_code)]` to CSRF protection - not ready until security Phase
4. Add `#![allow(dead_code)]` to pagination module - not ready until cursor-based API
5. Add `#![allow(dead_code)]` to transaction module - single endpoint can use quick paths
6. Add `#![allow(dead_code)]` to auth guards - using header extraction currently

**Expected Result:** 200+ warnings suppressed with clear documentation

### Phase 3: Future Cleanup
- Complete DAW project upload implementation (utilizes chunked_upload functions)
- Integrate R2 storage when Phase 7 storage begins
- Enable RBAC when role-based access is needed
- Enable audit logging when compliance required

---

## Summary Statistics

**By File (Top Issues):**
1. `services/r2_storage.rs` - 30+ warnings (storage infrastructure)
2. `cache/helpers.rs` - 25+ warnings (cache infrastructure)
3. `shared/audit.rs` - 20+ warnings (audit infrastructure)
4. `services/chunked_upload.rs` - 18+ warnings (upload infrastructure)
5. `shared/auth/rbac.rs` - 15+ warnings (permission infrastructure)

**Estimated Fix Time:**
- Quick fixes: 30 minutes
- Suppression: 1 hour
- **Total: ~90 minutes**

**Risk Level:** LOW - All warnings are for infrastructure not currently in use

