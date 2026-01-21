/**
 * Admin Documentation Page
 * Technical documentation accessible only to admins
 * 
 * Auth handled client-side via backend API session validation
 */

import type { Metadata } from "next";
import Link from "next/link";
import { readFile } from "fs/promises";
import { join } from "path";
import styles from "./page.module.css";
import { AdminGuard } from "@/components/AdminGuard";

export const metadata: Metadata = {
  title: "Technical Documentation - Admin",
  description: "Technical documentation for Ignition administrators.",
  robots: { index: false, follow: false },
};

export default async function AdminDocsPage() {
  // Auth and admin verification handled client-side by AdminGuard.

  // Read the database schema markdown
  // NOTE: In the admin app, this path needs to point to the main repo docs
  const schemaContent = await loadSchemaContent();

  return (
    <AdminGuard>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Technical Documentation</h1>
          <p className={styles.subtitle}>
            Database schema, API routes, and system specifications.
          </p>
          <Link href="/" className={styles.backLink}>
            Back to Admin Console
          </Link>
        </header>

        <div className={styles.content}>
          <article className={styles.article}>
            <pre className={styles.markdown}>{schemaContent}</pre>
          </article>
        </div>
      </div>
    </AdminGuard>
  );
}

async function loadSchemaContent() {
  const repoRoot = join(process.cwd(), "..", "..");
  const candidates = [
    join(repoRoot, "docs", "project", "DATABASE_SCHEMA.md"),
    join(repoRoot, "docs", "technical", "database", "DATABASE_SCHEMA.md"),
    join(process.cwd(), "docs", "project", "DATABASE_SCHEMA.md"),
    join(process.cwd(), "docs", "technical", "database", "DATABASE_SCHEMA.md"),
  ];

  for (const schemaPath of candidates) {
    try {
      return await readFile(schemaPath, "utf-8");
    } catch {
      // Keep trying fallbacks.
    }
  }

  return "# Documentation not found\n\nThe database schema file could not be loaded.";
}
