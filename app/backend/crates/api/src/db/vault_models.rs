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

#[derive(Debug, Serialize, Deserialize)]
pub struct VaultLockState {
    pub locked_at: Option<DateTime<Utc>>,
    pub lock_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LockVaultRequest {
    pub reason: String, // 'idle', 'backgrounded', 'logout', 'force', 'rotation'
}

#[derive(Debug, Deserialize)]
pub struct UnlockVaultRequest {
    pub passphrase: String,
}

#[derive(Debug, Serialize)]
pub struct UnlockVaultResponse {
    pub success: bool,
    pub message: String,
}

// Lock reasons enum
#[derive(Debug, Clone)]
pub enum LockReason {
    Idle,
    Backgrounded,
    Logout,
    Force,
    Rotation,
    Admin,
}

impl LockReason {
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
}
