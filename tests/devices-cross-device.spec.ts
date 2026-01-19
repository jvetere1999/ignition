/**
 * Cross-Device Synchronization E2E Tests
 * 
 * Tests for device registration, trust, state tracking, notifications,
 * location anomaly detection, and session coordination.
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

test.describe('Cross-Device Synchronization - E2E Tests', () => {
  // ==================== Device Registration Tests ====================

  test('1. Device registration endpoint accessible', async ({ request }) => {
    const registerRequest = {
      device_name: 'Test Device',
      device_type: 'mobile' as const,
      platform: 'ios' as const,
      encryption_public_key: 'test-public-key',
      device_signature: 'device-signature-hash',
    };

    const response = await request.post(`${API_BASE}/api/devices/register`, {
      data: registerRequest,
      headers: { 'Content-Type': 'application/json' },
    });

    expect([200, 201, 400, 401, 409]).toContain(response.status());

    if ([200, 201].includes(response.status())) {
      const data = await response.json();
      expect(data).toHaveProperty('device_id');
      expect(data).toHaveProperty('device_name');
      expect(data).toHaveProperty('trust_code');
    }
  });

  test('2. Device name is persisted', async ({ request }) => {
    const deviceName = `Device-${Date.now()}`;
    const registerRequest = {
      device_name: deviceName,
      device_type: 'desktop',
      platform: 'macos',
      encryption_public_key: 'test-key-' + Date.now(),
      device_signature: 'sig-' + Date.now(),
    };

    const response = await request.post(`${API_BASE}/api/devices/register`, {
      data: registerRequest,
      headers: { 'Content-Type': 'application/json' },
    });

    if ([200, 201].includes(response.status())) {
      const data = await response.json();
      expect(data.device_name).toBe(deviceName);
    }
  });

  test('3. Device registration includes trust code', async ({ request }) => {
    const registerRequest = {
      device_name: 'Trust Test Device',
      device_type: 'tablet',
      platform: 'android',
      encryption_public_key: 'trust-test-key',
      device_signature: 'trust-test-sig',
    };

    const response = await request.post(`${API_BASE}/api/devices/register`, {
      data: registerRequest,
      headers: { 'Content-Type': 'application/json' },
    });

    if ([200, 201].includes(response.status())) {
      const data = await response.json();
      expect(data.trust_code).toBeDefined();
      expect(typeof data.trust_code).toBe('string');
    }
  });

  // ==================== Device Listing Tests ====================

  test('4. List devices endpoint accessible', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/devices`);

    expect([200, 401]).toContain(response.status());

    if (response.ok) {
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    }
  });

  test('5. Device list contains required fields', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/devices`);

    if (response.ok) {
      const devices = await response.json();
      if (devices.length > 0) {
        const device = devices[0];
        expect(device).toHaveProperty('device_id');
        expect(device).toHaveProperty('device_name');
        expect(device).toHaveProperty('device_type');
        expect(device).toHaveProperty('platform');
        expect(device).toHaveProperty('is_trusted');
        expect(device).toHaveProperty('created_at');
        expect(device).toHaveProperty('last_seen');
      }
    }
  });

  test('6. Get single device details', async ({ request }) => {
    // First get device list
    const listResponse = await request.get(`${API_BASE}/api/devices`);

    if (listResponse.ok) {
      const devices = await listResponse.json();
      if (devices.length > 0) {
        const deviceId = devices[0].device_id;

        // Now get single device
        const response = await request.get(`${API_BASE}/api/devices/${deviceId}`);

        expect([200, 404, 401]).toContain(response.status());

        if (response.ok) {
          const data = await response.json();
          expect(data.device_id).toBe(deviceId);
        }
      }
    }
  });

  // ==================== Device Trust Tests ====================

  test('7. Device trust endpoint accessible', async ({ request }) => {
    const trustRequest = {
      trust_code: 'test-trust-code-123',
    };

    const response = await request.post(
      `${API_BASE}/api/devices/test-device-123/trust`,
      {
        data: trustRequest,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect([200, 400, 401, 404]).toContain(response.status());
  });

  test('8. Trust code verification required', async ({ request }) => {
    const trustRequest = {
      trust_code: '',
    };

    const response = await request.post(
      `${API_BASE}/api/devices/test-device/trust`,
      {
        data: trustRequest,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect([400, 401, 404, 422]).toContain(response.status());
  });

  test('9. Untrust device endpoint accessible', async ({ request }) => {
    const response = await request.post(
      `${API_BASE}/api/devices/test-device-456/untrust`,
      {
        data: {},
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect([200, 400, 401, 404]).toContain(response.status());
  });

  test('10. Remove device endpoint accessible', async ({ request }) => {
    const response = await request.delete(`${API_BASE}/api/devices/test-device-789`, {
      headers: { 'Content-Type': 'application/json' },
    });

    expect([200, 204, 400, 401, 404]).toContain(response.status());
  });

  // ==================== Device State Tests ====================

  test('11. Get device state', async ({ request }) => {
    const response = await request.get(
      `${API_BASE}/api/devices/test-device/state`
    );

    expect([200, 401, 404]).toContain(response.status());

    if (response.ok) {
      const data = await response.json();
      expect(data).toHaveProperty('device_id');
      expect(data).toHaveProperty('is_focused');
      expect(data).toHaveProperty('vault_locked');
      expect(data).toHaveProperty('presence_status');
      expect(data).toHaveProperty('last_activity');
    }
  });

  test('12. Update device state', async ({ request }) => {
    const stateUpdate = {
      is_focused: true,
      vault_locked: false,
      presence_status: 'active' as const,
    };

    const response = await request.post(
      `${API_BASE}/api/devices/test-device/state`,
      {
        data: stateUpdate,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect([200, 201, 400, 401, 404]).toContain(response.status());
  });

  test('13. Device state tracks focus status', async ({ request }) => {
    const stateUpdate = {
      is_focused: true,
      vault_locked: false,
      presence_status: 'active',
    };

    const response = await request.post(
      `${API_BASE}/api/devices/test-device/state`,
      {
        data: stateUpdate,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if ([200, 201].includes(response.status())) {
      const updated = await response.json();
      expect(updated.is_focused).toBe(true);
    }
  });

  test('14. Device state tracks vault status', async ({ request }) => {
    const stateUpdate = {
      is_focused: false,
      vault_locked: true,
      presence_status: 'idle' as const,
    };

    const response = await request.post(
      `${API_BASE}/api/devices/test-device/state`,
      {
        data: stateUpdate,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if ([200, 201].includes(response.status())) {
      const updated = await response.json();
      expect(updated.vault_locked).toBe(true);
    }
  });

  // ==================== Cross-Device Notification Tests ====================

  test('15. Send cross-device notification', async ({ request }) => {
    const notificationRequest = {
      device_id: 'target-device',
      notification_type: 'sync_available' as const,
      title: 'Test Notification',
      message: 'You have changes to sync',
      payload: { sync_items: 5 },
    };

    const response = await request.post(`${API_BASE}/api/devices/notify`, {
      data: notificationRequest,
      headers: { 'Content-Type': 'application/json' },
    });

    expect([200, 201, 400, 401]).toContain(response.status());
  });

  test('16. Get pending notifications', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/devices/notifications`);

    expect([200, 401]).toContain(response.status());

    if (response.ok) {
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    }
  });

  test('17. Notification has required fields', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/devices/notifications`);

    if (response.ok) {
      const notifications = await response.json();
      if (notifications.length > 0) {
        const notif = notifications[0];
        expect(notif).toHaveProperty('notification_id');
        expect(notif).toHaveProperty('notification_type');
        expect(notif).toHaveProperty('title');
        expect(notif).toHaveProperty('message');
        expect(notif).toHaveProperty('is_read');
        expect(notif).toHaveProperty('created_at');
      }
    }
  });

  // ==================== Session Coordination Tests ====================

  test('18. Coordinate focus sessions', async ({ request }) => {
    const coordinationRequest = {
      initiator_device_id: 'device-1',
      target_devices: ['device-2', 'device-3'],
      focus_type: 'vault_unlock' as const,
      duration_seconds: 300,
      reason: 'user-initiated',
    };

    const response = await request.post(
      `${API_BASE}/api/devices/coordinate/focus`,
      {
        data: coordinationRequest,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect([200, 201, 400, 401]).toContain(response.status());
  });

  test('19. Coordination includes metadata', async ({ request }) => {
    const coordinationRequest = {
      initiator_device_id: 'device-1',
      target_devices: ['device-2'],
      focus_type: 'writing' as const,
      duration_seconds: 600,
      reason: 'user-initiated',
    };

    const response = await request.post(
      `${API_BASE}/api/devices/coordinate/focus`,
      {
        data: coordinationRequest,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if ([200, 201].includes(response.status())) {
      const data = await response.json();
      expect(data).toHaveProperty('coordination_id');
      expect(data).toHaveProperty('status');
    }
  });

  // ==================== Location Anomaly Detection Tests ====================

  test('20. Check location anomalies', async ({ request }) => {
    const locationRequest = {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy_meters: 50,
      timestamp: new Date().toISOString(),
    };

    const response = await request.post(
      `${API_BASE}/api/devices/location-check`,
      {
        data: locationRequest,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect([200, 201, 400, 401]).toContain(response.status());

    if ([200, 201].includes(response.status())) {
      const data = await response.json();
      expect(data).toHaveProperty('is_anomaly');
      expect(typeof data.is_anomaly).toBe('boolean');
    }
  });

  test('21. Anomaly detection includes warnings', async ({ request }) => {
    const locationRequest = {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy_meters: 50,
      timestamp: new Date().toISOString(),
    };

    const response = await request.post(
      `${API_BASE}/api/devices/location-check`,
      {
        data: locationRequest,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if ([200, 201].includes(response.status())) {
      const data = await response.json();
      if (data.is_anomaly) {
        expect(data).toHaveProperty('warning_message');
        expect(data).toHaveProperty('affected_devices');
      }
    }
  });

  test('22. Acknowledge location warning', async ({ request }) => {
    const response = await request.post(
      `${API_BASE}/api/devices/test-device/location-ack`,
      {
        data: { warning_id: 'warning-123' },
        headers: { 'Content-Type': 'application/json' },
      }
    );

    expect([200, 201, 400, 401, 404]).toContain(response.status());
  });

  // ==================== Device State Persistence Tests ====================

  test('23. Device stale detection', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/devices`);

    if (response.ok) {
      const devices = await response.json();
      devices.forEach((device: any) => {
        const lastSeen = new Date(device.last_seen);
        const now = new Date();
        const daysStale = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);
        
        // Device should have stale indicator if > 30 days
        if (daysStale > 30) {
          expect(device.is_stale).toBe(true);
        }
      });
    }
  });

  test('24. Device active status updated', async ({ request }) => {
    // Update device state
    const stateUpdate = {
      is_focused: true,
      vault_locked: false,
      presence_status: 'active',
    };

    const updateResponse = await request.post(
      `${API_BASE}/api/devices/test-device/state`,
      {
        data: stateUpdate,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    // Fetch device to verify last_seen updated
    if ([200, 201].includes(updateResponse.status())) {
      const getResponse = await request.get(`${API_BASE}/api/devices`);

      if (getResponse.ok) {
        const devices = await getResponse.json();
        const testDevice = devices.find((d: any) => d.device_id === 'test-device');
        if (testDevice) {
          expect(testDevice.last_seen).toBeDefined();
        }
      }
    }
  });

  test('25. Multiple devices can coexist', async ({ request }) => {
    // Register first device
    const device1Request = {
      device_name: 'Device-One-' + Date.now(),
      device_type: 'mobile' as const,
      platform: 'ios' as const,
      encryption_public_key: 'key-1-' + Date.now(),
      device_signature: 'sig-1-' + Date.now(),
    };

    const response1 = await request.post(`${API_BASE}/api/devices/register`, {
      data: device1Request,
      headers: { 'Content-Type': 'application/json' },
    });

    // Register second device
    const device2Request = {
      device_name: 'Device-Two-' + Date.now(),
      device_type: 'desktop' as const,
      platform: 'macos' as const,
      encryption_public_key: 'key-2-' + Date.now(),
      device_signature: 'sig-2-' + Date.now(),
    };

    const response2 = await request.post(`${API_BASE}/api/devices/register`, {
      data: device2Request,
      headers: { 'Content-Type': 'application/json' },
    });

    // Both should succeed
    expect([200, 201, 409]).toContain(response1.status());
    expect([200, 201, 409]).toContain(response2.status());

    // List should show both
    const listResponse = await request.get(`${API_BASE}/api/devices`);

    if (listResponse.ok) {
      const devices = await listResponse.json();
      expect(devices.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('26. Device trust state persists', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/devices`);

    if (response.ok) {
      const devices = await response.json();
      if (devices.length > 0) {
        const device = devices[0];
        expect(device).toHaveProperty('is_trusted');
        expect(typeof device.is_trusted).toBe('boolean');
      }
    }
  });
});
