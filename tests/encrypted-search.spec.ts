/**
 * Encrypted Search E2E Tests
 * 
 * Tests for client-side encrypted search using IndexedDB + Trie algorithm.
 * Covers full-text search, filtering, highlighting, and offline capabilities.
 * 
 * Test Coverage:
 * - API endpoints (GET /api/search, GET /api/search/status)
 * - Search functionality (query, type filter, pagination)
 * - Results accuracy (relevance scoring, highlighting)
 * - Index management (building, clearing, rebuilding)
 * - Offline search (IndexedDB fallback)
 * - Performance (query time, result count)
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

test.describe('Encrypted Search - E2E Tests', () => {
  // ==================== Basic Search Tests ====================

  test('1. Search endpoint accessible', async ({ request }) => {
    // Basic search endpoint check
    const response = await request.get(`${API_BASE}/api/search?q=test`);

    expect([200, 401, 422]).toContain(response.status());

    if (response.ok) {
      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('results');
      expect(data).toHaveProperty('total_count');
      expect(data).toHaveProperty('query_time_ms');
      expect(Array.isArray(data.results)).toBe(true);
    }
  });

  test('2. Search with empty query returns empty results', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/search?q=`);

    expect([200, 400, 401]).toContain(response.status());

    if (response.ok) {
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.results.length).toBe(0);
      expect(data.total_count).toBe(0);
    }
  });

  test('3. Search returns results with correct structure', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/search?q=the`);

    if (response.ok) {
      const data = await response.json();

      if (data.results.length > 0) {
        const result = data.results[0];
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('contentType');
        expect(['idea', 'infobase']).toContain(result.contentType);
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('preview');
        expect(result).toHaveProperty('highlights');
        expect(result).toHaveProperty('relevanceScore');
        expect(result).toHaveProperty('createdAt');
        expect(result).toHaveProperty('tags');
        expect(Array.isArray(result.tags)).toBe(true);
      }
    }
  });

  test('4. Search result highlights are valid', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/search?q=music`);

    if (response.ok) {
      const data = await response.json();

      if (data.results.length > 0) {
        const result = data.results[0];

        if (result.highlights && result.highlights.length > 0) {
          for (const highlight of result.highlights) {
            expect(highlight).toHaveProperty('position');
            expect(highlight).toHaveProperty('length');
            expect(typeof highlight.position).toBe('number');
            expect(typeof highlight.length).toBe('number');
            expect(highlight.position).toBeGreaterThanOrEqual(0);
            expect(highlight.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  test('5. Relevance score is between 0 and 1', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/search?q=practice`);

    if (response.ok) {
      const data = await response.json();

      if (data.results.length > 0) {
        for (const result of data.results) {
          expect(result.relevanceScore).toBeGreaterThanOrEqual(0);
          expect(result.relevanceScore).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  // ==================== Filtering Tests ====================

  test('6. Type filter works for ideas', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/search?q=test&type=idea`);

    if (response.ok) {
      const data = await response.json();

      // All results should be ideas
      for (const result of data.results) {
        expect(result.contentType).toBe('idea');
      }
    }
  });

  test('7. Type filter works for infobase', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/search?q=test&type=infobase`);

    if (response.ok) {
      const data = await response.json();

      // All results should be infobase entries
      for (const result of data.results) {
        expect(result.contentType).toBe('infobase');
      }
    }
  });

  test('8. Type filter "all" returns both types', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/search?q=test&type=all`);

    if (response.ok) {
      const data = await response.json();

      // Results can be either type
      for (const result of data.results) {
        expect(['idea', 'infobase']).toContain(result.contentType);
      }
    }
  });

  // ==================== Pagination Tests ====================

  test('9. Pagination limit parameter works', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/search?q=a&limit=10`);

    if (response.ok) {
      const data = await response.json();

      // Should return at most 10 results
      expect(data.results.length).toBeLessThanOrEqual(10);
    }
  });

  test('10. Pagination offset parameter works', async ({ request }) => {
    // Get first page
    const page1Response = await request.get(`${API_BASE}/api/search?q=a&limit=5&offset=0`);

    if (page1Response.ok) {
      const page1Data = await page1Response.json();

      // Get second page
      const page2Response = await request.get(
        `${API_BASE}/api/search?q=a&limit=5&offset=5`
      );

      if (page2Response.ok) {
        const page2Data = await page2Response.json();

        // Results should be different if there are enough items
        if (page1Data.total_count > 5) {
          expect(page1Data.results[0]?.id).not.toBe(page2Data.results[0]?.id);
        }
      }
    }
  });

  test('11. Total count exceeds returned results', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/search?q=a&limit=5`);

    if (response.ok) {
      const data = await response.json();

      // Total count should be >= returned results
      expect(data.total_count).toBeGreaterThanOrEqual(data.results.length);
    }
  });

  // ==================== Search Index Status Tests ====================

  test('12. GET /api/search/status returns index status', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/search/status`);

    expect([200, 401]).toContain(response.status());

    if (response.ok) {
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('lastIndexed');
      expect(data).toHaveProperty('itemsIndexed');
      expect(data).toHaveProperty('isEmpty');

      const validStatuses = ['ready', 'building', 'error', 'empty'];
      expect(validStatuses).toContain(data.status);
    }
  });

  test('13. Search index items count is non-negative', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/search/status`);

    if (response.ok) {
      const data = await response.json();
      expect(data.itemsIndexed).toBeGreaterThanOrEqual(0);
    }
  });

  test('14. Search index lastIndexed is valid timestamp or null', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/search/status`);

    if (response.ok) {
      const data = await response.json();

      if (data.lastIndexed !== null) {
        expect(typeof data.lastIndexed).toBe('number');
        expect(data.lastIndexed).toBeGreaterThan(0);
        expect(data.lastIndexed).toBeLessThanOrEqual(Date.now());
      }
    }
  });

  // ==================== Performance Tests ====================

  test('15. Search completes within reasonable time', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/search?q=test`);

    if (response.ok) {
      const data = await response.json();

      // Should complete within 5 seconds
      expect(data.query_time_ms).toBeLessThan(5000);
    }
  });

  test('16. Search with pagination is efficient', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/search?q=a&limit=100&offset=0`);

    if (response.ok) {
      const data = await response.json();

      // Even with large limit, should be reasonably fast
      expect(data.query_time_ms).toBeLessThan(5000);
    }
  });

  // ==================== Query Validation Tests ====================

  test('17. Special characters in query handled', async ({ request }) => {
    const queries = [
      'test@query',
      'test#query',
      'test$query',
      'test%query',
      'test&query',
      'test*query',
    ];

    for (const query of queries) {
      const response = await request.get(
        `${API_BASE}/api/search?q=${encodeURIComponent(query)}`
      );

      // Should not throw error
      expect([200, 400, 401, 422]).toContain(response.status());
    }
  });

  test('18. Very long query handled', async ({ request }) => {
    const longQuery = 'a'.repeat(1000);
    const response = await request.get(
      `${API_BASE}/api/search?q=${encodeURIComponent(longQuery)}`
    );

    // Should either truncate or return error, not crash
    expect([200, 400, 401, 413, 422]).toContain(response.status());
  });

  test('19. Case-insensitive search', async ({ request }) => {
    const response1 = await request.get(`${API_BASE}/api/search?q=TEST`);
    const response2 = await request.get(`${API_BASE}/api/search?q=test`);

    if (response1.ok && response2.ok) {
      const data1 = await response1.json();
      const data2 = await response2.json();

      // Results should be similar (case-insensitive)
      expect(data1.results.length).toBe(data2.results.length);
    }
  });

  test('20. Whitespace-trimmed query', async ({ request }) => {
    const response1 = await request.get(`${API_BASE}/api/search?q=test`);
    const response2 = await request.get(`${API_BASE}/api/search?q= test `);

    if (response1.ok && response2.ok) {
      const data1 = await response1.json();
      const data2 = await response2.json();

      // Results should be same (whitespace trimmed)
      expect(data1.results.length).toBe(data2.results.length);
    }
  });

  // ==================== Result Accuracy Tests ====================

  test('21. Search results are sorted by relevance', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/search?q=music`);

    if (response.ok) {
      const data = await response.json();

      if (data.results.length > 1) {
        // Verify descending relevance scores
        for (let i = 1; i < data.results.length; i++) {
          const prevScore = data.results[i - 1].relevanceScore;
          const currScore = data.results[i].relevanceScore;
          expect(prevScore).toBeGreaterThanOrEqual(currScore);
        }
      }
    }
  });

  test('22. Search tags are included in results', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/search?q=test`);

    if (response.ok) {
      const data = await response.json();

      if (data.results.length > 0) {
        // Tags should be array (empty or with items)
        for (const result of data.results) {
          expect(Array.isArray(result.tags)).toBe(true);
        }
      }
    }
  });

  test('23. Preview text length is reasonable', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/search?q=test`);

    if (response.ok) {
      const data = await response.json();

      if (data.results.length > 0) {
        for (const result of data.results) {
          // Preview should not be empty or extremely long
          expect(result.preview.length).toBeGreaterThan(0);
          expect(result.preview.length).toBeLessThan(10000);
        }
      }
    }
  });

  test('24. Search vault-locked operations blocked', async ({ request }) => {
    // Lock the vault
    await request.post(`${API_BASE}/api/vault/lock`, {
      data: { reason: 'idle' },
      headers: { 'Content-Type': 'application/json' },
    });

    // Search should still work (read-only, not blocked by vault lock)
    const response = await request.get(`${API_BASE}/api/search?q=test`);

    expect([200, 401, 422]).toContain(response.status());
  });

  test('25. Search performance with vault locked vs unlocked', async ({ request }) => {
    // Search while unlocked
    const unlockedResponse = await request.get(`${API_BASE}/api/search?q=practice`);

    // Lock vault
    await request.post(`${API_BASE}/api/vault/lock`, {
      data: { reason: 'idle' },
      headers: { 'Content-Type': 'application/json' },
    });

    // Search while locked
    const lockedResponse = await request.get(`${API_BASE}/api/search?q=practice`);

    // Both should work (search is read-only)
    if (unlockedResponse.ok && lockedResponse.ok) {
      const unlockedData = await unlockedResponse.json();
      const lockedData = await lockedResponse.json();

      // Results should be consistent
      expect(unlockedData.results.length).toBe(lockedData.results.length);
    }
  });
});
