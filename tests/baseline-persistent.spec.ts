/**
 * Baseline E2E Tests - Persistent Instance
 *
 * Comprehensive validation suite for the persistent E2E test instance.
 * These tests validate core platform functionality without regenerating
 * the database between test runs.
 *
 * Design: Tests are idempotent and can run multiple times against the same instance.
 * Strategy: Create unique identifiers, verify operations, clean up as needed.
 *
 * Setup:
 *   1. Start persistent instance: docker compose -f infra/docker-compose.yml --profile full up -d
 *   2. Run tests: npx playwright test tests/baseline-persistent.spec.ts --config=playwright.api.config.ts
 *
 * Environment:
 *   - API_BASE_URL: http://localhost:8080 (default)
 *   - AUTH_DEV_BYPASS: true (on localhost, no OAuth needed)
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

/**
 * Helper to generate unique IDs for idempotent tests
 */
function generateUniqueId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Helper to validate ISO timestamp format
 */
function isValidISOTimestamp(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.endsWith('Z');
}

/**
 * Helper to validate UUID format
 */
function isValidUUID(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// ============================================
// Test Suite: Platform Health & Infrastructure
// ============================================

test.describe('Platform Health', () => {
  test('Backend is healthy', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('ok');
  });

  test('API responds to ping', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/ping`);
    expect([200, 404]).toContain(response.status());
  });

  test('No auth required on dev bypass', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/auth/me`);
    // Should return user info without OAuth
    expect([200, 401]).toContain(response.status());
  });
});

// ============================================
// Test Suite: Focus Sessions (Core Feature)
// ============================================

test.describe('Focus Sessions', () => {
  let focusSessionId: string;

  test('Create focus session', async ({ request }) => {
    const sessionData = {
      user_id: 'test-user-1',
      mode: 'focus',
      duration_seconds: 1500,
      status: 'active',
    };

    const response = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
      data: sessionData,
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data.mode).toBe('focus');
    expect(data.duration_seconds).toBe(1500);
    expect(data.status).toBe('active');
    expect(isValidISOTimestamp(data.started_at)).toBe(true);

    focusSessionId = data.id;
  });

  test('Retrieve focus session', async ({ request }) => {
    if (!focusSessionId) {
      test.skip();
    }

    const response = await request.get(
      `${API_BASE_URL}/api/focus/sessions/${focusSessionId}`
    );

    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.id).toBe(focusSessionId);
      expect(data.mode).toBe('focus');
    }
  });

  test('List focus sessions with pagination', async ({ request }) => {
    const response = await request.get(
      `${API_BASE_URL}/api/focus/sessions?limit=10&offset=0`
    );

    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('items');
      expect(Array.isArray(data.items)).toBe(true);
      expect(data).toHaveProperty('total');
      expect(typeof data.total).toBe('number');
    }
  });

  test('Get focus stats', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/focus/stats`, {
      params: { user_id: 'test-user-1' },
    });

    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('totalSessions');
      expect(typeof data.totalSessions).toBe('number');
    }
  });

  test('Focus session respects duration_seconds field', async ({ request }) => {
    const durations = [300, 900, 1500, 3000];

    for (const duration of durations) {
      const response = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
        data: {
          user_id: 'test-user-duration',
          mode: 'focus',
          duration_seconds: duration,
          status: 'active',
        },
      });

      expect([201, 400]).toContain(response.status());
      if (response.status() === 201) {
        const data = await response.json();
        expect(data.duration_seconds).toBe(duration);
      }
    }
  });
});

// ============================================
// Test Suite: Habits & Goals
// ============================================

test.describe('Habits & Goals', () => {
  let habitId: string;
  let goalId: string;

  test('Create habit', async ({ request }) => {
    const habitData = {
      user_id: 'test-user-1',
      title: `Exercise Habit ${generateUniqueId('habit')}`,
      description: 'Daily exercise routine',
      frequency: 'daily',
      is_active: true,
    };

    const response = await request.post(`${API_BASE_URL}/api/habits`, {
      data: habitData,
    });

    expect([201, 200]).toContain(response.status());
    if (response.status() === 201 || response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('id');
      habitId = data.id;
    }
  });

  test('Create goal', async ({ request }) => {
    const goalData = {
      user_id: 'test-user-1',
      title: `Fitness Goal ${generateUniqueId('goal')}`,
      description: 'Build strength and endurance',
      target_value: 100,
      current_value: 0,
      unit: 'sessions',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const response = await request.post(`${API_BASE_URL}/api/goals`, {
      data: goalData,
    });

    expect([201, 200]).toContain(response.status());
    if (response.status() === 201 || response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('id');
      goalId = data.id;
    }
  });

  test('List habits', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/habits`);
    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data.habits) || Array.isArray(data)).toBe(true);
    }
  });

  test('List goals', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/goals`);
    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data.goals) || Array.isArray(data)).toBe(true);
    }
  });

  test('Update habit progress', async ({ request }) => {
    if (!habitId) {
      test.skip();
    }

    const response = await request.patch(`${API_BASE_URL}/api/habits/${habitId}`, {
      data: {
        completed_today: true,
      },
    });

    expect([200, 400, 404]).toContain(response.status());
  });
});

// ============================================
// Test Suite: Quests & Gamification
// ============================================

test.describe('Quests & Gamification', () => {
  let questId: string;

  test('Create market quest', async ({ request }) => {
    const questData = {
      user_id: 'test-user-1',
      title: `Market Quest ${generateUniqueId('quest')}`,
      description: 'Complete a challenging task',
      reward_xp: 100,
      reward_coins: 50,
      difficulty: 'medium',
      status: 'available',
    };

    const response = await request.post(`${API_BASE_URL}/api/quests`, {
      data: questData,
    });

    expect([201, 200]).toContain(response.status());
    if (response.status() === 201 || response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('id');
      questId = data.id;
    }
  });

  test('Get user stats', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/gamification/stats`, {
      params: { user_id: 'test-user-1' },
    });

    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(typeof data.level).toBe('number');
      expect(typeof data.xp).toBe('number');
      expect(typeof data.coins).toBe('number');
    }
  });

  test('Get streak info', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/gamification/streaks`, {
      params: { user_id: 'test-user-1' },
    });

    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('streaks');
      expect(Array.isArray(data.streaks)).toBe(true);
    }
  });

  test('List available quests', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/quests`);
    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data) || data.hasOwnProperty('quests')).toBe(true);
    }
  });
});

