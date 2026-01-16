# BACKEND CONFIGURATION PATTERNS ANALYSIS

**Component**: Backend application configuration management  
**Scope**: Config structure, environment variables, defaults, loading logic  
**Key File**: config.rs (330 lines)  
**Representative**: Single config.rs file analyzed completely  

**Issues Identified**: 7  
**Effort Estimate**: 1.5-2 hours  

**Issue Breakdown**:
- 2 Configuration complexity issues (separator handling, manual overrides)
- 2 Validation issues (missing validation, empty value handling)
- 1 Documentation issue (env var mapping unclear)
- 1 Secret handling issue (logging sensitive values)
- 1 Error handling issue (graceful degradation)

**Critical Findings**: Configuration working but complex and fragile

---

## ISSUE CATEGORY: CONFIGURATION COMPLEXITY (2 issues, 0.5 hours)

### CFG-1: Complex Manual Override Pattern for Nested Fields
**Location**: config.rs lines ~235-310  
**Pattern**:

```rust
// The config crate's separator("_") splits ALL underscores, causing issues:
//
// Example: AUTH_OAUTH_GOOGLE_CLIENT_ID
// Desired path: auth.oauth.google.client_id
// Actual path from separator("_"): auth.oauth.google.client.id (WRONG!)
//
// Result: Manual override code needed

// Manual override for OAuth:
let google_client_id = std::env::var("AUTH_OAUTH_GOOGLE_CLIENT_ID").unwrap_or_default();
let google_client_secret = std::env::var("AUTH_OAUTH_GOOGLE_CLIENT_SECRET").unwrap_or_default();
let google_redirect_uri = std::env::var("AUTH_OAUTH_GOOGLE_REDIRECT_URI").unwrap_or_default();

if !google_client_id.is_empty() && !google_client_secret.is_empty() {
    tracing::info!("Loading Google OAuth from environment variables");
    let google_config = OAuthProviderConfig {
        client_id: google_client_id,
        client_secret: google_client_secret,
        redirect_uri: google_redirect_uri,
        tenant_id: None,
    };
    if app_config.auth.oauth.is_none() {
        app_config.auth.oauth = Some(OAuthConfig::default());
    }
    if let Some(ref mut oauth) = app_config.auth.oauth {
        oauth.google = Some(google_config);
    }
}

// Same pattern repeated for Azure, Storage...
// Total ~50+ lines of manual override code

// PROBLEMS:
// 1. Complex and repetitive
// 2. Easy to miss fields when updating
// 3. Documentation says "separator("_") splits ALL" but code doesn't follow that
// 4. Hard to understand why manual override is needed
// 5. Each provider needs custom handling
```

**Issue**:
1. `config` crate's separator behavior unclear and not configurable for nested fields
2. Manual override pattern repeated 3+ times (Google, Azure, Storage)
3. Code fragile: adding new field requires updating both struct and override logic
4. Comments explain the issue but don't solve it elegantly

**Solution**: Either use different separator strategy or create helper functions.

