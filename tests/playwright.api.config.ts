/**
 * Playwright Configuration for E2E API Tests
 *
 * This config is specifically for API-only tests that run against
 * the backend with AUTH_DEV_BYPASS enabled.
 *
 * Usage:
 *   npx playwright test --config=playwright.api.config.ts
 */

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/api-*.spec.ts'],
  fullyParallel: false, // Run sequentially for stateful tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for API tests to avoid race conditions
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60000, // 60 second timeout per test
  use: {
    baseURL: process.env.API_BASE_URL || 'http://localhost:8080',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    trace: 'on-first-retry',
  },
  // No webServer - tests run against external API
  projects: [
    {
      name: 'api-tests',
      testMatch: ['**/api-*.spec.ts'],
    },
  ],
});
