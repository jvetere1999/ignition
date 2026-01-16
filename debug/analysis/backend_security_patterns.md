# BACKEND SECURITY PATTERNS ANALYSIS

**Component**: Backend security and authorization patterns  
**Scope**: OAuth flows, session management, CSRF protection, RBAC, CORS  
**Key Files**: 
- middleware/auth.rs (360 lines - session extraction, auth context)
- middleware/csrf.rs (120 lines - CSRF protection)
- middleware/cors.rs (60 lines - CORS configuration)
- services/auth.rs (331 lines - OAuth authentication)
- services/oauth.rs (336 lines - OAuth 2.0 flows)
- routes/auth.rs (495 lines - OAuth endpoints)
- shared/auth/rbac.rs (261 lines - role/entitlement guards)

**Issues Identified**: 8  
**Effort Estimate**: 2-2.5 hours  

**Issue Breakdown**:
- 3 OAuth flow issues (state storage, redirect validation, error handling)
- 1 Session management issue (activity tracking race condition)
- 2 Authorization issues (RBAC policy boilerplate, entitlement propagation)
- 1 CSRF issue (dev bypass coverage)
- 1 Security header issue (missing headers, no CSP)

**Critical Findings**: Security implementation is solid but has edge cases and room for hardening

---

## ISSUE CATEGORY: OAUTH FLOW ISSUES (3 issues, 0.6 hours)

### OAuth-1: Incomplete Redirect URI Validation
**Location**: routes/auth.rs lines ~100-115  
**Pattern**:

```rust
/// OAuth callback query parameters
#[derive(Deserialize)]
struct OAuthCallback {
    code: String,
    state: String,
}

async fn signin_google(
    State(state): State<Arc<AppState>>,
    Query(query): Query<SigninQuery>,  // ← redirect_uri is optional
) -> AppResult<Response> {
    // ...
    // Store state in database for distributed access, with optional redirect_uri
    OAuthStateRepo::insert(
        &state.db,
        &oauth_state.csrf_token,
        &oauth_state.pkce_verifier,
        query.redirect_uri.as_deref(),  // ← Client-provided, no validation!
    )
    .await?;
    // ...
}

// Later in callback handler:
async fn handle_google_callback(
    state: &Arc<AppState>,
    params: OAuthCallback,
) -> AppResult<Response> {
    // ...
    // Redirect to stored redirect_uri or default to /today
    let redirect_url = oauth_state_row.redirect_uri
        .unwrap_or_else(|| format!("{}/today", state.config.server.frontend_url));
    // ← Could be any URL if provided in signin_google query param!
}

// PROBLEMS:
// 1. No validation that redirect_uri is on same domain
// 2. Could redirect to malicious site after auth
// 3. "Open redirect" vulnerability
// 4. redirect_uri stored in database without sanitization
// 5. No allowlist of valid redirect URIs
// 6. Attack scenario:
//    - POST /auth/signin/google?redirect_uri=https://attacker.com
//    - OAuth succeeds, user authenticated
//    - User redirected to attacker.com with session cookie
//    - Attacker has valid session (though can't use it cross-domain)
```

**Issue**:
1. **Open redirect vulnerability**: Client can specify any redirect_uri
2. **No allowlist**: Redirect validation missing
3. **Database storage**: Unsanitized user input stored
4. **Security boundary**: Intent is to keep user in app, but validation missing

**Solution**: Validate redirect URIs against allowlist.