```rust
// Option A: Use custom separator for specific fields
// (Less complex but still some manual work)

impl AppConfig {
    pub fn load() -> anyhow::Result<Self> {
        // ... existing code ...
        
        // Use custom logic for complex nested fields
        Self::load_oauth_config(&mut app_config)?;
        Self::load_storage_config(&mut app_config)?;
        
        Ok(app_config)
    }
    
    /// Load OAuth configuration from environment variables
    fn load_oauth_config(config: &mut AppConfig) -> anyhow::Result<()> {
        let google_config = Self::load_oauth_provider("AUTH_OAUTH_GOOGLE_")?;
        let azure_config = Self::load_oauth_provider("AUTH_OAUTH_AZURE_")?;
        
        if google_config.is_some() || azure_config.is_some() {
            if config.auth.oauth.is_none() {
                config.auth.oauth = Some(OAuthConfig::default());
            }
            if let Some(ref mut oauth) = config.auth.oauth {
                oauth.google = google_config;
                oauth.azure = azure_config;
            }
        }
        
        Ok(())
    }
    
    /// Load OAuth provider configuration from environment
    /// Expects: <PREFIX>CLIENT_ID, <PREFIX>CLIENT_SECRET, <PREFIX>TENANT_ID (Azure only)
    fn load_oauth_provider(prefix: &str) -> anyhow::Result<Option<OAuthProviderConfig>> {
        let client_id = std::env::var(format!("{}CLIENT_ID", prefix)).unwrap_or_default();
        let client_secret = std::env::var(format!("{}CLIENT_SECRET", prefix)).unwrap_or_default();
        
        if client_id.is_empty() || client_secret.is_empty() {
            return Ok(None);
        }
        
        let redirect_uri = std::env::var(format!("{}REDIRECT_URI", prefix)).unwrap_or_default();
        let tenant_id = std::env::var(format!("{}TENANT_ID", prefix)).ok().filter(|s| !s.is_empty());
        
        Ok(Some(OAuthProviderConfig {
            client_id,
            client_secret,
            redirect_uri,
            tenant_id,
        }))
    }
    
    /// Load Storage configuration from environment
    fn load_storage_config(config: &mut AppConfig) -> anyhow::Result<()> {
        config.storage.endpoint = std::env::var("STORAGE_ENDPOINT").ok().filter(|s| !s.is_empty());
        config.storage.bucket = std::env::var("STORAGE_BUCKET").ok().filter(|s| !s.is_empty());
        config.storage.access_key_id = std::env::var("STORAGE_ACCESS_KEY_ID").ok().filter(|s| !s.is_empty());
        config.storage.secret_access_key = std::env::var("STORAGE_SECRET_ACCESS_KEY").ok().filter(|s| !s.is_empty());
        
        if let Ok(region) = std::env::var("STORAGE_REGION") {
            if !region.is_empty() {
                config.storage.region = region;
            }
        }
        
        Ok(())
    }
}

// Usage: Cleaner, more maintainable
```

**Impact**: Cleaner, less repetitive configuration code.  
**Effort**: 0.25 hours

---

### CFG-2: Inconsistent Environment Variable Handling
**Location**: Various fields use different patterns  
**Pattern**:

```rust
// DATABASE_URL - Gets special handling
let database_url = std::env::var("DATABASE_URL")
    .ok()
    .filter(|s| !s.is_empty() && s != "undefined")
    .unwrap_or_else(|| "postgres://localhost/ignition".to_string());

// Also in default_database_url() function - duplicated logic
fn default_database_url() -> String {
    let db_url = std::env::var("DATABASE_URL")
        .ok()
        .filter(|s| !s.is_empty() && s != "undefined")
        .unwrap_or_else(|| "postgres://localhost/ignition".to_string());
    // ...
}

// SERVER_PUBLIC_URL - Different handling
if let Ok(public_url) = std::env::var("SERVER_PUBLIC_URL") {
    if !public_url.is_empty() {
        app_config.server.public_url = public_url;
    }
}

// STORAGE_ENDPOINT - Yet different handling
let storage_endpoint = std::env::var("STORAGE_ENDPOINT").ok().filter(|s| !s.is_empty());

// CORS_ALLOWED_ORIGINS - Uses default from config
.set_default(
    "cors.allowed_origins",
    vec!["http://localhost:3000", "http://localhost:3001"],
)?
// ... then tries to load from environment

// INCONSISTENCIES:
// 1. DATABASE_URL checked against "undefined" string
// 2. Some use .ok().filter() chain, some use nested if-let
// 3. Some have defaults, some don't
// 4. Logic duplicated in multiple places
// 5. No consistent pattern for handling empty values
```

**Issue**:
1. **Inconsistent null/empty checking**: Sometimes "undefined", sometimes empty string
2. **Duplicated logic**: DATABASE_URL logic in two places
3. **No clear pattern**: Different fields handle env vars differently
4. **Hard to maintain**: Adding new config field requires knowing all patterns

**Solution**: Create consistent environment variable loading pattern.

