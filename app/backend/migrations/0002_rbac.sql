-- Migration 0002: RBAC
-- Role-based access control and audit logging
-- Tables: roles, user_roles, audit_log, activity_events

-- =============================================================================
-- ROLES
-- =============================================================================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    parent_role_id UUID REFERENCES roles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default roles
INSERT INTO roles (name, description) VALUES
    ('admin', 'Full system access'),
    ('moderator', 'Content moderation access'),
    ('user', 'Standard user access');

-- =============================================================================
-- USER_ROLES
-- =============================================================================
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX user_roles_user_id_idx ON user_roles(user_id);
CREATE INDEX user_roles_role_id_idx ON user_roles(role_id);

-- =============================================================================
-- AUDIT_LOG
-- =============================================================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    action TEXT,
    status TEXT NOT NULL DEFAULT 'success',
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    request_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_log_user_id_idx ON audit_log(user_id);
CREATE INDEX audit_log_created_at_idx ON audit_log(created_at DESC);
CREATE INDEX audit_log_event_type_idx ON audit_log(event_type);
CREATE INDEX audit_log_resource_idx ON audit_log(resource_type, resource_id);

-- =============================================================================
-- ACTIVITY_EVENTS (for gamification tracking)
-- =============================================================================
CREATE TABLE activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    category TEXT,
    metadata JSONB,
    xp_earned INTEGER DEFAULT 0,
    coins_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX activity_events_user_id_idx ON activity_events(user_id);
CREATE INDEX activity_events_created_at_idx ON activity_events(created_at DESC);
CREATE INDEX activity_events_event_type_idx ON activity_events(event_type);

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Convenience view for checking user roles
CREATE VIEW user_with_roles AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.role as legacy_role,
    array_agg(r.name) FILTER (WHERE r.name IS NOT NULL) as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.email, u.name, u.role;
