//! Error types and handling
//!
//! Centralized error handling with structured logging and observability.

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use uuid::Uuid;

/// Application error type
#[derive(Debug, thiserror::Error)]
#[allow(dead_code)]
pub enum AppError {
    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Forbidden")]
    Forbidden,

    #[error("CSRF violation")]
    CsrfViolation,

    #[error("Invalid origin")]
    InvalidOrigin,

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("OAuth error: {0}")]
    OAuthError(String),

    #[error("Session expired")]
    SessionExpired,

    #[error("Database error: {0}")]
    Database(String),

    /// Enhanced database error with context for better observability
    #[error("Database error in {operation} on {table}: {message}")]
    DatabaseWithContext {
        operation: String,
        table: String,
        message: String,
        user_id: Option<Uuid>,
        entity_id: Option<Uuid>,
    },

    #[error("Internal error: {0}")]
    Internal(String),

    #[error("Configuration error: {0}")]
    Config(String),

    /// Storage/R2 errors
    #[error("Storage error: {0}")]
    Storage(String),
}

// Manual implementation to avoid conflicts
impl From<sqlx::Error> for AppError {
    fn from(e: sqlx::Error) -> Self {
        AppError::Database(e.to_string())
    }
}

impl From<anyhow::Error> for AppError {
    fn from(e: anyhow::Error) -> Self {
        AppError::Internal(e.to_string())
    }
}

impl From<url::ParseError> for AppError {
    fn from(e: url::ParseError) -> Self {
        AppError::Config(e.to_string())
    }
}

/// Error response body
#[derive(Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_type, message) = match &self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, "not_found", msg.clone()),
            AppError::Unauthorized(msg) => (
                StatusCode::UNAUTHORIZED,
                "unauthorized",
                msg.clone(),
            ),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "forbidden", "Forbidden".to_string()),
            AppError::CsrfViolation => (
                StatusCode::FORBIDDEN,
                "csrf_violation",
                "CSRF validation failed".to_string(),
            ),
            AppError::InvalidOrigin => (
                StatusCode::FORBIDDEN,
                "invalid_origin",
                "Invalid origin".to_string(),
            ),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, "bad_request", msg.clone()),
            AppError::Validation(msg) => (
                StatusCode::UNPROCESSABLE_ENTITY,
                "validation_error",
                msg.clone(),
            ),
            AppError::OAuthError(msg) => {
                tracing::error!("OAuth error: {}", msg);
                (StatusCode::BAD_REQUEST, "oauth_error", msg.clone())
            }
            AppError::SessionExpired => (
                StatusCode::UNAUTHORIZED,
                "session_expired",
                "Session has expired".to_string(),
            ),
            AppError::Database(e) => {
                tracing::error!(
                    error.type = "database",
                    error.message = %e,
                    "Database error (legacy)"
                );
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "database_error",
                    "Database error".to_string(),
                )
            }
            AppError::DatabaseWithContext {
                operation,
                table,
                message,
                user_id,
                entity_id,
            } => {
                // Structured error logging for observability
                tracing::error!(
                    error.type = "database",
                    db.operation = %operation,
                    db.table = %table,
                    db.user_id = ?user_id,
                    db.entity_id = ?entity_id,
                    error.message = %message,
                    "Database query failed"
                );
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "database_error",
                    format!("Database error in {} on {}", operation, table),
                )
            }
            AppError::Internal(e) => {
                tracing::error!(
                    error.type = "internal",
                    error.message = %e,
                    "Internal error"
                );
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "internal_error",
                    "Internal server error".to_string(),
                )
            }
            AppError::Config(msg) => {
                tracing::error!(
                    error.type = "config",
                    error.message = %msg,
                    "Configuration error"
                );
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "config_error",
                    "Configuration error".to_string(),
                )
            }
            AppError::Storage(e) => {
                tracing::error!(
                    error.type = "storage",
                    error.message = %e,
                    "Storage error"
                );
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "storage_error",
                    "Storage error".to_string(),
                )
            }
        };

        let body = ErrorResponse {
            error: error_type.to_string(),
            message,
            code: None,
        };

        (status, Json(body)).into_response()
    }
}