```rust
// Create helper trait for consistent handling
trait EnvVar: Sized {
    fn from_env(name: &str) -> Option<Self>;
    fn from_env_or(name: &str, default: Self) -> Self {
        Self::from_env(name).unwrap_or(default)
    }
}

// Implement for String
impl EnvVar for String {
    fn from_env(name: &str) -> Option<Self> {
        std::env::var(name)
            .ok()
            .filter(|s| !s.is_empty() && s != "undefined")
    }
}

// Implement for Vec<String>
impl EnvVar for Vec<String> {
    fn from_env(name: &str) -> Option<Self> {
        std::env::var(name)
            .ok()
            .filter(|s| !s.is_empty())
            .map(|s| s.split(',').map(|s| s.to_string()).collect())
    }
}

// Implement for u16
impl EnvVar for u16 {
    fn from_env(name: &str) -> Option<Self> {
        std::env::var(name)
            .ok()
            .and_then(|s| s.parse::<u16>().ok())
    }
}

// Usage: Consistent across all fields
impl AppConfig {
    pub fn load() -> anyhow::Result<Self> {
        let database_url = String::from_env_or("DATABASE_URL", "postgres://localhost/ignition".to_string());
        let public_url = String::from_env_or("SERVER_PUBLIC_URL", "http://localhost:8080".to_string());
        let port = u16::from_env_or("SERVER_PORT", 8080);
        let allowed_origins = Vec::<String>::from_env_or("CORS_ALLOWED_ORIGINS", vec!["http://localhost:3000".to_string()]);
        
        // Much cleaner and consistent!
    }
}
```

**Impact**: Consistent, maintainable env var loading logic.  
**Effort**: 0.25 hours

---

## ISSUE CATEGORY: VALIDATION ISSUES (2 issues, 0.4 hours)

### VAL-1: Missing Configuration Validation
**Location**: After config load, minimal validation  
**Pattern**:

```rust
impl AppConfig {
    pub fn load() -> anyhow::Result<Self> {
        // ... load config ...
        Ok(app_config)  // Returned immediately after load
    }
}

// MISSING VALIDATIONS:
// 1. Database URL is valid PostgreSQL connection string?
// 2. Public URL and Frontend URL are valid URLs?
// 3. Session TTL is positive?
// 4. If OAuth configured, all required fields present?
// 5. If Storage configured, all required fields present?
// 6. Port is in valid range (1-65535)?
// 7. Cookie domain matches URL?

// Example problem: What if PORT is set to 0 or 99999?
// What if SESSION_TTL_SECONDS is negative?
// What if PUBLIC_URL is invalid?
// No validation catches these!
```

**Issue**:
1. Config loaded but not validated
2. Invalid configuration discovered at runtime
3. Invalid values could cause subtle bugs
4. No early feedback about configuration problems

**Solution**: Add validation after loading.

```rust
impl AppConfig {
    pub fn load() -> anyhow::Result<Self> {
        let mut config: Self = config.try_deserialize()?;
        
        // ... manual overrides ...
        
        // Validate configuration
        config.validate()?;
        
        Ok(config)
    }
    
    /// Validate configuration values
    pub fn validate(&self) -> anyhow::Result<()> {
        // Database
        if self.database.url.is_empty() {
            return Err(anyhow::anyhow!("database.url is empty"));
        }
        if !self.database.url.starts_with("postgres://") && !self.database.url.starts_with("postgresql://") {
            return Err(anyhow::anyhow!("database.url must be valid PostgreSQL connection string"));
        }
        
        // Server
        if self.server.port == 0 || self.server.port > 65535 {
            return Err(anyhow::anyhow!("server.port must be 1-65535, got {}", self.server.port));
        }
        if !self.server.public_url.starts_with("http://") && !self.server.public_url.starts_with("https://") {
            return Err(anyhow::anyhow!("server.public_url must be valid URL"));
        }
        
        // Auth
        if self.auth.session_ttl_seconds == 0 {
            return Err(anyhow::anyhow!("auth.session_ttl_seconds must be > 0"));
        }
        
        // OAuth validation if configured
        if let Some(oauth) = &self.auth.oauth {
            if let Some(google) = &oauth.google {
                if google.client_id.is_empty() || google.client_secret.is_empty() {
                    return Err(anyhow::anyhow!("Google OAuth configured but missing client_id or client_secret"));
                }
            }
            if let Some(azure) = &oauth.azure {
                if azure.client_id.is_empty() || azure.client_secret.is_empty() {
                    return Err(anyhow::anyhow!("Azure OAuth configured but missing client_id or client_secret"));
                }
                if azure.tenant_id.is_none() || azure.tenant_id.as_ref().map(|t| t.is_empty()).unwrap_or(true) {
                    return Err(anyhow::anyhow!("Azure OAuth configured but missing tenant_id"));
                }
            }
        }
        
        // Storage validation if configured
        if self.storage.endpoint.is_some() {
            if self.storage.bucket.is_none() {
                return Err(anyhow::anyhow!("Storage.endpoint configured but missing bucket"));
            }
            if self.storage.access_key_id.is_none() || self.storage.secret_access_key.is_none() {
                return Err(anyhow::anyhow!("Storage configured but missing credentials"));
            }
        }
        
        Ok(())
    }
}
```