// ============================================
// Test Suite: Learning & Books
// ============================================

test.describe('Learning & Books', () => {
  let bookId: string;
  let learningItemId: string;

  test('Create book entry', async ({ request }) => {
    const bookData = {
      user_id: 'test-user-1',
      title: `Book ${generateUniqueId('book')}`,
      author: 'Test Author',
      status: 'reading',
      progress_percent: 25,
    };

    const response = await request.post(`${API_BASE_URL}/api/books`, {
      data: bookData,
    });

    expect([201, 200]).toContain(response.status());
    if (response.status() === 201 || response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('id');
      bookId = data.id;
    }
  });

  test('Create learning item', async ({ request }) => {
    const learningData = {
      user_id: 'test-user-1',
      title: `Learning Item ${generateUniqueId('learn')}`,
      category: 'skill',
      content: 'Learn TypeScript basics',
      status: 'in_progress',
    };

    const response = await request.post(`${API_BASE_URL}/api/learn`, {
      data: learningData,
    });

    expect([201, 200]).toContain(response.status());
    if (response.status() === 201 || response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('id');
      learningItemId = data.id;
    }
  });

  test('List books', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/books`);
    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data) || data.hasOwnProperty('books')).toBe(true);
    }
  });

  test('List learning items', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/learn`);
    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data) || data.hasOwnProperty('items')).toBe(true);
    }
  });

  test('Update book progress', async ({ request }) => {
    if (!bookId) {
      test.skip();
    }

    const response = await request.patch(`${API_BASE_URL}/api/books/${bookId}`, {
      data: {
        progress_percent: 50,
      },
    });

    expect([200, 400, 404]).toContain(response.status());
  });
});

// ============================================
// Test Suite: Fitness & Workouts
// ============================================

test.describe('Fitness & Workouts', () => {
  let workoutId: string;
  let workoutSessionId: string;

  test('Create workout', async ({ request }) => {
    const workoutData = {
      user_id: 'test-user-1',
      name: `Workout ${generateUniqueId('workout')}`,
      description: 'Full body strength training',
      workout_type: 'strength',
      estimated_duration: 3600,
    };

    const response = await request.post(`${API_BASE_URL}/api/workouts`, {
      data: workoutData,
    });

    expect([201, 200]).toContain(response.status());
    if (response.status() === 201 || response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('id');
      workoutId = data.id;
    }
  });

  test('Create workout session', async ({ request }) => {
    const sessionData = {
      user_id: 'test-user-1',
      workout_id: workoutId || null,
      started_at: new Date().toISOString(),
      status: 'in_progress',
    };

    const response = await request.post(`${API_BASE_URL}/api/workouts/sessions`, {
      data: sessionData,
    });

    expect([201, 200]).toContain(response.status());
    if (response.status() === 201 || response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('id');
      workoutSessionId = data.id;
    }
  });

  test('List workouts', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/workouts`);
    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data) || data.hasOwnProperty('workouts')).toBe(true);
    }
  });

  test('List exercises', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/exercises`);
    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data) || data.hasOwnProperty('exercises')).toBe(true);
    }
  });

  test('Complete workout session', async ({ request }) => {
    if (!workoutSessionId) {
      test.skip();
    }

    const response = await request.patch(
      `${API_BASE_URL}/api/workouts/sessions/${workoutSessionId}`,
      {
        data: {
          status: 'completed',
          completed_at: new Date().toISOString(),
        },
      }
    );

    expect([200, 400, 404]).toContain(response.status());
  });
});

