"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import styles from "./page.module.css";

export default function PendingApprovalPage() {
  const { user, isAuthenticated, isLoading, signIn, refresh } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      signIn();
    }
  }, [isLoading, isAuthenticated, signIn]);

  useEffect(() => {
    if (!isLoading && user?.approved) {
      router.replace("/today");
    }
  }, [isLoading, user, router]);

  const handleRefresh = async () => {
    setChecking(true);
    await refresh();
    setChecking(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Pending Approval</h1>
        <p className={styles.subtitle}>
          Your account is waiting for approval. We will notify you as soon as it is ready.
        </p>
        <div className={styles.actions}>
          <button className={styles.refresh} onClick={handleRefresh} disabled={checking}>
            {checking ? "Checking..." : "Check Status"}
          </button>
        </div>
      </div>
    </div>
  );
}