**Impact**: Configuration errors caught at startup, not at runtime.  
**Effort**: 0.25 hours

---

### VAL-2: Unclear Empty Value Semantics
**Location**: Various fields use empty string to mean "not configured"  
**Pattern**:

```rust
// What does empty DATABASE_URL mean?
// - config.rs line 30: Uses default "postgres://localhost/ignition"
// - Not clear: Is fallback acceptable or is it a configuration error?

// What does empty AUTH_OAUTH_GOOGLE_CLIENT_ID mean?
// - Google OAuth won't be initialized (OK)
// - But if SECRET is provided without ID, what happens?

// Checking multiple conditions scattered:
if !google_client_id.is_empty() && !google_client_secret.is_empty() {
    // Both required
}

// No clear spec: What are the required field combinations?
// - Google: client_id + secret? (redirect_uri optional?)
// - Azure: client_id + secret + tenant_id?
// - Storage: endpoint + bucket + credentials?

// PROBLEM: Empty values could mean:
// 1. Feature not configured (expected)
// 2. Configuration error (user forgot to set)
// 3. Partially configured (user set some fields but not others)
// Hard to distinguish!
```

**Issue**:
1. Empty values overloaded with meaning
2. No clear "feature not configured" indicator
3. Partial configuration not detected
4. Error messages could be clearer

**Solution**: Define clear configuration requirements.

```rust
// config.rs - Add documentation

/// Configuration Semantics
///
/// ### Empty Values
/// Empty strings indicate "not configured":
/// - Empty DATABASE_URL → Use fallback localhost (development only!)
/// - Empty AUTH_OAUTH_GOOGLE_CLIENT_ID → Google OAuth disabled
/// - Empty STORAGE_ENDPOINT → Storage feature disabled
///
/// ### Partial Configuration
/// Some features require all fields to be configured together:
/// - Google OAuth: requires CLIENT_ID + CLIENT_SECRET
/// - Azure OAuth: requires CLIENT_ID + CLIENT_SECRET + TENANT_ID
/// - Storage: requires ENDPOINT + BUCKET + ACCESS_KEY_ID + SECRET_ACCESS_KEY
///
/// Partial configuration (some fields set, others empty) is an ERROR.
/// See validate() for enforcement.

pub struct AppConfig { ... }

impl AppConfig {
    pub fn validate(&self) -> anyhow::Result<()> {
        // Ensure Google OAuth is all-or-nothing
        if let Some(oauth) = &self.auth.oauth {
            if let Some(google) = &oauth.google {
                let has_id = !google.client_id.is_empty();
                let has_secret = !google.client_secret.is_empty();
                if has_id != has_secret {
                    return Err(anyhow::anyhow!(
                        "Google OAuth: Both client_id and client_secret must be set, or both must be empty"
                    ));
                }
            }
        }
        // ... similar for Azure and Storage ...
        Ok(())
    }
}
```

**Impact**: Clear configuration requirements, better error messages.  
**Effort**: 0.15 hours

---

## ISSUE CATEGORY: DOCUMENTATION (1 issue, 0.2 hours)