/// Result type alias for application errors
pub type AppResult<T> = Result<T, AppError>;

// ============================================================================
// ERROR TYPE CONSTANTS (for API contract consistency)
// ============================================================================

#[allow(dead_code)]
pub mod error_types {
    /// Not found - resource does not exist
    pub const NOT_FOUND: &str = "not_found";
    /// Unauthorized - authentication required
    pub const UNAUTHORIZED: &str = "unauthorized";
    /// Forbidden - authenticated but access denied
    pub const FORBIDDEN: &str = "forbidden";
    /// CSRF validation failed
    pub const CSRF_VIOLATION: &str = "csrf_violation";
    /// Invalid origin header
    pub const INVALID_ORIGIN: &str = "invalid_origin";
    /// Bad request - client error
    pub const BAD_REQUEST: &str = "bad_request";
    /// Validation error - input validation failed
    pub const VALIDATION_ERROR: &str = "validation_error";
    /// OAuth/authentication provider error
    pub const OAUTH_ERROR: &str = "oauth_error";
    /// Session has expired
    pub const SESSION_EXPIRED: &str = "session_expired";
    /// Database operation failed
    pub const DATABASE_ERROR: &str = "database_error";
    /// Internal server error
    pub const INTERNAL_ERROR: &str = "internal_error";
    /// Configuration error
    pub const CONFIG_ERROR: &str = "config_error";
    /// Storage/R2 operation failed
    pub const STORAGE_ERROR: &str = "storage_error";
}

// ============================================================================
// CONSTRUCTOR HELPERS (for ergonomic error creation)
// ============================================================================

impl AppError {
    /// Create NotFound error
    pub fn not_found(msg: impl Into<String>) -> Self {
        AppError::NotFound(msg.into())
    }

    /// Create Unauthorized error
    pub fn unauthorized(msg: impl Into<String>) -> Self {
        AppError::Unauthorized(msg.into())
    }

    /// Create Forbidden error
    pub fn forbidden() -> Self {
        AppError::Forbidden
    }

    /// Create BadRequest error
    pub fn bad_request(msg: impl Into<String>) -> Self {
        AppError::BadRequest(msg.into())
    }

    /// Create Validation error
    pub fn validation(msg: impl Into<String>) -> Self {
        AppError::Validation(msg.into())
    }

    /// Create OAuthError
    pub fn oauth_error(msg: impl Into<String>) -> Self {
        AppError::OAuthError(msg.into())
    }

    /// Create Internal error
    pub fn internal(msg: impl Into<String>) -> Self {
        AppError::Internal(msg.into())
    }

    /// Create Database error (legacy format, for simple cases)
    pub fn database(msg: impl Into<String>) -> Self {
        AppError::Database(msg.into())
    }

    /// Create Database error with detailed context
    pub fn database_with_context(
        operation: impl Into<String>,
        table: impl Into<String>,
        message: impl Into<String>,
        user_id: Option<Uuid>,
    ) -> Self {
        AppError::DatabaseWithContext {
            operation: operation.into(),
            table: table.into(),
            message: message.into(),
            user_id,
            entity_id: None,
        }
    }

    /// Create Database error with context and entity ID
    pub fn database_with_entity(
        operation: impl Into<String>,
        table: impl Into<String>,
        message: impl Into<String>,
        user_id: Option<Uuid>,
        entity_id: Option<Uuid>,
    ) -> Self {
        AppError::DatabaseWithContext {
            operation: operation.into(),
            table: table.into(),
            message: message.into(),
            user_id,
            entity_id,
        }
    }

    /// Create Configuration error
    pub fn config(msg: impl Into<String>) -> Self {
        AppError::Config(msg.into())
    }

    /// Create Storage error
    pub fn storage(msg: impl Into<String>) -> Self {
        AppError::Storage(msg.into())
    }
}
