"use client";

/**
 * Courses Client Component
 * Renders live courses/topics from the backend (server-driven).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { listLessons, listTopics, type LearnLesson, type LearnTopic } from "@/lib/api/learn";

interface CourseWithLessons {
  topic: LearnTopic;
  lessons: LearnLesson[];
}

export function CoursesClient() {
  const [courses, setCourses] = useState<LearnTopic[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithLessons | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const topics = await listTopics();
        if (!isMounted) return;
        setCourses(topics);
        setError(null);
      } catch {
        if (isMounted) setError("Failed to load courses");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadLessons = async (topic: LearnTopic) => {
    setLessonsLoading(true);
    try {
      const lessons = await listLessons(topic.id);
      setSelectedCourse({ topic, lessons });
    } catch {
      setError("Failed to load lessons");
    } finally {
      setLessonsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading courses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Courses</h1>
        <p className={styles.subtitle}>
          Structured learning paths delivered by the server. Pick a course to view its lessons.
        </p>
      </header>

      <div className={styles.courseGrid}>
        {courses.map((course) => {
          const progressPct =
            course.lesson_count > 0
              ? Math.round((course.completed_count / course.lesson_count) * 100)
              : 0;
          return (
            <button
              key={course.id}
              className={styles.courseCard}
              onClick={() => loadLessons(course)}
              aria-label={`Open ${course.name}`}
            >
              <div className={styles.courseMeta}>
                <span className={styles.synth}>{course.category || "Course"}</span>
                <span className={styles.difficulty}>{progressPct}% complete</span>
              </div>
              <h3 className={styles.courseTitle}>{course.name}</h3>
              <p className={styles.courseDesc}>{course.description || "Keep learning to unlock more lessons."}</p>
              <div className={styles.courseStats}>
                <span>{course.lesson_count} lessons</span>
                <span>{course.completed_count} completed</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className={styles.lessonPanel}>
        {lessonsLoading && <div className={styles.loading}>Loading lessons...</div>}
        {!lessonsLoading && selectedCourse && (
          <>
            <div className={styles.lessonHeader}>
              <div>
                <p className={styles.lessonBadge}>{selectedCourse.topic.category}</p>
                <h2>{selectedCourse.topic.name}</h2>
                <p className={styles.lessonDesc}>{selectedCourse.topic.description}</p>
              </div>
              <Link href="/learn" className={styles.startBtn}>
                Go to Dashboard
              </Link>
            </div>
            <ul className={styles.lessonList}>
              {selectedCourse.lessons.map((lesson) => (
                <li key={lesson.id}>
                  <Link href={`/learn/lessons/${lesson.id}`} className={styles.lessonItem}>
                    <div>
                      <p className={styles.lessonTitle}>{lesson.title}</p>
                      <p className={styles.lessonSub}>
                        {lesson.duration_minutes} min • {lesson.difficulty}
                      </p>
                    </div>
                    <span className={styles.lessonStatus}>{lesson.status.replaceAll("_", " ")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        {!lessonsLoading && !selectedCourse && (
          <div className={styles.emptyCard}>
            <p>Select a course to view its lessons</p>
          </div>
        )}
      </div>
    </div>
  );
}
