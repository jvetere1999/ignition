//! CORS configuration
//!
//! Configures Cross-Origin Resource Sharing for the API.
//! Works in conjunction with CSRF protection (DEC-002=A).

use axum::http::{header, HeaderValue, Method};
use tower_http::cors::CorsLayer;

use crate::config::AppConfig;

fn normalize_origin(origin: &str) -> String {
    origin.trim_end_matches('/').to_string()
}

/// Create CORS layer based on configuration
pub fn cors_layer(config: &AppConfig) -> CorsLayer {
    let mut layer = CorsLayer::new()
        // Allow credentials (cookies)
        .allow_credentials(true)
        // Allow common headers
        .allow_headers([
            header::ACCEPT,
            header::ACCEPT_LANGUAGE,
            header::AUTHORIZATION,
            header::CONTENT_LANGUAGE,
            header::CONTENT_TYPE,
            header::ORIGIN,
        ])
        // Allow common methods
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        // Expose headers the client may need
        .expose_headers([header::CONTENT_TYPE, header::CONTENT_LENGTH]);

    let mut origins = config
        .cors
        .allowed_origins
        .iter()
        .map(|origin| normalize_origin(origin))
        .collect::<Vec<String>>();

    let frontend_origin = normalize_origin(&config.server.frontend_url);
    if !frontend_origin.is_empty() {
        origins.push(frontend_origin);
    }

    if config.is_production() {
        origins.push("https://ignition.ecent.online".to_string());
        origins.push("https://admin.ignition.ecent.online".to_string());
    }

    origins.sort();
    origins.dedup();

    let allowed: Vec<HeaderValue> = origins
        .iter()
        .filter_map(|o| o.parse().ok())
        .collect();

    layer = layer.allow_origin(allowed);

    layer
}
