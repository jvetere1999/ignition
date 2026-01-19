/**
 * User Preferences API Client
 * 
 * Manages user-level preferences including privacy modes, content retention,
 * notification settings, and theme preferences.
 */

import { apiGet, apiPatch } from './client';

// ==================== Types ====================

export interface UserSettings {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'auto';
  notifications_enabled: boolean;
  email_digest: 'daily' | 'weekly' | 'monthly' | 'never';
  timezone: string;
  language: string;
  privacy_mode: 'standard' | 'private';
  show_profile: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserSettingsRequest {
  theme?: 'light' | 'dark' | 'auto';
  notifications_enabled?: boolean;
  email_digest?: 'daily' | 'weekly' | 'monthly' | 'never';
  timezone?: string;
  language?: string;
  privacy_mode?: 'standard' | 'private';
  show_profile?: boolean;
}

export interface UserSettingsResponse {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'auto';
  notifications_enabled: boolean;
  email_digest: 'daily' | 'weekly' | 'monthly' | 'never';
  timezone: string;
  language: string;
  privacy_mode: 'standard' | 'private';
  show_profile: boolean;
  created_at: string;
  updated_at: string;
}

export interface PrivacyPreferencesResponse {
  default_mode: 'standard' | 'private';
  show_privacy_toggle: boolean;
  exclude_private_from_search: boolean;
  private_content_retention_days: number;
  standard_content_retention_days: number;
}

export interface UpdatePrivacyPreferencesRequest {
  default_mode?: 'standard' | 'private';
  show_privacy_toggle?: boolean;
  exclude_private_from_search?: boolean;
  private_content_retention_days?: number;
  standard_content_retention_days?: number;
}

// ==================== API Functions ====================

/**
 * Get all user settings
 * 
 * Retrieves user preferences including theme, notifications, timezone, etc.
 */
export async function getUserSettings(): Promise<UserSettingsResponse> {
  return apiGet<UserSettingsResponse>('/api/settings');
}

/**
 * Update user settings
 * 
 * Partially update user preferences. Only provided fields are updated.
 * 
 * @param settings - Settings to update
 * @returns Updated settings
 */
export async function updateUserSettings(
  settings: UpdateUserSettingsRequest
): Promise<UserSettingsResponse> {
  return apiPatch<UserSettingsResponse>(
    '/api/settings',
    settings
  );
}

/**
 * Get privacy preferences
 * 
 * Retrieves privacy mode settings and content retention policies.
 */
export async function getPrivacyPreferences(): Promise<PrivacyPreferencesResponse> {
  return apiGet<PrivacyPreferencesResponse>('/api/privacy/preferences');
}

/**
 * Update privacy preferences
 * 
 * Update default privacy mode, search exclusions, and content retention.
 * 
 * @param preferences - Privacy preferences to update
 * @returns Updated privacy preferences
 */
export async function updatePrivacyPreferences(
  preferences: UpdatePrivacyPreferencesRequest
): Promise<PrivacyPreferencesResponse> {
  return apiPatch<PrivacyPreferencesResponse>(
    '/api/privacy/preferences',
    preferences
  );
}

// ==================== Utility Functions ====================

/**
 * Check if user has privacy mode enabled by default
 */
export function isPrivacyModeDefault(prefs: PrivacyPreferencesResponse): boolean {
  return prefs.default_mode === 'private';
}

/**
 * Get content retention policy for specific mode
 */
export function getContentRetention(
  prefs: PrivacyPreferencesResponse,
  mode: 'private' | 'standard'
): number {
  return mode === 'private'
    ? prefs.private_content_retention_days
    : prefs.standard_content_retention_days;
}

/**
 * Format timezone for display
 */
export function formatTimezone(timezone: string): string {
  return timezone.replace('_', ' ');
}

/**
 * Get available languages
 */
export function getAvailableLanguages(): Array<{ code: string; name: string }> {
  return [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' },
  ];
}

/**
 * Get available timezones
 */
export function getAvailableTimezones(): string[] {
  return [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ];
}

/**
 * Get available email digest frequencies
 */
export function getAvailableDigestFrequencies(): Array<{
  value: 'daily' | 'weekly' | 'monthly' | 'never';
  label: string;
}> {
  return [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'never', label: 'Never' },
  ];
}
