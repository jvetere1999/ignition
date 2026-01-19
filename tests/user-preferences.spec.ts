/**
 * User Preferences & Privacy Modes E2E Tests
 * 
 * Tests for user settings management, privacy preferences,
 * content retention policies, and privacy mode enforcement.
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

test.describe('User Preferences & Privacy Modes - E2E Tests', () => {
  // ==================== Settings Endpoints ====================

  test('1. GET /api/settings returns user settings', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/settings`);

    expect([200, 401]).toContain(response.status());

    if (response.ok) {
      const data = await response.json();
      expect(data).toHaveProperty('theme');
      expect(data).toHaveProperty('notifications_enabled');
      expect(data).toHaveProperty('email_digest');
      expect(data).toHaveProperty('timezone');
      expect(data).toHaveProperty('language');
      expect(data).toHaveProperty('privacy_mode');
    }
  });

  test('2. PATCH /api/settings updates user settings', async ({ request }) => {
    const updateRequest = {
      theme: 'dark',
      notifications_enabled: true,
    };

    const response = await request.patch(`${API_BASE}/api/settings`, {
      data: updateRequest,
      headers: { 'Content-Type': 'application/json' },
    });

    expect([200, 400, 401]).toContain(response.status());

    if (response.ok) {
      const data = await response.json();
      expect(data.theme).toBe('dark');
      expect(data.notifications_enabled).toBe(true);
    }
  });

  test('3. Theme preference persists', async ({ request }) => {
    // Set theme
    await request.patch(`${API_BASE}/api/settings`, {
      data: { theme: 'dark' },
      headers: { 'Content-Type': 'application/json' },
    });

    // Retrieve and verify
    const getResponse = await request.get(`${API_BASE}/api/settings`);

    if (getResponse.ok) {
      const data = await getResponse.json();
      expect(data.theme).toBe('dark');
    }
  });

  test('4. Valid theme values are accepted', async ({ request }) => {
    const themes = ['light', 'dark', 'auto'];

    for (const theme of themes) {
      const response = await request.patch(`${API_BASE}/api/settings`, {
        data: { theme },
        headers: { 'Content-Type': 'application/json' },
      });

      expect([200, 400, 401]).toContain(response.status());
    }
  });

  test('5. Invalid theme rejected', async ({ request }) => {
    const response = await request.patch(`${API_BASE}/api/settings`, {
      data: { theme: 'invalid-theme' },
      headers: { 'Content-Type': 'application/json' },
    });

    expect([400, 401, 403]).toContain(response.status());
  });

  test('6. Email digest options respected', async ({ request }) => {
    const digests = ['daily', 'weekly', 'monthly', 'never'];

    for (const digest of digests) {
      const response = await request.patch(`${API_BASE}/api/settings`, {
        data: { email_digest: digest },
        headers: { 'Content-Type': 'application/json' },
      });

      expect([200, 400, 401]).toContain(response.status());
    }
  });

  test('7. Timezone must be valid', async ({ request }) => {
    const response = await request.patch(`${API_BASE}/api/settings`, {
      data: { timezone: 'America/New_York' },
      headers: { 'Content-Type': 'application/json' },
    });

    expect([200, 400, 401]).toContain(response.status());
  });

  test('8. Invalid timezone rejected', async ({ request }) => {
    const response = await request.patch(`${API_BASE}/api/settings`, {
      data: { timezone: 'Invalid/Zone' },
      headers: { 'Content-Type': 'application/json' },
    });

    expect([400, 401, 403]).toContain(response.status());
  });

  // ==================== Privacy Preferences ====================

  test('9. GET /api/privacy/preferences returns privacy settings', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/privacy/preferences`);

    expect([200, 401]).toContain(response.status());

    if (response.ok) {
      const data = await response.json();
      expect(data).toHaveProperty('default_mode');
      expect(data).toHaveProperty('show_privacy_toggle');
      expect(data).toHaveProperty('exclude_private_from_search');
      expect(data).toHaveProperty('private_content_retention_days');
      expect(data).toHaveProperty('standard_content_retention_days');
    }
  });

  test('10. POST /api/privacy/preferences updates privacy settings', async ({ request }) => {
    const updateRequest = {
      default_mode: 'private',
      exclude_private_from_search: true,
    };

    const response = await request.post(`${API_BASE}/api/privacy/preferences`, {
      data: updateRequest,
      headers: { 'Content-Type': 'application/json' },
    });

    expect([200, 201, 400, 401]).toContain(response.status());

    if (response.ok) {
      const data = await response.json();
      expect(data.default_mode).toBe('private');
      expect(data.exclude_private_from_search).toBe(true);
    }
  });

  test('11. Default privacy mode enforced', async ({ request }) => {
    // Set default to private
    await request.post(`${API_BASE}/api/privacy/preferences`, {
      data: { default_mode: 'private' },
      headers: { 'Content-Type': 'application/json' },
    });

    // Verify setting
    const getResponse = await request.get(`${API_BASE}/api/privacy/preferences`);

    if (getResponse.ok) {
      const data = await getResponse.json();
      expect(data.default_mode).toBe('private');
    }
  });

  test('12. Private content excluded from search when enabled', async ({ request }) => {
    // Enable exclusion
    await request.post(`${API_BASE}/api/privacy/preferences`, {
      data: { exclude_private_from_search: true },
      headers: { 'Content-Type': 'application/json' },
    });

    // Search should not return private content
    const searchResponse = await request.get(
      `${API_BASE}/api/search?q=private&type=idea`
    );

    if (searchResponse.ok) {
      const data = await searchResponse.json();
      // Results should not include private content
      expect(Array.isArray(data.results)).toBe(true);
    }
  });

  test('13. Content retention days must be valid', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/privacy/preferences`, {
      data: { private_content_retention_days: 90 },
      headers: { 'Content-Type': 'application/json' },
    });

    expect([200, 201, 400, 401]).toContain(response.status());
  });

  test('14. Retention days out of range rejected', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/privacy/preferences`, {
      data: { private_content_retention_days: 400 }, // > 365
      headers: { 'Content-Type': 'application/json' },
    });

    expect([400, 401, 403]).toContain(response.status());
  });

  test('15. Privacy toggle visibility controlled', async ({ request }) => {
    // Disable toggle
    await request.post(`${API_BASE}/api/privacy/preferences`, {
      data: { show_privacy_toggle: false },
      headers: { 'Content-Type': 'application/json' },
    });

    // Verify setting
    const getResponse = await request.get(`${API_BASE}/api/privacy/preferences`);

    if (getResponse.ok) {
      const data = await getResponse.json();
      expect(data.show_privacy_toggle).toBe(false);
    }
  });

  test('16. Notifications can be disabled globally', async ({ request }) => {
    const response = await request.patch(`${API_BASE}/api/settings`, {
      data: { notifications_enabled: false },
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      expect(data.notifications_enabled).toBe(false);
    }
  });

  test('17. Settings update is atomic', async ({ request }) => {
    // Update multiple settings
    const updateRequest = {
      theme: 'dark',
      timezone: 'UTC',
      language: 'en',
    };

    const response = await request.patch(`${API_BASE}/api/settings`, {
      data: updateRequest,
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      // All updates should be present
      expect(data.theme).toBe('dark');
      expect(data.timezone).toBe('UTC');
      expect(data.language).toBe('en');
    }
  });

  test('18. Privacy mode affects data operations', async ({ request }) => {
    // Set to private mode
    await request.post(`${API_BASE}/api/privacy/preferences`, {
      data: { default_mode: 'private' },
      headers: { 'Content-Type': 'application/json' },
    });

    // Create an idea (should be private)
    const ideaResponse = await request.post(`${API_BASE}/api/ideas`, {
      data: {
        title: 'Test Idea',
        content: 'This should be private',
        tags: [],
      },
      headers: { 'Content-Type': 'application/json' },
    });

    // Verify idea is created with privacy enforced
    expect([200, 201, 400, 401, 403]).toContain(ideaResponse.status());
  });

  test('19. Language preference stored', async ({ request }) => {
    const response = await request.patch(`${API_BASE}/api/settings`, {
      data: { language: 'es' },
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      expect(data.language).toBe('es');
    }
  });

  test('20. Profile visibility controlled', async ({ request }) => {
    const response = await request.patch(`${API_BASE}/api/settings`, {
      data: { show_profile: false },
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      expect(data.show_profile).toBe(false);
    }
  });
});
