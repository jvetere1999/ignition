import { useCallback, useEffect, useRef } from "react";

const DEFAULT_IDLE_MS = 15 * 60 * 1000;
const DEFAULT_HIDDEN_MS = 5 * 60 * 1000;

type VaultLockOptions = {
  isUnlocked: boolean;
  onLock: () => void;
  idleMs?: number;
  hiddenMs?: number;
};

export function useVaultLockPolicy({
  isUnlocked,
  onLock,
  idleMs = DEFAULT_IDLE_MS,
  hiddenMs = DEFAULT_HIDDEN_MS,
}: VaultLockOptions) {
  const lockRef = useRef(onLock);
  const idleTimeoutRef = useRef<number | null>(null);
  const hiddenTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    lockRef.current = onLock;
  }, [onLock]);

  const clearIdleTimer = useCallback(() => {
    if (idleTimeoutRef.current !== null) {
      window.clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
  }, []);

  const clearHiddenTimer = useCallback(() => {
    if (hiddenTimeoutRef.current !== null) {
      window.clearTimeout(hiddenTimeoutRef.current);
      hiddenTimeoutRef.current = null;
    }
  }, []);

  const scheduleIdleLock = useCallback(() => {
    clearIdleTimer();
    idleTimeoutRef.current = window.setTimeout(() => {
      lockRef.current?.();
    }, idleMs);
  }, [clearIdleTimer, idleMs]);

  const scheduleHiddenLock = useCallback(() => {
    if (hiddenTimeoutRef.current !== null) return;
    hiddenTimeoutRef.current = window.setTimeout(() => {
      lockRef.current?.();
    }, hiddenMs);
  }, [hiddenMs]);

  useEffect(() => {
    if (!isUnlocked) {
      clearIdleTimer();
      clearHiddenTimer();
      return;
    }

    const handleActivity = () => {
      scheduleIdleLock();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        scheduleHiddenLock();
      } else {
        clearHiddenTimer();
      }
    };

    const handleUnload = () => {
      lockRef.current?.();
    };

    scheduleIdleLock();
    handleVisibility();

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    activityEvents.forEach((event) => window.addEventListener(event, handleActivity));
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handleUnload);

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, handleActivity));
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handleUnload);
      clearIdleTimer();
      clearHiddenTimer();
    };
  }, [
    isUnlocked,
    clearHiddenTimer,
    clearIdleTimer,
    scheduleHiddenLock,
    scheduleIdleLock,
  ]);
}