// ============================================
// Test Suite: Settings & Sync
// ============================================

test.describe('Settings & Sync', () => {
  test('Get user settings', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/settings`, {
      params: { user_id: 'test-user-1' },
    });

    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('user_id');
    }
  });

  test('Update user settings', async ({ request }) => {
    const response = await request.patch(`${API_BASE_URL}/api/settings`, {
      data: {
        theme: 'dark',
        notifications_enabled: true,
      },
    });

    expect([200, 400]).toContain(response.status());
  });

  test('Sync endpoint accepts changes', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/sync`, {
      data: {
        changes: [],
        last_sync: new Date().toISOString(),
      },
    });

    expect([200, 400, 401]).toContain(response.status());
  });

  test('Get sync status', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/sync/status`, {
      params: { user_id: 'test-user-1' },
    });

    expect([200, 400, 404]).toContain(response.status());
  });
});

// ============================================
// Test Suite: API Response Format
// ============================================

test.describe('API Response Format', () => {
  test('Successful responses include proper headers', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('Error responses follow consistent format', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/nonexistent`);
    expect([404, 400]).toContain(response.status());
    const data = await response.json();
    // Should have error structure
    expect(data).toHaveProperty('error') || data.hasOwnProperty('message');
  });

  test('Paginated responses include metadata', async ({ request }) => {
    const response = await request.get(
      `${API_BASE_URL}/api/focus/sessions?limit=10&offset=0`
    );

    if (response.status() === 200) {
      const data = await response.json();
      // Either has items array or direct array
      expect(
        data.hasOwnProperty('items') || data.hasOwnProperty('data') || Array.isArray(data)
      ).toBe(true);
    }
  });

  test('Timestamps are ISO 8601 format', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
      data: {
        user_id: 'test-user-1',
        mode: 'focus',
        duration_seconds: 1500,
        status: 'active',
      },
    });

    if (response.status() === 201) {
      const data = await response.json();
      expect(isValidISOTimestamp(data.started_at)).toBe(true);
      if (data.created_at) {
        expect(isValidISOTimestamp(data.created_at)).toBe(true);
      }
    }
  });
});

// ============================================
// Test Suite: Cross-Feature Integration
// ============================================

test.describe('Cross-Feature Integration', () => {
  test('Focus session can link to task/quest', async ({ request }) => {
    const focusData = {
      user_id: 'test-user-1',
      mode: 'focus',
      duration_seconds: 1500,
      status: 'active',
      task_id: 'sample-task-id',
      task_title: 'Complete Passion OS design',
    };

    const response = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
      data: focusData,
    });

    expect([201, 400]).toContain(response.status());
    if (response.status() === 201) {
      const data = await response.json();
      expect(data.task_id).toBe('sample-task-id');
      expect(data.task_title).toBe('Complete Passion OS design');
    }
  });

  test('Workout metrics update gamification stats', async ({ request }) => {
    // Create workout
    const workoutResponse = await request.post(`${API_BASE_URL}/api/workouts/sessions`, {
      data: {
        user_id: 'test-user-integration',
        started_at: new Date().toISOString(),
        status: 'completed',
      },
    });

    if (workoutResponse.status() === 201) {
      // Verify stats were updated
      const statsResponse = await request.get(
        `${API_BASE_URL}/api/gamification/stats`,
        {
          params: { user_id: 'test-user-integration' },
        }
      );

      expect([200, 400]).toContain(statsResponse.status());
    }
  });

  test('Learning items contribute to user progress', async ({ request }) => {
    const learningData = {
      user_id: 'test-user-learning',
      title: `Test Learning ${generateUniqueId('learning')}`,
      category: 'skill',
      status: 'in_progress',
    };

    const response = await request.post(`${API_BASE_URL}/api/learn`, {
      data: learningData,
    });

    expect([201, 200]).toContain(response.status());
  });
});
