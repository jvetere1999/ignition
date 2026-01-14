/**
 * Courses Page
 * Browse available courses
 */

import type { Metadata } from "next";
import styles from "./page.module.css";
import { CoursesClient } from "./CoursesClient";

export const metadata: Metadata = {
  title: "Courses",
  description: "Browse Serum and Vital synthesis courses.",
};

export default function CoursesPage() {
  return (
    <div className={styles.page}>
      <CoursesClient />
    </div>
  );
}
