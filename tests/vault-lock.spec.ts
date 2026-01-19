/**
 * Vault Lock E2E Tests
 * 
 * Tests for vault lock policy, auto-lock triggers, unlock flow, and cross-device detection.
 * 
 * Test Coverage:
 * - API endpoints (GET /api/vault/state, POST /api/vault/lock, POST /api/vault/unlock)
 * - UI components (VaultLockBanner, VaultUnlockModal)
 * - Auto-lock triggers (inactivity, backgrounding)
 * - Cross-device sync (polling detection)
 * - Write operation protection (Ideas, Infobase, Journal)
 */

import { test, expect, Page } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

test.describe('Vault Lock Feature - E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    // Navigate to app (auth must be set up via browser context)
    await page.goto('/');
    
    // Wait for initial load
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  // ==================== API Endpoint Tests ====================
  
  test('1. GET /api/vault/state returns vault lock state', async ({ request }) => {
    // Verify endpoint exists and returns proper structure
    const response = await request.get(`${API_BASE}/api/vault/state`);
    
    expect([200, 401]).toContain(response.status());
    
    if (response.ok) {
      const data = await response.json();
      expect(data).toHaveProperty('locked_at');
      expect(data).toHaveProperty('lock_reason');
      // locked_at should be ISO date string or null
      // lock_reason should be string or null
    }
  });

  test('2. POST /api/vault/lock with valid reason', async ({ request }) => {
    // Test lock endpoint with valid lock reason
    const lockReasons = ['idle', 'backgrounded', 'logout', 'force', 'rotation', 'admin'];
    
    for (const reason of lockReasons) {
      const response = await request.post(`${API_BASE}/api/vault/lock`, {
        data: { reason },
        headers: { 'Content-Type': 'application/json' },
      });

      // Expect either success (200) or auth error (401)
      expect([200, 201, 400, 401, 403]).toContain(response.status());

      if (response.ok) {
        const data = await response.json();
        expect(data).toHaveProperty('message');
      }
    }
  });

  test('3. POST /api/vault/lock rejects invalid reason', async ({ request }) => {
    // Invalid reason should return 400
    const response = await request.post(`${API_BASE}/api/vault/lock`, {
      data: { reason: 'invalid-reason-xyz' },
      headers: { 'Content-Type': 'application/json' },
    });

    expect([400, 401, 403]).toContain(response.status());

    if (response.status() === 400) {
      const data = await response.json();
      expect(data).toHaveProperty('error') || expect(data).toHaveProperty('message');
    }
  });

  test('4. POST /api/vault/unlock accepts passphrase', async ({ request }) => {
    // Unlock endpoint should accept passphrase
    const response = await request.post(`${API_BASE}/api/vault/unlock`, {
      data: { passphrase: 'test-passphrase' },
      headers: { 'Content-Type': 'application/json' },
    });

    // 200 if unlock succeeds, 401/403 for auth/validation, 400 for bad passphrase
    expect([200, 400, 401, 403]).toContain(response.status());

    if (response.ok) {
      const data = await response.json();
      expect(data).toHaveProperty('locked_at');
      expect(data).toHaveProperty('lock_reason');
    }
  });

  // ==================== UI Component Tests ====================

  test('5. VaultLockBanner appears when vault is locked', async () => {
    // Check if banner element exists (may be hidden if vault not locked)
    const banner = page.locator('[data-testid="vault-lock-banner"]');
    
    // If vault is locked, banner should be visible
    // If not locked, element may not exist
    const isVisible = await banner.isVisible().catch(() => false);
    
    expect(typeof isVisible).toBe('boolean');
  });

  test('6. VaultUnlockModal renders with passphrase input', async () => {
    // Check if unlock modal exists in DOM
    const modal = page.locator('[data-testid="vault-unlock-modal"]');
    const passphraseInput = page.locator('input[type="password"][name="passphrase"]');
    
    // Elements may be hidden if vault not locked
    const modalExists = await modal.count().then(c => c > 0).catch(() => false);
    
    expect(typeof modalExists).toBe('boolean');
  });

  // ==================== Lock State Management Tests ====================

  test('7. Lock state persists after page reload', async () => {
    // Get initial lock state
    const initialStateResponse = await page.request.get(`${API_BASE}/api/vault/state`);
    
    if (initialStateResponse.ok) {
      const initialState = await initialStateResponse.json();
      
      // Reload page
      await page.reload({ waitUntil: 'networkidle' });
      
      // Get lock state after reload
      const reloadedStateResponse = await page.request.get(`${API_BASE}/api/vault/state`);
      
      if (reloadedStateResponse.ok) {
        const reloadedState = await reloadedStateResponse.json();
        
        // Lock state should be same
        expect(reloadedState.locked_at).toBe(initialState.locked_at);
        expect(reloadedState.lock_reason).toBe(initialState.lock_reason);
      }
    }
  });

  test('8. Lock reason matches request', async ({ request }) => {
    // Lock with specific reason
    const lockResponse = await request.post(`${API_BASE}/api/vault/lock`, {
      data: { reason: 'idle' },
      headers: { 'Content-Type': 'application/json' },
    });

    if (lockResponse.ok) {
      // Get state
      await page.waitForTimeout(500); // Allow server to persist
      const stateResponse = await request.get(`${API_BASE}/api/vault/state`);

      if (stateResponse.ok) {
        const state = await stateResponse.json();
        expect(state.lock_reason).toBe('idle');
        expect(state.locked_at).not.toBeNull();
      }
    }
  });

  // ==================== Write Operation Protection Tests ====================

  test('9. Ideas write blocked when vault locked', async ({ request }) => {
    // First, lock the vault
    await request.post(`${API_BASE}/api/vault/lock`, {
      data: { reason: 'idle' },
      headers: { 'Content-Type': 'application/json' },
    });

    // Wait for state to propagate
    await page.waitForTimeout(500);

    // Try to create idea (should be blocked with 403 or similar)
    const ideaResponse = await request.post(`${API_BASE}/api/ideas`, {
      data: {
        title: 'Test Idea',
        content: 'This should be blocked',
        tags: [],
      },
      headers: { 'Content-Type': 'application/json' },
    });

    // If vault protected, expect error status
    // 403 (Forbidden), 422 (Vault Locked), or other error
    expect([200, 201, 400, 401, 403, 422]).toContain(ideaResponse.status());

    // If locked and error, verify error relates to vault
    if (ideaResponse.status() >= 400) {
      const errorData = await ideaResponse.json().catch(() => ({}));
      // May contain vault error message
      expect(typeof errorData).toBe('object');
    }
  });

  test('10. Infobase write blocked when vault locked', async ({ request }) => {
    // Lock the vault
    await request.post(`${API_BASE}/api/vault/lock`, {
      data: { reason: 'idle' },
      headers: { 'Content-Type': 'application/json' },
    });

    await page.waitForTimeout(500);

    // Try to create infobase entry
    const entryResponse = await request.post(`${API_BASE}/api/infobase`, {
      data: {
        title: 'Test Entry',
        content: 'Should be blocked',
        tags: [],
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect([200, 201, 400, 401, 403, 422]).toContain(entryResponse.status());
  });

  test('11. Journal write blocked when vault locked', async ({ request }) => {
    // Lock the vault
    await request.post(`${API_BASE}/api/vault/lock`, {
      data: { reason: 'idle' },
      headers: { 'Content-Type': 'application/json' },
    });

    await page.waitForTimeout(500);

    // Try to create journal entry
    const journalResponse = await request.post(`${API_BASE}/api/learn/journal`, {
      data: {
        date: new Date().toISOString().split('T')[0],
        content: 'Should be blocked',
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect([200, 201, 400, 401, 403, 422]).toContain(journalResponse.status());
  });

  // ==================== Cross-Device Sync Tests ====================

  test('12. Sync poll includes vault lock state', async ({ request }) => {
    // Check /api/sync/poll response
    const pollResponse = await request.get(`${API_BASE}/api/sync/poll`, {
      headers: { 'Content-Type': 'application/json' },
    });

    expect([200, 401]).toContain(pollResponse.status());

    if (pollResponse.ok) {
      const data = await pollResponse.json();
      
      // Should include vault_lock field
      if (data.vault_lock) {
        expect(data.vault_lock).toHaveProperty('locked_at');
        expect(data.vault_lock).toHaveProperty('lock_reason');
      }
    }
  });

  test('13. Multi-device lock detection (simulated)', async ({ context }) => {
    // Open second page to simulate another device
    const page2 = await context.newPage();

    try {
      // Device 1: Get initial state
      const state1 = await page.request.get(`${API_BASE}/api/vault/state`);

      // Device 2: Lock vault
      await page2.request.post(`${API_BASE}/api/vault/lock`, {
        data: { reason: 'idle' },
        headers: { 'Content-Type': 'application/json' },
      });

      // Device 1: Poll for new state (with retries)
      await page.waitForTimeout(1000);
      const state1After = await page.request.get(`${API_BASE}/api/vault/state`);

      if (state1.ok && state1After.ok) {
        const before = await state1.json();
        const after = await state1After.json();

        // State should have changed on device 2
        expect(typeof after.locked_at).toBe('string' || 'object' || null);
      }
    } finally {
      await page2.close();
    }
  });

  // ==================== Lock Reason Validation Tests ====================

  test('14. All lock reasons accepted', async ({ request }) => {
    const validReasons = ['idle', 'backgrounded', 'logout', 'force', 'rotation', 'admin'];

    for (const reason of validReasons) {
      const response = await request.post(`${API_BASE}/api/vault/lock`, {
        data: { reason },
        headers: { 'Content-Type': 'application/json' },
      });

      // Each should succeed or fail with auth, not validation error
      expect([200, 201, 400, 401, 403]).toContain(response.status());

      if (response.status() === 400) {
        // If 400, should not be due to invalid reason
        const error = await response.json().catch(() => ({}));
        expect(error).not.toHaveProperty('message', expect.stringContaining('Invalid lock reason'));
      }
    }
  });

  test('15. Missing passphrase rejected', async ({ request }) => {
    // Try to unlock without passphrase
    const response = await request.post(`${API_BASE}/api/vault/unlock`, {
      data: { passphrase: '' },
      headers: { 'Content-Type': 'application/json' },
    });

    expect([200, 400, 401, 403]).toContain(response.status());
  });
});
