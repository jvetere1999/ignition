/**
 * Cross-Device Synchronization API Client
 * 
 * Manages device registration, device state tracking, and
 * cross-device notifications and coordination.
 */

import { apiGet, apiPost, apiDelete } from './client';

// ==================== Types ====================

/**
 * Registered device information
 */
export interface Device {
  id: string;
  user_id: string;
  name: string;
  device_type: 'mobile' | 'tablet' | 'desktop' | 'web';
  os: string; // e.g., "iOS 17", "macOS 14", "Android 14"
  browser?: string; // e.g., "Chrome 120", "Safari 17"
  is_current_device: boolean;
  last_seen: string; // ISO timestamp
  trusted: boolean;
  public_key: string; // For E2EE key exchange
  created_at: string;
  updated_at: string;
}

/**
 * Device registration request
 */
export interface RegisterDeviceRequest {
  name: string;
  device_type: 'mobile' | 'tablet' | 'desktop' | 'web';
  os: string;
  browser?: string;
  public_key: string; // For E2EE
}

/**
 * Cross-device state for coordination
 */
export interface DeviceState {
  device_id: string;
  focus_session_active: boolean;
  last_activity: string;
  vault_locked: boolean;
  user_presence: 'active' | 'idle' | 'away' | 'offline';
}

/**
 * Cross-device command/notification
 */
export interface CrossDeviceNotification {
  id: string;
  source_device_id: string;
  target_device_ids: string[];
  notification_type:
    | 'vault_locked'
    | 'focus_started'
    | 'focus_completed'
    | 'content_updated'
    | 'device_removed'
    | 'location_warning';
  payload: Record<string, unknown>;
  created_at: string;
  expires_at: string;
  read_at: string | null;
}

/**
 * Trust establishment between devices
 */
export interface DeviceTrust {
  device_id: string;
  trusted: boolean;
  trust_code?: string;
  verified_at?: string;
}

/**
 * Session information for cross-device state
 */
export interface SessionCoordination {
  device_id: string;
  focus_session_id?: string;
  break_until?: string; // ISO timestamp
  do_not_disturb_until?: string;
}

/**
 * Location-based warning
 */
export interface LocationWarning {
  device_id: string;
  previous_location?: string;
  current_location: string;
  unusual: boolean;
  warning_type: 'new_country' | 'new_city' | 'rapid_movement';
}

// ==================== API Functions ====================

/**
 * Register a new device
 * 
 * Called when user logs in on a new device.
 * Requires public key for E2EE setup.
 * 
 * @param request - Device registration details
 * @returns Registered device info
 */
export async function registerDevice(
  request: RegisterDeviceRequest
): Promise<Device> {
  return apiPost<Device>(
    '/api/devices/register',
    request
  );
}

/**
 * Get all registered devices
 * 
 * Returns list of devices associated with user account.
 * Used for device management UI.
 */
export async function listDevices(): Promise<Device[]> {
  return apiGet<Device[]>('/api/devices');
}

/**
 * Get specific device info
 */
export async function getDevice(deviceId: string): Promise<Device> {
  return apiGet<Device>(`/api/devices/${deviceId}`);
}

/**
 * Trust a device (verify it's not compromised)
 * 
 * Marks device as trusted. Used for additional security.
 * Can require trust code from device.
 */
export async function trustDevice(
  deviceId: string,
  trustCode?: string
): Promise<DeviceTrust> {
  return apiPost<DeviceTrust>(
    `/api/devices/${deviceId}/trust`,
    { trust_code: trustCode }
  );
}

/**
 * Revoke trust from a device
 * 
 * Marks device as untrusted or removes it.
 * User may need to re-authenticate on that device.
 */
export async function untrustDevice(deviceId: string): Promise<void> {
  return apiPost<void>(`/api/devices/${deviceId}/untrust`, {});
}

/**
 * Remove a device
 * 
 * Completely removes device from account.
 * May require re-authentication if it's the current device.
 */
export async function removeDevice(deviceId: string): Promise<void> {
  return apiDelete(`/api/devices/${deviceId}`);
}

/**
 * Get device state for cross-device coordination
 * 
 * Shows current activity on each device:
 * - Focus session status
 * - Vault lock state
 * - User presence (active/idle/away)
 */
