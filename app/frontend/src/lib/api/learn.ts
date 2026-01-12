/**
 * Learn API
 *
 * API client methods for learning system (topics, lessons, drills, progress).
 * All calls go through the backend at api.ecent.online.
 *
 * PARITY-037: Learn routes
 * REFACTOR: Uses shared client (January 2026)
 */

import { apiGet, apiPost } from './client';

// ============================================
// Types
// ============================================

export type LessonStatus = 'not_started' | 'in_progress' | 'completed' | 'review';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface LearnTopic {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  lesson_count: number;
  completed_count: number;
}

export interface LearnLesson {
  id: string;
  topic_id: string;
  key: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  difficulty: Difficulty;
  xp_reward: number;
  coin_reward: number;
  status: LessonStatus;
  has_quiz: boolean;
  has_audio: boolean;
}

export interface LessonContent {
  id: string;
  title: string;
  content_markdown: string | null;
  quiz_json: unknown | null;
  audio_url: string | null;
  progress: LessonProgress;
}

export interface LessonProgress {
  status: LessonStatus;
  started_at: string | null;
  completed_at: string | null;
  quiz_score: number | null;
  attempts: number;
}

export interface LearnDrill {
  id: string;
  topic_id: string;
  key: string;
  title: string;
  description: string | null;
  drill_type: string;
  difficulty: Difficulty;
  duration_seconds: number;
  xp_reward: number;
  best_score: number | null;
  current_streak: number;
}

export interface LearnProgressSummary {
  topics_started: number;
  lessons_completed: number;
  total_lessons: number;
  drills_practiced: number;
  total_xp_earned: number;
  current_streak_days: number;
}

export interface LearnOverview {
  progress: LearnProgressSummary;
  review_count: number;
  topics: LearnTopic[];
}

export interface ReviewItems {
  lessons_due: LearnLesson[];
  drills_due: LearnDrill[];
  total_due: number;
}

// Request types
export interface CompleteLessonRequest {
  quiz_score?: number;
}

export interface SubmitDrillRequest {
  score: number;
  correct_count: number;
  total_count: number;
  time_seconds: number;
}

// Response wrappers
interface OverviewWrapper {
  overview: LearnOverview;
}

interface TopicsWrapper {
  topics: LearnTopic[];
}

interface LessonsWrapper {
  lessons: LearnLesson[];
}

interface DrillsWrapper {
  drills: LearnDrill[];
}

interface LessonContentWrapper {
  lesson: LessonContent;
}

interface LessonProgressWrapper {
  progress: LessonProgress;
}

interface ReviewWrapper {
  review: ReviewItems;
}

interface ProgressWrapper {
  progress: LearnProgressSummary;
}

interface CompleteLessonResult {
  result: CompleteLessonResult;
}

interface DrillResult {
  result: DrillResultInfo;
}

interface DrillResultInfo {
  drill_id: string;
  score: number;
  xp_awarded: number;
  is_new_best: boolean;
  streak_continued: boolean;
  new_streak: number;
}

// ============================================
// Overview API
// ============================================

/** Get learning overview */
export async function getLearnOverview(): Promise<LearnOverview> {
  const response = await apiGet<OverviewWrapper>('/api/learn');
  return response.overview;
}

/** Get learning progress summary */
export async function getLearnProgress(): Promise<LearnProgressSummary> {
  const response = await apiGet<ProgressWrapper>('/api/learn/progress');
  return response.progress;
}

/** Get items due for review */
export async function getReviewItems(): Promise<ReviewItems> {
  const response = await apiGet<ReviewWrapper>('/api/learn/review');
  return response.review;
}

// ============================================
// Topics API
// ============================================

/** List all topics with progress */
export async function listTopics(): Promise<LearnTopic[]> {
  const response = await apiGet<TopicsWrapper>('/api/learn/topics');
  return response.topics;
}

/** List lessons for a topic */
export async function listLessons(topicId: string): Promise<LearnLesson[]> {
  const response = await apiGet<LessonsWrapper>(`/api/learn/topics/${topicId}/lessons`);
  return response.lessons;
}

/** List drills for a topic */
export async function listDrills(topicId: string): Promise<LearnDrill[]> {
  const response = await apiGet<DrillsWrapper>(`/api/learn/topics/${topicId}/drills`);
  return response.drills;
}

// ============================================
// Lessons API
// ============================================

/** Get lesson content */
export async function getLesson(id: string): Promise<LessonContent> {
  const response = await apiGet<LessonContentWrapper>(`/api/learn/lessons/${id}`);
  return response.lesson;
}

/** Start a lesson */
export async function startLesson(id: string): Promise<LessonProgress> {
  const response = await apiPost<LessonProgressWrapper>(`/api/learn/lessons/${id}/start`);
  return response.progress;
}

/** Complete a lesson */
export async function completeLesson(id: string, data?: CompleteLessonRequest): Promise<CompleteLessonResult> {
  const response = await apiPost<{ result: CompleteLessonResult }>(
    `/api/learn/lessons/${id}/complete`,
    data || {}
  );
  return response.result;
}

// ============================================
// Drills API
// ============================================

/** Submit drill result */
export async function submitDrill(id: string, data: SubmitDrillRequest): Promise<DrillResultInfo> {
  const response = await apiPost<DrillResult>(`/api/learn/drills/${id}/submit`, data);
  return response.result;
}
