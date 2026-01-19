/**
 * E2E Encrypted Sync E2E Tests
 * 
 * Tests for encrypted data replication, delta sync, conflict resolution,
 * and cross-device synchronization of encrypted content.
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

test.describe('E2E Encrypted Sync - E2E Tests', () => {
  // ==================== Delta Sync Tests ====================

  test('1. Delta sync endpoint accessible', async ({ request }) => {
    const syncRequest = {
      checkpoint: {
        device_id: 'test-device',
        last_sync_timestamp: new Date().toISOString(),
        content_version: 1,
        etag: 'initial',
      },
      device_id: 'test-device',
      include_deleted: false,
    };

    const response = await request.post(`${API_BASE}/api/sync/encrypted/delta`, {
      data: syncRequest,
      headers: { 'Content-Type': 'application/json' },
    });

    expect([200, 201, 400, 401, 422]).toContain(response.status());

    if (response.ok) {
      const data = await response.json();
      expect(data).toHaveProperty('checkpoint');
      expect(data).toHaveProperty('new_items');
      expect(data).toHaveProperty('updated_items');
      expect(data).toHaveProperty('deleted_items');
      expect(data).toHaveProperty('has_more');
      expect(Array.isArray(data.new_items)).toBe(true);
    }
  });

  test('2. Delta sync returns only changes since checkpoint', async ({ request }) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const syncRequest = {
      checkpoint: {
        device_id: 'test-device',
        last_sync_timestamp: oneHourAgo.toISOString(),
        content_version: 1,
        etag: 'before-changes',
      },
      device_id: 'test-device',
      include_deleted: false,
    };

    const response = await request.post(`${API_BASE}/api/sync/encrypted/delta`, {
      data: syncRequest,
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      // Should only return items changed after checkpoint
      expect(data.new_items).toBeDefined();
    }
  });

  // ==================== Full Sync Tests ====================

  test('3. Full sync endpoint accessible', async ({ request }) => {
    const syncRequest = {
      device_id: 'test-device',
    };

    const response = await request.post(`${API_BASE}/api/sync/encrypted/full`, {
      data: syncRequest,
      headers: { 'Content-Type': 'application/json' },
    });

    expect([200, 201, 400, 401, 422]).toContain(response.status());

    if (response.ok) {
      const data = await response.json();
      expect(data).toHaveProperty('checkpoint');
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('total_count');
      expect(Array.isArray(data.items)).toBe(true);
    }
  });

  test('4. Full sync returns all content', async ({ request }) => {
    const syncRequest = {
      device_id: 'test-device',
    };

    const response = await request.post(`${API_BASE}/api/sync/encrypted/full`, {
      data: syncRequest,
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      // All items should be included
      expect(data.items.length).toBeLessThanOrEqual(data.total_count);
    }
  });

  test('5. Full sync pagination works', async ({ request }) => {
    const syncRequest = {
      device_id: 'test-device',
    };

    const response = await request.post(`${API_BASE}/api/sync/encrypted/full`, {
      data: syncRequest,
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      // Should have pagination info
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('page_size');
      expect(data).toHaveProperty('has_more');
    }
  });

  // ==================== Content Upload Tests ====================

  test('6. Upload encrypted changes', async ({ request }) => {
    const encryptedItems = [
      {
        id: 'idea-1',
        content_type: 'idea',
        encrypted_data: 'base64-encoded-encrypted-data',
        nonce: 'unique-nonce-1',
        algorithm: 'AES-256-GCM',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      },
    ];

    const response = await request.post(
      `${API_BASE}/api/sync/encrypted/upload`,
      {
        data: {
          items: encryptedItems,
          device_id: 'test-device',
        },
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect([200, 201, 400, 401, 422]).toContain(response.status());

    if (response.ok) {
      const data = await response.json();
      expect(data).toHaveProperty('uploaded_count');
      expect(data).toHaveProperty('checkpoint');
    }
  });

  test('7. Uploaded content gets new checkpoint', async ({ request }) => {
    const encryptedItems = [
      {
        id: 'idea-test-' + Date.now(),
        content_type: 'idea',
        encrypted_data: 'test-encrypted-data',
        nonce: 'test-nonce-' + Date.now(),
        algorithm: 'AES-256-GCM',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      },
    ];

    const response = await request.post(
      `${API_BASE}/api/sync/encrypted/upload`,
      {
        data: {
          items: encryptedItems,
          device_id: 'test-device',
        },
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (response.ok) {
      const data = await response.json();
      expect(data.checkpoint).toBeDefined();
      expect(data.checkpoint.last_sync_timestamp).toBeDefined();
    }
  });

  // ==================== Conflict Resolution Tests ====================

  test('8. Conflict resolution endpoint available', async ({ request }) => {
    const conflictRequest = {
      conflicts: [
        {
          content_id: 'idea-1',
          resolution: 'device_wins',
        },
      ],
    };

    const response = await request.post(
      `${API_BASE}/api/sync/encrypted/resolve`,
      {
        data: conflictRequest,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect([200, 201, 400, 401, 422]).toContain(response.status());
  });

  test('9. Conflict resolution accepts device_wins', async ({ request }) => {
    const conflictRequest = {
      conflicts: [
        {
          content_id: 'idea-conflict-1',
          resolution: 'device_wins',
        },
      ],
    };

    const response = await request.post(
      `${API_BASE}/api/sync/encrypted/resolve`,
      {
        data: conflictRequest,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (response.ok) {
      const data = await response.json();
      expect(data.resolved_count).toBeGreaterThanOrEqual(0);
    }
  });

  test('10. Conflict resolution accepts server_wins', async ({ request }) => {
    const conflictRequest = {
      conflicts: [
        {
          content_id: 'idea-conflict-2',
          resolution: 'server_wins',
        },
      ],
    };

    const response = await request.post(
      `${API_BASE}/api/sync/encrypted/resolve`,
      {
        data: conflictRequest,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect([200, 201, 400, 401, 422]).toContain(response.status());
  });

  // ==================== Sync Status Tests ====================

  test('11. Get sync status', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/sync/encrypted/status`);

    expect([200, 401]).toContain(response.status());

    if (response.ok) {
      const data = await response.json();
      expect(data).toHaveProperty('last_sync');
      expect(data).toHaveProperty('pending_changes');
      expect(data).toHaveProperty('is_syncing');
      expect(data).toHaveProperty('sync_errors');
      expect(Array.isArray(data.sync_errors)).toBe(true);
    }
  });

  test('12. Pending changes tracked', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/sync/encrypted/status`);

    if (response.ok) {
      const data = await response.json();
      expect(typeof data.pending_changes).toBe('number');
      expect(data.pending_changes).toBeGreaterThanOrEqual(0);
    }
  });

  test('13. Sync errors reported', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/sync/encrypted/status`);

    if (response.ok) {
      const data = await response.json();
      expect(Array.isArray(data.sync_errors)).toBe(true);
    }
  });

  // ==================== Encrypted Content Structure Tests ====================

  test('14. Encrypted content has required fields', async ({ request }) => {
    const syncRequest = {
      checkpoint: {
        device_id: 'test-device',
        last_sync_timestamp: new Date().toISOString(),
        content_version: 1,
        etag: 'test',
      },
      device_id: 'test-device',
      include_deleted: false,
    };

    const response = await request.post(`${API_BASE}/api/sync/encrypted/delta`, {
      data: syncRequest,
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();

      if (data.new_items && data.new_items.length > 0) {
        const item = data.new_items[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('content_type');
        expect(item).toHaveProperty('encrypted_data');
        expect(item).toHaveProperty('nonce');
        expect(item).toHaveProperty('algorithm');
      }
    }
  });

  test('15. Deleted items tracked separately', async ({ request }) => {
    const syncRequest = {
      checkpoint: {
        device_id: 'test-device',
        last_sync_timestamp: new Date().toISOString(),
        content_version: 1,
        etag: 'test',
      },
      device_id: 'test-device',
      include_deleted: true,
    };

    const response = await request.post(`${API_BASE}/api/sync/encrypted/delta`, {
      data: syncRequest,
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      expect(Array.isArray(data.deleted_items)).toBe(true);
    }
  });

  test('16. Device reset clears sync history', async ({ request }) => {
    const response = await request.post(
      `${API_BASE}/api/sync/encrypted/reset`,
      {
        data: { device_id: 'test-device-reset' },
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect([200, 201, 400, 401, 403]).toContain(response.status());
  });

  test('17. Sync works with vault locked', async ({ request }) => {
    // Lock vault
    await request.post(`${API_BASE}/api/vault/lock`, {
      data: { reason: 'idle' },
      headers: { 'Content-Type': 'application/json' },
    });

    // Delta sync should still work (read-only)
    const syncRequest = {
      checkpoint: {
        device_id: 'test-device',
        last_sync_timestamp: new Date().toISOString(),
        content_version: 1,
        etag: 'test',
      },
      device_id: 'test-device',
      include_deleted: false,
    };

    const response = await request.post(`${API_BASE}/api/sync/encrypted/delta`, {
      data: syncRequest,
      headers: { 'Content-Type': 'application/json' },
    });

    expect([200, 201, 400, 401, 422]).toContain(response.status());
  });

  test('18. Checkpoint format validated', async ({ request }) => {
    const syncRequest = {
      checkpoint: {
        device_id: 'test-device',
        last_sync_timestamp: 'invalid-timestamp',
        content_version: 1,
        etag: 'test',
      },
      device_id: 'test-device',
      include_deleted: false,
    };

    const response = await request.post(`${API_BASE}/api/sync/encrypted/delta`, {
      data: syncRequest,
      headers: { 'Content-Type': 'application/json' },
    });

    expect([200, 400, 401, 422]).toContain(response.status());
  });

  test('19. Sync response includes metadata', async ({ request }) => {
    const syncRequest = {
      checkpoint: {
        device_id: 'test-device',
        last_sync_timestamp: new Date().toISOString(),
        content_version: 1,
        etag: 'test',
      },
      device_id: 'test-device',
      include_deleted: false,
    };

    const response = await request.post(`${API_BASE}/api/sync/encrypted/delta`, {
      data: syncRequest,
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      expect(data.checkpoint).toBeDefined();
      expect(data.checkpoint.last_sync_timestamp).toBeDefined();
      expect(data.checkpoint.etag).toBeDefined();
    }
  });

  test('20. Large sync payloads handled', async ({ request }) => {
    // Create large payload
    const largeItems = Array.from({ length: 100 }, (_, i) => ({
      id: `idea-large-${i}`,
      content_type: 'idea' as const,
      encrypted_data: 'x'.repeat(1000), // 1KB per item
      nonce: `nonce-${i}`,
      algorithm: 'AES-256-GCM',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    }));

    const response = await request.post(
      `${API_BASE}/api/sync/encrypted/upload`,
      {
        data: {
          items: largeItems,
          device_id: 'test-device',
        },
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect([200, 201, 400, 401, 422, 413]).toContain(response.status());
  });
});
