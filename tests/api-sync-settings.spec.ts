/**
 * Sync & Settings E2E API Tests
 *
 * Tests for sync endpoints and user settings.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

// ============================================
// Sync API Tests
// ============================================

test.describe('Sync API', () => {
  test('GET /sync/state - get sync state', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/sync/state`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required - dev bypass not enabled');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    // Verify sync state structure
    expect(data).toHaveProperty('versions');
    expect(data).toHaveProperty('server_time');
  });

  test('POST /sync/poll - poll for updates', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/sync/poll`, {
      data: {
        client_versions: {},
        include_data: true,
      },
    });

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('updates');
    expect(data).toHaveProperty('server_time');
  });
});

// ============================================
// Settings API Tests
// ============================================

test.describe('Settings API', () => {
  test('GET /settings - get user settings', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/settings`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required - dev bypass not enabled');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('data');
  });

  test('PATCH /settings - update settings', async ({ request }) => {
    const response = await request.patch(`${API_BASE_URL}/settings`, {
      data: {
        theme: 'dark',
        notifications_enabled: true,
      },
    });

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect([200, 204]).toContain(response.status());
  });
});

// ============================================
// User API Tests
// ============================================

test.describe('User API', () => {
  test('GET /user/profile - get user profile', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/user/profile`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required - dev bypass not enabled');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('data');
  });

  test('GET /user/stats - get user stats', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/user/stats`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
  });
});

// ============================================
// Today Dashboard API Tests
// ============================================

test.describe('Today Dashboard API', () => {
  test('GET /today - get today dashboard data', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/today`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required - dev bypass not enabled');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('data');
  });

  test('GET /today/summary - get today summary', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/today/summary`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
  });
});

// ============================================
// Gamification API Tests
// ============================================

test.describe('Gamification API', () => {
  test('GET /gamification/stats - get gamification stats', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/gamification/stats`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required - dev bypass not enabled');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('data');
  });

  test('GET /gamification/achievements - get achievements', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/gamification/achievements`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
  });

  test('GET /gamification/leaderboard - get leaderboard', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/gamification/leaderboard`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
  });
});