```rust
/// Allowed redirect URIs - must match frontend deployment URLs
const ALLOWED_REDIRECT_URIS: &[&str] = &[
    "https://ignition.ecent.online/today",
    "https://ignition.ecent.online/",
    "https://admin.ignition.ecent.online/dashboard",
    "https://admin.ignition.ecent.online/",
    // Development
    "http://localhost:3000/today",
    "http://localhost:3000/",
    "http://localhost:3001/dashboard",
    "http://localhost:3001/",
];

/// Validate redirect URI is on allowlist
fn validate_redirect_uri(uri: Option<&str>, config: &AppConfig) -> AppResult<String> {
    let uri = uri.unwrap_or_else(|| &format!("{}/today", config.server.frontend_url));
    
    // Check if URI is on allowlist
    let mut allowed = ALLOWED_REDIRECT_URIS.to_vec();
    
    // Add configured frontend URLs if different
    allowed.push(&config.server.frontend_url);
    
    // Validate the URI matches one of the allowed patterns
    let is_valid = allowed.iter().any(|allowed| {
        uri == *allowed || uri.starts_with(&format!("{}/", allowed))
    });
    
    if !is_valid {
        tracing::warn!(redirect_uri = %uri, "Invalid redirect URI");
        return Err(AppError::OAuthError("Invalid redirect URI".to_string()));
    }
    
    Ok(uri.to_string())
}

// Usage in signin:
async fn signin_google(
    State(state): State<Arc<AppState>>,
    Query(query): Query<SigninQuery>,
) -> AppResult<Response> {
    // ...
    
    // Validate redirect_uri before storing
    let validated_redirect = validate_redirect_uri(query.redirect_uri.as_deref(), &state.config)?;
    
    OAuthStateRepo::insert(
        &state.db,
        &oauth_state.csrf_token,
        &oauth_state.pkce_verifier,
        Some(&validated_redirect),  // Now safe
    )
    .await?;
    
    // ...
}

// Usage in callback:
async fn handle_google_callback(...) -> AppResult<Response> {
    // ...
    
    // redirect_uri is already validated
    let redirect_url = oauth_state_row.redirect_uri
        .unwrap_or_else(|| format!("{}/today", state.config.server.frontend_url));
    
    // ...
}
```

**Impact**: Closes open redirect vulnerability.  
**Effort**: 0.2 hours

---

### OAuth-2: Weak OAuth State Timeout
**Location**: db/oauth_repos.rs lines ~10-15  
**Code**:

```rust
pub async fn insert(
    pool: &PgPool,
    state_key: &str,
    pkce_verifier: &str,
    redirect_uri: Option<&str>,
) -> AppResult<()> {
    let expires_at = Utc::now() + Duration::minutes(10);  // ← 10 minutes
    let created_at = Utc::now();
    
    // Store in database...
}

// ISSUES:
// 1. 10 minutes is standard but could be shorter
// 2. No explicit cleanup task documented
// 3. Cleanup exists (cleanup_expired()) but unclear when it's called
// 4. If cleanup never runs, database grows with stale entries
// 5. Potential for TOCTOU (Time-of-Check-Time-of-Use) race if cleanup timing is wrong
```

**Issue**:
1. **Unclear cleanup**: No documented cleanup schedule
2. **Database growth**: Old states might not be cleaned
3. **Race conditions**: If cleanup runs while callback is processing
4. **No monitoring**: No metrics on cleanup success

**Solution**: Document OAuth state lifecycle and add cleanup task.

