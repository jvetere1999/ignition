/**
 * Encrypted Sync API Client
 * 
 * Handles E2E encrypted data replication across devices.
 * Implements delta sync for efficient bandwidth usage.
 * All content encrypted client-side before transmission.
 */

import { apiPost, apiGet } from './client';

// ==================== Types ====================

/**
 * Encrypted content blob with metadata
 */
export interface EncryptedContent {
  id: string;
  content_type: 'idea' | 'infobase' | 'journal' | 'focus';
  encrypted_data: string; // Base64 encoded
  nonce: string; // Unique nonce for encryption
  algorithm: string; // e.g., "AES-256-GCM"
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Sync checkpoint for delta sync
 */
export interface SyncCheckpoint {
  device_id: string;
  last_sync_timestamp: string;
  content_version: number;
  etag: string;
}

/**
 * Delta sync request - only changes since checkpoint
 */
export interface DeltaSyncRequest {
  checkpoint: SyncCheckpoint;
  device_id: string;
  include_deleted: boolean;
}

/**
 * Delta sync response with changes
 */
export interface DeltaSyncResponse {
  checkpoint: SyncCheckpoint;
  new_items: EncryptedContent[];
  updated_items: EncryptedContent[];
  deleted_items: string[]; // List of IDs
  has_more: boolean;
  next_offset?: number;
}

/**
 * Full sync request (for initial setup or recovery)
 */
export interface FullSyncRequest {
  device_id: string;
  from_timestamp?: string; // Optional: sync from specific point
}

/**
 * Full sync response with all content
 */
export interface FullSyncResponse {
  checkpoint: SyncCheckpoint;
  items: EncryptedContent[];
  total_count: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

/**
 * Sync conflict when device has divergent changes
 */
export interface SyncConflict {
  content_id: string;
  device_version: EncryptedContent;
  server_version: EncryptedContent;
  resolution: 'device_wins' | 'server_wins' | 'merge';
}

/**
 * Sync conflict resolution request
 */
export interface ResolveConflictRequest {
  conflicts: Array<{
    content_id: string;
    resolution: 'device_wins' | 'server_wins';
  }>;
}

/**
 * Sync status info
 */
export interface SyncStatus {
  last_sync: string | null;
  pending_changes: number;
  is_syncing: boolean;
  sync_errors: string[];
  device_id: string;
}

// ==================== API Functions ====================

/**
 * Perform delta sync - efficient incremental sync
 * 
 * Only syncs changes since last checkpoint. Minimal bandwidth.
 * Recommended for frequent polling (every 30-60 seconds).
 * 
 * @param request - Delta sync request with checkpoint
 * @returns Delta sync response with changes
 */
export async function deltaSyncEncrypted(
  request: DeltaSyncRequest
): Promise<DeltaSyncResponse> {
  return apiPost<DeltaSyncResponse>(
    '/api/sync/encrypted/delta',
    request
  );
}

/**
 * Perform full sync - complete data replication
 * 
 * Syncs all content from server. Used for:
 * - Initial setup on new device
 * - Recovery after data loss
 * - Explicit full refresh
 * 
 * @param request - Full sync request
 * @returns Full sync response with all content
 */
export async function fullSyncEncrypted(
  request: FullSyncRequest
): Promise<FullSyncResponse> {
  return apiPost<FullSyncResponse>(
    '/api/sync/encrypted/full',
    request
  );
}

/**
 * Upload encrypted content changes
 * 
 * Sends local changes to server for replication.
 * All content must be encrypted client-side before calling.
 * 
 * @param items - Encrypted content items
 * @param device_id - Source device ID
 * @returns Confirmation of upload
 */
export async function uploadEncryptedChanges(
  items: EncryptedContent[],
  device_id: string
): Promise<{
  uploaded_count: number;
  checkpoint: SyncCheckpoint;
}> {
  return apiPost<
    { uploaded_count: number; checkpoint: SyncCheckpoint }
  >('/api/sync/encrypted/upload', {
    items,
    device_id,
  });
}

/**
 * Handle sync conflicts
 * 
 * When devices have divergent changes, resolve conflicts.
 * Typically: device_wins for local edits, server_wins for conflicts.
 * 
 * @param request - Conflict resolution decisions
 * @returns Resolved conflicts
 */
export async function resolveConflicts(
  request: ResolveConflictRequest
): Promise<{ resolved_count: number }> {
  return apiPost<{ resolved_count: number }>(
    '/api/sync/encrypted/resolve',
    request
  );
}

/**
 * Get current sync status
 * 
 * Returns information about sync state and pending changes.
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  return apiGet<SyncStatus>('/api/sync/encrypted/status');
}

/**
 * Clear sync history for device
 * 
 * Removes all sync checkpoints for device (forces full sync on next attempt).
 * Use with caution.
 */
export async function resetDeviceSync(device_id: string): Promise<void> {
  return apiPost<void>('/api/sync/encrypted/reset', {
    device_id,
  });
}

// ==================== Utility Functions ====================

/**
 * Check if sync checkpoint is expired
 * 
 * Checkpoints older than 90 days should be refreshed
 */
export function isCheckpointExpired(checkpoint: SyncCheckpoint): boolean {
  const checkpointTime = new Date(checkpoint.last_sync_timestamp).getTime();
  const now = Date.now();
  const ageMs = now - checkpointTime;
  const maxAgeMs = 90 * 24 * 60 * 60 * 1000; // 90 days

  return ageMs > maxAgeMs;
}

/**
 * Calculate sync size for bandwidth estimation
 */
export function calculateSyncSize(items: EncryptedContent[]): number {
  return items.reduce((total, item) => {
    return total + item.encrypted_data.length;
  }, 0);
}

/**
 * Format sync status for display
 */
export function formatSyncStatus(status: SyncStatus): string {
  if (status.is_syncing) {
    return 'Syncing...';
  }

  if (status.sync_errors.length > 0) {
    return `Sync error (${status.sync_errors.length})`;
  }

  if (status.pending_changes > 0) {
    return `${status.pending_changes} pending changes`;
  }

  if (status.last_sync) {
    const lastSyncTime = new Date(status.last_sync);
    const minutes = Math.floor(
      (Date.now() - lastSyncTime.getTime()) / (60 * 1000)
    );

    if (minutes === 0) return 'Just synced';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  }

  return 'Never synced';
}

/**
 * Get conflict resolution recommendation
 */
export function getConflictResolution(
  deviceVersion: EncryptedContent,
  serverVersion: EncryptedContent
): 'device_wins' | 'server_wins' {
  // Device version is newer: device wins
  if (
    new Date(deviceVersion.updated_at).getTime() >
    new Date(serverVersion.updated_at).getTime()
  ) {
    return 'device_wins';
  }

  // Server version is newer: server wins
  return 'server_wins';
}

/**
 * Check if sync needs attention
 */
export function syncNeedsAttention(status: SyncStatus): boolean {
  return (
    status.sync_errors.length > 0 ||
    (status.pending_changes > 100 && status.last_sync === null)
  );
}
