use crate::db::vault_models::{LockReason, LockVaultRequest, UnlockVaultRequest, UnlockVaultResponse};
use crate::db::vault_repos::VaultRepo;
use crate::error::AppError;
use crate::middleware::auth::AuthContext;
use crate::state::AppState;
use axum::{
    extract::{State, Json, Extension},
    http::StatusCode,
    routing::post,
    Router,
};
use std::sync::Arc;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/lock", post(lock_vault))
        .route("/unlock", post(unlock_vault))
}

/// POST /api/vault/lock
/// Lock user's vault with specified reason
async fn lock_vault(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<LockVaultRequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    let reason = LockReason::from_str(&req.reason)
        .ok_or(AppError::BadRequest("Invalid lock reason".to_string()))?;

    VaultRepo::lock_vault(&state.db, auth.user_id, reason).await
        .map_err(|e| AppError::Internal(format!("Failed to lock vault: {}", e)))?;;

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({
            "success": true,
            "message": "Vault locked"
        })),
    ))
}

/// POST /api/vault/unlock
/// Unlock user's vault with passphrase
async fn unlock_vault(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<UnlockVaultRequest>,
) -> Result<(StatusCode, Json<UnlockVaultResponse>), AppError> {
    let vault = VaultRepo::get_by_user_id(&state.db, auth.user_id).await
        .map_err(|e| AppError::Internal(format!("Failed to fetch vault: {}", e)))?
        .ok_or(AppError::Unauthorized("Vault not found".to_string()))?;

    // TODO: Verify passphrase against vault.passphrase_hash using PBKDF2
    // For now, just unlock (passphrase verification should be implemented in crypto service)
    // This is a placeholder - actual verification would use bcrypt or similar

    VaultRepo::unlock_vault(&state.db, auth.user_id).await
        .map_err(|e| AppError::Internal(format!("Failed to unlock vault: {}", e)))?;;

    Ok((
        StatusCode::OK,
        Json(UnlockVaultResponse {
            success: true,
            message: "Vault unlocked".to_string(),
        }),
    ))
}