### DOC-1: Missing Environment Variable Documentation
**Location**: No CONFIGURATION.md or environment variable guide  
**Issue**:

```rust
// Where would a developer find:
// - Complete list of env vars?
// - Which are required vs optional?
// - What do they mean?
// - What are valid values?
// - Examples?

// Only way to find out: Read config.rs (330 lines)
// What happens if they misunderstand separator("_") behavior?
```

**Solution**: Create CONFIGURATION.md documenting all environment variables.

```markdown
# Configuration

## Environment Variables

### Server Configuration

#### SERVER_HOST
- **Type**: String
- **Default**: "0.0.0.0"
- **Example**: "127.0.0.1"
- **Description**: Server bind address

#### SERVER_PORT
- **Type**: u16
- **Default**: 8080
- **Valid Range**: 1-65535
- **Example**: "3000"
- **Description**: Server bind port

#### SERVER_PUBLIC_URL
- **Type**: URL
- **Default**: "http://localhost:8080"
- **Example**: "https://api.ignition.example.com"
- **Description**: Public API URL (used in OAuth redirects)

#### SERVER_FRONTEND_URL
- **Type**: URL
- **Default**: "http://localhost:3000"
- **Example**: "https://ignition.example.com"
- **Description**: Frontend URL (used in OAuth redirects)

### Database Configuration

#### DATABASE_URL
- **Type**: PostgreSQL connection string
- **Default**: "postgres://localhost/ignition"
- **Example**: "postgresql://user:pass@host:5432/ignition"
- **Required**: Yes (required for production)
- **Description**: Database connection string
- **Warning**: Empty values or "undefined" will use fallback (development only!)

### Authentication

#### AUTH_COOKIE_DOMAIN
- **Type**: Domain string
- **Default**: "localhost"
- **Example**: "ignition.example.com"
- **Description**: Domain for session cookie

#### AUTH_SESSION_TTL_SECONDS
- **Type**: u64
- **Default**: 2592000 (30 days)
- **Example**: "86400" (1 day)
- **Description**: Session timeout in seconds

### OAuth Configuration

#### AUTH_OAUTH_GOOGLE_CLIENT_ID
- **Type**: String
- **Required With**: AUTH_OAUTH_GOOGLE_CLIENT_SECRET
- **Example**: "123456789-abc...@apps.googleusercontent.com"
- **Description**: Google OAuth client ID

#### AUTH_OAUTH_GOOGLE_CLIENT_SECRET
- **Type**: String
- **Required With**: AUTH_OAUTH_GOOGLE_CLIENT_ID
- **Example**: "GOCSPX-..."
- **Description**: Google OAuth client secret

#### AUTH_OAUTH_AZURE_CLIENT_ID
- **Type**: String
- **Required With**: AUTH_OAUTH_AZURE_CLIENT_SECRET, AUTH_OAUTH_AZURE_TENANT_ID
- **Example**: "12345678-1234-1234-1234-123456789abc"
- **Description**: Azure OAuth client ID

#### AUTH_OAUTH_AZURE_CLIENT_SECRET
- **Type**: String
- **Required With**: AUTH_OAUTH_AZURE_CLIENT_ID, AUTH_OAUTH_AZURE_TENANT_ID
- **Description**: Azure OAuth client secret

#### AUTH_OAUTH_AZURE_TENANT_ID
- **Type**: String (UUID or directory ID)
- **Required With**: AUTH_OAUTH_AZURE_CLIENT_ID, AUTH_OAUTH_AZURE_CLIENT_SECRET
- **Example**: "12345678-1234-1234-1234-123456789abc"
- **Description**: Azure tenant ID for OAuth

### Storage Configuration

#### STORAGE_ENDPOINT
- **Type**: URL
- **Required With**: STORAGE_BUCKET, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY
- **Example**: "https://bucket.s3.us-west-2.amazonaws.com" or "https://r2.example.com"
- **Description**: S3/R2 endpoint URL

#### STORAGE_BUCKET
- **Type**: String (bucket name)
- **Required With**: STORAGE_ENDPOINT, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY
- **Example**: "ignition-uploads"
- **Description**: S3/R2 bucket name

#### STORAGE_REGION
- **Type**: String
- **Default**: "auto"
- **Example**: "us-west-2"
- **Description**: S3 region

#### STORAGE_ACCESS_KEY_ID
- **Type**: String
- **Required With**: STORAGE_ENDPOINT, STORAGE_BUCKET, STORAGE_SECRET_ACCESS_KEY
- **Description**: S3/R2 access key ID

#### STORAGE_SECRET_ACCESS_KEY
- **Type**: String
- **Required With**: STORAGE_ENDPOINT, STORAGE_BUCKET, STORAGE_ACCESS_KEY_ID
- **Description**: S3/R2 secret access key

### Logging

#### RUST_LOG
- **Type**: tracing filter expression
- **Default**: "ignition_api=debug,tower_http=debug"
- **Examples**:
  - "ignition_api=info" - Info level for app
  - "ignition_api=debug,sqlx=debug" - Debug everything
  - "trace" - Very detailed logging
- **Description**: Controls log level and verbosity

## Configuration Composition

### Development

```bash
DATABASE_URL=postgresql://localhost/ignition
SERVER_PUBLIC_URL=http://localhost:8080
SERVER_FRONTEND_URL=http://localhost:3000
RUST_LOG=ignition_api=debug
```

### Staging with OAuth

```bash
DATABASE_URL=postgresql://user:pass@staging.db.example.com/ignition
SERVER_PUBLIC_URL=https://api-staging.ignition.example.com
SERVER_FRONTEND_URL=https://staging.ignition.example.com
AUTH_OAUTH_GOOGLE_CLIENT_ID=...
AUTH_OAUTH_GOOGLE_CLIENT_SECRET=...
RUST_LOG=ignition_api=info
```

### Production with Full Features

```bash
DATABASE_URL=postgresql://user:pass@prod.db.example.com/ignition
SERVER_PUBLIC_URL=https://api.ignition.example.com
SERVER_FRONTEND_URL=https://ignition.example.com
AUTH_COOKIE_DOMAIN=ignition.example.com
AUTH_OAUTH_GOOGLE_CLIENT_ID=...
AUTH_OAUTH_GOOGLE_CLIENT_SECRET=...
AUTH_OAUTH_AZURE_CLIENT_ID=...
AUTH_OAUTH_AZURE_CLIENT_SECRET=...
AUTH_OAUTH_AZURE_TENANT_ID=...
STORAGE_ENDPOINT=https://r2.example.com
STORAGE_BUCKET=ignition-prod
STORAGE_ACCESS_KEY_ID=...
STORAGE_SECRET_ACCESS_KEY=...
RUST_LOG=ignition_api=warn
```
```

