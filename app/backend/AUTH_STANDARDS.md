# AUTHENTICATION MIDDLEWARE STANDARDS

**Version**: 1.0  
**Last Updated**: January 15, 2026  
**Status**: Active Standard  
**Authority**: Backend Authentication Layer  

---

## OVERVIEW

This document defines authentication and authorization patterns for the Passion OS backend. All authentication logic follows these standards to ensure consistency, security, and maintainability.

---

## AUTHENTICATION FLOW

### Session Validation Pipeline

```
1. Extract Session Token from Cookies
   ↓
2. Lookup Session in Database (SessionRepo)
   ↓
3. Validate Session (not expired, active)
   ↓
4. Fetch User Record (UserRepo)
   ↓
5. Check User Status (approved, TOS accepted)
   ↓
6. Load User Entitlements (RbacRepo)
   ↓
7. Create AuthContext and Insert into Request Extensions
   ↓
8. Update Session Activity (fire-and-forget with logging)
```

---

## AUTH CONTEXT

### AuthContext Structure

```rust
#[derive(Debug, Clone)]
pub struct AuthContext {
    pub user_id: Uuid,                    // User ID
    pub email: String,                    // User email
    pub name: String,                     // User display name
    pub role: String,                     // Role (admin, user, etc.)
    pub session_id: Uuid,                 // Session ID
    pub entitlements: Vec<String>,        // RBAC entitlements
    pub is_dev_bypass: bool,              // Dev environment bypass flag
}
```

### Creating AuthContext from Token

Use the `AuthContext::from_token()` helper for consistent session loading:

```rust
// In middleware:
match AuthContext::from_token(&state.db, &token).await {
    Ok(auth_context) => {
        // Update activity asynchronously with logging
        let db = state.db.clone();
        let sid = auth_context.session_id;
        let uid = auth_context.user_id;
        tokio::spawn(async move {
            if let Err(e) = SessionRepo::touch(&db, sid).await {
                tracing::warn!(
                    session_id = %sid,
                    error = %e,
                    "Failed to update session activity"
                );
            }
            if let Err(e) = UserRepo::update_last_activity(&db, uid).await {
                tracing::warn!(
                    user_id = %uid,
                    error = %e,
                    "Failed to update user activity"
                );
            }
        });
        
        req.extensions_mut().insert(auth_context);
    }
    Err(e) => {
        tracing::error!(error = %e, "Failed to create auth context from token");
        return Err(e);
    }
}
```

### AuthContext Helper Methods

```rust
impl AuthContext {
    /// Check if user has admin role
    pub fn is_admin(&self) -> bool {
        self.role == "admin" || self.entitlements.contains(&"admin:access".to_string())
    }

    /// Check if user has specific entitlement
    pub fn has_entitlement(&self, entitlement: &str) -> bool {
        self.entitlements.contains(&entitlement.to_string())
    }

    /// Check if this is a development bypass session
    pub fn is_dev_session(&self) -> bool {
        self.is_dev_bypass
    }

    /// Load AuthContext from database using session token
    pub async fn from_token(
        db: &PgPool,
        token: &str,
    ) -> Result<Self, AppError> {
        // Look up session
        let session = SessionRepo::find_by_token(db, token)
            .await?
            .ok_or_else(|| AppError::unauthorized("Session not found"))?;

        // Check session expiration
        if session.is_expired() {
            return Err(AppError::unauthorized("Session expired"));
        }

        // Fetch user
        let user = UserRepo::find_by_id(db, session.user_id)
            .await?
            .ok_or_else(|| AppError::unauthorized("User not found"))?;

        // Load entitlements
        let entitlements = RbacRepo::get_entitlements(db, user.id).await?;

        Ok(AuthContext {
            user_id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            session_id: session.id,
            entitlements,
            is_dev_bypass: false,
        })
    }
}
```

---

## MIDDLEWARE PATTERNS

### extract_session (Optional Authentication)

Extract session if present, but don't require it. Handler can check for AuthContext:

```rust
pub async fn extract_session(
    State(state): State<Arc<AppState>>,
    mut req: Request,
    next: Next,
) -> Result<Response, AppError> {
    // Check dev bypass first
    if DevBypassAuth::is_allowed(&state.config.server.environment, host.as_deref()) {
        req.extensions_mut().insert(create_dev_context());
        return Ok(next.run(req).await);
    }

    // Try to extract session
    if let Some(token) = extract_session_token(&req) {
        if let Ok(auth_context) = AuthContext::from_token(&state.db, &token).await {
            // Update activity with error logging
            log_activity_update(&state.db, auth_context.session_id, auth_context.user_id);
            req.extensions_mut().insert(auth_context);
        }
    }

    Ok(next.run(req).await)
}
```

### require_auth (Required Authentication)

Require AuthContext to be present and user to be approved:

```rust
pub async fn require_auth(
    State(state): State<Arc<AppState>>,
    mut req: Request,
    next: Next,
) -> Result<Response, AppError> {
    // Get auth context (inserted by extract_session)
    let auth_context = req
        .extensions()
        .get::<AuthContext>()
        .cloned()
        .ok_or_else(|| AppError::unauthorized("Authentication required"))?;

    // Verify user still exists and is approved
    let user = UserRepo::find_by_id(&state.db, auth_context.user_id)
        .await?
        .ok_or_else(|| AppError::unauthorized("User not found"))?;

    if !user.approved {
        return Err(AppError::bad_request("User account not approved"));
    }

    if !user.tos_accepted {
        return Err(AppError::bad_request("Terms of service acceptance required"));
    }

    req.extensions_mut().insert(user);
    Ok(next.run(req).await)
}
```

### require_admin (Admin Authorization)

Require admin role or admin:access entitlement:

```rust
pub async fn require_admin(req: Request, next: Next) -> Result<Response, AppError> {
    let auth = req
        .extensions()
        .get::<AuthContext>()
        .ok_or_else(|| AppError::unauthorized("Authentication required"))?;

    if !auth.is_admin() {
        return Err(AppError::forbidden());
    }

    Ok(next.run(req).await)
}
```

### require_entitlement (Permission-Based Authorization)

Require specific entitlement:

```rust
pub fn require_entitlement(
    entitlement: &'static str,
) -> impl Fn(Request, Next) -> BoxFuture<'static, Result<Response, AppError>> {
    move |req, next| {
        Box::pin(async move {
            let auth = req
                .extensions()
                .get::<AuthContext>()
                .ok_or_else(|| AppError::unauthorized("Authentication required"))?;

            if !auth.has_entitlement(entitlement) {
                tracing::warn!(
                    user_id = %auth.user_id,
                    required_entitlement = entitlement,
                    "User lacks required entitlement"
                );
                return Err(AppError::forbidden());
            }

            Ok(next.run(req).await)
        })
    }
}
```

---

## SESSION ACTIVITY TRACKING

### Fire-and-Forget Activity Updates

Session activity updates should not block request/response. Use async spawning with error logging:

```rust
/// Log activity updates asynchronously without blocking
fn log_activity_update(db: &Arc<PgPool>, session_id: Uuid, user_id: Uuid) {
    let db = db.clone();
    tokio::spawn(async move {
        // Update session activity
        if let Err(e) = SessionRepo::touch(&db, session_id).await {
            tracing::warn!(
                session_id = %session_id,
                error = %e,
                "Failed to update session activity"
            );
        }

        // Update user activity
        if let Err(e) = UserRepo::update_last_activity(&db, user_id).await {
            tracing::warn!(
                user_id = %user_id,
                error = %e,
                "Failed to update user last_activity"
            );
        }
    });
}
```

**Key Points**:
- ✅ Use `tokio::spawn()` for async fire-and-forget
- ✅ Log errors to observe failures
- ✅ Don't use `let _ = ...` (hides errors)
- ✅ Use WARNING level (activity is non-critical)
- ✅ Include structured fields (session_id, user_id, error)

---

## COMMON PATTERNS

### Pattern 1: Extract and Validate Session

```rust
// Always use AuthContext::from_token for consistency
if let Some(token) = extract_session_token(&req) {
    match AuthContext::from_token(&state.db, &token).await {
        Ok(auth_context) => {
            log_activity_update(&state.db, auth_context.session_id, auth_context.user_id);
            req.extensions_mut().insert(auth_context);
        }
        Err(e) => {
            tracing::error!(error = %e, "Authentication failed");
            return Err(e);
        }
    }
}
```

