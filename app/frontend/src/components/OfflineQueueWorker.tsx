"use client";

import { useEffect } from "react";
import { startOfflineQueueWorker, replayQueue } from "@/lib/api/offlineQueue";

export function OfflineQueueWorker() {
  useEffect(() => {
    startOfflineQueueWorker();
    // Attempt initial drain on mount
    replayQueue().catch((err) => console.error("[offline-queue] initial drain failed", err));
  }, []);

  return null;
}
