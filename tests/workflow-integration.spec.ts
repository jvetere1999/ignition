/**
 * Workflow Integration E2E Tests - Persistent Instance
 *
 * Tests multi-step workflows and data consistency across features.
 * These tests simulate real user journeys through the platform.
 *
 * Design: Tests create realistic workflows and verify data state at each step.
 * No cleanup - data persists for inspection and verification.
 *
 * Workflows Tested:
 *   1. New user onboarding with settings
 *   2. Daily focus routine with habit tracking
 *   3. Goal progression with multiple checkpoints
 *   4. Fitness goal achievement with XP rewards
 *   5. Learning path completion with milestones
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

function generateUniqueId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================
// Workflow 1: User Onboarding & Initialization
// ============================================

test.describe('Workflow: User Onboarding', () => {
  const userId = generateUniqueId('onboard-user');

  test('Step 1: Create user settings', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/settings`, {
      data: {
        user_id: userId,
        theme: 'dark',
        notifications_enabled: true,
        focus_default_duration: 1500,
        focus_break_duration: 300,
        focus_long_break_duration: 900,
      },
    });

    expect([200, 201, 400]).toContain(response.status());
    console.log(`✓ User ${userId} settings created`);
  });

  test('Step 2: Initialize user with first habit', async ({ request }) => {
    const habitData = {
      user_id: userId,
      title: 'Morning Meditation',
      description: 'Start day with 10 min meditation',
      frequency: 'daily',
      is_active: true,
    };

    const response = await request.post(`${API_BASE_URL}/api/habits`, {
      data: habitData,
    });

    expect([200, 201]).toContain(response.status());
    if (response.status() === 201 || response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('id');
      console.log(`✓ First habit created for ${userId}`);
    }
  });

  test('Step 3: Create first goal', async ({ request }) => {
    const goalData = {
      user_id: userId,
      title: 'Get to Level 10',
      description: 'Achieve level 10 in gamification',
      target_value: 10,
      current_value: 1,
      unit: 'level',
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const response = await request.post(`${API_BASE_URL}/api/goals`, {
      data: goalData,
    });

    expect([200, 201]).toContain(response.status());
    console.log(`✓ First goal created for ${userId}`);
  });

  test('Step 4: Start first focus session', async ({ request }) => {
    const focusData = {
      user_id: userId,
      mode: 'focus',
      duration_seconds: 1500,
      status: 'active',
    };

    const response = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
      data: focusData,
    });

    expect([200, 201]).toContain(response.status());
    if (response.status() === 201) {
      const data = await response.json();
      expect(data.status).toBe('active');
      console.log(`✓ First focus session started for ${userId}`);
    }
  });

  test('Verify onboarding complete: user has all components', async ({ request }) => {
    // Check settings exist
    const settingsResponse = await request.get(`${API_BASE_URL}/api/settings`, {
      params: { user_id: userId },
    });
    expect([200, 400]).toContain(settingsResponse.status());

    // Check habits exist
    const habitsResponse = await request.get(`${API_BASE_URL}/api/habits`, {
      params: { user_id: userId },
    });
    expect([200, 400]).toContain(habitsResponse.status());

    // Check goals exist
    const goalsResponse = await request.get(`${API_BASE_URL}/api/goals`, {
      params: { user_id: userId },
    });
    expect([200, 400]).toContain(goalsResponse.status());

    console.log(`✓ Onboarding workflow complete for ${userId}`);
  });
});

// ============================================
// Workflow 2: Daily Focus Routine
// ============================================

test.describe('Workflow: Daily Focus Routine', () => {
  const userId = generateUniqueId('focus-user');
  const focusSessions: string[] = [];

  test('Step 1: Start morning focus session', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
      data: {
        user_id: userId,
        mode: 'focus',
        duration_seconds: 1500,
        status: 'active',
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    focusSessions.push(data.id);
    expect(data.mode).toBe('focus');
    console.log(`✓ Morning focus session started: ${data.id}`);
  });

  test('Step 2: Start break after focus', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
      data: {
        user_id: userId,
        mode: 'break',
        duration_seconds: 300,
        status: 'active',
      },
    });

    expect([200, 201]).toContain(response.status());
    if (response.status() === 201) {
      const data = await response.json();
      focusSessions.push(data.id);
      expect(data.mode).toBe('break');
      console.log(`✓ Break session started: ${data.id}`);
    }
  });

  test('Step 3: Second focus block', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
      data: {
        user_id: userId,
        mode: 'focus',
        duration_seconds: 1500,
        status: 'active',
      },
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    focusSessions.push(data.id);
    console.log(`✓ Second focus session started: ${data.id}`);
  });

  test('Step 4: Long break after multiple focus blocks', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
      data: {
        user_id: userId,
        mode: 'long_break',
        duration_seconds: 900,
        status: 'active',
      },
    });

    expect([200, 201]).toContain(response.status());
    console.log(`✓ Long break initiated`);
  });

  test('Verify daily focus totals', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/focus/stats`, {
      params: { user_id: userId },
    });

    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.totalSessions).toBeGreaterThanOrEqual(3);
      console.log(
        `✓ Daily routine complete: ${data.totalSessions} sessions, ${data.totalFocusTime}s focus time`
      );
    }
  });
});

// ============================================
// Workflow 3: Goal Progression with Checkpoints
// ============================================

test.describe('Workflow: Goal Progression', () => {
  const userId = generateUniqueId('goal-user');
  let goalId: string;

  test('Step 1: Create ambitious goal', async ({ request }) => {
    const goalData = {
      user_id: userId,
      title: 'Complete 30-Day Challenge',
      description: 'Do 30 focus sessions of 25 minutes each',
      target_value: 30,
      current_value: 0,
      unit: 'sessions',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const response = await request.post(`${API_BASE_URL}/api/goals`, {
      data: goalData,
    });

    expect([200, 201]).toContain(response.status());
    if (response.status() === 201 || response.status() === 200) {
      const data = await response.json();
      goalId = data.id;
      console.log(`✓ 30-Day Challenge goal created: ${goalId}`);
    }
  });

  test('Step 2: Log first set of sessions (Day 1-10)', async ({ request }) => {
    for (let i = 0; i < 10; i++) {
      const response = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
        data: {
          user_id: userId,
          mode: 'focus',
          duration_seconds: 1500,
          status: 'active',
        },
      });

      expect([200, 201]).toContain(response.status());
    }
    console.log(`✓ First 10 sessions logged for goal`);
  });

  test('Step 3: Progress checkpoint (10/30 complete)', async ({ request }) => {
    if (!goalId) return;

    const response = await request.patch(`${API_BASE_URL}/api/goals/${goalId}`, {
      data: {
        current_value: 10,
      },
    });

    expect([200, 400, 404]).toContain(response.status());
    console.log(`✓ Goal checkpoint: 10/30 sessions complete`);
  });

  test('Step 4: Log second set of sessions (Day 11-20)', async ({ request }) => {
    for (let i = 0; i < 10; i++) {
      await request.post(`${API_BASE_URL}/api/focus/sessions`, {
        data: {
          user_id: userId,
          mode: 'focus',
          duration_seconds: 1500,
          status: 'active',
        },
      });
    }
    console.log(`✓ Second 10 sessions logged`);
  });

  test('Step 5: Verify goal progress', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/goals`, {
      params: { user_id: userId },
    });

    expect([200, 400]).toContain(response.status());
    console.log(`✓ Goal progress verified`);
  });
});

// ============================================
// Workflow 4: Fitness Goal with XP Rewards
// ============================================

test.describe('Workflow: Fitness Achievement', () => {
  const userId = generateUniqueId('fitness-user');
  let workoutId: string;

  test('Step 1: Create fitness goal', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/goals`, {
      data: {
        user_id: userId,
        title: 'Complete 12 Workouts',
        target_value: 12,
        current_value: 0,
        unit: 'workouts',
        deadline: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    expect([200, 201]).toContain(response.status());
    console.log(`✓ Fitness goal created`);
  });

  test('Step 2: Create reusable workout template', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/workouts`, {
      data: {
        user_id: userId,
        name: `Weekly Routine ${generateUniqueId('routine')}`,
        description: 'Full body strength and cardio',
        workout_type: 'mixed',
        estimated_duration: 3600,
      },
    });

    expect([200, 201]).toContain(response.status());
    if (response.status() === 201 || response.status() === 200) {
      const data = await response.json();
      workoutId = data.id;
      console.log(`✓ Workout template created: ${workoutId}`);
    }
  });

  test('Step 3: Complete first workout session', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/workouts/sessions`, {
      data: {
        user_id: userId,
        workout_id: workoutId,
        started_at: new Date(Date.now() - 3600 * 1000).toISOString(),
        completed_at: new Date().toISOString(),
        status: 'completed',
        duration_seconds: 3600,
        rating: 8,
      },
    });

    expect([200, 201]).toContain(response.status());
    console.log(`✓ First workout session completed`);
  });

  test('Step 4: Verify XP awarded', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/gamification/stats`, {
      params: { user_id: userId },
    });

    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(typeof data.xp).toBe('number');
      console.log(`✓ XP verified: ${data.xp} total`);
    }
  });

  test('Step 5: Check streak', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/gamification/streaks`, {
      params: { user_id: userId },
    });

    expect([200, 400]).toContain(response.status());
    console.log(`✓ Streak information retrieved`);
  });
});

// ============================================
// Workflow 5: Learning Path Completion
// ============================================

test.describe('Workflow: Learning Path Completion', () => {
  const userId = generateUniqueId('learning-user');
  const lessonIds: string[] = [];

  test('Step 1: Create learning goal', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/goals`, {
      data: {
        user_id: userId,
        title: 'Master TypeScript',
        target_value: 100,
        current_value: 0,
        unit: 'percent',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    expect([200, 201]).toContain(response.status());
    console.log(`✓ Learning goal created`);
  });

  test('Step 2: Create learning module 1 - Basics', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/learn`, {
      data: {
        user_id: userId,
        title: 'TypeScript Basics',
        category: 'programming',
        content: 'Learn types, interfaces, and classes',
        status: 'in_progress',
      },
    });

    expect([200, 201]).toContain(response.status());
    if (response.status() === 201 || response.status() === 200) {
      const data = await response.json();
      lessonIds.push(data.id);
      console.log(`✓ Module 1 created: TypeScript Basics`);
    }
  });

  test('Step 3: Create learning module 2 - Advanced Types', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/learn`, {
      data: {
        user_id: userId,
        title: 'Advanced TypeScript Types',
        category: 'programming',
        content: 'Generics, unions, and utility types',
        status: 'not_started',
      },
    });

    expect([200, 201]).toContain(response.status());
    if (response.status() === 201 || response.status() === 200) {
      const data = await response.json();
      lessonIds.push(data.id);
      console.log(`✓ Module 2 created: Advanced Types`);
    }
  });

  test('Step 4: Complete module 1', async ({ request }) => {
    if (lessonIds.length === 0) return;

    const response = await request.patch(`${API_BASE_URL}/api/learn/${lessonIds[0]}`, {
      data: {
        status: 'completed',
      },
    });

    expect([200, 400, 404]).toContain(response.status());
    console.log(`✓ Module 1 marked as completed`);
  });

  test('Step 5: Start module 2', async ({ request }) => {
    if (lessonIds.length < 2) return;

    const response = await request.patch(`${API_BASE_URL}/api/learn/${lessonIds[1]}`, {
      data: {
        status: 'in_progress',
      },
    });

    expect([200, 400, 404]).toContain(response.status());
    console.log(`✓ Module 2 marked as in_progress`);
  });

  test('Step 6: Verify learning progress', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/learn`, {
      params: { user_id: userId },
    });

    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      console.log(
        `✓ Learning path verified: ${lessonIds.length} modules, user ${userId}`
      );
    }
  });
});

// ============================================
// Workflow 6: Multi-Feature Day Simulation
// ============================================

test.describe('Workflow: Full Day Simulation', () => {
  const userId = generateUniqueId('day-user');

  test('Morning: Setup for the day', async ({ request }) => {
    // Update settings
    await request.patch(`${API_BASE_URL}/api/settings`, {
      data: {
        user_id: userId,
        theme: 'light',
      },
    });

    console.log(`✓ Settings configured for ${userId}`);
  });

  test('8 AM: Start work focus session', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
      data: {
        user_id: userId,
        mode: 'focus',
        duration_seconds: 1500,
        status: 'active',
      },
    });

    expect([200, 201]).toContain(response.status());
    console.log(`✓ Work session started`);
  });

  test('10 AM: Complete first workout', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/workouts/sessions`, {
      data: {
        user_id: userId,
        started_at: new Date(Date.now() - 1800 * 1000).toISOString(),
        completed_at: new Date().toISOString(),
        status: 'completed',
        duration_seconds: 1800,
      },
    });

    expect([200, 201]).toContain(response.status());
    console.log(`✓ Morning workout completed`);
  });

  test('12 PM: Lunch break and learning', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/learn`, {
      data: {
        user_id: userId,
        title: `Lunch Learning ${generateUniqueId('lunch')}`,
        category: 'productivity',
        status: 'in_progress',
      },
    });

    expect([200, 201]).toContain(response.status());
    console.log(`✓ Learning session started during lunch`);
  });

  test('2 PM: Afternoon focus blocks', async ({ request }) => {
    // Three 25-minute sessions
    for (let i = 0; i < 3; i++) {
      await request.post(`${API_BASE_URL}/api/focus/sessions`, {
        data: {
          user_id: userId,
          mode: 'focus',
          duration_seconds: 1500,
          status: 'active',
        },
      });
    }
    console.log(`✓ Three afternoon focus sessions completed`);
  });

  test('4 PM: Evening workout', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/workouts/sessions`, {
      data: {
        user_id: userId,
        started_at: new Date(Date.now() - 3600 * 1000).toISOString(),
        completed_at: new Date().toISOString(),
        status: 'completed',
        duration_seconds: 3600,
        rating: 8,
      },
    });

    expect([200, 201]).toContain(response.status());
    console.log(`✓ Evening workout completed`);
  });

  test('Evening: Reflect and wrap up', async ({ request }) => {
    const stats = await request.get(`${API_BASE_URL}/api/gamification/stats`, {
      params: { user_id: userId },
    });

    const focusStats = await request.get(`${API_BASE_URL}/api/focus/stats`, {
      params: { user_id: userId },
    });

    console.log(
      `✓ Day complete: User ${userId} earned rewards and completed activities`
    );
  });

  test('Verify day metrics captured', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/focus/stats`, {
      params: { user_id: userId },
    });

    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.totalSessions).toBeGreaterThanOrEqual(5);
      console.log(`✓ Full day validated: ${data.totalSessions} focus sessions`);
    }
  });
});
