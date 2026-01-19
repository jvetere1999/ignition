/**
 * Crypto Policy API Client
 * 
 * Provides type-safe access to cryptographic policy endpoints.
 * Crypto policies define which algorithms, parameters, and standards are in use.
 */

import { apiGet, apiPost } from './client';

// ==================== Types ====================

export interface CryptoPolicy {
  version: string;
  algorithm: string;
  kdf_algorithm: string;
  kdf_iterations: number;
  kdf_memory_mb: number | null;
  tls_minimum: string;
  effective_date: string; // ISO date string
  deprecated_date: string | null;
  migration_deadline: string | null;
  rationale?: string;
  created_at: string;
}

export interface GetCryptoPolicyResponse {
  version: string;
  algorithm: string;
  kdf_algorithm: string;
  kdf_iterations: number;
  kdf_memory_mb: number | null;
  tls_minimum: string;
  effective_date: string;
  deprecated_date: string | null;
  migration_deadline: string | null;
  is_current: boolean;
  is_deprecated: boolean;
}

export interface CreateCryptoPolicyRequest {
  version: string;
  algorithm: string;
  kdf_algorithm: string;
  kdf_iterations: number;
  kdf_memory_mb?: number | null;
  tls_minimum: string;
  effective_date: string;
  rationale?: string;
}

export interface DeprecateCryptoPolicyRequest {
  version: string;
  deprecated_date: string;
  migration_deadline?: string;
  rationale?: string;
}

// ==================== API Functions ====================

/**
 * Get the current active crypto policy
 * 
 * Returns the policy that is currently in use for encryption operations.
 * This is the policy that new vaults are created with.
 */
export async function getCurrentCryptoPolicy(): Promise<GetCryptoPolicyResponse> {
  return apiGet<GetCryptoPolicyResponse>('/api/crypto-policy/current');
}

/**
 * Get a specific crypto policy by version
 * 
 * @param version - Semantic version string (e.g., "1.0.0", "2.0.0")
 * @returns Crypto policy with deprecation status
 */
export async function getCryptoPolicyByVersion(version: string): Promise<GetCryptoPolicyResponse> {
  return apiGet<GetCryptoPolicyResponse>(`/api/crypto-policy/${version}`);
}

/**
 * List all crypto policies (current and deprecated)
 * 
 * Returns complete history of policies ordered by effective date (newest first).
 * Useful for understanding algorithm migration timeline.
 */
export async function listAllCryptoPolicies(): Promise<GetCryptoPolicyResponse[]> {
  return apiGet<GetCryptoPolicyResponse[]>('/api/crypto-policy/');
}

/**
 * Create a new crypto policy version
 * 
 * Creates a new policy version with specified algorithms and parameters.
 * Typically called by administrators to roll out new standards.
 * 
 * @param request - Policy details (version, algorithm, KDF params, etc.)
 * @returns Created policy
 * @throws Error if version already exists
 */
export async function createCryptoPolicy(
  request: CreateCryptoPolicyRequest
): Promise<GetCryptoPolicyResponse> {
  return apiPost<GetCryptoPolicyResponse>(
    '/api/crypto-policy/',
    request
  );
}

/**
 * Deprecate a crypto policy version
 * 
 * Marks a policy as deprecated with a migration deadline.
 * Existing vaults with old policy can still unlock, but new vaults must use current policy.
 * 
 * @param request - Deprecation details (version, dates, rationale)
 * @returns Deprecated policy with new dates
 */
export async function deprecateCryptoPolicy(
  request: DeprecateCryptoPolicyRequest
): Promise<GetCryptoPolicyResponse> {
  return apiPost<GetCryptoPolicyResponse>(
    `/api/crypto-policy/${request.version}/deprecate`,
    request
  );
}

// ==================== Utility Functions ====================

/**
 * Check if a policy version is deprecated
 * 
 * @param policy - Policy to check
 * @returns True if policy has a deprecation date
 */
export function isPolicyDeprecated(policy: GetCryptoPolicyResponse): boolean {
  return policy.is_deprecated || policy.deprecated_date !== null;
}

/**
 * Check if a policy is past its migration deadline
 * 
 * @param policy - Policy to check
 * @returns True if migration deadline has passed
 */
export function isPastMigrationDeadline(policy: GetCryptoPolicyResponse): boolean {
  if (!policy.migration_deadline) return false;
  return new Date(policy.migration_deadline) < new Date();
}

/**
 * Format policy for display
 * 
 * @param policy - Policy to format
 * @returns Human-readable policy summary
 */
export function formatCryptoPolicy(policy: GetCryptoPolicyResponse): string {
  const status = policy.is_current ? 'Active' : policy.is_deprecated ? 'Deprecated' : 'Inactive';
  return `${policy.version} - ${policy.algorithm} (${status})`;
}