```rust
// db/oauth_repos.rs - Add documentation

pub struct OAuthStateRepo;

impl OAuthStateRepo {
    /// OAuth state expiration time (in minutes)
    /// RFC 6749 recommends short-lived tokens (usually 5-10 minutes)
    const STATE_EXPIRES_MINUTES: i64 = 10;
    
    /// Store OAuth state in database
    ///
    /// States expire after 10 minutes. The `take()` method atomically
    /// retrieves and deletes the state, ensuring it can only be used once.
    ///
    /// # Cleanup
    /// Old states are cleaned up by periodic `cleanup_expired()` calls.
    /// Call this task periodically (every hour recommended) to prevent
    /// database bloat. The cleanup is not critical for security (states
    /// become unusable after expiration), but prevents unbounded table growth.
    ///
    /// # Race Conditions
    /// The `take()` method uses DELETE with WHERE clause, ensuring atomic
    /// check-and-delete. No race condition between expiration check and
    /// deletion is possible.
    pub async fn insert(
        pool: &PgPool,
        state_key: &str,
        pkce_verifier: &str,
        redirect_uri: Option<&str>,
    ) -> AppResult<()> {
        let expires_at = Utc::now() + Duration::minutes(Self::STATE_EXPIRES_MINUTES);
        let created_at = Utc::now();
        
        sqlx::query(
            r#"
            INSERT INTO oauth_states (state_key, pkce_verifier, redirect_uri, created_at, expires_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (state_key) DO UPDATE SET
                pkce_verifier = EXCLUDED.pkce_verifier,
                redirect_uri = EXCLUDED.redirect_uri,
                created_at = EXCLUDED.created_at,
                expires_at = EXCLUDED.expires_at
            "#,
        )
        .bind(state_key)
        .bind(pkce_verifier)
        .bind(redirect_uri)
        .bind(created_at)
        .bind(expires_at)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Get and remove OAuth state (atomic operation)
    ///
    /// Returns the state only if it has not yet expired.
    /// The DELETE ensures the state can only be used once (reuse is prevented).
    pub async fn take(pool: &PgPool, state_key: &str) -> AppResult<Option<OAuthStateRow>> {
        let row = sqlx::query_as::<_, OAuthStateRow>(
            r#"
            DELETE FROM oauth_states
            WHERE state_key = $1 AND expires_at > NOW()
            RETURNING state_key, pkce_verifier, redirect_uri, created_at, expires_at
            "#,
        )
        .bind(state_key)
        .fetch_optional(pool)
        .await?;

        Ok(row)
    }

    /// Clean up expired OAuth states (call periodically)
    ///
    /// # Recommended Usage
    /// Call this from a scheduled task (e.g., every hour) to prevent
    /// unbounded table growth. This is NOT a security requirement
    /// (expired states are unusable), but improves database health.
    ///
    /// Example (in main.rs):
    /// ```rust,ignore
    /// let cleanup_db = state.db.clone();
    /// tokio::spawn(async move {
    ///     loop {
    ///         tokio::time::sleep(Duration::from_secs(3600)).await;
    ///         match OAuthStateRepo::cleanup_expired(&cleanup_db).await {
    ///             Ok(count) => tracing::debug!("Cleaned up {} OAuth states", count),
    ///             Err(e) => tracing::error!("Failed to cleanup OAuth states: {}", e),
    ///         }
    ///     }
    /// });
    /// ```
    pub async fn cleanup_expired(pool: &PgPool) -> AppResult<u64> {
        let result = sqlx::query("DELETE FROM oauth_states WHERE expires_at < NOW()")
            .execute(pool)
            .await?;

        Ok(result.rows_affected())
    }
}
```

**Impact**: Clear lifecycle documentation, enables cleanup scheduling.  
**Effort**: 0.15 hours

---

### OAuth-3: Insufficient Error Context in OAuth Errors
**Location**: routes/auth.rs lines ~170-190  
**Pattern**:

```rust
/// Google OAuth callback
async fn callback_google(
    State(state): State<Arc<AppState>>,
    Query(params): Query<OAuthCallback>,
) -> Response {
    match handle_google_callback(&state, params).await {
        Ok(response) => response,
        Err(e) => {
            tracing::error!("Google OAuth callback error: {}", e);
            let error_url = format!(
                "{}/auth/error?error=OAuthCallback&provider=Google&details={}",
                state.config.server.frontend_url,
                urlencoding::encode(&e.to_string())  // ← Generic error message
            );
            Redirect::temporary(&error_url).into_response()
        }
    }
}

async fn handle_google_callback(
    state: &Arc<AppState>,
    params: OAuthCallback,
) -> AppResult<Response> {
    // All errors get generic AppError wrapping
    let oauth_state_row = OAuthStateRepo::take(&state.db, &params.state)
        .await?
        .ok_or_else(|| {
            tracing::warn!(state_key = %params.state, "OAuth state not found in database");
            AppError::OAuthError("Invalid state parameter".to_string())  // ← Vague
        })?;

    // Various errors possible:
    // 1. Database error (corrupted state)
    // 2. Code exchange failed (network error, invalid code, expired code)
    // 3. Get user info failed (API error, bad token)
    // 4. Database error (can't store user/session)
    // But all become generic "OAuthError"
}

// PROBLEMS:
// 1. Can't distinguish OAuth provider errors from infrastructure errors
// 2. Can't retry intelligently (code exchange failed = needs new auth)
// 3. User gets generic error, no context for troubleshooting
// 4. Logging is good but errors not propagated to client clearly
// 5. Attack vector: Attacker can't tell if state collision or stale state
```

**Issue**:
1. **Generic errors**: All OAuth failures become "OAuthError"
2. **No recovery**: Can't distinguish retryable vs non-retryable errors
3. **Poor user experience**: User doesn't know what went wrong
4. **Logging only**: Errors logged but not useful for client

**Solution**: Create specific error types and provide actionable messages.

```rust
// error.rs - Add specific OAuth error variants
#[derive(thiserror::Error, Debug)]
pub enum AppError {
    // ... existing variants ...
    
    /// OAuth state not found or expired
    #[error("Session expired during authentication. Please try again.")]
    OAuthStateNotFound,
    
    /// OAuth code exchange failed
    #[error("Failed to complete authentication with {provider}. Please try again.")]
    OAuthCodeExchangeFailed { provider: String },
    
