/**
 * Books API
 *
 * API client methods for book tracking and reading sessions.
 * All calls go through the backend at api.ecent.online.
 *
 * PARITY-034: Books routes
 * REFACTOR: Uses shared client (January 2026)
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';

// ============================================
// Types
// ============================================

export type BookStatus = 'want_to_read' | 'reading' | 'completed' | 'abandoned';

export interface Book {
  id: string;
  title: string;
  author: string | null;
  total_pages: number | null;
  current_page: number;
  progress_percent: number | null;
  status: BookStatus;
  started_at: string | null;
  completed_at: string | null;
  rating: number | null;
  notes: string | null;
}

export interface ReadingSession {
  id: string;
  book_id: string;
  pages_read: number;
  duration_minutes: number | null;
  started_at: string;
  notes: string | null;
  xp_awarded: number;
  coins_awarded: number;
}

export interface ReadingStats {
  books_completed: number;
  books_reading: number;
  total_books: number;
  total_pages_read: number;
  total_reading_time_minutes: number;
}

// Request types
export interface CreateBookRequest {
  title: string;
  author?: string;
  total_pages?: number;
  status?: BookStatus;
}

export interface UpdateBookRequest {
  title?: string;
  author?: string;
  total_pages?: number;
  current_page?: number;
  status?: BookStatus;
  rating?: number;
  notes?: string;
}

export interface LogReadingRequest {
  pages_read: number;
  duration_minutes?: number;
  notes?: string;
}

// Response wrappers
interface BooksWrapper {
  books: Book[];
  total: number;
}

interface SessionsWrapper {
  sessions: ReadingSession[];
}

interface StatsWrapper {
  stats: ReadingStats;
}

interface LogReadingResult {
  session: ReadingSession;
  book: Book;
  xp_awarded: number;
  coins_awarded: number;
  is_completed: boolean;
}

// ============================================
// Book API
// ============================================

/** List all books */
export async function listBooks(status?: BookStatus): Promise<Book[]> {
  const path = status ? `/api/books?status=${status}` : '/api/books';
  const response = await apiGet<BooksWrapper>(path);
  return response.books;
}

/** Get book by ID */
export async function getBook(id: string): Promise<Book> {
  const response = await apiGet<{ book: Book }>(`/api/books/${id}`);
  return response.book;
}

/** Create a new book */
export async function createBook(data: CreateBookRequest): Promise<Book> {
  const response = await apiPost<{ book: Book }>('/api/books', data);
  return response.book;
}

/** Update a book */
export async function updateBook(id: string, data: UpdateBookRequest): Promise<Book> {
  const response = await apiPut<{ book: Book }>(`/api/books/${id}`, data);
  return response.book;
}

/** Delete a book */
export async function deleteBook(id: string): Promise<void> {
  await apiDelete<{ deleted: boolean }>(`/api/books/${id}`);
}

/** Get reading stats */
export async function getReadingStats(): Promise<ReadingStats> {
  const response = await apiGet<StatsWrapper>('/api/books/stats');
  return response.stats;
}

// ============================================
// Reading Session API
// ============================================

/** List reading sessions for a book */
export async function listReadingSessions(bookId: string): Promise<ReadingSession[]> {
  const response = await apiGet<SessionsWrapper>(`/api/books/${bookId}/sessions`);
  return response.sessions;
}

/** Log a reading session */
export async function logReading(bookId: string, data: LogReadingRequest): Promise<LogReadingResult> {
  const response = await apiPost<{ result: LogReadingResult }>(`/api/books/${bookId}/sessions`, data);
  return response.result;
}
