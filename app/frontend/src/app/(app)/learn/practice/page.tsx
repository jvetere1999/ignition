/**
 * Practice Page
 * Practice exercises and drills
 *
 * Auth is handled by middleware
 */

import type { Metadata } from "next";
import { PracticeClient } from "./PracticeClient";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Practice",
  description: "Practice synthesis skills with guided drills.",
};

export default function PracticePage() {
  return (
    <div className={styles.page}>
      <PracticeClient />
    </div>
  );
}
