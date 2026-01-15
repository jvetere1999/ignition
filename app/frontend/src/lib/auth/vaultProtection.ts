/**
 * Vault Write Protection Middleware
 *
 * Prevents sensitive write operations (Ideas, Infobase, Journal) when vault is locked.
 * This ensures users cannot modify encrypted content while the vault is inaccessible.
 *
 * Protected operations:
 * - POST /api/ideas (create idea)
 * - PUT /api/ideas/:id (update idea)
 * - DELETE /api/ideas/:id (delete idea)
 * - POST /api/infobase (create entry)
 * - PUT /api/infobase/:id (update entry)
 * - DELETE /api/infobase/:id (delete entry)
 * - POST /api/learn/journal (create journal entry)
 * - PUT /api/learn/journal/:id (update entry)
 * - DELETE /api/learn/journal/:id (delete entry)
 */

import { ApiError } from './../../lib/api/client';

export class VaultLockedError extends ApiError {
  constructor(message: string = 'Vault is locked. Unlock to continue.') {
    super(message, 403, 'vault_locked');
  }
}

/**
 * Protected write endpoints that require unlocked vault
 */
const PROTECTED_WRITE_ENDPOINTS = [
  '/api/ideas',
  '/api/infobase',
  '/api/learn/journal',
];

/**
 * Check if operation should be protected by vault lock
 * @param method HTTP method
 * @param path Request path
 * @param isVaultLocked Whether vault is currently locked
 * @throws VaultLockedError if operation is protected and vault is locked
 */
export function checkVaultProtection(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  isVaultLocked: boolean
): void {
  // Only protect write operations (POST, PUT, DELETE)
  if (!['POST', 'PUT', 'DELETE'].includes(method)) {
    return;
  }

  // Only protect sensitive endpoints
  const isProtectedEndpoint = PROTECTED_WRITE_ENDPOINTS.some(
    endpoint => path.startsWith(endpoint)
  );

  if (!isProtectedEndpoint) {
    return;
  }

  // Block write if vault is locked
  if (isVaultLocked) {
    throw new VaultLockedError(
      `Cannot modify ${getFeatureName(path)} while vault is locked. Unlock to continue.`
    );
  }
}

/**
 * Get user-friendly feature name from endpoint path
 */
function getFeatureName(path: string): string {
  if (path.includes('/ideas')) return 'ideas';
  if (path.includes('/infobase')) return 'infobase entries';
  if (path.includes('/journal')) return 'journal entries';
  return 'protected content';
}
