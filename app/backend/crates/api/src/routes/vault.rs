use crate::db::vault_models::{
    LockReason, LockVaultRequest, UnlockVaultRequest, UnlockVaultResponse,
};
use crate::db::vault_repos::VaultRepo;
use crate::error::AppError;
use crate::middleware::auth::AuthContext;
use crate::state::AppState;
use axum::{
    extract::{Extension, Json, State},
    http::StatusCode,
    routing::{get, post},
    Router,
};
use std::str::FromStr;
use std::sync::Arc;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/state", get(get_vault_state))
        .route("/lock", post(lock_vault))
        .route("/unlock", post(unlock_vault))
}

/// GET /api/vault/state
/// Get current vault lock state
///
/// # Trust Boundary
/// server_trusted!() - Returns state information about vault lock status.
/// Used by frontend to determine if vault is locked without passing any secrets.
async fn get_vault_state(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
) -> Result<Json<crate::db::vault_models::VaultLockState>, AppError> {
    // Auto-provision a placeholder vault so state lookups don't 404 for new users
    let _ = VaultRepo::ensure_vault(&state.db, auth.user_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to ensure vault exists: {}", e);
            AppError::Internal("Failed to fetch vault state".to_string())
        })?;

    let lock_state = VaultRepo::get_vault_state_full(&state.db, auth.user_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch vault state: {}", e);
            AppError::Internal("Failed to fetch vault state".to_string())
        })?
        .ok_or(AppError::Unauthorized("Vault not found".to_string()))?;

    Ok(Json(lock_state))
}

/// POST /api/vault/lock
/// Lock user's vault with specified reason
///
/// # Trust Boundary
/// server_trusted!() - This is server-side business logic that manages vault state.
/// No cryptographic operations occur here; the actual vault content remains encrypted server-side.
async fn lock_vault(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<LockVaultRequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    // Validate lock reason
    if req.reason.is_empty() {
        return Err(AppError::BadRequest(
            "Lock reason cannot be empty".to_string(),
        ));
    }

    // Parse lock reason using strum's FromStr derive
    let reason = LockReason::from_str(&req.reason)
        .map_err(|_| {
            AppError::BadRequest(
                format!("Invalid lock reason. Valid reasons: idle, backgrounded, logout, force, rotation, admin")
            )
        })?;

    // Ensure vault exists so lock operations don't fail for new users
    let _ = VaultRepo::ensure_vault(&state.db, auth.user_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to ensure vault exists: {}", e);
            AppError::Internal("Failed to lock vault".to_string())
        })?;

    let lock_result = VaultRepo::lock_vault(&state.db, auth.user_id, reason.clone()).await;
    match lock_result {
        Ok(()) => {}
        Err(sqlx::Error::RowNotFound) => {
            // Race or missing vault row: re-ensure and retry once
            let _ = VaultRepo::ensure_vault(&state.db, auth.user_id)
                .await
                .map_err(|e| {
                    tracing::error!("Failed to ensure vault exists: {}", e);
                    AppError::Internal("Failed to lock vault".to_string())
                })?;
            VaultRepo::lock_vault(&state.db, auth.user_id, reason)
                .await
                .map_err(|e| {
                    tracing::error!("Failed to lock vault after retry: {}", e);
                    AppError::Internal("Failed to lock vault".to_string())
                })?;
        }
        Err(e) => {
            tracing::error!("Failed to lock vault: {}", e);
            return Err(AppError::Internal("Failed to lock vault".to_string()));
        }
    }

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({
            "message": "Vault locked"
        })),
    ))
}

/// POST /api/vault/unlock
/// Unlock user's vault (passkey-authenticated session only)
///
/// # Trust Boundary
/// server_trusted!() - Requires a valid authenticated session. No secrets are
/// accepted from the client; this only flips lock state on the server.
async fn unlock_vault(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Json(_req): Json<UnlockVaultRequest>,
) -> Result<(StatusCode, Json<UnlockVaultResponse>), AppError> {
    // Ensure vault exists before attempting unlock
    VaultRepo::ensure_vault(&state.db, auth.user_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch vault: {}", e);
            AppError::Internal("Failed to fetch vault".to_string())
        })?;

    // Unlock vault within transaction (atomic operation with advisory lock)
    VaultRepo::unlock_vault(&state.db, auth.user_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to unlock vault: {}", e);
            AppError::Internal("Failed to unlock vault".to_string())
        })?;

    // Fetch updated lock state to return in response
    let lock_state = VaultRepo::get_vault_state_full(&state.db, auth.user_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch vault state: {}", e);
            AppError::Internal("Failed to fetch vault state".to_string())
        })?
        .unwrap_or_else(|| crate::db::vault_models::VaultLockState {
            locked_at: None,
            lock_reason: None,
        });

    Ok((
        StatusCode::OK,
        Json(UnlockVaultResponse {
            locked_at: lock_state.locked_at,
            lock_reason: lock_state.lock_reason,
        }),
    ))
}
