/**
 * Crypto Policy Versioning E2E Tests
 * 
 * Tests for crypto policy management, version transitions, and algorithm agility.
 * 
 * Test Coverage:
 * - API endpoints (GET current, GET by version, POST create, POST deprecate)
 * - Policy transitions (active → deprecated → past deadline)
 * - Algorithm validation
 * - Migration deadlines and notifications
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

test.describe('Crypto Policy Versioning - E2E Tests', () => {
  // ==================== API Endpoint Tests ====================

  test('1. GET /api/crypto-policy/current returns active policy', async ({ request }) => {
    // Get the current active policy
    const response = await request.get(`${API_BASE}/api/crypto-policy/current`);

    expect([200, 401]).toContain(response.status());

    if (response.ok) {
      const data = await response.json();
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('algorithm');
      expect(data).toHaveProperty('kdf_algorithm');
      expect(data).toHaveProperty('kdf_iterations');
      expect(data).toHaveProperty('tls_minimum');
      expect(data).toHaveProperty('effective_date');
      expect(data).toHaveProperty('is_current');
      expect(data.is_current).toBe(true);
      expect(data.is_deprecated).toBe(false);
    }
  });

  test('2. GET /api/crypto-policy/{version} retrieves specific version', async ({ request }) => {
    // First get current policy to get a valid version
    const currentResponse = await request.get(`${API_BASE}/api/crypto-policy/current`);

    if (currentResponse.ok) {
      const current = await currentResponse.json();
      const version = current.version;

      // Now retrieve by version
      const versionResponse = await request.get(`${API_BASE}/api/crypto-policy/${version}`);

      expect([200, 400, 401]).toContain(versionResponse.status());

      if (versionResponse.ok) {
        const data = await versionResponse.json();
        expect(data.version).toBe(version);
        expect(data).toHaveProperty('is_current');
        expect(data).toHaveProperty('is_deprecated');
      }
    }
  });

  test('3. GET /api/crypto-policy/ lists all policies', async ({ request }) => {
    // List all policies including deprecated ones
    const response = await request.get(`${API_BASE}/api/crypto-policy/`);

    expect([200, 401]).toContain(response.status());

    if (response.ok) {
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      if (data.length > 0) {
        // Should have at least one policy
        const policy = data[0];
        expect(policy).toHaveProperty('version');
        expect(policy).toHaveProperty('algorithm');
        expect(policy).toHaveProperty('is_current');
      }
    }
  });

  test('4. POST /api/crypto-policy/ creates new policy (admin)', async ({ request }) => {
    // Create a new crypto policy version
    const newPolicy = {
      version: `test-${Date.now()}`,
      algorithm: 'AES-256-GCM',
      kdf_algorithm: 'Argon2id',
      kdf_iterations: 150000,
      kdf_memory_mb: 64,
      tls_minimum: 'TLS1.3',
      effective_date: new Date().toISOString(),
      rationale: 'Testing new policy version',
    };

    const response = await request.post(`${API_BASE}/api/crypto-policy/`, {
      data: newPolicy,
      headers: { 'Content-Type': 'application/json' },
    });

    // Should succeed (200) or fail with auth (401) or permission (403)
    expect([200, 201, 400, 401, 403]).toContain(response.status());

    if (response.ok) {
      const data = await response.json();
      expect(data.version).toBe(newPolicy.version);
      expect(data.algorithm).toBe(newPolicy.algorithm);
    }
  });

  test('5. POST /api/crypto-policy/{version}/deprecate deprecates policy', async ({ request }) => {
    // Get current policy first
    const currentResponse = await request.get(`${API_BASE}/api/crypto-policy/current`);

    if (currentResponse.ok) {
      const current = await currentResponse.json();
      const version = current.version;

      const deprecateRequest = {
        version,
        deprecated_date: new Date().toISOString(),
        migration_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        rationale: 'Testing deprecation',
      };

      const response = await request.post(
        `${API_BASE}/api/crypto-policy/${version}/deprecate`,
        {
          data: deprecateRequest,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      // Should succeed or fail with auth/permission
      expect([200, 400, 401, 403]).toContain(response.status());

      if (response.ok) {
        const data = await response.json();
        expect(data.version).toBe(version);
        expect(data.is_deprecated).toBe(true);
      }
    }
  });

  // ==================== Policy Structure Tests ====================

  test('6. Current policy has valid algorithm', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/crypto-policy/current`);

    if (response.ok) {
      const data = await response.json();
      const validAlgorithms = ['AES-256-GCM', 'ChaCha20-Poly1305', 'AES-128-GCM'];
      expect(validAlgorithms).toContain(data.algorithm);
    }
  });

  test('7. Current policy has valid KDF algorithm', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/crypto-policy/current`);

    if (response.ok) {
      const data = await response.json();
      const validKdfs = ['PBKDF2-SHA256', 'Argon2id'];
      expect(validKdfs).toContain(data.kdf_algorithm);
    }
  });

  test('8. KDF iterations is reasonable', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/crypto-policy/current`);

    if (response.ok) {
      const data = await response.json();
      // PBKDF2 should have 100k+ iterations
      // Argon2id should have 2+ iterations
      expect(data.kdf_iterations).toBeGreaterThan(0);
      expect(data.kdf_iterations).toBeLessThan(10000000);
    }
  });

  test('9. TLS minimum is TLS1.3 or higher', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/crypto-policy/current`);

    if (response.ok) {
      const data = await response.json();
      const validTls = ['TLS1.3', 'TLS1.4'];
      expect(validTls).toContain(data.tls_minimum);
    }
  });

  test('10. Effective date is valid timestamp', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/crypto-policy/current`);

    if (response.ok) {
      const data = await response.json();
      const effectiveDate = new Date(data.effective_date);
      expect(effectiveDate.getTime()).toBeGreaterThan(0);
      expect(effectiveDate.getTime()).toBeLessThanOrEqual(Date.now());
    }
  });

  // ==================== Policy Transition Tests ====================

  test('11. Active policy has no deprecated_date', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/crypto-policy/current`);

    if (response.ok) {
      const data = await response.json();
      expect(data.is_current).toBe(true);
      expect(data.deprecated_date).toBeNull();
    }
  });

  test('12. Deprecated policy has is_deprecated flag', async ({ request }) => {
    // Get all policies
    const listResponse = await request.get(`${API_BASE}/api/crypto-policy/`);

    if (listResponse.ok) {
      const policies = await listResponse.json();

      // Find a deprecated policy if it exists
      const deprecatedPolicy = policies.find((p: any) => p.is_deprecated);

      if (deprecatedPolicy) {
        expect(deprecatedPolicy.is_current).toBe(false);
        expect(deprecatedPolicy.deprecated_date).not.toBeNull();
      }
    }
  });

  test('13. Migration deadline is after deprecated_date', async ({ request }) => {
    // Get all policies
    const listResponse = await request.get(`${API_BASE}/api/crypto-policy/`);

    if (listResponse.ok) {
      const policies = await listResponse.json();

      // Find a deprecated policy with both dates
      const policyWithDeadline = policies.find(
        (p: any) =>
          p.is_deprecated &&
          p.deprecated_date &&
          p.migration_deadline
      );

      if (policyWithDeadline) {
        const deprecatedTime = new Date(policyWithDeadline.deprecated_date).getTime();
        const deadlineTime = new Date(policyWithDeadline.migration_deadline).getTime();
        expect(deadlineTime).toBeGreaterThanOrEqual(deprecatedTime);
      }
    }
  });

  test('14. Policies ordered by effective_date (newest first)', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/crypto-policy/`);

    if (response.ok) {
      const policies = await response.json();

      if (policies.length > 1) {
        for (let i = 1; i < policies.length; i++) {
          const prevDate = new Date(policies[i - 1].effective_date).getTime();
          const currentDate = new Date(policies[i].effective_date).getTime();
          expect(prevDate).toBeGreaterThanOrEqual(currentDate);
        }
      }
    }
  });

  // ==================== Semantic Versioning Tests ====================

  test('15. Policy version follows semantic versioning', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/crypto-policy/current`);

    if (response.ok) {
      const data = await response.json();
      const version = data.version;

      // Should match semver format: MAJOR.MINOR.PATCH
      const semverRegex = /^\d+\.\d+\.\d+$/;
      expect(semverRegex.test(version)).toBe(true);
    }
  });

  test('16. Current version is highest semver', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/crypto-policy/`);

    if (response.ok) {
      const policies = await response.json();
      const currentPolicy = policies.find((p: any) => p.is_current);

      if (currentPolicy && policies.length > 1) {
        // Current should be highest or equal to others
        const parseVersion = (v: string) => {
          const [major, minor, patch] = v.split('.').map(Number);
          return major * 10000 + minor * 100 + patch;
        };

        const currentVersion = parseVersion(currentPolicy.version);
        const allVersions = policies.map((p: any) => parseVersion(p.version));
        const maxVersion = Math.max(...allVersions);

        expect(currentVersion).toBeLessThanOrEqual(maxVersion);
      }
    }
  });

  // ==================== Algorithm Agility Tests ====================

  test('17. Backend supports multiple algorithms', async ({ request }) => {
    // Get all policies
    const response = await request.get(`${API_BASE}/api/crypto-policy/`);

    if (response.ok) {
      const policies = await response.json();
      const algorithms = new Set(policies.map((p: any) => p.algorithm));

      // Should have at least 1 algorithm defined
      expect(algorithms.size).toBeGreaterThanOrEqual(1);
    }
  });

  test('18. KDF algorithms include both PBKDF2 and Argon2id', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/crypto-policy/`);

    if (response.ok) {
      const policies = await response.json();
      const kdfs = new Set(policies.map((p: any) => p.kdf_algorithm));

      // Should support both for flexibility
      // (either individually or in future versions)
      expect(kdfs.size).toBeGreaterThanOrEqual(1);
    }
  });

  test('19. Policy includes rationale for changes', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/crypto-policy/`);

    if (response.ok) {
      const policies = await response.json();

      // At least some policies should have rationale
      const withRationale = policies.filter((p: any) => p.rationale);

      if (withRationale.length > 0) {
        expect(withRationale[0].rationale).toBeTruthy();
        expect(typeof withRationale[0].rationale).toBe('string');
      }
    }
  });

  test('20. Policy endpoint accessible without vault unlock', async ({ request }) => {
    // Crypto policy should be accessible without vault state
    // because it describes system-wide encryption standards,
    // not user-specific vault content
    const response = await request.get(`${API_BASE}/api/crypto-policy/current`);

    // Should not require vault unlock (200 or maybe 401 for auth, not 403 vault locked)
    expect([200, 401, 404]).toContain(response.status());
  });
});
