/**
 * useFocusPause Hook
 * Centralized focus pause state management using backend API
 * Replaces localStorage-based pause state
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { API_BASE_URL, safeFetch } from "@/lib/api";

interface PauseState {
  mode: string;
  timeRemaining: number;
  pausedAt: string;
}

interface UseFocusPauseResult {
  pauseState: PauseState | null;
  isPaused: boolean;
  isLoading: boolean;
  savePause: (mode: string, timeRemaining: number) => Promise<void>;
  clearPause: () => Promise<void>;
  refreshPause: () => Promise<void>;
}

export function useFocusPause(): UseFocusPauseResult {
  const [pauseState, setPauseState] = useState<PauseState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedRef = useRef(false);

  // Fetch pause state from API
  const refreshPause = useCallback(async () => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/api/focus/pause`);
      if (response.ok) {
        const data = await response.json() as {
          pause?: { mode: string; time_remaining_seconds: number; paused_at: string };
        };
        if (data.pause) {
          setPauseState({
            mode: data.pause.mode,
            timeRemaining: data.pause.time_remaining_seconds,
            pausedAt: data.pause.paused_at,
          });
        } else {
          setPauseState(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch pause state:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save pause state to API
  const savePause = useCallback(async (mode: string, timeRemaining: number) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/api/focus/pause`, {
        method: "POST",
      });

      if (response.ok) {
        setPauseState({
          mode,
          timeRemaining,
          pausedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Failed to save pause state:", error);
    }
  }, []);

  // Clear pause state via API
  const clearPause = useCallback(async () => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/api/focus/pause`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPauseState(null);
      }
    } catch (error) {
      console.error("Failed to clear pause state:", error);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      refreshPause();
    }
  }, [refreshPause]);

  return {
    pauseState,
    isPaused: pauseState !== null,
    isLoading,
    savePause,
    clearPause,
    refreshPause,
  };
}