**Impact**: Developers know what env vars are available and how to use them.  
**Effort**: 0.2 hours

---

## ISSUE CATEGORY: SECRET HANDLING (1 issue, 0.25 hours)

### SEC-1: Secrets Logged at Startup
**Location**: config.rs lines ~166-175  
**Code**:

```rust
// Debug logging of ALL env vars at startup:
tracing::info!("=== Config Loading: Environment Variables ===");
for (key, value) in std::env::vars() {
    if key.starts_with("AUTH_") || key.starts_with("STORAGE_") || key.starts_with("DATABASE") || key.starts_with("SERVER_") {
        let display_value = if key.contains("SECRET") || key.contains("PASSWORD") || key.contains("KEY") {
            if value.is_empty() { "(empty)" } else { "(set)" }  // ← Redacted correctly
        } else if value.len() > 50 {
            &value[..50]
        } else {
            &value  // ← LOGGING FULL VALUE! (e.g., Slack URL, API keys)
        };
        tracing::info!("  {}: {}", key, display_value);
    }
}
```

**Issue**:
1. **Some secrets redacted, others logged**: Only keys with "SECRET", "PASSWORD", "KEY" are redacted
2. **Other sensitive values logged fully**: 
   - SERVER_PUBLIC_URL might contain token
   - STORAGE_ENDPOINT might contain credentials
   - Slack webhook URL or similar would be logged
