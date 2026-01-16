//! Security headers middleware
//!
//! Adds security headers to all HTTP responses to protect against common web vulnerabilities.
//! Includes:
//! - X-Content-Type-Options: nosniff (prevents MIME sniffing attacks)
//! - X-Frame-Options: DENY (prevents clickjacking attacks)
//! - Strict-Transport-Security: max-age=31536000 (HTTPS enforcement)
//! - X-XSS-Protection: 1; mode=block (XSS filter, deprecated but supported by older browsers)

use axum::{
    http::Response,
    middleware::Next,
    body::Body,
};

/// Middleware to add security headers to all responses
pub async fn add_security_headers(
    request: axum::extract::Request,
    next: Next,
) -> Response<Body> {
    let mut response = next.run(request).await;
    let headers = response.headers_mut();
    
    // Prevent MIME sniffing: tell browsers not to guess the content type
    headers.insert(
        "X-Content-Type-Options",
        "nosniff".parse().unwrap(),
    );
    
    // Prevent clickjacking: deny iframe embedding
    headers.insert(
        "X-Frame-Options",
        "DENY".parse().unwrap(),
    );
    
    // HSTS: enforce HTTPS for all connections (max-age = 1 year)
    headers.insert(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains".parse().unwrap(),
    );
    
    // XSS Filter: older browsers use built-in XSS filters
    // (Modern browsers ignore this, but it's a defense-in-depth measure)
    headers.insert(
        "X-XSS-Protection",
        "1; mode=block".parse().unwrap(),
    );
    
    response
}

