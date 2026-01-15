/**
 * IndexProgress Component
 *
 * Shows progress indicator during search index rebuild.
 * Displays items indexed, total items, percentage, and estimated time remaining.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useVaultLock } from '@/lib/auth/VaultLockContext';
import { getSearchManager, type IndexRebuildEvent } from '@/lib/search/SearchIndexManager';
import styles from './IndexProgress.module.css';

interface IndexProgressProps {
  showAlways?: boolean;
}

export const IndexProgress: React.FC<IndexProgressProps> = ({ showAlways = false }) => {
  const { isSearchIndexing, searchIndexReady } = useVaultLock();
  const [itemsIndexed, setItemsIndexed] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string | null>(null);

  // Listen to progress events
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupListener = async () => {
      const searchManager = await getSearchManager();

      const handleProgress = (event: IndexRebuildEvent) => {
        const indexed = event.itemsIndexed || 0;
        const total = event.itemsTotal || 0;
        setItemsIndexed(indexed);
        setTotalItems(total);

        if (!startTime && indexed > 0) {
          setStartTime(Date.now());
        }

        // Calculate estimated time remaining
        if (startTime && indexed > 0 && indexed < total) {
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = indexed / elapsed;
          const remaining = (total - indexed) / rate;
          if (remaining > 0) {
            setEstimatedTimeRemaining(formatSeconds(remaining));
          }
        }
      };

      const handleComplete = () => {
        setItemsIndexed(0);
        setTotalItems(0);
        setStartTime(null);
        setEstimatedTimeRemaining(null);
      };

      searchManager.on('rebuild-progress', handleProgress);
      searchManager.on('rebuild-completed', handleComplete);
      searchManager.on('rebuild-error', handleComplete);

      unsubscribe = () => {
        searchManager.off('rebuild-progress', handleProgress);
        searchManager.off('rebuild-completed', handleComplete);
        searchManager.off('rebuild-error', handleComplete);
      };
    };

    setupListener();
    return () => unsubscribe?.();
  }, [startTime]);

  if (!isSearchIndexing && !showAlways) {
    return null;
  }

  if (searchIndexReady && !isSearchIndexing) {
    return (
      <div className={styles.container} data-testid="index-progress">
        <div className={styles.successMessage} data-testid="index-success">
          ✓ Search index ready
        </div>
      </div>
    );
  }

  const percentage = totalItems > 0 ? (itemsIndexed / totalItems) * 100 : 0;

  return (
    <div className={styles.container} data-testid="index-progress">
      <div className={styles.header}>
        <h3 className={styles.title} data-testid="index-status">Building search index...</h3>
        {estimatedTimeRemaining && (
          <span className={styles.eta}>ETA: {estimatedTimeRemaining}</span>
        )}
      </div>

      <div className={styles.progressBar} data-testid="progress-bar">
        <div
          className={styles.progressFill}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={Math.round(percentage)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className={styles.stats}>
        <span className={styles.count} data-testid="items-counter">
          {itemsIndexed} / {totalItems} items
        </span>
        <span className={styles.percentage} data-testid="progress-percentage">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};

function formatSeconds(seconds: number): string {
  if (seconds < 1) return '<1s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export default IndexProgress;
