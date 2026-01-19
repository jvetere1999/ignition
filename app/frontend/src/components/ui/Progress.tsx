/**
 * Progress component - Linear progress indicator
 */

import React from "react";
import styles from "./Progress.module.css";

export interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
  label?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value = 0,
  max = 100,
  className = "",
  label,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={`${styles.progressContainer} ${className}`}>
      {label && <div className={styles.label}>{label}</div>}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {label && <div className={styles.percentage}>{Math.round(percentage)}%</div>}
    </div>
  );
};
