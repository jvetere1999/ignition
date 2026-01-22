use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Vault {
    pub id: Uuid,
    pub user_id: Uuid,
    pub passphrase_salt: Vec<u8>,
    pub passphrase_hash: String,
    pub key_derivation_params: serde_json::Value,
    pub crypto_policy_version: Option<String>,
    pub locked_at: Option<DateTime<Utc>>,
    pub lock_reason: Option<String>,
    pub enforce_tier: i32,
    pub last_rotated_at: Option<DateTime<Utc>>,
    pub next_rotation_due: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct VaultLockState {
    pub locked_at: Option<DateTime<Utc>>,
    pub lock_reason: Option<String>,
}

/// Request to lock vault with specific reason
/// Reason must be one of: idle, backgrounded, logout, force, rotation, admin
#[derive(Debug, Deserialize)]
pub struct LockVaultRequest {
    pub reason: String,
}

/// Unlock request with no required fields (passkey-only flow).
#[derive(Debug, Deserialize, Default)]
pub struct UnlockVaultRequest {
    // Body intentionally empty; legacy clients may still send fields that are ignored.
}

/// Response from unlock vault endpoint
/// Returns lock state after unlock operation (confirms vault is unlocked)
#[derive(Debug, Serialize)]
pub struct UnlockVaultResponse {
    pub locked_at: Option<DateTime<Utc>>,
    pub lock_reason: Option<String>,
}

/// Lock reasons for vault state transitions
///
/// **Semantics**:
/// - `Idle`: User inactivity timeout (default)
/// - `Backgrounded`: App sent to background
/// - `Logout`: User logged out (requires full re-authentication)
/// - `Force`: Admin forced lock (requires additional authorization)
/// - `Rotation`: Vault key rotation in progress (temporary lock)
/// - `Admin`: Administrator action (highest priority)
///
/// **Sync Implications**:
/// - Sync must check lock_reason before accessing vault secrets
/// - Logout requires re-authentication flow
#[derive(Debug, Clone, strum_macros::AsRefStr, strum_macros::EnumString)]
#[strum(serialize_all = "lowercase")]
pub enum LockReason {
    Idle,
    Backgrounded,
    Logout,
    Force,
    Rotation,
    Admin,
}
