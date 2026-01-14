"use client";

/**
 * Learn Dashboard Client Component
 * Shows continue item, review queue, weak areas, and activity
 */

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import type { ActivityItem, ContinueItem, LearnOverview, ReviewAnalytics, WeakArea } from "@/lib/api/learn";
import { getLearnOverview, getReviewAnalytics } from "@/lib/api/learn";

export function LearnDashboard() {
  const [overview, setOverview] = useState<LearnOverview | null>(null);
  const [reviewAnalytics, setReviewAnalytics] = useState<ReviewAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadOverview = async () => {
      try {
        const [overviewResult, analyticsResult] = await Promise.allSettled([
          getLearnOverview(),
          getReviewAnalytics(),
        ]);
        if (!isMounted) return;

        if (overviewResult.status === "fulfilled") {
          setOverview(overviewResult.value);
          setError(null);
        } else {
          setError("Failed to load dashboard");
        }

        if (analyticsResult.status === "fulfilled") {
          setReviewAnalytics(analyticsResult.value);
        }
      } catch {
        if (isMounted) {
          setError("Failed to load dashboard");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadOverview();
    return () => {
      isMounted = false;
    };
  }, []);

  const continueItem: ContinueItem | null = overview?.continue_item ?? null;
  const weakAreas: WeakArea[] = overview?.weak_areas ?? [];
  const activity: ActivityItem[] = overview?.recent_activity ?? [];
  const reviewCount = overview?.review_count ?? 0;
  const estimatedReviewMinutes = reviewCount > 0 ? Math.ceil(reviewCount * 0.5) : 0;
  const progress = overview?.progress;
  const hasReviewAnalytics = (reviewAnalytics?.totalReviews ?? 0) > 0;
  const retentionPct = reviewAnalytics ? Math.round(reviewAnalytics.retentionRate * 100) : 0;
  const avgInterval = reviewAnalytics ? reviewAnalytics.avgIntervalDays.toFixed(1) : "0.0";

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  const progressPct = useMemo(() => {
    if (!progress) return 0;
    if (progress.total_lessons === 0) return 0;
    return Math.round((progress.lessons_completed / progress.total_lessons) * 100);
  }, [progress]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Learning Dashboard</h1>
            <p className={styles.subtitle}>Keep your momentum going</p>
          </div>
          {progress ? (
            <div className={styles.streakBadge}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span>{progress.current_streak_days} day streak</span>
            </div>
          ) : null}
        </div>
      </header>

      <div className={styles.grid}>
        {/* Continue Learning */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Continue Learning</h2>
          {continueItem ? (
            <div className={styles.continueCard}>
              <div className={styles.continueInfo}>
                <span className={styles.continueBadge}>{continueItem.topic_name}</span>
                <h3>{continueItem.lesson_title}</h3>
                <p>Status: {continueItem.status.replaceAll("_", " ")}</p>
              </div>
              <div className={styles.continueProgress}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${Math.round(continueItem.progress_pct)}%` }}
                  />
                </div>
                <span>{Math.round(continueItem.progress_pct)}% complete</span>
              </div>
              <div className={styles.continueActions}>
                <Link href={`/learn/lessons/${continueItem.lesson_id}`} className={styles.startBtn}>
                  Continue lesson
                </Link>
              </div>
            </div>
          ) : (
            <div className={styles.emptyCard}>
              <p>No lessons in progress</p>
              <Link href="/learn/courses" className={styles.startBtn}>
                Start a Course
              </Link>
            </div>
          )}
        </section>

        {/* Review Queue */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Due for Review</h2>
          {reviewCount > 0 ? (
            <Link href="/learn/review" className={styles.reviewCard}>
              <div className={styles.reviewCount}>{reviewCount}</div>
              <div className={styles.reviewInfo}>
                <h3>Cards due today</h3>
                <p>~{estimatedReviewMinutes} minutes</p>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ) : (
            <div className={styles.emptyCard}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p>All caught up!</p>
              <span>No reviews due today</span>
            </div>
          )}
        </section>

        {/* Review Analytics */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Review Analytics</h2>
          {hasReviewAnalytics ? (
            <>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{reviewAnalytics?.totalReviews ?? 0}</span>
                  <span className={styles.statLabel}>Total reviews</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{reviewAnalytics?.reviewsLast7Days ?? 0}</span>
                  <span className={styles.statLabel}>Last 7 days</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{reviewAnalytics?.reviewsLast30Days ?? 0}</span>
                  <span className={styles.statLabel}>Last 30 days</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{retentionPct}%</span>
                  <span className={styles.statLabel}>Retention</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{avgInterval}d</span>
                  <span className={styles.statLabel}>Avg interval</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{reviewAnalytics?.totalLapses ?? 0}</span>
                  <span className={styles.statLabel}>Total lapses</span>
                </div>
              </div>
              {reviewAnalytics?.lastReviewedAt && (
                <p className={styles.analyticsMeta}>
                  Last reviewed on {new Date(reviewAnalytics.lastReviewedAt).toLocaleDateString()}
                </p>
              )}
            </>
          ) : (
            <div className={styles.emptyCard}>
              <p>No review data yet</p>
              <span>Complete a review session to populate analytics</span>
            </div>
          )}
        </section>

        {/* Weak Areas */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Areas to Improve</h2>
          {weakAreas.length > 0 ? (
            <ul className={styles.weakList}>
              {weakAreas.map((area, idx) => (
                <li key={`${area.concept_id || idx}`} className={styles.weakItem}>
                  <div className={styles.weakInfo}>
                    <h4>{area.term}</h4>
                    {area.suggested_lesson_id ? (
                      <span className={styles.weakLink}>Suggested lesson: {area.suggested_lesson_title || "Lesson"}</span>
                    ) : (
                      <span className={styles.weakLink}>Focus this concept in review</span>
                    )}
                  </div>
                  <span className={styles.lapseCount}>{area.lapses} lapses</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyCard}>
              <p>No weak areas identified yet</p>
              <span>Complete some lessons and reviews first</span>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actions}>
            <Link href="/learn/recipes" className={styles.actionCard}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 3h6v5l4 9H5l4-9V3z" />
              </svg>
              <span>Generate Recipe</span>
            </Link>
            <Link href="/learn/journal" className={styles.actionCard}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>Log a Patch</span>
            </Link>
            <Link href="/learn/practice" className={styles.actionCard}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <span>Practice</span>
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className={styles.statsSection}>
          <h2 className={styles.sectionTitle}>Your Progress</h2>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{progress?.lessons_completed ?? 0}</span>
              <span className={styles.statLabel}>Lessons</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{progress?.drills_practiced ?? 0}</span>
              <span className={styles.statLabel}>Drills</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{progress?.topics_started ?? 0}</span>
              <span className={styles.statLabel}>Topics started</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{progressPct}%</span>
              <span className={styles.statLabel}>Course progress</span>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent Activity</h2>
          {activity.length > 0 ? (
            <ul className={styles.activityList}>
              {activity.map((item, i) => (
                <li key={i} className={styles.activityItem}>
                  <span className={styles.activityType}>{item.item_type}</span>
                  <span className={styles.activityTitle}>{item.title}</span>
                  <span className={styles.activityDate}>
                    {new Date(item.completed_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.emptyCard}>
              <p>No recent activity</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default LearnDashboard;
