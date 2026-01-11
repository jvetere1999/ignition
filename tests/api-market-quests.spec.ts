/**
 * Market & Quests E2E API Tests
 *
 * Tests for marketplace and quests/missions endpoints.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

// ============================================
// Market API Tests
// ============================================

test.describe('Market API', () => {
  test('GET /market - list market items', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/market`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required - dev bypass not enabled');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('data');
  });

  test('GET /market/categories - get market categories', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/market/categories`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
  });

  test('GET /market/inventory - get user inventory', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/market/inventory`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('data');
  });
});

// ============================================
// Quests API Tests
// ============================================

test.describe('Quests API', () => {
  test('GET /quests - list quests', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/quests`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required - dev bypass not enabled');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('data');
  });

  test('GET /quests/active - get active quests', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/quests/active`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
  });

  test('GET /quests/completed - get completed quests', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/quests/completed`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
  });
});

// ============================================
// Calendar API Tests
// ============================================

test.describe('Calendar API', () => {
  test('GET /calendar - get calendar events', async ({ request }) => {
    const today = new Date().toISOString().split('T')[0];
    const response = await request.get(`${API_BASE_URL}/calendar`, {
      params: { date: today },
    });

    if (response.status() === 401) {
      test.skip(true, 'Auth required - dev bypass not enabled');
      return;
    }

    expect(response.status()).toBe(200);
  });

  test('GET /calendar/week - get week view', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/calendar/week`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
  });
});

// ============================================
// Daily Plan API Tests
// ============================================

test.describe('Daily Plan API', () => {
  test('GET /daily-plan - get daily plan', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/daily-plan`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required - dev bypass not enabled');
      return;
    }

    expect(response.status()).toBe(200);
  });

  test('POST /daily-plan/tasks - add task to daily plan', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/daily-plan/tasks`, {
      data: {
        title: 'E2E Test Task',
        priority: 'medium',
        estimated_minutes: 30,
      },
    });

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect([200, 201]).toContain(response.status());
  });
});
