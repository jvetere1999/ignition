/**
 * Focus Sessions E2E API Tests
 *
 * Tests for the Focus/Pomodoro module endpoints.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

// Test context for sharing data between serial tests
let createdSessionId: string | null = null;
let createdLibraryId: string | null = null;

test.describe('Focus Sessions API', () => {
  test.describe.configure({ mode: 'serial' });

  // --- Libraries ---

  test('POST /focus/libraries - create focus library', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/focus/libraries`, {
      data: {
        name: 'E2E Test Library',
        description: 'Created by E2E tests',
        preset_durations: [25, 50, 90],
        default_duration: 25,
      },
    });

    if (response.status() === 401) {
      test.skip(true, 'Auth required - dev bypass not enabled');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data).toHaveProperty('id');
    expect(data.data.name).toBe('E2E Test Library');
    createdLibraryId = data.data.id;
  });

  test('GET /focus/libraries - list focus libraries', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/focus/libraries`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data).toHaveProperty('libraries');
    expect(Array.isArray(data.data.libraries)).toBe(true);
  });

  test('GET /focus/libraries/{id} - get library by ID', async ({ request }) => {
    if (!createdLibraryId) {
      test.skip(true, 'No library created');
      return;
    }

    const response = await request.get(`${API_BASE_URL}/focus/libraries/${createdLibraryId}`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data.id).toBe(createdLibraryId);
  });

  // --- Sessions ---

  test('POST /focus - start focus session', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/focus`, {
      data: {
        duration_minutes: 25,
        task_description: 'E2E Test Focus Session',
        library_id: createdLibraryId,
      },
    });

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data).toHaveProperty('id');
    expect(data.data).toHaveProperty('status');
    createdSessionId = data.data.id;
  });

  test('GET /focus/active - get active session', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/focus/active`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    // May or may not have active session
    expect(data).toHaveProperty('data');
  });

  test('GET /focus - list focus sessions', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/focus`, {
      params: { page: 1, page_size: 10 },
    });

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data).toHaveProperty('sessions');
    expect(Array.isArray(data.data.sessions)).toBe(true);
  });

  test('POST /focus/pause - pause active session', async ({ request }) => {
    if (!createdSessionId) {
      test.skip(true, 'No active session');
      return;
    }

    const response = await request.post(`${API_BASE_URL}/focus/pause`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    // May be 400 if no active session
    expect([200, 400, 404]).toContain(response.status());
  });

  test('DELETE /focus/pause - resume paused session', async ({ request }) => {
    const response = await request.delete(`${API_BASE_URL}/focus/pause`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    // May be 400 if not paused
    expect([200, 400, 404]).toContain(response.status());
  });

  test('POST /focus/{id}/complete - complete session', async ({ request }) => {
    if (!createdSessionId) {
      test.skip(true, 'No session created');
      return;
    }

    const response = await request.post(`${API_BASE_URL}/focus/${createdSessionId}/complete`, {
      data: {
        actual_focus_time_minutes: 25,
        notes: 'Completed via E2E test',
      },
    });

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    // May be 400 if session already completed/abandoned
    expect([200, 400]).toContain(response.status());
  });

  // --- Cleanup ---

  test('DELETE /focus/libraries/{id} - delete library', async ({ request }) => {
    if (!createdLibraryId) {
      test.skip(true, 'No library created');
      return;
    }

    const response = await request.delete(`${API_BASE_URL}/focus/libraries/${createdLibraryId}`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
  });
});
