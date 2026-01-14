"use client";

/**
 * Lesson Client Component
 * Loads lesson content, starts progress, and handles quizzes.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import {
  completeLesson,
  getLesson,
  startLesson,
  type CompleteLessonResult,
  type LessonContent,
} from "@/lib/api/learn";
import { API_BASE_URL } from "@/lib/api";

type QuizQuestion = {
  prompt: string;
  options: string[];
  correctIndex?: number;
  correctText?: string;
};

type NormalizedQuiz = {
  title?: string;
  questions: QuizQuestion[];
};

function normalizeQuiz(raw: unknown): NormalizedQuiz | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;
  const questionsRaw = Array.isArray(obj.questions)
    ? obj.questions
    : Array.isArray(obj.items)
    ? obj.items
    : Array.isArray(raw)
    ? raw
    : null;

  if (!Array.isArray(questionsRaw) || questionsRaw.length === 0) return null;

  const questions: QuizQuestion[] = [];

  for (const entry of questionsRaw) {
    if (!entry || typeof entry !== "object") continue;
    const q = entry as Record<string, unknown>;
    const prompt =
      (q.prompt as string | undefined) ||
      (q.question as string | undefined) ||
      (q.text as string | undefined) ||
      (q.title as string | undefined);

    const options =
      (q.options as string[] | undefined) ||
      (q.choices as string[] | undefined) ||
      (q.answers as string[] | undefined);

    if (!prompt || !Array.isArray(options) || options.length === 0) continue;

    const indexCandidate =
      q.correct_index ??
      q.answer_index ??
      q.correctIndex ??
      q.answerIndex;

    const correctIndex =
      typeof indexCandidate === "number" ? indexCandidate : undefined;

    const correctText =
      typeof q.answer === "string"
        ? q.answer
        : typeof q.correct === "string"
        ? q.correct
        : undefined;

    questions.push({
      prompt,
      options,
      correctIndex,
      correctText,
    });
  }

  if (questions.length === 0) return null;

  const title = typeof obj.title === "string" ? obj.title : undefined;
  return { title, questions };
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function isCorrectAnswer(question: QuizQuestion, selectedIndex: number | null): boolean | null {
  if (selectedIndex === null) return null;
  if (typeof question.correctIndex === "number") {
    return selectedIndex === question.correctIndex;
  }
  if (question.correctText) {
    return normalizeText(question.options[selectedIndex]) === normalizeText(question.correctText);
  }
  return null;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
}

interface LessonClientProps {
  lessonId: string;
}

export function LessonClient({ lessonId }: LessonClientProps) {
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completion, setCompletion] = useState<CompleteLessonResult | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);

  const quiz = useMemo(() => normalizeQuiz(lesson?.quiz_json ?? null), [lesson?.quiz_json]);
  const isCompleted = lesson?.progress.status === "completed";

  const audioUrl = useMemo(() => {
    const raw = lesson?.audio_url;
    if (!raw) return null;
    return raw.startsWith("http") ? raw : `${API_BASE_URL}${raw}`;
  }, [lesson?.audio_url]);

  const contentHtml = useMemo(() => {
    const markdown = lesson?.content_markdown;
    if (!markdown) return null;
    return markdown
      .replace(/^## (.+)$/gm, `<h2 class="${styles.mdH2}">$1</h2>`)
      .replace(/^### (.+)$/gm, `<h3 class="${styles.mdH3}">$1</h3>`)
      .replace(/^\- (.+)$/gm, "<li>$1</li>")
      .replace(/^(\d+)\\. (.+)$/gm, "<li>$2</li>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/<\/li>\n<li>/g, "</li><li>");
  }, [lesson?.content_markdown]);

  useEffect(() => {
    let isMounted = true;
    const loadLesson = async () => {
      try {
        const result = await getLesson(lessonId);
        if (!isMounted) return;
        setLesson(result);
        setError(null);

        if (result.progress.status === "not_started") {
          const progress = await startLesson(lessonId);
          if (!isMounted) return;
          setLesson((prev) => (prev ? { ...prev, progress } : prev));
        }
      } catch {
        if (isMounted) {
          setError("Failed to load lesson");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadLesson();
    return () => {
      isMounted = false;
    };
  }, [lessonId]);

  const allAnswered = useMemo(() => {
    if (!quiz) return false;
    return quiz.questions.every((_, idx) => typeof answers[idx] === "number");
  }, [quiz, answers]);

  const scoreQuiz = useCallback(() => {
    if (!quiz) return null;
    let correct = 0;
    let gradable = 0;
    quiz.questions.forEach((question, index) => {
      const result = isCorrectAnswer(question, answers[index] ?? null);
      if (result === null) return;
      gradable += 1;
      if (result) correct += 1;
    });
    if (gradable === 0) return null;
    return Math.round((correct / gradable) * 100);
  }, [quiz, answers]);

  const handleComplete = useCallback(
    async (score: number | null) => {
      if (!lesson || submitting) return;
      setSubmitting(true);
      try {
        const result = await completeLesson(lesson.id, score !== null ? { quiz_score: score } : undefined);
        setCompletion(result);
        setSubmittedScore(score);
        setLesson((prev) =>
          prev
            ? {
                ...prev,
                progress: {
                  ...prev.progress,
                  status: "completed",
                  completed_at: new Date().toISOString(),
                  quiz_score: score ?? prev.progress.quiz_score,
                },
              }
            : prev
        );
      } catch {
        setError("Failed to complete lesson");
      } finally {
        setSubmitting(false);
      }
    },
    [lesson, submitting]
  );

  const handleSubmitQuiz = useCallback(async () => {
    const score = scoreQuiz();
    await handleComplete(score);
  }, [handleComplete, scoreQuiz]);

  if (loading) {
    return <div className={styles.loading}>Loading lesson...</div>;
  }

  if (error || !lesson) {
    return <div className={styles.error}>{error || "Lesson not found"}</div>;
  }

  return (
    <div className={styles.lesson}>
      <nav className={styles.breadcrumb}>
        <Link href="/learn">Learn</Link>
        <span>/</span>
        <Link href="/learn/courses">Courses</Link>
        <span>/</span>
        <span>{lesson.title}</span>
      </nav>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{lesson.title}</h1>
          <p className={styles.meta}>
            Status: <strong>{lesson.progress.status.replaceAll("_", " ")}</strong>
            <span>Started: {formatDate(lesson.progress.started_at)}</span>
            <span>Completed: {formatDate(lesson.progress.completed_at)}</span>
          </p>
        </div>
        {!isCompleted && (
          <button
            className={styles.completeButton}
            onClick={() => handleComplete(null)}
            disabled={submitting}
          >
            Mark complete
          </button>
        )}
      </header>

      {audioUrl && (
        <section className={styles.audioSection}>
          <h2>Audio lesson</h2>
          <audio controls src={audioUrl} className={styles.audioPlayer} />
        </section>
      )}

      <section className={styles.contentSection}>
        <h2>Lesson content</h2>
        {contentHtml ? (
          <article
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        ) : (
          <div className={styles.emptyContent}>No content yet.</div>
        )}
      </section>

      <section className={styles.quizSection}>
        <h2>Quiz assessment</h2>
        {quiz ? (
          <>
            {quiz.title && <p className={styles.quizTitle}>{quiz.title}</p>}
            <div className={styles.quizList}>
              {quiz.questions.map((question, index) => (
                <div key={`${index}-${question.prompt}`} className={styles.quizCard}>
                  <p className={styles.quizPrompt}>
                    {index + 1}. {question.prompt}
                  </p>
                  <div className={styles.quizOptions}>
                    {question.options.map((option, optionIndex) => (
                      <label key={`${index}-${optionIndex}`} className={styles.quizOption}>
                        <input
                          type="radio"
                          name={`question-${index}`}
                          checked={answers[index] === optionIndex}
                          onChange={() => setAnswers((prev) => ({ ...prev, [index]: optionIndex }))}
                          disabled={isCompleted}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {!isCompleted && (
              <button
                className={styles.submitButton}
                onClick={handleSubmitQuiz}
                disabled={!allAnswered || submitting}
              >
                Submit quiz
              </button>
            )}
            {submittedScore !== null && (
              <div className={styles.quizResult}>Score: {submittedScore}%</div>
            )}
            {lesson.progress.quiz_score !== null && submittedScore === null && (
              <div className={styles.quizResult}>Last score: {lesson.progress.quiz_score}%</div>
            )}
          </>
        ) : (
          <div className={styles.emptyContent}>No quiz for this lesson.</div>
        )}
      </section>

      {completion && (
        <section className={styles.completionBanner}>
          <strong>Lesson completed.</strong>
          <span>XP +{completion.xp_awarded}</span>
          <span>Coins +{completion.coins_awarded}</span>
        </section>
      )}
    </div>
  );
}