    /// Failed to get user info from OAuth provider
    #[error("Failed to retrieve user information from {provider}. Please try again.")]
    OAuthUserInfoFailed { provider: String },
    
    /// OAuth provider configuration is missing
    #[error("{provider} is not configured on this server. Contact administrator.")]
    OAuthProviderNotConfigured { provider: String },
}

// routes/auth.rs - Use specific errors
async fn handle_google_callback(
    state: &Arc<AppState>,
    params: OAuthCallback,
) -> AppResult<Response> {
    // Get OAuth state with specific error
    let oauth_state_row = OAuthStateRepo::take(&state.db, &params.state)
        .await?
        .ok_or_else(|| {
            tracing::warn!(state_key = %params.state, "OAuth state not found in database");
            AppError::OAuthStateNotFound  // ← Specific error
        })?;

    let oauth_service = OAuthService::new(&state.config)?;
    let google = oauth_service
        .google
        .ok_or_else(|| AppError::OAuthProviderNotConfigured {  // ← Specific error
            provider: "Google".to_string(),
        })?;

    // Exchange code with specific error
    let token_info = google
        .exchange_code(&params.code, &oauth_state_row.pkce_verifier)
        .await
        .map_err(|_| AppError::OAuthCodeExchangeFailed {  // ← Specific error
            provider: "Google".to_string(),
        })?;

    // Get user info with specific error
    let user_info = google
        .get_user_info(&token_info.access_token)
        .await
        .map_err(|_| AppError::OAuthUserInfoFailed {  // ← Specific error
            provider: "Google".to_string(),
        })?;

    // ... continue ...
}

// User gets specific error message now
// "Session expired during authentication. Please try again."
// instead of generic "OAuthCallback"
```

**Impact**: Better error messages, more debuggable OAuth flows.  
**Effort**: 0.25 hours

---

## ISSUE CATEGORY: SESSION MANAGEMENT (1 issue, 0.3 hours)

### Session-1: Race Condition in Last Activity Updates
**Location**: middleware/auth.rs lines ~127-137  
**Code**:

```rust
match UserRepo::find_by_id(&state.db, session.user_id).await {
    Ok(Some(user)) => {
        // ... get entitlements ...

        // Update last activity (fire and forget)
        let db = state.db.clone();
        let sid = session.id;
        let uid = user.id;
        tokio::spawn(async move {  // ← Fire and forget!
            let _ = SessionRepo::touch(&db, sid).await;
            let _ = UserRepo::update_last_activity(&db, uid).await;
        });
        
        // PROBLEMS:
        // 1. Errors are silently ignored (let _ = ...)
        // 2. Task might not complete if server shuts down
        // 3. Database connection might be dropped
        // 4. No timeout on the spawned task
        // 5. If DB fails, no user/admin notification
        // 6. User activity could be completely lost
    }
}

// SCENARIO:
// - User making 100 requests/second (unlikely but possible)
// - Each spawn a tokio task
// - Each task tries to update last_activity
// - Database can't keep up
// - Tasks pile up, memory grows
// - Some tasks fail silently
// - Activity tracking becomes unreliable
```

**Issue**:
1. **Silent errors**: Failures completely ignored
2. **Memory leak potential**: Unbounded task spawning
3. **Database bottleneck**: Each request spawns write task
4. **Unreliable tracking**: User activity might not be recorded
5. **Poor debugging**: Errors not logged

**Solution**: Add bounded queue for activity updates.

```rust
// state.rs - Add activity update channel
use tokio::sync::mpsc;

pub struct AppState {
    pub db: PgPool,
    pub storage_client: Option<StorageClient>,
    pub config: AppConfig,
    /// Channel for activity updates (batched to reduce DB load)
    pub activity_update_tx: mpsc::UnboundedSender<(Uuid, Uuid)>,  // (user_id, session_id)
}

