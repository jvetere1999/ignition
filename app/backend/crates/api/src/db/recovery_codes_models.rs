use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Request to generate new recovery codes
#[derive(Debug, Clone, Deserialize)]
pub struct GenerateRecoveryCodesRequest {
    /// Optional vault_id (defaults to authenticated user's vault)
    pub vault_id: Option<Uuid>,
    /// Optional count (defaults to 8)
    #[serde(default)]
    pub count: Option<usize>,
}

/// Response with generated recovery codes
#[derive(Debug, Clone, Serialize)]
pub struct GenerateRecoveryCodesResponse {
    pub codes: Vec<String>,
    pub message: String,
}

/// Request to reset passphrase using recovery code
#[derive(Debug, Clone, Deserialize)]
pub struct ResetPassphraseRequest {
    pub code: String,
    pub new_passphrase: String,
}

/// Response after successful passphrase reset
#[derive(Debug, Clone, Serialize)]
pub struct ResetPassphraseResponse {
    pub message: String,
    pub vault_id: Uuid,
}

/// Request to change passphrase (authenticated user)
#[derive(Debug, Clone, Deserialize)]
pub struct ChangePassphraseRequest {
    pub current_passphrase: String,
    pub new_passphrase: String,
}

/// Response after successful passphrase change
#[derive(Debug, Clone, Serialize)]
pub struct ChangePassphraseResponse {
    pub message: String,
    pub vault_id: Uuid,
}
