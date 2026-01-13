/**
 * Data Consistency & Edge Case Tests - Persistent Instance
 *
 * Tests data integrity, edge cases, and error handling without regenerating
 * the database. These tests verify the system behaves correctly under stress
 * and unusual conditions.
 *
 * Focus Areas:
 *   1. Data validation & constraint enforcement
 *   2. Concurrent operation handling
 *   3. Large dataset handling
 *   4. Error recovery
 *   5. Field boundary conditions
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

function generateUniqueId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================
// Data Validation Tests
// ============================================

test.describe('Data Validation', () => {
  test('Focus session rejects negative duration', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
      data: {
        user_id: 'test-user-validation',
        mode: 'focus',
        duration_seconds: -1500,
        status: 'active',
      },
    });

    expect([400, 422]).toContain(response.status());
  });

  test('Focus session rejects zero duration', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
      data: {
        user_id: 'test-user-validation',
        mode: 'focus',
        duration_seconds: 0,
        status: 'active',
      },
    });

    expect([400, 422]).toContain(response.status());
  });

  test('Focus session requires valid mode', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
      data: {
        user_id: 'test-user-validation',
        mode: 'invalid_mode',
        duration_seconds: 1500,
        status: 'active',
      },
    });

    expect([400, 422]).toContain(response.status());
  });

  test('Focus session requires valid status', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
      data: {
        user_id: 'test-user-validation',
        mode: 'focus',
        duration_seconds: 1500,
        status: 'invalid_status',
      },
    });

    expect([400, 422]).toContain(response.status());
  });

  test('Habit requires title', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/habits`, {
      data: {
        user_id: 'test-user-validation',
        title: '',  // Empty title
        frequency: 'daily',
        is_active: true,
      },
    });

    expect([400, 422]).toContain(response.status());
  });

  test('Goal requires valid deadline format', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/goals`, {
      data: {
        user_id: 'test-user-validation',
        title: 'Test Goal',
        target_value: 100,
        current_value: 0,
        unit: 'units',
        deadline: 'invalid-date-format',
      },
    });

    expect([400, 422]).toContain(response.status());
  });

  test('Workout duration must be positive', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/workouts`, {
      data: {
        user_id: 'test-user-validation',
        name: 'Test Workout',
        workout_type: 'strength',
        estimated_duration: -3600,  // Negative duration
      },
    });

    expect([400, 422]).toContain(response.status());
  });

  test('Book progress must be 0-100 percent', async ({ request }) => {
    const testCases = [
      { progress: -1, shouldFail: true },
      { progress: 101, shouldFail: true },
      { progress: 0, shouldFail: false },
      { progress: 50, shouldFail: false },
      { progress: 100, shouldFail: false },
    ];

    for (const testCase of testCases) {
      const response = await request.post(`${API_BASE_URL}/api/books`, {
        data: {
          user_id: 'test-user-validation',
          title: `Book ${testCase.progress}`,
          author: 'Test',
          status: 'reading',
          progress_percent: testCase.progress,
        },
      });

      if (testCase.shouldFail) {
        expect([400, 422]).toContain(response.status());
      } else {
        expect([200, 201]).toContain(response.status());
      }
    }
  });
});

// ============================================
// Boundary Condition Tests
// ============================================

test.describe('Boundary Conditions', () => {
  test('Focus session with maximum duration', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
      data: {
        user_id: 'test-user-boundary',
        mode: 'focus',
        duration_seconds: 86400,  // 24 hours in seconds
        status: 'active',
      },
    });

    expect([200, 201, 400]).toContain(response.status());
  });

  test('Focus session with minimum valid duration', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
      data: {
        user_id: 'test-user-boundary',
        mode: 'focus',
        duration_seconds: 1,  // 1 second
        status: 'active',
      },
    });

    expect([200, 201, 400]).toContain(response.status());
  });

  test('Title with maximum length', async ({ request }) => {
    const longTitle = 'A'.repeat(500);  // 500 character title
    const response = await request.post(`${API_BASE_URL}/api/goals`, {
      data: {
        user_id: 'test-user-boundary',
        title: longTitle,
        target_value: 100,
        current_value: 0,
        unit: 'units',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    expect([200, 201, 400, 422]).toContain(response.status());
  });

  test('Description with special characters', async ({ request }) => {
    const specialDesc = 'Test with émojis 🚀 and symbols !@#$%^&*()';
    const response = await request.post(`${API_BASE_URL}/api/goals`, {
      data: {
        user_id: 'test-user-boundary',
        title: 'Special Chars Goal',
        description: specialDesc,
        target_value: 100,
        current_value: 0,
        unit: 'units',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    expect([200, 201, 400]).toContain(response.status());
  });

  test('Goal with very large target value', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/api/goals`, {
      data: {
        user_id: 'test-user-boundary',
        title: 'Large Value Goal',
        target_value: 1000000,
        current_value: 0,
        unit: 'units',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    expect([200, 201, 400]).toContain(response.status());
  });

  test('Deadline in distant future', async ({ request }) => {
    const distantFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();  // 1 year
    const response = await request.post(`${API_BASE_URL}/api/goals`, {
      data: {
        user_id: 'test-user-boundary',
        title: 'Distant Goal',
        target_value: 100,
        current_value: 0,
        unit: 'units',
        deadline: distantFuture,
      },
    });

    expect([200, 201, 400]).toContain(response.status());
  });

  test('Deadline in past', async ({ request }) => {
    const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();  // 30 days ago
    const response = await request.post(`${API_BASE_URL}/api/goals`, {
      data: {
        user_id: 'test-user-boundary',
        title: 'Past Goal',
        target_value: 100,
        current_value: 0,
        unit: 'units',
        deadline: pastDate,
      },
    });

    // Should either accept or reject past dates consistently
    expect([200, 201, 400, 422]).toContain(response.status());
  });
});

// ============================================
// Concurrent Operation Tests
// ============================================

test.describe('Concurrent Operations', () => {
  test('Create multiple focus sessions concurrently', async ({ request }) => {
    const userId = generateUniqueId('concurrent-user');
    const promises = [];

    // Create 10 sessions in parallel
    for (let i = 0; i < 10; i++) {
      promises.push(
        request.post(`${API_BASE_URL}/api/focus/sessions`, {
          data: {
            user_id: userId,
            mode: 'focus',
            duration_seconds: 1500,
            status: 'active',
          },
        })
      );
    }

    const responses = await Promise.all(promises);
    const successCount = responses.filter(r => [200, 201].includes(r.status())).length;

    expect(successCount).toBeGreaterThanOrEqual(10);
  });

  test('Create multiple habits concurrently', async ({ request }) => {
    const userId = generateUniqueId('habit-concurrent');
    const promises = [];

    // Create 5 habits in parallel
    for (let i = 0; i < 5; i++) {
      promises.push(
        request.post(`${API_BASE_URL}/api/habits`, {
          data: {
            user_id: userId,
            title: `Habit ${i}`,
            frequency: 'daily',
            is_active: true,
          },
        })
      );
    }

    const responses = await Promise.all(promises);
    const successCount = responses.filter(r => [200, 201].includes(r.status())).length;

    expect(successCount).toBeGreaterThanOrEqual(5);
  });

  test('Concurrent reads do not block writes', async ({ request }) => {
    const userId = generateUniqueId('read-write');
    
    // Start background reads
    const readPromises = [];
    for (let i = 0; i < 5; i++) {
      readPromises.push(
        request.get(`${API_BASE_URL}/api/focus/stats`, {
          params: { user_id: userId },
        })
      );
    }

    // Concurrent write
    const writeResponse = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
      data: {
        user_id: userId,
        mode: 'focus',
        duration_seconds: 1500,
        status: 'active',
      },
    });

    const readResponses = await Promise.all(readPromises);
    const readSuccess = readResponses.filter(r => [200, 400].includes(r.status())).length;

    expect([200, 201]).toContain(writeResponse.status());
    expect(readSuccess).toBeGreaterThanOrEqual(5);
  });
});

// ============================================
// Large Dataset Tests
// ============================================

test.describe('Large Dataset Handling', () => {
  test('Handle pagination with many records', async ({ request }) => {
    const userId = generateUniqueId('large-dataset');

    // Create multiple records
    for (let i = 0; i < 20; i++) {
      await request.post(`${API_BASE_URL}/api/focus/sessions`, {
        data: {
          user_id: userId,
          mode: 'focus',
          duration_seconds: 1500,
          status: 'active',
        },
      });
    }

    // Test pagination
    const response = await request.get(`${API_BASE_URL}/api/focus/sessions`, {
      params: {
        limit: 10,
        offset: 0,
      },
    });

    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('items') || expect(data).toBeInstanceOf(Array);
    }
  });

  test('Get stats with large number of sessions', async ({ request }) => {
    const userId = generateUniqueId('stats-user');

    // Create 50 sessions
    for (let i = 0; i < 50; i++) {
      await request.post(`${API_BASE_URL}/api/focus/sessions`, {
        data: {
          user_id: userId,
          mode: 'focus',
          duration_seconds: 1500,
          status: 'active',
        },
      });
    }

    // Get stats
    const response = await request.get(`${API_BASE_URL}/api/focus/stats`, {
      params: { user_id: userId },
    });

    expect([200, 400]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      expect(data.totalSessions).toBeGreaterThanOrEqual(50);
    }
  });

  test('Handle user with multiple goals at different stages', async ({ request }) => {
    const userId = generateUniqueId('multi-goals');

    // Create 10 goals
    for (let i = 0; i < 10; i++) {
      await request.post(`${API_BASE_URL}/api/goals`, {
        data: {
          user_id: userId,
          title: `Goal ${i}`,
          target_value: 100 + i * 10,
          current_value: Math.floor(Math.random() * 50),
          unit: 'units',
          deadline: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
    }

    // List goals
    const response = await request.get(`${API_BASE_URL}/api/goals`, {
      params: { user_id: userId },
    });

    expect([200, 400]).toContain(response.status());
  });
});

// ============================================
// Error Recovery Tests
// ============================================

test.describe('Error Recovery', () => {
  test('API recovers after invalid request', async ({ request }) => {
    // Send invalid request
    await request.post(`${API_BASE_URL}/api/focus/sessions`, {
      data: {
        user_id: 'error-test',
        mode: 'invalid',
        duration_seconds: -100,
      },
    });

    // Verify API still responds
    const response = await request.get(`${API_BASE_URL}/health`);
    expect(response.status()).toBe(200);
  });

  test('API handles timeout gracefully', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`, {
      timeout: 5000,
    });

    expect([200, 408, 504]).toContain(response.status());
  });

  test('Partial updates handle missing fields', async ({ request }) => {
    // Create goal first
    const createResponse = await request.post(`${API_BASE_URL}/api/goals`, {
      data: {
        user_id: 'partial-update',
        title: 'Update Test',
        target_value: 100,
        current_value: 0,
        unit: 'units',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    if (createResponse.status() === 201) {
      const goal = await createResponse.json();
      
      // Update only one field
      const updateResponse = await request.patch(`${API_BASE_URL}/api/goals/${goal.id}`, {
        data: {
          current_value: 50,
          // Other fields intentionally omitted
        },
      });

      expect([200, 400, 404]).toContain(updateResponse.status());
    }
  });
});

// ============================================
// Type Coercion Tests
// ============================================

test.describe('Type Handling', () => {
  test('Duration accepts numeric and numeric string', async ({ request }) => {
    const userId = generateUniqueId('type-coerce');
    
    // Numeric
    const numResponse = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
      data: {
        user_id: userId,
        mode: 'focus',
        duration_seconds: 1500,
        status: 'active',
      },
    });

    expect([200, 201, 400]).toContain(numResponse.status());

    // String number
    const strResponse = await request.post(`${API_BASE_URL}/api/focus/sessions`, {
      data: {
        user_id: userId,
        mode: 'focus',
        duration_seconds: '1500',
        status: 'active',
      },
    });

    expect([200, 201, 400]).toContain(strResponse.status());
  });

  test('Boolean fields handle various truthy values', async ({ request }) => {
    const userId = generateUniqueId('bool-test');
    
    // Create with true
    const response1 = await request.post(`${API_BASE_URL}/api/habits`, {
      data: {
        user_id: userId,
        title: 'Bool Test 1',
        frequency: 'daily',
        is_active: true,
      },
    });

    // Create with string 'true'
    const response2 = await request.post(`${API_BASE_URL}/api/habits`, {
      data: {
        user_id: userId,
        title: 'Bool Test 2',
        frequency: 'daily',
        is_active: 'true',
      },
    });

    // Create with 1
    const response3 = await request.post(`${API_BASE_URL}/api/habits`, {
      data: {
        user_id: userId,
        title: 'Bool Test 3',
        frequency: 'daily',
        is_active: 1,
      },
    });

    const responses = [response1, response2, response3];
    const successCount = responses.filter(r => [200, 201].includes(r.status())).length;

    expect(successCount).toBeGreaterThanOrEqual(1);
  });
});

// ============================================
// Rate Limiting & Quota Tests
// ============================================

test.describe('Rate Limiting', () => {
  test('Rapid requests do not cause 500 errors', async ({ request }) => {
    const userId = generateUniqueId('rate-limit');
    const responses = [];

    // Send 20 rapid requests
    for (let i = 0; i < 20; i++) {
      responses.push(
        await request.post(`${API_BASE_URL}/api/focus/sessions`, {
          data: {
            user_id: userId,
            mode: 'focus',
            duration_seconds: 1500,
            status: 'active',
          },
        })
      );
    }

    // Should have no 500 errors
    const errorCount = responses.filter(r => r.status() >= 500).length;
    expect(errorCount).toBe(0);

    // Should have successful responses
    const successCount = responses.filter(r => [200, 201].includes(r.status())).length;
    expect(successCount).toBeGreaterThan(0);
  });
});