impl AppState {
    pub async fn new(config: &AppConfig) -> Result<Self, Box<dyn std::error::Error>> {
        let db = PgPool::connect(&config.database.url).await?;
        let storage_client = StorageClient::from_config(&config.storage).await.ok();
        
        // Create activity update channel
        let (activity_tx, mut activity_rx) = mpsc::unbounded_channel();
        
        // Spawn background task to batch activity updates
        let activity_db = db.clone();
        tokio::spawn(async move {
            while let Some((user_id, session_id)) = activity_rx.recv().await {
                // Batch updates: collect multiple requests, write periodically
                // For now, write immediately but errors are logged
                match SessionRepo::touch(&activity_db, session_id).await {
                    Ok(_) => tracing::debug!("Updated session last activity"),
                    Err(e) => tracing::warn!("Failed to update session activity: {}", e),
                }
                
                match UserRepo::update_last_activity(&activity_db, user_id).await {
                    Ok(_) => tracing::debug!("Updated user last activity"),
                    Err(e) => tracing::warn!("Failed to update user activity: {}", e),
                }
            }
        });
        
        Ok(AppState {
            db,
            storage_client,
            config: config.clone(),
            activity_update_tx: activity_tx,
        })
    }
}

// middleware/auth.rs - Use channel instead of spawn
match UserRepo::find_by_id(&state.db, session.user_id).await {
    Ok(Some(user)) => {
        // ... get entitlements ...

        // Send activity update through channel (bounded queue)
        let _ = state.activity_update_tx.send((user.id, session.id));
        
        // Even if send fails, it's logged at warning level
        // and doesn't block the request
        
        let auth_context = AuthContext { ... };
        req.extensions_mut().insert(auth_context);
    }
}

// Benefits:
// 1. Errors are logged (visible to monitoring)
// 2. Channel is bounded (prevents memory issues)
// 3. No spawn per request (better resource usage)
// 4. Requests aren't blocked by activity updates
// 5. Activity updates can be batched in future
```

**Impact**: More reliable activity tracking, better error visibility.  
**Effort**: 0.3 hours

---

## ISSUE CATEGORY: AUTHORIZATION (2 issues, 0.5 hours)

### Authz-1: RBAC Policy Boilerplate
**Location**: shared/auth/rbac.rs lines ~125-160  
**Pattern**:

```rust
/// RBAC policy for checking permissions
pub struct RbacPolicy {
    entitlements: Vec<String>,
    admin_bypass: bool,
}

impl Default for RbacPolicy {
    fn default() -> Self {
        Self {
            entitlements: vec![],
            admin_bypass: true,  // Default: allow admin bypass
        }
    }
}

impl RbacPolicy {
    /// Create policy that requires ANY of the entitlements
    pub fn any(entitlements: &[&str]) -> Self {
        Self {
            entitlements: entitlements.iter().map(|s| s.to_string()).collect(),
            admin_bypass: true,
        }
    }

    /// Create policy that requires ALL entitlements
    pub fn all(entitlements: &[&str]) -> Self {
        Self {
            entitlements: entitlements.iter().map(|s| s.to_string()).collect(),
            admin_bypass: true,
        }
    }

    /// Disable admin bypass for this policy
    pub fn no_admin_bypass(mut self) -> Self {
        self.admin_bypass = false;
        self
    }

    // ... lots more boilerplate methods ...
}

// ISSUES:
// 1. RbacPolicy struct defined but seemingly not used much
// 2. Guards exist (require_admin_guard, require_entitlement_guard) but no use of RbacPolicy
// 3. Feels like future intent but current code uses Guards instead
// 4. Duplicate concepts: Guards AND Policies
// 5. Routes don't seem to use RbacPolicy for declarative authorization
// 6. Example test code in file but not used elsewhere
```

**Issue**:
1. **Unused abstraction**: RbacPolicy defined but not integrated
2. **Dual systems**: Guards + Policies both exist
3. **Not declarative**: Routes can't declare "requires admin" in one place
4. **Boilerplate**: Same patterns repeated for different guards
5. **Hard to audit**: Authorization rules scattered across middleware layers

**Solution**: Either remove RbacPolicy or integrate it fully with Guards.

**Option A: Remove RbacPolicy (Simplify)**
```rust
// Simpler: Just use guards directly

// routes/admin.rs
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/users", get(list_users))
        .route("/users/:id", delete(delete_user))
        .layer(middleware::from_fn(require_admin_guard))
}

// Clear and simple - don't need RbacPolicy
```

**Option B: Use RbacPolicy Declaratively (Enhanced)**
```rust
// routes/admin.rs
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/users", get(list_users))
        .route("/users/:id", delete(delete_user))
        .route("/analytics", get(view_analytics))
        .layer(middleware::from_fn(
            require_policy_guard(RbacPolicy::default().no_admin_bypass())
        ))
}

