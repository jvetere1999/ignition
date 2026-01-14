"use client";

/**
 * Offline status banner with queued mutation count.
 * Shows when offline or when queued mutations are pending sync.
 */

import { useEffect, useState, useCallback } from "react";
import styles from "./OfflineStatusBanner.module.css";
import { getQueueCount, OFFLINE_QUEUE_EVENT } from "@/lib/api/offlineQueue";

export function OfflineStatusBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);

  const refreshQueueCount = useCallback(async () => {
    try {
      const count = await getQueueCount();
      setQueuedCount(count);
    } catch (error) {
      console.error("[offline-banner] Failed to read queue count", error);
    }
  }, []);

  useEffect(() => {
    setIsOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    refreshQueueCount();

    const handleOnline = () => {
      setIsOnline(true);
      refreshQueueCount();
    };
    const handleOffline = () => {
      setIsOnline(false);
      refreshQueueCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener(OFFLINE_QUEUE_EVENT, refreshQueueCount);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener(OFFLINE_QUEUE_EVENT, refreshQueueCount);
    };
  }, [refreshQueueCount]);

  if (isOnline && queuedCount === 0) return null;

  const statusLabel = isOnline ? "Syncing" : "Offline";
  const message = isOnline
    ? `Syncing ${queuedCount} queued update${queuedCount === 1 ? "" : "s"}`
    : "You're offline. Changes will sync when you're back online.";

  return (
    <div className={styles.banner} data-state={isOnline ? "syncing" : "offline"} role="status" aria-live="polite">
      <span className={styles.status}>{statusLabel}</span>
      <span className={styles.message}>{message}</span>
      {!isOnline && queuedCount > 0 && (
        <span className={styles.queueCount}>
          {queuedCount} queued
        </span>
      )}
    </div>
  );
}
