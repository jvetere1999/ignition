# MASTER TASK LIST - PASSION OS NEXT OPTIMIZATION ROADMAP

**Created**: January 15, 2026  
**Total Tasks**: 145  
**Total Estimated Effort**: 27-34 hours  
**Format**: Prioritized by criticality × impact (ROI-focused)  

---

## TASK PRIORITIZATION FRAMEWORK

Each task scored by: **Criticality × Impact = Priority Score**

- **Criticality**: CRITICAL=10, HIGH=8, MEDIUM=5, LOW=3  
- **Impact**: Size of codebase affected, maintenance burden reduction, security risk  
- **Priority Score**: Higher = more urgent

**Color Legend**:
- 🔴 **CRITICAL** (fix immediately - security/stability)
- 🟠 **HIGH** (fix this week - major consistency/UX)
- 🟡 **MEDIUM** (fix this month - code quality)
- 🟢 **LOW** (opportunity - polish)

---

## CRITICAL SECURITY ISSUES (Week 1 - ~2 hours)

### 🔴 SEC-001: OAuth Redirect Open Redirect Vulnerability
- **Severity**: CRITICAL (Security)
- **Effort**: 0.2 hours  
- **Impact**: 7/10 (affects all OAuth flows)
- **Priority Score**: 10 × 7 = 70
- **Status**: Not started
- **Document**: [backend_security_patterns.md](backend_security_patterns.md#oauth-1-incomplete-redirect-uri-validation)

**Issue**: Client can specify any redirect_uri after authentication, enabling open redirect attack.

**Tasks**:
- [ ] Create ALLOWED_REDIRECT_URIS constant list with frontend URLs
- [ ] Implement validate_redirect_uri() function  
- [ ] Update signin_google() to validate before storing
- [ ] Update signin_azure() to validate before storing
- [ ] Add unit tests for redirect validation

**Acceptance**: Redirect URIs validated against whitelist, no arbitrary redirects accepted.

**Links**: 
- Code location: `app/backend/crates/api/src/routes/auth.rs` (~100-115)
- Related: Session management, configuration validation

---

### 🔴 SEC-002: Gamification Race Condition - Coin Spending
- **Severity**: CRITICAL (Business Logic)
- **Effort**: 1.5 hours
- **Impact**: 9/10 (affects economy transactions)
- **Priority Score**: 10 × 9 = 90
- **Status**: Not started
- **Document**: [backend_gamification_repos.md](backend_gamification_repos.md)

**Issue**: Coin balance check and deduction not atomic; users can spend more coins than balance.

**Tasks**:
- [ ] Convert award_coins() to single SQL transaction with explicit locking
- [ ] Add balance check within transaction before deduction
- [ ] Create integration test for concurrent spending
- [ ] Add audit logging for failed transactions
- [ ] Document transaction isolation level

**Acceptance**: Balance always accurate even with concurrent requests; test proves atomicity.

---

### 🔴 SEC-003: XP Calculation Integer Overflow
- **Severity**: CRITICAL (Business Logic)  
- **Effort**: 1.5 hours
- **Impact**: 8/10 (affects progression system)
- **Priority Score**: 10 × 8 = 80
- **Status**: Not started
- **Document**: [backend_gamification_repos.md](backend_gamification_repos.md)

**Issue**: XP formula can overflow integer bounds; no validation of XP amounts before calculation.

**Tasks**:
- [ ] Review XP formula: `base_xp + (time_spent / 100) * difficulty_multiplier`
- [ ] Add bounds checking before and after calculation
- [ ] Use i64 for intermediate calculations (already using i32)
- [ ] Add validation: XP amount must be 0-500 per action
- [ ] Add unit tests for boundary conditions (0, max, overflow)
- [ ] Document XP limits in code comments

**Acceptance**: XP capped at sensible limits; test suite covers boundaries; overflow impossible.

---

### 🔴 SEC-004: Configuration Validation Missing
- **Severity**: CRITICAL (Stability)
- **Effort**: 0.25 hours
- **Impact**: 8/10 (catches runtime failures at startup)
- **Priority Score**: 10 × 8 = 80
- **Status**: Not started
- **Document**: [backend_configuration_patterns.md](backend_configuration_patterns.md#cfg-2-missing-validation-of-required-fields)

**Issue**: Invalid configuration loads without error; failures occur at runtime when features accessed.

**Tasks**:
- [ ] Create validate() method in AppConfig struct
- [ ] Check all required field combinations (OAuth, Storage, etc.)
- [ ] Provide specific error messages for missing fields
- [ ] Call validate() in App::load() before returning
- [ ] Test validation catches common misconfigurations

**Acceptance**: Server fails to start with clear error message if config invalid.

---

### 🔴 SEC-005: Missing Security Headers
- **Severity**: CRITICAL (Security)
- **Effort**: 0.2 hours
- **Impact**: 8/10 (prevents XSS, clickjacking, MIME sniffing)
- **Priority Score**: 10 × 8 = 80
- **Status**: Not started
- **Document**: [backend_security_patterns.md](backend_security_patterns.md#csp-2-missing-security-headers)

**Issue**: No Content-Security-Policy, X-Frame-Options, X-Content-Type-Options headers.

**Tasks**:
- [ ] Create middleware/security_headers.rs
- [ ] Add CSP header: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self'`
- [ ] Add X-Frame-Options: DENY
- [ ] Add X-Content-Type-Options: nosniff
- [ ] Add Referrer-Policy: strict-origin-when-cross-origin
- [ ] Wire into main.rs router before routes
- [ ] Add test for header presence in responses

**Acceptance**: All security headers present in HTTP responses.

---

### 🔴 SEC-006: Session Activity Tracking Race Condition
- **Severity**: HIGH (but critical for session invalidation)
- **Effort**: 0.3 hours
- **Impact**: 7/10 (affects session timeout accuracy)
- **Priority Score**: 8 × 7 = 56
- **Status**: Not started
- **Document**: [backend_security_patterns.md](backend_security_patterns.md#session-1-session-activity-tracking-race-condition)

**Issue**: Multiple concurrent requests may cause session activity update races; last-access-time inaccurate.

**Tasks**:
- [ ] Add activity_update_tx: mpsc::Sender to AppState
- [ ] Create background task to batch activity updates
- [ ] Update middleware/auth.rs to send to channel instead of direct update
- [ ] Batch updates every 30 seconds or per N requests
- [ ] Add logging for update failures
- [ ] Test concurrent requests don't lose updates

**Acceptance**: Session activity tracking doesn't block requests; batched updates accurate.

---

## HIGH PRIORITY BACKEND TASKS (Weeks 2-3 - ~8 hours)

### 🟠 BACK-001: Fix Vault State Security Issue
- **Severity**: HIGH (Security)
- **Effort**: 1 hour (Phase 1 only)
- **Impact**: 7/10
- **Priority Score**: 8 × 7 = 56
- **Status**: Not started
- **Document**: [backend_vault_state.md](backend_vault_state.md#phase-1-security-fix-critical---1-hour)

**Issue**: Vault state lock mechanism has race conditions; concurrent mutations possible.

**Tasks** (Phase 1 only):
- [ ] Review vault state locking mechanism
- [ ] Add explicit transaction boundaries
- [ ] Add advisory locks for concurrent access prevention
- [ ] Test concurrent unlock/lock scenarios
- [ ] Document lock lifecycle

---

### 🟠 BACK-002: Refactor Quests Repository - Remove format! Macros
- **Severity**: HIGH (Code Quality/SQL Injection Prevention)
- **Effort**: 2 hours
- **Impact**: 8/10 (affects 40+ queries)
- **Priority Score**: 8 × 8 = 64
- **Status**: Not started
- **Document**: [backend_quests_repo.md](backend_quests_repo.md#phase-1-remove-format-from-queries-2-hours)

**Issue**: 40+ queries built with format! macros instead of sqlx bindings; potential SQL injection.

**Tasks**:
- [ ] Identify all format! usage in quests_repos.rs
- [ ] Convert to parameterized queries: sqlx::query("... WHERE id = $1").bind(id)
- [ ] Add type safety where missing
- [ ] Run integration tests after each conversion
- [ ] Add linting rule to prevent future format! usage in queries

**Acceptance**: Zero format! macros in SQL queries; all parameterized; tests pass.

---

### 🟠 BACK-003: Extract Common Operations from Habits Repository
- **Severity**: HIGH (Maintainability)
- **Effort**: 3 hours
- **Impact**: 7/10 (habits_repos.rs is 1600+ lines)
- **Priority Score**: 8 × 7 = 56
- **Status**: Not started
- **Document**: [backend_habits_repo.md](backend_habits_repo.md#phase-3-common-operations-3-hours)

**Issue**: Idempotency checks, date formatting, status updates repeated 8+ times across file.

**Tasks**:
- [ ] Extract idempotency_check(idempotency_key) helper function
- [ ] Extract format_habit_date(date) helper function
- [ ] Extract update_habit_status(id, status) helper function
- [ ] Extract habit validation logic into trait/impl
- [ ] Review and consolidate error handling patterns
- [ ] Add documentation for each helper

**Acceptance**: No duplicate logic blocks; all extracted operations tested; file more readable.

---

### 🟠 BACK-004: Fix Focus Repository Pause/Resume Logic
- **Severity**: HIGH (Feature Correctness)
- **Effort**: 2.5 hours
- **Impact**: 7/10 (affects focus timer functionality)
- **Priority Score**: 8 × 7 = 56
- **Status**: Not started
- **Document**: [backend_focus_repo.md](backend_focus_repo.md#phase-1-fix-pauseresume-logic-25-hours)

**Issue**: Pause/resume state transitions not properly validated; users can double-pause or resume while running.

**Tasks**:
- [ ] Add state machine validation: only certain transitions allowed
- [ ] Create state transition guard functions
- [ ] Fix pause to only work in RUNNING state
- [ ] Fix resume to only work in PAUSED state
- [ ] Add test matrix for all state transitions
- [ ] Document state diagram in code comments

**Acceptance**: State transitions validated; invalid transitions rejected; test coverage 100%.

---

### 🟠 BACK-005: Database Model Macro Duplication
- **Severity**: HIGH (Maintainability)
- **Effort**: 1.5 hours
- **Impact**: 7/10 (affects 20+ model definitions)
- **Priority Score**: 8 × 7 = 56
- **Status**: Not started
- **Document**: [backend_db_models_consistency.md](backend_db_models_consistency.md)

**Issue**: Enum derive macros and status patterns duplicated across 20+ model definitions.

**Tasks**:
- [ ] Create schema_enums! macro for DeriveFromRow, Serialize, Deserialize, Clone, Debug
- [ ] Create status_enum! macro for common status enums
- [ ] Migrate all existing enums to new macros (ongoing)
- [ ] Document macro usage patterns
- [ ] Update database_models.md with conventions
- [ ] Lint rule: reject new derive duplications

**Acceptance**: Macros reduce 200+ lines of boilerplate; new code uses macros; tests pass.

---

### 🟠 BACK-006: Test Organization & Fixtures
- **Severity**: HIGH (Developer Experience)
- **Effort**: 2-2.5 hours
- **Impact**: 7/10 (affects maintainability of 50+ tests)
- **Priority Score**: 8 × 7 = 56
- **Status**: Not started
- **Document**: [backend_test_organization.md](backend_test_organization.md)

**Issue**: Test fixtures duplicated across files; database setup scattered; hard to add new tests.

**Tasks**:
- [ ] Create tests/fixtures/ directory structure
- [ ] Create db_setup.rs with shared database initialization
- [ ] Extract common test fixtures: user, habit, quest, focus_session
- [ ] Create test_helper.rs with common assertions
- [ ] Consolidate database setup in common module
- [ ] Document test setup and fixture usage
- [ ] Update existing tests to use shared fixtures

**Acceptance**: New tests can be written in <5 minutes; fixtures reusable; no duplication.

---

### 🟠 BACK-007: Import Organization & Module Visibility
- **Severity**: HIGH (Code Discoverability)
- **Effort**: 1.5-2 hours
- **Impact**: 6/10 (affects developer navigation)
- **Priority Score**: 8 × 6 = 48
- **Status**: Not started
- **Document**: [backend_import_organization.md](backend_import_organization.md)

**Issue**: Imports scattered; visibility unclear; no consistent re-export pattern.

**Tasks**:
- [ ] Define import standards (std, crate, module organization)
- [ ] Refactor high-impact files (db/mod.rs, shared/mod.rs)
- [ ] Create strategic re-exports in module lib.rs files
- [ ] Remove wildcard imports; use explicit imports
- [ ] Update rustfmt rules for consistent ordering
- [ ] Create IMPORT_CONVENTIONS.md documentation

**Acceptance**: All imports follow pattern; no wildcards; easy to navigate module tree.

---

### 🟠 BACK-008: Logging Consistency
- **Severity**: HIGH (Operations/Debugging)
- **Effort**: 1.5-2 hours
- **Impact**: 6/10 (affects debugging efficiency)
- **Priority Score**: 8 × 6 = 48
- **Status**: Not started
- **Document**: [backend_logging_consistency.md](backend_logging_consistency.md)

**Issue**: Inconsistent log levels (WARN vs INFO for same events); structured fields vary; formatting inconsistent.

**Tasks**:
- [ ] Standardize log level usage: ERROR, WARN, INFO, DEBUG, TRACE
- [ ] Add request_id to all logs via middleware
- [ ] Standardize field names: user_id (not user), request_id, error_type
- [ ] Fix format: `user_id=%d` → `user_id = %d`
- [ ] Add startup configuration logging
- [ ] Review performance: remove debug logs in hot paths
- [ ] Create LOGGING_STANDARDS.md

**Acceptance**: All logs consistent; searchable patterns; performance acceptable.

---

### 🟠 BACK-009: Fix Gamification Achievement Unlock Logic
- **Severity**: HIGH (Feature Correctness)
- **Effort**: 1 hour
- **Impact**: 6/10 (affects achievement system)
- **Priority Score**: 8 × 6 = 48
- **Status**: Not started
- **Document**: [backend_gamification_repos.md](backend_gamification_repos.md#phase-3-fix-achievement-unlock-1-hour)

**Issue**: Achievement unlock conditions have complex 4-way branching; edge cases possible.

**Tasks**:
- [ ] Document all achievement unlock conditions
- [ ] Add validation for trigger type correctness
- [ ] Fix progress counting for multi-step achievements
- [ ] Test all achievement unlock paths
- [ ] Add logging for achievement unlocks

**Acceptance**: Achievement unlocks correct; test coverage 100%; clear error messages.

---

### 🟠 BACK-010: Error Handling Type Safety & Consistency
- **Severity**: HIGH (Code Quality)
- **Effort**: 1.5-2 hours
- **Impact**: 6/10 (affects error debugging)
- **Priority Score**: 8 × 6 = 48
- **Status**: Not started
- **Document**: [backend_error_handling.md](backend_error_handling.md) + [backend_error_handling_patterns.md](backend_error_handling_patterns.md)

**Issue**: Missing error variants; inconsistent HTTP status codes; error context lost.

**Tasks**:
- [ ] Add missing error variants (OAuthStateNotFound, AchievementAlreadyUnlocked, etc.)
- [ ] Create error type constants for reusable strings
- [ ] Add constructor helpers: AppError::not_found(resource_type)
- [ ] Standardize HTTP status mapping
- [ ] Ensure all From<T> traits implemented
- [ ] Add comprehensive error documentation
- [ ] Improve database error handling

**Acceptance**: All errors typed; HTTP status consistent; error context preserved; tests pass.

---

### 🟠 BACK-011: Response Wrapper Standardization
- **Severity**: HIGH (API Consistency)
- **Effort**: 2-3 hours (ongoing migration)
- **Impact**: 6/10 (affects 100+ endpoints)
- **Priority Score**: 8 × 6 = 48
- **Status**: Not started (Phase 1 setup complete)
- **Document**: [backend_response_wrappers.md](backend_response_wrappers.md)

**Issue**: Response wrapping inconsistent; some endpoints generic, some custom, some unwrapped.

**Tasks**:
- [ ] Create generic response types: ApiResponse<T>, PaginatedResponse<T>
- [ ] Document response standards
- [ ] Start migration with high-value endpoints
- [ ] Create macro for wrapping responses
- [ ] Update API documentation/OpenAPI spec
- [ ] Cleanup deprecated response types

**Acceptance**: 30+ endpoints migrated; consistent response format; documentation updated.

---

### 🟠 BACK-012: Auth Middleware Code Consolidation
- **Severity**: HIGH (Maintainability)
- **Effort**: 1.75 hours
- **Impact**: 6/10 (affects auth layer)
- **Priority Score**: 8 × 6 = 48
- **Status**: Not started
- **Document**: [backend_auth_middleware.md](backend_auth_middleware.md)

**Issue**: Duplicated auth extraction logic; inconsistent error handling; unclear separation of concerns.

**Tasks**:
- [ ] Extract token parsing logic into helper functions
- [ ] Create consistent error handling for auth failures
- [ ] Add comprehensive documentation
- [ ] Implement entitlement caching (See SEC-006)
- [ ] Improve dev bypass security controls
- [ ] Create auth lifecycle documentation

**Acceptance**: No duplicated logic; clear error messages; comprehensive tests.

---

## HIGH PRIORITY FRONTEND TASKS (Weeks 2-3 - ~8 hours)

### 🟠 FRONT-001: Component Organization & Structure
- **Severity**: HIGH (Developer Experience)
- **Effort**: 1.5-2 hours
- **Impact**: 7/10 (affects 50+ components)
- **Priority Score**: 8 × 7 = 56
- **Status**: Not started
- **Document**: [frontend_component_organization.md](frontend_component_organization.md)

**Issue**: Folder structure unclear; components scattered across multiple locations; barrel exports incomplete.

**Tasks**:
- [ ] Create components/README.md documenting folder organization
- [ ] Standardize UI components location (app/components/ui/)
- [ ] Complete barrel exports (index.ts) in all folders
- [ ] Rename "Initializer" components to "Provider" for consistency
- [ ] Document component architecture and patterns
- [ ] Standardize component props interfaces (extends PropsWithChildren)
- [ ] Standardize CSS Module naming patterns (Component.module.css)
- [ ] Create component catalog/inventory

**Acceptance**: Clear folder structure; all barrel exports working; consistent naming; navigation easy.

---

### 🟠 FRONT-002: State Management Patterns
- **Severity**: HIGH (Code Quality)
- **Effort**: 1.5-2 hours
- **Impact**: 7/10 (affects 30+ components)
- **Priority Score**: 8 × 7 = 56
- **Status**: Not started
- **Document**: [frontend_state_management.md](frontend_state_management.md)

**Issue**: Mixed useState/useReducer patterns; complex state scattered across components; side effect dependencies unclear.

**Tasks**:
- [ ] Document state architecture (where each state type lives)
- [ ] Convert 3-4 complex useState chains to useReducer
- [ ] Implement cache invalidation strategy
- [ ] Add state documentation comments
- [ ] Audit useEffect dependencies (missing deps)
- [ ] Standardize context usage patterns
- [ ] Create state management guide

**Acceptance**: Complex state uses useReducer; clear cache invalidation; test coverage >80%.

---

### 🟠 FRONT-003: API Client Centralization
- **Severity**: HIGH (Consistency/Maintainability)
- **Effort**: 1.5-2 hours
- **Impact**: 7/10 (affects all API calls)
- **Priority Score**: 8 × 7 = 56
- **Status**: Not started
- **Document**: [frontend_api_client_patterns.md](frontend_api_client_patterns.md)

**Issue**: API calls scattered across components; error handling inconsistent; no response validation.

**Tasks**:
- [ ] Create lib/api/client.ts with centralized fetch wrapper
- [ ] Create lib/api/hooks.ts with useAPI, useMutation hooks
- [ ] Add response validation (Zod/io-ts schemas)
- [ ] Add error handling with user-friendly messages
- [ ] Add request logging/tracing
- [ ] Create API endpoints document
- [ ] Migrate existing API calls to centralized client (ongoing)

**Acceptance**: All API calls use centralized client; error handling consistent; types validated.

---

### 🟠 FRONT-004: Styling Patterns & Responsive Design
- **Severity**: HIGH (Code Quality)
- **Effort**: 1.5-2 hours
- **Impact**: 6/10 (affects 100+ CSS rules)
- **Priority Score**: 8 × 6 = 48
- **Status**: Not started
- **Document**: [frontend_styling_patterns.md](frontend_styling_patterns.md)

**Issue**: CSS utilities duplicated; no responsive design patterns; inconsistent breakpoints; no theme system.

**Tasks**:
- [ ] Create styles/breakpoints.css with consistent breakpoints (mobile, tablet, desktop)
- [ ] Create styles/theme-variables.css with CSS custom properties
- [ ] Implement responsive design base styles
- [ ] Audit and consolidate duplicate utilities
- [ ] Add vendor prefixes where needed
- [ ] Create STYLING_GUIDE.md with examples
- [ ] Document responsive patterns

**Acceptance**: Breakpoints consistent; CSS variables used for theming; utilities deduplicated.

---

### 🟠 FRONT-005: Form Handling Standardization
- **Severity**: HIGH (Developer Experience)
- **Effort**: 1.5-2 hours
- **Impact**: 6/10 (affects 20+ forms)
- **Priority Score**: 8 × 6 = 48
- **Status**: Not started
- **Document**: [frontend_form_handling.md](frontend_form_handling.md)

**Issue**: Form validation inconsistent; error handling scattered; accessibility gaps; manual state management.

**Tasks**:
- [ ] Choose & integrate form library (React Hook Form recommended)
- [ ] Create validation schemas with Zod/io-ts
- [ ] Create reusable form components (FormInput, FormSelect, etc.)
- [ ] Map server errors to form field errors
- [ ] Create FORM_GUIDE.md with patterns
- [ ] Ensure accessibility (labels, aria-attributes)
- [ ] Add error message display patterns

**Acceptance**: Forms use library; validation consistent; error messages clear; accessible.

---

### 🟠 FRONT-006: Routing Structure & Auth Protection
- **Severity**: HIGH (Security/User Experience)
- **Effort**: 1.5-2 hours
- **Impact**: 6/10 (affects 15+ routes)
- **Priority Score**: 8 × 6 = 48
- **Status**: Not started
- **Document**: [frontend_routing_structure.md](frontend_routing_structure.md)

**Issue**: Routes scattered; auth protection inconsistent; no clear navigation patterns; undocumented routes.

**Tasks**:
- [ ] Create routes/ROUTE_MAP.md documenting all routes
- [ ] Centralize navigation constants (routes/constants.ts)
- [ ] Improve auth middleware (redirect to login if unauth)
- [ ] Fix layout nesting and inheritance
- [ ] Create ROUTING_GUIDE.md with patterns
- [ ] Add route protection decorator pattern
- [ ] Document navigation patterns

**Acceptance**: All routes documented; auth protection consistent; clear navigation paths.

---

## MEDIUM PRIORITY TASKS (Month 1 - ~8 hours)

### 🟡 MID-001: Badges & Queries Optimization
- **Severity**: MEDIUM (Performance)
- **Effort**: 6.25 hours total (phased)
- **Impact**: 5/10
- **Priority Score**: 5 × 5 = 25
- **Status**: Not started
- **Document**: [backend_badges_queries.md](backend_badges_queries.md)

**Quick wins (Week 1)**:
- [ ] Document badge calculation logic (1.25h)
- [ ] Refactor NOT EXISTS vs LEFT JOIN (0.5h)
- [ ] Fix timestamp/date handling inconsistency (0.5h)

**Optimization (Week 2)**:
- [ ] Query performance improvements (1.5h)
- [ ] Complex calculation refactoring (2h)

---

### 🟡 MID-002: Progress Fetcher Documentation & Validation
- **Severity**: MEDIUM (Code Quality)
- **Effort**: 6 hours total (phased)
- **Impact**: 5/10
- **Priority Score**: 5 × 5 = 25
- **Status**: Not started
- **Document**: [backend_progress_fetcher.md](backend_progress_fetcher.md)

**Quick wins (Immediate)**:
- [ ] Add documentation for type casting (1.5h)
- [ ] Document XP formula verification (0.5h)
- [ ] Add error context to exceptions (1h)

**Validation (Week 1-2)**:
- [ ] Safe refactoring of default handling (2.5h)
- [ ] Precision review for float calculations (1h)

---

### 🟡 MID-003: Sync Polls Refactoring
- **Severity**: MEDIUM (Maintainability)
- **Effort**: 12 hours total (phased over weeks)
- **Impact**: 5/10
- **Priority Score**: 5 × 5 = 25
- **Status**: Not started
- **Document**: [backend_sync_polls.md](backend_sync_polls.md)

**Phase 1 - Quick Wins (2h)**:
- [ ] Fix redundant TOS check location
- [ ] Fix date formatting inconsistency
- [ ] Reduce verbose error handling

**Phase 2 - Code Extraction (3.5h)**:
- [ ] Extract common response building
- [ ] Extract status check patterns

**Phase 3 - Major Refactoring (5.5h)**:
- [ ] Consolidate complex logic paths
- [ ] Fix ETag generation
- [ ] Response builder improvements

---

### 🟡 MID-004: Gamification Schemas Type Safety
- **Severity**: MEDIUM (Code Quality)
- **Effort**: 3.25 hours
- **Impact**: 5/10
- **Priority Score**: 5 × 5 = 25
- **Status**: Not started
- **Document**: [backend_gamification_schemas.md](backend_gamification_schemas.md)

**Tasks**:
- [ ] Create enums for magic strings (achievement triggers, reward types) - 1h
- [ ] Implement structured achievement trigger system - 0.75h
- [ ] Fix type issues in badge definitions - 0.5h
- [ ] Standardize response types - 0.25h
- [ ] Comprehensive documentation - 0.75h

---

### 🟡 MID-005: Frontend Styling Consolidation
- **Severity**: MEDIUM (Code Quality)
- **Effort**: 1.5-2 hours
- **Impact**: 4/10
- **Priority Score**: 5 × 4 = 20
- **Status**: Not started

**Tasks**:
- [ ] Extract duplicate CSS utilities
- [ ] Create reusable utility classes
- [ ] Consolidate media queries
- [ ] Create utility documentation

---

## LOW PRIORITY TASKS (Month 2+ - ~4+ hours)

### 🟢 LOW-001: Documentation & Code Comments
- **Severity**: LOW (Documentation)
- **Effort**: 3-4 hours
- **Impact**: 3/10
- **Priority Score**: 3 × 3 = 9
- **Status**: Not started

**Tasks**:
- [ ] Add architecture documentation (ARCHITECTURE.md) - 1h
- [ ] Add component guides for complex components - 1h
- [ ] Add database schema documentation - 1h
- [ ] Add API endpoint documentation - 1h

---

### 🟢 LOW-002: Code Style & Formatting
- **Severity**: LOW (Polish)
- **Effort**: 2-3 hours
- **Impact**: 3/10
- **Priority Score**: 3 × 3 = 9
- **Status**: Not started

**Tasks**:
- [ ] Audit naming conventions (Provider vs Initializer)
- [ ] Standardize component file naming
- [ ] Update rustfmt rules
- [ ] Apply formatting to all files

---

### 🟢 LOW-003: Component Size Optimization
- **Severity**: LOW (Maintainability)
- **Effort**: 2-3 hours
- **Impact**: 3/10
- **Priority Score**: 3 × 3 = 9
- **Status**: Not started

**Tasks**:
- [ ] Break down >400 line components
- [ ] Extract hooks from large components
- [ ] Improve code organization

---

## QUICK WINS (Can be done immediately - <1 hour each)

| Task | Effort | Impact | Component | Link |
|------|--------|--------|-----------|------|
| OAuth redirect validation | 0.2h | 7/10 | Security | [backend_security_patterns.md](backend_security_patterns.md) |
| Configuration validation | 0.25h | 8/10 | Configuration | [backend_configuration_patterns.md](backend_configuration_patterns.md) |
| Security headers middleware | 0.2h | 8/10 | Security | [backend_security_patterns.md](backend_security_patterns.md) |
| Vault state security fix | 1h | 7/10 | Data | [backend_vault_state.md](backend_vault_state.md) |
| Components README | 0.2h | 6/10 | Frontend | [frontend_component_organization.md](frontend_component_organization.md) |
| Error type constants | 0.5h | 6/10 | Error Handling | [backend_error_handling.md](backend_error_handling.md) |
| Fix secret logging | 0.25h | 6/10 | Configuration | [backend_configuration_patterns.md](backend_configuration_patterns.md) |
| Improve OAuth error messages | 0.25h | 5/10 | Security | [backend_security_patterns.md](backend_security_patterns.md) |
| Session activity tracking | 0.3h | 7/10 | Security | [backend_security_patterns.md](backend_security_patterns.md) |

**Total**: ~3 hours for all quick wins

---

## TASK DEPENDENCY GRAPH

```
CRITICAL (Week 1):
├─ SEC-001: OAuth Validation → impacts all auth flows
├─ SEC-002: Coin Race Condition → independent
├─ SEC-003: XP Overflow → independent
├─ SEC-004: Config Validation → must complete before deployment
└─ SEC-005: Security Headers → independent

HIGH BACKEND (Week 2-3):
├─ BACK-001: Vault Security → independent
├─ BACK-002: Quests format! → independent (affects queries)
├─ BACK-003: Habits extraction → improves maintainability
├─ BACK-004: Focus pause/resume → business logic
├─ BACK-005: Model macros → ongoing, can happen anytime
├─ BACK-006: Test fixtures → improves velocity for future work
├─ BACK-007: Imports → organizational, can happen anytime
├─ BACK-008: Logging → improves debugging (optional timeline)
├─ BACK-009: Achievement unlock → business logic
├─ BACK-010: Error handling → improves consistency
├─ BACK-011: Response wrappers → ongoing migration
└─ BACK-012: Auth middleware → improves maintainability

HIGH FRONTEND (Week 2-3):
├─ FRONT-001: Components org → enables easier work
├─ FRONT-002: State management → ongoing
├─ FRONT-003: API client → improves consistency
├─ FRONT-004: Styling patterns → improves UX
├─ FRONT-005: Forms → improves developer experience
└─ FRONT-006: Routing → improves security
```

---

## EFFORT BREAKDOWN BY TIMELINE

### WEEK 1: Critical Security Issues (2 hours)
- SEC-001: OAuth Validation (0.2h)
- SEC-002: Coin Race Condition (1.5h)
- SEC-003: XP Overflow (1.5h)
- SEC-004: Config Validation (0.25h)
- SEC-005: Security Headers (0.2h)
- SEC-006: Session Activity Tracking (0.3h)

**Total**: ~4 hours (compress to 2h by prioritizing)

### WEEKS 2-3: High Priority Backend (8 hours)
- BACK-001 to BACK-012 (various efforts)

### WEEKS 2-3: High Priority Frontend (8 hours)
- FRONT-001 to FRONT-006 (various efforts)

### MONTH 1: Medium Priority Tasks (8 hours)
- MID-001 to MID-005

### MONTH 2+: Low Priority & Ongoing (4+ hours)
- LOW-001 to LOW-003 + ongoing migrations

---

## SUCCESS METRICS

### Week 1
- [ ] All CRITICAL security issues fixed
- [ ] 0 open security vulnerabilities
- [ ] Configuration validation catches errors at startup
- [ ] Security headers present in all responses

### Month 1
- [ ] 70% of HIGH priority issues resolved
- [ ] State management patterns standardized
- [ ] API client centralized
- [ ] Error handling consistent

### Month 2
- [ ] 95% of identified issues resolved
- [ ] Architecture documentation complete
- [ ] Codebase consistency achieved
- [ ] Maintenance burden reduced by 30%

---

## RECONCILIATION REFERENCE

Each task links to original analysis document with:
- Detailed issue explanation with code examples
- Root cause analysis
- Solution code snippets
- Implementation roadmap
- Validation checklist

Use document links to understand context while implementing.

**Format for referencing during implementation**:
```
See [document_name.md](path) Section "ISSUE-NAME"
```

---

## TRACKING INSTRUCTIONS

**For Team Members**:
1. Pick a task from this list
2. Read the linked analysis document (understand the issue)
3. Follow the implementation roadmap
4. Check off tasks as completed
5. Run validation checklist before submitting PR
6. Reference task ID (e.g., SEC-001) in commit message

**For Project Manager**:
1. Assign tasks based on effort and priority
2. Track progress using checkboxes
3. Update PROGRESS.md weekly
4. Report blockers (dependencies, tech debt)

**For Code Review**:
1. Verify validation checklist passed
2. Check effort estimate accuracy
3. Ensure linked documentation matches implementation
4. Reference analysis document in review comments

---

**Document Version**: 1.0  
**Last Updated**: January 15, 2026  
**Next Review**: After completing Week 1 security tasks
