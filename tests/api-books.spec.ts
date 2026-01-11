/**
 * Books & Reading E2E API Tests
 *
 * Tests for books and reading sessions endpoints.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

let createdBookId: string | null = null;

test.describe('Books API', () => {
  test.describe.configure({ mode: 'serial' });

  test('POST /books - create book', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/books`, {
      data: {
        title: 'E2E Test Book',
        author: 'Test Author',
        total_pages: 300,
        status: 'reading',
      },
    });

    if (response.status() === 401) {
      test.skip(true, 'Auth required - dev bypass not enabled');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data).toHaveProperty('id');
    expect(data.data.title).toBe('E2E Test Book');
    createdBookId = data.data.id;
  });

  test('GET /books - list books', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/books`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data).toHaveProperty('books');
    expect(Array.isArray(data.data.books)).toBe(true);
  });

  test('GET /books/{id} - get book by ID', async ({ request }) => {
    if (!createdBookId) {
      test.skip(true, 'No book created');
      return;
    }

    const response = await request.get(`${API_BASE_URL}/books/${createdBookId}`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data.id).toBe(createdBookId);
  });

  test('PUT /books/{id} - update book', async ({ request }) => {
    if (!createdBookId) {
      test.skip(true, 'No book created');
      return;
    }

    const response = await request.put(`${API_BASE_URL}/books/${createdBookId}`, {
      data: {
        title: 'E2E Test Book (Updated)',
        current_page: 50,
      },
    });

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data.title).toBe('E2E Test Book (Updated)');
  });

  test('POST /books/{id}/sessions - log reading session', async ({ request }) => {
    if (!createdBookId) {
      test.skip(true, 'No book created');
      return;
    }

    const response = await request.post(`${API_BASE_URL}/books/${createdBookId}/sessions`, {
      data: {
        pages_read: 25,
        duration_minutes: 30,
        notes: 'E2E test reading session',
      },
    });

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data).toHaveProperty('session');
  });

  test('GET /books/{id}/sessions - list reading sessions', async ({ request }) => {
    if (!createdBookId) {
      test.skip(true, 'No book created');
      return;
    }

    const response = await request.get(`${API_BASE_URL}/books/${createdBookId}/sessions`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data).toHaveProperty('sessions');
    expect(Array.isArray(data.data.sessions)).toBe(true);
  });

  test('GET /books/stats - get reading stats', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/books/stats`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data).toHaveProperty('total_books');
    expect(data.data).toHaveProperty('total_pages_read');
  });

  test('DELETE /books/{id} - delete book', async ({ request }) => {
    if (!createdBookId) {
      test.skip(true, 'No book created');
      return;
    }

    const response = await request.delete(`${API_BASE_URL}/books/${createdBookId}`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
  });
});