export async function getDeviceState(deviceId: string): Promise<DeviceState> {
  return apiGet<DeviceState>(`/api/devices/${deviceId}/state`);
}

/**
 * Update device state
 * 
 * Reports current activity to server for cross-device sync.
 * Called frequently to keep state updated.
 */
export async function updateDeviceState(
  deviceId: string,
  state: Partial<DeviceState>
): Promise<DeviceState> {
  return apiPost<DeviceState>(
    `/api/devices/${deviceId}/state`,
    state
  );
}

/**
 * Send cross-device notification
 * 
 * Sends notification to other devices (e.g., vault locked, focus started).
 * Used for real-time coordination.
 */
export async function sendNotification(
  notification: Omit<CrossDeviceNotification, 'id' | 'created_at'>
): Promise<CrossDeviceNotification> {
  return apiPost<CrossDeviceNotification>(
    '/api/devices/notify',
    notification
  );
}

/**
 * Get pending notifications for current device
 * 
 * Retrieves notifications sent by other devices.
 * Used in polling loop to stay synchronized.
 */
export async function getPendingNotifications(): Promise<
  CrossDeviceNotification[]
> {
  return apiGet<CrossDeviceNotification[]>('/api/devices/notifications');
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  return apiPost<void>(
    `/api/devices/notifications/${notificationId}/read`,
    {}
  );
}

/**
 * Coordinate focus session across devices
 * 
 * Prevents focus conflicts (e.g., focus on phone while break on desktop).
 */
export async function coordinateFocusSession(
  coordination: SessionCoordination
): Promise<void> {
  return apiPost<void>(
    '/api/devices/coordinate/focus',
    coordination
  );
}

/**
 * Check for location anomalies
 * 
 * Detects suspicious login locations and notifies user.
 * Returns warning if login from new country/city or rapid movement detected.
 */
export async function checkLocationAnomalies(
  currentLocation: string
): Promise<LocationWarning | null> {
  return apiPost<LocationWarning | null>(
    '/api/devices/location-check',
    { current_location: currentLocation }
  );
}

/**
 * Acknowledge location warning
 * 
 * User confirms they recognize location.
 */
export async function acknowledgeLocationWarning(
  deviceId: string
): Promise<void> {
  return apiPost<void>(
    `/api/devices/${deviceId}/location-ack`,
    {}
  );
}

// ==================== Utility Functions ====================

/**
 * Check if device is stale (no activity for long time)
 */
export function isDeviceStale(device: Device, maxAgeDays: number = 30): boolean {
  const lastSeen = new Date(device.last_seen).getTime();
  const now = Date.now();
  const ageMs = now - lastSeen;
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  return ageMs > maxAgeMs;
}

/**
 * Format device name for display
 */
export function formatDeviceName(device: Device): string {
  const type = device.device_type.charAt(0).toUpperCase() +
    device.device_type.slice(1);
  return `${type} (${device.os})`;
}

/**
 * Get device emoji icon
 */
export function getDeviceIcon(
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'web'
): string {
  switch (deviceType) {
    case 'mobile':
      return '📱';
    case 'tablet':
      return '📊';
    case 'desktop':
      return '🖥️';
    case 'web':
      return '🌐';
  }
}

/**
 * Check if notification requires action
 */
export function notificationRequiresAction(
  notification: CrossDeviceNotification
): boolean {
  return [
    'vault_locked',
    'device_removed',
    'location_warning',
  ].includes(notification.notification_type);
}

/**
 * Get presence indicator
 */
export function getPresenceIndicator(
  presence: 'active' | 'idle' | 'away' | 'offline'
): string {
  switch (presence) {
    case 'active':
      return '🟢';
    case 'idle':
      return '🟡';
    case 'away':
      return '🟠';
    case 'offline':
      return '⚫';
  }
}

/**
 * Count active devices
 */
export function countActiveDevices(devices: Device[]): number {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return devices.filter((d) => new Date(d.last_seen) > oneHourAgo).length;
}

/**
 * Recommend device to remove (stale, untrusted)
 */
export function getRemovalCandidates(devices: Device[]): Device[] {
  return devices.filter(
    (d) => isDeviceStale(d, 60) || (!d.trusted && !d.is_current_device)
  );
}
