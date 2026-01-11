-- Down migration for 0009_books.sql

DROP TRIGGER IF EXISTS update_books_updated_at ON books;

DROP TABLE IF EXISTS reading_sessions;
DROP TABLE IF EXISTS books;
