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
    const response = await request.post(`${API_BASE_URL}/api/habits`, {
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

    expect(response.status()).toBe(201);
    const data = await response.json() as { habit?: { id?: string; name?: string } };
    expect(data).toHaveProperty('habit');
    expect(data.habit?.name).toBe('E2E Test Habit');
    createdHabitId = data.habit?.id || null;
  });

  test('GET /habits - list habits', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/habits`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json() as { habits?: unknown[]; total?: number };
    expect(data).toHaveProperty('habits');
    expect(Array.isArray(data.habits)).toBe(true);
    expect(typeof data.total).toBe('number');
  });

  test('POST /habits/{id}/complete - complete habit', async ({ request }) => {
    if (!createdHabitId) {
      test.skip(true, 'No habit created');
      return;
    }

    const response = await request.post(`${API_BASE_URL}/api/habits/${createdHabitId}/complete`, {
      data: {
        notes: 'Completed in E2E test',
      },
    });

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json() as { result?: { habit?: { id?: string }; new_streak?: number } };
    expect(data).toHaveProperty('result');
    expect(data.result?.habit?.id).toBe(createdHabitId);
    expect(typeof data.result?.new_streak).toBe('number');
  });

  test('GET /habits/analytics - returns habit analytics summary', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/habits/analytics`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json() as {
      analytics?: {
        total_habits?: number;
        active_habits?: number;
        completed_today?: number;
        total_completions?: number;
        completions_last_7_days?: number;
        completions_last_30_days?: number;
        completion_rate_7_days?: number;
        completion_rate_30_days?: number;
        longest_streak?: number;
        active_streaks?: number;
      };
    };
    expect(data).toHaveProperty('analytics');
    expect(typeof data.analytics?.total_habits).toBe('number');
    expect(typeof data.analytics?.active_habits).toBe('number');
    expect(typeof data.analytics?.completed_today).toBe('number');
    expect(typeof data.analytics?.total_completions).toBe('number');
    expect(typeof data.analytics?.completions_last_7_days).toBe('number');
    expect(typeof data.analytics?.completions_last_30_days).toBe('number');
    expect(typeof data.analytics?.completion_rate_7_days).toBe('number');
    expect(typeof data.analytics?.completion_rate_30_days).toBe('number');
    expect(typeof data.analytics?.longest_streak).toBe('number');
    expect(typeof data.analytics?.active_streaks).toBe('number');
  });
});

// ============================================
// Goals Tests
// ============================================

test.describe('Goals API', () => {
  test.describe.configure({ mode: 'serial' });

  test('POST /goals - create goal', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/goals`, {
      data: {
        title: 'E2E Test Goal',
        description: 'Created by E2E tests',
        category: 'personal',
        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    });

    if (response.status() === 401) {
      test.skip(true, 'Auth required - dev bypass not enabled');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json() as { goal?: { id?: string; title?: string } };
    expect(data).toHaveProperty('goal');
    expect(data.goal?.title).toBe('E2E Test Goal');
    createdGoalId = data.goal?.id || null;
  });

  test('GET /goals - list goals', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/goals`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json() as { goals?: unknown[]; total?: number };
    expect(data).toHaveProperty('goals');
    expect(Array.isArray(data.goals)).toBe(true);
    expect(typeof data.total).toBe('number');
  });

  test('GET /goals/{id} - get goal by ID', async ({ request }) => {
    if (!createdGoalId) {
      test.skip(true, 'No goal created');
      return;
    }

    const response = await request.get(`${API_BASE_URL}/api/goals/${createdGoalId}`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json() as { goal?: { id?: string } };
    expect(data.goal?.id).toBe(createdGoalId);
  });

  test('POST /goals/{id}/milestones - add milestone', async ({ request }) => {
    if (!createdGoalId) {
      test.skip(true, 'No goal created');
      return;
    }

    const response = await request.post(`${API_BASE_URL}/api/goals/${createdGoalId}/milestones`, {
      data: {
        title: 'E2E Test Milestone',
        description: 'First milestone',
      },
    });

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json() as { milestone?: { id?: string } };
    expect(data).toHaveProperty('milestone');
    createdMilestoneId = data.milestone?.id || null;
  });

  test('POST /goals/milestones/{id}/complete - complete milestone', async ({ request }) => {
    if (!createdMilestoneId) {
      test.skip(true, 'No milestone created');
      return;
    }

    const response = await request.post(`${API_BASE_URL}/api/goals/milestones/${createdMilestoneId}/complete`);

    if (response.status() === 401) {
      test.skip(true, 'Auth required');
      return;
    }

    expect(response.status()).toBe(200);
    const data = await response.json() as { result?: { milestone?: { id?: string } } };
    expect(data).toHaveProperty('result');
    expect(data.result?.milestone?.id).toBe(createdMilestoneId);
  });
});
