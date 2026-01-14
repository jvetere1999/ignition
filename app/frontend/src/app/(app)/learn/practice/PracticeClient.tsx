"use client";

/**
 * Practice Client Component
 * Lists drills by topic and logs drill sessions.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";
import {
  listDrills,
  listTopics,
  submitDrill,
  type LearnDrill,
  type LearnTopic,
} from "@/lib/api/learn";
import { LoadingState } from "@/components/ui";

type DrillEntry = LearnDrill & { topic: LearnTopic };

type DrillFormState = {
  correctCount: number | "";
  totalCount: number | "";
  timeSeconds: number | "";
  error?: string | null;
};

const DEFAULT_FORM_STATE: DrillFormState = {
  correctCount: "",
  totalCount: "",
  timeSeconds: "",
  error: null,
};

export function PracticeClient() {
  const [topics, setTopics] = useState<LearnTopic[]>([]);
  const [drills, setDrills] = useState<DrillEntry[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [activeDrillId, setActiveDrillId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, DrillFormState>>({});
  const [loading, setLoading] = useState(true);
  const [drillsLoading, setDrillsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTopics = useCallback(async () => {
    try {
      const data = await listTopics();
      setTopics(data);
      setSelectedTopicId(data[0]?.id ?? null);
    } catch {
      setError("Failed to load topics");
    }
  }, []);

  const loadDrills = useCallback(async (topicId: string) => {
    setDrillsLoading(true);
    try {
      const data = await listDrills(topicId);
      const topic = topics.find((item) => item.id === topicId);
      if (!topic) return;
      setDrills(data.map((drill) => ({ ...drill, topic })));
      setError(null);
    } catch {
      setError("Failed to load drills");
    } finally {
      setDrillsLoading(false);
    }
  }, [topics]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      await loadTopics();
      if (!isMounted) return;
      setLoading(false);
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [loadTopics]);

  useEffect(() => {
    if (!selectedTopicId) return;
    loadDrills(selectedTopicId);
  }, [selectedTopicId, loadDrills]);

  const activeForm = activeDrillId ? formState[activeDrillId] : undefined;

  const setFormValue = (drillId: string, patch: Partial<DrillFormState>) => {
    setFormState((prev) => ({
      ...prev,
      [drillId]: {
        ...(prev[drillId] || DEFAULT_FORM_STATE),
        ...patch,
      },
    }));
  };

  const computedScores = useMemo(() => {
    const scores: Record<string, number | null> = {};
    drills.forEach((drill) => {
      const state = formState[drill.id];
      if (!state) return;
      const correct = typeof state.correctCount === "number" ? state.correctCount : null;
      const total = typeof state.totalCount === "number" ? state.totalCount : null;
      if (correct === null || total === null || total <= 0) {
        scores[drill.id] = null;
        return;
      }
      scores[drill.id] = Math.round((correct / total) * 100);
    });
    return scores;
  }, [drills, formState]);

  const handleSubmit = useCallback(async () => {
    if (!activeDrillId) return;
    const state = formState[activeDrillId] || DEFAULT_FORM_STATE;
    const correct = typeof state.correctCount === "number" ? state.correctCount : null;
    const total = typeof state.totalCount === "number" ? state.totalCount : null;
    const timeSeconds = typeof state.timeSeconds === "number" ? state.timeSeconds : null;

    if (correct === null || total === null || timeSeconds === null) {
      setFormValue(activeDrillId, { error: "Fill out all fields to submit." });
      return;
    }
    if (total <= 0 || correct < 0 || correct > total) {
      setFormValue(activeDrillId, { error: "Correct count must be between 0 and total." });
      return;
    }

    const score = Math.round((correct / total) * 100);
    setFormValue(activeDrillId, { error: null });

    try {
      await submitDrill(activeDrillId, {
        score,
        correct_count: correct,
        total_count: total,
        time_seconds: timeSeconds,
      });
      setActiveDrillId(null);
      setFormValue(activeDrillId, DEFAULT_FORM_STATE);
      if (selectedTopicId) {
        loadDrills(selectedTopicId);
      }
    } catch {
      setFormValue(activeDrillId, { error: "Failed to submit drill result." });
    }
  }, [activeDrillId, formState, loadDrills, selectedTopicId]);

  if (loading) {
    return <LoadingState message="Loading practice drills..." />;
  }

  if (error && topics.length === 0) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.practice}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Practice</h1>
          <p className={styles.subtitle}>
            Quick drills to reinforce your lessons. Log results to build streaks.
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Topics</h2>
          <div className={styles.topicList}>
            {topics.map((topic) => (
              <button
                key={topic.id}
                className={`${styles.topicButton} ${selectedTopicId === topic.id ? styles.topicActive : ""}`}
                onClick={() => setSelectedTopicId(topic.id)}
              >
                <span>{topic.name}</span>
                <span className={styles.topicMeta}>{topic.lesson_count} lessons</span>
              </button>
            ))}
          </div>
        </aside>

        <section className={styles.main}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              {selectedTopicId
                ? topics.find((topic) => topic.id === selectedTopicId)?.name || "Drills"
                : "Drills"}
            </h2>
            <span className={styles.sectionMeta}>
              {drills.length} drill{drills.length === 1 ? "" : "s"}
            </span>
          </div>

          {drillsLoading ? (
            <div className={styles.loadingCard}>Loading drills...</div>
          ) : drills.length === 0 ? (
            <div className={styles.emptyCard}>
              <p>No drills available for this topic yet.</p>
            </div>
          ) : (
            <div className={styles.drillGrid}>
              {drills.map((drill) => {
                const isActive = activeDrillId === drill.id;
                const state = formState[drill.id] || DEFAULT_FORM_STATE;
                return (
                  <div key={drill.id} className={styles.drillCard}>
                    <div className={styles.drillHeader}>
                      <div>
                        <h3 className={styles.drillTitle}>{drill.title}</h3>
                        <p className={styles.drillDesc}>
                          {drill.description || "Practice this skill with a quick session."}
                        </p>
                      </div>
                      <span className={styles.drillDifficulty}>{drill.difficulty}</span>
                    </div>
                    <div className={styles.drillMeta}>
                      <span>{Math.round(drill.duration_seconds / 60)} min</span>
                      <span>{drill.xp_reward} XP</span>
                      <span>Best: {drill.best_score ?? "—"}</span>
                      <span>Streak: {drill.current_streak}</span>
                    </div>

                    <button
                      className={styles.logButton}
                      onClick={() => setActiveDrillId(isActive ? null : drill.id)}
                    >
                      {isActive ? "Close Log" : "Log Session"}
                    </button>

                    {isActive && (
                      <div className={styles.logPanel}>
                        <div className={styles.logGrid}>
                          <label className={styles.logField}>
                            Correct
                            <input
                              type="number"
                              min={0}
                              value={state.correctCount}
                              onChange={(event) =>
                                setFormValue(drill.id, {
                                  correctCount: event.target.value === "" ? "" : Number(event.target.value),
                                })
                              }
                            />
                          </label>
                          <label className={styles.logField}>
                            Total
                            <input
                              type="number"
                              min={1}
                              value={state.totalCount}
                              onChange={(event) =>
                                setFormValue(drill.id, {
                                  totalCount: event.target.value === "" ? "" : Number(event.target.value),
                                })
                              }
                            />
                          </label>
                          <label className={styles.logField}>
                            Time (sec)
                            <input
                              type="number"
                              min={1}
                              value={state.timeSeconds}
                              onChange={(event) =>
                                setFormValue(drill.id, {
                                  timeSeconds: event.target.value === "" ? "" : Number(event.target.value),
                                })
                              }
                            />
                          </label>
                        </div>
                        <div className={styles.logFooter}>
                          <span className={styles.scorePreview}>
                            Score: {computedScores[drill.id] !== null && computedScores[drill.id] !== undefined ? `${computedScores[drill.id]}%` : "—"}
                          </span>
                          <button className={styles.submitButton} onClick={handleSubmit}>
                            Submit Result
                          </button>
                        </div>
                        {state.error && <p className={styles.errorText}>{state.error}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
