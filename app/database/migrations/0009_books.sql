-- Migration 0009: Books
-- Tables: books, reading_sessions

-- =============================================================================
-- BOOKS
-- =============================================================================
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author TEXT,
    total_pages INTEGER,
    current_page INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'to_read',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    cover_url TEXT,
    isbn TEXT,
    genre TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX books_user_idx ON books(user_id);
CREATE INDEX books_user_status_idx ON books(user_id, status);

CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- READING_SESSIONS
-- =============================================================================
CREATE TABLE reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pages_read INTEGER NOT NULL DEFAULT 0,
    start_page INTEGER,
    end_page INTEGER,
    duration_minutes INTEGER,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    coins_awarded INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX reading_sessions_book_idx ON reading_sessions(book_id);
CREATE INDEX reading_sessions_user_idx ON reading_sessions(user_id);
CREATE INDEX reading_sessions_started_idx ON reading_sessions(started_at DESC);
