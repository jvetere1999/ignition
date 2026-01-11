-- Down migration for 0001_auth.sql

DROP FUNCTION IF EXISTS cleanup_expired_oauth_states();
DROP FUNCTION IF EXISTS cleanup_expired_sessions();
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TABLE IF EXISTS oauth_states;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;
