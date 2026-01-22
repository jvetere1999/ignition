/**
 * Vault Lock API Client
 * 
 * Provides interface for locking/unlocking vault and checking lock state.
 * Used by VaultProvider and UI components to manage vault lifecycle.
 */

import { getApiBaseUrl } from "@/lib/config/environment";

const API_BASE_URL = getApiBaseUrl();

export interface VaultLockState {
  locked_at: string | null;
  lock_reason: string | null;
}

export interface UnlockVaultResponse {
  locked_at: string | null;
  lock_reason: string | null;
}

/**
 * Lock the user's vault with specified reason
 */
export async function lockVault(): Promise<void> {
  return;
}

/**
 * Unlock the user's vault after passkey session
 */
export async function unlockVault(): Promise<UnlockVaultResponse> {
  return {
    locked_at: null,
    lock_reason: null,
  };
}

/**
 * Get current vault lock state
 */
export async function getVaultLockState(): Promise<VaultLockState> {
  const response = await fetch(`${API_BASE_URL}/api/vault/state`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json() as Record<string, unknown>;
    throw new Error((error.message as string) || 'Failed to fetch vault state');
  }

  return response.json();
}

/**
 * Check if vault is currently locked
 */
export async function isVaultLocked(): Promise<boolean> {
  try {
    const state = await getVaultLockState();
    return state.locked_at !== null;
  } catch (error) {
    console.error('Failed to check vault lock state:', error);
    return true; // Assume locked on error (safer default)
  }
}