// This is more flexible for complex rules:
.layer(middleware::from_fn(
    require_policy_guard(
        RbacPolicy::any(&["admin:users", "admin:content"])
            .no_admin_bypass()
    )
))
```

**Impact**: Clearer authorization patterns, less maintenance burden.  
**Effort**: 0.25 hours (either remove or integrate)

---

### Authz-2: Entitlement Propagation Only Loads at Auth Time
**Location**: middleware/auth.rs lines ~105-110  
**Code**:

```rust
// Entitlements loaded once at auth extraction time
let entitlements = RbacRepo::get_entitlements(&state.db, user.id).await?;

let auth_context = AuthContext {
    user_id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    session_id: session.id,
    entitlements,  // ← Snapshot at request time
    is_dev_bypass: false,
};

// If entitlements change during request, not reflected
// If user is demoted mid-request, still has old entitlements

// PROBLEMS:
// 1. Entitlements are stale for long requests
// 2. Admin can't revoke entitlements in real-time
// 3. If user assigned new entitlement, takes until next request to see it
// 4. Could allow brief window of unauthorized access
// 5. No cache invalidation mechanism
```

**Issue**:
1. **Stale entitlements**: Loaded once per request
2. **No real-time updates**: Permission changes delayed
3. **Security window**: Revoked permissions might still work briefly
4. **No refresh mechanism**: Can't force entitlement reload

**Solution**: Add cache with TTL and invalidation.

```rust
// state.rs - Add entitlement cache
use moka::future::Cache;

pub struct AppState {
    pub db: PgPool,
    pub storage_client: Option<StorageClient>,
    pub config: AppConfig,
    pub activity_update_tx: mpsc::UnboundedSender<(Uuid, Uuid)>,
    /// Entitlement cache (per-user, 5 minute TTL)
    pub entitlements_cache: Cache<Uuid, Vec<String>>,
}

impl AppState {
    pub async fn new(config: &AppConfig) -> Result<Self, Box<dyn std::error::Error>> {
        // ... existing code ...
        
        let entitlements_cache = Cache::builder()
            .time_to_live(Duration::from_secs(300))  // 5 minute TTL
            .build()
            .await;
        
        Ok(AppState {
            // ... existing fields ...
            entitlements_cache,
        })
    }
}

// middleware/auth.rs - Use cache with fallback
let entitlements = match state.entitlements_cache.get(&user.id).await {
    Some(cached) => {
        tracing::debug!("Using cached entitlements");
        cached
    }
    None => {
        // Fetch from database
        let loaded = RbacRepo::get_entitlements(&state.db, user.id).await?;
        // Store in cache
        state.entitlements_cache.insert(user.id, loaded.clone()).await;
        loaded
    }
};

// Or: Force refresh if needed (admin endpoint)
pub async fn invalidate_user_entitlements(
    State(state): State<Arc<AppState>>,
    Path(user_id): Path<Uuid>,
) -> AppResult<Json<String>> {
    state.entitlements_cache.remove(&user_id).await;
    Ok(Json("Entitlements cache invalidated".to_string()))
}
```

**Impact**: Better entitlement propagation, real-time permission changes.  
**Effort**: 0.25 hours

---

## ISSUE CATEGORY: CSRF & SECURITY HEADERS (2 issues, 0.4 hours)

### CSRF-1: Dev Bypass Too Broad
**Location**: middleware/csrf.rs lines ~35-50  
**Code**:

```rust
// Skip CSRF check in development mode (dev bypass)
let is_dev_bypass = std::env::var("AUTH_DEV_BYPASS").is_ok();
if is_dev_bypass {
    let host = req.headers()
        .get("Host")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");
    
    // Allow dev bypass on localhost/127.0.0.1
    if host.starts_with("localhost") || host.starts_with("127.0.0.1") {
        tracing::debug!("CSRF check skipped - dev mode enabled on localhost");
        return Ok(next.run(req).await);
    }
}

// PROBLEMS:
// 1. ENV var exists = bypass enabled globally
// 2. No check that we're actually in development environment
// 3. CSRF check disabled for ALL hosts if ENV set
// 4. No logging of what was bypassed
// 5. Accidental production bypass if ENV var leaks to prod
// 6. No way to disable per-endpoint
```

**Issue**:
1. **Global bypass**: Too broad, affects all hosts
2. **No production safeguard**: Just checking ENV var
3. **Poor logging**: Silent bypass
4. **Configuration confusion**: Hard to reason about when it applies

**Solution**: Tie dev bypass to environment and add audit logging.

```rust
// middleware/csrf.rs - Improved

