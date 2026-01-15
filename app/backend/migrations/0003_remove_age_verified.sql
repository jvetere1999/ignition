-- Migration: Remove age_verified column
-- Date: 2026-01-15
-- Purpose: Remove age verification from the system - now integrated into TOS acceptance

ALTER TABLE users DROP COLUMN age_verified;
