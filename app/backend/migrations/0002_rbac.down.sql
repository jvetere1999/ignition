-- Down migration for 0002_rbac.sql

DROP VIEW IF EXISTS user_with_roles;
DROP TABLE IF EXISTS activity_events;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
