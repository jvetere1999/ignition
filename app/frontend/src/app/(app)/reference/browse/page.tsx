/**
 * Browse Reference Tracks Page
 * View reference tracks from other users by searching their email
 */

import type { Metadata } from "next";
import { BrowseReferenceTracks } from "@/components/references/BrowseReferenceTracks";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Browse Reference Tracks",
  description: "View reference tracks from other users.",
};

export default function BrowseReferencePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Browse Reference Tracks</h1>
        <p className={styles.subtitle}>
          Search for a user by email to view their reference tracks.
        </p>
      </header>

      <BrowseReferenceTracks />
    </div>
  );
}