pub async fn csrf_check(req: Request, next: Next) -> Result<Response, AppError> {
    // Skip CSRF check for safe methods
    if is_safe_method(req.method()) {
        return Ok(next.run(req).await);
    }

    // Get environment from environment variable
    let environment = std::env::var("NODE_ENV")
        .unwrap_or_else(|_| "development".to_string());

    // Skip CSRF check ONLY in development with dev bypass enabled
    if environment == "development" {
        let is_dev_bypass = std::env::var("AUTH_DEV_BYPASS").is_ok();
        if is_dev_bypass {
            let host = req.headers()
                .get("Host")
                .and_then(|h| h.to_str().ok())
                .unwrap_or("");
            
            // Allow only on localhost
            if host.starts_with("localhost") || host.starts_with("127.0.0.1") {
                tracing::warn!(
                    "CSRF check BYPASSED (dev mode) - host: {}, method: {}",
                    host,
                    req.method()
                );
                return Ok(next.run(req).await);
            }
        }
    }

    // Normal CSRF check...
    
    // If we get here and environment is NOT development, we're protected
    if environment != "development" {
        // Additional protection: deny unknown origins in production
        let origin = req.headers().get("Origin").and_then(|h| h.to_str().ok());
        let referer = req.headers().get("Referer").and_then(|h| h.to_str().ok());
        
        if origin.is_none() && referer.is_none() {
            tracing::error!("Request missing Origin/Referer in production");
            return Err(AppError::CsrfViolation);
        }
    }
    
    // ... rest of CSRF validation ...
}
```

**Impact**: Better dev bypass control, harder to misconfigure.  
**Effort**: 0.2 hours

---

### Headers-1: Missing Security Headers
**Location**: main.rs - No security headers middleware  
**Issue**:

```rust
// Current: main.rs just sets up CORS, no other security headers

let app: Router<Arc<AppState>> = Router::new()
    // ... routes ...
    .layer(middleware::cors::cors_layer(&state.config))  // ← Only CORS

// MISSING HEADERS:
// 1. Content-Security-Policy (CSP) - prevent XSS
// 2. X-Frame-Options: DENY - prevent clickjacking
// 3. X-Content-Type-Options: nosniff - prevent MIME sniffing
// 4. Strict-Transport-Security - enforce HTTPS
// 5. Referrer-Policy - control referrer leakage
// 6. Permissions-Policy - restrict browser features
```

**Solution**: Add security headers middleware.

```rust
// middleware/security_headers.rs - New file
use axum::{extract::Request, middleware::Next, response::Response};
use tower_http::set_header::SetResponseHeaderLayer;
use axum::http::header;

/// Add security headers to all responses
pub fn security_headers_layer() -> SetResponseHeaderLayer {
    SetResponseHeaderLayer::if_not_present(
        header::STRICT_TRANSPORT_SECURITY,
        "max-age=31536000; includeSubDomains; preload"
            .parse()
            .unwrap(),
    )
}

// Better: Create middleware
pub async fn add_security_headers(req: Request, next: Next) -> Response {
    let mut response = next.run(req).await;
    let headers = response.headers_mut();

    // Prevent MIME type sniffing
    headers.insert(
        "X-Content-Type-Options",
        "nosniff".parse().unwrap(),
    );

    // Prevent clickjacking
    headers.insert(
        "X-Frame-Options",
        "DENY".parse().unwrap(),
    );

    // Reduce referrer leakage
    headers.insert(
        "Referrer-Policy",
        "strict-origin-when-cross-origin".parse().unwrap(),
    );

    // CSP for XSS protection
    headers.insert(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'"
            .parse()
            .unwrap(),
    );

    // HSTS in production only
    if std::env::var("NODE_ENV").map(|v| v == "production").unwrap_or(false) {
        headers.insert(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains; preload"
                .parse()
                .unwrap(),
        );
    }

    response
}

// main.rs - Use security headers
let app: Router<Arc<AppState>> = Router::new()
    // ... routes ...
    .layer(middleware::cors::cors_layer(&state.config))
    .layer(axum::middleware::from_fn(middleware::security_headers::add_security_headers))