### Pattern 2: Require Authentication

```rust
// Use require_auth middleware in router
Router::new()
    .route("/user", get(get_user))
    .route_layer(axum::middleware::from_fn_with_state(
        state,
        require_auth,
    ))
```

### Pattern 3: Require Admin

```rust
// Use require_admin middleware
Router::new()
    .route("/admin/users", get(list_users))
    .route_layer(axum::middleware::from_fn(require_admin))
```

### Pattern 4: Require Specific Entitlement

```rust
// Use require_entitlement middleware factory
Router::new()
    .route("/api/beta", get(beta_feature))
    .route_layer(axum::middleware::from_fn(
        require_entitlement("feature:beta")
    ))
```

---

## ERROR HANDLING

### Authentication Error Mapping

| Condition | Error Type | Message | Status |
|-----------|-----------|---------|--------|
| No session token | Unauthorized | "Authentication required" | 401 |
| Session not found | Unauthorized | "Session not found" | 401 |
| Session expired | Unauthorized | "Session expired" | 401 |
| User not found | Unauthorized | "User not found" | 401 |
| User not approved | BadRequest | "User account not approved" | 400 |
| TOS not accepted | BadRequest | "Terms of service acceptance required" | 400 |
| Not admin | Forbidden | (no message) | 403 |
| Entitlement missing | Forbidden | (no message) | 403 |

### Implementation

```rust
// Use AppError constructors
AppError::unauthorized("Session expired")
AppError::bad_request("User account not approved")
AppError::forbidden()
```

---

## DEVELOPMENT BYPASS

### Dev Environment Sessions

In development, bypass authentication for testing:

```rust
// Check dev bypass first in extract_session
if DevBypassAuth::is_allowed(&state.config.server.environment, host.as_deref()) {
    let (user_id, email, name, role) = DevBypassAuth::get_dev_user();
    let auth_context = AuthContext {
        user_id,
        email,
        name,
        role,
        session_id: Uuid::nil(),
        entitlements: vec!["admin:access".to_string()],
        is_dev_bypass: true,
    };
    req.extensions_mut().insert(auth_context);
    return Ok(next.run(req).await);
}
```

**Usage**: Set `DEV_BYPASS_AUTH=true` environment variable in development.

---

## CODE REVIEW CHECKLIST

When reviewing authentication code:

- [ ] **AuthContext Creation**: Uses `AuthContext::from_token()` helper, not manual construction
- [ ] **Error Logging**: Errors logged with structured fields (user_id, session_id, error)
- [ ] **Activity Updates**: Uses async spawn with error logging, not fire-and-forget
- [ ] **Error Messages**: Uses appropriate error types (Unauthorized vs BadRequest vs Forbidden)
- [ ] **Authorization**: Uses `is_admin()` or `has_entitlement()` helpers
- [ ] **Middleware Layering**: Correct order (extract_session → require_auth/require_admin)
- [ ] **Dev Bypass**: Checked only in development environments
- [ ] **Testing**: Auth flows tested with valid/invalid/expired tokens

---

## FREQUENTLY ASKED QUESTIONS

**Q: Should I check AuthContext in a handler or middleware?**  
A: Middleware for enforcing auth requirements. Handlers can access it from request extensions.

**Q: How do I get the current user in a handler?**  
A: Use `Extension(user): Extension<User>` (injected by require_auth middleware).

**Q: Should I await activity update?**  
A: No. Use tokio::spawn() for fire-and-forget with error logging.

**Q: How do I check permissions in a handler?**  
A: Use `Extension(auth): Extension<AuthContext>` and call `auth.is_admin()` or `auth.has_entitlement()`.

**Q: Can I create AuthContext manually?**  
A: No. Always use `AuthContext::from_token()` to ensure consistent loading.

---

## RELATED DOCUMENTATION

- [ERROR_HANDLING_STANDARDS.md](ERROR_HANDLING_STANDARDS.md) - Error type constants and constructors
- [RESPONSE_STANDARDS.md](RESPONSE_STANDARDS.md) - API response patterns
- `crate::middleware::auth` - Middleware implementation
- `crate::db::repos` - Repository layer for session/user lookups