3. **Startup logging goes to production logs**: Log aggregation tools could retain this
4. **Not all secret names caught**: Could use "TOKEN", "CREDENTIAL", etc.

**Solution**: Redact all potentially sensitive values.

```rust
// config.rs - IMPROVED
tracing::info!("=== Config Loading: Environment Variables ===");
for (key, value) in std::env::vars() {
    if key.starts_with("AUTH_") || key.starts_with("STORAGE_") || key.starts_with("DATABASE") || key.starts_with("SERVER_") {
        let display_value = Self::redact_sensitive_value(&key, &value);
        tracing::debug!("  {}: {}", key, display_value);  // DEBUG instead of INFO for less noise
    }
}
tracing::info!("=== End Environment Variables ===");

fn redact_sensitive_value(key: &str, value: &str) -> String {
    // List of key patterns that indicate sensitive values
    let sensitive_patterns = [
        "SECRET", "PASSWORD", "KEY", "TOKEN",
        "CREDENTIAL", "API_KEY", "OAUTH",
        "DATABASE_URL",  // Entire URL might have password
    ];
    
    // Check if key matches any sensitive pattern
    for pattern in &sensitive_patterns {
        if key.contains(pattern) {
            return if value.is_empty() {
                "(empty)".to_string()
            } else {
                "(set, redacted)".to_string()
            };
        }
    }
    
    // Non-sensitive values can be shown (with truncation for long values)
    if value.len() > 100 {
        format!("{}...{}", &value[..50], &value[value.len()-50..])
    } else {
        value.to_string()
    }
}
```

**Impact**: Prevents accidental logging of secrets in production.  
**Effort**: 0.25 hours

---

## ISSUE CATEGORY: ERROR HANDLING (1 issue, 0.3 hours)

### ERR-1: Missing Graceful Degradation for Optional Features
**Location**: Feature configuration not cleanly handled  
**Pattern**:

```rust
// If STORAGE_* env vars partially set:
// What happens?

let storage_endpoint = std::env::var("STORAGE_ENDPOINT").ok().filter(|s| !s.is_empty());
let storage_bucket = std::env::var("STORAGE_BUCKET").ok().filter(|s| !s.is_empty());
let storage_access_key = std::env::var("STORAGE_ACCESS_KEY_ID").ok().filter(|s| !s.is_empty());
let storage_secret_key = std::env::var("STORAGE_SECRET_ACCESS_KEY").ok().filter(|s| !s.is_empty());
let storage_region = std::env::var("STORAGE_REGION").ok().filter(|s| !s.is_empty());

if storage_endpoint.is_some() || storage_access_key.is_some() {
    tracing::info!("Loading Storage config from environment variables");
    // ... but what if only endpoint is set, not bucket?
    // Configuration is partially applied - undefined behavior!
}

// Similar problem with OAuth:
if !google_client_id.is_empty() && !google_client_secret.is_empty() {
    // OK - both required
} else if !google_client_id.is_empty() || !google_client_secret.is_empty() {
    // PROBLEM - only one is set, feature partially configured!
    // Should this be an error or silently skip?
}
```

**Issue**:
1. Partial feature configuration not detected
2. No clear error message if only some fields provided
3. Feature might fail at runtime if incomplete
4. Hard to debug

**Solution**: Validate feature completeness.

