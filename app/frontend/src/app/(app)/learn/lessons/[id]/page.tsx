/**
 * Lesson Page
 * Renders lesson content + quiz
 */

import type { Metadata } from "next";
import { LessonClient } from "./LessonClient";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Lesson",
  description: "Lesson content and quiz.",
};

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className={styles.page}>
      <LessonClient lessonId={id} />
    </div>
  );
}