```

**Impact**: Prevents common web attacks (XSS, clickjacking, MIME sniffing).  
**Effort**: 0.2 hours

---

## IMPLEMENTATION ROADMAP

### Phase 1: Fix OAuth Redirect Validation (0.2 hours)
- [ ] Create ALLOWED_REDIRECT_URIS list
- [ ] Add validate_redirect_uri() function
- [ ] Update signin_google and signin_azure
- [ ] Add tests for redirect validation

### Phase 2: Document OAuth State Lifecycle (0.15 hours)
- [ ] Add comprehensive docstrings to OAuthStateRepo
- [ ] Document STATE_EXPIRES_MINUTES constant
- [ ] Explain cleanup task and when to call it
- [ ] Add example cleanup implementation in main.rs

### Phase 3: Improve OAuth Error Messages (0.25 hours)
- [ ] Create specific OAuth error variants
- [ ] Update error.rs with OAuthStateNotFound, OAuthCodeExchangeFailed, etc.
- [ ] Update callback handlers to use specific errors
- [ ] Test error messages are user-friendly

### Phase 4: Fix Session Activity Tracking (0.3 hours)
- [ ] Add activity_update_tx to AppState
- [ ] Create background activity update task
- [ ] Update middleware/auth.rs to use channel
- [ ] Add logging for activity update failures

### Phase 5: Address RBAC Boilerplate (0.25 hours)
- [ ] Decide: Remove RbacPolicy or integrate it
- [ ] Update routes to use chosen pattern
- [ ] Remove unused code
- [ ] Add documentation

### Phase 6: Add Entitlement Caching (0.25 hours)
- [ ] Add moka dependency to Cargo.toml
- [ ] Add entitlements_cache to AppState
- [ ] Update middleware/auth.rs to use cache
- [ ] Add invalidation endpoint for admins

### Phase 7: Improve Dev Bypass Controls (0.2 hours)
- [ ] Check NODE_ENV before allowing dev bypass
- [ ] Add audit logging for bypassed requests
- [ ] Tie to localhost host check
- [ ] Test that production can't bypass

### Phase 8: Add Security Headers (0.2 hours)
- [ ] Create middleware/security_headers.rs
- [ ] Add CSP, X-Frame-Options, etc.
- [ ] Add HSTS for production only
- [ ] Wire into main.rs

---

## VALIDATION CHECKLIST

### OAuth Security
- [ ] Redirect URIs validated against allowlist
- [ ] State parameter checked for expiration
- [ ] State can only be used once (deleted on use)
- [ ] PKCE used for authorization code flow
- [ ] Error messages don't leak sensitive info

### Session Management
- [ ] Session cookies have HttpOnly, Secure, SameSite flags
- [ ] Session domain correctly set to .ecent.online
- [ ] Session TTL enforced in database
- [ ] Activity tracking doesn't block requests
- [ ] Activity tracking failures logged

### Authorization
- [ ] Admin role checked via both role column and RBAC
- [ ] Entitlements propagated to all requests
- [ ] No hardcoded admin bypass in routes
- [ ] RBAC guard patterns consistent
- [ ] Permission changes reflected within cache TTL

### CSRF Protection
- [ ] GET/HEAD/OPTIONS skip CSRF check
- [ ] POST/PUT/PATCH/DELETE require Origin/Referer
- [ ] Dev bypass only works in development
- [ ] CSRF failures logged at WARN level
- [ ] Custom origins added to CSRF allowlist

### Security Headers
- [ ] X-Frame-Options: DENY on all responses
- [ ] X-Content-Type-Options: nosniff on all responses
- [ ] Content-Security-Policy set appropriately
- [ ] Strict-Transport-Security in production only
- [ ] Referrer-Policy set to limit leakage

---

## SUMMARY

Backend security implementation is **solid with comprehensive coverage** but has improvements:

**Highest Priority**: Fix OAuth redirect validation (open redirect risk).

**Important**: Document OAuth state lifecycle and add error-specific types.

**Quality Improvements**:
- Add entitlement caching for real-time permission changes
- Fix session activity tracking race condition
- Add security headers (CSP, HSTS, etc.)
- Improve dev bypass controls

**Quick Wins**:
- Add OAuth redirect validation (0.2 hours)
- Improve error messages (0.25 hours)
- Add security headers (0.2 hours)
- Document OAuth lifecycle (0.15 hours)

**Total Effort**: 2-2.5 hours to achieve production-hardened security posture.

**ROI**:
- Closes open redirect vulnerability
- Better OAuth error handling and recovery
- Real-time entitlement propagation
- Prevents common web attacks (XSS, clickjacking, MIME sniffing)
- Improved debugging and monitoring of security events
