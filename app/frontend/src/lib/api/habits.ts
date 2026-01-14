/**
 * Habits API
 *
 * API client methods for habit tracking.
 * All calls go through the backend at api.ecent.online.
 *
 * PARITY-026: Habits routes
 * REFACTOR: Uses shared client (January 2026)
 */

import { apiGet, apiPost } from './client';

// ============================================
// Types
// ============================================

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'custom';
  target_count: number;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  current_streak: number;
  longest_streak: number;
  last_completed_at: string | null;
  completed_today: boolean;
  sort_order: number;
}

export interface HabitsList {
  habits: Habit[];
}

export interface CreateHabitRequest {
  name: string;
  description?: string;
  frequency?: 'daily' | 'weekly' | 'custom';
  target_count?: number;
  icon?: string;
  color?: string;
}

export interface CompleteHabitResult {
  habit: Habit;
  new_streak: number;
  xp_awarded: number;
  streak_bonus: boolean;
}

export interface HabitAnalytics {
  total_habits: number;
  active_habits: number;
  completed_today: number;
  total_completions: number;
  completions_last_7_days: number;
  completions_last_30_days: number;
  completion_rate_7_days: number;
  completion_rate_30_days: number;
  longest_streak: number;
  active_streaks: number;
  last_completed_at: string | null;
}

// ============================================
// API Methods
// ============================================

/**
 * List all active habits with today's completion status
 * GET /api/habits
 */
export async function listHabits(): Promise<HabitsList> {
  const response = await apiGet<{ habits: Habit[] }>('/api/habits');
  return { habits: response.habits };
}

/**
 * Create a new habit
 * POST /api/habits
 */
export async function createHabit(req: CreateHabitRequest): Promise<Habit> {
  const response = await apiPost<{ habit: Habit }>('/api/habits', req);
  return response.habit;
}

/**
 * Complete a habit for today
 * POST /api/habits/:id/complete
 */
export async function completeHabit(habitId: string, notes?: string): Promise<CompleteHabitResult> {
  const response = await apiPost<{ result: CompleteHabitResult }>(
    `/api/habits/${habitId}/complete`,
    notes ? { notes } : undefined
  );
  return response.result;
}

/**
 * Get habit analytics
 * GET /api/habits/analytics
 */
export async function getHabitAnalytics(): Promise<HabitAnalytics> {
  const response = await apiGet<{ analytics: HabitAnalytics }>('/api/habits/analytics');
  return response.analytics;
}

// ============================================
// React Query Keys
// ============================================

export const habitsKeys = {
  all: ['habits'] as const,
  list: () => [...habitsKeys.all, 'list'] as const,
};
