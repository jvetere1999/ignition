/**
 * Habits & Goals E2E API Tests
 *
 * Tests for habits tracking and goals management endpoints.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

let createdHabitId: string | null = null;
let createdGoalId: string | null = null;
let createdMilestoneId: string | null = null;

// ============================================
// Habits Tests
// ============================================

test.describe('Habits API', () => {
  test.describe.configure({ mode: 'serial' });

  test('POST /habits - create habit', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/habits`, {
      data: {
        name: 'E2E Test Habit',
        description: 'Created by E2E tests',
        frequency: 'daily',
        target_count: 1,
        icon: '🎯',
        color: '#4CAF50',
      },
    });

    if (response.status() === 401) {
      test.skip(true, 'Auth required - dev bypass not enabled');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data).toHaveProperty('id');
    expect(data.data.name).toBe('E2E Test Habit');
    createdHabitId = data.data.id;
  });

  test('GET /habits - list habits', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/habits`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data).toHaveProperty('habits');
    expect(Array.isArray(data.data.habits)).toBe(true);
  });

  test('POST /habits/{id}/complete - complete habit', async ({ request }) => {
    if (!createdHabitId) {
      test.skip(true, 'No habit created');
      return;
    }

    const response = await request.post(`${API_BASE_URL}/habits/${createdHabitId}/complete`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data).toHaveProperty('completed');
  });
});

// ============================================
// Goals Tests
// ============================================

test.describe('Goals API', () => {
  test.describe.configure({ mode: 'serial' });

  test('POST /goals - create goal', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/goals`, {
      data: {
        title: 'E2E Test Goal',
        description: 'Created by E2E tests',
        category: 'personal',
        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      },
    });

    if (response.status() === 401) {
      test.skip(true, 'Auth required - dev bypass not enabled');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data).toHaveProperty('id');
    expect(data.data.title).toBe('E2E Test Goal');
    createdGoalId = data.data.id;
  });

  test('GET /goals - list goals', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/goals`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data).toHaveProperty('goals');
    expect(Array.isArray(data.data.goals)).toBe(true);
  });

  test('GET /goals/{id} - get goal by ID', async ({ request }) => {
    if (!createdGoalId) {
      test.skip(true, 'No goal created');
      return;
    }

    const response = await request.get(`${API_BASE_URL}/goals/${createdGoalId}`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data.id).toBe(createdGoalId);
  });

  test('POST /goals/{id}/milestones - add milestone', async ({ request }) => {
    if (!createdGoalId) {
      test.skip(true, 'No goal created');
      return;
    }

    const response = await request.post(`${API_BASE_URL}/goals/${createdGoalId}/milestones`, {
      data: {
        title: 'E2E Test Milestone',
        description: 'First milestone',
        target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      },
    });

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data).toHaveProperty('id');
    createdMilestoneId = data.data.id;
  });

  test('POST /goals/milestones/{id}/complete - complete milestone', async ({ request }) => {
    if (!createdMilestoneId) {
      test.skip(true, 'No milestone created');
      return;
    }

    const response = await request.post(`${API_BASE_URL}/goals/milestones/${createdMilestoneId}/complete`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data).toHaveProperty('completed');
  });
});
