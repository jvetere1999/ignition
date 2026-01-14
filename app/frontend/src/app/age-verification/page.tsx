"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, verifyAge } from "@/lib/auth";
import styles from "./page.module.css";

export default function AgeVerificationPage() {
  const { user, isAuthenticated, isLoading, signIn, refresh } = useAuth();
  const router = useRouter();
  const [selection, setSelection] = useState<"yes" | "no" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      signIn();
    }
  }, [isLoading, isAuthenticated, signIn]);

  useEffect(() => {
    if (!isLoading && user?.ageVerified) {
      router.replace("/today");
    }
  }, [isLoading, user, router]);

  const handleSubmit = useCallback(async () => {
    if (!selection || submitting) return;
    setSubmitting(true);
    setError("");

    const ok = await verifyAge(selection === "yes");
    if (ok) {
      await refresh();
      router.replace("/today");
    } else {
      setError("Unable to verify age. Please try again.");
    }
    setSubmitting(false);
  }, [selection, submitting, refresh, router]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Verify Your Age</h1>
        <p className={styles.subtitle}>
          We need to confirm you are 13 or older to continue.
        </p>

        <div className={styles.options}>
          <button
            type="button"
            className={`${styles.option} ${selection === "yes" ? styles.selected : ""}`}
            onClick={() => setSelection("yes")}
          >
            I am 13 or older
          </button>
          <button
            type="button"
            className={`${styles.option} ${selection === "no" ? styles.selected : ""}`}
            onClick={() => setSelection("no")}
          >
            I am under 13
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          type="button"
          className={styles.submit}
          onClick={handleSubmit}
          disabled={!selection || submitting}
        >
          {submitting ? "Submitting..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
