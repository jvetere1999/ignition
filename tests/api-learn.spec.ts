/**
 * E2E Learning API Tests
 *
 * Tests learning content, topics, lessons, and progress.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

test.describe('Learning API', () => {
  test.describe.configure({ mode: 'serial' });

  let topicId: string | null = null;
  let lessonId: string | null = null;
  let drillId: string | null = null;

  test.describe('Topics', () => {
    test('GET /api/learn/topics - lists all topics', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/learn/topics`);
      
      if (response.status() === 401) {
        test.skip(true, 'Auth required');
        return;
      }
      
      expect(response.status()).toBe(200);
      
      const data = await response.json() as { topics?: Array<{ id?: string }> };
      expect(data).toHaveProperty('topics');
      expect(Array.isArray(data.topics)).toBe(true);

      if (data.topics && data.topics.length > 0) {
        topicId = data.topics[0]?.id || null;
      }
    });
  });

  test.describe('Lessons', () => {
    test('GET /api/learn/topics/:id/lessons - lists lessons by topic', async ({ request }) => {
      if (!topicId) {
        test.skip(true, 'No topic available');
        return;
      }

      const response = await request.get(`${API_BASE_URL}/api/learn/topics/${topicId}/lessons`);
      
      if (response.status() === 401) {
        test.skip(true, 'Auth required');
        return;
      }
      
      expect(response.status()).toBe(200);
      
      const data = await response.json() as { lessons?: Array<{ id?: string }> };
      expect(data).toHaveProperty('lessons');
      expect(Array.isArray(data.lessons)).toBe(true);

      if (data.lessons && data.lessons.length > 0) {
        lessonId = data.lessons[0]?.id || null;
      }
    });

    test('GET /api/learn/lessons/:id - returns lesson by ID', async ({ request }) => {
      if (!lessonId) {
        test.skip(true, 'No lesson available');
        return;
      }

      const response = await request.get(`${API_BASE_URL}/api/learn/lessons/${lessonId}`);
      
      if (response.status() === 401) {
        test.skip(true, 'Auth required');
        return;
      }
      
      expect(response.status()).toBe(200);

      const data = await response.json() as { lesson?: { id?: string; title?: string; progress?: { status?: string } } };
      expect(data).toHaveProperty('lesson');
      expect(data.lesson?.id).toBe(lessonId);
      expect(data.lesson?.title).toBeTruthy();
      expect(data.lesson?.progress).toHaveProperty('status');
    });
  });

  test.describe('Drills', () => {
    test('GET /api/learn/topics/:id/drills - lists drills by topic', async ({ request }) => {
      if (!topicId) {
        test.skip(true, 'No topic available');
        return;
      }

      const response = await request.get(`${API_BASE_URL}/api/learn/topics/${topicId}/drills`);

      if (response.status() === 401) {
        test.skip(true, 'Auth required');
        return;
      }

      expect(response.status()).toBe(200);
      const data = await response.json() as { drills?: Array<{ id?: string }> };
      expect(data).toHaveProperty('drills');
      expect(Array.isArray(data.drills)).toBe(true);

      if (data.drills && data.drills.length > 0) {
        drillId = data.drills[0]?.id || null;
      }
    });

    test('POST /api/learn/drills/:id/submit - submits drill result', async ({ request }) => {
      if (!drillId) {
        test.skip(true, 'No drill available');
        return;
      }

      const response = await request.post(`${API_BASE_URL}/api/learn/drills/${drillId}/submit`, {
        data: {
          score: 80,
          correct_count: 8,
          total_count: 10,
          time_seconds: 60,
        },
      });

      if (response.status() === 401) {
        test.skip(true, 'Auth required');
        return;
      }

      expect(response.status()).toBe(200);
      const data = await response.json() as { result?: { drill_id?: string; score?: number } };
      expect(data).toHaveProperty('result');
      expect(data.result?.drill_id).toBe(drillId);
      expect(typeof data.result?.score).toBe('number');
    });
  });

  test.describe('Review Analytics', () => {
    test('GET /api/learn/review/analytics - returns analytics summary', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/learn/review/analytics`);

      if (response.status() === 401) {
        test.skip(true, 'Auth required');
        return;
      }

      expect(response.status()).toBe(200);
      const data = await response.json() as {
        analytics?: {
          total_reviews?: number;
          reviews_last_7_days?: number;
          reviews_last_30_days?: number;
          retention_rate?: number;
          avg_ease_factor?: number;
          avg_interval_days?: number;
          total_lapses?: number;
          grades?: { again?: number; hard?: number; good?: number; easy?: number };
        };
      };
      expect(data).toHaveProperty('analytics');
      expect(typeof data.analytics?.total_reviews).toBe('number');
      expect(typeof data.analytics?.reviews_last_7_days).toBe('number');
      expect(typeof data.analytics?.reviews_last_30_days).toBe('number');
      expect(typeof data.analytics?.retention_rate).toBe('number');
      expect(typeof data.analytics?.avg_ease_factor).toBe('number');
      expect(typeof data.analytics?.avg_interval_days).toBe('number');
      expect(typeof data.analytics?.total_lapses).toBe('number');
      expect(data.analytics?.grades).toHaveProperty('again');
      expect(data.analytics?.grades).toHaveProperty('hard');
      expect(data.analytics?.grades).toHaveProperty('good');
      expect(data.analytics?.grades).toHaveProperty('easy');
    });
  });

  test.describe('User Progress', () => {
    test('GET /api/learn/progress - returns learning progress', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/learn/progress`);
      
      if (response.status() === 401) {
        test.skip(true, 'Auth required');
        return;
      }
      
      expect(response.status()).toBe(200);
      const data = await response.json() as { progress?: { topics_started?: number; lessons_completed?: number } };
      expect(data).toHaveProperty('progress');
      expect(typeof data.progress?.topics_started).toBe('number');
      expect(typeof data.progress?.lessons_completed).toBe('number');
    });

    test('POST /api/learn/lessons/:id/complete - marks lesson complete', async ({ request }) => {
      if (!lessonId) {
        test.skip(true, 'No lesson available');
        return;
      }

      const response = await request.post(`${API_BASE_URL}/api/learn/lessons/${lessonId}/complete`, {
        data: {
          quiz_score: 100,
        },
      });
      
      expect([200, 401, 403, 404, 422]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json() as { result?: { lesson_id?: string; xp_awarded?: number } };
        expect(data).toHaveProperty('result');
        expect(data.result?.lesson_id).toBeTruthy();
        expect(typeof data.result?.xp_awarded).toBe('number');
      }
    });
  });
});

test.describe('Books API', () => {
  test.describe('Book Library', () => {
    test('GET /api/books - lists user books', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/books`);
      
      if (response.status() === 401) {
        test.skip(true, 'Auth required');
        return;
      }
      
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json() as { books?: unknown[]; total?: number };
        expect(data).toHaveProperty('books');
        expect(Array.isArray(data.books)).toBe(true);
        expect(typeof data.total).toBe('number');
      }
    });

    test('POST /api/books - creates book', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/books`, {
        data: {
          title: 'Test Book',
          author: 'Test Author',
          total_pages: 300,
        },
      });
      
      expect([200, 201, 401, 403, 404]).toContain(response.status());
    });
  });

  test.describe('Reading Sessions', () => {
    test('GET /api/reading-sessions - lists reading sessions', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/reading-sessions`);
      
      if (response.status() === 401) {
        test.skip(true, 'Auth required');
        return;
      }
      
      expect([200, 404]).toContain(response.status());
    });

    test('GET /api/reading-sessions/active - returns active session', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/reading-sessions/active`);
      
      if (response.status() === 401) {
        test.skip(true, 'Auth required');
        return;
      }
      
      expect([200, 404]).toContain(response.status());
    });
  });

  test.describe('Reading Stats', () => {
    test('GET /api/books/stats - returns reading statistics', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/books/stats`);
      
      if (response.status() === 401) {
        test.skip(true, 'Auth required');
        return;
      }
      
      expect([200, 404]).toContain(response.status());
    });
  });
});