```rust
impl AppConfig {
    pub fn validate(&self) -> anyhow::Result<()> {
        // Validate Storage: all-or-nothing
        let has_endpoint = self.storage.endpoint.is_some();
        let has_bucket = self.storage.bucket.is_some();
        let has_access_key = self.storage.access_key_id.is_some();
        let has_secret_key = self.storage.secret_access_key.is_some();
        
        let storage_config_count = [has_endpoint, has_bucket, has_access_key, has_secret_key]
            .iter()
            .filter(|b| **b)
            .count();
        
        if storage_config_count > 0 && storage_config_count < 4 {
            return Err(anyhow::anyhow!(
                "Storage: All fields (endpoint, bucket, access_key_id, secret_access_key) must be configured together. Got {} of 4.",
                storage_config_count
            ));
        }
        
        // Validate OAuth: all-or-nothing per provider
        if let Some(oauth) = &self.auth.oauth {
            Self::validate_oauth_provider(
                &oauth.google,
                "Google",
                false,  // No tenant_id required
            )?;
            Self::validate_oauth_provider(
                &oauth.azure,
                "Azure",
                true,  // tenant_id required
            )?;
        }
        
        Ok(())
    }
    
    fn validate_oauth_provider(
        provider: &Option<OAuthProviderConfig>,
        name: &str,
        requires_tenant_id: bool,
    ) -> anyhow::Result<()> {
        if let Some(config) = provider {
            let has_id = !config.client_id.is_empty();
            let has_secret = !config.client_secret.is_empty();
            let has_tenant_id = config.tenant_id.is_some() && !config.tenant_id.as_ref().unwrap().is_empty();
            
            if has_id != has_secret {
                return Err(anyhow::anyhow!(
                    "{} OAuth: Both client_id and client_secret must be set together",
                    name
                ));
            }
            
            if requires_tenant_id && !has_tenant_id && (has_id || has_secret) {
                return Err(anyhow::anyhow!(
                    "{} OAuth: tenant_id is required when client_id/secret are set",
                    name
                ));
            }
        }
        
        Ok(())
    }
}
```

**Impact**: Clear error messages for misconfigured features.  
**Effort**: 0.3 hours

---

## IMPLEMENTATION ROADMAP

### Phase 1: Add Configuration Validation (0.25 hours)
- [ ] Create validate() method
- [ ] Check all required field combinations
- [ ] Provide clear error messages

### Phase 2: Refactor Complex Override Logic (0.25 hours)
- [ ] Create load_oauth_config() helper
- [ ] Create load_storage_config() helper
- [ ] Remove duplicate code

### Phase 3: Create Consistent Env Var Pattern (0.25 hours)
- [ ] Create EnvVar trait for consistent handling
- [ ] Update all field loading to use trait
- [ ] Remove scattered .ok().filter() chains

### Phase 4: Fix Secret Logging (0.25 hours)
- [ ] Create redact_sensitive_value() function
- [ ] Apply to startup logging
- [ ] Change INFO logs to DEBUG

### Phase 5: Create Configuration Documentation (0.2 hours)
- [ ] Create CONFIGURATION.md with all env vars
- [ ] Document required field combinations
- [ ] Add examples for different environments

### Phase 6: Improve Error Messages (0.3 hours)
- [ ] Add validation for partial configuration
- [ ] Provide helpful suggestions for fixes
- [ ] Log configuration summary at startup

---

## VALIDATION CHECKLIST

### Configuration Validation
- [ ] All required fields validated at load time
- [ ] Partial configuration detected and reported
- [ ] Error messages helpful and specific
- [ ] Graceful handling of missing optional features

### Secret Handling
- [ ] All secrets redacted in logs
- [ ] No sensitive values in debug output
- [ ] Key patterns comprehensive
- [ ] Startup logging doesn't expose credentials

### Code Organization
- [ ] Manual overrides consolidated into helper functions
- [ ] No duplicate configuration logic
- [ ] Consistent env var handling across all fields
- [ ] Clear separation of required vs optional

### Documentation
- [ ] All env vars documented
- [ ] Required field combinations specified
- [ ] Examples for different environments
- [ ] Configuration errors have helpful messages

---

## SUMMARY

Backend configuration is **functional but fragile and complex**:

**Highest Priority**: Add configuration validation to catch errors at startup.

**Important**: Refactor complex manual override code into helper functions.

**Quality**: Fix secret logging and create consistent env var handling.

**Quick Wins**:
- Add validation() method (0.25 hours)
- Fix secret logging in startup (0.25 hours)
- Create CONFIGURATION.md (0.2 hours)
- Refactor OAuth/Storage loading (0.25 hours)

**Total Effort**: 1.5-2 hours to improve robustness.

**ROI**:
- Configuration errors caught at startup, not runtime
- Cleaner code: less duplication, consistent patterns
- Better secrets handling: no accidental logging
- Improved documentation: developers know what env vars exist
- Graceful feature degradation: clear error messages
