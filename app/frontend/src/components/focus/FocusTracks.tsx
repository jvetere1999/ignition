"use client";

/**
 * Focus Tracks Component
 * Shows tracks from the "Focus" reference library
 * Allows playing focus music during sessions
 */

import { useState, useEffect, useCallback } from "react";
import { usePlayerStore } from "@/lib/player";
import { listFocusLibraries } from "@/lib/api/focus-libraries";
import styles from "./FocusTracks.module.css";

// Use focus libraries from backend API
const FOCUS_LIBRARY_NAME = "Focus";

interface ReferenceTrack {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  durationMs?: number;
  audioUrl: string;
  storageId: string;
}

interface Library {
  id: string;
  name: string;
  tracks: ReferenceTrack[];
  createdAt: string;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function FocusTracks() {
  const [focusLibrary, setFocusLibrary] = useState<Library | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const playerStore = usePlayerStore();

  // Load focus library from backend API
  useEffect(() => {
    async function loadFocusLibrary() {
      setIsLoading(true);
      try {
        const response = await listFocusLibraries(1, 100);
        // Find the "Focus" library from backend
        // For now, we'll get the first library as default
        // Once backend track storage is ready, this will work properly
        // TODO: Implement track storage in focus libraries
        setFocusLibrary(null); // Placeholder until backend track support
      } catch (error) {
        console.error("Failed to load focus libraries:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadFocusLibrary();
  }, []);

  // Play a track
  const handlePlayTrack = useCallback(
    (track: ReferenceTrack, index: number) => {
      if (!focusLibrary || !track.audioUrl) return;

      const queueTracks = focusLibrary.tracks
        .filter((t) => t.audioUrl)
        .map((t) => ({
          id: t.id,
          title: t.name,
          artist: "Focus Library",
          source: "Focus",
          audioUrl: t.audioUrl,
          duration: t.durationMs ? t.durationMs / 1000 : undefined,
        }));

      if (queueTracks.length > 0) {
        playerStore.setQueue(queueTracks, index);
      }
    },
    [focusLibrary, playerStore]
  );

  // DEPRECATED: localStorage-based library creation (2026-01-10)
  // This should use backend API: POST /api/focus/libraries
  // Create focus library
  const handleCreateLibrary = useCallback(() => {
    try {
      const stored = localStorage.getItem(LIBRARIES_KEY);
      const libraries: Library[] = stored ? JSON.parse(stored) : [];

      const newLibrary: Library = {
        id: `focus-${Date.now()}`,
        name: FOCUS_LIBRARY_NAME,
        tracks: [],
        createdAt: new Date().toISOString(),
      };

      libraries.push(newLibrary);
      localStorage.setItem(LIBRARIES_KEY, JSON.stringify(libraries));
      setFocusLibrary(newLibrary);
    } catch (error) {
      console.error("Failed to create focus library:", error);
    }
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading focus tracks...</div>
      </div>
    );
  }

  if (!focusLibrary) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h3 className={styles.emptyTitle}>No Focus Library</h3>
          <p className={styles.emptyText}>
            Create a &quot;Focus&quot; library in Reference to add focus music.
          </p>
          <button className={styles.createButton} onClick={handleCreateLibrary}>
            Create Focus Library
          </button>
        </div>
      </div>
    );
  }

  if (focusLibrary.tracks.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Focus Music</h3>
          <span className={styles.count}>0 tracks</span>
        </div>
        <div className={styles.empty}>
          <p className={styles.emptyText}>
            Add tracks to your Focus library in the Reference section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Focus Music</h3>
        <span className={styles.count}>{focusLibrary.tracks.length} tracks</span>
      </div>

      <div className={styles.trackList}>
        {focusLibrary.tracks.map((track, index) => (
          <button
            key={track.id}
            className={styles.trackItem}
            onClick={() => handlePlayTrack(track, index)}
            disabled={!track.audioUrl}
          >
            <div className={styles.trackInfo}>
              <span className={styles.trackName}>{track.name}</span>
              {track.durationMs && (
                <span className={styles.trackDuration}>
                  {formatDuration(track.durationMs)}
                </span>
              )}
            </div>
            <div className={styles.playIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

