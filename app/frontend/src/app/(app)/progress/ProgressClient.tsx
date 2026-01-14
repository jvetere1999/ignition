"use client";

/**
 * Progress Client Component
 * Displays user stats with Persona 5 style skill wheel
 *
 * Auto-refresh: Refetches on focus after 1 minute staleness (per SYNC.md)
 *
 * STORAGE RULE: Skills data should be stored in D1 via user_skills table.
 * localStorage is DEPRECATED when DISABLE_MASS_LOCAL_PERSISTENCE is enabled.
 */

import { useState, useEffect, useCallback } from "react";
import { safeFetch, API_BASE_URL } from "@/lib/api";
import { SkillWheel, DEFAULT_SKILLS, type Skill } from "@/components/progress";
import { useAutoRefresh } from "@/lib/hooks";
import { DISABLE_MASS_LOCAL_PERSISTENCE } from "@/lib/storage/deprecation";
import styles from "./page.module.css";

interface ProgressStats {
  totalXp: number;
  focusSessions: number;
  focusHours: number;
  currentStreak: number;
  level: number;
}

// Skills storage key
const SKILLS_STORAGE_KEY = "passion_progress_skills_v1";


export function ProgressClient() {
  const [skills, setSkills] = useState<Skill[]>(DEFAULT_SKILLS);
  const [stats, setStats] = useState<ProgressStats>({
    totalXp: 0,
    focusSessions: 0,
    focusHours: 0,
    currentStreak: 0,
    level: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivities, _setRecentActivities] = useState<{ label: string; xp: number; skill: string }[]>([]);

  // Load skills from localStorage (backend endpoint not available)
  useEffect(() => {
    async function loadSkills() {
      // Only fall back to localStorage if deprecation is disabled
      if (!DISABLE_MASS_LOCAL_PERSISTENCE) {
        try {
          const stored = localStorage.getItem(SKILLS_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored) as Skill[];
            setSkills(parsed);
          }
        } catch (e) {
          console.error("Failed to load skills from localStorage:", e);
        }
      }
      setIsLoading(false);
    }

    loadSkills();
  }, []);

  // Save skills to localStorage only if deprecation is disabled
  useEffect(() => {
    if (!isLoading && !DISABLE_MASS_LOCAL_PERSISTENCE) {
      try {
        localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(skills));
      } catch (e) {
        console.error("Failed to save skills:", e);
      }
    }
  }, [skills, isLoading]);

  // Fetch stats from API
  const fetchStats = useCallback(async () => {
    try {
      const [summaryRes, focusRes] = await Promise.all([
        safeFetch(`${API_BASE_URL}/api/gamification/summary`),
        safeFetch(`${API_BASE_URL}/api/focus/stats?period=week`),
      ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json() as {
          data?: { total_xp?: number; current_level?: number; current_streak?: number };
        };
        setStats((prev) => ({
          ...prev,
          totalXp: summaryData.data?.total_xp ?? 0,
          level: summaryData.data?.current_level ?? 1,
          currentStreak: summaryData.data?.current_streak ?? 0,
        }));
      }

      if (focusRes.ok) {
        const focusData = await focusRes.json() as {
          stats?: { total_focus_seconds?: number; completed_sessions?: number };
        };
        const totalFocusSeconds = focusData.stats?.total_focus_seconds ?? 0;
        setStats((prev) => ({
          ...prev,
          focusHours: Math.round(totalFocusSeconds / 3600),
          focusSessions: focusData.stats?.completed_sessions ?? 0,
        }));
      }
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh: refetch on focus after 1 minute staleness (per SYNC.md)
  // Pauses on page unload, soft refreshes on reload if stale
  useAutoRefresh({
    onRefresh: fetchStats,
    refreshKey: "progress",
    stalenessMs: 60000, // 1 minute per SYNC.md contract
    refreshOnMount: true,
    refetchOnFocus: true,
    refetchOnVisible: true,
    enabled: !isLoading,
  });

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading progress...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Progress</h1>
        <p className={styles.subtitle}>
          Track your growth and unlock your potential.
        </p>
      </header>

      {/* Skill Wheel */}
      <div className={styles.wheelSection}>
        <SkillWheel skills={skills} size={360} />
      </div>

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Total XP</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.statIcon}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <span className={styles.statValue}>{stats.totalXp.toLocaleString()}</span>
          <span className={styles.statChange}>{stats.totalXp === 0 ? "Start earning" : `Level ${stats.level}`}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Focus Sessions</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.statIcon}
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <span className={styles.statValue}>{stats.focusSessions}</span>
          <span className={styles.statChange}>{stats.focusSessions === 0 ? "Complete sessions" : "This week"}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Focus Hours</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.statIcon}
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <span className={styles.statValue}>{stats.focusHours}h</span>
          <span className={styles.statChange}>{stats.focusHours === 0 ? "Start focusing" : "This week"}</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Current Streak</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.statIcon}
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className={styles.statValue}>{stats.currentStreak}</span>
          <span className={styles.statChange}>{stats.currentStreak === 0 ? "Start a streak" : "days"}</span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.activitySection}>
        <div className={styles.activityHeader}>
          <h2 className={styles.sectionTitle}>Recent Activity</h2>
        </div>

        {recentActivities.length === 0 ? (
          <div className={styles.emptyActivity}>
            <p>Complete quests, focus sessions, and activities to earn XP!</p>
          </div>
        ) : (
          <div className={styles.activityList}>
            {recentActivities.map((activity, i) => (
              <div key={i} className={styles.activityItem}>
                <span className={styles.activityLabel}>{activity.label}</span>
                <span className={styles.activityXp}>+{activity.xp} XP</span>
                <span className={styles.activitySkill}>{activity.skill}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
